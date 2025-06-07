
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash2, Car, User, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface RepairOrder {
  id: string;
  problem: string;
  status: string;
  estimatedCost?: number | null;
  estimatedEndDate?: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    vin: string;
    licensePlate: string;
    client?: {
      id: string;
      name: string;
      email: string;
    } | null;
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

const statusOptions = [
  { value: 'RECEPTION', label: 'Reception', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'DIAGNOSIS', label: 'Diagnosis', color: 'bg-blue-100 text-blue-800' },
  { value: 'WAITING_PARTS', label: 'Waiting for Parts', color: 'bg-orange-100 text-orange-800' },
  { value: 'IN_REPAIR', label: 'In Repair', color: 'bg-purple-100 text-purple-800' },
  { value: 'READY', label: 'Ready', color: 'bg-green-100 text-green-800' },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-gray-100 text-gray-800' }
];



export default function RepairDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [repair, setRepair] = useState<RepairOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const repairId = params.id as string;

  useEffect(() => {
    fetchRepair();
  }, [repairId]);

  const fetchRepair = async () => {
    try {
      const response = await fetch(`/api/repairs/${repairId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Repair not found');
          router.push('/repairs');
          return;
        }
        throw new Error('Error loading repair');
      }
      const data = await response.json();
      setRepair(data);
    } catch (error) {
      console.error('Error fetching repair:', error);
      toast.error('Error loading repair');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!repair) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/repairs/${repairId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problem: repair.problem,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Error updating status');
      }

      const updatedRepair = await response.json();
      setRepair(updatedRepair);
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/repairs/${repairId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error deleting repair');
      }

      toast.success('Repair deleted successfully');
      router.push('/repairs');
    } catch (error) {
      console.error('Error deleting repair:', error);
      toast.error('Error deleting repair');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? (
      <Badge className={statusOption.color}>
        {statusOption.label}
      </Badge>
    ) : (
      <Badge variant="secondary">{status}</Badge>
    );
  };



  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
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
            onClick={() => router.push('/repairs')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Repair Details</h1>
            <p className="text-sm text-gray-500">ID: {repair.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/repairs/${repairId}/edit`)}
            className="flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex items-center space-x-2">
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the repair
                  and all its associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span>Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </label>
                <Select
                  value={repair.status}
                  onValueChange={handleStatusChange}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
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

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Work Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{repair.problem}</p>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Car className="h-5 w-5" />
                <span>Vehicle Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Make and Model</p>
                  <p className="text-lg font-semibold">
                    {repair.vehicle.make} {repair.vehicle.model}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Year</p>
                  <p className="text-lg font-semibold">{repair.vehicle.year}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">VIN</p>
                  <p className="text-lg font-mono">{repair.vehicle.vin}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">License Plate</p>
                  <p className="text-lg font-semibold">{repair.vehicle.licensePlate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Client</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {repair.client ? (
                <div className="space-y-2">
                  <p className="font-semibold">{repair.client.name}</p>
                  <p className="text-sm text-gray-600">{repair.client.email}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No client assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Assigned Employee */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Assigned Employee</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {repair.assignedTo ? (
                <div className="space-y-2">
                  <p className="font-semibold">{repair.assignedTo.name}</p>
                  <p className="text-sm text-gray-600">{repair.assignedTo.email}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No employee assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Financial Information and Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Additional Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Estimated Cost</p>
                <p className="text-lg font-semibold">
                  {repair.estimatedCost ? `$${repair.estimatedCost.toLocaleString()}` : 'Not specified'}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-gray-500">Estimated Completion Date</p>
                <p className="text-lg font-semibold">
                  {repair.estimatedEndDate 
                    ? new Date(repair.estimatedEndDate).toLocaleDateString('en-US')
                    : 'Not specified'
                  }
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-gray-500">Creation Date</p>
                <p className="text-sm text-gray-700">
                  {new Date(repair.createdAt).toLocaleString('en-US')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="text-sm text-gray-700">
                  {new Date(repair.updatedAt).toLocaleString('en-US')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
