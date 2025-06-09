// app/dashboard/page.tsx (o la página donde tienes el formulario del vehículo)
'use client'; // Asegúrate de que sea un Client Component si usas useState y eventos

import { useState, useEffect } from 'react';
import SmartVinInput from '@/app/components/smart-vin-input'; // Asegúrate de la ruta correcta
import { Button } from '@/app/components/ui/button'; // Si usas shadcn/ui
import { Input } from '@/app/components/ui/input'; // Si usas shadcn/ui
import { Label } from '@/app/components/ui/label'; // Si usas shadcn/ui

export default function DashboardPage() {
  // 1. Estados para los campos del formulario del vehículo
  const [vin, setVin] = useState<string>('');
  const [make, setMake] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [modelYear, setModelYear] = useState<string>(''); // Usar string para input
  const [bodyClass, setBodyClass] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('');
  const [engineCylinders, setEngineCylinders] = useState<string>('');
  const [fuelType, setFuelType] = useState<string>('');
  const [plantCountry, setPlantCountry] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 2. Función para manejar el VIN detectado/introducido
  const handleVinDetected = async (detectedVin: string) => {
    setVin(detectedVin); // Actualiza el estado del VIN en el formulario
    setStatusMessage('Verificando VIN...');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/vehicles/check-vin?vin=${detectedVin}`);
      const result = await response.json(); // result.data contendrá la info decodificada

      if (response.ok && result.data) {
        console.log('Datos del vehículo recibidos:', result.data);
        setStatusMessage(result.message);

        // 3. Rellenar los campos del formulario con los datos de la API
        setMake(result.data.make || '');
        setModel(result.data.model || '');
        setModelYear(result.data.modelYear ? String(result.data.modelYear) : '');
        setBodyClass(result.data.bodyClass || '');
        setVehicleType(result.data.vehicleType || '');
        setEngineCylinders(result.data.engineCylinders ? String(result.data.engineCylinders) : '');
        setFuelType(result.data.fuelType || '');
        setPlantCountry(result.data.plantCountry || '');

        // Puedes añadir más campos aquí según lo que devuelva tu API y necesites
        // Por ejemplo, si tu API devuelve 'doors', 'transmissionStyle', etc.
        // setDoors(result.data.doors ? String(result.data.doors) : '');
        // setTransmissionStyle(result.data.transmissionStyle || '');

      } else {
        console.error('Error o VIN no decodificado:', result.message);
        setStatusMessage(result.message || 'No se pudo obtener información del VIN.');
        // Opcional: Limpiar campos si el VIN no se decodificó o hubo un error
        setMake('');
        setModel('');
        setModelYear('');
        setBodyClass('');
        setVehicleType('');
        setEngineCylinders('');
        setFuelType('');
        setPlantCountry('');
      }
    } catch (error) {
      console.error('Error al verificar el VIN:', error);
      setStatusMessage('Error de red al verificar el VIN.');
      setMake('');
      setModel('');
      setModelYear('');
      setBodyClass('');
      setVehicleType('');
      setEngineCylinders('');
      setFuelType('');
      setPlantCountry('');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar el cambio manual del VIN en el input
  const handleVinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVin = e.target.value.toUpperCase(); // Convertir a mayúsculas
    setVin(newVin);
    // Opcional: Si quieres que se verifique automáticamente al escribir,
    // puedes llamar a handleVinDetected aquí con un debounce.
    // Por ahora, lo haremos con un botón o al perder el foco.
  };

  // Función para verificar el VIN cuando se presiona un botón o se pierde el foco
  const triggerVinCheck = () => {
    if (vin) {
      handleVinDetected(vin);
    } else {
      setStatusMessage('Por favor, introduce un VIN.');
    }
  };


  return (
    <div className="container mx-auto p-4">
      <h3 className="text-2xl font-bold mb-4">Gestión de Vehículos</h3>

      <div className="mb-6 p-4 border rounded-lg shadow-sm">
        <h4 className="text-xl font-semibold mb-3">Verificar VIN</h4>
        <SmartVinInput onVinDetected={handleVinDetected} /> {/* Pasa la función al SmartVinInput */}

        <div className="mt-4">
          <Label htmlFor="vinInput" className="block text-sm font-medium text-gray-700 mb-1">
            O introduce el VIN manualmente:
          </Label>
          <div className="flex space-x-2">
            <Input
              id="vinInput"
              type="text"
              value={vin}
              onChange={handleVinInputChange}
              placeholder="Introduce el VIN aquí"
              className="flex-grow"
              maxLength={17} // Los VINs tienen 17 caracteres
            />
            <Button onClick={triggerVinCheck} disabled={isLoading || !vin}>
              {isLoading ? 'Verificando...' : 'Verificar VIN'}
            </Button>
          </div>
        </div>

        {statusMessage && (
          <p className={`mt-3 text-sm ${statusMessage.includes('Error') || statusMessage.includes('No se pudo') ? 'text-red-600' : 'text-green-600'}`}>
            {statusMessage}
          </p>
        )}
      </div>

      {/* Formulario para mostrar los datos del vehículo */}
      <div className="p-4 border rounded-lg shadow-sm">
        <h4 className="text-xl font-semibold mb-3">Detalles del Vehículo</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="make">Marca</Label>
            <Input id="make" type="text" value={make} onChange={(e) => setMake(e.target.value)} placeholder="Marca" />
          </div>
          <div>
            <Label htmlFor="model">Modelo</Label>
            <Input id="model" type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Modelo" />
          </div>
          <div>
            <Label htmlFor="modelYear">Año del Modelo</Label>
            <Input id="modelYear" type="text" value={modelYear} onChange={(e) => setModelYear(e.target.value)} placeholder="Año" />
          </div>
          <div>
            <Label htmlFor="bodyClass">Clase de Carrocería</Label>
            <Input id="bodyClass" type="text" value={bodyClass} onChange={(e) => setBodyClass(e.target.value)} placeholder="Clase de Carrocería" />
          </div>
          <div>
            <Label htmlFor="vehicleType">Tipo de Vehículo</Label>
            <Input id="vehicleType" type="text" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="Tipo de Vehículo" />
          </div>
          <div>
            <Label htmlFor="engineCylinders">Cilindros del Motor</Label>
            <Input id="engineCylinders" type="text" value={engineCylinders} onChange={(e) => setEngineCylinders(e.target.value)} placeholder="Cilindros" />
          </div>
          <div>
            <Label htmlFor="fuelType">Tipo de Combustible</Label>
            <Input id="fuelType" type="text" value={fuelType} onChange={(e) => setFuelType(e.target.value)} placeholder="Tipo de Combustible" />
          </div>
          <div>
            <Label htmlFor="plantCountry">País de Fabricación</Label>
            <Input id="plantCountry" type="text" value={plantCountry} onChange={(e) => setPlantCountry(e.target.value)} placeholder="País de Fabricación" />
          </div>
          {/* Añade más campos aquí según los datos que quieras mostrar */}
        </div>
        <Button className="mt-4">Guardar Vehículo</Button> {/* Ejemplo de botón para guardar */}
      </div>
    </div>
  );
}