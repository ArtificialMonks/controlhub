-- Migration 010: Security and Audit System
-- Creates comprehensive security monitoring and audit trail system
-- Includes user_sessions, security_audit_trail, and settings_audit_trail

-- =====================================================
-- 1. USER SESSIONS TABLE
-- =====================================================
-- Enhanced session management for security tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  location JSONB DEFAULT '{}', -- Store city, country, etc.
  active BOOLEAN DEFAULT TRUE NOT NULL,
  terminated_reason TEXT, -- logout, timeout, admin_action, etc.
  terminated_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Enable Row Level Security for user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all sessions for security monitoring
CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin' 
      AND ur.active = TRUE
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Performance indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(user_id, active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip_address ON public.user_sessions(ip_address);

-- =====================================================
-- 2. SECURITY AUDIT TRAIL TABLE
-- =====================================================
-- Comprehensive security event logging
CREATE TABLE IF NOT EXISTS public.security_audit_trail (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Allow orphaned records for security
  session_id TEXT,
  action TEXT NOT NULL, -- encrypt, decrypt, login, logout, access_denied, etc.
  resource TEXT NOT NULL, -- settings, profile, admin_panel, etc.
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'blocked')),
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 10),
  geolocation JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('low', 'info', 'warning', 'high', 'critical')),
  processed BOOLEAN DEFAULT FALSE, -- For security analysis workflows
  tags TEXT[] DEFAULT ARRAY[]::TEXT[] -- For categorization and filtering
);

-- Enable Row Level Security for security_audit_trail
ALTER TABLE public.security_audit_trail ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_audit_trail
CREATE POLICY "Users can view own security audit logs" ON public.security_audit_trail
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all security audit logs
CREATE POLICY "Admins can view all security audit logs" ON public.security_audit_trail
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin' 
      AND ur.active = TRUE
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- System can insert audit logs (for automated logging)
CREATE POLICY "System can insert security audit logs" ON public.security_audit_trail
  FOR INSERT WITH CHECK (true);

