'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, DecodeHintType, Result, BarcodeFormat } from '@zxing/library'
import Tesseract from 'tesseract.js'
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert'
import { Loader2, CameraOff, Video, AlertTriangle, CheckCircle, XCircle, Play, StopCircle, QrCode, Type, Zap } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Label } from '@/app/components/ui/label'
import { Button } from '@/app/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'

interface VinScannerProps {
  onVinDetected: (vin: string) => void
  onError?: (error: string) => void
}

type ScanMode = 'auto' | 'barcode' | 'ocr'

export function VinScanner({ onVinDetected, onError }: VinScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const isMountedRef = useRef(true)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const ocrTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [isCameraReady, setIsCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [isScanningActive, setIsScanningActive] = useState(false)
  const [scanMode, setScanMode] = useState<ScanMode>('auto')
  const [isOcrProcessing, setIsOcrProcessing] = useState(false)
  const [scanStatus, setScanStatus] = useState<string>('Ready to scan')

  // Configuración mejorada de hints
  const hints = React.useMemo(() => {
    const hintsMap = new Map<DecodeHintType, any>()
    
    // Formatos de código de barras más comunes para VIN
    hintsMap.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.PDF_417,
      BarcodeFormat.AZTEC
    ])
    
    // Configuración más permisiva
    hintsMap.set(DecodeHintType.TRY_HARDER, true)
    hintsMap.set(DecodeHintType.PURE_BARCODE, false)
    
    return hintsMap
  }, [])

  // Validar VIN mejorado
  const isValidVin = useCallback((vin: string): boolean => {
    const cleanVin = vin.toUpperCase().replace(/[^0-9A-Z]/g, '')
    
    // Verificar longitud
    if (cleanVin.length !== 17) return false
    
    // Verificar caracteres válidos (sin I, O, Q)
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVin)) return false
    
    // Verificar que no sea todo números o todo letras
    const hasNumbers = /\d/.test(cleanVin)
    const hasLetters = /[A-Z]/.test(cleanVin)
    
    return hasNumbers && hasLetters
  }, [])

  // Extraer VIN de texto mejorado
  const extractVinFromText = useCallback((text: string): string | null => {
    console.log('[VIN Scanner] Raw text:', text)
    
    // Limpiar texto pero mantener más caracteres
    const cleanText = text.toUpperCase().replace(/[^A-Z0-9\s\-_]/g, ' ')
    
    // Buscar patrones de VIN (17 caracteres alfanuméricos)
    const vinPatterns = [
      /\b[A-HJ-NPR-Z0-9]{17}\b/g,           // VIN completo
      /\b[A-HJ-NPR-Z0-9]{3}[\s\-_]?[A-HJ-NPR-Z0-9]{2}[\s\-_]?[A-HJ-NPR-Z0-9]{12}\b/g, // Con separadores
      /[A-HJ-NPR-Z0-9]{17}/g                // Sin límites de palabra
    ]
    
    for (const pattern of vinPatterns) {
      const matches = cleanText.match(pattern)
      if (matches) {
        for (const match of matches) {
          const cleanMatch = match.replace(/[\s\-_]/g, '')
          if (isValidVin(cleanMatch)) {
            console.log('[VIN Scanner] Valid VIN found:', cleanMatch)
            return cleanMatch
          }
        }
      }
    }
    
    return null
  }, [isValidVin])

  // Cleanup seguro
  const cleanup = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    if (ocrTimeoutRef.current) {
      clearTimeout(ocrTimeoutRef.current)
      ocrTimeoutRef.current = null
    }

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
      setIsOcrProcessing(false)
      setCameraError(null)
      setScanStatus('Ready to scan')
    }
  }, [cleanup])

  // OCR Processing mejorado
  const processOCR = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isMountedRef.current) return

    try {
      setIsOcrProcessing(true)
      setScanStatus('Processing text recognition...')

      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx) return

      // Configurar canvas con las dimensiones del video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Capturar frame del video
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Definir área de recorte (marco central más grande)
      const cropX = canvas.width * 0.05
      const cropY = canvas.height * 0.25
      const cropWidth = canvas.width * 0.9
      const cropHeight = canvas.height * 0.5

      // Crear canvas recortado
      const croppedCanvas = document.createElement('canvas')
      const croppedCtx = croppedCanvas.getContext('2d')

      if (!croppedCtx) return

      croppedCanvas.width = cropWidth
      croppedCanvas.height = cropHeight

      croppedCtx.drawImage(
        canvas, 
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      )

      // Mejorar contraste
      const imageData = croppedCtx.getImageData(0, 0, cropWidth, cropHeight)
      const data = imageData.data
      
      for (let i = 0; i < data.length; i += 4) {
        // Convertir a escala de grises y aumentar contraste
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
        const contrast = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128))
        data[i] = data[i + 1] = data[i + 2] = contrast
      }
      
      croppedCtx.putImageData(imageData, 0, 0)

      // Procesar con Tesseract - configuración mejorada
      const { data: { text } } = await Tesseract.recognize(
        croppedCanvas,
        'eng',
        {
          logger: () => {}, // Silenciar logs
          tessedit_char_whitelist: 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789',
          tessedit_pageseg_mode: Tesseract.PSM.AUTO, // Cambio: AUTO en lugar de SINGLE_LINE
          tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        }
      )

      if (!isMountedRef.current) return

      console.log('[VIN Scanner] OCR text result:', text)

      // Buscar VIN en el texto
      const detectedVin = extractVinFromText(text)

      if (detectedVin) {
        console.log('[VIN Scanner] VIN detected via OCR:', detectedVin)
        setScanResult(detectedVin)
        setScanStatus(`VIN detected: ${detectedVin}`)
        onVinDetected(detectedVin)
        setTimeout(stopScanning, 1000)
        return
      }

      setScanStatus('Scanning for text...')

    } catch (error: any) {
      console.error('[VIN Scanner] OCR error:', error)
      if (isMountedRef.current) {
        setScanStatus('OCR processing failed')
      }
    } finally {
      if (isMountedRef.current) {
        setIsOcrProcessing(false)
      }
    }
  }, [extractVinFromText, onVinDetected, stopScanning])

  // Barcode scanning mejorado
  const processBarcodeScanning = useCallback(async (deviceId: string) => {
    if (!videoRef.current || !readerRef.current || !isMountedRef.current) return

    try {
      await readerRef.current.decodeFromVideoDevice(
        deviceId, 
        videoRef.current, 
        (result: Result | null, error?: Error) => {
          if (!isMountedRef.current) return

          if (result?.getText()) {
            const rawText = result.getText()
            console.log('[VIN Scanner] Barcode raw text:', rawText)
            
            // Buscar VIN en el texto del código de barras
            const detectedVin = extractVinFromText(rawText)

            if (detectedVin) {
              console.log('[VIN Scanner] VIN detected via barcode:', detectedVin)
              setScanResult(detectedVin)
              setScanStatus(`VIN detected: ${detectedVin}`)
              onVinDetected(detectedVin)
              setTimeout(stopScanning, 1000)
              return
            } else {
              console.log('[VIN Scanner] Barcode text not a valid VIN:', rawText)
            }
          }

          // Log solo errores relevantes
          if (error && error.message && !error.message.includes('No code found')) {
            console.warn('[VIN Scanner] Barcode scan error:', error.message)
          }
        }
      )
    } catch (error) {
      console.error('[VIN Scanner] Barcode scanning error:', error)
    }
  }, [extractVinFromText, onVinDetected, stopScanning])

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
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Resetear estados
    if (isMountedRef.current) {
      setIsCameraReady(false)
      setCameraError(null)
      setScanResult(null)
      setIsScanningActive(true)
      setIsOcrProcessing(false)
      setScanStatus('Starting camera...')
    }

    try {
      console.log(`[VIN Scanner] Starting camera with device: ${deviceId}`)

      // Iniciar cámara
      await processBarcodeScanning(deviceId)

      console.log('[VIN Scanner] Camera started successfully')
      if (isMountedRef.current) {
        setIsCameraReady(true)
        setScanStatus(scanMode === 'barcode' ? 'Scanning for barcodes...' : 
                    scanMode === 'ocr' ? 'Ready for text recognition...' : 
                    'Scanning for barcodes and text...')
      }

      // Configurar scanning según el modo
      if (scanMode === 'ocr') {
        // Solo OCR
        scanIntervalRef.current = setInterval(processOCR, 1500) // Más frecuente
      } else if (scanMode === 'auto') {
        // Auto: Barcode primero, luego OCR después de 2 segundos
        ocrTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && isScanningActive && !scanResult) {
            setScanStatus('Switching to text recognition...')
            scanIntervalRef.current = setInterval(processOCR, 1500)
          }
        }, 2000)
      }
      // Para 'barcode' mode, solo usa el callback del BrowserMultiFormatReader

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
        setScanStatus('Camera error')
      }

      if (onError && typeof onError === 'function') {
        onError(errorMessage)
      }
    }
  }, [onVinDetected, onError, stopScanning, isScanningActive, scanMode, processBarcodeScanning, processOCR, scanResult])

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
          setScanStatus('No cameras available')
          if (onError && typeof onError === 'function') {
            onError(errorMsg)
          }
        }
      } catch (error: any) {
        console.error('[VIN Scanner] Device enumeration failed:', error)
        if (isMountedRef.current) {
          setCameraError('Failed to access cameras')
          setScanStatus('Camera access failed')
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

  // Timeout de scanning
  useEffect(() => {
    if (isScanningActive) {
      const timeout = setTimeout(() => {
        if (isMountedRef.current && isScanningActive) {
          stopScanning()
          setScanStatus('Scan timeout - please try again')
        }
      }, 30000)

      return () => clearTimeout(timeout)
    }
  }, [isScanningActive, stopScanning])

  // Handlers para botones
  const handleStartScan = useCallback(() => {
    if (selectedDeviceId && !isScanningActive) {
      startScanning(selectedDeviceId)
    } else if (!selectedDeviceId) {
      setCameraError('No camera selected')
      setScanStatus('No camera selected')
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

  const handleModeChange = useCallback((mode: ScanMode) => {
    setScanMode(mode)

    // Reiniciar scanning si está activo
    if (isScanningActive && selectedDeviceId) {
      setTimeout(() => startScanning(selectedDeviceId), 100)
    }
  }, [isScanningActive, selectedDeviceId, startScanning])

  return (
    <div className="flex flex-col h-full w-full min-h-[500px]">
      {/* Mode Selection */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b">
        <Tabs value={scanMode} onValueChange={handleModeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="auto" className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              Auto
            </TabsTrigger>
            <TabsTrigger value="barcode" className="flex items-center gap-1">
              <QrCode className="h-4 w-4" />
              Barcode
            </TabsTrigger>
            <TabsTrigger value="ocr" className="flex items-center gap-1">
              <Type className="h-4 w-4" />
              Text
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

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
        <div className="flex items-center justify-between">
          <span className="flex items-center">
            {!isScanningActive && !cameraError && (
              <>
                <Video className="h-4 w-4 mr-1 text-blue-600" />
                <span className="text-blue-600">{scanStatus}</span>
              </>
            )}
            {isScanningActive && !isCameraReady && !cameraError && (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin text-blue-600" />
                <span className="text-blue-600 animate-pulse">{scanStatus}</span>
              </>
            )}
            {isCameraReady && isScanningActive && !scanResult && (
              <>
                {isOcrProcessing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin text-orange-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                )}
                <span className={isOcrProcessing ? "text-orange-600" : "text-green-600"}>
                  {scanStatus}
                </span>
              </>
            )}
            {scanResult && (
              <>
                <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                <span className="text-green-600 font-medium">{scanStatus}</span>
              </>
            )}
            {cameraError && (
              <>
                <AlertTriangle className="h-4 w-4 mr-1 text-red-600" />
                <span className="text-red-600">{cameraError}</span>
              </>
            )}
          </span>

          {/* Mode indicator */}
          <span className="text-xs text-gray-500 capitalize">
            Mode: {scanMode}
          </span>
        </div>
      </div>

      {/* Video with overlay */}
      <div className="relative flex-1 bg-black overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
        />

        {/* Hidden canvas for OCR */}
        <canvas 
          ref={canvasRef} 
          className="hidden"
        />

        {/* Scanning overlay */}
        {isCameraReady && isScanningActive && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Barcode scanning area (full screen) */}
            {(scanMode === 'barcode' || scanMode === 'auto') && (
              <div className="absolute inset-4 border-2 border-green-400 rounded-lg opacity-60">
                <div className="absolute -top-6 left-0 bg-green-400 text-black px-2 py-1 rounded text-xs font-medium">
                  Barcode/QR Scan Area
                </div>
              </div>
            )}

            {/* OCR scanning frame (center area) */}
            {(scanMode === 'ocr' || (scanMode === 'auto' && isOcrProcessing)) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="border-2 border-orange-400 rounded-lg bg-transparent"
                  style={{
                    width: '90%',
                    height: '50%',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)'
                  }}
                >
                  <div className="absolute -top-6 left-0 bg-orange-400 text-black px-2 py-1 rounded text-xs font-medium">
                    Text Recognition Area
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 text-center text-white text-xs bg-black bg-opacity-50 rounded px-2 py-1">
                    Align VIN text within this frame
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
              <p className="text-sm opacity-75 mt-1">
                {scanMode === 'auto' && 'Auto: Barcode first, then text recognition'}
                {scanMode === 'barcode' && 'Barcode: QR codes and barcodes only'}
                {scanMode === 'ocr' && 'Text: OCR text recognition only'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}