-- Migration 011: Default Data Population and Performance Optimization
-- Populates default role permissions and creates performance optimizations
-- Completes the enterprise-grade settings infrastructure setup

-- =====================================================
-- 1. DEFAULT ROLE PERMISSIONS
-- =====================================================
-- Insert comprehensive default permissions for all roles

-- User role permissions (basic access)
INSERT INTO public.role_permissions (role, permission, resource, actions, description) VALUES
  -- Settings permissions
  ('user', 'settings:read', 'settings', ARRAY['read']::TEXT[], 'Read own user settings'),
  ('user', 'settings:update', 'settings', ARRAY['update']::TEXT[], 'Update own user settings'),
  ('user', 'settings:export', 'settings', ARRAY['export']::TEXT[], 'Export own settings for backup'),
  
  -- Profile permissions
  ('user', 'profile:read', 'profile', ARRAY['read']::TEXT[], 'Read own profile information'),
  ('user', 'profile:update', 'profile', ARRAY['update']::TEXT[], 'Update own profile information'),
  ('user', 'profile:delete', 'profile', ARRAY['delete']::TEXT[], 'Delete own profile'),
  
  -- Session permissions
  ('user', 'session:read', 'sessions', ARRAY['read']::TEXT[], 'View own active sessions'),
  ('user', 'session:manage', 'sessions', ARRAY['terminate']::TEXT[], 'Terminate own sessions'),
  
  -- Audit permissions
  ('user', 'audit:read', 'audit', ARRAY['read']::TEXT[], 'View own audit trail'),
  
  -- Automation permissions (basic)
  ('user', 'automation:read', 'automation', ARRAY['read']::TEXT[], 'View own automations'),
  ('user', 'automation:execute', 'automation', ARRAY['start', 'stop']::TEXT[], 'Start/stop own automations'),
  
  -- API permissions (limited)
  ('user', 'api:read', 'api', ARRAY['read']::TEXT[], 'Read API usage and keys'),
  ('user', 'api:create', 'api', ARRAY['create']::TEXT[], 'Create API keys for own account');

-- Editor role permissions (extended user permissions)
INSERT INTO public.role_permissions (role, permission, resource, actions, description) VALUES
  -- All user permissions plus advanced automation
  ('editor', 'settings:read', 'settings', ARRAY['read']::TEXT[], 'Read own user settings'),
  ('editor', 'settings:update', 'settings', ARRAY['update']::TEXT[], 'Update own user settings'),
  ('editor', 'settings:export', 'settings', ARRAY['export']::TEXT[], 'Export own settings for backup'),
  ('editor', 'profile:read', 'profile', ARRAY['read']::TEXT[], 'Read own profile information'),
  ('editor', 'profile:update', 'profile', ARRAY['update']::TEXT[], 'Update own profile information'),
  ('editor', 'profile:delete', 'profile', ARRAY['delete']::TEXT[], 'Delete own profile'),
  ('editor', 'session:read', 'sessions', ARRAY['read']::TEXT[], 'View own active sessions'),
  ('editor', 'session:manage', 'sessions', ARRAY['terminate']::TEXT[], 'Terminate own sessions'),
  ('editor', 'audit:read', 'audit', ARRAY['read']::TEXT[], 'View own audit trail'),
  ('editor', 'automation:read', 'automation', ARRAY['read']::TEXT[], 'View own automations'),
  ('editor', 'automation:execute', 'automation', ARRAY['start', 'stop']::TEXT[], 'Start/stop own automations'),
  ('editor', 'api:read', 'api', ARRAY['read']::TEXT[], 'Read API usage and keys'),
  ('editor', 'api:create', 'api', ARRAY['create']::TEXT[], 'Create API keys for own account'),
  
  -- Extended editor permissions
  ('editor', 'automation:manage', 'automation', ARRAY['create', 'update', 'delete']::TEXT[], 'Full automation management'),
  ('editor', 'integration:manage', 'integration', ARRAY['create', 'update', 'delete']::TEXT[], 'Manage integrations and webhooks'),
  ('editor', 'api:manage', 'api', ARRAY['update', 'delete']::TEXT[], 'Full API key management');

