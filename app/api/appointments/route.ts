
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

    const appointments = await prisma.appointment.findMany({
      where: {
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
        vehicle: {
          select: {
            id: true,
            licensePlate: true,
            make: true,
            model: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return NextResponse.json(appointments)

  } catch (error) {
    console.error('Error fetching appointments:', error)
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
    console.log('Received appointment data:', body) // Debug log
    
    const {
      clientId,
      vehicleId,
      title,
      description,
      startTime,
      endTime
    } = body

    // Only title, startTime, and endTime are required
    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Title, start time, and end time are required' },
        { status: 400 }
      )
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

    // Verify vehicle belongs to the company (if provided)
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          companyId: session.user.companyId
        }
      })

      if (!vehicle) {
        return NextResponse.json(
          { error: 'Vehicle not found' },
          { status: 404 }
        )
      }

      // If vehicle is provided but no client, and vehicle has a client, use that client
      if (!clientId && vehicle.clientId) {
        body.clientId = vehicle.clientId
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId: clientId || null,
        vehicleId: vehicleId || null,
        companyId: session.user.companyId,
        title,
        description: description || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: 'SCHEDULED'
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            licensePlate: true,
            make: true,
            model: true
          }
        }
      }
    })

    console.log('Created appointment:', appointment) // Debug log
    return NextResponse.json(appointment, { status: 201 })

  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
