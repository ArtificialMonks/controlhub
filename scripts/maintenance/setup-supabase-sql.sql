-- Communitee Control Hub - Complete Database Setup
-- Run this SQL in your Supabase SQL Editor

-- ============================================================================
-- PROFILES TABLE (extends auth.users)
-- ============================================================================

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

-- ============================================================================
-- AUTOMATIONS TABLE
-- ============================================================================

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

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================

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

-- ============================================================================
-- NOTIFICATION: TABLES CREATED SUCCESSFULLY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Communitee Control Hub database setup completed successfully!';
  RAISE NOTICE 'Tables created: profiles, automations, audit_logs';
  RAISE NOTICE 'Next step: Run your application and test the integration';
END $$;