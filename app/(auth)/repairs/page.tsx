
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Search, Wrench, Car, User, Calendar, Clock, DollarSign, Edit, Eye } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { useToast } from '@/app/hooks/use-toast'
import Link from 'next/link'

interface RepairOrder {
  id: string
  orderNumber: string
  problem: string
  status: string
  estimatedCost?: number
  finalCost?: number
  receptionDate: string
  estimatedEndDate?: string
  completedDate?: string
  deliveredDate?: string
  parkingSpot?: string
  vehicle: {
    id: string
    licensePlate: string
    make?: string
    model?: string
  }
  client?: {
    id: string
    name: string
  } | null
  assignedTo?: {
    id: string
    name: string
  } | null
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

export default function RepairsPage() {
  const router = useRouter()
  const [repairs, setRepairs] = useState<RepairOrder[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchRepairs()
  }, [])

  const fetchRepairs = async () => {
    try {
      const response = await fetch('/api/repairs')
      if (response.ok) {
        const data = await response.json()
        setRepairs(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch repair orders",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching repairs:', error)
      toast({
        title: "Error",
        description: "Failed to fetch repair orders",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRepairs = repairs.filter(repair => {
    const matchesSearch = 
      repair.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (repair.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      repair.problem.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || repair.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusCounts = () => {
    const counts = {
      all: repairs.length,
      RECEPTION: 0,
      DIAGNOSIS: 0,
      WAITING_PARTS: 0,
      IN_REPAIR: 0,
      READY: 0,
      DELIVERED: 0
    }
    
    repairs.forEach(repair => {
      counts[repair.status as keyof typeof counts]++
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
          <h1 className="text-3xl font-bold text-gray-900">Repair Orders</h1>
          <p className="text-gray-600">Manage vehicle repairs and track progress</p>
        </div>
        <Link href="/repairs/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Repair Order
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
            placeholder="Search repairs..."
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
      </motion.div>

      {/* Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
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

      {/* Repairs Grid */}
      {filteredRepairs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-12"
        >
          <div className="text-gray-500 text-lg">
            {searchTerm || statusFilter !== 'all' 
              ? 'No repair orders found matching your criteria.' 
              : 'No repair orders yet.'
            }
          </div>
          {!searchTerm && statusFilter === 'all' && (
            <Link href="/repairs/new">
              <Button className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Repair Order
              </Button>
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRepairs.map((repair, index) => (
            <motion.div
              key={repair.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={() => router.push(`/repairs/${repair.id}`)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg hover:text-blue-600 transition-colors">{repair.orderNumber}</CardTitle>
                      <CardDescription>
                        {repair.vehicle.make} {repair.vehicle.model} - {repair.vehicle.licensePlate}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="secondary"
                      className={statusColors[repair.status as keyof typeof statusColors]}
                    >
                      {statusLabels[repair.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Client and Problem */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{repair.client?.name || 'No client assigned'}</span>
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-2">
                      <strong>Problem:</strong> {repair.problem}
                    </div>
                  </div>

                  {/* Assignment and Parking */}
                  <div className="space-y-2">
                    {repair.assignedTo?.name && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Wrench className="w-4 h-4 text-gray-400" />
                        <span>Assigned to {repair.assignedTo.name}</span>
                      </div>
                    )}
                    {repair.parkingSpot && (
                      <Badge variant="outline">
                        Spot: {repair.parkingSpot}
                      </Badge>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Received: {new Date(repair.receptionDate).toLocaleDateString()}</span>
                    </div>
                    {repair.estimatedEndDate && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Est. completion: {new Date(repair.estimatedEndDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Cost */}
                  {(repair.estimatedCost || repair.finalCost) && (
                    <div className="flex items-center space-x-2 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span>
                        {repair.finalCost 
                          ? `Final: $${repair.finalCost.toFixed(2)}`
                          : `Estimated: $${repair.estimatedCost?.toFixed(2)}`
                        }
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Link href={`/repairs/${repair.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/repairs/${repair.id}/edit`}>
                      <Button size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Update
                      </Button>
                    </Link>
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
