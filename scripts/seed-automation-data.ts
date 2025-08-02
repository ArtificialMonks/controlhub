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

async function seedAutomationData() {
  try {
    console.log('🌱 Seeding automation data...')
    
    // Get the first user
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    if (userError || !users?.users?.length) {
      console.error('❌ No users found. Please create a user first.')
      return
    }
    
    const userId = users.users[0].id
    console.log(`📝 Using user ID: ${userId}`)
    
    // Create clients
    const clientsData = [
      { user_id: userId, name: 'Acme Corp', description: 'Enterprise customer' },
      { user_id: userId, name: 'TechStart Inc', description: 'Startup customer' },
      { user_id: userId, name: 'Global Solutions', description: 'International client' },
      { user_id: userId, name: 'Local Business Co', description: 'Small business client' }
    ]
    
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .insert(clientsData)
      .select()
    
    if (clientError) {
      console.error('❌ Error creating clients:', clientError)
      return
    }
    
    console.log(`✅ Created ${clients.length} clients`)
    
    // Create automations - using the actual column structure
    const automationsData = [
      {
        client_id: clients[0].id,
        name: 'Daily Sales Report',
        status: 'Running',
        n8n_run_webhook_url: 'https://n8n.example.com/webhook/daily-sales',
        n8n_stop_webhook_url: 'https://n8n.example.com/webhook/daily-sales/stop',
        success_rate: 98.5,
        avg_duration_ms: 3500,
        last_run_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 mins ago
      },
      {
        client_id: clients[0].id,
        name: 'Customer Data Sync',
        status: 'Running',
        n8n_run_webhook_url: 'https://n8n.example.com/webhook/customer-sync',
        n8n_stop_webhook_url: 'https://n8n.example.com/webhook/customer-sync/stop',
        success_rate: 95.2,
        avg_duration_ms: 12000,
        last_run_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
      },
      {
        client_id: clients[1].id,
        name: 'Inventory Update',
        status: 'Stopped',
        n8n_run_webhook_url: 'https://n8n.example.com/webhook/inventory',
        success_rate: 89.7,
        avg_duration_ms: 8500,
        last_run_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
      },
      {
        client_id: clients[1].id,
        name: 'Weekly Analytics',
        status: 'Error',
        n8n_run_webhook_url: 'https://n8n.example.com/webhook/analytics',
        success_rate: 67.3,
        avg_duration_ms: 25000,
        last_run_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() // 45 mins ago
      },
      {
        client_id: clients[2].id,
        name: 'Email Campaign',
        status: 'Running',
        n8n_run_webhook_url: 'https://n8n.example.com/webhook/email-campaign',
        n8n_stop_webhook_url: 'https://n8n.example.com/webhook/email-campaign/stop',
        success_rate: 92.8,
        avg_duration_ms: 15000,
        last_run_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 mins ago
      },
      {
        client_id: clients[2].id,
        name: 'Social Media Poster',
        status: 'Running',
        n8n_run_webhook_url: 'https://n8n.example.com/webhook/social-media',
        success_rate: 88.5,
        avg_duration_ms: 5500,
        last_run_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 mins ago
      },
      {
        client_id: clients[3].id,
        name: 'Backup Process',
        status: 'Stopped',
        n8n_run_webhook_url: 'https://n8n.example.com/webhook/backup',
        success_rate: 75.0,
        avg_duration_ms: 45000,
        last_run_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() // 3 hours ago
      },
      {
        client_id: clients[3].id,
        name: 'Data Cleaner',
        status: 'Stopped',
        n8n_run_webhook_url: 'https://n8n.example.com/webhook/cleaner',
        success_rate: 99.1,
        avg_duration_ms: 2000,
        last_run_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() // 2 days ago
      }
    ]
    
    const { data: automations, error: automationError } = await supabase
      .from('automations')
      .insert(automationsData)
      .select()
    
    if (automationError) {
      console.error('❌ Error creating automations:', automationError)
      return
    }
    
    console.log(`✅ Created ${automations.length} automations`)
    
    // Create some automation runs for history
    const runsData = []
    for (const automation of automations) {
      // Create 5-10 runs per automation
      const runCount = Math.floor(Math.random() * 6) + 5
      for (let i = 0; i < runCount; i++) {
        const success = Math.random() > 0.2 // 80% success rate
        const duration = automation.avg_duration_ms + (Math.random() * 2000 - 1000)
        const startedAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 + i * 1000 * 60 * 60 * 12) // Over last 7 days
        
        runsData.push({
          automation_id: automation.id,
          started_at: startedAt.toISOString(),
          completed_at: new Date(startedAt.getTime() + duration).toISOString(),
          duration_ms: Math.round(duration),
          status: success ? 'success' : 'error',
          error_message: success ? null : 'Connection timeout'
        })
      }
    }
    
    const { data: runs, error: runsError } = await supabase
      .from('automation_runs')
      .insert(runsData)
      .select()
    
    if (runsError) {
      console.error('❌ Error creating automation runs:', runsError)
    } else {
      console.log(`✅ Created ${runs.length} automation runs`)
    }
    
    console.log('\n🎉 Sample data seeded successfully!')
    console.log('You can now test the /automations page with realistic data.')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run the seeding
seedAutomationData()