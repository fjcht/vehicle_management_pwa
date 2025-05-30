
'use client'

import { useState, useCallback } from 'react'
import { Search, Database, Globe, Check, AlertCircle, Loader2, Camera } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { VinScanner } from './vin-scanner'
import { useToast } from '@/hooks/use-toast'
import { NHTSAVehicleData } from '@/lib/nhtsa'

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
  }
  assignedTo?: {
    id: string
    name: string
  }
}

interface SmartVinInputProps {
  onVehicleDataFound: (data: VehicleData, source: 'database' | 'nhtsa') => void
  initialVin?: string
  disabled?: boolean
}

export function SmartVinInput({ onVehicleDataFound, initialVin = '', disabled = false }: SmartVinInputProps) {
  const [vin, setVin] = useState(initialVin)
  const [isSearching, setIsSearching] = useState(false)
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching-db' | 'searching-nhtsa' | 'found' | 'not-found' | 'error'>('idle')
  const [foundData, setFoundData] = useState<VehicleData | null>(null)
  const [dataSource, setDataSource] = useState<'database' | 'nhtsa' | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const { toast } = useToast()

  const validateVin = (vinValue: string): boolean => {
    return vinValue.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/i.test(vinValue)
  }

  const searchVinInDatabase = async (vinValue: string): Promise<VehicleData | null> => {
    try {
      const response = await fetch(`/api/vehicles/vin/${vinValue}`)
      const result = await response.json()
      
      if (response.ok && result.found) {
        return result.vehicle
      }
      return null
    } catch (error) {
      console.error('Error searching VIN in database:', error)
      throw error
    }
  }

  const searchVinInNHTSA = async (vinValue: string): Promise<VehicleData | null> => {
    try {
      const response = await fetch(`/api/nhtsa/${vinValue}`)
      const result = await response.json()
      
      if (response.ok && result.success) {
        const nhtsaData = result.data as NHTSAVehicleData
        return {
          vin: vinValue,
          make: nhtsaData.Make || '',
          model: nhtsaData.Model || '',
          year: nhtsaData.ModelYear ? parseInt(nhtsaData.ModelYear) : undefined,
          engineType: nhtsaData.EngineModel || '',
          transmission: nhtsaData.TransmissionStyle || '',
          fuelType: nhtsaData.FuelTypePrimary || ''
        }
      }
      return null
    } catch (error) {
      console.error('Error searching VIN in NHTSA:', error)
      throw error
    }
  }

  const handleVinSearch = useCallback(async (vinValue: string) => {
    if (!validateVin(vinValue)) {
      toast({
        title: "Invalid VIN",
        description: "VIN must be exactly 17 characters and contain only valid characters (A-H, J-N, P-R, Z, 0-9)",
        variant: "destructive"
      })
      return
    }

    setIsSearching(true)
    setSearchStatus('searching-db')
    setFoundData(null)
    setDataSource(null)

    try {
      // First, search in local database
      const dbResult = await searchVinInDatabase(vinValue)
      
      if (dbResult) {
        setFoundData(dbResult)
        setDataSource('database')
        setSearchStatus('found')
        onVehicleDataFound(dbResult, 'database')
        toast({
          title: "Vehicle Found",
          description: "Vehicle information loaded from database",
        })
        return
      }

      // If not found in database, search NHTSA
      setSearchStatus('searching-nhtsa')
      const nhtsaResult = await searchVinInNHTSA(vinValue)
      
      if (nhtsaResult) {
        setFoundData(nhtsaResult)
        setDataSource('nhtsa')
        setSearchStatus('found')
        onVehicleDataFound(nhtsaResult, 'nhtsa')
        toast({
          title: "Vehicle Information Retrieved",
          description: "Vehicle details obtained from NHTSA database",
        })
      } else {
        setSearchStatus('not-found')
        toast({
          title: "VIN Not Found",
          description: "No vehicle information found for this VIN",
          variant: "destructive"
        })
      }

    } catch (error) {
      console.error('Error during VIN search:', error)
      setSearchStatus('error')
      toast({
        title: "Search Error",
        description: "Failed to search for vehicle information",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }, [onVehicleDataFound, toast])

  const handleVinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setVin(value)
    if (searchStatus !== 'idle') {
      setSearchStatus('idle')
      setFoundData(null)
      setDataSource(null)
    }
  }

  const handleVinFromScanner = (scannedVin: string, vehicleData?: NHTSAVehicleData) => {
    setVin(scannedVin)
    setShowScanner(false)
    
    if (vehicleData) {
      const data: VehicleData = {
        vin: scannedVin,
        make: vehicleData.Make || '',
        model: vehicleData.Model || '',
        year: vehicleData.ModelYear ? parseInt(vehicleData.ModelYear) : undefined,
        engineType: vehicleData.EngineModel || '',
        transmission: vehicleData.TransmissionStyle || '',
        fuelType: vehicleData.FuelTypePrimary || ''
      }
      setFoundData(data)
      setDataSource('nhtsa')
      setSearchStatus('found')
      onVehicleDataFound(data, 'nhtsa')
    } else {
      // If scanner didn't get NHTSA data, trigger our smart search
      handleVinSearch(scannedVin)
    }
  }

  const getStatusIcon = () => {
    switch (searchStatus) {
      case 'searching-db':
      case 'searching-nhtsa':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'found':
        return <Check className="w-4 h-4 text-green-500" />
      case 'not-found':
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    switch (searchStatus) {
      case 'searching-db':
        return 'Searching in database...'
      case 'searching-nhtsa':
        return 'Searching NHTSA database...'
      case 'found':
        return dataSource === 'database' 
          ? 'Vehicle found in database' 
          : 'Vehicle information retrieved from NHTSA'
      case 'not-found':
        return 'VIN not found in any database'
      case 'error':
        return 'Error occurred during search'
      default:
        return ''
    }
  }

  if (showScanner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>VIN Scanner</span>
            <Button variant="outline" size="sm" onClick={() => setShowScanner(false)}>
              Back to Manual Entry
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VinScanner 
            onVinDetected={handleVinFromScanner}
            initialVin={vin}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Smart VIN Lookup</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* VIN Input */}
        <div className="space-y-2">
          <Label htmlFor="vin-input">Vehicle Identification Number (VIN)</Label>
          <div className="flex space-x-2">
            <Input
              id="vin-input"
              value={vin}
              onChange={handleVinChange}
              placeholder="Enter 17-character VIN"
              maxLength={17}
              className="font-mono uppercase"
              disabled={disabled || isSearching}
            />
            <Button
              onClick={() => setShowScanner(true)}
              variant="outline"
              size="icon"
              disabled={disabled || isSearching}
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>{vin.length}/17 characters</span>
            {vin.length === 17 && (
              <span className={validateVin(vin) ? "text-green-600" : "text-red-600"}>
                {validateVin(vin) ? "Valid format" : "Invalid format"}
              </span>
            )}
          </div>
        </div>

        {/* Search Button */}
        <Button
          onClick={() => handleVinSearch(vin)}
          disabled={!validateVin(vin) || isSearching || disabled}
          className="w-full"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Search Vehicle Information
            </>
          )}
        </Button>

        {/* Status Display */}
        {searchStatus !== 'idle' && (
          <Alert className={
            searchStatus === 'found' ? 'border-green-200 bg-green-50' :
            searchStatus === 'error' || searchStatus === 'not-found' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }>
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <AlertDescription>{getStatusMessage()}</AlertDescription>
            </div>
          </Alert>
        )}

        {/* Found Data Display */}
        {foundData && searchStatus === 'found' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Vehicle Information Found:</Label>
              <Badge variant={dataSource === 'database' ? 'default' : 'secondary'}>
                {dataSource === 'database' ? (
                  <>
                    <Database className="w-3 h-3 mr-1" />
                    Database
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3 mr-1" />
                    NHTSA
                  </>
                )}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {foundData.make && (
                <Badge variant="outline">Make: {foundData.make}</Badge>
              )}
              {foundData.model && (
                <Badge variant="outline">Model: {foundData.model}</Badge>
              )}
              {foundData.year && (
                <Badge variant="outline">Year: {foundData.year}</Badge>
              )}
              {foundData.fuelType && (
                <Badge variant="outline">Fuel: {foundData.fuelType}</Badge>
              )}
              {foundData.engineType && (
                <Badge variant="outline">Engine: {foundData.engineType}</Badge>
              )}
              {foundData.transmission && (
                <Badge variant="outline">Trans: {foundData.transmission}</Badge>
              )}
            </div>

            {/* Existing Vehicle Warning */}
            {dataSource === 'database' && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  This vehicle already exists in your database. 
                  {foundData.client && ` Owner: ${foundData.client.name}`}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
