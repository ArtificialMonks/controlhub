-- Fix automations table schema alignment for repository compatibility
-- This migration ensures the database schema matches the repository expectations

-- First, check if clients table exists, if not create it
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security if not already enabled
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Users can view own clients') THEN
    CREATE POLICY "Users can view own clients" ON public.clients
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Users can create own clients') THEN
    CREATE POLICY "Users can create own clients" ON public.clients
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Users can update own clients') THEN
    CREATE POLICY "Users can update own clients" ON public.clients
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Users can delete own clients') THEN
    CREATE POLICY "Users can delete own clients" ON public.clients
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);

-- Migrate existing client data from automations table if client_name exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'automations' 
             AND column_name = 'client_name') THEN
    -- Insert unique clients from automations table
    INSERT INTO public.clients (user_id, name, created_at)
    SELECT DISTINCT user_id, client_name, MIN(created_at)
    FROM public.automations
    WHERE client_name IS NOT NULL
    GROUP BY user_id, client_name
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Add missing columns to automations table if they don't exist
DO $$ 
BEGIN
  -- Add client_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'automations' 
                 AND column_name = 'client_id') THEN
    ALTER TABLE public.automations 
    ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;

  -- Add n8n_run_webhook_url if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'automations' 
                 AND column_name = 'n8n_run_webhook_url') THEN
    ALTER TABLE public.automations 
    ADD COLUMN n8n_run_webhook_url TEXT;
  END IF;

  -- Add n8n_stop_webhook_url if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'automations' 
                 AND column_name = 'n8n_stop_webhook_url') THEN
    ALTER TABLE public.automations 
    ADD COLUMN n8n_stop_webhook_url TEXT;
  END IF;

  -- Add n8n_workflow_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'automations' 
                 AND column_name = 'n8n_workflow_id') THEN
    ALTER TABLE public.automations 
    ADD COLUMN n8n_workflow_id TEXT;
  END IF;

  -- Add avg_duration_ms if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'automations' 
                 AND column_name = 'avg_duration_ms') THEN
    ALTER TABLE public.automations 
    ADD COLUMN avg_duration_ms INTEGER;
  END IF;

  -- Add success_rate if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'automations' 
                 AND column_name = 'success_rate') THEN
    ALTER TABLE public.automations 
    ADD COLUMN success_rate NUMERIC(5,2) DEFAULT 0;
  END IF;
END $$;

-- Update automations with client_id based on client_name if needed
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'automations' 
             AND column_name = 'client_name') THEN
    UPDATE public.automations a
    SET client_id = c.id
    FROM public.clients c
    WHERE a.user_id = c.user_id 
      AND a.client_name = c.name
      AND a.client_id IS NULL;
  END IF;
END $$;

-- Migrate existing webhook_url to n8n_run_webhook_url if needed
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'automations' 
             AND column_name = 'webhook_url') THEN
    UPDATE public.automations 
    SET n8n_run_webhook_url = webhook_url 
    WHERE webhook_url IS NOT NULL AND n8n_run_webhook_url IS NULL;
  END IF;
END $$;

-- Update status enum to include 'Stalled' if needed
DO $$ 
BEGIN
  -- Check if Stalled is not in the constraint
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public'
      AND c.conname = 'automations_status_check'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%Stalled%'
  ) THEN
    -- Drop existing constraint
    ALTER TABLE public.automations 
    DROP CONSTRAINT IF EXISTS automations_status_check;
    
    -- Add new constraint with Stalled
    ALTER TABLE public.automations 
    ADD CONSTRAINT automations_status_check 
    CHECK (status IN ('Running', 'Stopped', 'Error', 'Paused', 'Stalled'));
  END IF;
END $$;

-- Create automation_runs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.automation_runs (
  id SERIAL PRIMARY KEY,
  automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security if not already enabled
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

-- Create policies for automation_runs table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_runs' AND policyname = 'Users can view runs for own automations') THEN
    CREATE POLICY "Users can view runs for own automations" ON public.automation_runs
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.automations 
          WHERE automations.id = automation_runs.automation_id 
          AND automations.user_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_runs' AND policyname = 'Users can create runs for own automations') THEN
    CREATE POLICY "Users can create runs for own automations" ON public.automation_runs
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.automations 
          WHERE automations.id = automation_runs.automation_id 
          AND automations.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Create indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_automation_runs_automation_id ON public.automation_runs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_created_at ON public.automation_runs(created_at);
CREATE INDEX IF NOT EXISTS idx_automations_client_id ON public.automations(client_id);

-- Create or replace the handle_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for clients updated_at if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_clients_updated_at') THEN
    CREATE TRIGGER handle_clients_updated_at
      BEFORE UPDATE ON public.clients
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- Create or replace function to calculate automation metrics
CREATE OR REPLACE FUNCTION public.calculate_automation_metrics(p_automation_id UUID)
RETURNS TABLE (
  avg_duration_ms INTEGER,
  success_rate NUMERIC(5,2),
  last_run_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(CASE WHEN ar.duration_ms > 0 THEN ar.duration_ms END)::INTEGER, 0) as avg_duration_ms,
    COALESCE(
      CASE 
        WHEN COUNT(*) > 0 THEN 
          (COUNT(*) FILTER (WHERE ar.status = 'success')::NUMERIC / COUNT(*)::NUMERIC * 100)
        ELSE 0 
      END, 0
    )::NUMERIC(5,2) as success_rate,
    MAX(ar.started_at) as last_run_at
  FROM public.automation_runs ar
  WHERE ar.automation_id = p_automation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;