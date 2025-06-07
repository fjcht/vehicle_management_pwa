
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    // Create a test company
    const company = await prisma.company.upsert({
      where: { email: 'test@workshop.com' },
      update: {},
      create: {
        name: 'Test Workshop',
        email: 'test@workshop.com',
        phone: '555-0123',
        address: '123 Test Street'
      }
    })

    console.log('Company created:', company.id)

    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10)
    const user = await prisma.user.upsert({
      where: { email: 'admin@workshop.com' },
      update: {},
      create: {
        name: 'Test Admin',
        email: 'admin@workshop.com',
        password: hashedPassword,
        role: 'ADMIN',
        companyId: company.id
      }
    })

    console.log('User created:', user.id)

    // Create a test client
    const existingClient = await prisma.client.findFirst({
      where: { 
        phone: '555-1234',
        companyId: company.id
      }
    })

    const client = existingClient || await prisma.client.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        address: '456 Client Street',
        companyId: company.id
      }
    })

    console.log('Client created:', client.id)

    // Create a test vehicle with VIN
    const vehicle = await prisma.vehicle.upsert({
      where: { vin: '1HGBH41JXMN109186' },
      update: {},
      create: {
        vin: '1HGBH41JXMN109186',
        licensePlate: 'TEST-123',
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        color: 'Blue',
        engineType: '2.0L I4',
        transmission: 'CVT',
        fuelType: 'Gasoline',
        mileage: 25000,
        clientId: client.id,
        companyId: company.id,
        parkingSpot: 'A-1'
      }
    })

    console.log('Vehicle created:', vehicle.id)
    console.log('Test data created successfully!')

  } catch (error) {
    console.error('Error creating test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
