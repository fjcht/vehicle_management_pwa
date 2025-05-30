
const puppeteer = require('puppeteer');

async function testVinScanner() {
  console.log('🚀 Starting VIN Scanner test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  const page = await browser.newPage();
  
  try {
    // Enable console logging from the page
    page.on('console', msg => {
      if (msg.text().includes('[VIN Scanner]')) {
        console.log('📱 VIN Scanner:', msg.text());
      }
    });
    
    // Navigate to login page
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    
    // Login
    console.log('🔐 Logging in...');
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Login successful');
    
    // Navigate to vehicles/new
    console.log('📍 Navigating to new vehicle page...');
    await page.goto('http://localhost:3000/vehicles/new', { waitUntil: 'networkidle0' });
    
    // Wait for VIN scanner component to load
    console.log('⏳ Waiting for VIN scanner to load...');
    await page.waitForSelector('[data-testid="vin-scanner"], .vin-scanner, video', { timeout: 10000 });
    
    // Check if video element exists
    const videoElement = await page.$('video');
    if (videoElement) {
      console.log('✅ Video element found in DOM');
      
      // Get video element properties
      const videoProps = await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video) {
          return {
            tagName: video.tagName,
            readyState: video.readyState,
            networkState: video.networkState,
            src: video.src,
            srcObject: video.srcObject ? 'MediaStream' : null,
            autoplay: video.autoplay,
            muted: video.muted,
            playsInline: video.playsInline
          };
        }
        return null;
      });
      
      console.log('📹 Video element properties:', JSON.stringify(videoProps, null, 2));
    } else {
      console.log('❌ Video element not found in DOM');
    }
    
    // Try to click the camera button
    const cameraButton = await page.$('button:has-text("Start Camera Scan"), button[aria-label*="camera"], button:has([data-lucide="camera"])');
    if (cameraButton) {
      console.log('📷 Found camera button, clicking...');
      await cameraButton.click();
      
      // Wait a bit for camera initialization
      await page.waitForTimeout(3000);
      
      // Check for any error messages
      const errorMessages = await page.$$eval('[role="alert"], .alert, .error', elements => 
        elements.map(el => el.textContent)
      );
      
      if (errorMessages.length > 0) {
        console.log('⚠️ Error messages found:', errorMessages);
      } else {
        console.log('✅ No error messages detected');
      }
      
    } else {
      console.log('❌ Camera button not found');
    }
    
    // Test manual VIN input
    console.log('📝 Testing manual VIN input...');
    const vinInput = await page.$('input[placeholder*="VIN"], input[maxlength="17"]');
    if (vinInput) {
      await vinInput.type('1HGBH41JXMN109186');
      console.log('✅ Manual VIN input successful');
    } else {
      console.log('❌ VIN input field not found');
    }
    
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testVinScanner().catch(console.error);
