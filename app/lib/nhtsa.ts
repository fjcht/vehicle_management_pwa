
export interface NHTSAVehicleData {
  Make?: string;
  Model?: string;
  ModelYear?: string;
  VehicleType?: string;
  EngineModel?: string;
  FuelTypePrimary?: string;
  TransmissionStyle?: string;
  DriveType?: string;
  BodyClass?: string;
}

export async function decodeVIN(vin: string): Promise<NHTSAVehicleData | null> {
  try {
    if (!vin || vin.length !== 17) {
      throw new Error('Invalid VIN format');
    }

    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
    );

    if (!response.ok) {
      throw new Error('NHTSA API request failed');
    }

    const data = await response.json();
    
    if (!data.Results || data.Results.length === 0) {
      throw new Error('No vehicle data found');
    }

    const results = data.Results;
    const vehicleData: NHTSAVehicleData = {};

    // Extract relevant fields
    results.forEach((result: any) => {
      switch (result.Variable) {
        case 'Make':
          vehicleData.Make = result.Value;
          break;
        case 'Model':
          vehicleData.Model = result.Value;
          break;
        case 'Model Year':
          vehicleData.ModelYear = result.Value;
          break;
        case 'Vehicle Type':
          vehicleData.VehicleType = result.Value;
          break;
        case 'Engine Model':
          vehicleData.EngineModel = result.Value;
          break;
        case 'Fuel Type - Primary':
          vehicleData.FuelTypePrimary = result.Value;
          break;
        case 'Transmission Style':
          vehicleData.TransmissionStyle = result.Value;
          break;
        case 'Drive Type':
          vehicleData.DriveType = result.Value;
          break;
        case 'Body Class':
          vehicleData.BodyClass = result.Value;
          break;
      }
    });

    return vehicleData;
  } catch (error) {
    console.error('Error decoding VIN:', error);
    return null;
  }
}
