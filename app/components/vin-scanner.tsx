'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, X, Check, Loader2, AlertTriangle, Smartphone, Monitor, Scan } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { decodeVIN, NHTSAVehicleData } from '@/lib/nhtsa'
import { useToast } from '@/hooks/use-toast'

// Importación dinámica de Tesseract.js
// Esto asegura que Tesseract.js solo se cargue en el cliente
let createWorker: typeof import('tesseract.js')['createWorker'];
let PSM: typeof import('tesseract.js')['PSM'];

// Función para validar si una cadena es un VIN (básica)
const isValidVIN = (text: string): boolean => {
  if (text.length !== 17) return false;
  if (/[IOQioq]/.test(text)) return false;
  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(text)) return false;
  return true;
};

export function VinScanner({ onVinDetected, initialVin = '' }: VinScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualVin, setManualVin] = useState(initialVin)
  const [isDecoding, setIsDecoding] = useState(false)
  const [vehicleData, setVehicleData] = useState<NHTSAVehicleData | null>(null)
  const [cameraError, setCameraError] = useState<CameraError | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown')
  const [isMobile, setIsMobile] = useState(false)
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)

  // Nuevos estados para Tesseract.js
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [detectedVin, setDetectedVin] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string>('Idle');
  const [isTesseractReady, setIsTesseractReady] = useState(false); // Nuevo estado para Tesseract

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ocrWorkerRef = useRef<any | null>(null); // Usar 'any' temporalmente para el worker
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast()

  const addDebugInfo = useCallback((info: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => [...prev.slice(-4), `[${timestamp}] ${info}`])
    console.log(`[VIN Scanner] ${info}`)
  }, [])

  // Inicializar Tesseract Worker
  const initializeOcrWorker = useCallback(async () => {
    if (ocrWorkerRef.current || !isTesseractReady) { // Solo inicializar si Tesseract está cargado
      addDebugInfo('OCR Worker already initialized or Tesseract not ready.');
      return;
    }
    setIsOcrLoading(true);
    setOcrStatus('Loading OCR engine...');
    addDebugInfo('Initializing Tesseract OCR worker...');
    try {
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing') {
            setOcrProgress(Math.round(m.progress * 100));
            setOcrStatus(`Scanning... (${Math.round(m.progress * 100)}%)`);
          } else {
            setOcrStatus(m.status);
          }
          addDebugInfo(`OCR Worker: ${m.status} - ${m.progress ? (m.progress * 100).toFixed(0) + '%' : ''}`);
        },
      });
      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      await worker.reco.setParameters({
        tessedit_pageseg_mode: PSM.PSM_SINGLE_BLOCK
      });
      ocrWorkerRef.current = worker;
      addDebugInfo('Tesseract OCR worker initialized successfully.');
      setOcrStatus('OCR Ready');
    } catch (error) {
      addDebugInfo(`Error initializing OCR worker: ${error}`);
      console.error('Error initializing Tesseract OCR worker:', error);
      setCameraError({ name: 'OCRInitError', message: 'Failed to load OCR engine.' });
      setOcrStatus('OCR Error');
    } finally {
      setIsOcrLoading(false);
    }
  }, [addDebugInfo, isTesseractReady]); // Dependencia de isTesseractReady

  // Función para escanear un frame
  const scanFrameForVIN = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !ocrWorkerRef.current || isDecoding) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      addDebugInfo('Canvas context not available.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Ajusta estos valores basándote en lo que observaste en el navegador
    // Ejemplo: si el marco es 75% del ancho del video y 15% del alto del video
    const roiWidth = canvas.width * 0.75; // Si w-3/4 es 75%
    const roiHeight = canvas.height * 0.15; // Ajusta este porcentaje según el alto real de tu marco

    const roiX = (canvas.width - roiWidth) / 2;
    const roiY = (canvas.height - roiHeight) / 2;

    const imageData = context.getImageData(roiX, roiY, roiWidth, roiHeight);

    setOcrStatus('Scanning frame...');
    try {
      const { data: { text } } = await ocrWorkerRef.current.recognize(imageData);
      addDebugInfo(`OCR Raw Text: "${text}"`);

      const cleanedText = text.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
      addDebugInfo(`OCR Cleaned Text: "${cleanedText}"`);

      if (isValidVIN(cleanedText)) {
        setDetectedVin(cleanedText);
        setManualVin(cleanedText);
        stopCamera();
        addDebugInfo(`VIN Detected: ${cleanedText}`);
        toast({
          title: "VIN Detected!",
          description: `Found VIN: ${cleanedText}. Please verify and submit.`,
          variant: "success"
        });
      } else {
        setDetectedVin(null);
        setOcrStatus('No valid VIN found in frame.');
      }
    } catch (error) {
      addDebugInfo(`OCR recognition error: ${error}`);
      console.error('OCR recognition error:', error);
      setOcrStatus('OCR Error during scan.');
    }
  }, [addDebugInfo, isDecoding, stopCamera, toast]);

  // ... (resto del código de VinScanner, sin cambios hasta aquí) ...
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

  // Check camera permissions
  const checkCameraPermissions = useCallback(async () => {
    setIsCheckingPermissions(true)
    addDebugInfo('=== CHECKING CAMERA PERMISSIONS ===')
    
    try {
      addDebugInfo('Checking MediaDevices API availability...')
      if (!navigator.mediaDevices) {
        throw new Error('MediaDevices API not supported in this browser')
      }
      addDebugInfo('✓ MediaDevices API available')
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser')
      }
      addDebugInfo('✓ getUserMedia available')

      addDebugInfo('Checking Permissions API...')
      if ('permissions' in navigator) {
        try {
          addDebugInfo('Querying camera permission...')
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
          setPermissionStatus(permission.state)
          addDebugInfo(`✓ Permission API result: ${permission.state}`)
          
          permission.onchange = () => {
            setPermissionStatus(permission.state)
            addDebugInfo(`Permission changed to: ${permission.state}`)
          }
        } catch (permError) {
          addDebugInfo(`✗ Permissions API error: ${permError}`)
          setPermissionStatus('unknown')
        }
      } else {
        addDebugInfo('✗ Permissions API not available')
        setPermissionStatus('unknown')
      }

      addDebugInfo('Testing camera access with basic constraints...')
      try {
        addDebugInfo('Calling getUserMedia for permission test...')
        const testStream = await navigator.mediaDevices.getUserMedia({ video: true })
        
        addDebugInfo(`✓ Camera access test successful`)
        testStream.getTracks().forEach((track, index) => {
          addDebugInfo(`Test track ${index}: ${track.kind}, enabled: ${track.enabled}`)
          track.stop()
          addDebugInfo(`Test track ${index} stopped`)
        })
        
        setPermissionStatus('granted')
        addDebugInfo('=== PERMISSION CHECK SUCCESSFUL ===')
        
      } catch (testError) {
        addDebugInfo(`✗ Camera access test failed: ${testError}`)
        if (testError instanceof Error) {
          addDebugInfo(`Test error name: ${testError.name}`)
          addDebugInfo(`Test error message: ${testError.message}`)
          
          if (testError.name === 'NotAllowedError') {
            setPermissionStatus('denied')
            addDebugInfo('Permission status set to: denied')
          } else if (testError.name === 'NotFoundError') {
            setPermissionStatus('denied')
            throw new Error('No camera found on this device')
          } else if (testError.name === 'NotReadableError') {
            setPermissionStatus('denied')
            throw new Error('Camera is already in use by another application')
          } else {
            setPermissionStatus('unknown')
            addDebugInfo(`Unexpected error during permission test: ${testError.name}`)
          }
        }
      }
    } catch (error) {
      addDebugInfo(`=== PERMISSION CHECK FAILED ===`)
      addDebugInfo(`Permission check error: ${error}`)
      console.error('Error accessing camera:', error)
      setCameraError({
        name: 'PermissionError',
        message: error instanceof Error ? error.message : 'Unknown permission error'
      })
    } finally {
      setIsCheckingPermissions(false)
      addDebugInfo('Permission check completed')
    }
  }, [addDebugInfo])

  const enumerateCameras = useCallback(async () => {
    addDebugInfo('Enumerating media devices...')
    try {
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
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
      addDebugInfo('OCR scan interval stopped.');
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
    setDetectedVin(null);
    setOcrStatus('Idle');
    addDebugInfo('Camera stopped')
  }, [addDebugInfo])

  const startCamera = useCallback(async () => {
    addDebugInfo('=== STARTING CAMERA PROCESS ===')
    setCameraError(null)
    
    stopCamera();

    try {
      if (permissionStatus === 'denied') {
        throw new Error('Camera permission denied. Please enable camera access in your browser settings.')
      }

      addDebugInfo('Checking getUserMedia availability...')
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser')
      }
      addDebugInfo('✓ getUserMedia is available')

      let videoElement = videoRef.current
      let retryCount = 0
      const maxRetries = 10
      
      while (!videoElement && retryCount < maxRetries) {
        addDebugInfo(`Video element not ready, waiting... (attempt ${retryCount + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, 100))
        videoElement = videoRef.current
        retryCount++
      }
      
      if (!videoElement) {
        addDebugInfo('✗ Video element still not available after retries')
        throw new Error('Video element not available in DOM. Please try again.')
      }
      
      addDebugInfo('✓ Video element is available')
      addDebugInfo(`Video element properties: tagName=${videoElement.tagName}, readyState=${videoElement.readyState}, networkState=${videoElement.networkState}`)

      const constraints = getCameraConstraints();
      addDebugInfo(`Attempting to start camera with constraints: ${JSON.stringify(constraints, null, 2)}`);

      let stream: MediaStream | null = null;
      try {
        const getUserMediaPromise = navigator.mediaDevices.getUserMedia(constraints);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('getUserMedia timeout after 10 seconds')), 10000);
        });
        
        stream = await Promise.race([getUserMediaPromise, timeoutPromise]) as MediaStream;
        addDebugInfo(`✓ SUCCESS with selected constraints`);
        stream.getTracks().forEach((track, index) => {
          addDebugInfo(`Track ${index}: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}`);
          if (track.kind === 'video') {
            const settings = track.getSettings();
            addDebugInfo(`Video settings: ${JSON.stringify(settings)}`);
          }
        });
      } catch (constraintError) {
        addDebugInfo(`✗ FAILED with specified constraints: ${constraintError}`);
        if (constraintError instanceof Error) {
          addDebugInfo(`Error name: ${constraintError.name}`);
          addDebugInfo(`Error message: ${constraintError.message}`);
        }
        addDebugInfo('Attempting fallback to basic video: true constraints...');
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          addDebugInfo('✓ SUCCESS with fallback constraints: { video: true }');
        } catch (fallbackError) {
          addDebugInfo(`✗ FAILED with fallback constraints: ${fallbackError}`);
          throw fallbackError;
        }
      }

      if (!stream) {
        throw new Error('Failed to get camera stream with any constraint set');
      }

      addDebugInfo('Final video element check before stream assignment...')
      const finalVideoElement = videoRef.current
      if (!finalVideoElement) {
        addDebugInfo('✗ Video element disappeared during camera setup')
        stream.getTracks().forEach(track => track.stop())
        throw new Error('Video element became unavailable during setup')
      }

      addDebugInfo('Setting up video element...')
      addDebugInfo(`Final video element state: readyState=${finalVideoElement.readyState}, networkState=${finalVideoElement.networkState}`)
      
      try {
        finalVideoElement.srcObject = stream
        streamRef.current = stream
        addDebugInfo('✓ Stream assigned to video element successfully')
      } catch (streamError) {
        addDebugInfo(`✗ Error assigning stream to video: ${streamError}`)
        stream.getTracks().forEach(track => track.stop())
        throw new Error(`Failed to assign stream to video element: ${streamError}`)
      }
      
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          addDebugInfo('✗ Video loading timeout after 8 seconds')
          finalVideoElement.removeEventListener('loadedmetadata', onLoadedMetadata)
          finalVideoElement.removeEventListener('error', onError)
          finalVideoElement.removeEventListener('canplay', onCanPlay)
          reject(new Error('Video loading timeout'))
        }, 8000)
        
        const onLoadedMetadata = () => {
          addDebugInfo(`✓ Video metadata loaded: ${finalVideoElement.videoWidth}x${finalVideoElement.videoHeight}`)
        }
        
        const onCanPlay = () => {
          addDebugInfo('✓ Video can play')
          clearTimeout(timeoutId)
          finalVideoElement.removeEventListener('loadedmetadata', onLoadedMetadata)
          finalVideoElement.removeEventListener('error', onError)
          finalVideoElement.removeEventListener('canplay', onCanPlay)
          resolve()
        }
        
        const onError = (e: Event) => {
          addDebugInfo(`✗ Video error event: ${e}`)
          addDebugInfo(`Video error details: ${finalVideoElement.error?.message || 'Unknown error'}`)
          clearTimeout(timeoutId)
          finalVideoElement.removeEventListener('loadedmetadata', onLoadedMetadata)
          finalVideoElement.removeEventListener('error', onError)
          finalVideoElement.removeEventListener('canplay', onCanPlay)
          reject(new Error(`Video loading failed: ${finalVideoElement.error?.message || 'Unknown video error'}`))
        }
        
        finalVideoElement.addEventListener('loadedmetadata', onLoadedMetadata)
        finalVideoElement.addEventListener('error', onError)
        finalVideoElement.addEventListener('canplay', onCanPlay)
        
        addDebugInfo(`Current video readyState: ${finalVideoElement.readyState}`)
        
        if (finalVideoElement.readyState >= 3) {
          addDebugInfo('Video already can play, resolving immediately')
          clearTimeout(timeoutId)
          finalVideoElement.removeEventListener('loadedmetadata', onLoadedMetadata)
          finalVideoElement.removeEventListener('error', onError)
          finalVideoElement.removeEventListener('canplay', onCanPlay)
          resolve()
        } else {
          finalVideoElement.play().catch(playError => {
            addDebugInfo(`Error attempting to play video: ${playError}`);
          });
        }
      })
      
      setIsScanning(true)
      addDebugInfo('=== CAMERA STARTED SUCCESSFULLY ===')

      // Iniciar el escaneo de VIN con Tesseract.js
      if (ocrWorkerRef.current) {
        addDebugInfo('Starting OCR scan interval...');
        scanIntervalRef.current = setInterval(scanFrameForVIN, 500); 
      } else {
        addDebugInfo('OCR worker not ready, cannot start scan interval.');
        setOcrStatus('OCR not ready for scan.');
      }
      
      toast({
        title: "Camera Ready",
        description: isMobile ? "Position your device over the VIN" : "Position the VIN in the camera view",
      })
      
    } catch (error) {
      addDebugInfo(`=== CAMERA START FAILED ===`)
      addDebugInfo(`Error: ${error}`)
      console.error('Error accessing camera:', error)
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.pause();
        videoRef.current.load();
      }
      
      let errorMessage = 'Unable to access camera'
      let errorName = 'CameraError'
      
      if (error instanceof Error) {
        errorName = error.name
        addDebugInfo(`Error name: ${errorName}`)
        addDebugInfo(`Error message: ${error.message}`)
        
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Camera permission denied. Please allow camera access and try again.'
            setPermissionStatus('denied')
            break
          case 'NotFoundError':
            errorMessage = 'No camera found on this device.'
            break
          case 'NotReadableError':
            errorMessage = 'Camera is already in use by another application.'
            break
          case 'OverconstrainedError':
            errorMessage = 'Camera constraints not supported on this device.'
            break
          case 'SecurityError':
            errorMessage = 'Camera access blocked by security policy.'
            break
          case 'AbortError':
            errorMessage = 'Camera access was aborted.'
            break
          default:
            errorMessage = error.message || 'Unknown camera error'
        }
      }
      
      setCameraError({ name: errorName, message: errorMessage })
      toast({
        title: "Camera Error",
        description: errorMessage + " Please enter VIN manually.",
        variant: "destructive"
      })
    }
  }, [toast, permissionStatus, getCameraConstraints, addDebugInfo, isMobile, stopCamera, scanFrameForVIN]);

  const handleManualVinSubmit = async () => {
    if (!manualVin || manualVin.length !== 17) {
      toast({
        title: "Invalid VIN",
        description: "VIN must be exactly 17 characters long.",
        variant: "destructive"
      })
      return
    }

    setIsDecoding(true)
    addDebugInfo(`Decoding VIN: ${manualVin}`)
    
    try {
      const data = await decodeVIN(manualVin)
      setVehicleData(data)
      onVinDetected(manualVin, data || undefined)
      
      addDebugInfo(`VIN decoded successfully: ${data ? 'con datos' : 'sin datos'}`)
      toast({
        title: "VIN Processed",
        description: data ? "Vehicle information retrieved successfully." : "VIN processed, but no additional data available.",
      })
    } catch (error) {
      addDebugInfo(`VIN decode error: ${error}`)
      console.error('Error decoding VIN:', error)
      toast({
        title: "Error",
        description: "Failed to decode VIN. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDecoding(false)
    }
  }

  // Auto-check permissions on mount
  useEffect(() => {
    checkCameraPermissions();
  }, [checkCameraPermissions]);

  // Nuevo: Enumerar cámaras cuando se otorgan permisos o al montar
  useEffect(() => {
    if (permissionStatus === 'granted') {
      enumerateCameras();
    }
  }, [permissionStatus, enumerateCameras]);

  // Cargar Tesseract.js dinámicamente
  useEffect(() => {
    addDebugInfo('Attempting to dynamically import Tesseract.js...');
    import('tesseract.js')
      .then(module => {
        createWorker = module.createWorker;
        PSM = module.PSM;
        setIsTesseractReady(true);
        addDebugInfo('Tesseract.js imported successfully.');
      })
      .catch(error => {
        addDebugInfo(`Failed to import Tesseract.js: ${error}`);
        console.error('Failed to import Tesseract.js:', error);
        setCameraError({ name: 'TesseractLoadError', message: 'Failed to load OCR library.' });
      });

    // Limpiar el worker al desmontar el componente
    return () => {
      if (ocrWorkerRef.current) {
        addDebugInfo('Terminating OCR worker...');
        ocrWorkerRef.current.terminate();
        ocrWorkerRef.current = null;
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [addDebugInfo]);

  // Inicializar OCR worker cuando Tesseract esté listo
  useEffect(() => {
    if (isTesseractReady) {
      initializeOcrWorker();
    }
  }, [isTesseractReady, initializeOcrWorker]);


  // Ensure video element is available after mount
  useEffect(() => {
    addDebugInfo('Component mounted, checking video element...')
    if (videoRef.current) {
      addDebugInfo('✓ Video element available after mount')
      addDebugInfo(`Video element details: tagName=${videoRef.current.tagName}, id=${videoRef.current.id || 'none'}`)
    } else {
      addDebugInfo('✗ Video element not available after mount')
    }
  }, [addDebugInfo])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Camera className="w-5 h-5" />
          <span>VIN Scanner</span>
          {isMobile ? (
            <Smartphone className="w-4 h-4 text-blue-500" />
          ) : (
            <Monitor className="w-4 h-4 text-gray-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Status */}
        {permissionStatus !== 'unknown' && (
          <Alert className={
            permissionStatus === 'granted' ? 'border-green-200 bg-green-50' :
            permissionStatus === 'denied' ? 'border-red-200 bg-red-50' :
            'border-yellow-200 bg-yellow-50'
          }>
            <div className="flex items-center space-x-2">
              {permissionStatus === 'granted' ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : permissionStatus === 'denied' ? (
                <X className="w-4 h-4 text-red-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              )}
              <AlertDescription>
                Camera permission: {permissionStatus}
                {permissionStatus === 'denied' && (
                  <span className="block text-sm mt-1">
                    Please enable camera access in your browser settings
                  </span>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Camera Error Display */}
        {cameraError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertDescription>
              <strong>{cameraError.name}:</strong> {cameraError.message}
              {isMobile && (
                <div className="mt-2 text-sm">
                  <strong>Mobile Tips:</strong>
                  <ul className="list-disc list-inside mt-1">
                    <li>Make sure camera permission is enabled</li>
                    <li>Close other apps using the camera</li>
                    <li>Try refreshing the page</li>
                    <li>Use manual VIN entry as alternative</li>
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Camera View - Always render video element but conditionally show */}
        <div className={`relative ${isScanning ? 'block' : 'hidden'}`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-48 bg-black rounded-lg"
            style={{ objectFit: 'cover' }}
            onLoadStart={() => addDebugInfo('Video loadstart event')}
            onLoadedMetadata={() => addDebugInfo('Video loadedmetadata event')}
            onCanPlay={() => addDebugInfo('Video canplay event')}
            onError={(e) => addDebugInfo(`Video error event: ${e}`)}
          />
          {/* Canvas para capturar frames (oculto) */}
          <canvas ref={canvasRef} className="hidden" />

          {isScanning && (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Marco de posición del VIN - SIN FONDO NEGRO */}
                <div className="border-2 border-white border-dashed w-3/4 h-16 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-medium">Position VIN here</span>
                </div>
              </div>
              <div className="absolute top-2 right-2 space-x-2">
                <Button 
                  size={isMobile ? "default" : "sm"} 
                  variant="outline" 
                  onClick={stopCamera}
                  className={isMobile ? "px-4 py-2" : ""}
                >
                  <X className="w-4 h-4" />
                  {isMobile && <span className="ml-2">Close</span>}
                </Button>
              </div>
              {isMobile && (
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-black bg-opacity-60 text-white text-xs p-2 rounded text-center">
                    Hold steady and position VIN clearly in the frame
                  </div>
                </div>
              )}
              {/* Indicador de escaneo OCR */}
              <div className="absolute bottom-2 left-2 right-2">
                <Badge className="w-full justify-center text-center">
                  {isOcrLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      {ocrStatus} ({ocrProgress}%)
                    </>
                  ) : (
                    <>
                      <Scan className="w-3 h-3 mr-1" />
                      {ocrStatus}
                    </>
                  )}
                </Badge>
              </div>
            </>
          )}
        </div>

        {/* Camera Controls */}
        {!isScanning && (
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
              disabled={isCheckingPermissions || permissionStatus === 'denied' || isOcrLoading || !isTesseractReady} // Deshabilitar si Tesseract no está listo
              size={isMobile ? "lg" : "default"}
            >
              {isCheckingPermissions ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking Permissions...
                </>
              ) : isOcrLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading OCR... ({ocrProgress}%)
                </>
              ) : !isTesseractReady ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading OCR Library...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera Scan
                </>
              )}
            </Button>
            
            {permissionStatus === 'denied' && (
              <Button 
                onClick={checkCameraPermissions} 
                variant="outline" 
                className="w-full"
                size={isMobile ? "lg" : "default"}
              >
                Retry Camera Access
              </Button>
            )}
          </div>
        )}

        {/* Manual VIN Input */}
        <div className="space-y-2">
          <Label htmlFor="manual-vin">Or enter VIN manually:</Label>
          <div className="flex space-x-2">
            <Input
              id="manual-vin"
              value={manualVin}
              onChange={(e) => setManualVin(e.target.value.toUpperCase())}
              placeholder="Enter 17-character VIN"
              maxLength={17}
              className={`font-mono ${isMobile ? 'text-lg' : ''}`}
              style={isMobile ? { fontSize: '16px' } : {}}
            />
            <Button 
              onClick={handleManualVinSubmit}
              disabled={isDecoding || manualVin.length !== 17}
              size={isMobile ? "lg" : "default"}
            >
              {isDecoding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </Button>
          </div>
          {manualVin && (
            <div className="text-sm text-gray-500">
              {manualVin.length}/17 characters
              {manualVin.length === 17 && (
                <span className="ml-2 text-green-600">✓ Valid length</span>
              )}
            </div>
          )}
        </div>

        {/* Vehicle Data Display */}
        {vehicleData && (
          <div className="space-y-2">
            <Label>Vehicle Information:</Label>
            <div className="grid grid-cols-2 gap-2">
              {vehicleData.Make && (
                <Badge variant="secondary">Make: {vehicleData.Make}</Badge>
              )}
              {vehicleData.Model && (
                <Badge variant="secondary">Model: {vehicleData.Model}</Badge>
              )}
              {vehicleData.ModelYear && (
                <Badge variant="secondary">Year: {vehicleData.ModelYear}</Badge>
              )}
              {vehicleData.FuelTypePrimary && (
                <Badge variant="secondary">Fuel: {vehicleData.FuelTypePrimary}</Badge>
              )}
            </div>
          </div>
        )}

        {/* Debug Information (only in development) */}
        {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500">Debug Info</summary>
            <div className="mt-2 p-2 bg-gray-100 rounded text-gray-700 max-h-32 overflow-y-auto">
              {debugInfo.map((info, index) => (
                <div key={index}>{info}</div>
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  )
}