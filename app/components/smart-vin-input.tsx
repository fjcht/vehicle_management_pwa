'use client'

import { useState, useEffect } from 'react'
import { Search, Camera, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { VinScanner } from '@/app/components/vin-scanner'
import { useToast } from '@/app/hooks/use-toast'

interface VehicleData {
  id?: string
  vin?: string
  licensePlate?: string
  make?: string
  model?: string
  year?: number
  color?: string
  engineType?: string
  transmission?: string
  fuelType?: string
  mileage?: number
  parkingSpot?: string
  client?: {
    id: string
    name: string
    phone?: string
    email?: string
  } | null
  assignedTo?: {
    id: string
    name: string
  } | null
  source?: 'database' | 'nhtsa_api'
  nhtsaData?: any
}

interface SmartVinInputProps {
  onVehicleDataFound: (data: VehicleData, source: 'database' | 'nhtsa') => void
  initialVin?: string
  disabled?: boolean
}

export function SmartVinInput({ onVehicleDataFound, initialVin = '', disabled = false }: SmartVinInputProps) {
  const [vin, setVin] = useState(initialVin)
  const [isLoading, setIsLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [lastSearchedVin, setLastSearchedVin] = useState('')
  const [searchResult, setSearchResult] = useState<{
    found: boolean
    message: string
    data: VehicleData | null
  } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    setVin(initialVin)
  }, [initialVin])

  const validateVin = (vinCode: string): boolean => {
    // Validación básica de VIN (17 caracteres alfanuméricos)
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i
    return vinRegex.test(vinCode)
  }

  const searchVin = async (vinCode: string) => {
    if (!vinCode || vinCode.length !== 17) {
      toast({
        title: "Invalid VIN",
        description: "VIN must be exactly 17 characters long",
        variant: "destructive"
      })
      return
    }

    if (!validateVin(vinCode)) {
      toast({
        title: "Invalid VIN Format",
        description: "VIN contains invalid characters. Only letters (except I, O, Q) and numbers are allowed.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    setLastSearchedVin(vinCode.toUpperCase())

    try {
      console.log(`[SmartVinInput] Searching for VIN: ${vinCode}`)
      
      // Llamar a la API de check-vin
      const response = await fetch(`/api/vehicles/check-vin?vin=${encodeURIComponent(vinCode.toUpperCase())}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to search VIN')
      }

      const result = await response.json()
      console.log(`[SmartVinInput] Search result:`, result)

      setSearchResult(result)

      if (result.found && result.data) {
        // VIN encontrado en la base de datos
        toast({
          title: "Vehicle Found",
          description: result.message,
          variant: "default"
        })
        onVehicleDataFound(result.data, 'database')
      } else if (!result.found && result.data) {
        // VIN no encontrado en BD pero decodificado por NHTSA
        toast({
          title: "New Vehicle",
          description: result.message,
          variant: "default"
        })
        onVehicleDataFound(result.data, 'nhtsa')
      } else {
        // VIN no encontrado y no se pudo decodificar
        toast({
          title: "VIN Not Found",
          description: result.message || "No information available for this VIN",
          variant: "destructive"
        })
        setSearchResult(result)
      }

    } catch (error) {
      console.error('Error searching VIN:', error)
      toast({
        title: "Search Error",
        description: error instanceof Error ? error.message : "Failed to search VIN",
        variant: "destructive"
      })
      setSearchResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '')
    if (value.length <= 17) {
      setVin(value)
      // Limpiar resultado anterior si el VIN cambia
      if (value !== lastSearchedVin) {
        setSearchResult(null)
      }
    }
  }

  const handleSearch = () => {
    if (vin.trim()) {
      searchVin(vin.trim())
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && vin.trim() && !isLoading) {
      handleSearch()
    }
  }

  const handleVinDetected = (scannedVin: string) => {
    console.log(`[SmartVinInput] 🔍 VIN detected from scanner: ${scannedVin}`)
    setVin(scannedVin.toUpperCase())
    setShowScanner(false)
    
    console.log(`[SmartVinInput] 🔍 About to auto-search VIN: ${scannedVin}`)
    // Auto-search después de escanear
    setTimeout(() => {
      searchVin(scannedVin)
    }, 500)
  }

  return (
    <div className="bg-white shadow-lg rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-2">
          <Search className="w-5 h-5" />
          <h3 className="text-lg font-semibold">VIN Lookup</h3>
        </div>
        <p className="text-sm text-gray-600">
          Enter or scan a VIN to search for vehicle information
        </p>
      </div>
      <div className="p-6 space-y-4">
        {/* VIN Input */}
        <div className="space-y-2">
          <label htmlFor="vin-input" className="text-sm font-medium text-gray-700">
            Vehicle Identification Number (VIN)
          </label>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Input
                id="vin-input"
                placeholder="Enter 17-character VIN"
                value={vin}
                onChange={handleVinChange}
                onKeyPress={handleKeyPress}
                className="font-mono uppercase pr-12"
                maxLength={17}
                disabled={disabled || isLoading}
              />
              <div className="absolute right-3 top-3 text-xs text-gray-500">
                {vin.length}/17
              </div>
            </div>
            <Button
              onClick={handleSearch}
              disabled={!vin.trim() || vin.length !== 17 || isLoading || disabled}
              size="default"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Scanner Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowScanner(!showScanner)}
            disabled={disabled || isLoading}
            className="w-full"
          >
            <Camera className="w-4 h-4 mr-2" />
            {showScanner ? 'Hide Scanner' : 'Scan VIN Code'}
          </Button>
        </div>

        {/* Scanner Component */}
        {showScanner && (
          <div className="border rounded-lg p-4">
            <VinScanner
              onVinDetected={handleVinDetected}
              onError={(error) => {
                console.error('[SmartVinInput] Scanner error:', error)
                toast({
                  title: "Scanner Error",
                  description: error,
                  variant: "destructive"
                })
              }}
            />
          </div>
        )}

        {/* Search Results */}
        {searchResult && (
          <div className="space-y-2">
            {searchResult.found ? (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800">
                      <strong>Vehicle Found!</strong> {searchResult.message}
                    </p>
                    {searchResult.data?.client && (
                      <p className="text-sm text-green-700 mt-1">
                        Owner: <strong>{searchResult.data.client.name}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : searchResult.data ? (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>New Vehicle</strong> - {searchResult.message}
                </p>
              </div>
            ) : (
              <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    <strong>No Information Found</strong> - {searchResult.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIN Validation Helper */}
        {vin && vin.length > 0 && vin.length < 17 && (
          <div className="text-sm text-gray-500">
            VIN must be exactly 17 characters long
          </div>
        )}

        {vin && vin.length === 17 && !validateVin(vin) && (
          <div className="border border-red-200 bg-red-50 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">
                Invalid VIN format. VIN cannot contain the letters I, O, or Q.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
