'use client' // Asegúrate de que esta línea esté presente si usas hooks o APIs del navegador

import { useState } from 'react'
import { VinScanner } from '@/app/components/vin-scanner'
import { NHTSAVehicleData } from '@/app/lib/nhtsa'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function HomePage() {
  const [vinData, setVinData] = useState<{ vin: string; data?: NHTSAVehicleData } | null>(null)

  const handleVinDetected = (vin: string, data?: NHTSAVehicleData) => {
    setVinData({ vin, data })
  }

  const handleReset = () => {
    setVinData(null)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md">
        {vinData ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>VIN Details</span>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Scan New VIN
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg font-semibold">Detected VIN: {vinData.vin}</p>
              {vinData.data ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {vinData.data.Make && <p><strong>Make:</strong> {vinData.data.Make}</p>}
                  {vinData.data.Model && <p><strong>Model:</strong> {vinData.data.Model}</p>}
                  {vinData.data.ModelYear && <p><strong>Year:</strong> {vinData.data.ModelYear}</p>}
                  {vinData.data.BodyClass && <p><strong>Body Class:</strong> {vinData.data.BodyClass}</p>}
                  {vinData.data.VehicleType && <p><strong>Vehicle Type:</strong> {vinData.data.VehicleType}</p>}
                  {vinData.data.EngineCylinders && <p><strong>Cylinders:</strong> {vinData.data.EngineCylinders}</p>}
                  {vinData.data.FuelTypePrimary && <p><strong>Fuel Type:</strong> {vinData.data.FuelTypePrimary}</p>}
                  {vinData.data.ManufacturerName && <p><strong>Manufacturer:</strong> {vinData.data.ManufacturerName}</p>}
                  {/* Add more details as needed */}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No additional vehicle data found for this VIN.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <VinScanner onVinDetected={handleVinDetected} />
        )}
      </div>
    </main>
  )
}