-- Viewer role permissions (read-only)
INSERT INTO public.role_permissions (role, permission, resource, actions, description) VALUES
  ('viewer', 'settings:read', 'settings', ARRAY['read']::TEXT[], 'Read own user settings'),
  ('viewer', 'profile:read', 'profile', ARRAY['read']::TEXT[], 'Read own profile information'),
  ('viewer', 'session:read', 'sessions', ARRAY['read']::TEXT[], 'View own active sessions'),
  ('viewer', 'audit:read', 'audit', ARRAY['read']::TEXT[], 'View own audit trail'),
  ('viewer', 'automation:read', 'automation', ARRAY['read']::TEXT[], 'View automations (read-only)'),
  ('viewer', 'api:read', 'api', ARRAY['read']::TEXT[], 'Read API usage (read-only)');

-- API role permissions (programmatic access)
INSERT INTO public.role_permissions (role, permission, resource, actions, description) VALUES
  ('api', 'automation:read', 'automation', ARRAY['read']::TEXT[], 'Read automations via API'),
  ('api', 'automation:execute', 'automation', ARRAY['start', 'stop']::TEXT[], 'Execute automations via API'),
  ('api', 'automation:manage', 'automation', ARRAY['create', 'update', 'delete']::TEXT[], 'Full automation management via API'),
  ('api', 'settings:read', 'settings', ARRAY['read']::TEXT[], 'Read settings via API'),
  ('api', 'settings:update', 'settings', ARRAY['update']::TEXT[], 'Update settings via API'),
  ('api', 'profile:read', 'profile', ARRAY['read']::TEXT[], 'Read profile via API'),
  ('api', 'integration:read', 'integration', ARRAY['read']::TEXT[], 'Read integrations via API'),
  ('api', 'integration:manage', 'integration', ARRAY['create', 'update', 'delete']::TEXT[], 'Manage integrations via API');

-- Admin role permissions (full access)
INSERT INTO public.role_permissions (role, permission, resource, actions, description) VALUES
  -- User management
  ('admin', 'user:read', 'users', ARRAY['read']::TEXT[], 'View all users'),
  ('admin', 'user:manage', 'users', ARRAY['create', 'update', 'delete', 'suspend']::TEXT[], 'Full user management'),
  ('admin', 'role:manage', 'roles', ARRAY['create', 'read', 'update', 'delete', 'assign']::TEXT[], 'Full role management'),
  
  -- System settings
  ('admin', 'settings:admin', 'settings', ARRAY['read', 'update', 'delete', 'export', 'import']::TEXT[], 'Full settings administration'),
  ('admin', 'system:config', 'system', ARRAY['read', 'update']::TEXT[], 'System configuration access'),
  
  -- Security and audit
  ('admin', 'security:admin', 'security', ARRAY['read', 'update', 'audit']::TEXT[], 'Security administration'),
  ('admin', 'audit:admin', 'audit', ARRAY['read', 'export', 'archive']::TEXT[], 'Full audit trail access'),
  ('admin', 'session:admin', 'sessions', ARRAY['read', 'terminate']::TEXT[], 'Manage all user sessions'),
  
  -- Automation and API
  ('admin', 'automation:admin', 'automation', ARRAY['*']::TEXT[], 'Full automation administration'),
  ('admin', 'api:admin', 'api', ARRAY['*']::TEXT[], 'Full API administration'),
  ('admin', 'integration:admin', 'integration', ARRAY['*']::TEXT[], 'Full integration administration'),
  
  -- System monitoring
  ('admin', 'monitoring:read', 'monitoring', ARRAY['read']::TEXT[], 'System monitoring access'),
  ('admin', 'logs:read', 'logs', ARRAY['read', 'export']::TEXT[], 'System logs access'),
  
  -- Database management
  ('admin', 'database:admin', 'database', ARRAY['backup', 'restore', 'migrate']::TEXT[], 'Database administration');

