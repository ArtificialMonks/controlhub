-- Migration: 009_create_settings_infrastructure.sql
-- Description: Create comprehensive settings infrastructure for user preferences
-- Author: ControlHub Team
-- Date: 2025-01-08

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category)
);

-- Create settings_audit table for change tracking
CREATE TABLE IF NOT EXISTS public.settings_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_category ON public.user_settings(category);
CREATE INDEX IF NOT EXISTS idx_user_settings_updated_at ON public.user_settings(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_settings_audit_user_id ON public.settings_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_audit_changed_at ON public.settings_audit(changed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
CREATE POLICY "Users can view their own settings"
    ON public.user_settings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON public.user_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON public.user_settings
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
    ON public.user_settings
    FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for settings_audit (read-only for users)
CREATE POLICY "Users can view their own audit logs"
    ON public.settings_audit
    FOR SELECT
    USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_settings_updated_at();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION public.audit_settings_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.settings_audit (
        user_id,
        category,
        old_value,
        new_value,
        changed_by,
        ip_address,
        user_agent
    ) VALUES (
        NEW.user_id,
        NEW.category,
        OLD.settings,
        NEW.settings,
        auth.uid(),
        inet_client_addr(),
        current_setting('request.headers')::json->>'user-agent'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create audit logs on settings changes
CREATE TRIGGER audit_user_settings_changes
    AFTER UPDATE ON public.user_settings
    FOR EACH ROW
    WHEN (OLD.settings IS DISTINCT FROM NEW.settings)
    EXECUTE FUNCTION public.audit_settings_change();

-- Function to get user settings with defaults
CREATE OR REPLACE FUNCTION public.get_user_settings(
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
                "phoneNumber": ""
            }'::JSONB;
        WHEN 'appearance' THEN
            v_defaults := '{
                "theme": "system",
                "fontSize": "medium",
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
                "defaultTimeout": 60,
                "retryAttempts": 3,
                "errorHandling": "stop",
                "parallelExecution": true,
                "maxConcurrentRuns": 5,
                "schedulingEnabled": true,
                "performanceMonitoring": true,
                "debugMode": false
            }'::JSONB;
        ELSE
            v_defaults := '{}'::JSONB;
    END CASE;

    -- Get user settings or return defaults
    SELECT settings INTO v_settings
    FROM public.user_settings
    WHERE user_id = p_user_id AND category = p_category;

    IF v_settings IS NULL THEN
        -- Create default settings if they don't exist
        INSERT INTO public.user_settings (user_id, category, settings)
        VALUES (p_user_id, p_category, v_defaults)
        ON CONFLICT (user_id, category) DO NOTHING
        RETURNING settings INTO v_settings;
        
        -- If insert failed due to race condition, get the settings
        IF v_settings IS NULL THEN
            SELECT settings INTO v_settings
            FROM public.user_settings
            WHERE user_id = p_user_id AND category = p_category;
        END IF;
    END IF;

    -- Merge defaults with user settings (user settings take precedence)
    RETURN v_defaults || COALESCE(v_settings, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user settings
CREATE OR REPLACE FUNCTION public.update_user_settings(
    p_user_id UUID,
    p_category VARCHAR(50),
    p_settings JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    INSERT INTO public.user_settings (user_id, category, settings)
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
GRANT ALL ON public.user_settings TO authenticated;
GRANT ALL ON public.settings_audit TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_settings TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_settings TO authenticated;

-- Create initial settings for existing users
INSERT INTO public.user_settings (user_id, category, settings)
SELECT 
    id as user_id,
    'profile' as category,
    jsonb_build_object(
        'displayName', COALESCE(raw_user_meta_data->>'full_name', email),
        'email', email,
        'avatarUrl', raw_user_meta_data->>'avatar_url',
        'timezone', 'UTC',
        'language', 'en'
    ) as settings
FROM auth.users
ON CONFLICT (user_id, category) DO NOTHING;