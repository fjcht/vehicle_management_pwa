import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Camera, Play, Square, Settings, Zap, QrCode, Type, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

// Simular las librerías externas para demo
const mockTesseract = {
  recognize: async (canvas, lang, options) => {
    // Simular procesamiento OCR
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Simular detección de VIN
    const mockVins = [
      '1HGBH41JXMN109186',
      '2T1BURHE0JC014890',
      '1FTFW1ET5DFC10312'
    ]
    return {
      data: {
        text: Math.random() > 0.7 ? mockVins[Math.floor(Math.random() * mockVins.length)] : 'NO VIN FOUND'
      }
    }
  }
}

const mockZxing = {
  BrowserMultiFormatReader: class {
    constructor() {}
    
    async listVideoInputDevices() {
      return [
        { deviceId: 'camera1', label: 'Cámara Trasera' },
        { deviceId: 'camera2', label: 'Cámara Frontal' }
      ]
    }
    
    async decodeFromVideoDevice(deviceId, video, callback) {
      // Simular detección de código de barras
      const interval = setInterval(() => {
        if (Math.random() > 0.9) {
          callback({ getText: () => '1HGBH41JXMN109186' })
        }
      }, 2000)
      
      return () => clearInterval(interval)
    }
    
    reset() {}
  }
}

