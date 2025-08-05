#!/usr/bin/env tsx
/**
 * Create Supabase Tables via Direct API Access
 * Uses the verified working access token to execute SQL migrations
 */

import * as fs from 'fs'
import * as path from 'path'

const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycGhmYnpodXJhYmRtZ3FpbXdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk0MTgyMSwiZXhwIjoyMDY5NTE3ODIxfQ.cGSdVIsSjqaPrFGbV8YK37eS6t90w44urqLGHzAArqs"
const PROJECT_REF = "trphfbzhurabdmgqimwj"
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`

async function executeSQL(sql: string, description: string): Promise<boolean> {
  console.log(`🔧 ${description}...`)
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'apikey': ACCESS_TOKEN,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql })
    })
    
    if (response.ok) {
      console.log(`✅ ${description} completed`)
      return true
    } else {
      const errorText = await response.text()
      console.log(`⚠️  ${description}: ${response.status} - ${errorText}`)
      
      // Some operations might fail but that's okay (like IF NOT EXISTS)
      if (errorText.includes('already exists') || errorText.includes('does not exist')) {
        console.log(`ℹ️  ${description}: Expected condition, continuing...`)
        return true
      }
      
      return false
    }
  } catch (error) {
    console.error(`❌ ${description} error: ${error}`)
    return false
  }
}

async function createExecSQLFunction(): Promise<boolean> {
  console.log('📝 Creating exec_sql helper function...')
  
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
      RETURN 'SUCCESS';
    EXCEPTION
      WHEN OTHERS THEN
        RETURN 'ERROR: ' || SQLERRM;
    END;
    $$;
  `
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'apikey': ACCESS_TOKEN
      },
      body: JSON.stringify({ sql: createFunctionSQL })
    })
    
    if (response.ok) {
      console.log('✅ exec_sql function created successfully')
      return true
    } else {
      // If the function doesn't exist, we'll execute SQL statements individually
      console.log('ℹ️  Will execute SQL statements individually')
      return false
    }
  } catch (error) {
    console.log('ℹ️  Will execute SQL statements individually')
    return false
  }
}

async function createTablesFromSQL(): Promise<boolean> {
  console.log('🏗️  Creating tables from SQL file...')
  
  // Read the SQL file
  const sqlFile = path.join(process.cwd(), 'scripts', 'setup-supabase-sql.sql')
  
  if (!fs.existsSync(sqlFile)) {
    console.error('❌ SQL file not found: scripts/setup-supabase-sql.sql')
    return false
  }
  
  const sqlContent = fs.readFileSync(sqlFile, 'utf8')
  
  // Split into individual statements
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => 
      stmt.length > 0 && 
      !stmt.startsWith('--') && 
      !stmt.startsWith('DO $$') &&
      !stmt.includes('RAISE NOTICE')
    )
  
  console.log(`📋 Found ${statements.length} SQL statements to execute`)
  
  let successCount = 0
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim()
    if (!statement) continue
    
    console.log(`\n📝 Executing statement ${i + 1}/${statements.length}`)
    console.log(`   ${statement.substring(0, 60)}${statement.length > 60 ? '...' : ''}`)
    
    const success = await executeSQL(statement, `Statement ${i + 1}`)
    if (success) {
      successCount++
    }
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log(`\n📊 Execution complete: ${successCount}/${statements.length} statements succeeded`)
  return successCount > 0
}

async function testTableCreation(): Promise<{ [key: string]: boolean }> {
  console.log('\n🔍 Testing table creation...')
  
  const tables = ['profiles', 'automations', 'audit_logs']
  const results: { [key: string]: boolean } = {}
  
  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'apikey': ACCESS_TOKEN
        }
      })
      
      if (response.ok) {
        console.log(`✅ Table '${table}' exists and is accessible`)
        results[table] = true
      } else {
        console.log(`❌ Table '${table}' not accessible: ${response.status}`)
        results[table] = false
      }
    } catch (error) {
      console.log(`❌ Error testing table '${table}': ${error}`)
      results[table] = false
    }
  }
  
  return results
}

