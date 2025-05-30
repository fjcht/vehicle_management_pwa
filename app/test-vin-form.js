
// Test script to verify VIN functionality in the vehicle form
const testVinFormFunctionality = async () => {
  console.log('🔧 Testing VIN Form Functionality...\n');

  // Test 1: Check if we can access the vehicles/new page
  try {
    const response = await fetch('http://localhost:3000/vehicles/new');
    console.log('✅ Vehicles/new page accessible:', response.status === 200);
  } catch (error) {
    console.log('❌ Error accessing vehicles/new page:', error.message);
  }

  // Test 2: Test VIN search in database (should find existing VIN)
  try {
    const response = await fetch('http://localhost:3000/api/vehicles/vin/1HGBH41JXMN109186');
    const result = await response.json();
    console.log('✅ VIN database search working:', result.found ? 'Found existing VIN' : 'VIN not found (expected for new VINs)');
    if (result.found) {
      console.log('   - Vehicle data:', {
        make: result.vehicle.make,
        model: result.vehicle.model,
        year: result.vehicle.year,
        vin: result.vehicle.vin
      });
    }
  } catch (error) {
    console.log('❌ Error testing VIN database search:', error.message);
  }

  // Test 3: Test NHTSA API proxy
  try {
    const response = await fetch('http://localhost:3000/api/nhtsa/1HGBH41JXMN109186');
    const result = await response.json();
    console.log('✅ NHTSA API proxy working:', result.success ? 'Success' : 'Failed');
    if (result.success) {
      console.log('   - NHTSA data:', {
        make: result.data.Make,
        model: result.data.Model,
        year: result.data.ModelYear
      });
    }
  } catch (error) {
    console.log('❌ Error testing NHTSA API:', error.message);
  }

  // Test 4: Test with a different VIN (should get NHTSA data)
  try {
    const testVin = '1FTFW1ET5DFC10312'; // Ford F-150
    const response = await fetch(`http://localhost:3000/api/nhtsa/${testVin}`);
    const result = await response.json();
    console.log('✅ NHTSA test with Ford VIN:', result.success ? 'Success' : 'Failed');
    if (result.success) {
      console.log('   - Ford data:', {
        make: result.data.Make,
        model: result.data.Model,
        year: result.data.ModelYear
      });
    }
  } catch (error) {
    console.log('❌ Error testing Ford VIN:', error.message);
  }

  console.log('\n🎯 VIN Form Functionality Test Complete!');
  console.log('\n📋 Summary:');
  console.log('- VIN field should be visible in the vehicle form');
  console.log('- VIN should auto-fill when using Smart VIN Input');
  console.log('- VIN should be saved to database when creating vehicle');
  console.log('- VIN field should show source (database/NHTSA) when auto-filled');
  console.log('- VIN field should be read-only when auto-filled');
};

// Run the test
testVinFormFunctionality().catch(console.error);
