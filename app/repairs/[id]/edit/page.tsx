
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RepairOrder {
  id: string;
  problem: string;
  status: string;
  estimatedCost?: number | null;
  estimatedEndDate?: string | null;
  vehicleId: string;
  clientId?: string | null;
  assignedToId?: string | null;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    vin: string;
    licensePlate: string;
  };
  client?: {
    id: string;
    name: string;
    email: string;
  } | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

const statusOptions = [
  { value: 'RECEPTION', label: 'Reception' },
  { value: 'DIAGNOSIS', label: 'Diagnosis' },
  { value: 'WAITING_PARTS', label: 'Waiting for Parts' },
  { value: 'IN_REPAIR', label: 'In Repair' },
  { value: 'READY', label: 'Ready' },
  { value: 'DELIVERED', label: 'Delivered' }
];



export default function EditRepairPage() {
  const params = useParams();
  const router = useRouter();
  const [repair, setRepair] = useState<RepairOrder | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const repairId = params.id as string;

  // Form state
  const [formData, setFormData] = useState({
    description: '',
    status: '',
    estimatedCost: '',
    estimatedEndDate: '',
    clientId: '',
    assignedToId: ''
  });

  useEffect(() => {
    fetchData();
  }, [repairId]);

  const fetchData = async () => {
    try {
      // Fetch repair details
      const repairResponse = await fetch(`/api/repairs/${repairId}`);
      if (!repairResponse.ok) {
        if (repairResponse.status === 404) {
          toast.error('Repair not found');
          router.push('/repairs');
          return;
        }
        throw new Error('Error loading repair');
      }
      const repairData = await repairResponse.json();
      setRepair(repairData);

      // Set form data
      setFormData({
        description: repairData.problem || '',
        status: repairData.status || '',
        estimatedCost: repairData.estimatedCost ? repairData.estimatedCost.toString() : '',
        estimatedEndDate: repairData.estimatedEndDate 
          ? new Date(repairData.estimatedEndDate).toISOString().split('T')[0] 
          : '',
        clientId: repairData.clientId || 'none',
        assignedToId: repairData.assignedToId || 'none'
      });

      // Fetch clients and employees
      const [clientsResponse, employeesResponse] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/employees')
      ]);

      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        setClients(clientsData);
      }

      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/repairs/${repairId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problem: formData.description.trim(),
          status: formData.status,
          estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
          estimatedEndDate: formData.estimatedEndDate || null,
          clientId: formData.clientId === 'none' ? null : formData.clientId || null,
          assignedToId: formData.assignedToId === 'none' ? null : formData.assignedToId || null
        }),
      });

      if (!response.ok) {
        throw new Error('Error updating repair');
      }

      toast.success('Repair updated successfully');
      router.push(`/repairs/${repairId}`);
    } catch (error) {
      console.error('Error updating repair:', error);
      toast.error('Error updating repair');
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

  if (!repair) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Repair not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The repair you are looking for does not exist or has been deleted.
          </p>
          <div className="mt-6">
            <Button onClick={() => router.push('/repairs')}>
              Back to Repairs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/repairs/${repairId}`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Repair</h1>
            <p className="text-sm text-gray-500">
              {repair.vehicle.make} {repair.vehicle.model} ({repair.vehicle.licensePlate})
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Work Description</CardTitle>
                <CardDescription>
                  Describe in detail the work to be performed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the work to be performed..."
                  rows={6}
                  required
                />
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information and Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimatedCost">Estimated Cost</Label>
                    <Input
                      id="estimatedCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.estimatedCost}
                      onChange={(e) => handleInputChange('estimatedCost', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimatedEndDate">Estimated Completion Date</Label>
                    <Input
                      id="estimatedEndDate"
                      type="date"
                      value={formData.estimatedEndDate}
                      onChange={(e) => handleInputChange('estimatedEndDate', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clientId">Client</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => handleInputChange('clientId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No client assigned</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assignedToId">Assigned Employee</Label>
                  <Select
                    value={formData.assignedToId}
                    onValueChange={(value) => handleInputChange('assignedToId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No employee assigned</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Information (Read-only) */}
            <Card>
              <CardHeader>
                <CardTitle>Vehicle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Make and Model</p>
                  <p className="font-semibold">
                    {repair.vehicle.make} {repair.vehicle.model}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Year</p>
                  <p className="font-semibold">{repair.vehicle.year}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">License Plate</p>
                  <p className="font-semibold">{repair.vehicle.licensePlate}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">VIN</p>
                  <p className="font-mono text-xs">{repair.vehicle.vin}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/repairs/${repairId}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