export default function VinScannerOptimized() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const readerRef = useRef(null)
  
  const [isScanning, setIsScanning] = useState(false)
  const [scanMode, setScanMode] = useState('auto')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState('')
  const [stats, setStats] = useState({
    scansAttempted: 0,
    successfulScans: 0,
    avgProcessingTime: 0
  })

  // Validador VIN mejorado
  const validateVin = useCallback((vin) => {
    const clean = vin.toUpperCase().replace(/[^0-9A-Z]/g, '')
    if (clean.length !== 17) return false
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(clean)) return false
    
    // Verificar checksum (posición 9)
    const weights = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2]
    const values = {
      'A':1,'B':2,'C':3,'D':4,'E':5,'F':6,'G':7,'H':8,'J':1,'K':2,'L':3,'M':4,
      'N':5,'P':7,'R':9,'S':2,'T':3,'U':4,'V':5,'W':6,'X':7,'Y':8,'Z':9
    }
    
    let sum = 0
    for (let i = 0; i < 17; i++) {
      if (i === 8) continue // Skip check digit
      const char = clean[i]
      const value = isNaN(char) ? values[char] : parseInt(char)
      sum += value * weights[i]
    }
    
    const checkDigit = sum % 11
    const expectedCheck = checkDigit === 10 ? 'X' : checkDigit.toString()
    
    return clean[8] === expectedCheck
  }, [])

  // Extraer VIN con múltiples patrones
  const extractVin = useCallback((text) => {
    const patterns = [
      /\b[A-HJ-NPR-Z0-9]{17}\b/g,
      /VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/gi,
      /([A-HJ-NPR-Z0-9]{3}[\s-]?[A-HJ-NPR-Z0-9]{2}[\s-]?[A-HJ-NPR-Z0-9]{12})/g
    ]
    
    for (const pattern of patterns) {
      const matches = text.match(pattern)
      if (matches) {
        for (const match of matches) {
          const clean = match.replace(/[^A-HJ-NPR-Z0-9]/g, '')
          if (validateVin(clean)) return clean
        }
      }
    }
    return null
  }, [validateVin])

  // Inicializar dispositivos
  useEffect(() => {
    const init = async () => {
      try {
        if (!readerRef.current) {
          readerRef.current = new mockZxing.BrowserMultiFormatReader()
        }
        
        const videoDevices = await readerRef.current.listVideoInputDevices()
        setDevices(videoDevices)
        if (videoDevices.length > 0) {
          setSelectedDevice(videoDevices[0].deviceId)
        }
      } catch (err) {
        setError('No se pudo acceder a las cámaras')
      }
    }
    init()
  }, [])

  // Procesamiento OCR optimizado
  const processOCR = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return
    
    setProcessing(true)
    const startTime = Date.now()
    
    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas.getContext('2d')
      
      // Configurar canvas
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)
      
      // Área de recorte optimizada para VIN
      const cropX = canvas.width * 0.1
      const cropY = canvas.height * 0.4
      const cropWidth = canvas.width * 0.8
      const cropHeight = canvas.height * 0.2
      
      // Crear canvas recortado
      const croppedCanvas = document.createElement('canvas')
      const croppedCtx = croppedCanvas.getContext('2d')
      croppedCanvas.width = cropWidth
      croppedCanvas.height = cropHeight
      
      croppedCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
      
      // Procesar con OCR
      const { data: { text } } = await mockTesseract.recognize(croppedCanvas, 'eng', {
        tessedit_char_whitelist: 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
      })
      
      const detectedVin = extractVin(text)
      const processingTime = Date.now() - startTime
      
      // Actualizar estadísticas
      setStats(prev => ({
        scansAttempted: prev.scansAttempted + 1,
        successfulScans: detectedVin ? prev.successfulScans + 1 : prev.successfulScans,
        avgProcessingTime: (prev.avgProcessingTime + processingTime) / 2
      }))
      
      if (detectedVin) {
        setResult(detectedVin)
        setIsScanning(false)
        
        // Enviar analytics (simulado)
        console.log('VIN detectado:', detectedVin, 'Tiempo:', processingTime + 'ms')
      }
      
    } catch (err) {
      setError('Error en procesamiento OCR')
    } finally {
      setProcessing(false)
    }
  }, [extractVin])

  // Inicializar cámara
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      setResult(null)
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment'
          }
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setIsScanning(true)
          
          // Iniciar escaneo según modo
          if (scanMode === 'ocr') {
            setTimeout(() => {
              const interval = setInterval(() => {
                if (isScanning) processOCR()
              }, 2000)
              return () => clearInterval(interval)
            }, 1000)
          } else if (scanMode === 'barcode') {
            await readerRef.current.decodeFromVideoDevice(selectedDevice, videoRef.current, (result) => {
              if (result) {
                const vin = extractVin(result.getText())
                if (vin) {
                  setResult(vin)
                  setIsScanning(false)
                }
              }
            })
          } else {
            // Modo auto: barcode + OCR
            await readerRef.current.decodeFromVideoDevice(selectedDevice, videoRef.current, (result) => {
              if (result) {
                const vin = extractVin(result.getText())
                if (vin) {
                  setResult(vin)
                  setIsScanning(false)
                }
              }
            })
            
            setTimeout(() => {
              const interval = setInterval(() => {
                if (isScanning) processOCR()
              }, 3000)
              return () => clearInterval(interval)
            }, 2000)
          }
        }
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara')
    }
  }, [selectedDevice, scanMode, processOCR, extractVin, isScanning])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    if (readerRef.current) {
      readerRef.current.reset()
    }
    setIsScanning(false)
    setProcessing(false)
  }, [])

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-900 min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Camera className="h-6 w-6" />
          VIN Scanner Pro
        </h1>
        <p className="text-blue-100 text-sm">Escanea códigos VIN instantáneamente</p>
      </div>

      {/* Mode Selector */}
      <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
        <div className="flex gap-2">
          {[
            { key: 'auto', icon: Zap, label: 'Auto' },
            { key: 'barcode', icon: QrCode, label: 'Código' },
            { key: 'ocr', icon: Type, label: 'Texto' }
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setScanMode(key)}
              className={`flex-1 flex items-center justify-center gap-1 p-2 rounded-lg text-sm font-medium transition-colors ${
                scanMode === key 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-black">
        <video 
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Overlay de escaneo */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Marco de escaneo */}
            <div className="absolute inset-4 border-2 border-green-400 rounded-lg">
              <div className="absolute -top-8 left-0 bg-green-400 text-black px-2 py-1 rounded text-sm font-medium">
                {scanMode === 'auto' && 'Escaneo Automático'}
                {scanMode === 'barcode' && 'Buscar Código de Barras'}
                {scanMode === 'ocr' && 'Reconocimiento de Texto'}
              </div>
              
              {/* Línea de escaneo animada */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-400 animate-pulse"></div>
            </div>
            
            {/* Indicador de procesamiento */}
            {processing && (
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Procesando imagen...</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Estado inactivo */}
        {!isScanning && !result && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center text-white">
              <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Presiona iniciar para escanear</p>
              <p className="text-sm opacity-75">
                Apunta la cámara hacia el código VIN
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t">
        {!isScanning && !result && (
          <button
            onClick={startCamera}
            disabled={!selectedDevice}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="h-5 w-5" />
            Iniciar Escaneo
          </button>
        )}
        
        {isScanning && (
          <button
            onClick={stopCamera}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Square className="h-5 w-5" />
            Detener
          </button>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="p-4 bg-green-50 dark:bg-green-900 border-t border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-green-800 dark:text-green-200">VIN Detectado</span>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
            <code className="text-lg font-mono text-center block">{result}</code>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => navigator.clipboard?.writeText(result)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium"
            >
              Copiar
            </button>
            <button
              onClick={() => {
                setResult(null)
                startCamera()
              }}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium"
            >
              Nuevo Escaneo
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900 border-t border-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}

      {/* Stats (modo desarrollo) */}
      {stats.scansAttempted > 0 && (
        <div className="p-3 bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 border-t">
          <div className="flex justify-between">
            <span>Escaneos: {stats.scansAttempted}</span>
            <span>Éxito: {((stats.successfulScans / stats.scansAttempted) * 100).toFixed(1)}%</span>
            <span>Tiempo: {stats.avgProcessingTime.toFixed(0)}ms</span>
          </div>
        </div>
      )}
    </div>
  )
}