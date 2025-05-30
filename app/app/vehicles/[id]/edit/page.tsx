
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SmartVinInput } from '@/components/smart-vin-input';

interface Client {
  id: string;
  name: string;
  phone: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface Vehicle {
  id: string;
  vin?: string;
  licensePlate: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  engineType?: string;
  transmission?: string;
  fuelType?: string;
  mileage?: number;
  parkingSpot?: string;
  clientId?: string;
  assignedToId?: string;
  client?: {
    id: string;
    name: string;
    phone: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  };
}

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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
    parkingSpot: '',
    clientId: '',
    assignedToId: ''
  });

  const vehicleId = params.id as string;

  useEffect(() => {
    fetchVehicle();
    fetchClients();
    fetchEmployees();
  }, [vehicleId]);

  const fetchVehicle = async () => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Vehicle not found');
          router.push('/vehicles');
          return;
        }
        throw new Error('Error loading vehicle');
      }
      const data = await response.json();
      setVehicle(data);
      
      setFormData({
        vin: data.vin || '',
        licensePlate: data.licensePlate || '',
        make: data.make || '',
        model: data.model || '',
        year: data.year ? data.year.toString() : '',
        color: data.color || '',
        engineType: data.engineType || '',
        transmission: data.transmission || '',
        fuelType: data.fuelType || '',
        mileage: data.mileage ? data.mileage.toString() : '',
        parkingSpot: data.parkingSpot || '',
        clientId: data.clientId || '',
        assignedToId: data.assignedToId || ''
      });
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      toast.error('Error loading vehicle');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleVehicleDataFound = (vehicleData: any) => {
    setFormData(prev => ({
      ...prev,
      vin: vehicleData.vin || prev.vin,
      make: vehicleData.make || prev.make,
      model: vehicleData.model || prev.model,
      year: vehicleData.year ? vehicleData.year.toString() : prev.year,
      engineType: vehicleData.engineType || prev.engineType,
      transmission: vehicleData.transmission || prev.transmission,
      fuelType: vehicleData.fuelType || prev.fuelType
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.licensePlate) {
      toast.error('License plate is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vin: formData.vin || null,
          licensePlate: formData.licensePlate,
          make: formData.make || null,
          model: formData.model || null,
          year: formData.year ? parseInt(formData.year) : null,
          color: formData.color || null,
          engineType: formData.engineType || null,
          transmission: formData.transmission || null,
          fuelType: formData.fuelType || null,
          mileage: formData.mileage ? parseInt(formData.mileage) : null,
          parkingSpot: formData.parkingSpot || null,
          clientId: formData.clientId || null,
          assignedToId: formData.assignedToId || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating vehicle');
      }

      toast.success('Vehicle updated successfully');
      router.push(`/vehicles/${vehicleId}`);
    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      toast.error(error.message || 'Error updating vehicle');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Vehicle not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The vehicle you're trying to edit doesn't exist or has been deleted.
          </p>
          <div className="mt-6">
            <Button onClick={() => router.push('/vehicles')}>
              Back to Vehicles
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/vehicles/${vehicleId}`)}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Vehicle</h1>
          <p className="text-sm text-gray-500">Update vehicle information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* VIN Input */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Identification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="vin-input">VIN (Vehicle Identification Number)</Label>
              <SmartVinInput
                onVehicleDataFound={handleVehicleDataFound}
                initialVin={formData.vin}
              />
            </div>
            
            {/* VIN Display Field */}
            <div>
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                value={formData.vin}
                onChange={(e) => setFormData(prev => ({ ...prev, vin: e.target.value.toUpperCase() }))}
                placeholder="Enter VIN manually if needed"
                maxLength={17}
                className="font-mono"
                style={{ textTransform: 'uppercase' }}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.vin.length}/17 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licensePlate">License Plate *</Label>
                <Input
                  id="licensePlate"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value }))}
                  placeholder="Enter license plate"
                  required
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="Enter vehicle color"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                  placeholder="e.g., Toyota"
                />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="e.g., Camry"
                />
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  placeholder="e.g., 2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="engineType">Engine Type</Label>
                <Input
                  id="engineType"
                  value={formData.engineType}
                  onChange={(e) => setFormData(prev => ({ ...prev, engineType: e.target.value }))}
                  placeholder="e.g., 2.5L I4"
                />
              </div>
              <div>
                <Label htmlFor="transmission">Transmission</Label>
                <Select value={formData.transmission} onValueChange={(value) => setFormData(prev => ({ ...prev, transmission: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transmission" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not specified</SelectItem>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="Automatic">Automatic</SelectItem>
                    <SelectItem value="CVT">CVT</SelectItem>
                    <SelectItem value="Semi-Automatic">Semi-Automatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select value={formData.fuelType} onValueChange={(value) => setFormData(prev => ({ ...prev, fuelType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not specified</SelectItem>
                    <SelectItem value="Gasoline">Gasoline</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="Electric">Electric</SelectItem>
                    <SelectItem value="Plug-in Hybrid">Plug-in Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mileage">Mileage</Label>
                <Input
                  id="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
                  placeholder="Enter current mileage"
                  min="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client">Owner (Client)</Label>
                <Select value={formData.clientId} onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No owner</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assignedTo">Assigned Employee</Label>
                <Select value={formData.assignedToId} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedToId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No assignment</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="parkingSpot">Parking Spot</Label>
              <Input
                id="parkingSpot"
                value={formData.parkingSpot}
                onChange={(e) => setFormData(prev => ({ ...prev, parkingSpot: e.target.value }))}
                placeholder="e.g., A-15, Bay 3"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/vehicles/${vehicleId}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
