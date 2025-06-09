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
  const externalNHTSAUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`;
  console.log(`[check-vin] Calling EXTERNAL NHTSA API: ${externalNHTSAUrl}`);

  try {
    const response = await fetch(externalNHTSAUrl);
    console.log(`[check-vin] EXTERNAL NHTSA API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[check-vin] Error from EXTERNAL NHTSA API for VIN ${vin}: Status ${response.status}, Body: ${errorText}`);
      return null;
    }
    const data = await response.json();
    console.log(`[check-vin] Raw data from EXTERNAL NHTSA API for ${vin}:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error(`[check-vin] Failed to fetch VIN data from EXTERNAL NHTSA API for ${vin}:`, error);
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
      const nhtsaData = await fetchVinDataFromNHTSAApi(vin);

      // Ajuste clave aquí: Verificar que haya resultados y que el ErrorCode sea 0
      // No necesitamos que el ErrorCode sea el primer elemento.
      const hasValidResults = nhtsaData && nhtsaData.Results && nhtsaData.Results.length > 0 &&
                             nhtsaData.Results.some((r: any) => r.Variable === 'Error Code' && r.Value === '0');

      if (hasValidResults) {
        console.log(`[check-vin] VIN ${vin} decoded successfully by NHTSA. Processing results.`);
        const decodedInfo: { [key: string]: string | number | null } = {}; // Usar un tipo más específico

        // Iterar sobre todos los resultados y procesarlos
        nhtsaData.Results.forEach((item: any) => {
          if (item.Value && item.Variable) {
            const key = item.Variable.replace(/[^a-zA-Z0-9]/g, ''); // Elimina caracteres no alfanuméricos
            const camelCaseKey = key.charAt(0).toLowerCase() + key.slice(1); // Convierte a camelCase

            // Intentar convertir a número si es un campo numérico conocido
            if (['modelYear', 'engineNumberofCylinders', 'displacementCC', 'displacementCI', 'displacementL', 'engineBrakeHpFrom', 'engineBrakeHpTo'].includes(camelCaseKey)) {
              const numValue = parseFloat(item.Value);
              if (!isNaN(numValue)) {
                decodedInfo[camelCaseKey] = numValue;
              } else {
                decodedInfo[camelCaseKey] = item.Value;
              }
            } else {
              decodedInfo[camelCaseKey] = item.Value;
            }
          }
        });

        // Puedes seguir extrayendo campos comunes si quieres un acceso más directo,
        // pero `decodedInfo` ya contendrá todos los datos procesados.
        // Por ejemplo, para asegurar que 'make' y 'model' estén en la raíz del objeto de datos:
        const finalData = {
          vin,
          make: decodedInfo.make || null,
          model: decodedInfo.model || null,
          modelYear: decodedInfo.modelYear || null,
          bodyClass: decodedInfo.bodyClass || null,
          vehicleType: decodedInfo.vehicleType || null,
          engineCylinders: decodedInfo.engineNumberofCylinders || null, // Corregido el nombre de la variable
          fuelType: decodedInfo.fuelTypePrimary || null, // Corregido el nombre de la variable
          plantCountry: decodedInfo.plantCountry || null,
          source: 'nhtsa_api',
          // Añade todos los demás campos decodificados
          ...decodedInfo
        };

        return NextResponse.json({
          vin,
          found: false,
          message: `VIN ${vin} is new. Decoded info from NHTSA available.`,
          data: finalData
        });
      } else {
        console.log(`[check-vin] VIN ${vin} not found in database and no valid decode information from NHTSA.`);
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