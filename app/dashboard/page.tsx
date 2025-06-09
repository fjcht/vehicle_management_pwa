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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome back, {session?.user.name || 'User'}!
          </h1>
          <p className="text-xl text-gray-600">
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
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Total Vehicles</CardTitle>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Car className="h-6 w-6 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats?.totalVehicles || 0}</div>
                <p className="text-sm text-gray-600">
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
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Total Clients</CardTitle>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats?.totalClients || 0}</div>
                <p className="text-sm text-gray-600">
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
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Active Repairs</CardTitle>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats?.activeRepairs || 0}</div>
                <p className="text-sm text-gray-600">
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
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Today's Appointments</CardTitle>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats?.todayAppointments || 0}</div>
                <p className="text-sm text-gray-600">
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
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-blue-600" />
                  </div>
                  <span>Repair Status Overview</span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Current status of all repair orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(stats.statusCounts).map(([status, count]) => (
                    <div key={status} className="text-center space-y-2 p-4 rounded-lg bg-gray-50/50">
                      <div className="text-2xl font-bold text-gray-900">{count}</div>
                      <Badge 
                        variant="secondary" 
                        className={`${statusColors[status as keyof typeof statusColors]} font-medium`}
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
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2 text-gray-900">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span>Recent Repairs</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Latest repair orders in your workshop
                  </CardDescription>
                </div>
                <Link href="/repairs">
                  <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentRepairs.slice(0, 5).map((repair) => (
                    <div key={repair.id} className="flex items-center justify-between p-4 border-0 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
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
                        className={`${statusColors[repair.status as keyof typeof statusColors]} font-medium`}
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
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Quick Actions</CardTitle>
              <CardDescription className="text-gray-600">
                Common tasks to get you started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/vehicles/new">
                  <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 border-0 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-white/70 transition-all duration-200">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Car className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-gray-700 font-medium">Add Vehicle</span>
                  </Button>
                </Link>
                <Link href="/clients/new">
                  <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 border-0 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-white/70 transition-all duration-200">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700 font-medium">Add Client</span>
                  </Button>
                </Link>
                <Link href="/repairs/new">
                  <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 border-0 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-white/70 transition-all duration-200">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Wrench className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-gray-700 font-medium">New Repair</span>
                  </Button>
                </Link>
                <Link href="/appointments/new">
                  <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 border-0 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-white/70 transition-all duration-200">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-gray-700 font-medium">Schedule Appointment</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}