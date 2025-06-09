
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Calendar, Clock, User, Car, Plus } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { useToast } from '@/app/hooks/use-toast'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  vehicles: Array<{
    id: string
    licensePlate: string
    make?: string
    model?: string
  }>
}

interface Vehicle {
  id: string
  licensePlate: string
  make?: string
  model?: string
  client?: {
    id: string
    name: string
  }
}

function NewAppointmentPageContent() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    clientId: '',
    vehicleId: '',
    status: 'SCHEDULED'
  })
  const [clients, setClients] = useState<Client[]>([])
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    fetchClients()
    fetchAllVehicles()
    
    // Pre-select client or vehicle if provided in URL
    const clientId = searchParams.get('clientId')
    const vehicleId = searchParams.get('vehicleId')
    if (clientId) {
      setFormData(prev => ({ ...prev, clientId }))
    }
    if (vehicleId) {
      setFormData(prev => ({ ...prev, vehicleId }))
    }
  }, [searchParams])

  useEffect(() => {
    if (formData.clientId && clients.length > 0) {
      const client = clients.find(c => c.id === formData.clientId)
      setSelectedClient(client || null)
    }
  }, [formData.clientId, clients])

  useEffect(() => {
    if (formData.vehicleId && allVehicles.length > 0) {
      const vehicle = allVehicles.find(v => v.id === formData.vehicleId)
      if (vehicle?.client) {
        setFormData(prev => ({ ...prev, clientId: vehicle.client!.id }))
        const client = clients.find(c => c.id === vehicle.client!.id)
        setSelectedClient(client || null)
      }
    }
  }, [formData.vehicleId, allVehicles, clients])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients?includeVehicles=true')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchAllVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles')
      if (response.ok) {
        const data = await response.json()
        setAllVehicles(data)
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleNewClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewClientData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    if (value === 'add_new_client') {
      setShowNewClientForm(true)
      return
    }

    // Handle special values
    if (value === 'no_client') {
      setFormData(prev => ({ ...prev, [name]: '' }))
      if (name === 'clientId') {
        setSelectedClient(null)
        setFormData(prev => ({ ...prev, vehicleId: '' }))
      }
      return
    }

    if (value === 'no_vehicle') {
      setFormData(prev => ({ ...prev, [name]: '' }))
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (name === 'clientId') {
      const client = clients.find(c => c.id === value)
      setSelectedClient(client || null)
      // Reset vehicle selection when client changes
      setFormData(prev => ({ ...prev, vehicleId: '' }))
    }

    if (name === 'vehicleId') {
      // Auto-select client if vehicle has an owner
      const vehicle = allVehicles.find(v => v.id === value)
      if (vehicle?.client) {
        setFormData(prev => ({ ...prev, clientId: vehicle.client!.id }))
        const client = clients.find(c => c.id === vehicle.client!.id)
        setSelectedClient(client || null)
      }
    }
  }

  const handleCreateClient = async () => {
    if (!newClientData.name || !newClientData.phone) {
      toast({
        title: "Error",
        description: "Name and phone are required",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClientData),
      })

      if (response.ok) {
        const newClient = await response.json()
        setClients(prev => [{ ...newClient, vehicles: [] }, ...prev])
        setFormData(prev => ({ ...prev, clientId: newClient.id }))
        setSelectedClient({ ...newClient, vehicles: [] })
        setShowNewClientForm(false)
        setNewClientData({ name: '', email: '', phone: '', address: '' })
        toast({
          title: "Success",
          description: "Client created successfully"
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create client",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating client:', error)
      toast({
        title: "Error",
        description: "Failed to create client",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const submitData = {
        ...formData,
        clientId: formData.clientId || null,
        vehicleId: formData.vehicleId || null,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString()
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const appointment = await response.json()
        toast({
          title: "Success",
          description: "Appointment created successfully"
        })
        router.push('/appointments')
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create appointment",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast({
        title: "Error",
        description: "Failed to create appointment",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-4"
      >
        <Link href="/appointments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Appointments
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Appointment</h1>
          <p className="text-gray-600">Schedule a new appointment with a client</p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Appointment Information</span>
            </CardTitle>
            <CardDescription>
              Enter the details for the new appointment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Appointment title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Appointment description or notes..."
                  value={formData.description}
                  onChange={handleChange}
                  className="min-h-[80px]"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Date & Time *</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Date & Time *</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Client Selection */}
              <div className="space-y-2">
                <Label htmlFor="clientId">Client (Optional)</Label>
                <Select value={formData.clientId} onValueChange={(value) => handleSelectChange('clientId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_client">No client assigned</SelectItem>
                    <SelectItem value="add_new_client">
                      <div className="flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Client
                      </div>
                    </SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle Selection */}
              <div className="space-y-2">
                <Label htmlFor="vehicleId">Vehicle (Optional)</Label>
                <Select value={formData.vehicleId} onValueChange={(value) => handleSelectChange('vehicleId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_vehicle">No vehicle assigned</SelectItem>
                    {selectedClient?.vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.licensePlate} - {vehicle.make} {vehicle.model}
                      </SelectItem>
                    ))}
                    {!selectedClient && allVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.licensePlate} - {vehicle.make} {vehicle.model}
                        {vehicle.client && ` (${vehicle.client.name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* New Client Form */}
              {showNewClientForm && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Add New Client</CardTitle>
                    <CardDescription>Enter the client information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newClientName">Name *</Label>
                        <Input
                          id="newClientName"
                          name="name"
                          placeholder="Client name"
                          value={newClientData.name}
                          onChange={handleNewClientChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newClientPhone">Phone *</Label>
                        <Input
                          id="newClientPhone"
                          name="phone"
                          placeholder="Phone number"
                          value={newClientData.phone}
                          onChange={handleNewClientChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newClientEmail">Email</Label>
                        <Input
                          id="newClientEmail"
                          name="email"
                          type="email"
                          placeholder="Email address"
                          value={newClientData.email}
                          onChange={handleNewClientChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newClientAddress">Address</Label>
                        <Input
                          id="newClientAddress"
                          name="address"
                          placeholder="Address"
                          value={newClientData.address}
                          onChange={handleNewClientChange}
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button type="button" onClick={handleCreateClient}>
                        Create Client
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowNewClientForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || !formData.title || !formData.startTime || !formData.endTime}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Appointment
                    </>
                  )}
                </Button>
                <Link href="/appointments">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <NewAppointmentPageContent />
    </Suspense>
  )
}
