
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, X, Check, Loader2, AlertTriangle, Smartphone, Monitor } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { decodeVIN, NHTSAVehicleData } from '@/lib/nhtsa'
import { useToast } from '@/hooks/use-toast'

interface VinScannerProps {
  onVinDetected: (vin: string, vehicleData?: NHTSAVehicleData) => void
  initialVin?: string
}

interface CameraError {
  name: string
  message: string
  constraint?: string
}

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
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { toast } = useToast()

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
  }, [])

  const addDebugInfo = useCallback((info: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => [...prev.slice(-4), `[${timestamp}] ${info}`])
    console.log(`[VIN Scanner] ${info}`)
  }, [])

  // Check camera permissions
  const checkCameraPermissions = useCallback(async () => {
    setIsCheckingPermissions(true)
    addDebugInfo('=== CHECKING CAMERA PERMISSIONS ===')
    
    try {
      // Check basic API availability
      addDebugInfo('Checking MediaDevices API availability...')
      if (!navigator.mediaDevices) {
        throw new Error('MediaDevices API not supported in this browser')
      }
      addDebugInfo('✓ MediaDevices API available')
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser')
      }
      addDebugInfo('✓ getUserMedia available')

      // Check if permissions API is available
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

      // Test camera access with very basic constraints
      addDebugInfo('Testing camera access with basic constraints...')
      try {
        addDebugInfo('Calling getUserMedia for permission test...')
        const testStream = await navigator.mediaDevices.getUserMedia({ video: true })
        
        addDebugInfo(`✓ Camera access test successful`)
        addDebugInfo(`Test stream tracks: ${testStream.getTracks().length}`)
        
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
      setCameraError({
        name: 'PermissionError',
        message: error instanceof Error ? error.message : 'Unknown permission error'
      })
    } finally {
      setIsCheckingPermissions(false)
      addDebugInfo('Permission check completed')
    }
  }, [addDebugInfo])

  // Get optimal camera constraints for mobile
  const getCameraConstraints = useCallback(() => {
    const baseConstraints = {
      video: {
        facingMode: 'environment', // Use back camera on mobile
        width: { ideal: isMobile ? 1920 : 1280 },
        height: { ideal: isMobile ? 1080 : 720 },
        aspectRatio: { ideal: 16/9 },
        frameRate: { ideal: 30, max: 30 }
      }
    }

    if (isMobile) {
      // Mobile-specific optimizations
      return {
        video: {
          ...baseConstraints.video,
          focusMode: 'continuous',
          exposureMode: 'continuous',
          whiteBalanceMode: 'continuous',
          zoom: { ideal: 1.0 }
        }
      }
    }

    return baseConstraints
  }, [isMobile])

  const startCamera = useCallback(async () => {
    addDebugInfo('=== STARTING CAMERA PROCESS ===')
    setCameraError(null)
    
    try {
      // Check permissions first
      if (permissionStatus === 'denied') {
        throw new Error('Camera permission denied. Please enable camera access in your browser settings.')
      }

      addDebugInfo('Checking getUserMedia availability...')
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser')
      }
      addDebugInfo('✓ getUserMedia is available')

      // CRITICAL: Wait for video element to be available in DOM
      addDebugInfo('Checking video element availability...')
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

      // Progressive fallback constraints - start with most basic
      const constraintSets = [
        // Most basic - just video
        { video: true },
        // Basic with back camera
        { video: { facingMode: 'environment' } },
        // Medium constraints
        { 
          video: { 
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        },
        // Full constraints (original)
        getCameraConstraints()
      ]

      let stream: MediaStream | null = null
      let usedConstraints = null

      // Try each constraint set
      for (let i = 0; i < constraintSets.length; i++) {
        const constraints = constraintSets[i]
        addDebugInfo(`Attempting constraints set ${i + 1}/${constraintSets.length}:`)
        addDebugInfo(`${JSON.stringify(constraints, null, 2)}`)
        
        try {
          addDebugInfo(`Calling getUserMedia with constraints set ${i + 1}...`)
          
          // Add timeout to getUserMedia call
          const getUserMediaPromise = navigator.mediaDevices.getUserMedia(constraints)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('getUserMedia timeout after 10 seconds')), 10000)
          })
          
          stream = await Promise.race([getUserMediaPromise, timeoutPromise]) as MediaStream
          usedConstraints = constraints
          addDebugInfo(`✓ SUCCESS with constraints set ${i + 1}`)
          addDebugInfo(`Stream tracks: ${stream.getTracks().length}`)
          stream.getTracks().forEach((track, index) => {
            addDebugInfo(`Track ${index}: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}`)
            if (track.kind === 'video') {
              const settings = track.getSettings()
              addDebugInfo(`Video settings: ${JSON.stringify(settings)}`)
            }
          })
          break
        } catch (constraintError) {
          addDebugInfo(`✗ FAILED with constraints set ${i + 1}: ${constraintError}`)
          if (constraintError instanceof Error) {
            addDebugInfo(`Error name: ${constraintError.name}`)
            addDebugInfo(`Error message: ${constraintError.message}`)
          }
          
          // If this is the last constraint set, re-throw the error
          if (i === constraintSets.length - 1) {
            throw constraintError
          }
        }
      }

      if (!stream) {
        throw new Error('Failed to get camera stream with any constraint set')
      }

      // Double-check video element is still available before assigning stream
      addDebugInfo('Final video element check before stream assignment...')
      const finalVideoElement = videoRef.current
      if (!finalVideoElement) {
        addDebugInfo('✗ Video element disappeared during camera setup')
        // Clean up stream
        stream.getTracks().forEach(track => track.stop())
        throw new Error('Video element became unavailable during setup')
      }

      addDebugInfo('Setting up video element...')
      addDebugInfo(`Final video element state: readyState=${finalVideoElement.readyState}, networkState=${finalVideoElement.networkState}`)
      
      // Set the stream with additional error handling
      try {
        finalVideoElement.srcObject = stream
        streamRef.current = stream
        addDebugInfo('✓ Stream assigned to video element successfully')
      } catch (streamError) {
        addDebugInfo(`✗ Error assigning stream to video: ${streamError}`)
        // Clean up stream
        stream.getTracks().forEach(track => track.stop())
        throw new Error(`Failed to assign stream to video element: ${streamError}`)
      }
      
      // Wait for video to be ready with detailed logging
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
          clearTimeout(timeoutId)
          finalVideoElement.removeEventListener('loadedmetadata', onLoadedMetadata)
          finalVideoElement.removeEventListener('error', onError)
          finalVideoElement.removeEventListener('canplay', onCanPlay)
          resolve()
        }
        
        const onCanPlay = () => {
          addDebugInfo('✓ Video can play')
        }
        
        const onError = (e: Event) => {
          addDebugInfo(`✗ Video error event: ${e}`)
          addDebugInfo(`Video error details: ${finalVideoElement.error}`)
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
        
        // Check if already ready
        if (finalVideoElement.readyState >= 1) { // HAVE_METADATA
          addDebugInfo('Video already has metadata, resolving immediately')
          clearTimeout(timeoutId)
          finalVideoElement.removeEventListener('loadedmetadata', onLoadedMetadata)
          finalVideoElement.removeEventListener('error', onError)
          finalVideoElement.removeEventListener('canplay', onCanPlay)
          resolve()
        }
      })
      
      setIsScanning(true)
      addDebugInfo('=== CAMERA STARTED SUCCESSFULLY ===')
      addDebugInfo(`Final constraints used: ${JSON.stringify(usedConstraints)}`)
      
      toast({
        title: "Camera Ready",
        description: isMobile ? "Position your device over the VIN" : "Position the VIN in the camera view",
      })
      
    } catch (error) {
      addDebugInfo(`=== CAMERA START FAILED ===`)
      addDebugInfo(`Error: ${error}`)
      console.error('Error accessing camera:', error)
      
      // Clean up any partial state
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
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
  }, [toast, permissionStatus, getCameraConstraints, addDebugInfo, isMobile])

  const stopCamera = useCallback(() => {
    addDebugInfo('Stopping camera...')
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        addDebugInfo(`Stopped track: ${track.kind}`)
      })
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
    addDebugInfo('Camera stopped')
  }, [addDebugInfo])

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
      
      addDebugInfo(`VIN decoded successfully: ${data ? 'with data' : 'no data'}`)
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

  const captureVinFromCamera = () => {
    // In a real implementation, this would use OCR to detect VIN from camera
    // For now, we'll simulate VIN detection with a more realistic approach
    addDebugInfo('Capturing VIN from camera (simulated)')
    
    // Simulate different VINs for testing
    const simulatedVins = [
      "1HGBH41JXMN109186", // Honda
      "1FTFW1ET5DFC10312", // Ford
      "1G1ZT53806F109149", // Chevrolet
      "WBAVA33598NL73456", // BMW
      "JM1BL1SF7A1234567"  // Mazda
    ]
    
    const randomVin = simulatedVins[Math.floor(Math.random() * simulatedVins.length)]
    setManualVin(randomVin)
    stopCamera()
    
    addDebugInfo(`Simulated VIN captured: ${randomVin}`)
    toast({
      title: "VIN Detected",
      description: "VIN captured from camera. Please verify and submit.",
    })
  }

  // Auto-check permissions on mount
  useEffect(() => {
    checkCameraPermissions()
  }, [checkCameraPermissions])

  // Ensure video element is available after mount
  useEffect(() => {
    addDebugInfo('Component mounted, checking video element...')
    if (videoRef.current) {
      addDebugInfo('✓ Video element available after mount')
      addDebugInfo(`Video element details: tagName=${videoRef.current.tagName}, id=${videoRef.current.id || 'none'}`)
    } else {
      addDebugInfo('✗ Video element not available after mount')
    }
  }, [])

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
          {isScanning && (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-white border-dashed w-3/4 h-16 rounded-lg flex items-center justify-center bg-black bg-opacity-20">
                  <span className="text-white text-sm font-medium">Position VIN here</span>
                </div>
              </div>
              <div className="absolute top-2 right-2 space-x-2">
                <Button 
                  size={isMobile ? "default" : "sm"} 
                  onClick={captureVinFromCamera}
                  className={isMobile ? "px-4 py-2" : ""}
                >
                  <Check className="w-4 h-4" />
                  {isMobile && <span className="ml-2">Capture</span>}
                </Button>
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
            </>
          )}
        </div>

        {/* Camera Controls */}
        {!isScanning && (
          <div className="space-y-2">
            <Button 
              onClick={startCamera} 
              className="w-full"
              disabled={isCheckingPermissions || permissionStatus === 'denied'}
              size={isMobile ? "lg" : "default"}
            >
              {isCheckingPermissions ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking Permissions...
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
              style={isMobile ? { fontSize: '16px' } : {}} // Prevent zoom on iOS
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
