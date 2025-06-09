
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  Car, 
  Users, 
  Wrench, 
  Calendar, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import Link from 'next/link'

interface DashboardStats {
  totalVehicles: number
  totalClients: number
  activeRepairs: number
  todayAppointments: number
  recentRepairs: Array<{
    id: string
    orderNumber: string
    vehicle: {
      licensePlate: string
      make?: string
      model?: string
    }
    client?: {
      name: string
    } | null
    status: string
    receptionDate: string
  }>
  statusCounts: {
    RECEPTION: number
    DIAGNOSIS: number
    WAITING_PARTS: number
    IN_REPAIR: number
    READY: number
    DELIVERED: number
  }
}

const statusLabels = {
  RECEPTION: 'Reception',
  DIAGNOSIS: 'Diagnosis',
  WAITING_PARTS: 'Waiting Parts',
  IN_REPAIR: 'In Repair',
  READY: 'Ready',
  DELIVERED: 'Delivered'
}

const statusColors = {
  RECEPTION: 'bg-blue-100 text-blue-800',
  DIAGNOSIS: 'bg-yellow-100 text-yellow-800',
  WAITING_PARTS: 'bg-orange-100 text-orange-800',
  IN_REPAIR: 'bg-purple-100 text-purple-800',
  READY: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-gray-100 text-gray-800'
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user.name || 'User'}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening at {session?.user.companyName} today.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalVehicles || 0}</div>
              <p className="text-xs text-muted-foreground">
                Vehicles in system
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
              <p className="text-xs text-muted-foreground">
                Registered clients
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Repairs</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeRepairs || 0}</div>
              <p className="text-xs text-muted-foreground">
                In progress
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.todayAppointments || 0}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled today
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Repair Status Overview */}
      {stats?.statusCounts && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="w-5 h-5" />
                <span>Repair Status Overview</span>
              </CardTitle>
              <CardDescription>
                Current status of all repair orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(stats.statusCounts).map(([status, count]) => (
                  <div key={status} className="text-center space-y-2">
                    <div className="text-2xl font-bold">{count}</div>
                    <Badge 
                      variant="secondary" 
                      className={statusColors[status as keyof typeof statusColors]}
                    >
                      {statusLabels[status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Repairs */}
      {stats?.recentRepairs && stats.recentRepairs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Recent Repairs</span>
                </CardTitle>
                <CardDescription>
                  Latest repair orders in your workshop
                </CardDescription>
              </div>
              <Link href="/repairs">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentRepairs.slice(0, 5).map((repair) => (
                  <div key={repair.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {repair.orderNumber} - {repair.vehicle.licensePlate}
                      </div>
                      <div className="text-sm text-gray-600">
                        {repair.client?.name || 'No client assigned'} • {repair.vehicle.make || 'Unknown'} {repair.vehicle.model || 'Model'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(repair.receptionDate).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge 
                      variant="secondary"
                      className={statusColors[repair.status as keyof typeof statusColors]}
                    >
                      {statusLabels[repair.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to get you started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/vehicles/new">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Car className="w-6 h-6" />
                  <span>Add Vehicle</span>
                </Button>
              </Link>
              <Link href="/clients/new">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Users className="w-6 h-6" />
                  <span>Add Client</span>
                </Button>
              </Link>
              <Link href="/repairs/new">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Wrench className="w-6 h-6" />
                  <span>New Repair</span>
                </Button>
              </Link>
              <Link href="/appointments/new">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Calendar className="w-6 h-6" />
                  <span>Schedule Appointment</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
