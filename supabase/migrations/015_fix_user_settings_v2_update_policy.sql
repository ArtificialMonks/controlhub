-- Migration: 015_fix_user_settings_v2_update_policy.sql
-- Description: Fix UPDATE policy on user_settings_v2 to include with_check
-- Author: ControlHub Team
-- Date: 2025-08-07
-- Purpose: Ensure UPDATE policy properly validates user ownership

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Users can update own settings v2" ON public.user_settings_v2;

-- Recreate UPDATE policy with proper with_check
CREATE POLICY "Users can update own settings v2" ON public.user_settings_v2
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Verify all policies are in place
DO $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'user_settings_v2';
    
    IF policy_count < 4 THEN
        RAISE EXCEPTION 'Expected 4 RLS policies on user_settings_v2, found %', policy_count;
    END IF;
    
    RAISE NOTICE 'RLS policies successfully verified for user_settings_v2';
END $$;

-- Ensure RLS is enabled on the table
ALTER TABLE public.user_settings_v2 ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings_v2 TO authenticated;
GRANT USAGE ON SEQUENCE user_settings_v2_id_seq TO authenticated;

-- Migration completed successfully
SELECT 'User settings v2 UPDATE policy fixed successfully' as status;