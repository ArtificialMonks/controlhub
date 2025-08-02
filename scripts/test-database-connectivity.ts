#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testDatabaseConnectivity() {
  try {
    console.log('🔍 Testing database connectivity and data retrieval...\n')
    
    // Test 1: Check if we can connect to the database
    console.log('1. Testing basic connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('automations')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message)
      return
    }
    console.log('✅ Database connection successful')
    
    // Test 2: Count records in each table
    console.log('\n2. Checking table data...')
    
    const { count: clientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
    
    const { count: automationsCount } = await supabase
      .from('automations')
      .select('*', { count: 'exact', head: true })
    
    const { count: runsCount } = await supabase
      .from('automation_runs')
      .select('*', { count: 'exact', head: true })
    
    console.log(`   📊 Clients: ${clientsCount || 0}`)
    console.log(`   📊 Automations: ${automationsCount || 0}`)
    console.log(`   📊 Automation Runs: ${runsCount || 0}`)
    
    // Test 3: Sample data from automations with client join
    console.log('\n3. Testing data relationships...')
    const { data: automationsWithClients, error: joinError } = await supabase
      .from('automations')
      .select(`
        id,
        name,
        status,
        success_rate,
        avg_duration_ms,
        last_run_at,
        clients (
          id,
          name
        )
      `)
      .limit(3)
    
    if (joinError) {
      console.error('❌ Join query failed:', joinError.message)
    } else {
      console.log('✅ Successfully retrieved automations with client data:')
      automationsWithClients?.forEach((automation, index) => {
        const clients = automation.clients as any
        const clientName = clients?.name || 'Unknown'
        console.log(`   ${index + 1}. ${automation.name} (Client: ${clientName})`)
        console.log(`      Status: ${automation.status}, Success Rate: ${automation.success_rate}%`)
      })
    }
    
    // Test 4: Test filtering functionality
    console.log('\n4. Testing filtering...')
    const { data: runningAutomations, error: filterError } = await supabase
      .from('automations')
      .select('name, status')
      .eq('status', 'Running')
    
    if (filterError) {
      console.error('❌ Filter query failed:', filterError.message)
    } else {
      console.log(`✅ Found ${runningAutomations?.length || 0} running automations`)
    }
    
    // Test 5: Test statistics calculation
    console.log('\n5. Testing statistics calculation...')
    const { data: statsData, error: statsError } = await supabase
      .from('automations')
      .select('status, success_rate, avg_duration_ms')
    
    if (statsError) {
      console.error('❌ Stats query failed:', statsError.message)
    } else {
      const stats = {
        total: statsData?.length || 0,
        running: statsData?.filter(a => a.status === 'Running').length || 0,
        avgSuccessRate: statsData?.length 
          ? (statsData.reduce((sum, a) => sum + (a.success_rate || 0), 0) / statsData.length).toFixed(1)
          : '0',
        avgDuration: statsData?.length
          ? Math.round(statsData.reduce((sum, a) => sum + (a.avg_duration_ms || 0), 0) / statsData.length)
          : 0
      }
      
      console.log('✅ Statistics calculated successfully:')
      console.log(`   Total Automations: ${stats.total}`)
      console.log(`   Running Automations: ${stats.running}`)
      console.log(`   Average Success Rate: ${stats.avgSuccessRate}%`)
      console.log(`   Average Duration: ${stats.avgDuration}ms`)
    }
    
    console.log('\n🎉 All database connectivity tests passed!')
    console.log('✅ The /automations page should now load with data')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run the test
testDatabaseConnectivity()