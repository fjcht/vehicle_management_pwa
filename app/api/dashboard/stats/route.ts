
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

    const companyId = session.user.companyId

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Fetch all stats in parallel
    const [
      totalVehicles,
      totalClients,
      activeRepairs,
      todayAppointments,
      recentRepairs,
      statusCounts
    ] = await Promise.all([
      // Total vehicles
      prisma.vehicle.count({
        where: { companyId }
      }),
      
      // Total clients
      prisma.client.count({
        where: { companyId }
      }),
      
      // Active repairs (not delivered)
      prisma.repairOrder.count({
        where: { 
          companyId,
          status: { not: 'DELIVERED' }
        }
      }),
      
      // Today's appointments
      prisma.appointment.count({
        where: {
          companyId,
          startTime: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      }),
      
      // Recent repairs
      prisma.repairOrder.findMany({
        where: { companyId },
        include: {
          vehicle: {
            select: {
              licensePlate: true,
              make: true,
              model: true
            }
          },
          client: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Status counts
      prisma.repairOrder.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { status: true }
      })
    ])

    // Format status counts
    const formattedStatusCounts = {
      RECEPTION: 0,
      DIAGNOSIS: 0,
      WAITING_PARTS: 0,
      IN_REPAIR: 0,
      READY: 0,
      DELIVERED: 0
    }

    statusCounts.forEach(item => {
      formattedStatusCounts[item.status] = item._count.status
    })

    return NextResponse.json({
      totalVehicles,
      totalClients,
      activeRepairs,
      todayAppointments,
      recentRepairs,
      statusCounts: formattedStatusCounts
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
