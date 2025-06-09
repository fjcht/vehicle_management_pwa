
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can view employee details
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const employee = await prisma.user.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            assignedVehicles: true,
            repairOrders: true
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json(employee)

  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can update employees
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, role, isActive } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Validate role
    if (role && !['ADMIN', 'EMPLOYEE'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Verify employee belongs to the company
    const existingEmployee = await prisma.user.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId
      }
    })

    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Prevent changing own role if not admin
    if (id === session.user.id && role && role !== existingEmployee.role) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
    }

    // Check if email is already taken by another user
    if (email !== existingEmployee.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: id },
          companyId: session.user.companyId
        }
      })

      if (emailExists) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }
    }

    // Update employee
    const updatedEmployee = await prisma.user.update({
      where: { id: id },
      data: {
        name,
        email,
        ...(role && { role }),
        ...(typeof isActive === 'boolean' && { isActive })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            assignedVehicles: true,
            repairOrders: true
          }
        }
      }
    })

    return NextResponse.json(updatedEmployee)

  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete employees
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Verify employee belongs to the company
    const employee = await prisma.user.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Soft delete by setting isActive to false
    await prisma.user.update({
      where: { id: id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Employee deleted successfully' })

  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
