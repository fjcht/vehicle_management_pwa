import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/app/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Verificar que el request tenga contenido
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      )
    }

    const {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      adminName,
      adminEmail,
      adminPassword
    } = body

    // Validación más detallada
    const missingFields = []
    if (!companyName?.trim()) missingFields.push('companyName')
    if (!companyEmail?.trim()) missingFields.push('companyEmail')
    if (!adminName?.trim()) missingFields.push('adminName')
    if (!adminEmail?.trim()) missingFields.push('adminEmail')
    if (!adminPassword?.trim()) missingFields.push('adminPassword')

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          missingFields,
          received: Object.keys(body)
        },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(companyEmail)) {
      return NextResponse.json(
        { error: 'Invalid company email format' },
        { status: 400 }
      )
    }
    if (!emailRegex.test(adminEmail)) {
      return NextResponse.json(
        { error: 'Invalid admin email format' },
        { status: 400 }
      )
    }

    // Verificar conexión a la base de datos
    try {
      await prisma.$connect()
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Check if company email already exists
    let existingCompany
    try {
      existingCompany = await prisma.company.findUnique({
        where: { email: companyEmail.toLowerCase().trim() }
      })
    } catch (dbError) {
      console.error('Error checking existing company:', dbError)
      return NextResponse.json(
        { error: 'Database query error while checking company' },
        { status: 500 }
      )
    }

    if (existingCompany) {
      return NextResponse.json(
        { error: 'Company email already registered' },
        { status: 409 } // Conflict status code
      )
    }

    // Check if admin email already exists
    let existingUser
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: adminEmail.toLowerCase().trim() }
      })
    } catch (dbError) {
      console.error('Error checking existing user:', dbError)
      return NextResponse.json(
        { error: 'Database query error while checking user' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Admin email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    let hashedPassword
    try {
      hashedPassword = await bcrypt.hash(adminPassword, 12)
    } catch (hashError) {
      console.error('Password hashing error:', hashError)
      return NextResponse.json(
        { error: 'Password processing error' },
        { status: 500 }
      )
    }

    // Create company and admin user in a transaction
    let result
    try {
      result = await prisma.$transaction(async (tx) => {
        // Create company
        const company = await tx.company.create({
          data: {
            name: companyName.trim(),
            email: companyEmail.toLowerCase().trim(),
            phone: companyPhone?.trim() || null,
            address: companyAddress?.trim() || null,
          }
        })

        // Create admin user
        const user = await tx.user.create({
          data: {
            name: adminName.trim(),
            email: adminEmail.toLowerCase().trim(),
            password: hashedPassword,
            role: 'ADMIN',
            companyId: company.id,
          }
        })

        return { company, user }
      })
    } catch (transactionError) {
      console.error('Transaction error:', transactionError)
      
      // Análisis más detallado del error de Prisma
      if (transactionError.code === 'P2002') {
        return NextResponse.json(
          { error: 'Unique constraint violation - email already exists' },
          { status: 409 }
        )
      }
      
      if (transactionError.code === 'P2003') {
        return NextResponse.json(
          { error: 'Foreign key constraint failed' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { 
          error: 'Database transaction failed',
          details: process.env.NODE_ENV === 'development' ? transactionError.message : undefined
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Company and admin user created successfully',
        companyId: result.company.id,
        userId: result.user.id
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Unexpected registration error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  } finally {
    // Asegurar que la conexión se cierre
    await prisma.$disconnect()
  }
}