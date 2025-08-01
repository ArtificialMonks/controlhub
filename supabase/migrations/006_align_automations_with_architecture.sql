-- Migration 006: Align automations table with Architecture Document requirements
-- This migration updates the existing automations table to match the exact schema
-- specified in the Architecture Document for Quest 1.4 compliance

-- First, create a backup of existing data if any exists
CREATE TABLE IF NOT EXISTS public.automations_backup AS 
SELECT * FROM public.automations;

-- Drop existing table and recreate with Architecture Document schema
DROP TABLE IF EXISTS public.automations CASCADE;

-- Create automations table exactly as specified in Architecture Document
CREATE TABLE public.automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'Stopped' CHECK (status IN ('Running', 'Stopped', 'Error', 'Stalled')),
  last_run_at timestamptz,
  avg_duration_ms integer,
  success_rate real DEFAULT 100.0 CHECK (success_rate >= 0 AND success_rate <= 100),
  n8n_run_webhook_url text NOT NULL,
  n8n_stop_webhook_url text
);

-- Create index as specified in Architecture Document
CREATE INDEX ON public.automations (client_id);

-- Enable Row Level Security
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user access control
-- Note: Using client_id based access since automations belong to clients
CREATE POLICY "Users can view client automations" ON public.automations
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert client automations" ON public.automations
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT client_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update client automations" ON public.automations
  FOR UPDATE USING (
    client_id IN (
      SELECT client_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete client automations" ON public.automations
  FOR DELETE USING (
    client_id IN (
      SELECT client_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Recreate automation_runs table to reference the new automations table
DROP TABLE IF EXISTS public.automation_runs CASCADE;

CREATE TABLE public.automation_runs (
  id bigserial PRIMARY KEY,
  automation_id uuid NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  status text NOT NULL CHECK (status IN ('success', 'error')),
  error_message text
);

-- Create index as specified in Architecture Document
CREATE INDEX ON public.automation_runs (automation_id);

-- Enable Row Level Security for automation_runs
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for automation_runs
CREATE POLICY "Users can view client automation runs" ON public.automation_runs
  FOR SELECT USING (
    automation_id IN (
      SELECT id FROM public.automations WHERE client_id IN (
        SELECT client_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert client automation runs" ON public.automation_runs
  FOR INSERT WITH CHECK (
    automation_id IN (
      SELECT id FROM public.automations WHERE client_id IN (
        SELECT client_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Insert sample data for testing (matching Architecture Document schema)
INSERT INTO public.automations (client_id, name, status, last_run_at, avg_duration_ms, success_rate, n8n_run_webhook_url, n8n_stop_webhook_url)
SELECT 
  c.id as client_id,
  'Sample Automation ' || generate_series(1, 3) as name,
  CASE 
    WHEN generate_series(1, 3) = 1 THEN 'Running'
    WHEN generate_series(1, 3) = 2 THEN 'Stopped'
    ELSE 'Error'
  END as status,
  NOW() - INTERVAL '1 hour' * generate_series(1, 3) as last_run_at,
  (1000 + random() * 5000)::integer as avg_duration_ms,
  (85 + random() * 15)::real as success_rate,
  'https://n8n.example.com/webhook/run/' || generate_random_uuid() as n8n_run_webhook_url,
  'https://n8n.example.com/webhook/stop/' || generate_random_uuid() as n8n_stop_webhook_url
FROM public.clients c
LIMIT 1;

-- Add comment for documentation
COMMENT ON TABLE public.automations IS 'Automation workflows table aligned with Architecture Document requirements for Quest 1.4';
COMMENT ON TABLE public.automation_runs IS 'Automation execution history table aligned with Architecture Document requirements for Quest 1.4';