-- =====================================================
-- 2. PERFORMANCE OPTIMIZATIONS
-- =====================================================

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_settings_composite ON public.user_settings(user_id, updated_at DESC, version);
CREATE INDEX IF NOT EXISTS idx_user_roles_composite ON public.user_roles(user_id, role, active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_role_permissions_lookup ON public.role_permissions(role, resource, permission);

-- Partial indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_security_audit_recent ON public.security_audit_trail(user_id, timestamp DESC) 
  WHERE timestamp > NOW() - INTERVAL '30 days';
CREATE INDEX IF NOT EXISTS idx_settings_audit_recent ON public.settings_audit_trail(user_id, timestamp DESC) 
  WHERE timestamp > NOW() - INTERVAL '90 days';

-- GIN indexes for JSONB data
CREATE INDEX IF NOT EXISTS idx_user_settings_gin ON public.user_settings USING GIN (settings_data);
CREATE INDEX IF NOT EXISTS idx_security_audit_details_gin ON public.security_audit_trail USING GIN (details);

-- =====================================================
-- 3. MATERIALIZED VIEWS FOR PERFORMANCE
-- =====================================================

-- User permissions summary view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_permissions_summary AS
SELECT 
  ur.user_id,
  u.email,
  array_agg(DISTINCT ur.role) as roles,
  array_agg(DISTINCT rp.permission) as permissions,
  array_agg(DISTINCT rp.resource) as resources,
  COUNT(DISTINCT ur.role) as role_count,
  COUNT(DISTINCT rp.permission) as permission_count,
  MAX(ur.updated_at) as last_role_change,
  NOW() as last_refreshed
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
LEFT JOIN public.role_permissions rp ON rp.role = ur.role
WHERE ur.active = TRUE
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
GROUP BY ur.user_id, u.email;

-- Create unique index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_permissions_summary_user_id 
  ON public.user_permissions_summary(user_id);

-- Security events summary view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.security_summary AS
SELECT 
  user_id,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE outcome = 'success') as successful_events,
  COUNT(*) FILTER (WHERE outcome = 'failure') as failed_events,
  COUNT(*) FILTER (WHERE outcome = 'blocked') as blocked_events,
  AVG(risk_score) as avg_risk_score,
  MAX(risk_score) as max_risk_score,
  MAX(timestamp) as last_activity,
  COUNT(DISTINCT ip_address) as unique_ip_count,
  NOW() as last_refreshed
FROM public.security_audit_trail
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY user_id;

-- Create unique index for security summary
CREATE UNIQUE INDEX IF NOT EXISTS idx_security_summary_user_id 
  ON public.security_summary(user_id);

-- =====================================================
-- 4. AUTOMATED MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_performance_views()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Refresh materialized views
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_permissions_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.security_summary;
  
  -- Update statistics
  ANALYZE public.user_settings;
  ANALYZE public.user_roles;
  ANALYZE public.role_permissions;
  ANALYZE public.security_audit_trail;
  ANALYZE public.settings_audit_trail;
  
  RETURN 'Performance views refreshed successfully';