async function insertSampleData(): Promise<boolean> {
  console.log('\n📊 Inserting sample automation data...')
  
  try {
    // First, get a user ID
    const usersResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'apikey': ACCESS_TOKEN
      }
    })
    
    if (!usersResponse.ok) {
      console.log('❌ Could not fetch users for sample data')
      return false
    }
    
    const usersData = await usersResponse.json()
    const users = usersData.users || []
    
    if (users.length === 0) {
      console.log('ℹ️  No users found - skipping sample data')
      return true
    }
    
    const userId = users[0].id
    console.log(`ℹ️  Using user ID: ${userId}`)
    
    const sampleAutomations = [
      {
        user_id: userId,
        name: 'Customer Data Sync',
        description: 'Synchronizes customer data between systems',
        client_name: 'Acme Corporation',
        status: 'Running',
        webhook_url: 'https://n8n.artificialmonks.com/webhook/customer-sync',
        priority: 'High',
        tags: ['sync', 'customer', 'data'],
        run_count: 150,
        success_count: 147,
        error_count: 3,
        avg_execution_time: 2500
      },
      {
        user_id: userId,
        name: 'Email Campaign Automation',
        description: 'Automated email marketing campaigns',
        client_name: 'Acme Corporation',
        status: 'Stopped',
        webhook_url: 'https://n8n.artificialmonks.com/webhook/email-campaign',
        priority: 'Medium',
        tags: ['email', 'marketing', 'automation'],
        run_count: 85,
        success_count: 81,
        error_count: 4,
        avg_execution_time: 1800
      },
      {
        user_id: userId,
        name: 'Inventory Management',
        description: 'Manages inventory levels and reordering',
        client_name: 'TechStart Inc',
        status: 'Error',
        webhook_url: 'https://n8n.artificialmonks.com/webhook/inventory',
        priority: 'Critical',
        tags: ['inventory', 'management', 'reorder'],
        run_count: 42,
        success_count: 38,
        error_count: 4,
        avg_execution_time: 3200
      }
    ]
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/automations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'apikey': ACCESS_TOKEN,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(sampleAutomations)
    })
    
    if (response.ok) {
      const insertedData = await response.json()
      console.log(`✅ Inserted ${insertedData.length} sample automations`)
      return true
    } else {
      const errorText = await response.text()
      console.log(`❌ Sample data insertion failed: ${response.status} - ${errorText}`)
      return false
    }
  } catch (error) {
    console.error(`❌ Sample data error: ${error}`)
    return false
  }
}

async function main() {
  console.log('🚀 Direct API Table Creation for Supabase\n')
  
  // Step 1: Try to create exec_sql helper function
  await createExecSQLFunction()
  
  // Step 2: Execute table creation SQL
  const tablesCreated = await createTablesFromSQL()
  
  // Step 3: Test table accessibility
  const tableResults = await testTableCreation()
  
  const allTablesExist = Object.values(tableResults).every(exists => exists)
  
  // Step 4: Insert sample data if all tables exist
  let sampleDataInserted = false
  if (allTablesExist && process.argv.includes('--with-sample-data')) {
    sampleDataInserted = await insertSampleData()
  }
  
  // Summary
  console.log('\n📋 FINAL SUMMARY:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`   SQL Execution: ${tablesCreated ? '✅' : '❌'}`)
  
  Object.entries(tableResults).forEach(([table, exists]) => {
    console.log(`   Table '${table}': ${exists ? '✅' : '❌'}`)
  })
  
  if (process.argv.includes('--with-sample-data')) {
    console.log(`   Sample Data: ${sampleDataInserted ? '✅' : '❌'}`)
  }
  
  if (allTablesExist) {
    console.log('\n🎉 DATABASE SETUP SUCCESSFUL! 🎉')
    console.log('   • All tables created and accessible')
    console.log('   • Ready for application testing')
    console.log('\n🚀 Next steps:')
    console.log('   1. npm run dev')
    console.log('   2. Test automation creation and management')
    console.log('   3. Verify webhook integrations')
  } else {
    console.log('\n⚠️  Some tables may need manual creation')
    console.log('   Check the SQL Editor in Supabase Dashboard')
  }
}

if (require.main === module) {
  main().catch(console.error)
}