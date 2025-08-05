#!/usr/bin/env tsx
/**
 * Direct Supabase Database Initialization Script
 * This script creates tables directly using Supabase client
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import * as path from 'path'

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

async function checkConnection() {
  console.log('🔌 Testing Supabase connection...')
  
  try {
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

async function createProfilesTable() {
  console.log('📄 Creating profiles table...')
  
  try {
    // Check if table already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (existing !== null) {
      console.log('✅ Profiles table already exists')
      return true
    }
  } catch (error) {
    // Table doesn't exist, which is expected
  }
  
  // Since we can't execute DDL directly through the client, 
  // we'll show the SQL that needs to be run in Supabase
  console.log('ℹ️  Please run the following SQL in your Supabase SQL Editor:')
  console.log(`
-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  client_id TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  `)
  
  return true
}

async function createAutomationsTable() {
  console.log('📄 Creating automations table...')
  
  console.log('ℹ️  Please run the following SQL in your Supabase SQL Editor:')
  console.log(`
-- Automations table
CREATE TABLE IF NOT EXISTS public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('Running', 'Stopped', 'Error', 'Paused')) DEFAULT 'Stopped',
  client_name TEXT NOT NULL,
  webhook_url TEXT,
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
  tags TEXT[] DEFAULT '{}',
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  avg_execution_time INTEGER, -- in milliseconds
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for automations
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own automations" ON public.automations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own automations" ON public.automations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own automations" ON public.automations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own automations" ON public.automations
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update automation stats
CREATE OR REPLACE FUNCTION update_automation_stats()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic stats update
CREATE OR REPLACE TRIGGER automation_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION update_automation_stats();
  `)
  
  return true
}

async function createAuditLogsTable() {
  console.log('📄 Creating audit logs table...')
  
  console.log('ℹ️  Please run the following SQL in your Supabase SQL Editor:')
  console.log(`
-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  automation_id UUID REFERENCES public.automations(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('automation', 'profile', 'auth', 'system', 'webhook', 'api')),
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_automation_id ON public.audit_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
  `)
  
  return true
}

async function createSampleData() {
  console.log('\n📊 Checking for sample data creation...')
  
  try {
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError || !users.length) {
      console.log('ℹ️ No users found - sample data will be created after user registration')
      return
    }
    
    const userId = users[0].id
    console.log(`ℹ️ Found user: ${userId}`)
    
    // Try to check if automations table exists and has data
    try {
      const { data: automations, error } = await supabase
        .from('automations')
        .select('id')
        .limit(1)
      
      if (error) {
        console.log('ℹ️ Automations table not yet created - run the SQL above first')
        return
      }
      
      if (automations && automations.length > 0) {
        console.log('✅ Sample data already exists')
        return
      }
      
      console.log('📊 Creating sample automation data...')
      
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
      
      const { error: insertError } = await supabase
        .from('automations')
        .insert(sampleAutomations)
      
      if (insertError) {
        console.error(`❌ Sample data creation failed: ${insertError.message}`)
      } else {
        console.log('✅ Sample automation data created successfully')
      }
    } catch (err) {
      console.log('ℹ️ Tables not yet created - run the SQL statements above first')
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
  
  // Step 2: Show table creation SQL
  console.log('\n🚀 Database table creation...\n')
  await createProfilesTable()
  await createAutomationsTable() 
  await createAuditLogsTable()
  
  // Step 3: Check for sample data
  if (process.argv.includes('--with-sample-data')) {
    await createSampleData()
  }
  
  console.log('\n🎉 Setup instructions complete!')
  console.log('\nNext steps:')
  console.log('1. Copy and run the SQL statements above in your Supabase SQL Editor')
  console.log('2. Start your application: npm run dev')
  console.log('3. Register a user account')
  console.log('4. Create your first automation')
  console.log('\nOr run this script again with --with-sample-data after creating tables')
}

if (require.main === module) {
  main().catch(console.error)
}