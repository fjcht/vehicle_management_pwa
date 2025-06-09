
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/db';

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

    // Search for existing vehicle with this VIN in the company
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        vin: vin.toUpperCase(),
        companyId: session.user.companyId
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

    if (existingVehicle) {
      return NextResponse.json({
        found: true,
        vehicle: existingVehicle,
        message: 'Vehicle found in database'
      });
    } else {
      return NextResponse.json({
        found: false,
        message: 'Vehicle not found in database'
      });
    }

  } catch (error) {
    console.error('Error searching VIN in database:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
