#!/usr/bin/env tsx
/**
 * Sample Data Seeding Script
 * Creates sample automations for testing and development
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function createSampleAutomations(userId: string) {
  const sampleAutomations = [
    {
      user_id: userId,
      name: 'Customer Data Sync',
      description: 'Synchronizes customer data between CRM and billing systems',
      client_name: 'Acme Corporation',
      status: 'Running',
      webhook_url: 'https://n8n.acme.com/webhook/customer-sync',
      priority: 'High',
      tags: ['sync', 'customer', 'crm'],
      run_count: 1247,
      success_count: 1235,
      error_count: 12,
      avg_execution_time: 2500
    },
    {
      user_id: userId,
      name: 'Email Campaign Automation',
      description: 'Automated email marketing campaigns with segmentation',
      client_name: 'Acme Corporation',
      status: 'Stopped',
      webhook_url: 'https://n8n.acme.com/webhook/email-campaign',
      priority: 'Medium',
      tags: ['email', 'marketing', 'automation'],
      run_count: 89,
      success_count: 85,
      error_count: 4,
      avg_execution_time: 1800
    },
    {
      user_id: userId,
      name: 'Inventory Management',
      description: 'Manages inventory levels and automatic reordering',
      client_name: 'TechStart Inc',
      status: 'Error',
      webhook_url: 'https://n8n.techstart.com/webhook/inventory',
      priority: 'Critical',
      tags: ['inventory', 'management', 'reorder'],
      run_count: 456,
      success_count: 398,
      error_count: 58,
      avg_execution_time: 3200
    },
    {
      user_id: userId,
      name: 'Social Media Posting',
      description: 'Automated social media content posting and scheduling',
      client_name: 'TechStart Inc',
      status: 'Running',
      webhook_url: 'https://n8n.techstart.com/webhook/social-media',
      priority: 'Medium',
      tags: ['social', 'media', 'posting'],
      run_count: 234,
      success_count: 232,
      error_count: 2,
      avg_execution_time: 1200
    },
    {
      user_id: userId,
      name: 'Financial Report Generation',
      description: 'Generates monthly financial reports and sends to stakeholders',
      client_name: 'Global Solutions Ltd',
      status: 'Paused',
      webhook_url: 'https://n8n.global.com/webhook/financial-reports',
      priority: 'High',
      tags: ['finance', 'reports', 'monthly'],
      run_count: 12,
      success_count: 11,
      error_count: 1,
      avg_execution_time: 4500
    },
    {
      user_id: userId,
      name: 'Backup Automation',
      description: 'Daily backup of critical data to cloud storage',
      client_name: 'Global Solutions Ltd',
      status: 'Running',
      webhook_url: 'https://n8n.global.com/webhook/backup',
      priority: 'Critical',
      tags: ['backup', 'daily', 'cloud'],
      run_count: 365,
      success_count: 365,
      error_count: 0,
      avg_execution_time: 8900
    }
  ]

  const { data, error } = await supabase
    .from('automations')
    .insert(sampleAutomations)
    .select()

  if (error) {
    console.error('❌ Failed to create sample automations:', error.message)
    return false
  }

  console.log(`✅ Created ${data?.length || 0} sample automations`)
  return true
}

async function main() {
  console.log('🌱 Seeding sample data...\n')

  // Get the first user to assign automations to
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

  if (usersError) {
    console.error('❌ Failed to fetch users:', usersError.message)
    process.exit(1)
  }

  if (!users.users.length) {
    console.error('❌ No users found. Please create a user account first.')
    console.log('💡 Tip: Sign up through your application at /signup')
    process.exit(1)
  }

  const userId = users.users[0].id
  console.log(`👤 Using user: ${users.users[0].email} (${userId})`)

  const success = await createSampleAutomations(userId)

  if (success) {
    console.log('\n🎉 Sample data seeding completed successfully!')
    console.log('\nYour dashboard now has sample automations to explore.')
  } else {
    console.error('\n❌ Sample data seeding failed.')
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}