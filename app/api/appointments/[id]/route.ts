
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

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: id,
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
        vehicle: {
          select: {
            id: true,
            licensePlate: true,
            make: true,
            model: true,
            year: true
          }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json(appointment)

  } catch (error) {
    console.error('Error fetching appointment:', error)
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
      clientId,
      vehicleId,
      title,
      description,
      startTime,
      endTime,
      status
    } = body

    // Verify appointment belongs to the company
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId
      }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

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
    }

    const appointment = await prisma.appointment.update({
      where: { id: id },
      data: {
        clientId: clientId || null,
        vehicleId: vehicleId || null,
        title,
        description: description || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: status || existingAppointment.status
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
        vehicle: {
          select: {
            id: true,
            licensePlate: true,
            make: true,
            model: true,
            year: true
          }
        }
      }
    })

    return NextResponse.json(appointment)

  } catch (error) {
    console.error('Error updating appointment:', error)
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

    // Verify appointment belongs to the company
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Delete appointment
    await prisma.appointment.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Appointment deleted successfully' })

  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
