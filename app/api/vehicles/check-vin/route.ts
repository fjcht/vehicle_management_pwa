import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/db';

// Función para buscar vehículo en la base de datos usando Prisma
async function findVehicleByVinInDatabase(vin: string, companyId: string) {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        vin: vin,
        companyId: companyId
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (vehicle) {
      return {
        id: vehicle.id,
        vin: vehicle.vin,
        licensePlate: vehicle.licensePlate,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        engineType: vehicle.engineType,
        transmission: vehicle.transmission,
        fuelType: vehicle.fuelType,
        mileage: vehicle.mileage,
        parkingSpot: vehicle.parkingSpot,
        client: vehicle.client,
        assignedTo: vehicle.assignedTo,
        source: 'database'
      };
    }

    return null;
  } catch (error) {
    console.error('Error querying database for VIN:', error);
    return null;
  }
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

  if (vin.length !== 17) {
    return NextResponse.json({ error: 'Invalid VIN format. VIN must be 17 characters.' }, { status: 400 });
  }

  console.log(`[check-vin] Received VIN for check: ${vin}`);

  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Intentar encontrar el VIN en tu base de datos
    const vehicleData = await findVehicleByVinInDatabase(vin.toUpperCase(), session.user.companyId);

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
      const nhtsaData = await fetchVinDataFromNHTSAApi(vin.toUpperCase());

      // Verificar que haya resultados válidos y que el ErrorCode sea 0
      const hasValidResults = nhtsaData && nhtsaData.Results && nhtsaData.Results.length > 0 &&
        nhtsaData.Results.some((r: any) => r.Variable === 'Error Code' && r.Value === '0');

      if (hasValidResults) {
        console.log(`[check-vin] VIN ${vin} decoded successfully by NHTSA. Processing results.`);
        const decodedInfo: { [key: string]: string | number | null } = {};

        // Iterar sobre todos los resultados y procesarlos
        nhtsaData.Results.forEach((item: any) => {
          if (item.Value && item.Variable && item.Value !== 'Not Applicable' && item.Value !== '') {
            const key = item.Variable.replace(/[^a-zA-Z0-9]/g, '');
            const camelCaseKey = key.charAt(0).toLowerCase() + key.slice(1);

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

        // Mapear campos de NHTSA a campos de tu base de datos
        const finalData = {
          vin: vin.toUpperCase(),
          make: decodedInfo.make || null,
          model: decodedInfo.model || null,
          year: decodedInfo.modelYear || null,
          engineType: decodedInfo.engineModel || null,
          transmission: decodedInfo.transmissionStyle || null,
          fuelType: decodedInfo.fuelTypePrimary || null,
          bodyClass: decodedInfo.bodyClass || null,
          vehicleType: decodedInfo.vehicleType || null,
          driveType: decodedInfo.driveType || null,
          plantCountry: decodedInfo.plantCountry || null,
          source: 'nhtsa_api',
          // Incluir todos los demás campos decodificados
          nhtsaData: decodedInfo
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
    return NextResponse.json({ 
      error: 'Failed to process VIN check', 
      details: error.message 
    }, { status: 500 });
  }
}