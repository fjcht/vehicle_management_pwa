
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Shield, 
  User, 
  Calendar, 
  Car, 
  Wrench, 
  UserCheck,
  Activity,
  Clock
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Separator } from '@/app/components/ui/separator'
import { useToast } from '@/app/hooks/use-toast'
import Link from 'next/link'

interface Employee {
  id: string
  name?: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  _count: {
    assignedVehicles: number
    repairOrders: number
  }
}

export default function EmployeeDetailsPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Check if user is admin
  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    if (!isAdmin) {
      router.push('/employees')
      return
    }
    fetchEmployee()
  }, [params.id, isAdmin, router])

  const fetchEmployee = async () => {
    try {
      const response = await fetch(`/api/employees/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setEmployee(data)
      } else if (response.status === 404) {
        toast({
          title: "Error",
          description: "Employee not found",
          variant: "destructive"
        })
        router.push('/employees')
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch employee details",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching employee:', error)
      toast({
        title: "Error",
        description: "Failed to fetch employee details",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAdmin) {
    return null
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">Employee not found</div>
        <Link href="/employees">
          <Button className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Employees
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <Link href="/employees">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
              <span>{employee.name || 'Unnamed Employee'}</span>
              {employee.role === 'ADMIN' && (
                <Shield className="w-6 h-6 text-blue-500" />
              )}
            </h1>
            <p className="text-gray-600">{employee.email}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/employees/${employee.id}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit Employee
            </Button>
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Employee Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-lg">{employee.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <p className="text-lg flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{employee.email}</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <div className="mt-1">
                      <Badge 
                        variant={employee.role === 'ADMIN' ? 'default' : 'secondary'}
                        className="text-sm"
                      >
                        {employee.role === 'ADMIN' ? 'Administrator' : 'Employee'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <Badge 
                        variant={employee.isActive ? 'default' : 'destructive'}
                        className="text-sm"
                      >
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member Since</label>
                    <p className="text-lg flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(employee.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Permissions & Access */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Permissions & Access</span>
                </CardTitle>
                <CardDescription>
                  Current access level and permissions for this employee
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">System Access</h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Dashboard Access</span>
                        <Badge variant="default" className="text-xs">Granted</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Vehicle Management</span>
                        <Badge variant="default" className="text-xs">Granted</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Repair Orders</span>
                        <Badge variant="default" className="text-xs">Granted</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Client Management</span>
                        <Badge variant="default" className="text-xs">Granted</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Administrative Access</h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Employee Management</span>
                        <Badge 
                          variant={employee.role === 'ADMIN' ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {employee.role === 'ADMIN' ? 'Granted' : 'Denied'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">System Settings</span>
                        <Badge 
                          variant={employee.role === 'ADMIN' ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {employee.role === 'ADMIN' ? 'Granted' : 'Denied'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Company Management</span>
                        <Badge 
                          variant={employee.role === 'ADMIN' ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {employee.role === 'ADMIN' ? 'Granted' : 'Denied'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Quick Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Car className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Assigned Vehicles</span>
                  </div>
                  <Badge variant="secondary">
                    {employee._count.assignedVehicles}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wrench className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Active Repairs</span>
                  </div>
                  <Badge variant="outline">
                    {employee._count.repairOrders}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Days Active</span>
                  </div>
                  <Badge variant="secondary">
                    {Math.floor((new Date().getTime() - new Date(employee.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/employees/${employee.id}/edit`} className="block">
                  <Button variant="outline" className="w-full">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Employee
                  </Button>
                </Link>
                <Button variant="outline" className="w-full" disabled>
                  <UserCheck className="w-4 h-4 mr-2" />
                  View Activity Log
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
