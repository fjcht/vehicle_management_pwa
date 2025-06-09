'use client' // Asegúrate de que esta línea esté presente si usas hooks o APIs del navegador

import { useState } from 'react'
// ELIMINA: import { VinScanner } from '@/app/components/vin-scanner'
import dynamic from 'next/dynamic'; // <-- Importa dynamic
import { NHTSAVehicleData } from '@/app/lib/nhtsa'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { ArrowLeft } from 'lucide-react'

// Carga dinámica del componente VinScanner con ssr: false
const DynamicVinScanner = dynamic(() => import('@/app/components/vin-scanner').then(mod => mod.VinScanner), {
  ssr: false, // <-- ¡CRUCIAL! No renderizar en el servidor
  loading: () => (
    <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-gray-600 dark:text-gray-300">Loading VIN scanner...</p>
    </div>
  ),
});

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
          // Usa el componente cargado dinámicamente aquí
          <DynamicVinScanner onVinDetected={handleVinDetected} />
        )}
      </div>
    </main>
  )
}