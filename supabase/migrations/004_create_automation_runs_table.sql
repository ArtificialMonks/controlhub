-- Create automation_runs table
-- This table stores individual execution records of automations

CREATE TABLE IF NOT EXISTS public.automation_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  execution_id TEXT, -- n8n execution ID
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error', 'cancelled', 'timeout')),
  trigger_data JSONB DEFAULT '{}',
  workflow_name TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error_message TEXT,
  error_details JSONB,
  output_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create automation_telemetry table for metrics and performance data
CREATE TABLE IF NOT EXISTS public.automation_telemetry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE,
  execution_id TEXT,
  metrics JSONB NOT NULL DEFAULT '{}',
  performance_data JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_telemetry ENABLE ROW LEVEL SECURITY;

-- Create policies for automation_runs
CREATE POLICY "Users can view own automation runs" ON public.automation_runs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own automation runs" ON public.automation_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for automation_telemetry
CREATE POLICY "Users can view own telemetry" ON public.automation_telemetry
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own telemetry" ON public.automation_telemetry
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_automation_runs_automation_id ON public.automation_runs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_user_id ON public.automation_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON public.automation_runs(status);
CREATE INDEX IF NOT EXISTS idx_automation_runs_started_at ON public.automation_runs(started_at);
CREATE INDEX IF NOT EXISTS idx_automation_runs_execution_id ON public.automation_runs(execution_id);

CREATE INDEX IF NOT EXISTS idx_automation_telemetry_user_id ON public.automation_telemetry(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_telemetry_automation_id ON public.automation_telemetry(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_telemetry_timestamp ON public.automation_telemetry(timestamp);
