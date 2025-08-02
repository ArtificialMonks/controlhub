-- Create automations table for core automation management functionality
-- This table stores automation workflow information integrated with n8n

CREATE TABLE IF NOT EXISTS public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('Running', 'Stopped', 'Error', 'Paused')) DEFAULT 'Stopped',
  client_name TEXT NOT NULL,
  n8n_workflow_id TEXT,
  webhook_url TEXT,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_execution_time INTEGER, -- in milliseconds
  tags TEXT[],
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
  enabled BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

-- Create policies for automations table
CREATE POLICY "Users can view own automations" ON public.automations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own automations" ON public.automations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own automations" ON public.automations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own automations" ON public.automations
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_automations_user_id ON public.automations(user_id);
CREATE INDEX idx_automations_status ON public.automations(status);
CREATE INDEX idx_automations_client_name ON public.automations(client_name);
CREATE INDEX idx_automations_last_run_at ON public.automations(last_run_at);
CREATE INDEX idx_automations_created_at ON public.automations(created_at);

-- Create trigger for updated_at
CREATE TRIGGER handle_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to update automation statistics
CREATE OR REPLACE FUNCTION public.update_automation_stats(
  automation_id UUID,
  execution_time INTEGER,
  success BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.automations
  SET 
    run_count = run_count + 1,
    success_count = CASE WHEN success THEN success_count + 1 ELSE success_count END,
    error_count = CASE WHEN NOT success THEN error_count + 1 ELSE error_count END,
    avg_execution_time = CASE 
      WHEN avg_execution_time IS NULL THEN execution_time
      ELSE ((avg_execution_time * (run_count - 1)) + execution_time) / run_count
    END,
    last_run_at = NOW(),
    updated_at = NOW()
  WHERE id = automation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;