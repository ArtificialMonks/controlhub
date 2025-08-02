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

async function checkTableStructure() {
  try {
    console.log('📊 Checking table structures...\n')
    
    // Check automations table
    console.log('Automations table:')
    const { data: automations, error: automationsError } = await supabase
      .from('automations')
      .select('*')
      .limit(1)
    
    if (automationsError) {
      console.error('❌ Error checking automations table:', automationsError)
    } else if (automations && automations.length > 0) {
      console.log('✅ Columns:', Object.keys(automations[0]))
    } else {
      console.log('⚠️  No data in automations table, inserting test row...')
      
      // Try to determine what columns exist by attempting different inserts
      const testData = {
        name: 'Test Automation',
        status: 'Stopped'
      }
      
      const { data: testInsert, error: testError } = await supabase
        .from('automations')
        .insert(testData)
        .select()
      
      if (testError) {
        console.error('❌ Error inserting test data:', testError)
      } else {
        console.log('✅ Test insert successful')
      }
    }
    
    // Check clients table
    console.log('\nClients table:')
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1)
    
    if (clientsError) {
      console.error('❌ Error checking clients table:', clientsError)
    } else if (clients && clients.length > 0) {
      console.log('✅ Columns:', Object.keys(clients[0]))
    } else {
      console.log('⚠️  No data in clients table')
    }
    
    // Check automation_runs table
    console.log('\nAutomation_runs table:')
    const { data: runs, error: runsError } = await supabase
      .from('automation_runs')
      .select('*')
      .limit(1)
    
    if (runsError) {
      console.error('❌ Error checking automation_runs table:', runsError)
    } else if (runs && runs.length > 0) {
      console.log('✅ Columns:', Object.keys(runs[0]))
    } else {
      console.log('⚠️  No data in automation_runs table')
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error)
    process.exit(1)
  }
}

// Run the check
checkTableStructure()