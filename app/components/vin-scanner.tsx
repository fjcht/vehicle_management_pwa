'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, DecodeHintType, Result, BarcodeFormat } from '@zxing/library'
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert'
import { Loader2, CameraOff, Video, AlertTriangle, CheckCircle, XCircle, Play, StopCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Label } from '@/app/components/ui/label'
import { Button } from '@/app/components/ui/button'

interface VinScannerProps {
  onVinDetected: (vin: string) => void
  onError?: (error: string) => void
}

export function VinScanner({ onVinDetected, onError }: VinScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const isMountedRef = useRef(true)

  const [isCameraReady, setIsCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [isScanningActive, setIsScanningActive] = useState(false)

  // Configurar hints mejorados para VIN y códigos de barras
  const hints = React.useMemo(() => {
    const hintsMap = new Map<DecodeHintType, any>()

    // Formatos de códigos de barras más comunes para VIN
    hintsMap.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.PDF_417,
      BarcodeFormat.CODABAR,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E
    ])

    // Configuraciones para mejor detección
    hintsMap.set(DecodeHintType.TRY_HARDER, true)
    hintsMap.set(DecodeHintType.ASSUME_GS1, false) // Cambiar a false para VIN
    hintsMap.set(DecodeHintType.PURE_BARCODE, false)
    hintsMap.set(DecodeHintType.ALSO_INVERTED, true) // Detectar códigos invertidos

    return hintsMap
  }, [])

  // Validar VIN
  const isValidVIN = useCallback((text: string): boolean => {
    if (!text) return false

    // Limpiar el texto
    const cleanText = text.toUpperCase().replace(/[^0-9A-Z]/g, '')

    // VIN debe tener exactamente 17 caracteres
    if (cleanText.length !== 17) return false

    // VIN no puede contener I, O, Q
    if (/[IOQ]/.test(cleanText)) return false

    // Patrón básico de VIN (letras y números)
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleanText)) return false

    return true
  }, [])

  // Cleanup seguro
  const cleanup = useCallback(() => {
    if (readerRef.current) {
      try {
        readerRef.current.reset()
      } catch (error) {
        console.warn('[VIN Scanner] Error during reader reset:', error)
      }
    }

    if (videoRef.current?.srcObject) {
      try {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => {
          try {
            track.stop()
          } catch (error) {
            console.warn('[VIN Scanner] Error stopping track:', error)
          }
        })
        videoRef.current.srcObject = null
      } catch (error) {
        console.warn('[VIN Scanner] Error during video cleanup:', error)
      }
    }
  }, [])

  const stopScanning = useCallback(() => {
    console.log('[VIN Scanner] Stopping scanning...')
    cleanup()

    if (isMountedRef.current) {
      setIsCameraReady(false)
      setIsScanningActive(false)
      setCameraError(null)
    }
  }, [cleanup])

  const startScanning = useCallback(async (deviceId: string) => {
    if (!isMountedRef.current || !deviceId) return

    // Validaciones iniciales
    if (!videoRef.current) {
      const errorMsg = 'Video element not available'
      console.error('[VIN Scanner]', errorMsg)
      if (isMountedRef.current) {
        setCameraError(errorMsg)
        setIsScanningActive(false)
      }
      onError?.(errorMsg)
      return
    }

    if (!readerRef.current) {
      const errorMsg = 'Scanner not initialized'
      console.error('[VIN Scanner]', errorMsg)
      if (isMountedRef.current) {
        setCameraError(errorMsg)
        setIsScanningActive(false)
      }
      onError?.(errorMsg)
      return
    }

    // Detener scanning anterior si existe
    if (isScanningActive) {
      stopScanning()
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Resetear estados
    if (isMountedRef.current) {
      setIsCameraReady(false)
      setCameraError(null)
      setScanResult(null)
      setIsScanningActive(true)
    }

    try {
      console.log(`[VIN Scanner] Starting camera with device: ${deviceId}`)

      // Configurar constraints de video para mejor calidad
      const constraints = {
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'environment', // Cámara trasera preferida
          focusMode: 'continuous',
          exposureMode: 'continuous'
        }
      }

      await readerRef.current.decodeFromVideoDevice(
        deviceId, 
        videoRef.current, 
        (result: Result | null, error?: Error) => {
          if (!isMountedRef.current) return

          if (result?.getText()) {
            const rawText = result.getText()
            const cleanText = rawText.toUpperCase().replace(/[^0-9A-Z]/g, '')

            console.log('[VIN Scanner] Raw result:', rawText)
            console.log('[VIN Scanner] Clean result:', cleanText)

            // Validar si es un VIN válido
            if (isValidVIN(cleanText)) {
              console.log('[VIN Scanner] Valid VIN detected:', cleanText)

              if (isMountedRef.current) {
                setScanResult(cleanText)
              }

              if (onVinDetected && typeof onVinDetected === 'function') {
                onVinDetected(cleanText)
              }

              // Detener después de detección exitosa
              setTimeout(stopScanning, 500)
              return
            } else {
              // Si no es VIN válido, pero es un código, mostrarlo como información
              console.log('[VIN Scanner] Code detected (not VIN):', cleanText)
              if (isMountedRef.current && cleanText.length >= 8) {
                setScanResult(`Code: ${cleanText} (Not a valid VIN)`)
              }
            }
          }

          // Log solo errores relevantes (no "No code found")
          if (error && error.message && 
              !error.message.includes('No code found') && 
              !error.message.includes('No MultiFormat Readers')) {
            console.warn('[VIN Scanner] Scan error:', error.message)
          }
        }
      )

      console.log('[VIN Scanner] Camera started successfully')
      if (isMountedRef.current) {
        setIsCameraReady(true)
      }

    } catch (error: any) {
      console.error('[VIN Scanner] Failed to start camera:', error)

      let errorMessage = 'Failed to start camera'

      if (error?.name) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Camera permission denied. Please allow camera access.'
            break
          case 'NotFoundError':
            errorMessage = 'No camera found on this device'
            break
          case 'NotReadableError':
            errorMessage = 'Camera is being used by another application'
            break
          case 'OverconstrainedError':
            errorMessage = 'Camera constraints not supported'
            break
          default:
            if (error.message?.includes('play()')) {
              errorMessage = 'Video playback failed - try refreshing the page'
            }
        }
      }

      if (isMountedRef.current) {
        setCameraError(errorMessage)
        setIsCameraReady(false)
        setIsScanningActive(false)
      }

      if (onError && typeof onError === 'function') {
        onError(errorMessage)
      }
    }
  }, [onVinDetected, onError, stopScanning, isScanningActive, isValidVIN])

  // Inicialización y enumeración de dispositivos
  useEffect(() => {
    const initializeScanner = async () => {
      try {
        if (!readerRef.current) {
          readerRef.current = new BrowserMultiFormatReader(hints)
          console.log('[VIN Scanner] Reader initialized with enhanced hints')
        }

        const videoDevices = await readerRef.current.listVideoInputDevices()

        if (!isMountedRef.current) return

        if (videoDevices?.length > 0) {
          setDevices(videoDevices)
          console.log('[VIN Scanner] Found cameras:', videoDevices.length)

          // Seleccionar cámara trasera por defecto
          const backCamera = videoDevices.find(device => 
            device.label?.toLowerCase().includes('back') || 
            device.label?.toLowerCase().includes('rear') ||
            device.label?.toLowerCase().includes('environment')
          )
          const defaultDeviceId = backCamera?.deviceId || videoDevices[0]?.deviceId || ''
          setSelectedDeviceId(defaultDeviceId)

          console.log('[VIN Scanner] Selected camera:', backCamera?.label || videoDevices[0]?.label)
        } else {
          const errorMsg = 'No cameras found on this device'
          setCameraError(errorMsg)
          if (onError && typeof onError === 'function') {
            onError(errorMsg)
          }
        }
      } catch (error: any) {
        console.error('[VIN Scanner] Device enumeration failed:', error)
        if (isMountedRef.current) {
          setCameraError('Failed to access cameras - check permissions')
        }
        if (onError && typeof onError === 'function') {
          onError('Camera access failed')
        }
      }
    }

    initializeScanner()

    // Cleanup al desmontar
    return () => {
      isMountedRef.current = false
      cleanup()
    }
  }, [hints, cleanup, onError])

  // Handlers para botones
  const handleStartScan = useCallback(() => {
    if (selectedDeviceId && !isScanningActive) {
      startScanning(selectedDeviceId)
    } else if (!selectedDeviceId) {
      setCameraError('No camera selected')
    }
  }, [selectedDeviceId, isScanningActive, startScanning])

  const handleStopScan = useCallback(() => {
    if (isScanningActive) {
      stopScanning()
    }
  }, [isScanningActive, stopScanning])

  const handleDeviceChange = useCallback((deviceId: string) => {
    if (deviceId && deviceId !== selectedDeviceId) {
      setSelectedDeviceId(deviceId)

      // Reiniciar con nuevo dispositivo si está escaneando
      if (isScanningActive) {
        setTimeout(() => startScanning(deviceId), 200)
      }
    }
  }, [selectedDeviceId, isScanningActive, startScanning])

  return (
    <div className="flex flex-col h-full w-full min-h-[500px]">
      {/* Controls */}
      <div className="p-4 bg-gray-100 dark:bg-gray-800 border-b flex flex-wrap items-center justify-between gap-3">
        {devices.length > 1 && (
          <div className="flex items-center gap-2 min-w-0">
            <Label htmlFor="camera-select" className="text-sm whitespace-nowrap">Camera:</Label>
            <Select 
              value={selectedDeviceId} 
              onValueChange={handleDeviceChange} 
              disabled={isScanningActive}
            >
              <SelectTrigger id="camera-select" className="w-[200px]">
                <SelectValue placeholder="Select camera" />
              </SelectTrigger>
              <SelectContent>
                {devices.map(device => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.substring(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-2">
          {!isScanningActive ? (
            <Button 
              onClick={handleStartScan} 
              disabled={!selectedDeviceId}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-1" />
              Start Scan
            </Button>
          ) : (
            <Button 
              onClick={handleStopScan} 
              variant="destructive"
              size="sm"
            >
              <StopCircle className="h-4 w-4 mr-1" />
              Stop Scan
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Status */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-sm border-b">
        {!isScanningActive && !cameraError && (
          <div className="flex items-center justify-between">
            <span className="flex items-center text-blue-600">
              <Video className="h-4 w-4 mr-2" />
              Ready to scan VIN codes and barcodes
            </span>
            <span className="text-xs text-gray-500">
              Supports: QR, Code128, Code39, DataMatrix, PDF417
            </span>
          </div>
        )}
        {isScanningActive && !isCameraReady && !cameraError && (
          <span className="flex items-center text-blue-600 animate-pulse">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Starting camera and initializing scanner...
          </span>
        )}
        {isCameraReady && isScanningActive && !scanResult && (
          <div className="flex items-center justify-between">
            <span className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Scanning for VIN codes... Point camera at barcode or VIN
            </span>
            <span className="text-xs text-green-500 animate-pulse">
              • Active •
            </span>
          </div>
        )}
        {scanResult && (
          <span className="flex items-center text-green-600 font-medium">
            <CheckCircle className="h-4 w-4 mr-2" />
            Result: {scanResult}
          </span>
        )}
        {cameraError && (
          <span className="flex items-center text-red-600">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {cameraError}
          </span>
        )}
      </div>

      {/* Video with enhanced overlay */}
      <div className="relative flex-1 bg-black overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
        />

        {/* Scanning overlay with target */}
        {isCameraReady && isScanningActive && !cameraError && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Scanning target */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-64 h-32 border-2 border-green-400 rounded-lg bg-transparent">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                  Align VIN or barcode here
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other overlay states */}
        {!isCameraReady && isScanningActive && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center text-white">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium">Initializing camera...</p>
              <p className="text-sm opacity-75">Please wait while we prepare the scanner</p>
            </div>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75">
            <div className="text-center text-white p-6 max-w-md">
              <CameraOff className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Camera Error</p>
              <p className="text-sm opacity-90 mb-4">{cameraError}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="text-white border-white hover:bg-white hover:text-red-900"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        )}

        {!isScanningActive && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
            <div className="text-center text-white p-6">
              <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">VIN Scanner Ready</p>
              <p className="text-sm opacity-75">Press "Start Scan" to begin detecting VIN codes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}