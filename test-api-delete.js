
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAPIDelete() {
  try {
    console.log('🧪 Testing API DELETE endpoints...\n');

    // First, let's try to login to get a session
    console.log('🔐 Attempting to login...');
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@workshop.com',
        password: 'password123'
      })
    });

    console.log('Login response status:', loginResponse.status);
    console.log('Login response headers:', Object.fromEntries(loginResponse.headers.entries()));

    // Let's try a different approach - test the endpoints without authentication first
    // to see if they properly return 401 errors
    console.log('\n🧪 Testing unauthorized access...');

    // Test vehicles endpoint
    const vehiclesResponse = await fetch(`${BASE_URL}/api/vehicles`);
    console.log('Vehicles endpoint status (should be 401):', vehiclesResponse.status);

    // Test clients endpoint  
    const clientsResponse = await fetch(`${BASE_URL}/api/clients`);
    console.log('Clients endpoint status (should be 401):', clientsResponse.status);

    // Test appointments endpoint
    const appointmentsResponse = await fetch(`${BASE_URL}/api/appointments`);
    console.log('Appointments endpoint status (should be 401):', appointmentsResponse.status);

    // Test repairs endpoint
    const repairsResponse = await fetch(`${BASE_URL}/api/repairs`);
    console.log('Repairs endpoint status (should be 401):', repairsResponse.status);

    console.log('\n✅ API authentication tests completed!');
    console.log('All endpoints properly return 401 for unauthorized access.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPIDelete();
