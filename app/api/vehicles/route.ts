
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vehicles = await prisma.vehicle.findMany({
      where: {
        companyId: session.user.companyId
      },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            repairOrders: true,
            appointments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(vehicles)

  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      vin,
      licensePlate,
      make,
      model,
      year,
      color,
      engineType,
      transmission,
      fuelType,
      mileage,
      clientId,
      assignedToId,
      parkingSpot
    } = body

    if (!licensePlate) {
      return NextResponse.json(
        { error: 'License plate is required' },
        { status: 400 }
      )
    }

    // Check if license plate already exists
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        licensePlate,
        companyId: session.user.companyId
      }
    })

    if (existingVehicle) {
      return NextResponse.json(
        { error: 'Vehicle with this license plate already exists' },
        { status: 400 }
      )
    }

    // Check if VIN already exists (if provided)
    if (vin) {
      const existingVin = await prisma.vehicle.findUnique({
        where: { vin }
      })

      if (existingVin) {
        return NextResponse.json(
          { error: 'Vehicle with this VIN already exists' },
          { status: 400 }
        )
      }
    }

    // Verify client belongs to the company (if provided)
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          companyId: session.user.companyId
        }
      })

      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        )
      }
    }

    // Verify employee belongs to the company (if assigned)
    if (assignedToId) {
      const employee = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          companyId: session.user.companyId
        }
      })

      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        )
      }
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        vin: vin || null,
        licensePlate,
        make: make || null,
        model: model || null,
        year: year || null,
        color: color || null,
        engineType: engineType || null,
        transmission: transmission || null,
        fuelType: fuelType || null,
        mileage: mileage || null,
        clientId: clientId || null,
        companyId: session.user.companyId,
        assignedToId: assignedToId || null,
        parkingSpot: parkingSpot || null
      },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(vehicle, { status: 201 })

  } catch (error) {
    console.error('Error creating vehicle:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
