-- Migration: 016_fix_permissions_user_settings_v2.sql
-- Description: Ensure proper permissions are set for user_settings_v2
-- Author: ControlHub Team
-- Date: 2025-08-07
-- Purpose: Fix any permission issues preventing settings from being saved

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.user_settings_v2 TO authenticated;
GRANT ALL ON public.user_settings_audit_v2 TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE public.user_settings_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings_audit_v2 ENABLE ROW LEVEL SECURITY;

-- Create audit trigger if it doesn't exist
CREATE OR REPLACE FUNCTION public.audit_user_settings_v2()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log actual changes, not initial inserts
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        INSERT INTO public.user_settings_audit_v2 (
            user_id,
            category,
            action,
            old_settings,
            new_settings
        ) VALUES (
            COALESCE(OLD.user_id, NEW.user_id),
            COALESCE(OLD.category, NEW.category),
            TG_OP,
            CASE WHEN TG_OP != 'INSERT' THEN OLD.settings ELSE NULL END,
            CASE WHEN TG_OP != 'DELETE' THEN NEW.settings ELSE NULL END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS audit_settings_changes_v2 ON public.user_settings_v2;

-- Create audit trigger
CREATE TRIGGER audit_settings_changes_v2
    AFTER INSERT OR UPDATE OR DELETE ON public.user_settings_v2
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_user_settings_v2();

-- Verify the setup
DO $$
DECLARE
    rls_enabled boolean;
BEGIN
    -- Check if RLS is enabled
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = 'user_settings_v2';
    
    IF NOT rls_enabled THEN
        RAISE EXCEPTION 'RLS is not enabled on user_settings_v2';
    END IF;
    
    RAISE NOTICE 'Permissions and triggers successfully configured for user_settings_v2';
END $$;

-- Migration completed successfully
SELECT 'User settings v2 permissions fixed successfully' as status;