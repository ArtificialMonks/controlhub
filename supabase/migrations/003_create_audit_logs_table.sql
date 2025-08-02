-- Create audit_logs table for monitoring and security compliance
-- This table tracks all user actions and system events for audit purposes

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  automation_id UUID REFERENCES public.automations(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('automation', 'profile', 'auth', 'system', 'webhook', 'api')),
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  status TEXT CHECK (status IN ('success', 'failure', 'error')) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_logs table
-- Users can only view their own audit logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Only system can insert audit logs (via service role)
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_automation_id ON public.audit_logs(automation_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_status ON public.audit_logs(status);

-- Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id UUID,
  p_automation_id UUID DEFAULT NULL,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    automation_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    metadata,
    ip_address,
    user_agent,
    status,
    error_message
  ) VALUES (
    p_user_id,
    p_automation_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    p_metadata,
    p_ip_address,
    p_user_agent,
    p_status,
    p_error_message
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically audit automation changes
CREATE OR REPLACE FUNCTION public.audit_automation_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log automation updates
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit_event(
      NEW.user_id,
      NEW.id,
      'update',
      'automation',
      NEW.id::TEXT,
      to_jsonb(OLD),
      to_jsonb(NEW),
      jsonb_build_object('trigger', 'automation_update'),
      NULL,
      NULL,
      'success',
      NULL
    );
    RETURN NEW;
  END IF;
  
  -- Log automation creation
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      NEW.user_id,
      NEW.id,
      'create',
      'automation',
      NEW.id::TEXT,
      NULL,
      to_jsonb(NEW),
      jsonb_build_object('trigger', 'automation_create'),
      NULL,
      NULL,
      'success',
      NULL
    );
    RETURN NEW;
  END IF;
  
  -- Log automation deletion
  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_event(
      OLD.user_id,
      OLD.id,
      'delete',
      'automation',
      OLD.id::TEXT,
      to_jsonb(OLD),
      NULL,
      jsonb_build_object('trigger', 'automation_delete'),
      NULL,
      NULL,
      'success',
      NULL
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automation auditing
CREATE TRIGGER audit_automation_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.audit_automation_changes();