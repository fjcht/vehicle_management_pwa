'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, DecodeHintType, Result } from '@zxing/library'
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert'
import { Loader2, CameraOff, Video, AlertTriangle, CheckCircle, XCircle, Play, StopCircle } from 'lucide-react' // Added Play and StopCircle icons
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Label } from '@/app/components/ui/label'
import { Button } from '@/app/components/ui/button' // Assuming you have a Button component

interface VinScannerProps {
  onVinDetected: (vin: string) => void
  onError?: (error: string) => void
}

export function VinScanner({ onVinDetected, onError }: VinScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [isScanningActive, setIsScanningActive] = useState(false) // Controls if scanning should be active

  const hints = new Map<DecodeHintType, any>()
  hints.set(DecodeHintType.ASSUME_GS1, true)
  hints.set(DecodeHintType.TRY_HARDER, true)
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    // Add specific formats if you know them, e.g., BarcodeFormat.CODE_39, BarcodeFormat.QR_CODE
  ])

  // Initialize reader once
  useEffect(() => {
    if (!readerRef.current) {
      readerRef.current = new BrowserMultiFormatReader(hints)
    }
  }, [hints])

  const stopScanning = useCallback(() => {
    if (readerRef.current) {
      console.log('[VIN Scanner] Stopping camera...')
      readerRef.current.reset() // This stops the video stream and clears internal state
      setIsCameraReady(false)
      setIsScanningActive(false) // Ensure this is false when stopped
    }
  }, [])

  const startScanning = useCallback(async (deviceId: string) => {
    if (!videoRef.current) {
      console.error('[VIN Scanner] Video element not available.')
      setCameraError('Video element not ready. Please try again.')
      onError?.('Video element not ready.')
      setIsScanningActive(false); // Ensure scanning is off if video not ready
      return
    }

    if (!readerRef.current) {
      console.error('[VIN Scanner] Reader not initialized.')
      setCameraError('Scanner not ready. Please refresh.')
      onError?.('Scanner not ready.')
      setIsScanningActive(false); // Ensure scanning is off if reader not ready
      return
    }

    // Reset reader before starting a new scan to clear previous streams
    readerRef.current.reset()

    setIsCameraReady(false)
    setCameraError(null)
    setScanResult(null)
    setIsScanningActive(true) // Explicitly set scanning to active

    try {
      console.log(`[VIN Scanner] Attempting to start camera with deviceId: ${deviceId}`)
      await readerRef.current.decodeFromVideoDevice(deviceId, videoRef.current, (result: Result, error: Error) => {
        if (result) {
          const vin = result.getText().toUpperCase().replace(/[^0-9A-Z]/g, '')
          console.log('[VIN Scanner] VIN detected:', vin)
          setScanResult(vin)
          onVinDetected(vin)
          stopScanning() // Stop scanning immediately after detection
        }
        // Only log scan errors if no result yet and it's not a common "no code found" error
        if (error && !scanResult && error.message !== 'No code found') {
          console.warn('[VIN Scanner] Scan error:', error.message);
        }
      })
      console.log('[VIN Scanner] Camera stream obtained successfully.')
      setIsCameraReady(true)
    } catch (err: any) {
      console.error('[VIN Scanner] Camera start failed:', err)
      let errorMessage = 'Failed to start camera. Please ensure camera access is granted and no other app is using it.'
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please grant permission in your browser settings.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please ensure a camera is connected.'
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is in use by another application or device is not available.'
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not supported by device.'
      }
      setCameraError(errorMessage)
      onError?.(errorMessage)
      setIsCameraReady(false)
      setIsScanningActive(false) // Set scanning to inactive on error
    }
  }, [onVinDetected, onError, scanResult, stopScanning]) // Added stopScanning to dependencies

  // Effect for initial device enumeration and cleanup
  useEffect(() => {
    const enumerateDevices = async () => {
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader(hints);
      }
      try {
        const videoInputDevices = await readerRef.current.listVideoInputDevices()
        setDevices(videoInputDevices)
        if (videoInputDevices.length > 0) {
          const backCamera = videoInputDevices.find(device => device.label.toLowerCase().includes('back'))
          const defaultDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId
          setSelectedDeviceId(defaultDeviceId)
        } else {
          setCameraError('No video input devices found.')
          onError?.('No video input devices found.')
        }
      } catch (err: any) {
        console.error('[VIN Scanner] Error enumerating devices:', err)
        setCameraError('Error accessing camera devices. Please check permissions.')
        onError?.('Error enumerating devices.')
      }
    }

    enumerateDevices()

    // Cleanup on unmount
    return () => {
      stopScanning()
    }
  }, [stopScanning, onError, hints])

  // Handler for device change
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    // If scanning is active, restart with the new device
    if (isScanningActive) {
      startScanning(deviceId)
    }
  }

  // Handlers for Start/Stop buttons
  const handleStartScan = () => {
    if (selectedDeviceId) {
      startScanning(selectedDeviceId)
    } else {
      setCameraError('No camera selected or available.')
    }
  }

  const handleStopScan = () => {
    stopScanning()
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Camera Controls and Status */}
      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-t-md flex flex-col sm:flex-row items-center justify-between gap-2">
        {devices.length > 1 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label htmlFor="camera-select" className="sr-only sm:not-sr-only">Camera:</Label>
            <Select value={selectedDeviceId} onValueChange={handleDeviceChange} disabled={isScanningActive}>
              <SelectTrigger id="camera-select" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Camera" />
              </SelectTrigger>
              <SelectContent>
                {devices.map(device => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.substring(0, 4)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
          {!isScanningActive ? (
            <Button onClick={handleStartScan} disabled={!selectedDeviceId || isScanningActive}>
              <Play className="h-4 w-4 mr-2" /> Start Scan
            </Button>
          ) : (
            <Button onClick={handleStopScan} disabled={!isScanningActive} variant="destructive">
              <StopCircle className="h-4 w-4 mr-2" /> Stop Scan
            </Button>
          )}
        </div>
      </div>

      {/* Status Display */}
      <div className="p-2 bg-gray-50 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
        {!isScanningActive && !cameraError && (
          <span className="flex items-center">
            <Video className="h-4 w-4 mr-1 text-blue-500" /> Ready to scan
          </span>
        )}
        {isScanningActive && !isCameraReady && !cameraError && (
          <span className="flex items-center animate-pulse">
            <Loader2 className="h-4 w-4 mr-1 text-blue-500" /> Starting camera...
          </span>
        )}
        {isCameraReady && isScanningActive && !scanResult && (
          <span className="flex items-center text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4 mr-1" /> Scanning...
          </span>
        )}
        {scanResult && (
          <span className="flex items-center text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4 mr-1" /> VIN Detected!
          </span>
        )}
        {cameraError && (
          <span className="flex items-center text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 mr-1" /> {cameraError}
          </span>
        )}
      </div>

      {/* Video Feed */}
      <div className="relative flex-grow bg-black rounded-b-md overflow-hidden flex items-center justify-center">
        {!isCameraReady && isScanningActive && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 text-white text-center p-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-400 mr-3" />
            <p className="text-lg">Waiting for camera stream...</p>
          </div>
        )}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900 bg-opacity-75 text-white text-center p-4">
            <CameraOff className="h-12 w-12 mb-4" />
            <p className="text-lg font-semibold">Camera Error</p>
            <p className="text-sm">{cameraError}</p>
          </div>
        )}
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
      </div>
    </div>
  )
}