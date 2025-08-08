-- Migration: 013_create_user_settings_v2_table.sql
-- Description: Create user_settings_v2 table with proper RLS policies
-- Author: ControlHub Team
-- Date: 2025-08-07
-- Purpose: Ensure user_settings_v2 table exists with correct structure and permissions

-- Create user_settings_v2 table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_settings_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'profile', 'appearance', 'security', 'privacy', 
        'notifications', 'integrations', 'automations', 'two_factor_setup'
    )),
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category)
);

-- Create user_settings_audit_v2 table for change tracking
CREATE TABLE IF NOT EXISTS public.user_settings_audit_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    change_reason VARCHAR(200)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_settings_v2_user_id ON public.user_settings_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_v2_category ON public.user_settings_v2(category);
CREATE INDEX IF NOT EXISTS idx_user_settings_v2_user_category ON public.user_settings_v2(user_id, category);
CREATE INDEX IF NOT EXISTS idx_user_settings_v2_updated_at ON public.user_settings_v2(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_settings_audit_v2_user_id ON public.user_settings_audit_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_audit_v2_changed_at ON public.user_settings_audit_v2(changed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_settings_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings_audit_v2 ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings_v2;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings_v2;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings_v2;
DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings_v2;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.user_settings_audit_v2;

-- RLS Policies for user_settings_v2
CREATE POLICY "Users can view their own settings"
    ON public.user_settings_v2
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON public.user_settings_v2
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON public.user_settings_v2
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
    ON public.user_settings_v2
    FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for user_settings_audit_v2 (read-only for users)
CREATE POLICY "Users can view their own audit logs"
    ON public.user_settings_audit_v2
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can manage all settings
CREATE POLICY "Service role can manage all settings"
    ON public.user_settings_v2
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage all audit logs"
    ON public.user_settings_audit_v2
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_settings_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_settings_v2_updated_at
    BEFORE UPDATE ON public.user_settings_v2
    FOR EACH ROW
    EXECUTE FUNCTION public.update_settings_v2_updated_at();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION public.audit_settings_v2_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_settings_audit_v2 (
        user_id,
        category,
        old_value,
        new_value,
        changed_by,
        ip_address,
        user_agent,
        change_reason
    ) VALUES (
        NEW.user_id,
        NEW.category,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.settings END,
        NEW.settings,
        auth.uid(),
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent',
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'Settings created'
            WHEN TG_OP = 'UPDATE' THEN 'Settings updated'
            ELSE 'Settings modified'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create audit logs on settings changes
DROP TRIGGER IF EXISTS audit_user_settings_v2_changes ON public.user_settings_v2;
CREATE TRIGGER audit_user_settings_v2_changes
    AFTER INSERT OR UPDATE ON public.user_settings_v2
    FOR EACH ROW
    WHEN (
        TG_OP = 'INSERT' OR 
        (TG_OP = 'UPDATE' AND OLD.settings IS DISTINCT FROM NEW.settings)
    )
    EXECUTE FUNCTION public.audit_settings_v2_change();

-- Function to get user settings with defaults for v2
CREATE OR REPLACE FUNCTION public.get_user_settings_v2(
    p_user_id UUID,
    p_category VARCHAR(50)
)
RETURNS JSONB AS $$
DECLARE
    v_settings JSONB;
    v_defaults JSONB;
BEGIN
    -- Define default settings based on category
    CASE p_category
        WHEN 'profile' THEN
            v_defaults := '{
                "displayName": "",
                "email": "",
                "bio": "",
                "avatarUrl": "",
                "timezone": "UTC",
                "language": "en",
                "country": "",
                "phoneNumber": "",
                "teamMode": "lite"
            }'::JSONB;
        WHEN 'appearance' THEN
            v_defaults := '{
                "theme": "light",
                "fontSize": "small",
                "fontFamily": "default",
                "highContrast": false,
                "reducedMotion": false,
                "density": "comfortable"
            }'::JSONB;
        WHEN 'security' THEN
            v_defaults := '{
                "twoFactorEnabled": false,
                "sessionTimeout": 30,
                "loginNotifications": true,
                "apiKeyRotation": false
            }'::JSONB;
        WHEN 'privacy' THEN
            v_defaults := '{
                "analyticsEnabled": true,
                "personalizationEnabled": true,
                "dataSharing": false,
                "publicProfile": false,
                "activityVisibility": "private",
                "searchEngineIndexing": false
            }'::JSONB;
        WHEN 'notifications' THEN
            v_defaults := '{
                "emailNotifications": true,
                "inAppNotifications": true,
                "pushNotifications": false,
                "automationAlerts": true,
                "systemUpdates": true,
                "marketingEmails": false,
                "dailyDigest": false,
                "weeklyReport": true,
                "notificationFrequency": "realtime"
            }'::JSONB;
        WHEN 'integrations' THEN
            v_defaults := '{
                "webhookUrl": null,
                "apiKeys": {},
                "connectedServices": [],
                "syncEnabled": false,
                "autoBackup": false,
                "exportFormat": "json"
            }'::JSONB;
        WHEN 'automations' THEN
            v_defaults := '{
                "defaultTimeout": 30,
                "retryAttempts": 3,
                "errorHandling": "continue",
                "parallelExecution": true,
                "maxConcurrentRuns": 10,
                "schedulingEnabled": true,
                "performanceMonitoring": true,
                "debugMode": false
            }'::JSONB;
        ELSE
            v_defaults := '{}'::JSONB;
    END CASE;

    -- Get user settings or return defaults
    SELECT settings INTO v_settings
    FROM public.user_settings_v2
    WHERE user_id = p_user_id AND category = p_category;

    -- Merge defaults with user settings (user settings take precedence)
    RETURN v_defaults || COALESCE(v_settings, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user settings for v2
CREATE OR REPLACE FUNCTION public.update_user_settings_v2(
    p_user_id UUID,
    p_category VARCHAR(50),
    p_settings JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    INSERT INTO public.user_settings_v2 (user_id, category, settings)
    VALUES (p_user_id, p_category, p_settings)
    ON CONFLICT (user_id, category)
    DO UPDATE SET 
        settings = EXCLUDED.settings,
        updated_at = NOW()
    RETURNING settings INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON public.user_settings_v2 TO authenticated;
GRANT ALL ON public.user_settings_audit_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_settings_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_settings_v2 TO authenticated;

-- Service role gets full access
GRANT ALL ON public.user_settings_v2 TO service_role;
GRANT ALL ON public.user_settings_audit_v2 TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_settings_v2 TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_settings_v2 TO service_role;

-- Create initial default settings for existing users
INSERT INTO public.user_settings_v2 (user_id, category, settings)
SELECT 
    id as user_id,
    'profile' as category,
    jsonb_build_object(
        'displayName', COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
        'email', email,
        'bio', '',
        'avatarUrl', COALESCE(raw_user_meta_data->>'avatar_url', ''),
        'timezone', 'UTC',
        'language', 'en',
        'country', '',
        'phoneNumber', '',
        'teamMode', 'lite'
    ) as settings
FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT (user_id, category) DO NOTHING;

-- Migration completed successfully
SELECT 'User settings v2 table created successfully' as status;