-- Migration: 012_fix_settings_defaults.sql
-- Description: Fix settings defaults to match application expectations
-- Author: ControlHub Team
-- Date: 2025-01-08

-- Update the get_user_settings function to use correct defaults
CREATE OR REPLACE FUNCTION public.get_user_settings(
    p_user_id UUID,
    p_category VARCHAR(50)
)
RETURNS JSONB AS $$
DECLARE
    v_settings JSONB;
    v_defaults JSONB;
BEGIN
    -- Define default settings based on category with corrected values
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
                "webhookUrl": "",
                "apiKeys": {},
                "connectedServices": [],
                "oauthTokens": {},
                "syncEnabled": true,
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

-- Update existing appearance settings to use new defaults for new users
-- This won't affect existing users who have saved settings
UPDATE public.user_settings 
SET settings = jsonb_set(
    jsonb_set(settings, '{theme}', '"light"', true),
    '{fontSize}', '"small"', true
)
WHERE category = 'appearance' 
AND (settings->>'theme' = 'system' OR settings->>'fontSize' = 'medium');

-- Update existing profile settings to include teamMode
UPDATE public.user_settings
SET settings = jsonb_set(settings, '{teamMode}', '"lite"', true)
WHERE category = 'profile' 
AND NOT settings ? 'teamMode';