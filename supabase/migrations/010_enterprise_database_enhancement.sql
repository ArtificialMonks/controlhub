-- Migration: 010_enterprise_database_enhancement.sql
-- Description: Comprehensive enterprise-grade database enhancement and cleanup
-- Author: ControlHub Enterprise Team
-- Date: 2025-08-07
-- Purpose: Clean up duplicates, add missing tables, optimize performance, implement enterprise features

-- ============================================================================
-- CLEANUP PHASE: Remove duplicate and legacy tables
-- ============================================================================

-- Drop legacy settings tables (replaced by user_settings_v2)
DROP TABLE IF EXISTS public.settings_audit CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;

-- ============================================================================
-- ENTERPRISE ANALYTICS & MONITORING TABLES
-- ============================================================================

-- System performance monitoring table
CREATE TABLE IF NOT EXISTS public.system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
        'cpu_usage', 'memory_usage', 'disk_usage', 'network_io', 
        'database_connections', 'query_performance', 'api_latency', 'error_rate'
    )),
    value NUMERIC NOT NULL,
    unit VARCHAR(20) NOT NULL,
    tags JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    node_id VARCHAR(100),
    environment VARCHAR(20) DEFAULT 'production'
);

-- User activity analytics table
CREATE TABLE IF NOT EXISTS public.user_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    page_url TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation performance analytics
CREATE TABLE IF NOT EXISTS public.automation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    execution_date DATE NOT NULL,
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,
    avg_duration_ms INTEGER DEFAULT 0,
    min_duration_ms INTEGER DEFAULT 0,
    max_duration_ms INTEGER DEFAULT 0,
    total_duration_ms BIGINT DEFAULT 0,
    success_rate NUMERIC(5,2) DEFAULT 0,
    error_types JSONB DEFAULT '{}',
    peak_hour INTEGER, -- 0-23
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(automation_id, execution_date)
);

-- ============================================================================
-- API MANAGEMENT & RATE LIMITING TABLES
-- ============================================================================

-- API keys management table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(256) NOT NULL UNIQUE,
    key_preview VARCHAR(20) NOT NULL, -- First few characters for display
    permissions JSONB DEFAULT '[]', -- Array of permission strings
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    rate_limit_per_day INTEGER DEFAULT 10000,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count BIGINT DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API usage tracking table for rate limiting
CREATE TABLE IF NOT EXISTS public.api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint VARCHAR(200) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limiting buckets table (for token bucket algorithm)
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
    id VARCHAR(100) PRIMARY KEY, -- user_id:endpoint or api_key_id:endpoint
    tokens_remaining INTEGER NOT NULL DEFAULT 0,
    last_refill TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_requests INTEGER DEFAULT 0,
    blocked_requests INTEGER DEFAULT 0
);

-- ============================================================================
-- WEBHOOK MANAGEMENT TABLES
-- ============================================================================

-- Webhook endpoints table (for outgoing webhooks)
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    secret VARCHAR(256), -- For signature verification
    events JSONB DEFAULT '[]', -- Array of event types to subscribe to
    is_active BOOLEAN DEFAULT true,
    retry_count INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    last_success_at TIMESTAMP WITH TIME ZONE,
    last_failure_at TIMESTAMP WITH TIME ZONE,
    failure_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook delivery attempts table
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_endpoint_id UUID REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retry')),
    http_status_code INTEGER,
    response_body TEXT,
    response_time_ms INTEGER,
    attempt_number INTEGER DEFAULT 1,
    error_message TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AUDIT & COMPLIANCE TABLES
-- ============================================================================

-- Comprehensive audit log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    request_id VARCHAR(100),
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warn', 'error', 'critical')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data retention policies table
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    retention_days INTEGER NOT NULL,
    archive_before_delete BOOLEAN DEFAULT true,
    archive_storage_path TEXT,
    is_active BOOLEAN DEFAULT true,
    last_cleanup_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(table_name)
);

-- ============================================================================
-- FEATURE FLAGS & CONFIGURATION TABLES
-- ============================================================================

-- Feature flags table for A/B testing and gradual rollouts
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_groups JSONB DEFAULT '[]', -- Array of user groups or criteria
    environment VARCHAR(20) DEFAULT 'production',
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System configuration table
CREATE TABLE IF NOT EXISTS public.system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')),
    is_secret BOOLEAN DEFAULT false,
    description TEXT,
    validation_schema JSONB,
    environment VARCHAR(20) DEFAULT 'production',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- BACKUP & DISASTER RECOVERY TABLES
-- ============================================================================

