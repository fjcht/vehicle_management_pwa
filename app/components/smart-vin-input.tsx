'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/app/components/ui/input'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Label } from '@/app/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert'
import { Loader2, Scan, XCircle, CheckCircle, Search, Car, Database, ExternalLink } from 'lucide-react'
import { VinScanner } from '@/app/components/vin-scanner' // <-- ¡Aquí está la importación!
import { NHTSAVehicleData } from '@/app/lib/nhtsa'
import { useToast } from '@/app/hooks/use-toast'
import dynamic from 'next/dynamic'; // Import dynamic

// Dynamic import for VinScanner to ensure it's only loaded on client-side
const DynamicVinScanner = dynamic(() => import('@/app/components/vin-scanner').then(mod => mod.VinScanner), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-inner">
      <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
      <p className="text-gray-600 dark:text-gray-300">Loading scanner...</p>
    </div>
  ),
});

interface SmartVinInputProps {
  onVehicleDataFound: (data: { vin: string; data?: NHTSAVehicleData }, source: 'database' | 'nhtsa') => void
  initialVin?: string
  disabled?: boolean
}

export function SmartVinInput({ onVehicleDataFound, initialVin, disabled }: SmartVinInputProps) {
  const [vin, setVin] = useState(initialVin || '')
  const [isScanning, setIsScanning] = useState(false) // <-- Nuevo estado para controlar el escáner
  const [isLoading, setIsLoading] = useState(false)
  const [vinStatus, setVinStatus] = useState<'idle' | 'valid' | 'invalid' | 'checking'>('idle')
  const [scanError, setScanError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (initialVin) {
      setVin(initialVin)
      if (initialVin.length === 17) {
        checkVin(initialVin)
      }
    }
  }, [initialVin])

  const checkVin = useCallback(async (currentVin: string) => {
    if (currentVin.length !== 17) {
      setVinStatus('invalid')
      return
    }

    setIsLoading(true)
    setVinStatus('checking')
    setScanError(null)

    try {
      // 1. Check local database
      const dbResponse = await fetch(`/api/vehicles/check-vin?vin=${currentVin}`)
      if (dbResponse.ok) {
        const dbData = await dbResponse.json()
        if (dbData.exists) {
          setVinStatus('valid')
          onVehicleDataFound(dbData.vehicle, 'database')
          toast({
            title: "VIN Found in Database",
            description: `Vehicle already exists: ${dbData.vehicle.make} ${dbData.vehicle.model} (${dbData.vehicle.year})`,
            variant: "default"
          })
          setIsLoading(false)
          return // Exit if found in DB
        }
      }

      // 2. If not in DB, check NHTSA
      const nhtsaResponse = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${currentVin}?format=json`)
      const nhtsaData = await nhtsaResponse.json()

      if (nhtsaData.Results && nhtsaData.Results.length > 0 && nhtsaData.Results[0].ErrorCode === '0') {
        const decodedData: NHTSAVehicleData = {}
        nhtsaData.Results.forEach((item: any) => {
          if (item.Value && item.Variable) {
            // Map NHTSA variable names to more readable keys
            if (item.Variable === 'Make') decodedData.Make = item.Value
            if (item.Variable === 'Model') decodedData.Model = item.Value
            if (item.Variable === 'Model Year') decodedData.ModelYear = item.Value
            if (item.Variable === 'Body Class') decodedData.BodyClass = item.Value
            if (item.Variable === 'Vehicle Type') decodedData.VehicleType = item.Value
            if (item.Variable === 'Engine Cylinders') decodedData.EngineCylinders = item.Value
            if (item.Variable === 'Fuel Type - Primary') decodedData.FuelTypePrimary = item.Value
            if (item.Variable === 'Manufacturer Name') decodedData.ManufacturerName = item.Value
            // Add more mappings as needed
          }
        })
        setVinStatus('valid')
        onVehicleDataFound({ vin: currentVin, data: decodedData }, 'nhtsa')
        toast({
          title: "VIN Decoded from NHTSA",
          description: `Found: ${decodedData.Make || ''} ${decodedData.Model || ''} (${decodedData.ModelYear || ''})`,
          variant: "default"
        })
      } else {
        setVinStatus('invalid')
        toast({
          title: "VIN Not Found",
          description: "Could not decode VIN from NHTSA. Please check the VIN or enter details manually.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error checking VIN:', error)
      setVinStatus('invalid')
      setScanError('Failed to check VIN. Please try again.')
      toast({
        title: "Error",
        description: "Failed to check VIN. Please check your internet connection.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [onVehicleDataFound, toast])

  const handleVinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVin = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '') // Only allow alphanumeric, uppercase
    setVin(newVin)
    if (newVin.length === 17) {
      checkVin(newVin)
    } else {
      setVinStatus('idle')
    }
  }

  const handleVinDetectedFromScanner = (scannedVin: string) => {
    setVin(scannedVin)
    setIsScanning(false) // Stop scanning once VIN is detected
    checkVin(scannedVin)
  }

  const startScanning = () => {
    setScanError(null); // Clear any previous scan errors
    setIsScanning(true);
  }

  const stopScanning = () => {
    setIsScanning(false);
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Car className="w-5 h-5" />
          <span>Smart VIN Input</span>
        </CardTitle>
        <CardDescription>
          Enter VIN manually or scan with camera to auto-fill vehicle details.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col space-y-6">
        {/* VIN Input Section */}
        <div className="space-y-2">
          <Label htmlFor="vin">Vehicle Identification Number (VIN)</Label>
          <div className="flex space-x-2">
            <Input
              id="vin"
              name="vin"
              placeholder="17-character VIN"
              value={vin}
              onChange={handleVinChange}
              className="font-mono uppercase flex-grow"
              maxLength={17}
              disabled={isLoading || disabled || isScanning} // Disable input while scanning
            />
            <Button
              type="button"
              onClick={startScanning} // <-- Botón para iniciar el escaneo
              disabled={isLoading || disabled || isScanning}
              className="shrink-0"
            >
              <Scan className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-gray-500 flex items-center justify-between">
            <span>{vin.length}/17 characters</span>
            {vinStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
            {vinStatus === 'valid' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {vinStatus === 'invalid' && <XCircle className="h-4 w-4 text-red-500" />}
          </div>
        </div>

        {/* Scanner Section */}
        {isScanning && ( // <-- Renderiza el escáner SOLO si isScanning es true
          <div className="relative w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden flex items-center justify-center">
            <DynamicVinScanner onVinDetected={handleVinDetectedFromScanner} onError={(error) => setScanError(error)} />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 z-10"
              onClick={stopScanning} // <-- Botón para detener el escaneo
            >
              Stop Scan
            </Button>
          </div>
        )}

        {scanError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Scan Error</AlertTitle>
            <AlertDescription>{scanError}</AlertDescription>
          </Alert>
        )}

        {/* VIN Details Section (Optional, based on your original SmartVinInput logic) */}
        {/* ... (Your existing VIN details display logic goes here) ... */}
      </CardContent>
    </Card>
  )
}