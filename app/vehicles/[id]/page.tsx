
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { ArrowLeft, Edit, Trash2, Car, User, Calendar, Wrench, AlertCircle, QrCode, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
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
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
    phone: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  };
  _count: {
    repairOrders: number;
    appointments: number;
  };
}

export default function VehicleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  const vehicleId = params.id as string;

  useEffect(() => {
    fetchVehicle();
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
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      toast.error('Error loading vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting vehicle');
      }

      toast.success('Vehicle deleted successfully');
      router.push('/vehicles');
    } catch (error: any) {
      console.error('Error deleting vehicle:', error);
      toast.error(error.message || 'Error deleting vehicle');
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
            The vehicle you're looking for doesn't exist or has been deleted.
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/vehicles')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vehicle Details</h1>
            <p className="text-sm text-gray-500">License Plate: {vehicle.licensePlate}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/vehicles/${vehicleId}/edit`}>
            <Button variant="outline" className="flex items-center space-x-2">
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          </Link>
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
                  This action cannot be undone. This will permanently delete the vehicle
                  and all associated data.
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
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Car className="h-5 w-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Make & Model</p>
                  <p className="text-lg font-semibold">
                    {vehicle.make && vehicle.model ? `${vehicle.make} ${vehicle.model}` : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Year</p>
                  <p className="text-lg font-semibold">{vehicle.year || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">License Plate</p>
                  <p className="text-lg font-semibold">{vehicle.licensePlate}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Color</p>
                  <div className="flex items-center space-x-2">
                    {vehicle.color && (
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: vehicle.color.toLowerCase() }}
                      />
                    )}
                    <p className="text-lg font-semibold">{vehicle.color || 'Not specified'}</p>
                  </div>
                </div>
              </div>
              
              {vehicle.vin && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-gray-500 flex items-center space-x-2">
                      <QrCode className="h-4 w-4" />
                      <span>VIN</span>
                    </p>
                    <p className="text-lg font-mono font-semibold">{vehicle.vin}</p>
                  </div>
                </>
              )}
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
                  <p className="text-sm font-medium text-gray-500">Engine Type</p>
                  <p className="text-lg font-semibold">{vehicle.engineType || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Transmission</p>
                  <p className="text-lg font-semibold">{vehicle.transmission || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fuel Type</p>
                  <p className="text-lg font-semibold">{vehicle.fuelType || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Mileage</p>
                  <p className="text-lg font-semibold">
                    {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} miles` : 'Not specified'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Wrench className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{vehicle._count.repairOrders}</p>
                    <p className="text-sm text-gray-600">Repair Orders</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{vehicle._count.appointments}</p>
                    <p className="text-sm text-gray-600">Appointments</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Owner</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vehicle.client ? (
                <div className="space-y-2">
                  <p className="font-semibold">{vehicle.client.name}</p>
                  <p className="text-sm text-gray-600">{vehicle.client.phone}</p>
                  <Link href={`/clients/${vehicle.client.id}`}>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      View Client Details
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-gray-500 italic">No owner assigned</p>
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
              {vehicle.assignedTo ? (
                <div className="space-y-2">
                  <p className="font-semibold">{vehicle.assignedTo.name}</p>
                  <Badge variant="secondary">Assigned</Badge>
                </div>
              ) : (
                <p className="text-gray-500 italic">No employee assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          {vehicle.parkingSpot && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Location</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Parking Spot</p>
                  <Badge variant="outline" className="text-lg">
                    {vehicle.parkingSpot}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/repairs/new?vehicleId=${vehicleId}`}>
                <Button className="w-full" size="sm">
                  <Wrench className="h-4 w-4 mr-2" />
                  New Repair Order
                </Button>
              </Link>
              <Link href={`/appointments/new?vehicleId=${vehicleId}`}>
                <Button variant="outline" className="w-full" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Record Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-sm text-gray-700">
                  {new Date(vehicle.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="text-sm text-gray-700">
                  {new Date(vehicle.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