-- Database backup metadata
CREATE TABLE IF NOT EXISTS public.backup_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(20) NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
    backup_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    checksum VARCHAR(64),
    compression_type VARCHAR(20),
    is_encrypted BOOLEAN DEFAULT false,
    backup_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    backup_completed_at TIMESTAMP WITH TIME ZONE,
    restoration_tested_at TIMESTAMP WITH TIME ZONE,
    retention_until TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'expired')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ENHANCED INDEXES FOR PERFORMANCE
-- ============================================================================

-- System metrics indexes
CREATE INDEX IF NOT EXISTS idx_system_metrics_type_time ON public.system_metrics(metric_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON public.system_metrics(recorded_at DESC);

-- User analytics indexes  
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id_time ON public.user_analytics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON public.user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_user_analytics_session_id ON public.user_analytics(session_id);

-- Automation analytics indexes
CREATE INDEX IF NOT EXISTS idx_automation_analytics_automation_date ON public.automation_analytics(automation_id, execution_date DESC);
CREATE INDEX IF NOT EXISTS idx_automation_analytics_user_date ON public.automation_analytics(user_id, execution_date DESC);

-- API management indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id_active ON public.api_keys(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_usage_key_time ON public.api_usage(api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint_time ON public.api_usage(endpoint, created_at DESC);

-- Webhook indexes
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_user_active ON public.webhook_endpoints(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint_status ON public.webhook_deliveries(webhook_endpoint_id, status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry ON public.webhook_deliveries(next_retry_at) WHERE status = 'retry';

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_time ON public.audit_logs(action, created_at DESC);

-- Performance optimization indexes on existing tables
CREATE INDEX IF NOT EXISTS idx_automations_user_status_updated ON public.automations(user_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_runs_automation_started ON public.automation_runs(automation_id, started_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_metadata ENABLE ROW LEVEL SECURITY;

-- User analytics policies
CREATE POLICY "Users can view their own analytics" ON public.user_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all user analytics" ON public.user_analytics
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Automation analytics policies
CREATE POLICY "Users can view their automation analytics" ON public.automation_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage automation analytics" ON public.automation_analytics
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- API keys policies
CREATE POLICY "Users can manage their own API keys" ON public.api_keys
    FOR ALL USING (auth.uid() = user_id);

-- API usage policies
CREATE POLICY "Users can view their API usage" ON public.api_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage API usage" ON public.api_usage
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Webhook policies
CREATE POLICY "Users can manage their own webhooks" ON public.webhook_endpoints
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their webhook deliveries" ON public.webhook_deliveries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.webhook_endpoints 
            WHERE webhook_endpoints.id = webhook_deliveries.webhook_endpoint_id 
            AND webhook_endpoints.user_id = auth.uid()
        )
    );

-- Audit log policies
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage audit logs" ON public.audit_logs
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- System tables (admin only)
CREATE POLICY "Admin users can view system metrics" ON public.system_metrics
    FOR SELECT USING (
        auth.jwt()->>'role' IN ('service_role', 'supabase_admin') OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

CREATE POLICY "Service role can manage system metrics" ON public.system_metrics
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Feature flags policies (read-only for users)
CREATE POLICY "Anyone can view feature flags" ON public.feature_flags
    FOR SELECT USING (true);

CREATE POLICY "Admin users can manage feature flags" ON public.feature_flags
    FOR ALL USING (
        auth.jwt()->>'role' IN ('service_role') OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to calculate automation daily analytics
CREATE OR REPLACE FUNCTION public.calculate_daily_automation_analytics(
    p_automation_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS public.automation_analytics AS $$
DECLARE
    v_analytics public.automation_analytics%ROWTYPE;
    v_user_id UUID;
BEGIN
    -- Get user_id for the automation
    SELECT user_id INTO v_user_id
    FROM public.automations 
    WHERE id = p_automation_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Automation not found: %', p_automation_id;
    END IF;
    
    -- Calculate analytics for the date
    SELECT 
        p_automation_id,
        v_user_id,
        p_date,
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'success'),
        COUNT(*) FILTER (WHERE status = 'error'),
        COALESCE(AVG(duration_ms)::INTEGER, 0),
        COALESCE(MIN(duration_ms), 0),
        COALESCE(MAX(duration_ms), 0),
        COALESCE(SUM(duration_ms), 0),
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(*) FILTER (WHERE status = 'success')::NUMERIC / COUNT(*)::NUMERIC * 100)::NUMERIC(5,2)
            ELSE 0 
        END,
        jsonb_object_agg(status, count_by_status) FILTER (WHERE status IS NOT NULL),
        EXTRACT(HOUR FROM started_at)::INTEGER, -- Most common hour
        NOW()
    INTO v_analytics
    FROM (
        SELECT 
            status,
            duration_ms,
            started_at,
            COUNT(*) as count_by_status
        FROM public.automation_runs 
        WHERE automation_id = p_automation_id 
            AND started_at::DATE = p_date
        GROUP BY status, duration_ms, started_at
    ) t
    GROUP BY EXTRACT(HOUR FROM started_at);
    
    -- Upsert the analytics
    INSERT INTO public.automation_analytics (
        automation_id, user_id, execution_date, total_runs, successful_runs, 
        failed_runs, avg_duration_ms, min_duration_ms, max_duration_ms, 
        total_duration_ms, success_rate, error_types, peak_hour
    ) VALUES (
        v_analytics.automation_id, v_analytics.user_id, v_analytics.execution_date,
        v_analytics.total_runs, v_analytics.successful_runs, v_analytics.failed_runs,
        v_analytics.avg_duration_ms, v_analytics.min_duration_ms, v_analytics.max_duration_ms,
        v_analytics.total_duration_ms, v_analytics.success_rate, v_analytics.error_types,
        v_analytics.peak_hour
    )
    ON CONFLICT (automation_id, execution_date)
    DO UPDATE SET
        total_runs = EXCLUDED.total_runs,
        successful_runs = EXCLUDED.successful_runs,
        failed_runs = EXCLUDED.failed_runs,
        avg_duration_ms = EXCLUDED.avg_duration_ms,
        min_duration_ms = EXCLUDED.min_duration_ms,
        max_duration_ms = EXCLUDED.max_duration_ms,
        total_duration_ms = EXCLUDED.total_duration_ms,
        success_rate = EXCLUDED.success_rate,
        error_types = EXCLUDED.error_types,
        peak_hour = EXCLUDED.peak_hour;
    
    RETURN v_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track user activity
CREATE OR REPLACE FUNCTION public.track_user_activity(
    p_user_id UUID,
    p_event_type VARCHAR(100),
    p_event_data JSONB DEFAULT '{}',
    p_session_id VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
BEGIN
    INSERT INTO public.user_analytics (
        user_id, event_type, event_data, session_id,
        ip_address, user_agent, referrer, page_url
    ) VALUES (
        p_user_id, p_event_type, p_event_data, p_session_id,
        inet_client_addr(),
        current_setting('request.headers')::json->>'user-agent',
        current_setting('request.headers')::json->>'referer',
        current_setting('request.headers')::json->>'x-current-path'
    ) RETURNING id INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for rate limiting check
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier VARCHAR(100),
    p_limit INTEGER,
    p_window_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    v_bucket public.rate_limit_buckets%ROWTYPE;
    v_window_start TIMESTAMP WITH TIME ZONE;
    v_tokens_to_add INTEGER;
BEGIN
    v_window_start := date_trunc('minute', NOW());
    
    -- Get or create bucket
    SELECT * INTO v_bucket
    FROM public.rate_limit_buckets
    WHERE id = p_identifier;
    
    IF NOT FOUND THEN
        -- Create new bucket
        INSERT INTO public.rate_limit_buckets (id, tokens_remaining, window_start, total_requests)
        VALUES (p_identifier, p_limit - 1, v_window_start, 1)
        RETURNING * INTO v_bucket;
        RETURN true;
    END IF;
    
    -- Check if we need to refill tokens (new window)
    IF v_bucket.window_start < v_window_start THEN
        -- Reset tokens for new window
        UPDATE public.rate_limit_buckets
        SET tokens_remaining = p_limit - 1,
            window_start = v_window_start,
            total_requests = total_requests + 1,
            last_refill = NOW()
        WHERE id = p_identifier;
        RETURN true;
    END IF;
    
    -- Check if tokens available
    IF v_bucket.tokens_remaining > 0 THEN
        UPDATE public.rate_limit_buckets
        SET tokens_remaining = tokens_remaining - 1,
            total_requests = total_requests + 1
        WHERE id = p_identifier;
        RETURN true;
    ELSE
        -- Rate limited
        UPDATE public.rate_limit_buckets
        SET blocked_requests = blocked_requests + 1
        WHERE id = p_identifier;
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DATA MIGRATION & CLEANUP
-- ============================================================================

-- Migrate existing automation data to analytics (for current month only to avoid performance issues)
INSERT INTO public.automation_analytics (automation_id, user_id, execution_date, total_runs, successful_runs, failed_runs, avg_duration_ms, success_rate)
SELECT 
    ar.automation_id,
    a.user_id,
    ar.started_at::DATE,
    COUNT(*),
    COUNT(*) FILTER (WHERE ar.status = 'success'),
    COUNT(*) FILTER (WHERE ar.status = 'error'),
    AVG(ar.duration_ms)::INTEGER,
    CASE 
        WHEN COUNT(*) > 0 THEN 
            (COUNT(*) FILTER (WHERE ar.status = 'success')::NUMERIC / COUNT(*)::NUMERIC * 100)::NUMERIC(5,2)
        ELSE 0 
    END
FROM public.automation_runs ar
JOIN public.automations a ON a.id = ar.automation_id
WHERE ar.started_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
GROUP BY ar.automation_id, a.user_id, ar.started_at::DATE
ON CONFLICT (automation_id, execution_date) DO NOTHING;

-- Initialize default feature flags
INSERT INTO public.feature_flags (flag_key, name, description, is_enabled, rollout_percentage) VALUES
('automation_analytics_v2', 'Enhanced Automation Analytics', 'Enable enhanced analytics dashboard for automations', true, 100),
('webhook_management', 'Webhook Management Interface', 'Enable webhook management UI', true, 100),
('api_key_management', 'API Key Management', 'Enable API key generation and management', true, 100),
('rate_limiting', 'API Rate Limiting', 'Enable rate limiting for API endpoints', true, 100),
('audit_logging', 'Comprehensive Audit Logging', 'Enable detailed audit logging for all operations', true, 100)
ON CONFLICT (flag_key) DO NOTHING;

-- Initialize default system configuration
INSERT INTO public.system_config (config_key, config_value, data_type, description) VALUES
('max_automations_per_user', '100', 'number', 'Maximum number of automations per user'),
('default_rate_limit_per_minute', '60', 'number', 'Default API rate limit per minute'),
('webhook_timeout_seconds', '30', 'number', 'Default timeout for webhook deliveries'),
('analytics_retention_days', '90', 'number', 'How long to keep analytics data'),
('audit_log_retention_days', '365', 'number', 'How long to keep audit logs'),
('backup_retention_days', '30', 'number', 'How long to keep backup files'),
('enable_performance_monitoring', 'true', 'boolean', 'Enable system performance monitoring')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================================
-- PERMISSIONS & GRANTS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT ALL ON public.user_analytics TO authenticated;
GRANT ALL ON public.automation_analytics TO authenticated;
GRANT ALL ON public.api_keys TO authenticated;
GRANT SELECT ON public.api_usage TO authenticated;
GRANT ALL ON public.webhook_endpoints TO authenticated;
GRANT SELECT ON public.webhook_deliveries TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.feature_flags TO authenticated;
GRANT SELECT ON public.system_config TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION public.calculate_daily_automation_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO authenticated;

-- Service role gets full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================================
-- TRIGGERS FOR AUTOMATION
-- ============================================================================

-- Trigger to automatically update automation analytics when runs are added
CREATE OR REPLACE FUNCTION public.update_automation_analytics_on_run()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update when run is completed
    IF NEW.completed_at IS NOT NULL THEN
        PERFORM public.calculate_daily_automation_analytics(
            NEW.automation_id, 
            NEW.started_at::DATE
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analytics_on_automation_run
    AFTER INSERT OR UPDATE ON public.automation_runs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_automation_analytics_on_run();

-- Trigger to log user activities automatically
CREATE OR REPLACE FUNCTION public.log_user_activity_on_automation_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log automation status changes
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM public.track_user_activity(
            NEW.user_id,
            'automation_status_changed',
            jsonb_build_object(
                'automation_id', NEW.id,
                'automation_name', NEW.name,
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM public.track_user_activity(
            NEW.user_id,
            'automation_created',
            jsonb_build_object(
                'automation_id', NEW.id,
                'automation_name', NEW.name,
                'status', NEW.status
            )
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.track_user_activity(
            OLD.user_id,
            'automation_deleted',
            jsonb_build_object(
                'automation_id', OLD.id,
                'automation_name', OLD.name
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_automation_activities
    AFTER INSERT OR UPDATE OR DELETE ON public.automations
    FOR EACH ROW
    EXECUTE FUNCTION public.log_user_activity_on_automation_change();

-- ============================================================================
-- CLEANUP DUPLICATE MIGRATION FILES
-- ============================================================================
-- Note: This is a reminder to manually clean up duplicate migration files:
-- - Keep the latest versions of each migration
-- - Remove older duplicate numbered files
-- - Update file numbering to be sequential

COMMENT ON TABLE public.system_metrics IS 'Enterprise-grade system performance monitoring and metrics collection';
COMMENT ON TABLE public.user_analytics IS 'Comprehensive user activity tracking and behavioral analytics';
COMMENT ON TABLE public.automation_analytics IS 'Daily aggregated analytics for automation performance and usage patterns';
COMMENT ON TABLE public.api_keys IS 'API key management with rate limiting and permission controls';
COMMENT ON TABLE public.webhook_endpoints IS 'Outgoing webhook endpoint management for event notifications';
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail for all system operations and changes';
COMMENT ON TABLE public.feature_flags IS 'Feature flag management for A/B testing and gradual rollouts';
COMMENT ON TABLE public.backup_metadata IS 'Database backup tracking and disaster recovery metadata';

-- Migration completed successfully
SELECT 'Enterprise database enhancement completed successfully' as status;