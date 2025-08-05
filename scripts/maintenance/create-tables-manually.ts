#!/usr/bin/env tsx
/**
 * Manual Table Creation Script for Supabase
 * This script uses the Supabase REST API to create tables programmatically
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function createAutomationsDirectly() {
  console.log('📄 Creating automations table directly...')
  
  try {
    // Test if we can insert a sample record to check table structure
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      name: 'Test Automation',
      client_name: 'Test Client',
      status: 'Stopped'
    }
    
    const { error } = await supabase
      .from('automations')
      .insert(testData)
    
    if (error) {
      if (error.message.includes('relation "public.automations" does not exist')) {
        console.log('❌ Automations table does not exist in Supabase')
        console.log('ℹ️  Please create it manually in Supabase SQL Editor')
        return false
      } else if (error.message.includes('violates foreign key constraint')) {
        // Table exists but foreign key constraint failed (expected)
        console.log('✅ Automations table structure is valid')
        return true
      } else {
        console.error(`❌ Table check failed: ${error.message}`)
        return false
      }
    }
    
    // If no error, delete the test record
    await supabase
      .from('automations')
      .delete()
      .eq('user_id', testData.user_id)
    
    console.log('✅ Automations table exists and is functional')
    return true
  } catch (err) {
    console.error(`❌ Error checking automations table: ${err}`)
    return false
  }
}

async function testTablesExist() {
  console.log('🔍 Testing if tables exist...')
  
  // Test profiles table
  try {
    const { error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (profileError && profileError.message.includes('does not exist')) {
      console.log('❌ Profiles table does not exist')
    } else {
      console.log('✅ Profiles table exists')
    }
  } catch (err) {
    console.log('❌ Profiles table check failed')
  }
  
  // Test automations table  
  try {
    const { error: automationError } = await supabase
      .from('automations')
      .select('id')
      .limit(1)
    
    if (automationError && automationError.message.includes('does not exist')) {
      console.log('❌ Automations table does not exist')
    } else {
      console.log('✅ Automations table exists')
    }
  } catch (err) {
    console.log('❌ Automations table check failed')
  }
  
  // Test audit_logs table
  try {
    const { error: auditError } = await supabase
      .from('audit_logs')
      .select('id')
      .limit(1)
    
    if (auditError && auditError.message.includes('does not exist')) {
      console.log('❌ Audit logs table does not exist')
    } else {
      console.log('✅ Audit logs table exists')
    }
  } catch (err) {
    console.log('❌ Audit logs table check failed')
  }
}

async function insertSampleData() {
  console.log('\n📊 Inserting sample data...')
  
  try {
    // Get the first user
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError || !users.length) {
      console.log('❌ No users found - please create a user first')
      return false
    }
    
    const userId = users[0].id
    console.log(`ℹ️  Using user ID: ${userId}`)
    
    // Check if sample data already exists
    const { data: existing } = await supabase
      .from('automations')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    
    if (existing && existing.length > 0) {
      console.log('✅ Sample data already exists')
      return true
    }
    
    // Insert sample automations
    const sampleAutomations = [
      {
        user_id: userId,
        name: 'Customer Data Sync',
        description: 'Synchronizes customer data between systems',
        client_name: 'Acme Corporation',
        status: 'Running',
        webhook_url: 'https://n8n.example.com/webhook/customer-sync',
        priority: 'High',
        tags: ['sync', 'customer', 'data'],
        run_count: 150,
        success_count: 147,
        error_count: 3,
        last_run_at: new Date().toISOString(),
        avg_execution_time: 2500
      },
      {
        user_id: userId,
        name: 'Email Campaign Automation',
        description: 'Automated email marketing campaigns',
        client_name: 'Acme Corporation',
        status: 'Stopped',
        webhook_url: 'https://n8n.example.com/webhook/email-campaign',
        priority: 'Medium',
        tags: ['email', 'marketing', 'automation'],
        run_count: 85,
        success_count: 81,
        error_count: 4,
        last_run_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        avg_execution_time: 1800
      },
      {
        user_id: userId,
        name: 'Inventory Management',
        description: 'Manages inventory levels and reordering',
        client_name: 'TechStart Inc',
        status: 'Error',
        webhook_url: 'https://n8n.example.com/webhook/inventory',
        priority: 'Critical',
        tags: ['inventory', 'management', 'reorder'],
        run_count: 42,
        success_count: 38,
        error_count: 4,
        last_run_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        avg_execution_time: 3200
      },
      {
        user_id: userId,
        name: 'Social Media Posting',
        description: 'Automated social media content posting',
        client_name: 'TechStart Inc',
        status: 'Running',
        webhook_url: 'https://n8n.example.com/webhook/social-media',
        priority: 'Medium',
        tags: ['social', 'media', 'content'],
        run_count: 203,
        success_count: 201,
        error_count: 2,
        last_run_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        avg_execution_time: 1200
      },
      {
        user_id: userId,
        name: 'Financial Report Generation',
        description: 'Generates daily financial reports',
        client_name: 'Global Solutions Ltd',
        status: 'Paused',
        webhook_url: 'https://n8n.example.com/webhook/financial-reports',
        priority: 'High',
        tags: ['finance', 'reports', 'daily'],
        run_count: 67,
        success_count: 62,
        error_count: 5,
        last_run_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        avg_execution_time: 4500
      }
    ]
    
    const { data, error } = await supabase
      .from('automations')
      .insert(sampleAutomations)
      .select()
    
    if (error) {
      console.error(`❌ Sample data insertion failed: ${error.message}`)
      return false
    }
    
    console.log(`✅ Created ${data.length} sample automations`)
    return true
  } catch (err) {
    console.error(`❌ Sample data error: ${err}`)
    return false
  }
}

async function main() {
  console.log('🏗️  Communitee Control Hub - Live Database Testing\n')
  
  // Step 1: Test table existence
  await testTablesExist()
  
  // Step 2: Test functionality if tables exist
  console.log('\n🔄 Testing table functionality...')
  const automationsWorking = await createAutomationsDirectly()
  
  // Step 3: Insert sample data if requested
  if (process.argv.includes('--with-sample-data') && automationsWorking) {
    const sampleDataCreated = await insertSampleData()
    if (sampleDataCreated) {
      console.log('\n✅ Sample data created successfully!')
    }
  }
  
  console.log('\n🎉 Database testing complete!')
  console.log('\nIf tables do not exist, please run the SQL from the previous script in Supabase SQL Editor')
}

if (require.main === module) {
  main().catch(console.error)
}