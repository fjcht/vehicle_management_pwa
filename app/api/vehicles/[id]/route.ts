
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true
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
      }
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    return NextResponse.json(vehicle)

  } catch (error) {
    console.error('Error fetching vehicle:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

    // Verify vehicle belongs to the company
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId
      }
    })

    if (!existingVehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    if (!licensePlate) {
      return NextResponse.json(
        { error: 'License plate is required' },
        { status: 400 }
      )
    }

    // Check if license plate already exists (excluding current vehicle)
    const duplicateLicense = await prisma.vehicle.findFirst({
      where: {
        licensePlate,
        companyId: session.user.companyId,
        NOT: { id: id }
      }
    })

    if (duplicateLicense) {
      return NextResponse.json(
        { error: 'Vehicle with this license plate already exists' },
        { status: 400 }
      )
    }

    // Check if VIN already exists (excluding current vehicle, if provided)
    if (vin) {
      const duplicateVin = await prisma.vehicle.findFirst({
        where: {
          vin,
          NOT: { id: id }
        }
      })

      if (duplicateVin) {
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

    const vehicle = await prisma.vehicle.update({
      where: { id: id },
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
        assignedToId: assignedToId || null,
        parkingSpot: parkingSpot || null
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true
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

    return NextResponse.json(vehicle)

  } catch (error) {
    console.error('Error updating vehicle:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify vehicle belongs to the company
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId
      },
      include: {
        _count: {
          select: {
            repairOrders: true,
            appointments: true
          }
        }
      }
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Check if vehicle has active repair orders or appointments
    if (vehicle._count.repairOrders > 0 || vehicle._count.appointments > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete vehicle with active repair orders or appointments. Please complete or cancel them first.',
          details: {
            repairOrders: vehicle._count.repairOrders,
            appointments: vehicle._count.appointments
          }
        },
        { status: 400 }
      )
    }

    // Delete vehicle (cascade will handle related records)
    await prisma.vehicle.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Vehicle deleted successfully' })

  } catch (error: any) {
    console.error('Error deleting vehicle:', error)
    
    // Handle specific Prisma errors
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete vehicle due to existing dependencies. Please remove related records first.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
