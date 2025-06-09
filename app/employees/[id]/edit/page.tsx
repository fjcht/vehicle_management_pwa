
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, User, Mail, Shield, AlertCircle } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
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

interface FormData {
  name: string
  email: string
  role: string
  isActive: boolean
}

export default function EditEmployeePage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    role: 'EMPLOYEE',
    isActive: true
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  // Check if user is admin
  const isAdmin = session?.user?.role === 'ADMIN'
  const isEditingSelf = session?.user?.id === params.id

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
        setFormData({
          name: data.name || '',
          email: data.email,
          role: data.role,
          isActive: data.isActive
        })
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/employees/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Employee updated successfully"
        })
        router.push(`/employees/${params.id}`)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to update employee",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
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
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
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
          <Link href={`/employees/${params.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Employee</h1>
            <p className="text-gray-600">Update employee information and permissions</p>
          </div>
        </div>
      </motion.div>

      {/* Warning for self-edit */}
      {isEditingSelf && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You are editing your own account. Be careful when changing your role or status.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Employee Information</span>
            </CardTitle>
            <CardDescription>
              Update the employee's basic information and access level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
                    disabled={isEditingSelf}
                  >
                    <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Employee</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="ADMIN">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4" />
                          <span>Administrator</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-red-500">{errors.role}</p>
                  )}
                  {isEditingSelf && (
                    <p className="text-sm text-gray-500">
                      You cannot change your own role
                    </p>
                  )}
                </div>

                {/* Active Status */}
                <div className="space-y-2">
                  <Label htmlFor="isActive">Account Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                      disabled={isEditingSelf}
                    />
                    <Label htmlFor="isActive" className="text-sm">
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </Label>
                  </div>
                  {isEditingSelf && (
                    <p className="text-sm text-gray-500">
                      You cannot deactivate your own account
                    </p>
                  )}
                </div>
              </div>

              {/* Role Description */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Role Permissions</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {formData.role === 'ADMIN' ? (
                    <>
                      <p>• Full access to all system features</p>
                      <p>• Can manage employees and company settings</p>
                      <p>• Can view and edit all data</p>
                      <p>• Can assign roles and permissions</p>
                    </>
                  ) : (
                    <>
                      <p>• Access to vehicles, repairs, and appointments</p>
                      <p>• Can manage assigned vehicles and repairs</p>
                      <p>• Cannot access employee management</p>
                      <p>• Cannot modify company settings</p>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <Link href={`/employees/${params.id}`}>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
