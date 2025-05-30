
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Calendar, Clock, User, Car, Phone, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Appointment {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  status: string
  createdAt: string
  client?: {
    id: string
    name: string
    phone: string
  }
  vehicle?: {
    id: string
    licensePlate: string
    make?: string
    model?: string
    client?: {
      id: string
      name: string
      phone: string
    }
  }
}

const statusLabels = {
  SCHEDULED: 'Scheduled',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
}

const statusColors = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800'
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments')
      if (response.ok) {
        const data = await response.json()
        setAppointments(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch appointments",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast({
        title: "Error",
        description: "Failed to fetch appointments",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return
    }

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAppointments(appointments.filter(appointment => appointment.id !== appointmentId))
        toast({
          title: "Success",
          description: "Appointment deleted successfully"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete appointment",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting appointment:', error)
      toast({
        title: "Error",
        description: "Failed to delete appointment",
        variant: "destructive"
      })
    }
  }

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const appointment = appointments.find(a => a.id === appointmentId)
      if (!appointment) return

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...appointment,
          status: newStatus,
        }),
      })

      if (response.ok) {
        const updatedAppointment = await response.json()
        setAppointments(appointments.map(a => 
          a.id === appointmentId ? updatedAppointment : a
        ))
        toast({
          title: "Success",
          description: "Appointment status updated successfully"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update appointment status",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating appointment status:', error)
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive"
      })
    }
  }

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.vehicle?.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter
    
    let matchesDate = true
    if (dateFilter !== 'all') {
      const appointmentDate = new Date(appointment.startTime)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      switch (dateFilter) {
        case 'today':
          matchesDate = appointmentDate.toDateString() === today.toDateString()
          break
        case 'tomorrow':
          matchesDate = appointmentDate.toDateString() === tomorrow.toDateString()
          break
        case 'week':
          matchesDate = appointmentDate >= today && appointmentDate <= nextWeek
          break
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusCounts = () => {
    const counts = {
      all: appointments.length,
      SCHEDULED: 0,
      CONFIRMED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0
    }
    
    appointments.forEach(appointment => {
      counts[appointment.status as keyof typeof counts]++
    })
    
    return counts
  }

  const statusCounts = getStatusCounts()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Schedule and manage customer appointments</p>
        </div>
        <Link href="/appointments/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
        </Link>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status ({statusCounts.all})</SelectItem>
            {Object.entries(statusLabels).map(([status, label]) => (
              <SelectItem key={status} value={status}>
                {label} ({statusCounts[status as keyof typeof statusCounts]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="tomorrow">Tomorrow</SelectItem>
            <SelectItem value="week">Next 7 Days</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        {Object.entries(statusLabels).map(([status, label]) => (
          <Card 
            key={status} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              statusFilter === status ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{statusCounts[status as keyof typeof statusCounts]}</div>
              <Badge 
                variant="secondary" 
                className={`${statusColors[status as keyof typeof statusColors]} text-xs`}
              >
                {label}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Appointments Grid */}
      {filteredAppointments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-12"
        >
          <div className="text-gray-500 text-lg">
            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
              ? 'No appointments found matching your criteria.' 
              : 'No appointments scheduled yet.'
            }
          </div>
          {!searchTerm && statusFilter === 'all' && dateFilter === 'all' && (
            <Link href="/appointments/new">
              <Button className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Your First Appointment
              </Button>
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAppointments.map((appointment, index) => (
            <motion.div
              key={appointment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{appointment.title}</CardTitle>
                      <CardDescription>
                        {new Date(appointment.startTime).toLocaleDateString()} at{' '}
                        {new Date(appointment.startTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Link href={`/appointments/${appointment.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteAppointment(appointment.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status */}
                  <Badge 
                    variant="secondary"
                    className={statusColors[appointment.status as keyof typeof statusColors]}
                  >
                    {statusLabels[appointment.status as keyof typeof statusLabels]}
                  </Badge>

                  {/* Client Info */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{appointment.client?.name || 'No client assigned'}</span>
                    </div>
                    {appointment.client?.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{appointment.client.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Vehicle Info */}
                  {appointment.vehicle && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Car className="w-4 h-4 text-gray-400" />
                      <span>
                        {appointment.vehicle.licensePlate} - {appointment.vehicle.make} {appointment.vehicle.model}
                      </span>
                    </div>
                  )}

                  {/* Time */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(appointment.startTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} - {new Date(appointment.endTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>

                  {/* Description */}
                  {appointment.description && (
                    <div className="text-sm text-gray-600 line-clamp-2">
                      {appointment.description}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Link href={`/appointments/${appointment.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    {appointment.status === 'SCHEDULED' && (
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => handleStatusChange(appointment.id, 'CONFIRMED')}
                      >
                        Confirm
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
