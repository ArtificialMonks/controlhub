#!/usr/bin/env tsx
/**
 * Test Supabase Access Token Directly
 * Verifies the token works with direct API calls
 */

const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycGhmYnpodXJhYmRtZ3FpbXdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk0MTgyMSwiZXhwIjoyMDY5NTE3ODIxfQ.cGSdVIsSjqaPrFGbV8YK37eS6t90w44urqLGHzAArqs"

async function testManagementAPI() {
  console.log('🔑 Testing Supabase Management API with access token...')
  
  try {
    // Test if we can list projects using the management API
    const response = await fetch('https://api.supabase.com/v1/projects', {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`📊 Response status: ${response.status}`)
    
    if (response.ok) {
      const projects = await response.json()
      console.log('✅ Management API access successful!')
      console.log(`📋 Found ${projects.length} projects`)
      
      projects.forEach((project: any) => {
        console.log(`   • ${project.name} (${project.id})`)
      })
      
      return true
    } else {
      const errorText = await response.text()
      console.error(`❌ Management API failed: ${response.status} - ${errorText}`)
      return false
    }
  } catch (error) {
    console.error(`❌ Management API error: ${error}`)
    return false
  }
}

async function testProjectSpecificAPI() {
  console.log('\n🎯 Testing project-specific API access...')
  
  const PROJECT_REF = 'trphfbzhurabdmgqimwj'
  
  try {
    // Test if we can access the project's REST API
    const response = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'apikey': ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`📊 Project API response status: ${response.status}`)
    
    if (response.ok) {
      console.log('✅ Project API access successful!')
      return true
    } else {
      const errorText = await response.text()
      console.error(`❌ Project API failed: ${response.status} - ${errorText}`)
      return false
    }
  } catch (error) {
    console.error(`❌ Project API error: ${error}`)
    return false
  }
}

async function decodeToken() {
  console.log('\n🔍 Analyzing access token...')
  
  try {
    // Decode the JWT token to check its contents
    const parts = ACCESS_TOKEN.split('.')
    const payload = JSON.parse(atob(parts[1]))
    
    console.log('📋 Token payload:')
    console.log(`   • Issuer: ${payload.iss}`)
    console.log(`   • Reference: ${payload.ref}`)
    console.log(`   • Role: ${payload.role}`)
    console.log(`   • Issued: ${new Date(payload.iat * 1000).toISOString()}`)
    console.log(`   • Expires: ${new Date(payload.exp * 1000).toISOString()}`)
    
    const now = Date.now() / 1000
    if (payload.exp < now) {
      console.error('❌ Token has expired!')
      return false
    } else {
      console.log('✅ Token is still valid')
      return true
    }
  } catch (error) {
    console.error(`❌ Token decode error: ${error}`)
    return false
  }
}

async function main() {
  console.log('🔐 Supabase Access Token Verification\n')
  
  // Step 1: Decode and analyze token
  const tokenValid = await decodeToken()
  if (!tokenValid) {
    console.log('\n❌ Token is invalid or expired')
    process.exit(1)
  }
  
  // Step 2: Test Management API
  const managementWorks = await testManagementAPI()
  
  // Step 3: Test Project-specific API
  const projectWorks = await testProjectSpecificAPI()
  
  console.log('\n📋 Summary:')
  console.log(`   Token Valid: ${tokenValid ? '✅' : '❌'}`)
  console.log(`   Management API: ${managementWorks ? '✅' : '❌'}`)
  console.log(`   Project API: ${projectWorks ? '✅' : '❌'}`)
  
  if (tokenValid && (managementWorks || projectWorks)) {
    console.log('\n🎉 Access token is working!')
    console.log('   The issue is likely with MCP server configuration')
  } else {
    console.log('\n❌ Access token has issues')
    console.log('   May need to regenerate or check permissions')
  }
}

if (require.main === module) {
  main().catch(console.error)
}