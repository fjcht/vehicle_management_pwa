import { NextResponse } from 'next/server';

// Suponiendo que tienes una forma de interactuar con tu base de datos
// Esto es un placeholder. Reemplázalo con tu ORM, cliente de DB, etc.
// Por ejemplo, si usas Prisma, esto podría ser `prisma.vehicle.findUnique({ where: { vin } })`
async function findVehicleByVinInDatabase(vin: string) {
  // --- REEMPLAZA ESTA LÓGICA CON TU CONSULTA REAL A LA BASE DE DATOS ---
  // Ejemplo de simulación de base de datos:
  const mockDatabase = [
    { vin: 'WP0AA29963S620150', make: 'Porsche', model: '911', year: 2015, color: 'Red' },
    { vin: '2GCEK19T741344731', make: 'Chevrolet', model: 'Silverado', year: 2004, color: 'Blue' },
    // ... más vehículos
  ];

  const foundVehicle = mockDatabase.find(v => v.vin === vin);
  return foundVehicle || null; // Devuelve el vehículo si lo encuentra, o null
  // --- FIN DEL REEMPLAZO ---
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vin = searchParams.get('vin');

  if (!vin) {
    return NextResponse.json({ error: 'VIN parameter is missing' }, { status: 400 });
  }

  console.log(`[API] Received VIN for check: ${vin}`);

  try {
    const vehicleData = await findVehicleByVinInDatabase(vin);

    if (vehicleData) {
      console.log(`[API] VIN ${vin} found. Returning existing data.`);
      return NextResponse.json({
        vin,
        found: true,
        message: `VIN ${vin} already exists.`,
        data: vehicleData // ¡Aquí se incluye la información del vehículo!
      });
    } else {
      console.log(`[API] VIN ${vin} not found. It's available.`);
      return NextResponse.json({
        vin,
        found: false,
        message: `VIN ${vin} is available.`
      });
    }
  } catch (error: any) {
    console.error('Error checking VIN in database:', error);
    return NextResponse.json({ error: 'Failed to check VIN', details: error.message }, { status: 500 });
  }
}