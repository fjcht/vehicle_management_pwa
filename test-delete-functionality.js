
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testDeleteFunctionality() {
  try {
    console.log('🧪 Testing DELETE functionality...\n');

    // Clean up any existing test data
    const timestamp = Date.now();
    
    // Create test company
    const company = await prisma.company.create({
      data: {
        name: 'Test Workshop',
        email: `test-${timestamp}@workshop.com`
      }
    });
    console.log('✅ Created test company:', company.id);

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Test Admin',
        email: `admin-${timestamp}@test.com`,
        password: hashedPassword,
        role: 'ADMIN',
        companyId: company.id
      }
    });
    console.log('✅ Created test user:', user.id);

    // Create test client
    const client = await prisma.client.create({
      data: {
        name: 'Test Client',
        phone: '123-456-7890',
        companyId: company.id
      }
    });
    console.log('✅ Created test client:', client.id);

    // Create test vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        licensePlate: `TEST-${timestamp}`,
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        clientId: client.id,
        companyId: company.id
      }
    });
    console.log('✅ Created test vehicle:', vehicle.id);

    // Create test appointment
    const appointment = await prisma.appointment.create({
      data: {
        title: 'Test Appointment',
        description: 'Test appointment for deletion',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000), // 1 hour later
        clientId: client.id,
        vehicleId: vehicle.id,
        companyId: company.id
      }
    });
    console.log('✅ Created test appointment:', appointment.id);

    // Create test repair order
    const repairOrder = await prisma.repairOrder.create({
      data: {
        orderNumber: `TEST-${timestamp}`,
        problem: 'Test repair problem',
        clientId: client.id,
        vehicleId: vehicle.id,
        companyId: company.id
      }
    });
    console.log('✅ Created test repair order:', repairOrder.id);

    // Test 1: Delete appointment
    console.log('\n🧪 Testing appointment deletion...');
    try {
      await prisma.appointment.delete({
        where: { id: appointment.id }
      });
      console.log('✅ Appointment deleted successfully');
    } catch (error) {
      console.log('❌ Failed to delete appointment:', error.message);
    }

    // Test 2: Delete repair order
    console.log('\n🧪 Testing repair order deletion...');
    try {
      await prisma.repairOrder.delete({
        where: { id: repairOrder.id }
      });
      console.log('✅ Repair order deleted successfully');
    } catch (error) {
      console.log('❌ Failed to delete repair order:', error.message);
    }

    // Test 3: Try to delete vehicle (should work now that appointments and repairs are gone)
    console.log('\n🧪 Testing vehicle deletion...');
    try {
      await prisma.vehicle.delete({
        where: { id: vehicle.id }
      });
      console.log('✅ Vehicle deleted successfully');
    } catch (error) {
      console.log('❌ Failed to delete vehicle:', error.message);
    }

    // Test 4: Delete client
    console.log('\n🧪 Testing client deletion...');
    try {
      await prisma.client.delete({
        where: { id: client.id }
      });
      console.log('✅ Client deleted successfully');
    } catch (error) {
      console.log('❌ Failed to delete client:', error.message);
    }

    // Test 5: Delete user (soft delete)
    console.log('\n🧪 Testing user deletion (soft delete)...');
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: false }
      });
      console.log('✅ User soft deleted successfully');
    } catch (error) {
      console.log('❌ Failed to soft delete user:', error.message);
    }

    // Cleanup: Delete company (this should cascade delete everything)
    console.log('\n🧪 Testing company deletion (cascade)...');
    try {
      await prisma.company.delete({
        where: { id: company.id }
      });
      console.log('✅ Company deleted successfully (cascade)');
    } catch (error) {
      console.log('❌ Failed to delete company:', error.message);
    }

    console.log('\n✅ All DELETE functionality tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteFunctionality();
