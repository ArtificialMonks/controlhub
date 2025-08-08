-- Migration: 014_fix_user_settings_v2_categories.sql
-- Description: Fix CHECK constraint on user_settings_v2 to include all categories used by the application
-- Author: ControlHub Team
-- Date: 2025-08-07
-- Purpose: Allow notifications, integrations, and automations categories to be saved

-- Drop the existing CHECK constraint that's blocking saves
ALTER TABLE public.user_settings_v2 
DROP CONSTRAINT IF EXISTS user_settings_v2_category_check;

-- Add updated CHECK constraint with all categories the application uses
ALTER TABLE public.user_settings_v2 
ADD CONSTRAINT user_settings_v2_category_check 
CHECK (category IN (
    'profile',
    'appearance', 
    'security',
    'privacy',
    'notifications',
    'integrations', 
    'automations',
    'two_factor_setup'
));

-- Verify the constraint was updated successfully
DO $$
DECLARE
    constraint_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conrelid = 'public.user_settings_v2'::regclass 
        AND conname = 'user_settings_v2_category_check'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        RAISE EXCEPTION 'Failed to create CHECK constraint on user_settings_v2';
    END IF;
    
    RAISE NOTICE 'CHECK constraint successfully updated to include all categories';
END $$;

-- Add comment explaining the categories
COMMENT ON CONSTRAINT user_settings_v2_category_check ON public.user_settings_v2 IS 
'Validates setting categories. Includes: profile (user info), appearance (theme/UI), security (auth/2FA), privacy (data sharing), notifications (alerts/emails), integrations (webhooks/APIs), automations (workflow settings), two_factor_setup (2FA configuration)';

-- Migration completed successfully
SELECT 'User settings v2 categories constraint fixed successfully' as status;