-- Performance indexes for security_audit_trail
CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON public.security_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_timestamp ON public.security_audit_trail(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_user_timestamp ON public.security_audit_trail(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_action ON public.security_audit_trail(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_outcome ON public.security_audit_trail(outcome);
CREATE INDEX IF NOT EXISTS idx_security_audit_risk_score ON public.security_audit_trail(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_severity ON public.security_audit_trail(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_ip_address ON public.security_audit_trail(ip_address);

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_security_audit_failures ON public.security_audit_trail(user_id, timestamp DESC) 
  WHERE outcome IN ('failure', 'blocked');
CREATE INDEX IF NOT EXISTS idx_security_audit_high_risk ON public.security_audit_trail(timestamp DESC) 
  WHERE risk_score >= 7;

-- =====================================================
-- 3. SETTINGS AUDIT TRAIL TABLE
-- =====================================================
-- Detailed tracking of all settings changes
CREATE TABLE IF NOT EXISTS public.settings_audit_trail (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT,
  section TEXT NOT NULL, -- profile, appearance, security, automation, etc.
  field_path TEXT, -- dot notation path like 'theme.mode' or 'authentication.twoFactorEnabled'
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'reset')),
  old_value JSONB,
  new_value JSONB,
  change_summary TEXT, -- Human-readable description of change
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  validation_errors JSONB DEFAULT '[]'::JSONB,
  metadata JSONB DEFAULT '{}' -- Additional context about the change
);

-- Enable Row Level Security for settings_audit_trail
ALTER TABLE public.settings_audit_trail ENABLE ROW LEVEL SECURITY;

-- RLS Policies for settings_audit_trail
CREATE POLICY "Users can view own settings audit logs" ON public.settings_audit_trail
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all settings audit logs
CREATE POLICY "Admins can view all settings audit logs" ON public.settings_audit_trail
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin' 
      AND ur.active = TRUE
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- System can insert settings audit logs
CREATE POLICY "System can insert settings audit logs" ON public.settings_audit_trail
  FOR INSERT WITH CHECK (true);

-- Performance indexes for settings_audit_trail
CREATE INDEX IF NOT EXISTS idx_settings_audit_user_id ON public.settings_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_audit_timestamp ON public.settings_audit_trail(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_settings_audit_user_timestamp ON public.settings_audit_trail(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_settings_audit_section ON public.settings_audit_trail(section);
CREATE INDEX IF NOT EXISTS idx_settings_audit_user_section ON public.settings_audit_trail(user_id, section);
CREATE INDEX IF NOT EXISTS idx_settings_audit_action ON public.settings_audit_trail(action);

-- =====================================================
-- 4. AUDIT FUNCTIONS
-- =====================================================

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_session_id TEXT,
  p_action TEXT,
  p_resource TEXT,
  p_outcome TEXT,
  p_details JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_risk_score INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_id UUID;
  calculated_severity TEXT;
BEGIN
  -- Calculate severity based on outcome and risk score
  calculated_severity := CASE
    WHEN p_outcome = 'blocked' OR p_risk_score >= 8 THEN 'critical'
    WHEN p_outcome = 'failure' OR p_risk_score >= 6 THEN 'high'
    WHEN p_risk_score >= 4 THEN 'warning'
    WHEN p_risk_score >= 2 THEN 'info'
    ELSE 'low'
  END;

  INSERT INTO public.security_audit_trail (
    user_id, session_id, action, resource, outcome, details,
    ip_address, user_agent, risk_score, severity, timestamp
  )
  VALUES (
    p_user_id, p_session_id, p_action, p_resource, p_outcome, p_details,
    p_ip_address, p_user_agent, p_risk_score, calculated_severity, NOW()
  )
  RETURNING id INTO audit_id;

  RETURN audit_id;
END;
$$;

-- Function to log settings changes
CREATE OR REPLACE FUNCTION public.log_settings_change(
  p_user_id UUID,
  p_session_id TEXT,
  p_section TEXT,
  p_field_path TEXT,
  p_action TEXT,
  p_old_value JSONB,
  p_new_value JSONB,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_id UUID;
  change_summary TEXT;
BEGIN
  -- Generate human-readable change summary
  change_summary := CASE
    WHEN p_action = 'create' THEN format('Created %s.%s', p_section, p_field_path)
    WHEN p_action = 'update' THEN format('Updated %s.%s from %s to %s', p_section, p_field_path, p_old_value::text, p_new_value::text)
    WHEN p_action = 'delete' THEN format('Deleted %s.%s', p_section, p_field_path)
    WHEN p_action = 'reset' THEN format('Reset %s section', p_section)
    ELSE format('Modified %s.%s', p_section, p_field_path)
  END;

  INSERT INTO public.settings_audit_trail (
    user_id, session_id, section, field_path, action,
    old_value, new_value, change_summary,
    ip_address, user_agent, timestamp
  )
  VALUES (
    p_user_id, p_session_id, p_section, p_field_path, p_action,
    p_old_value, p_new_value, change_summary,
    p_ip_address, p_user_agent, NOW()
  )
  RETURNING id INTO audit_id;

  RETURN audit_id;
END;
$$;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- Mark expired sessions as inactive
  UPDATE public.user_sessions 
  SET active = FALSE, 
      terminated_reason = 'expired',
      terminated_at = NOW()
  WHERE active = TRUE 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  RETURN cleanup_count;
END;
$$;

-- Function to get user session info
CREATE OR REPLACE FUNCTION public.get_active_user_sessions(target_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  session_id TEXT,
  created_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  location JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.session_id, s.created_at, s.last_activity, s.ip_address, s.user_agent, s.location
  FROM public.user_sessions s
  WHERE s.user_id = target_user_id
    AND s.active = TRUE
    AND s.expires_at > NOW()
  ORDER BY s.last_activity DESC;
$$;

-- =====================================================
-- 5. AUTOMATIC CLEANUP AND MAINTENANCE
-- =====================================================

-- Create a function to automatically archive old audit logs
CREATE OR REPLACE FUNCTION public.archive_old_audit_logs(
  retention_days INTEGER DEFAULT 365
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived_count INTEGER := 0;
  cutoff_date TIMESTAMPTZ;
BEGIN
  cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;
  
  -- Archive old security audit logs (move to archive table if needed)
  -- For now, we'll just mark them as processed
  UPDATE public.security_audit_trail 
  SET processed = TRUE
  WHERE timestamp < cutoff_date 
    AND processed = FALSE;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  -- Could also delete very old logs if storage is a concern
  -- DELETE FROM public.security_audit_trail WHERE timestamp < cutoff_date - INTERVAL '2 years';
  
  RETURN archived_count;
END;
$$;

-- =====================================================
-- 6. TRIGGERS FOR AUTOMATIC AUDIT LOGGING
-- =====================================================

-- Trigger function to automatically log settings changes
CREATE OR REPLACE FUNCTION public.trigger_log_settings_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if settings_data actually changed
  IF OLD.settings_data IS DISTINCT FROM NEW.settings_data THEN
    PERFORM public.log_settings_change(
      NEW.user_id,
      NULL, -- session_id would need to be passed from application context
      'settings', -- general section, app can provide more specific logging
      NULL, -- field_path would need to be calculated from diff
      'update',
      OLD.settings_data,
      NEW.settings_data
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to user_settings table
CREATE TRIGGER trigger_user_settings_audit
  AFTER UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.trigger_log_settings_change();

-- =====================================================
-- 7. VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for recent security events
CREATE OR REPLACE VIEW public.recent_security_events AS
SELECT 
  s.id,
  s.user_id,
  u.email as user_email,
  s.action,
  s.resource,
  s.outcome,
  s.risk_score,
  s.severity,
  s.ip_address,
  s.timestamp
FROM public.security_audit_trail s
LEFT JOIN auth.users u ON u.id = s.user_id
WHERE s.timestamp > NOW() - INTERVAL '7 days'
ORDER BY s.timestamp DESC;

-- View for user settings change history
CREATE OR REPLACE VIEW public.user_settings_history AS
SELECT 
  s.id,
  s.user_id,
  u.email as user_email,
  s.section,
  s.field_path,
  s.action,
  s.change_summary,
  s.timestamp
FROM public.settings_audit_trail s
LEFT JOIN auth.users u ON u.id = s.user_id
ORDER BY s.timestamp DESC;

-- =====================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE public.user_sessions IS 'Enhanced session management with security tracking and device fingerprinting';
COMMENT ON TABLE public.security_audit_trail IS 'Comprehensive security event logging with risk scoring and geolocation';
COMMENT ON TABLE public.settings_audit_trail IS 'Detailed audit trail for all user settings changes with field-level tracking';

COMMENT ON FUNCTION public.log_security_event IS 'Centralized function for logging security events with automatic severity calculation';
COMMENT ON FUNCTION public.log_settings_change IS 'Logs user settings changes with human-readable summaries';
COMMENT ON FUNCTION public.cleanup_expired_sessions IS 'Maintenance function to clean up expired sessions';
COMMENT ON FUNCTION public.archive_old_audit_logs IS 'Archives old audit logs for long-term retention management';

COMMENT ON VIEW public.recent_security_events IS 'Recent security events with user information for monitoring dashboards';
COMMENT ON VIEW public.user_settings_history IS 'User-friendly view of settings changes with email addresses';