END;
$$;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION public.cleanup_old_data(
  security_retention_days INTEGER DEFAULT 365,
  settings_retention_days INTEGER DEFAULT 90,
  session_retention_days INTEGER DEFAULT 30
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_security_records INTEGER;
  deleted_settings_records INTEGER;
  deleted_session_records INTEGER;
BEGIN
  -- Clean up old security audit records (but keep high-risk events longer)
  DELETE FROM public.security_audit_trail 
  WHERE timestamp < NOW() - (security_retention_days || ' days')::INTERVAL
    AND risk_score < 5  -- Keep high-risk events longer
    AND processed = TRUE; -- Only delete processed records
  
  GET DIAGNOSTICS deleted_security_records = ROW_COUNT;
  
  -- Clean up old settings audit records
  DELETE FROM public.settings_audit_trail 
  WHERE timestamp < NOW() - (settings_retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_settings_records = ROW_COUNT;
  
  -- Clean up old inactive sessions
  DELETE FROM public.user_sessions 
  WHERE active = FALSE 
    AND (terminated_at < NOW() - (session_retention_days || ' days')::INTERVAL
         OR created_at < NOW() - (session_retention_days || ' days')::INTERVAL);
  
  GET DIAGNOSTICS deleted_session_records = ROW_COUNT;
  
  RETURN format('Cleanup completed: %s security records, %s settings records, %s session records deleted',
    deleted_security_records, deleted_settings_records, deleted_session_records);
END;
$$;

-- =====================================================
-- 5. SCHEDULED MAINTENANCE SETUP
-- =====================================================

-- Note: In production, these would be set up as cron jobs or scheduled tasks
-- For now, we create the functions that can be called manually or via scheduler

-- Function to perform daily maintenance
CREATE OR REPLACE FUNCTION public.daily_maintenance()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleanup_result TEXT;
  refresh_result TEXT;
  expired_sessions INTEGER;
BEGIN
  -- Clean up expired sessions
  SELECT public.cleanup_expired_sessions() INTO expired_sessions;
  
  -- Refresh performance views
  SELECT public.refresh_performance_views() INTO refresh_result;
  
  -- Archive old audit logs
  PERFORM public.archive_old_audit_logs(365);
  
  RETURN format('Daily maintenance completed: %s expired sessions cleaned, %s', 
    expired_sessions, refresh_result);
END;
$$;

-- Function to perform weekly maintenance
CREATE OR REPLACE FUNCTION public.weekly_maintenance()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleanup_result TEXT;
BEGIN
  -- Perform data cleanup
  SELECT public.cleanup_old_data(365, 90, 30) INTO cleanup_result;
  
  -- Vacuum and analyze tables
  VACUUM ANALYZE public.user_settings;
  VACUUM ANALYZE public.user_roles;
  VACUUM ANALYZE public.role_permissions;
  VACUUM ANALYZE public.security_audit_trail;
  VACUUM ANALYZE public.settings_audit_trail;
  VACUUM ANALYZE public.user_sessions;
  
  RETURN format('Weekly maintenance completed: %s', cleanup_result);
END;
$$;

-- =====================================================
-- 6. DEFAULT SYSTEM SETTINGS
-- =====================================================

-- Create a system settings record for global configuration
INSERT INTO public.user_settings (user_id, settings_data, version) 
VALUES (
  '00000000-0000-0000-0000-000000000000', -- System user UUID
  jsonb_build_object(
    'system', jsonb_build_object(
      'id', 'system',
      'name', 'System Configuration',
      'description', 'Global system settings and configuration',
      'enabled', true,
      'lastModified', NOW(),
      'version', 1,
      'security', jsonb_build_object(
        'passwordPolicy', jsonb_build_object(
          'minLength', 8,
          'requireUppercase', true,
          'requireLowercase', true,
          'requireNumbers', true,
          'requireSpecialChars', true,
          'maxAge', 90,
          'preventReuse', 5
        ),
        'sessionPolicy', jsonb_build_object(
          'defaultTimeout', 60,
          'maxConcurrentSessions', 3,
          'requireDeviceVerification', false,
          'enableGeolocationTracking', true
        ),
        'auditPolicy', jsonb_build_object(
          'retentionPeriod', 365,
          'enableRealTimeAlerts', true,
          'riskThreshold', 7,
          'enableAutomaticBlocking', false
        )
      ),
      'performance', jsonb_build_object(
        'caching', jsonb_build_object(
          'enableSettingsCache', true,
          'cacheTimeout', 600,
          'maxCacheSize', 1000
        ),
        'maintenance', jsonb_build_object(
          'enableAutoCleanup', true,
          'cleanupInterval', 'weekly',
          'dataRetentionDays', 365
        )
      )
    )
  ),
  1
) ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 7. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON MATERIALIZED VIEW public.user_permissions_summary IS 'Optimized view of user roles and permissions for quick access control checks';
COMMENT ON MATERIALIZED VIEW public.security_summary IS 'Security event summary for monitoring and alerting dashboards';

COMMENT ON FUNCTION public.refresh_performance_views() IS 'Refreshes all materialized views and updates table statistics';
COMMENT ON FUNCTION public.cleanup_old_data(INTEGER, INTEGER, INTEGER) IS 'Removes old audit and session data based on retention policies';
COMMENT ON FUNCTION public.daily_maintenance() IS 'Performs daily maintenance tasks including session cleanup and view refresh';
COMMENT ON FUNCTION public.weekly_maintenance() IS 'Performs weekly maintenance including data cleanup and table optimization';

-- =====================================================
-- 8. INITIAL DATA VALIDATION
-- =====================================================

-- Verify that all essential roles have permissions
DO $$
DECLARE
  missing_permissions TEXT[];
  essential_roles TEXT[] := ARRAY['user', 'admin', 'editor', 'viewer', 'api'];
  role_name TEXT;
  perm_count INTEGER;
BEGIN
  FOREACH role_name IN ARRAY essential_roles
  LOOP
    SELECT COUNT(*) INTO perm_count 
    FROM public.role_permissions 
    WHERE role = role_name;
    
    IF perm_count = 0 THEN
      missing_permissions := array_append(missing_permissions, role_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_permissions, 1) > 0 THEN
    RAISE WARNING 'Roles missing permissions: %', array_to_string(missing_permissions, ', ');
  ELSE
    RAISE NOTICE 'All essential roles have permissions configured';
  END IF;
END;
$$;

-- Final setup message
DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Migration 011 completed successfully!';
  RAISE NOTICE 'Enterprise-grade settings infrastructure is ready.';
  RAISE NOTICE '- Default permissions configured for all roles';
  RAISE NOTICE '- Performance optimizations applied';
  RAISE NOTICE '- Maintenance functions created';
  RAISE NOTICE '- System configuration initialized';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Configure environment variables for encryption';
  RAISE NOTICE '2. Test settings page functionality';
  RAISE NOTICE '3. Validate security features';
  RAISE NOTICE '=====================================================';
END;
$$;