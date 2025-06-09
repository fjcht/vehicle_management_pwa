import { NextResponse } from 'next/server';

// Suponiendo que tienes una forma de interactuar con tu base de datos
// Esto es un placeholder. Reemplázalo con tu ORM, cliente de DB, etc.
async function findVehicleByVinInDatabase(vin: string) {
  // --- REEMPLAZA ESTA LÓGICA CON TU CONSULTA REAL A LA BASE DE DATOS ---
  const mockDatabase = [
    { vin: 'WP0AA29963S620150', make: 'Porsche', model: '911', year: 2015, color: 'Red', source: 'database' },
    { vin: '2GCEK19T741344731', make: 'Chevrolet', model: 'Silverado', year: 2004, color: 'Blue', source: 'database' },
    // Añade el VIN que estás probando manualmente aquí para simular que no está en la DB
    // y forzar la llamada a NHTSA.
    // { vin: 'WP0CA29941S650320', make: 'Simulated', model: 'Test', year: 2023, source: 'database' },
  ];

  const foundVehicle = mockDatabase.find(v => v.vin === vin);
  return foundVehicle || null;
  // --- FIN DEL REEMPLAZO ---
}


// Función para llamar DIRECTAMENTE a la API externa de NHTSA
async function fetchVinDataFromNHTSAApi(vin: string) {
  // CAMBIO CLAVE: La URL ahora apunta directamente a la API de NHTSA
  const externalNHTSAUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`;
  console.log(`[check-vin] Calling EXTERNAL NHTSA API: ${externalNHTSAUrl}`); // LOG AÑADIDO

  try {
    const response = await fetch(externalNHTSAUrl); // Llama a la API externa
    console.log(`[check-vin] EXTERNAL NHTSA API response status: ${response.status}`); // LOG AÑADIDO

    if (!response.ok) {
      // Leer como texto para evitar JSON parse error si la respuesta no es JSON
      const errorText = await response.text();
      console.error(`[check-vin] Error from EXTERNAL NHTSA API for VIN ${vin}: Status ${response.status}, Body: ${errorText}`);
      return null;
    }
    const data = await response.json();
    console.log(`[check-vin] Raw data from EXTERNAL NHTSA API for ${vin}:`, JSON.stringify(data, null, 2)); // LOG AÑADIDO
    return data;
  } catch (error) {
    console.error(`[check-vin] Failed to fetch VIN data from EXTERNAL NHTSA API for ${vin}:`, error); // LOG AÑADIDO
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vin = searchParams.get('vin');

  if (!vin) {
    return NextResponse.json({ error: 'VIN parameter is missing' }, { status: 400 });
  }

  console.log(`[check-vin] Received VIN for check: ${vin}`);

  try {
    // 1. Intentar encontrar el VIN en tu base de datos
    const vehicleData = await findVehicleByVinInDatabase(vin);

    if (vehicleData) {
      console.log(`[check-vin] VIN ${vin} found in database. Returning existing data.`);
      return NextResponse.json({
        vin,
        found: true,
        message: `VIN ${vin} already exists in your system.`,
        data: vehicleData
      });
    } else {
      // 2. Si no se encuentra en la base de datos, intentar decodificarlo con NHTSA
      console.log(`[check-vin] VIN ${vin} not found in database. Attempting NHTSA decode...`);
      const nhtsaData = await fetchVinDataFromNHTSAApi(vin); // Llama a la función que ahora usa la API externa

      // Verificar si nhtsaData es válido y contiene resultados
      if (nhtsaData && nhtsaData.Results && nhtsaData.Results.length > 0 && nhtsaData.Results[0].ErrorCode === '0') {
        console.log(`[check-vin] VIN ${vin} decoded successfully by NHTSA. Processing results.`); // LOG AÑADIDO
        const decodedInfo = nhtsaData.Results.reduce((acc: any, item: any) => {
          if (item.Value && item.Variable) {
            const key = item.Variable.replace(/[^a-zA-Z0-9]/g, '');
            acc[key.charAt(0).toLowerCase() + key.slice(1)] = item.Value;
          }
          return acc;
        }, {});

        const commonFields: any = {};
        const findValue = (variableName: string) => nhtsaData.Results.find((r: any) => r.Variable === variableName)?.Value;

        commonFields.make = findValue('Make');
        commonFields.model = findValue('Model');
        commonFields.modelYear = findValue('Model Year');
        commonFields.bodyClass = findValue('Body Class');
        commonFields.vehicleType = findValue('Vehicle Type');
        commonFields.engineCylinders = findValue('Engine Cylinders');
        commonFields.fuelType = findValue('Fuel Type - Primary');
        commonFields.plantCountry = findValue('Plant Country');

        const filteredCommonFields = Object.fromEntries(Object.entries(commonFields).filter(([_, v]) => v != null));


        return NextResponse.json({
          vin,
          found: false,
          message: `VIN ${vin} is new. Decoded info from NHTSA available.`,
          data: { ...decodedInfo, ...filteredCommonFields, source: 'nhtsa_api' }
        });
      } else {
        console.log(`[check-vin] VIN ${vin} not found in database and no valid decode information from NHTSA.`); // LOG AÑADIDO
        return NextResponse.json({
          vin,
          found: false,
          message: `VIN ${vin} is new, but no decode information available from NHTSA.`,
          data: null
        });
      }
    }
  } catch (error: any) {
    console.error('[check-vin] Error during VIN check process:', error);
    return NextResponse.json({ error: 'Failed to process VIN check', details: error.message }, { status: 500 });
  }
}