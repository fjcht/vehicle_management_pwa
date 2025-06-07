
const { decodeVIN } = require('./lib/nhtsa.ts')

async function testVinFunctionality() {
  console.log('Testing VIN functionality...\n')

  // Test 1: Test NHTSA API with existing VIN
  console.log('1. Testing NHTSA API with VIN: 1HGBH41JXMN109186')
  try {
    const result = await decodeVIN('1HGBH41JXMN109186')
    console.log('NHTSA Result:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('NHTSA Error:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 2: Test with a different VIN
  console.log('2. Testing NHTSA API with VIN: 1HGCM82633A004352')
  try {
    const result = await decodeVIN('1HGCM82633A004352')
    console.log('NHTSA Result:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('NHTSA Error:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 3: Test with invalid VIN
  console.log('3. Testing NHTSA API with invalid VIN: INVALID123456789')
  try {
    const result = await decodeVIN('INVALID123456789')
    console.log('NHTSA Result:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('NHTSA Error:', error.message)
  }
}

testVinFunctionality()
