'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, DecodeHintType, Result } from '@zxing/library'
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

  // Inicializar hints de forma segura
  const hints = React.useMemo(() => {
    const hintsMap = new Map<DecodeHintType, any>()
    hintsMap.set(DecodeHintType.ASSUME_GS1, true)
    hintsMap.set(DecodeHintType.TRY_HARDER, true)
    return hintsMap
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
      // Pequeña pausa para asegurar cleanup
      await new Promise(resolve => setTimeout(resolve, 100))
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
      
      await readerRef.current.decodeFromVideoDevice(
        deviceId, 
        videoRef.current, 
        (result: Result | null, error?: Error) => {
          if (!isMountedRef.current) return

          if (result?.getText()) {
            const vinText = result.getText().toUpperCase().replace(/[^0-9A-Z]/g, '')
            console.log('[VIN Scanner] VIN detected:', vinText)
            
            if (isMountedRef.current) {
              setScanResult(vinText)
            }
            
            if (onVinDetected && typeof onVinDetected === 'function') {
              onVinDetected(vinText)
            }
            
            // Detener después de detección exitosa
            setTimeout(stopScanning, 100)
            return
          }

          // Log solo errores relevantes
          if (error && error.message && !error.message.includes('No code found')) {
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
            errorMessage = 'Camera permission denied'
            break
          case 'NotFoundError':
            errorMessage = 'No camera found'
            break
          case 'NotReadableError':
            errorMessage = 'Camera in use by another app'
            break
          case 'OverconstrainedError':
            errorMessage = 'Camera constraints not supported'
            break
          default:
            if (error.message?.includes('play()')) {
              errorMessage = 'Video playback failed'
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
  }, [onVinDetected, onError, stopScanning, isScanningActive])

  // Inicialización y enumeración de dispositivos
  useEffect(() => {
    const initializeScanner = async () => {
      try {
        if (!readerRef.current) {
          readerRef.current = new BrowserMultiFormatReader(hints)
        }

        const videoDevices = await readerRef.current.listVideoInputDevices()
        
        if (!isMountedRef.current) return

        if (videoDevices?.length > 0) {
          setDevices(videoDevices)
          
          // Seleccionar cámara trasera por defecto o la primera disponible
          const backCamera = videoDevices.find(device => 
            device.label?.toLowerCase().includes('back') || 
            device.label?.toLowerCase().includes('rear')
          )
          const defaultDeviceId = backCamera?.deviceId || videoDevices[0]?.deviceId || ''
          setSelectedDeviceId(defaultDeviceId)
        } else {
          const errorMsg = 'No cameras found'
          setCameraError(errorMsg)
          if (onError && typeof onError === 'function') {
            onError(errorMsg)
          }
        }
      } catch (error: any) {
        console.error('[VIN Scanner] Device enumeration failed:', error)
        if (isMountedRef.current) {
          setCameraError('Failed to access cameras')
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
        setTimeout(() => startScanning(deviceId), 100)
      }
    }
  }, [selectedDeviceId, isScanningActive, startScanning])

  return (
    <div className="flex flex-col h-full w-full min-h-[400px]">
      {/* Controls */}
      <div className="p-3 bg-gray-100 dark:bg-gray-800 border-b flex flex-wrap items-center justify-between gap-3">
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
            >
              <Play className="h-4 w-4 mr-1" />
              Start
            </Button>
          ) : (
            <Button 
              onClick={handleStopScan} 
              variant="destructive"
              size="sm"
            >
              <StopCircle className="h-4 w-4 mr-1" />
              Stop
            </Button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 text-sm border-b">
        {!isScanningActive && !cameraError && (
          <span className="flex items-center text-blue-600">
            <Video className="h-4 w-4 mr-1" />
            Ready to scan
          </span>
        )}
        {isScanningActive && !isCameraReady && !cameraError && (
          <span className="flex items-center text-blue-600 animate-pulse">
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            Starting camera...
          </span>
        )}
        {isCameraReady && isScanningActive && !scanResult && (
          <span className="flex items-center text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            Scanning for VIN...
          </span>
        )}
        {scanResult && (
          <span className="flex items-center text-green-600 font-medium">
            <CheckCircle className="h-4 w-4 mr-1" />
            VIN detected: {scanResult}
          </span>
        )}
        {cameraError && (
          <span className="flex items-center text-red-600">
            <AlertTriangle className="h-4 w-4 mr-1" />
            {cameraError}
          </span>
        )}
      </div>

      {/* Video */}
      <div className="relative flex-1 bg-black overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
        />
        
        {/* Overlay states */}
        {!isCameraReady && isScanningActive && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center text-white">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Initializing camera...</p>
            </div>
          </div>
        )}
        
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75">
            <div className="text-center text-white p-4">
              <CameraOff className="h-12 w-12 mx-auto mb-2" />
              <p className="font-medium">Camera Error</p>
              <p className="text-sm opacity-90">{cameraError}</p>
            </div>
          </div>
        )}
        
        {!isScanningActive && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
            <div className="text-center text-white p-4">
              <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Press Start to begin scanning</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}