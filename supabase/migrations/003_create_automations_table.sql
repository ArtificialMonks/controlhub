-- Create automations table
-- This table stores automation workflows and their configurations

CREATE TABLE IF NOT EXISTS public.automations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('data_sync', 'notification', 'reporting', 'integration', 'custom')),
  n8n_workflow_id TEXT,
  configuration JSONB DEFAULT '{}' NOT NULL,
  triggers JSONB DEFAULT '[]' NOT NULL,
  actions JSONB DEFAULT '[]' NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'error', 'archived')),
  is_enabled BOOLEAN DEFAULT false,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'error', 'running', 'cancelled')),
  run_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own automations" ON public.automations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own automations" ON public.automations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own automations" ON public.automations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own automations" ON public.automations
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_automations_user_id ON public.automations(user_id);
CREATE INDEX IF NOT EXISTS idx_automations_client_id ON public.automations(client_id);
CREATE INDEX IF NOT EXISTS idx_automations_status ON public.automations(status);
CREATE INDEX IF NOT EXISTS idx_automations_workflow_type ON public.automations(workflow_type);
CREATE INDEX IF NOT EXISTS idx_automations_is_enabled ON public.automations(is_enabled);
CREATE INDEX IF NOT EXISTS idx_automations_last_run_at ON public.automations(last_run_at);

-- Create trigger for updated_at
CREATE TRIGGER handle_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
