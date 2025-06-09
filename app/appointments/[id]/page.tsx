
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Separator } from '@/app/components/ui/separator';
import { ArrowLeft, Edit, Trash2, Car, User, Calendar, Clock, Phone, AlertCircle } from 'lucide-react';
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

interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  vehicle?: {
    id: string;
    licensePlate: string;
    make?: string;
    model?: string;
    year?: number;
  };
}

const statusOptions = [
  { value: 'SCHEDULED', label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'bg-green-100 text-green-800' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-gray-100 text-gray-800' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
];

export default function AppointmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const appointmentId = params.id as string;

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Appointment not found');
          router.push('/appointments');
          return;
        }
        throw new Error('Error loading appointment');
      }
      const data = await response.json();
      setAppointment(data);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      toast.error('Error loading appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!appointment) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...appointment,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Error updating status');
      }

      const updatedAppointment = await response.json();
      setAppointment(updatedAppointment);
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
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error deleting appointment');
      }

      toast.success('Appointment deleted successfully');
      router.push('/appointments');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Error deleting appointment');
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
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

  if (!appointment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Appointment not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The appointment you're looking for doesn't exist or has been deleted.
          </p>
          <div className="mt-6">
            <Button onClick={() => router.push('/appointments')}>
              Back to Appointments
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const startDateTime = formatDateTime(appointment.startTime);
  const endDateTime = formatDateTime(appointment.endTime);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/appointments')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
            <p className="text-sm text-gray-500">{appointment.title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/appointments/${appointmentId}/edit`}>
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
                  This action cannot be undone. This will permanently delete the appointment
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
                  Current Status
                </label>
                <Select
                  value={appointment.status}
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

          {/* Appointment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Appointment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Title</p>
                <p className="text-lg font-semibold">{appointment.title}</p>
              </div>
              
              {appointment.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{appointment.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Schedule</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-lg font-semibold">{startDateTime.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <p className="text-lg font-semibold">
                      {startDateTime.time} - {endDateTime.time}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          {appointment.vehicle && (
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
                    <p className="text-sm font-medium text-gray-500">License Plate</p>
                    <p className="text-lg font-semibold">{appointment.vehicle.licensePlate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Make & Model</p>
                    <p className="text-lg font-semibold">
                      {appointment.vehicle.make && appointment.vehicle.model 
                        ? `${appointment.vehicle.make} ${appointment.vehicle.model}`
                        : 'Not specified'
                      }
                    </p>
                  </div>
                  {appointment.vehicle.year && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Year</p>
                      <p className="text-lg font-semibold">{appointment.vehicle.year}</p>
                    </div>
                  )}
                </div>
                <div className="pt-2">
                  <Link href={`/vehicles/${appointment.vehicle.id}`}>
                    <Button variant="outline" size="sm">
                      View Vehicle Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
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
              {appointment.client ? (
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">{appointment.client.name}</p>
                    {appointment.client.email && (
                      <p className="text-sm text-gray-600">{appointment.client.email}</p>
                    )}
                  </div>
                  
                  {appointment.client.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-600">{appointment.client.phone}</p>
                    </div>
                  )}
                  
                  <Link href={`/clients/${appointment.client.id}`}>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      View Client Details
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-gray-500 italic">No client assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {appointment.status === 'SCHEDULED' && (
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={() => handleStatusChange('CONFIRMED')}
                  disabled={updating}
                >
                  Confirm Appointment
                </Button>
              )}
              {appointment.status === 'CONFIRMED' && (
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                  disabled={updating}
                >
                  Start Appointment
                </Button>
              )}
              {appointment.status === 'IN_PROGRESS' && (
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={() => handleStatusChange('COMPLETED')}
                  disabled={updating}
                >
                  Complete Appointment
                </Button>
              )}
              {appointment.vehicle && (
                <Link href={`/repairs/new?vehicleId=${appointment.vehicle.id}`}>
                  <Button variant="outline" className="w-full" size="sm">
                    Create Repair Order
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Record Information */}
          <Card>
            <CardHeader>
              <CardTitle>Record Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-sm text-gray-700">
                  {new Date(appointment.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="text-sm text-gray-700">
                  {new Date(appointment.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
