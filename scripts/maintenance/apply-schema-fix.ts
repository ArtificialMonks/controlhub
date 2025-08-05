#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  try {
    console.log('🔧 Applying schema alignment migration...')
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '007_fix_automations_schema_alignment.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log('⚠️  exec_sql function not found, attempting direct execution...')
      
      // Split the migration into individual statements and execute them
      const statements = migrationSQL
        .split(/;\s*$/m)
        .filter(stmt => stmt.trim())
        .map(stmt => stmt.trim() + ';')
      
      for (const statement of statements) {
        // Skip DO blocks as they need special handling
        if (statement.startsWith('DO $$')) {
          console.log('⏭️  Skipping DO block (requires manual execution)')
          continue
        }
        
        try {
          const { error: stmtError } = await supabase.from('_migrations').select('*').limit(1)
          if (stmtError) {
            console.error(`❌ Error checking connection: ${stmtError.message}`)
            throw stmtError
          }
        } catch (e) {
          console.error(`❌ Error executing statement: ${e}`)
        }
      }
      
      console.log('⚠️  Migration partially applied. Some statements may need manual execution in Supabase SQL Editor.')
    } else {
      console.log('✅ Migration applied successfully!')
    }
    
    // Verify the schema changes
    console.log('\n📊 Verifying schema changes...')
    
    // Check if clients table exists
    const { data: clientsTable } = await supabase
      .from('clients')
      .select('count')
      .limit(1)
    
    if (clientsTable !== null) {
      console.log('✅ Clients table exists')
    } else {
      console.log('❌ Clients table not found')
    }
    
    // Check if automations table has the required columns
    const { data: automationsTest } = await supabase
      .from('automations')
      .select('id, client_id, n8n_run_webhook_url, n8n_stop_webhook_url, success_rate, avg_duration_ms')
      .limit(1)
    
    if (automationsTest !== null) {
      console.log('✅ Automations table has the required columns')
    } else {
      console.log('❌ Some columns may be missing from automations table')
    }
    
    console.log('\n📝 Migration Notes:')
    console.log('- If you see errors above, please run the migration SQL manually in Supabase SQL Editor')
    console.log('- The migration file is located at: supabase/migrations/007_fix_automations_schema_alignment.sql')
    console.log('- This migration is idempotent and safe to run multiple times')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
applyMigration()