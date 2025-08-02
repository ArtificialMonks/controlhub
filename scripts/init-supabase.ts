#!/usr/bin/env tsx
/**
 * Supabase Database Initialization Script
 * This script sets up the database with all required tables and initial data
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function runMigration(migrationFile: string) {
  console.log(`📄 Running migration: ${migrationFile}`)
  
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile)
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`)
    return false
  }
  
  const sql = fs.readFileSync(migrationPath, 'utf8')
  
  try {
    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.error(`❌ SQL execution failed: ${error.message}`)
          console.error(`Statement: ${statement.substring(0, 100)}...`)
          return false
        }
      }
    }
    
    console.log(`✅ Migration completed: ${migrationFile}`)
    return true
  } catch (err) {
    console.error(`❌ Migration error: ${err}`)
    return false
  }
}

async function runMigrations() {
  console.log('🚀 Starting Supabase database initialization...\n')
  
  const migrations = [
    '001_create_profiles_table.sql',
    '002_create_automations_table.sql', 
    '003_create_audit_logs_table.sql'
  ]
  
  for (const migration of migrations) {
    const success = await runMigration(migration)
    if (!success) {
      console.error(`\n❌ Database initialization failed at: ${migration}`)
      process.exit(1)
    }
  }
  
  console.log('\n✅ Database initialization completed successfully!')
}

async function checkConnection() {
  console.log('🔌 Testing Supabase connection...')
  
  try {
    // Test basic connection by checking if we can access the auth admin
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
    
    if (error) {
      console.error(`❌ Connection test failed: ${error.message}`)
      return false
    }
    
    console.log('✅ Supabase connection successful')
    console.log(`ℹ️  Found ${users.length} existing users`)
    return true
  } catch (err) {
    console.error(`❌ Connection error: ${err}`)
    return false
  }
}

async function createSampleData() {
  console.log('\n📊 Creating sample automation data...')
  
  try {
    // Note: This assumes you have a user account created
    // In a real scenario, this would be done after user registration
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError || !users.users.length) {
      console.log('ℹ️ No users found - sample data will be created after user registration')
      return
    }
    
    const userId = users.users[0].id
    
    const sampleAutomations = [
      {
        user_id: userId,
        name: 'Customer Data Sync',
        description: 'Synchronizes customer data between systems',
        client_name: 'Acme Corporation',
        status: 'Running',
        webhook_url: 'https://n8n.example.com/webhook/customer-sync',
        priority: 'High',
        tags: ['sync', 'customer', 'data']
      },
      {
        user_id: userId,
        name: 'Email Campaign Automation',
        description: 'Automated email marketing campaigns',
        client_name: 'Acme Corporation',
        status: 'Stopped',
        webhook_url: 'https://n8n.example.com/webhook/email-campaign',
        priority: 'Medium',
        tags: ['email', 'marketing', 'automation']
      },
      {
        user_id: userId,
        name: 'Inventory Management',
        description: 'Manages inventory levels and reordering',
        client_name: 'TechStart Inc',
        status: 'Error',
        webhook_url: 'https://n8n.example.com/webhook/inventory',
        priority: 'Critical',
        tags: ['inventory', 'management', 'reorder']
      }
    ]
    
    const { error } = await supabase
      .from('automations')
      .insert(sampleAutomations)
    
    if (error) {
      console.error(`❌ Sample data creation failed: ${error.message}`)
    } else {
      console.log('✅ Sample automation data created successfully')
    }
  } catch (err) {
    console.error(`❌ Sample data error: ${err}`)
  }
}

async function main() {
  console.log('🏗️  Communitee Control Hub - Database Setup\n')
  
  // Step 1: Check connection
  const connected = await checkConnection()
  if (!connected) {
    process.exit(1)
  }
  
  // Step 2: Run migrations
  await runMigrations()
  
  // Step 3: Create sample data (optional)
  if (process.argv.includes('--with-sample-data')) {
    await createSampleData()
  }
  
  console.log('\n🎉 Setup complete! Your Supabase database is ready.')
  console.log('\nNext steps:')
  console.log('1. Start your application: npm run dev')
  console.log('2. Register a user account')
  console.log('3. Create your first automation')
}

if (require.main === module) {
  main().catch(console.error)
}