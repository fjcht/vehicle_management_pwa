
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Car, User, Calendar, Wrench, Edit, Trash2, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Vehicle {
  id: string
  vin?: string
  licensePlate: string
  make?: string
  model?: string
  year?: number
  color?: string
  mileage?: number
  parkingSpot?: string
  createdAt: string
  client?: {
    id: string
    name: string
  }
  assignedTo?: {
    id: string
    name: string
  }
  _count: {
    repairOrders: number
    appointments: number
  }
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles')
      if (response.ok) {
        const data = await response.json()
        setVehicles(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch vehicles",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      toast({
        title: "Error",
        description: "Failed to fetch vehicles",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle? This will also delete all associated repair orders and appointments.')) {
      return
    }

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setVehicles(vehicles.filter(vehicle => vehicle.id !== vehicleId))
        toast({
          title: "Success",
          description: "Vehicle deleted successfully"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete vehicle",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      toast({
        title: "Error",
        description: "Failed to delete vehicle",
        variant: "destructive"
      })
    }
  }

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
          <p className="text-gray-600">Manage your vehicle inventory</p>
        </div>
        <Link href="/vehicles/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </Link>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search vehicles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{vehicles.length}</div>
            <p className="text-sm text-gray-600">Total Vehicles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {vehicles.filter(v => v.assignedTo).length}
            </div>
            <p className="text-sm text-gray-600">Assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {vehicles.reduce((sum, vehicle) => sum + vehicle._count.repairOrders, 0)}
            </div>
            <p className="text-sm text-gray-600">Total Repairs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {vehicles.filter(v => v.vin).length}
            </div>
            <p className="text-sm text-gray-600">With VIN</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-12"
        >
          <div className="text-gray-500 text-lg">
            {searchTerm ? 'No vehicles found matching your search.' : 'No vehicles yet.'}
          </div>
          {!searchTerm && (
            <Link href="/vehicles/new">
              <Button className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Vehicle
              </Button>
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle, index) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <span>{vehicle.licensePlate}</span>
                        {vehicle.vin && (
                          <QrCode className="w-4 h-4 text-blue-500" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        {vehicle.make} {vehicle.model} {vehicle.year}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Link href={`/vehicles/${vehicle.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Vehicle Info */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{vehicle.client?.name || 'No Owner'}</span>
                    </div>
                    {vehicle.color && (
                      <div className="flex items-center space-x-2 text-sm">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: vehicle.color.toLowerCase() }}
                        />
                        <span>{vehicle.color}</span>
                      </div>
                    )}
                    {vehicle.mileage && (
                      <div className="text-sm text-gray-600">
                        {vehicle.mileage.toLocaleString()} miles
                      </div>
                    )}
                    {vehicle.parkingSpot && (
                      <Badge variant="outline">
                        Spot: {vehicle.parkingSpot}
                      </Badge>
                    )}
                  </div>

                  {/* Assignment */}
                  {vehicle.assignedTo && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        Assigned to {vehicle.assignedTo.name}
                      </Badge>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-1">
                      <Wrench className="w-4 h-4 text-gray-400" />
                      <Badge variant="secondary">
                        {vehicle._count.repairOrders} repairs
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <Badge variant="outline">
                        {vehicle._count.appointments} appointments
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Link href={`/vehicles/${vehicle.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/repairs/new?vehicleId=${vehicle.id}`}>
                      <Button size="sm">
                        <Wrench className="w-4 h-4 mr-1" />
                        New Repair
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
