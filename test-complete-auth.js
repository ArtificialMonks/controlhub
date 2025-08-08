// Complete test of authentication and settings
const fetch = require('node:fetch');

async function testCompleteFlow() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('=== TESTING COMPLETE AUTH AND SETTINGS FLOW ===\n');
    
    // 1. Test if the app is running
    console.log('1. Testing if app is running...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ App is running:', health.status);
    } else {
      console.log('❌ App not responding');
      return;
    }
    
    // 2. Test settings API without auth (should be unauthorized)
    console.log('\n2. Testing settings API without auth...');
    const settingsResponse = await fetch(`${baseUrl}/api/settings`);
    if (settingsResponse.status === 401) {
      console.log('✅ Settings API properly protected (401)');
    } else {
      console.log('⚠️  Settings API response:', settingsResponse.status);
    }
    
    // 3. Test if we can access the login page
    console.log('\n3. Testing login page access...');
    const loginResponse = await fetch(`${baseUrl}/login`);
    if (loginResponse.ok) {
      console.log('✅ Login page accessible');
    } else {
      console.log('❌ Login page error:', loginResponse.status);
    }
    
    // 4. Test if we can access the settings page (should redirect to login)
    console.log('\n4. Testing settings page access...');
    const settingsPageResponse = await fetch(`${baseUrl}/settings`, {
      redirect: 'manual'
    });
    if (settingsPageResponse.status === 302 || settingsPageResponse.status === 307) {
      console.log('✅ Settings page properly redirects unauthenticated users');
    } else {
      console.log('⚠️  Settings page response:', settingsPageResponse.status);
    }
    
    console.log('\n=== AUTH AND SETTINGS FLOW TEST COMPLETE ===');
    console.log('\nNext steps:');
    console.log('1. Open browser to http://localhost:3000');
    console.log('2. Try to create a new account or login');
    console.log('3. Navigate to settings page');
    console.log('4. Try to save some settings');
    console.log('5. Check browser console for detailed debug logs');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testCompleteFlow();