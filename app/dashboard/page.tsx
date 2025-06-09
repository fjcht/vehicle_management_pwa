'use client';

import { useState, useEffect } from 'react';
import SmartVinInput from '@/app/components/smart-vin-input';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

// Función simulada para decodificar el VIN
// En un entorno real, esto sería una llamada a una API externa
const decodeVin = (vin: string) => {
  // Simulación de datos de decodificación
  const decodedData: { [key: string]: { make: string; model: string; year: string; color: string } } = {
    '1234567890ABCDEFGH': { make: 'Toyota', model: 'Camry', year: '2023', color: 'Negro' },
    'ABCDEFGHIJKLMN1234': { make: 'Honda', model: 'Civic', year: '2022', color: 'Blanco' },
    'XYZ1234567890ABCD': { make: 'Ford', model: 'F-150', year: '2024', color: 'Rojo' },
    // Puedes añadir más VINs de ejemplo aquí
  };

  return decodedData[vin.toUpperCase()] || null;
};

export default function DashboardPage() {
  const [vin, setVin] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [mileage, setMileage] = useState('');
  const [lastServiceDate, setLastServiceDate] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Para manejar el estado de envío

  const handleVinChange = (newVin: string) => {
    setVin(newVin);
    // Lógica para decodificar el VIN y rellenar otros campos
    const decodedInfo = decodeVin(newVin);
    if (decodedInfo) {
      setMake(decodedInfo.make);
      setModel(decodedInfo.model);
      setYear(decodedInfo.year);
      setColor(decodedInfo.color);
    } else {
      // Si el VIN no se reconoce, puedes limpiar los campos o dejar que el usuario los rellene
      // setMake('');
      // setModel('');
      // setYear('');
      // setColor('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); // Deshabilita el botón mientras se envía

    const vehicleData = {
      vin,
      make,
      model,
      year,
      color,
      licensePlate,
      mileage: parseFloat(mileage), // Convertir a número
      lastServiceDate,
      nextServiceDate,
      notes,
    };

    console.log('Intentando guardar vehículo:', vehicleData);

    try {
      // Aquí harías una llamada a tu API para guardar los datos
      // Ejemplo con fetch API:
      const response = await fetch('/api/vehicles', { // Asume que tienes una API en /api/vehicles
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Vehículo guardado con éxito:', result);
        alert('Vehículo guardado con éxito!');
        // Opcional: Limpiar el formulario después de un envío exitoso
        setVin('');
        setMake('');
        setModel('');
        setYear('');
        setColor('');
        setLicensePlate('');
        setMileage('');
        setLastServiceDate('');
        setNextServiceDate('');
        setNotes('');
      } else {
        const errorData = await response.json();
        console.error('Error al guardar vehículo:', errorData);
        alert(`Error al guardar vehículo: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error de red o inesperado:', error);
      alert('Ocurrió un error inesperado al guardar el vehículo.');
    } finally {
      setIsSubmitting(false); // Habilita el botón de nuevo
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h3 className="text-2xl font-bold mb-6">Añadir Nuevo Vehículo</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="vin">VIN</Label>
          <SmartVinInput id="vin" value={vin} onChange={handleVinChange} />
        </div>

        <div>
          <Label htmlFor="make">Marca</Label>
          <Input
            id="make"
            type="text"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="Ej: Toyota"
          />
        </div>

        <div>
          <Label htmlFor="model">Modelo</Label>
          <Input
            id="model"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Ej: Camry"
          />
        </div>

        <div>
          <Label htmlFor="year">Año</Label>
          <Input
            id="year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Ej: 2023"
          />
        </div>

        <div>
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Ej: Negro"
          />
        </div>

        <div>
          <Label htmlFor="licensePlate">Matrícula</Label>
          <Input
            id="licensePlate"
            type="text"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
            placeholder="Ej: ABC-123"
          />
        </div>

        <div>
          <Label htmlFor="mileage">Kilometraje</Label>
          <Input
            id="mileage"
            type="number"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            placeholder="Ej: 50000"
          />
        </div>

        <div>
          <Label htmlFor="lastServiceDate">Fecha Último Servicio</Label>
          <Input
            id="lastServiceDate"
            type="date"
            value={lastServiceDate}
            onChange={(e) => setLastServiceDate(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="nextServiceDate">Fecha Próximo Servicio</Label>
          <Input
            id="nextServiceDate"
            type="date"
            value={nextServiceDate}
            onChange={(e) => setNextServiceDate(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="notes">Notas</Label>
          <Input
            id="notes"
            type="textarea" // Nota: Input de shadcn/ui no tiene type="textarea", deberías usar un <Textarea> si lo tienes. Si no, esto será un input de texto normal.
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Añade cualquier nota relevante aquí..."
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar Vehículo'}
        </Button>
      </form>
    </div>
  );
}