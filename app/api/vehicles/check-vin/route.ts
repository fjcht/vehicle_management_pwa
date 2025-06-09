import { NextResponse } from 'next/server';

// Suponiendo que tienes una forma de interactuar con tu base de datos
// Esto es un placeholder. Reemplázalo con tu ORM, cliente de DB, etc.
async function findVehicleByVinInDatabase(vin: string) {
  // --- REEMPLAZA ESTA LÓGICA CON TU CONSULTA REAL A LA BASE DE DATOS ---
  const mockDatabase = [
    { vin: 'WP0AA29963S620150', make: 'Porsche', model: '911', year: 2015, color: 'Red', source: 'database' },
    { vin: '2GCEK19T741344731', make: 'Chevrolet', model: 'Silverado', year: 2004, color: 'Blue', source: 'database' },
    // ... más vehículos
  ];

  const foundVehicle = mockDatabase.find(v => v.vin === vin);
  return foundVehicle || null;
  // --- FIN DEL REEMPLAZO ---
}

// Función para llamar a tu propia API de NHTSA internamente
async function fetchVinDataFromNHTSAApi(vin: string) {
  try {
    // Llama a tu propia ruta de API de NHTSA
    // Importante: Usa la URL completa si estás en un entorno de servidor,
    // o una ruta relativa si estás seguro de que el contexto lo permite.
    // Para Vercel, es seguro usar la ruta relativa /api/nhtsa/${vin}
    const response = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/api/nhtsa/${vin}`);

    if (!response.ok) {
      // Si tu API de NHTSA devuelve un error (ej. 400, 500), lo manejamos aquí
      const errorData = await response.json();
      console.error(`Error from internal NHTSA API for VIN ${vin}:`, errorData);
      return null; // O lanzar un error si quieres que el check-vin falle
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch VIN data from internal NHTSA API for ${vin}:`, error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vin = searchParams.get('vin');

  if (!vin) {
    return NextResponse.json({ error: 'VIN parameter is missing' }, { status: 400 });
  }

  console.log(`[API] Received VIN for check: ${vin}`);

  try {
    // 1. Intentar encontrar el VIN en tu base de datos
    const vehicleData = await findVehicleByVinInDatabase(vin);

    if (vehicleData) {
      console.log(`[API] VIN ${vin} found in database. Returning existing data.`);
      return NextResponse.json({
        vin,
        found: true,
        message: `VIN ${vin} already exists in your system.`,
        data: vehicleData
      });
    } else {
      // 2. Si no se encuentra en la base de datos, intentar decodificarlo con NHTSA
      console.log(`[API] VIN ${vin} not found in database. Attempting NHTSA decode...`);
      const nhtsaData = await fetchVinDataFromNHTSAApi(vin);

      if (nhtsaData && nhtsaData.Results && nhtsaData.Results.length > 0 && nhtsaData.Results[0].ErrorCode === '0') {
        // NHTSA encontró datos válidos
        console.log(`[API] VIN ${vin} decoded successfully by NHTSA.`);
        // Puedes procesar los resultados de NHTSA para un formato más amigable si lo deseas
        const decodedInfo = nhtsaData.Results.reduce((acc: any, item: any) => {
          if (item.Value && item.Variable) {
            acc[item.Variable.replace(/\s/g, '')] = item.Value; // Ejemplo: "Make" -> "Make"
          }
          return acc;
        }, {});

        return NextResponse.json({
          vin,
          found: false, // Sigue siendo 'false' porque no está en TU base de datos
          message: `VIN ${vin} is new. Decoded info from NHTSA available.`,
          data: { ...decodedInfo, source: 'nhtsa_api' } // Añade la fuente de los datos
        });
      } else {
        // NHTSA no encontró datos o hubo un error
        console.log(`[API] VIN ${vin} not found in database and could not be decoded by NHTSA.`);
        return NextResponse.json({
          vin,
          found: false,
          message: `VIN ${vin} is new, but no decode information available from NHTSA.`,
          data: null // No hay datos de NHTSA
        });
      }
    }
  } catch (error: any) {
    console.error('Error during VIN check process:', error);
    return NextResponse.json({ error: 'Failed to process VIN check', details: error.message }, { status: 500 });
  }
}