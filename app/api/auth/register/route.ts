
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/app/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      adminName,
      adminEmail,
      adminPassword
    } = body

    // Validate required fields
    if (!companyName || !companyEmail || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if company email already exists
    const existingCompany = await prisma.company.findUnique({
      where: { email: companyEmail }
    })

    if (existingCompany) {
      return NextResponse.json(
        { error: 'Company email already registered' },
        { status: 400 }
      )
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Admin email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Create company and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
          email: companyEmail,
          phone: companyPhone,
          address: companyAddress,
        }
      })

      // Create admin user
      const user = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN',
          companyId: company.id,
        }
      })

      return { company, user }
    })

    return NextResponse.json(
      { 
        message: 'Company and admin user created successfully',
        companyId: result.company.id,
        userId: result.user.id
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
