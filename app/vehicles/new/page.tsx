
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Car, User, Palette, Gauge, Plus, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SmartVinInput } from '@/components/smart-vin-input'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Client {
  id: string
  name: string
}

interface Employee {
  id: string
  name: string
}

interface VehicleData {
  id?: string
  vin?: string
  licensePlate?: string
  make?: string
  model?: string
  year?: number
  color?: string
  engineType?: string
  transmission?: string
  fuelType?: string
  mileage?: number
  parkingSpot?: string
  client?: {
    id: string
    name: string
    phone?: string
    email?: string
  }
  assignedTo?: {
    id: string
    name: string
  }
}

function NewVehiclePageContent() {
  const [formData, setFormData] = useState({
    vin: '',
    licensePlate: '',
    make: '',
    model: '',
    year: '',
    color: '',
    engineType: '',
    transmission: '',
    fuelType: '',
    mileage: '',
    clientId: '',
    assignedToId: '',
    parkingSpot: ''
  })
  const [clients, setClients] = useState<Client[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [foundVehicleData, setFoundVehicleData] = useState<VehicleData | null>(null)
  const [dataSource, setDataSource] = useState<'database' | 'nhtsa' | null>(null)
  const [isDuplicateVin, setIsDuplicateVin] = useState(false)
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
    fetchEmployees()
    
    // Pre-select client if provided in URL
    const clientId = searchParams.get('clientId')
    if (clientId) {
      setFormData(prev => ({ ...prev, clientId }))
    }
  }, [searchParams])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
        setClients(prev => [newClient, ...prev])
        setFormData(prev => ({ ...prev, clientId: newClient.id }))
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

  const handleVehicleDataFound = (data: VehicleData, source: 'database' | 'nhtsa') => {
    setFoundVehicleData(data)
    setDataSource(source)
    setIsDuplicateVin(source === 'database')

    // Auto-fill form data
    setFormData(prev => ({
      ...prev,
      vin: data.vin || prev.vin,
      licensePlate: data.licensePlate || prev.licensePlate,
      make: data.make || prev.make,
      model: data.model || prev.model,
      year: data.year ? data.year.toString() : prev.year,
      color: data.color || prev.color,
      engineType: data.engineType || prev.engineType,
      transmission: data.transmission || prev.transmission,
      fuelType: data.fuelType || prev.fuelType,
      mileage: data.mileage ? data.mileage.toString() : prev.mileage,
      parkingSpot: data.parkingSpot || prev.parkingSpot,
      clientId: data.client?.id || prev.clientId,
      assignedToId: data.assignedTo?.id || prev.assignedToId
    }))

    // If vehicle found in database and has a client, add to clients list if not already there
    if (source === 'database' && data.client) {
      setClients(prev => {
        const exists = prev.find(c => c.id === data.client!.id)
        if (!exists) {
          return [{ id: data.client!.id, name: data.client!.name }, ...prev]
        }
        return prev
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check for duplicate VIN
    if (isDuplicateVin && foundVehicleData) {
      toast({
        title: "Duplicate VIN",
        description: `This vehicle already exists in your database. Owner: ${foundVehicleData.client?.name || 'No owner'}`,
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const submitData = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        clientId: formData.clientId && formData.clientId !== 'no_owner' ? formData.clientId : null,
        assignedToId: formData.assignedToId && formData.assignedToId !== 'none' ? formData.assignedToId : null
      }

      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const vehicle = await response.json()
        toast({
          title: "Success",
          description: "Vehicle created successfully"
        })
        // Redirect to vehicles list instead of non-existent individual page
        router.push('/vehicles')
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create vehicle",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating vehicle:', error)
      toast({
        title: "Error",
        description: "Failed to create vehicle",
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
        <Link href="/vehicles">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vehicles
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Vehicle</h1>
          <p className="text-gray-600">Register a new vehicle in the system</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Smart VIN Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <SmartVinInput 
            onVehicleDataFound={handleVehicleDataFound}
            initialVin={formData.vin}
            disabled={isLoading}
          />
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Car className="w-5 h-5" />
                <span>Vehicle Information</span>
              </CardTitle>
              <CardDescription>
                Enter the vehicle details and ownership information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Duplicate VIN Warning */}
                {isDuplicateVin && foundVehicleData && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Duplicate VIN Found!</strong> This vehicle already exists in your database.
                      {foundVehicleData.client && (
                        <> Current owner: <strong>{foundVehicleData.client.name}</strong></>
                      )}
                      {!foundVehicleData.client && <> No owner currently assigned.</>}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Data Source Info */}
                {dataSource === 'nhtsa' && foundVehicleData && !isDuplicateVin && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertDescription>
                      Vehicle information has been automatically filled from NHTSA database. 
                      Please review and modify as needed before saving.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vin">VIN</Label>
                    <Input
                      id="vin"
                      name="vin"
                      placeholder="17-character VIN"
                      value={formData.vin}
                      onChange={handleChange}
                      className="font-mono uppercase"
                      maxLength={17}
                      readOnly={!!foundVehicleData}
                    />
                    <div className="text-xs text-gray-500">
                      {formData.vin.length}/17 characters
                      {foundVehicleData && (
                        <span className="ml-2 text-blue-600">
                          (Auto-filled from {dataSource === 'database' ? 'database' : 'NHTSA'})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licensePlate">License Plate *</Label>
                    <Input
                      id="licensePlate"
                      name="licensePlate"
                      placeholder="ABC-1234"
                      value={formData.licensePlate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Owner (Optional)</Label>
                    <Select value={formData.clientId} onValueChange={(value) => handleSelectChange('clientId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_owner">No owner assigned</SelectItem>
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

                {/* Vehicle Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="make">Make</Label>
                    <Input
                      id="make"
                      name="make"
                      placeholder="Toyota"
                      value={formData.make}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      name="model"
                      placeholder="Camry"
                      value={formData.model}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      placeholder="2023"
                      value={formData.year}
                      onChange={handleChange}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <div className="relative">
                      <Palette className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="color"
                        name="color"
                        placeholder="Red"
                        value={formData.color}
                        onChange={handleChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mileage">Mileage</Label>
                    <div className="relative">
                      <Gauge className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="mileage"
                        name="mileage"
                        type="number"
                        placeholder="50000"
                        value={formData.mileage}
                        onChange={handleChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="engineType">Engine Type</Label>
                    <Input
                      id="engineType"
                      name="engineType"
                      placeholder="2.5L I4"
                      value={formData.engineType}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transmission">Transmission</Label>
                    <Input
                      id="transmission"
                      name="transmission"
                      placeholder="Automatic"
                      value={formData.transmission}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuelType">Fuel Type</Label>
                    <Input
                      id="fuelType"
                      name="fuelType"
                      placeholder="Gasoline"
                      value={formData.fuelType}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Assignment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assignedToId">Assign to Employee</Label>
                    <Select value={formData.assignedToId} onValueChange={(value) => handleSelectChange('assignedToId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No assignment</SelectItem>
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
                    <Input
                      id="parkingSpot"
                      name="parkingSpot"
                      placeholder="A-15"
                      value={formData.parkingSpot}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex space-x-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading || !formData.licensePlate || isDuplicateVin}
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
                        Create Vehicle
                      </>
                    )}
                  </Button>
                  <Link href="/vehicles">
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
    </div>
  )
}

export default function NewVehiclePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <NewVehiclePageContent />
    </Suspense>
  )
}
