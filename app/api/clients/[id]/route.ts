
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

    const { searchParams } = new URL(request.url)
    const includeVehicles = searchParams.get('includeVehicles') === 'true'

    const client = await prisma.client.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId
      },
      include: {
        vehicles: includeVehicles ? {
          select: {
            id: true,
            licensePlate: true,
            make: true,
            model: true,
            year: true
          }
        } : false,
        _count: {
          select: {
            vehicles: true,
            repairOrders: true,
            appointments: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(client)

  } catch (error) {
    console.error('Error fetching client:', error)
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

    // Verify client belongs to the company
    const client = await prisma.client.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Delete client (cascade will handle related records)
    await prisma.client.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Client deleted successfully' })

  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
