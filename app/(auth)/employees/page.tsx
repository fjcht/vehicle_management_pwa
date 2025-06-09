
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Plus, Search, User, Mail, Shield, Car, Wrench, Edit, Trash2, UserCheck } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { useToast } from '@/app/hooks/use-toast'
import Link from 'next/link'

interface Employee {
  id: string
  name?: string
  email: string
  role: string
  createdAt: string
  _count: {
    assignedVehicles: number
    repairOrders: number
  }
}

export default function EmployeesPage() {
  const { data: session } = useSession()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Check if user is admin
  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    if (isAdmin) {
      fetchEmployees()
    } else {
      setIsLoading(false)
    }
  }, [isAdmin])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch employees",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee? This will remove their access to the system.')) {
      return
    }

    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setEmployees(employees.filter(employee => employee.id !== employeeId))
        toast({
          title: "Success",
          description: "Employee deleted successfully"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete employee",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive"
      })
    }
  }

  const filteredEmployees = employees.filter(employee =>
    employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">
          Access denied. Only administrators can manage employees.
        </div>
      </div>
    )
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600">Manage your workshop team</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/employees/access-control">
            <Button variant="outline">
              <Shield className="w-4 h-4 mr-2" />
              Access Control
            </Button>
          </Link>
          <Link href="/employees/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </Link>
        </div>
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
          placeholder="Search employees..."
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
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-sm text-gray-600">Total Employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {employees.filter(e => e.role === 'ADMIN').length}
            </div>
            <p className="text-sm text-gray-600">Administrators</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {employees.reduce((sum, employee) => sum + employee._count.assignedVehicles, 0)}
            </div>
            <p className="text-sm text-gray-600">Assigned Vehicles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {employees.reduce((sum, employee) => sum + employee._count.repairOrders, 0)}
            </div>
            <p className="text-sm text-gray-600">Active Repairs</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Employees Grid */}
      {filteredEmployees.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-12"
        >
          <div className="text-gray-500 text-lg">
            {searchTerm ? 'No employees found matching your search.' : 'No employees yet.'}
          </div>
          {!searchTerm && (
            <Link href="/employees/new">
              <Button className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Employee
              </Button>
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee, index) => (
            <motion.div
              key={employee.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <span>{employee.name || 'Unnamed Employee'}</span>
                        {employee.role === 'ADMIN' && (
                          <Shield className="w-4 h-4 text-blue-500" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        {employee.email}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Link href={`/employees/${employee.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      {employee.id !== session?.user?.id && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Role */}
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={employee.role === 'ADMIN' ? 'default' : 'secondary'}
                    >
                      {employee.role === 'ADMIN' ? 'Administrator' : 'Employee'}
                    </Badge>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <UserCheck className="w-4 h-4" />
                      <span>
                        Member since {new Date(employee.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-1">
                      <Car className="w-4 h-4 text-gray-400" />
                      <Badge variant="secondary">
                        {employee._count.assignedVehicles} vehicles
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Wrench className="w-4 h-4 text-gray-400" />
                      <Badge variant="outline">
                        {employee._count.repairOrders} repairs
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Link href={`/employees/${employee.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/employees/${employee.id}/edit`}>
                      <Button size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
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
