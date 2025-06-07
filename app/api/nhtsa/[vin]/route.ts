
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { decodeVIN } from '@/lib/nhtsa';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  const { vin } = await params
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vin } = params;

    if (!vin || vin.length !== 17) {
      return NextResponse.json({ error: 'Invalid VIN format' }, { status: 400 });
    }

    console.log(`Fetching NHTSA data for VIN: ${vin}`);

    // Call NHTSA API
    const vehicleData = await decodeVIN(vin.toUpperCase());

    if (vehicleData) {
      return NextResponse.json({
        success: true,
        data: vehicleData,
        message: 'Vehicle information retrieved from NHTSA'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No vehicle information found in NHTSA database'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Error fetching NHTSA data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle information from NHTSA' },
      { status: 500 }
    );
  }
}
