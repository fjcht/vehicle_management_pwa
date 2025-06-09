'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, X, Check, Loader2, AlertTriangle, Smartphone, Monitor, QrCode } from 'lucide-react'
import { Button } from '@/app/components/ui/button' // Corregido: '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'   // Corregido: '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'   // Corregido: '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'   // Corregido: '@/app/components/ui/badge'
import { useToast } from '@/app/components/ui/use-toast' // Corregido: '@/app/components/ui/use-toast'

// Importación de la librería ZXing
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

interface VinScannerProps {
  onVinDetected: (vin: string, vehicleData?: NHTSAVehicleData) => void
  initialVin?: string
}

interface CameraError {
  name: string
  message: string
  constraint?: string
}

// Definición de tipos para los datos de la NHTSA (si los usas)
interface NHTSAVehicleData {
  Make: string;
  Model: string;
  ModelYear: string;
  VehicleType: string;
  // ... otros campos relevantes
}

export function VinScanner({ onVinDetected, initialVin }: VinScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualVin, setManualVin] = useState(initialVin || '')
  const [isDecoding, setIsDecoding] = useState(false)
  const [cameraError, setCameraError] = useState<CameraError | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt')
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)

  // Nuevos estados para ZXing
  const [isZxingReady, setIsZxingReady] = useState(false);
  const [zxingStatus, setZxingStatus] = useState<string>('Idle');
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null); // Referencia al lector de códigos

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { toast } = useToast()

  const addDebugInfo = useCallback((info: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => [...prev.slice(-4), `[${timestamp}] ${info}`])
    console.log(`[VIN Scanner] ${info}`)
  }, [])

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isSmallScreen = window.innerWidth <= 768

      const mobile = isMobileDevice || (isTouchDevice && isSmallScreen)
      setIsMobile(mobile)

      addDebugInfo(`Device detection: ${mobile ? 'Mobile' : 'Desktop'}`)
      addDebugInfo(`User Agent: ${userAgent}`)
      addDebugInfo(`Touch support: ${isTouchDevice}`)
      addDebugInfo(`Screen width: ${window.innerWidth}px`)

      return mobile
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [addDebugInfo])

  // Inicializar ZXing Code Reader
  const initializeZxingReader = useCallback(() => {
    if (codeReaderRef.current) {
      addDebugInfo('ZXing Code Reader already initialized.');
      return;
    }
    addDebugInfo('Initializing ZXing Code Reader...');
    try {
      const hints = new Map();
      const formats = [
        BarcodeFormat.CODE_39, BarcodeFormat.CODE_93, BarcodeFormat.CODE_128,
        BarcodeFormat.EAN_8, BarcodeFormat.EAN_13, BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX, BarcodeFormat.AZTEC, BarcodeFormat.PDF_417,
        BarcodeFormat.ITF, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
      ];
      hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints);
      codeReaderRef.current = reader;
      setIsZxingReady(true);
      addDebugInfo('ZXing Code Reader initialized successfully.');
      setZxingStatus('Ready to scan');
    } catch (error) {
      addDebugInfo(`Error initializing ZXing reader: ${error}`);
      console.error('Error initializing ZXing reader:', error);
      setCameraError({ name: 'ZxingInitError', message: 'Failed to load barcode scanner engine.' });
      setZxingStatus('Error');
    }
  }, [addDebugInfo]);

  // Función para validar si una cadena es un VIN (básica)
  const isValidVIN = (text: string): boolean => {
    if (text.length !== 17) return false;
    if (/[IOQioq]/.test(text)) return false;
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(text)) return false;
    return true;
  };

  const checkCameraPermissions = useCallback(async () => {
    setIsCheckingPermissions(true)
    setCameraError(null); // Limpiar errores anteriores
    addDebugInfo('=== CHECKING CAMERA PERMISSIONS ===')

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API or getUserMedia not supported in this browser');
      }
      addDebugInfo('✔ MediaDevices API and getUserMedia available');

      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setPermissionStatus(permission.state);
          addDebugInfo(`✔ Permission API result: ${permission.state}`);
          permission.onchange = () => {
            setPermissionStatus(permission.state);
            addDebugInfo(`Permission changed to: ${permission.state}`);
          };
        } catch (permError) {
          addDebugInfo(`✖ Permissions API query error: ${permError}`);
          setPermissionStatus('unknown');
        }
      } else {
        addDebugInfo('✖ Permissions API not available');
        setPermissionStatus('unknown');
      }

      // Attempt to get a stream to confirm actual access
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
        addDebugInfo(`✔ Camera access test successful`);
        testStream.getTracks().forEach(track => track.stop());
        setPermissionStatus('granted');
      } catch (testError: any) {
        addDebugInfo(`✖ Camera access test failed: ${testError.name} - ${testError.message}`);
        if (testError.name === 'NotAllowedError') {
          setPermissionStatus('denied');
        } else if (testError.name === 'NotFoundError') {
          setPermissionStatus('denied'); // No camera found
          setCameraError({ name: 'NoCameraFound', message: 'No camera found on this device.' });
        } else if (testError.name === 'NotReadableError') {
          setPermissionStatus('denied'); // Camera in use
          setCameraError({ name: 'CameraInUse', message: 'Camera is already in use by another application.' });
        } else {
          setPermissionStatus('unknown');
          setCameraError({ name: testError.name, message: testError.message });
        }
      }
    } catch (error: any) {
      addDebugInfo(`=== PERMISSION CHECK FAILED ===`);
      addDebugInfo(`Permission check error: ${error.message}`);
      setCameraError({
        name: error.name || 'PermissionError',
        message: error.message || 'Unknown permission error'
      });
    } finally {
      setIsCheckingPermissions(false);
      addDebugInfo('Permission check completed');
    }
  }, [addDebugInfo]);

  const enumerateCameras = useCallback(async () => {
    addDebugInfo('Enumerating media devices...');
    try {
      // Request a temporary stream to ensure labels are available
      let tempStream: MediaStream | null = null;
      if (permissionStatus === 'granted') {
        try {
          tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
          addDebugInfo('Temporary stream obtained for device enumeration.');
        } catch (e) {
          addDebugInfo(`Could not get temporary stream for enumeration: ${e}`);
        }
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      addDebugInfo(`Found ${videoDevices.length} video devices.`);
      videoDevices.forEach((device, index) => addDebugInfo(`Device ${index}: id=${device.deviceId}, label=${device.label || 'No label (permission needed)'}, facingMode=${(device as any).facingMode || 'unknown'}`));

      if (!selectedCameraId && videoDevices.length > 0) {
        const rearCamera = videoDevices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('environment') ||
          (device as any).facingMode === 'environment'
        );
        if (rearCamera) {
          setSelectedCameraId(rearCamera.deviceId);
          addDebugInfo(`Defaulting to rear camera: ${rearCamera.label}`);
        } else {
          setSelectedCameraId(videoDevices[0].deviceId);
          addDebugInfo(`Defaulting to first camera: ${videoDevices[0].label}`);
        }
      }

      if (tempStream) {
        tempStream.getTracks().forEach(track => track.stop());
        addDebugInfo('Temporary stream stopped.');
      }

    } catch (error) {
      addDebugInfo(`Error enumerating devices: ${error}`);
      console.error('Error enumerating devices:', error);
    }
  }, [addDebugInfo, permissionStatus, selectedCameraId]);

  const getCameraConstraints = useCallback(() => {
    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: isMobile ? 1920 : 1280 },
        height: { ideal: isMobile ? 1080 : 720 },
        aspectRatio: { ideal: 16/9 },
        frameRate: { ideal: 30, max: 30 }
      }
    };

    if (selectedCameraId) {
      (constraints.video as MediaTrackConstraints).deviceId = { exact: selectedCameraId };
      addDebugInfo(`Using specific camera ID: ${selectedCameraId}`);
    } else {
      // Fallback if no specific ID, try environment facing mode
      (constraints.video as MediaTrackConstraints).facingMode = 'environment';
      addDebugInfo(`No specific camera ID, trying 'environment' facingMode.`);
    }

    if (isMobile) {
      (constraints.video as MediaTrackConstraints) = {
        ...(constraints.video as MediaTrackConstraints),
        focusMode: 'continuous',
        exposureMode: 'continuous',
        whiteBalanceMode: 'continuous',
        zoom: { ideal: 1.0 }
      };
    }
    addDebugInfo(`Using camera constraints: ${JSON.stringify(constraints)}`);
    return constraints;
  }, [isMobile, selectedCameraId, addDebugInfo]);


  const stopCamera = useCallback(() => {
    addDebugInfo('Stopping camera...')
    if (codeReaderRef.current) {
      codeReaderRef.current.reset(); // Detener el lector de ZXing
      addDebugInfo('ZXing reader reset.');
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        addDebugInfo(`Stopped track: ${track.kind}`)
      })
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.pause();
      videoRef.current.load();
    }
    setIsScanning(false)
    setZxingStatus('Idle');
    addDebugInfo('Camera stopped')
  }, [addDebugInfo])

  const startCamera = useCallback(async () => {
    addDebugInfo('=== STARTING CAMERA PROCESS ===')
    setCameraError(null)

    stopCamera(); // Asegurarse de que cualquier cámara anterior esté detenida

    try {
      if (permissionStatus === 'denied') {
        throw new Error('Camera permission denied. Please enable camera access in your browser settings.')
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser')
      }
      addDebugInfo('✔ getUserMedia is available')

      // No necesitamos el bucle de reintento aquí, el useEffect de ZXing esperará el videoRef
      const constraints = getCameraConstraints();
      addDebugInfo(`Attempting to get stream with constraints: ${JSON.stringify(constraints, null, 2)}`);

      let stream: MediaStream | null = null;
      try {
        const getUserMediaPromise = navigator.mediaDevices.getUserMedia(constraints);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('getUserMedia timeout after 10 seconds')), 10000);
        });

        stream = await Promise.race([getUserMediaPromise, timeoutPromise]) as MediaStream;
        addDebugInfo(`✔ SUCCESS with selected constraints`);
        stream.getTracks().forEach((track, index) => {
          addDebugInfo(`Track ${index}: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}`);
          if (track.kind === 'video') {
            const settings = track.getSettings();
            addDebugInfo(`Video settings: ${JSON.stringify(settings)}`);
          }
        });
      } catch (constraintError: any) {
        addDebugInfo(`✖ FAILED with specified constraints: ${constraintError.name} - ${constraintError.message}`);
        addDebugInfo('Attempting fallback to basic video: true constraints...');
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          addDebugInfo('✔ SUCCESS with fallback constraints: { video: true }');
        } catch (fallbackError: any) {
          addDebugInfo(`✖ FAILED with fallback constraints: ${fallbackError.name} - ${fallbackError.message}`);
          throw fallbackError;
        }
      }

      if (!stream) {
        throw new Error('Failed to get camera stream with any constraint set');
      }

      streamRef.current = stream; // Guardar el stream en la ref
      setIsScanning(true); // Indicar que la cámara está activa

      addDebugInfo('=== CAMERA STREAM OBTAINED SUCCESSFULLY ===');

    } catch (error: any) {
      addDebugInfo(`=== CAMERA START FAILED ===`);
      addDebugInfo(`Camera start error: ${error.name}: ${error.message}`);
      console.error('Error starting camera:', error);
      setCameraError({
        name: error.name || 'UnknownError',
        message: error.message || 'Unknown error occurred while starting camera'
      });
      stopCamera();
    }
  }, [toast, permissionStatus, getCameraConstraints, addDebugInfo, stopCamera]);

  const decodeVin = useCallback(async () => {
    if (!manualVin) {
      toast({
        title: "VIN Required",
        description: "Please enter a VIN to decode.",
        variant: "destructive",
      })
      return
    }

    setIsDecoding(true)
    addDebugInfo(`Decoding VIN: ${manualVin}`)
    setCameraError(null)

    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${manualVin}?format=json`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      if (data.Results && data.Results.length > 0 && data.Results[0].ErrorCode === '0') {
        const vehicleData: NHTSAVehicleData = data.Results.reduce((acc: any, item: any) => {
          if (item.Value && item.Value !== 'Not Applicable') {
            acc[item.Variable] = item.Value
          }
          return acc
        }, {})
        addDebugInfo(`VIN decoded successfully: con datos`)
        onVinDetected(manualVin, vehicleData)
        toast({
          title: "VIN Decoded Successfully",
          description: `Vehicle: ${vehicleData.Make || ''} ${vehicleData.Model || ''} (${vehicleData.ModelYear || ''})`,
          variant: "success",
        })
      } else {
        addDebugInfo(`VIN decode failed: ${data.Message || 'No data found'}`)
        onVinDetected(manualVin, undefined)
        toast({
          title: "VIN Decode Failed",
          description: data.Message || "Could not retrieve vehicle data for this VIN. Please check the VIN.",
          variant: "destructive",
        })
      }
    } catch (error) {
      addDebugInfo(`Error decoding VIN: ${error}`)
      console.error('Error decoding VIN:', error)
      setCameraError({
        name: 'DecodeError',
        message: error instanceof Error ? error.message : 'Failed to decode VIN'
      })
      toast({
        title: "Decoding Error",
        description: "Failed to connect to VIN decoding service. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsDecoding(false)
    }
  }, [manualVin, onVinDetected, addDebugInfo, toast])

  // Auto-check permissions on mount
  useEffect(() => {
    checkCameraPermissions();
  }, [checkCameraPermissions]);

  // Enumerar cámaras cuando se otorgan permisos o al montar
  useEffect(() => {
    if (permissionStatus === 'granted') {
      enumerateCameras();
    }
  }, [permissionStatus, enumerateCameras]);

  // Inicializar ZXing reader al montar
  useEffect(() => {
    initializeZxingReader();

    // Limpiar el lector al desmontar el componente
    return () => {
      if (codeReaderRef.current) {
        addDebugInfo('Resetting ZXing reader on unmount...');
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }
    };
  }, [addDebugInfo, initializeZxingReader]);

  // Efecto para manejar el inicio/parada del escaneo ZXing
  useEffect(() => {
    if (isScanning && videoRef.current && streamRef.current && codeReaderRef.current) {
      addDebugInfo('Attaching stream to video element and starting ZXing scan...');
      const videoElement = videoRef.current;
      videoElement.srcObject = streamRef.current;

      // Esperar a que el video esté listo para reproducirse
      const onCanPlay = () => {
        addDebugInfo('Video element ready for playback. Starting ZXing decode...');
        setZxingStatus('Scanning for codes...');
        codeReaderRef.current?.decodeFromVideoDevice(
          selectedCameraId || undefined,
          videoElement,
          (result, error) => {
            if (result) {
              addDebugInfo(`ZXing Detected: ${result.getText()} (Format: ${result.getBarcodeFormat().toString()})`);
              const detectedCode = result.getText();
              if (isValidVIN(detectedCode)) {
                setManualVin(detectedCode);
                stopCamera();
                addDebugInfo(`VIN Detected via Barcode/QR: ${detectedCode}`);
                toast({
                  title: "VIN Detected!",
                  description: `Found VIN: ${detectedCode}. Please verify and submit.`,
                  variant: "success"
                });
              } else {
                setZxingStatus(`Code found, but not a valid VIN: ${detectedCode.substring(0, 20)}...`);
              }
            }
            // Solo loguear errores si no es el error de "No MultiFormat Readers" que es normal si no hay código
            if (error && codeReaderRef.current && !error.message.includes('No MultiFormat Readers')) {
              // addDebugInfo(`ZXing Error: ${error}`); // Descomentar para depurar errores de escaneo
              setZxingStatus('Scanning...'); // Mantener el estado de escaneo si no es un error crítico
            }
          }
        );
      };

      const onError = (e: Event) => {
        addDebugInfo(`Video element error: ${e.type}`);
        setCameraError({ name: 'VideoError', message: 'Video element encountered an error.' });
        stopCamera();
      };

      videoElement.addEventListener('canplay', onCanPlay);
      videoElement.addEventListener('error', onError);

      // Si el video ya está listo, ejecutar onCanPlay inmediatamente
      if (videoElement.readyState >= 3) { // HAVE_FUTURE_DATA or higher
        onCanPlay();
      } else {
        videoElement.play().catch(playError => {
          addDebugInfo(`Error attempting to play video: ${playError}`);
          setCameraError({ name: 'VideoPlayError', message: `Failed to play video: ${playError.message}` });
          stopCamera();
        });
      }

      return () => {
        addDebugInfo('Cleaning up ZXing effect...');
        videoElement.removeEventListener('canplay', onCanPlay);
        videoElement.removeEventListener('error', onError);
        if (codeReaderRef.current) {
          codeReaderRef.current.reset();
          addDebugInfo('ZXing reader reset during cleanup.');
        }
      };
    } else if (!isScanning && codeReaderRef.current) {
      // Si isScanning es false, asegúrate de que el lector esté detenido
      addDebugInfo('isScanning is false, ensuring ZXing reader is reset.');
      codeReaderRef.current.reset();
    }
  }, [isScanning, selectedCameraId, addDebugInfo, isValidVIN, stopCamera, toast]);


  // Efecto para reiniciar la cámara si cambia la cámara seleccionada
  useEffect(() => {
    if (isScanning && selectedCameraId) {
      addDebugInfo(`Selected camera changed to ${selectedCameraId}, restarting camera...`);
      startCamera();
    }
  }, [selectedCameraId, isScanning, startCamera, addDebugInfo]);


  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-4">
      <h3 className="text-2xl font-bold">VIN Scanner</h3>

      {isScanning ? (
        <div className="relative w-full max-w-md aspect-video bg-gray-900 rounded-lg overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
          {/* Marco de posición del VIN - SIN FONDO NEGRO */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-2 border-white border-dashed w-3/4 h-16 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-medium">Position Barcode/QR here</span>
            </div>
          </div>

          {/* Botones de control de la cámara */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            <Button
              size={isMobile ? "default" : "sm"}
              variant="outline"
              onClick={stopCamera}
              className={isMobile ? "px-4 py-2" : ""}
            >
              <X className="w-4 h-4" />
              {isMobile && <span className="ml-2">Stop Scan</span>}
            </Button>
          </div>
          {/* Indicador de escaneo ZXing */}
          <div className="absolute bottom-2 left-2 right-2">
            <Badge className="w-full justify-center text-center">
              {zxingStatus === 'Scanning for codes...' ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  {zxingStatus}
                </>
              ) : (
                <>
                  <QrCode className="w-3 h-3 mr-1" />
                  {zxingStatus}
                </>
              )}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-4">
          <div className="space-y-2">
            {/* Selector de cámara */}
            {availableCameras.length > 1 && (
              <div className="space-y-1">
                <Label htmlFor="camera-select">Select Camera:</Label>
                <select
                  id="camera-select"
                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={selectedCameraId || ''}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                >
                  {availableCameras.map(camera => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${camera.deviceId.substring(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              onClick={startCamera}
              className="w-full"
              disabled={isCheckingPermissions || permissionStatus === 'denied' || !isZxingReady}
              size={isMobile ? "lg" : "default"}
            >
              {isCheckingPermissions ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking Permissions...
                </>
              ) : !isZxingReady ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading Scanner...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Start Scan
                </>
              )}
            </Button>
          </div>

          {cameraError && (
            <div className="flex items-center p-3 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <div>
                <span className="font-medium">{cameraError.name}:</span> {cameraError.message}
              </div>
            </div>
          )}

          <div className="relative">
            <Label htmlFor="manual-vin">Or Enter VIN Manually:</Label>
            <Input
              id="manual-vin"
              type="text"
              placeholder="Enter VIN (17 characters)"
              value={manualVin}
              onChange={(e) => setManualVin(e.target.value.toUpperCase())}
              maxLength={17}
              className={`font-mono ${isMobile ? 'text-lg' : ''}`}
              style={isMobile ? { fontSize: '16px' } : {}}
            />
            {manualVin && isValidVIN(manualVin) && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
            )}
          </div>

          <Button
            onClick={decodeVin}
            className="w-full"
            disabled={!isValidVIN(manualVin) || isDecoding}
            size={isMobile ? "lg" : "default"}
          >
            {isDecoding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Decoding VIN...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Decode VIN
              </>
            )}
          </Button>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <h4 className="font-semibold">Debug Info:</h4>
            <ul className="list-disc list-inside text-xs">
              {debugInfo.map((info, index) => (
                <li key={index}>{info}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}