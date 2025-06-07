
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Wrench, Car, User, Calendar, DollarSign, MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
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

interface Employee {
  id: string
  name: string
}

function NewRepairPageContent() {
  const [formData, setFormData] = useState({
    clientId: '',
    vehicleId: '',
    problem: '',
    diagnosis: '',
    estimatedCost: '',
    estimatedEndDate: '',
    assignedToId: '',
    parkingSpot: '',
    notes: ''
  })
  const [clients, setClients] = useState<Client[]>([])
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
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
    fetchEmployees()
    
    // Pre-select vehicle if provided in URL
    const vehicleId = searchParams.get('vehicleId')
    if (vehicleId) {
      setFormData(prev => ({ ...prev, vehicleId }))
    }
  }, [searchParams])

  useEffect(() => {
    if (formData.vehicleId && allVehicles.length > 0) {
      // Find the vehicle and its client
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

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
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

    if (value === 'no_assignment') {
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
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
        estimatedEndDate: formData.estimatedEndDate || null,
        assignedToId: formData.assignedToId && formData.assignedToId !== 'no_assignment' ? formData.assignedToId : null,
        parkingSpot: formData.parkingSpot || null,
        notes: formData.notes || null,
        clientId: formData.clientId || null
      }

      const response = await fetch('/api/repairs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const repair = await response.json()
        toast({
          title: "Success",
          description: "Repair order created successfully"
        })
        router.push('/repairs')
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create repair order",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating repair order:', error)
      toast({
        title: "Error",
        description: "Failed to create repair order",
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
        <Link href="/repairs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Repairs
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Repair Order</h1>
          <p className="text-gray-600">Create a new repair order for a vehicle</p>
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
              <Wrench className="w-5 h-5" />
              <span>Repair Order Information</span>
            </CardTitle>
            <CardDescription>
              Enter the details for the new repair order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vehicle Selection - Primary */}
              <div className="space-y-2">
                <Label htmlFor="vehicleId">Vehicle *</Label>
                <Select 
                  value={formData.vehicleId} 
                  onValueChange={(value) => handleSelectChange('vehicleId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {allVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.licensePlate} - {vehicle.make} {vehicle.model}
                        {vehicle.client && ` (${vehicle.client.name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Client Selection - Optional */}
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

              {/* Problem Description */}
              <div className="space-y-2">
                <Label htmlFor="problem">Problem Description *</Label>
                <Textarea
                  id="problem"
                  name="problem"
                  placeholder="Describe the issue reported by the customer..."
                  value={formData.problem}
                  onChange={handleChange}
                  className="min-h-[100px]"
                  required
                />
              </div>

              {/* Initial Diagnosis */}
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Initial Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  name="diagnosis"
                  placeholder="Initial assessment and diagnosis (optional)..."
                  value={formData.diagnosis}
                  onChange={handleChange}
                  className="min-h-[80px]"
                />
              </div>

              {/* Cost and Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedCost">Estimated Cost</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="estimatedCost"
                      name="estimatedCost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.estimatedCost}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedEndDate">Estimated Completion Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="estimatedEndDate"
                      name="estimatedEndDate"
                      type="date"
                      value={formData.estimatedEndDate}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Assignment and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignedToId">Assign to Employee</Label>
                  <Select value={formData.assignedToId} onValueChange={(value) => handleSelectChange('assignedToId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_assignment">No assignment</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parkingSpot">Parking Spot</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="parkingSpot"
                      name="parkingSpot"
                      placeholder="A-15"
                      value={formData.parkingSpot}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any additional notes or special instructions..."
                  value={formData.notes}
                  onChange={handleChange}
                  className="min-h-[80px]"
                />
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || !formData.vehicleId || !formData.problem}
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
                      Create Repair Order
                    </>
                  )}
                </Button>
                <Link href="/repairs">
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

export default function NewRepairPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <NewRepairPageContent />
    </Suspense>
  )
}
