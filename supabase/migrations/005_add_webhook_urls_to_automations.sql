-- Add webhook URL fields to automations table
-- Quest 2.3: Create Backend for Individual Actions
-- These fields store the n8n webhook URLs for triggering run and stop actions

ALTER TABLE public.automations 
ADD COLUMN IF NOT EXISTS n8n_run_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS n8n_stop_webhook_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.automations.n8n_run_webhook_url IS 'Webhook URL to trigger automation run in n8n';
COMMENT ON COLUMN public.automations.n8n_stop_webhook_url IS 'Webhook URL to trigger automation stop in n8n';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_automations_n8n_run_webhook_url ON public.automations(n8n_run_webhook_url);
CREATE INDEX IF NOT EXISTS idx_automations_n8n_stop_webhook_url ON public.automations(n8n_stop_webhook_url);
