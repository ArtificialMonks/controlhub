// Test script to verify settings API functionality
const fetch = require('node-fetch');

async function testSettingsAPI() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    // First, check if the API is accessible
    console.log('Testing API health...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData.status);
    
    // Test the settings API endpoint
    console.log('\nTesting settings API endpoint...');
    const settingsResponse = await fetch(`${baseUrl}/api/settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (!settingsResponse.ok) {
      console.log('Settings API response status:', settingsResponse.status);
      const errorText = await settingsResponse.text();
      console.log('Error response:', errorText);
    } else {
      const settingsData = await settingsResponse.json();
      console.log('Settings API response:', settingsData);
    }
    
    // Test the debug endpoint
    console.log('\nTesting debug endpoint...');
    const debugResponse = await fetch(`${baseUrl}/api/settings/debug`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('Debug info:', debugData);
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Run the test
testSettingsAPI();