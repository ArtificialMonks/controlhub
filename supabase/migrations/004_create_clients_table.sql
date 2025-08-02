-- Create clients table and update automations table structure
-- This migration aligns the database schema with the repository expectations

-- Create clients table
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

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table
CREATE POLICY "Users can view own clients" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON public.clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" ON public.clients
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_name ON public.clients(name);

-- Create trigger for updated_at
CREATE TRIGGER handle_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Migrate existing client data from automations table
INSERT INTO public.clients (user_id, name, created_at)
SELECT DISTINCT user_id, client_name, MIN(created_at)
FROM public.automations
WHERE client_name IS NOT NULL
GROUP BY user_id, client_name
ON CONFLICT DO NOTHING;

-- Add client_id column to automations table
ALTER TABLE public.automations 
ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Update automations with client_id based on client_name
UPDATE public.automations a
SET client_id = c.id
FROM public.clients c
WHERE a.user_id = c.user_id 
  AND a.client_name = c.name;

-- Add the missing webhook URL columns
ALTER TABLE public.automations 
ADD COLUMN IF NOT EXISTS n8n_run_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS n8n_stop_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS n8n_workflow_id TEXT,
ADD COLUMN IF NOT EXISTS avg_duration_ms INTEGER,
ADD COLUMN IF NOT EXISTS success_rate NUMERIC(5,2) DEFAULT 0;

-- Migrate existing webhook_url to n8n_run_webhook_url
UPDATE public.automations 
SET n8n_run_webhook_url = webhook_url 
WHERE webhook_url IS NOT NULL AND n8n_run_webhook_url IS NULL;

-- Update status enum to include 'Stalled'
ALTER TABLE public.automations 
DROP CONSTRAINT IF EXISTS automations_status_check;

ALTER TABLE public.automations 
ADD CONSTRAINT automations_status_check 
CHECK (status IN ('Running', 'Stopped', 'Error', 'Paused', 'Stalled'));

-- Create automation_runs table for tracking execution history
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

-- Enable Row Level Security
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

-- Create policies for automation_runs table
CREATE POLICY "Users can view runs for own automations" ON public.automation_runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.automations 
      WHERE automations.id = automation_runs.automation_id 
      AND automations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create runs for own automations" ON public.automation_runs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.automations 
      WHERE automations.id = automation_runs.automation_id 
      AND automations.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_automation_runs_automation_id ON public.automation_runs(automation_id);
CREATE INDEX idx_automation_runs_created_at ON public.automation_runs(created_at);

-- Create or replace the handle_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update automation statistics calculation
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

-- Create index on client_id for better join performance
CREATE INDEX idx_automations_client_id ON public.automations(client_id);