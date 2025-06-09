
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Users, 
  Settings, 
  Eye, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Switch } from '@/app/components/ui/switch'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
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

export default function AccessControlPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Check if user is admin
  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    if (!isAdmin) {
      router.push('/employees')
      return
    }
    fetchEmployees()
  }, [isAdmin, router])

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

  const handleRoleChange = async (employeeId: string, newRole: string) => {
    if (employeeId === session?.user?.id) {
      toast({
        title: "Error",
        description: "You cannot change your own role",
        variant: "destructive"
      })
      return
    }

    try {
      const employee = employees.find(e => e.id === employeeId)
      if (!employee) return

      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: employee.name,
          email: employee.email,
          role: newRole,
          isActive: employee.isActive
        })
      })

      if (response.ok) {
        setEmployees(employees.map(emp => 
          emp.id === employeeId ? { ...emp, role: newRole } : emp
        ))
        toast({
          title: "Success",
          description: "Employee role updated successfully"
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to update employee role",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating employee role:', error)
      toast({
        title: "Error",
        description: "Failed to update employee role",
        variant: "destructive"
      })
    }
  }

  const handleStatusToggle = async (employeeId: string, newStatus: boolean) => {
    if (employeeId === session?.user?.id) {
      toast({
        title: "Error",
        description: "You cannot deactivate your own account",
        variant: "destructive"
      })
      return
    }

    try {
      const employee = employees.find(e => e.id === employeeId)
      if (!employee) return

      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: employee.name,
          email: employee.email,
          role: employee.role,
          isActive: newStatus
        })
      })

      if (response.ok) {
        setEmployees(employees.map(emp => 
          emp.id === employeeId ? { ...emp, isActive: newStatus } : emp
        ))
        toast({
          title: "Success",
          description: `Employee ${newStatus ? 'activated' : 'deactivated'} successfully`
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to update employee status",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating employee status:', error)
      toast({
        title: "Error",
        description: "Failed to update employee status",
        variant: "destructive"
      })
    }
  }

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || employee.role === roleFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && employee.isActive) ||
                         (statusFilter === 'inactive' && !employee.isActive)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">
          Access denied. Only administrators can manage access control.
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const adminCount = employees.filter(e => e.role === 'ADMIN').length
  const activeCount = employees.filter(e => e.isActive).length
  const inactiveCount = employees.filter(e => !e.isActive).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <Shield className="w-8 h-8 text-blue-500" />
            <span>Access Control</span>
          </h1>
          <p className="text-gray-600">Manage user roles and permissions</p>
        </div>
        <Link href="/employees">
          <Button variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Back to Employees
          </Button>
        </Link>
      </motion.div>

      {/* Warning Alert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Be careful when modifying user roles and permissions. Changes take effect immediately and may affect system access.
          </AlertDescription>
        </Alert>
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
            <p className="text-sm text-gray-600">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{adminCount}</div>
            <p className="text-sm text-gray-600">Administrators</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <p className="text-sm text-gray-600">Active Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">{inactiveCount}</div>
            <p className="text-sm text-gray-600">Inactive Users</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="ADMIN">Administrators</SelectItem>
            <SelectItem value="EMPLOYEE">Employees</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>User Access Management</CardTitle>
            <CardDescription>
              Manage roles and access permissions for all users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No users found matching your filters.</div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEmployees.map((employee, index) => (
                  <motion.div
                    key={employee.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {employee.name || 'Unnamed Employee'}
                          {employee.id === session?.user?.id && (
                            <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {employee._count.assignedVehicles} vehicles
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {employee._count.repairOrders} repairs
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Role Selector */}
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Role:</label>
                        <Select
                          value={employee.role}
                          onValueChange={(value) => handleRoleChange(employee.id, value)}
                          disabled={employee.id === session?.user?.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EMPLOYEE">
                              <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4" />
                                <span>Employee</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="ADMIN">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4" />
                                <span>Admin</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Toggle */}
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Active:</label>
                        <Switch
                          checked={employee.isActive}
                          onCheckedChange={(checked) => handleStatusToggle(employee.id, checked)}
                          disabled={employee.id === session?.user?.id}
                        />
                        {employee.isActive ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <UserX className="w-4 h-4 text-red-500" />
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-1">
                        <Link href={`/employees/${employee.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/employees/${employee.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Permission Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Permission Matrix</CardTitle>
            <CardDescription>
              Overview of permissions by role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Feature</th>
                    <th className="text-center py-2">Employee</th>
                    <th className="text-center py-2">Administrator</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b">
                    <td className="py-2">Dashboard Access</td>
                    <td className="text-center py-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center py-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Vehicle Management</td>
                    <td className="text-center py-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center py-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Repair Orders</td>
                    <td className="text-center py-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center py-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Client Management</td>
                    <td className="text-center py-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center py-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Employee Management</td>
                    <td className="text-center py-2">
                      <UserX className="w-4 h-4 text-red-500 mx-auto" />
                    </td>
                    <td className="text-center py-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Access Control</td>
                    <td className="text-center py-2">
                      <UserX className="w-4 h-4 text-red-500 mx-auto" />
                    </td>
                    <td className="text-center py-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2">System Settings</td>
                    <td className="text-center py-2">
                      <UserX className="w-4 h-4 text-red-500 mx-auto" />
                    </td>
                    <td className="text-center py-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
