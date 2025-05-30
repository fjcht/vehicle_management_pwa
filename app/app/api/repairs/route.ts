
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repairs = await prisma.repairOrder.findMany({
      where: {
        companyId: session.user.companyId
      },
      include: {
        vehicle: {
          select: {
            id: true,
            licensePlate: true,
            make: true,
            model: true
          }
        },
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(repairs)

  } catch (error) {
    console.error('Error fetching repair orders:', error)
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
    console.log('Received repair order data:', body)

    const {
      clientId,
      vehicleId,
      problem,
      diagnosis,
      estimatedCost,
      estimatedEndDate,
      assignedToId,
      parkingSpot,
      notes
    } = body

    // Validate required fields
    if (!vehicleId || !problem) {
      return NextResponse.json(
        { error: 'Vehicle and problem description are required' },
        { status: 400 }
      )
    }

    // Clean and validate data - handle special frontend values
    const cleanClientId = clientId && clientId !== 'no_client' && clientId !== '' ? clientId : null
    const cleanAssignedToId = assignedToId && assignedToId !== 'no_assignment' && assignedToId !== '' ? assignedToId : null
    const cleanEstimatedCost = estimatedCost && !isNaN(parseFloat(estimatedCost)) ? parseFloat(estimatedCost) : null
    const cleanEstimatedEndDate = estimatedEndDate && estimatedEndDate !== '' ? new Date(estimatedEndDate) : null

    console.log('Cleaned data:', {
      cleanClientId,
      vehicleId,
      cleanAssignedToId,
      cleanEstimatedCost,
      cleanEstimatedEndDate
    })

    // Verify vehicle belongs to the company
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        companyId: session.user.companyId
      }
    })

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or does not belong to your company' },
        { status: 404 }
      )
    }

    // Verify client belongs to the company (if provided)
    if (cleanClientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: cleanClientId,
          companyId: session.user.companyId
        }
      })

      if (!client) {
        return NextResponse.json(
          { error: 'Client not found or does not belong to your company' },
          { status: 404 }
        )
      }
    }

    // Verify employee belongs to the company (if assigned)
    if (cleanAssignedToId) {
      const employee = await prisma.user.findFirst({
        where: {
          id: cleanAssignedToId,
          companyId: session.user.companyId
        }
      })

      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found or does not belong to your company' },
          { status: 404 }
        )
      }
    }

    // Generate order number
    const orderCount = await prisma.repairOrder.count({
      where: { companyId: session.user.companyId }
    })
    const orderNumber = `RO-${String(orderCount + 1).padStart(6, '0')}`

    console.log('Creating repair order with data:', {
      orderNumber,
      clientId: cleanClientId,
      vehicleId,
      companyId: session.user.companyId,
      problem,
      diagnosis: diagnosis || null,
      estimatedCost: cleanEstimatedCost,
      estimatedEndDate: cleanEstimatedEndDate,
      assignedToId: cleanAssignedToId,
      parkingSpot: parkingSpot || null,
      notes: notes || null,
      status: 'RECEPTION'
    })

    const repairOrder = await prisma.repairOrder.create({
      data: {
        orderNumber,
        clientId: cleanClientId,
        vehicleId,
        companyId: session.user.companyId,
        problem,
        diagnosis: diagnosis || null,
        estimatedCost: cleanEstimatedCost,
        estimatedEndDate: cleanEstimatedEndDate,
        assignedToId: cleanAssignedToId,
        parkingSpot: parkingSpot || null,
        notes: notes || null,
        status: 'RECEPTION'
      },
      include: {
        vehicle: {
          select: {
            id: true,
            licensePlate: true,
            make: true,
            model: true
          }
        },
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

    console.log('Repair order created successfully:', repairOrder.id)

    // Create initial log entry
    await prisma.repairLog.create({
      data: {
        repairOrderId: repairOrder.id,
        userId: session.user.id,
        newStatus: 'RECEPTION',
        notes: 'Repair order created'
      }
    })

    return NextResponse.json(repairOrder, { status: 201 })

  } catch (error) {
    console.error('Error creating repair order:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
