-- Migration 009: Core Settings Infrastructure
-- Creates the foundational tables for Quest 6.1 enterprise-grade settings system
-- Includes user_settings, user_roles, and role_permissions with comprehensive security

-- =====================================================
-- 1. USER SETTINGS TABLE
-- =====================================================
-- Main table for storing user settings with encryption support
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  settings_data JSONB NOT NULL DEFAULT '{}',
  encrypted_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
  version INTEGER DEFAULT 1 NOT NULL,
  checksum TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id) -- Each user can have only one settings record
);

-- Enable Row Level Security for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON public.user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Performance indexes for user_settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_updated_at ON public.user_settings(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_settings_version ON public.user_settings(version);

-- =====================================================
-- 2. USER ROLES TABLE
-- =====================================================
-- Role-based access control system
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'api', 'viewer', 'editor')),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role) -- Users can't have duplicate roles
);

-- Enable Row Level Security for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Only admins can manage roles (insert/update/delete)
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin' 
      AND ur.active = TRUE
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Performance indexes for user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(user_id, active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON public.user_roles(expires_at) WHERE expires_at IS NOT NULL;

-- =====================================================
-- 3. ROLE PERMISSIONS TABLE
-- =====================================================
-- Defines what each role can do
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'api', 'viewer', 'editor')),
  permission TEXT NOT NULL,
  resource TEXT NOT NULL,
  actions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  conditions JSONB DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(role, permission, resource) -- Prevent duplicate permission entries
);

-- Enable Row Level Security for role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for role_permissions
CREATE POLICY "All authenticated users can view role permissions" ON public.role_permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can manage permissions
CREATE POLICY "Admins can manage permissions" ON public.role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin' 
      AND ur.active = TRUE
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Performance indexes for role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON public.role_permissions(resource);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission);

-- =====================================================
-- 4. TRIGGERS FOR UPDATED_AT
-- =====================================================
-- Reuse the existing handle_updated_at function from migration 001
CREATE TRIGGER handle_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(target_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(role TEXT, expires_at TIMESTAMPTZ, active BOOLEAN)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role, ur.expires_at, ur.active
  FROM public.user_roles ur
  WHERE ur.user_id = target_user_id
    AND ur.active = TRUE
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
$$;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
  target_user_id UUID,
  required_permission TEXT,
  target_resource TEXT DEFAULT 'settings'
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = target_user_id
      AND ur.active = TRUE
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      AND rp.permission = required_permission
      AND rp.resource = target_resource
  );
$$;

-- Function to create default settings for new user
CREATE OR REPLACE FUNCTION public.create_default_user_settings(target_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings_id UUID;
  default_settings JSONB;
BEGIN
  -- Build default settings JSON structure
  default_settings := jsonb_build_object(
    'userId', target_user_id,
    'profile', jsonb_build_object(
      'id', 'profile',
      'name', 'User Profile',
      'description', 'Personal information and preferences',
      'enabled', true,
      'lastModified', NOW(),
      'version', 1,
      'personalInfo', jsonb_build_object(
        'firstName', '',
        'lastName', '',
        'displayName', '',
        'email', '',
        'phoneNumber', '',
        'timezone', 'UTC',
        'language', 'en',
        'dateFormat', 'MM/DD/YYYY',
        'timeFormat', '12h'
      ),
      'avatar', jsonb_build_object(
        'url', '',
        'uploadedAt', NOW(),
        'size', 0,
        'mimeType', 'image/jpeg'
      ),
      'contactPreferences', jsonb_build_object(
        'allowEmailContact', true,
        'allowPhoneContact', false,
        'allowMarketingEmails', false,
        'allowProductUpdates', true
      ),
      'privacy', jsonb_build_object(
        'profileVisibility', 'private',
        'showOnlineStatus', false,
        'allowDataExport', true,
        'allowDataDeletion', true
      )
    ),
    'appearance', jsonb_build_object(
      'id', 'appearance',
      'name', 'Appearance',
      'description', 'Visual preferences and theme settings',
      'enabled', true,
      'lastModified', NOW(),
      'version', 1,
      'theme', jsonb_build_object(
        'mode', 'system',
        'highContrast', false,
        'reducedMotion', false
      ),
      'typography', jsonb_build_object(
        'fontSize', 'medium',
        'fontFamily', 'orbitron',
        'lineHeight', 'normal',
        'letterSpacing', 'normal'
      ),
      'layout', jsonb_build_object(
        'density', 'comfortable',
        'sidebarCollapsed', false,
        'showTooltips', true,
        'animationSpeed', 'normal'
      ),
      'accessibility', jsonb_build_object(
        'screenReaderOptimized', false,
        'keyboardNavigationEnhanced', false,
        'focusIndicatorEnhanced', false,
        'colorBlindnessSupport', 'none'
      )
    ),
    'security', jsonb_build_object(
      'id', 'security',
      'name', 'Security',
      'description', 'Security and privacy settings',
      'enabled', true,
      'lastModified', NOW(),
      'version', 1,
      'authentication', jsonb_build_object(
        'twoFactorEnabled', false,
        'twoFactorMethod', 'totp',
        'backupCodes', '[]'::jsonb,
        'sessionTimeout', 60,
        'requirePasswordChange', false,
        'passwordChangeInterval', 90
      ),
      'sessions', jsonb_build_object(
        'maxActiveSessions', 3,
        'logoutInactiveSessions', true,
        'inactivityTimeout', 30,
        'rememberDevice', false,
        'deviceTrustDuration', 30
      ),
      'privacy', jsonb_build_object(
        'dataRetentionPeriod', 365,
        'allowAnalytics', true,
        'allowCrashReporting', true,
        'allowUsageTracking', false,
        'allowPersonalization', true
      )
    ),
    'metadata', jsonb_build_object(
      'version', '1.0.0',
      'lastSync', NOW(),
      'checksum', ''
    ),
    'auditTrail', '[]'::jsonb
  );

  -- Insert the default settings
  INSERT INTO public.user_settings (user_id, settings_data, version)
  VALUES (target_user_id, default_settings, 1)
  RETURNING id INTO settings_id;

  RETURN settings_id;
END;
$$;

-- =====================================================
-- 6. DEFAULT ROLE ASSIGNMENT TRIGGER
-- =====================================================
-- Automatically assign 'user' role to new users and create default settings
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role, assigned_by, assigned_at)
  VALUES (NEW.id, 'user', NEW.id, NOW());

  -- Create default settings
  PERFORM public.create_default_user_settings(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing trigger or create new one for settings
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();

-- =====================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE public.user_settings IS 'Enterprise-grade user settings storage with encryption support and audit trails';
COMMENT ON TABLE public.user_roles IS 'Role-based access control system for users with expiration support';
COMMENT ON TABLE public.role_permissions IS 'Defines permissions for each role with granular access control';

COMMENT ON COLUMN public.user_settings.settings_data IS 'JSONB storage for all user settings sections (profile, appearance, security, etc.)';
COMMENT ON COLUMN public.user_settings.encrypted_fields IS 'Array of dot-notation paths to fields that are encrypted within settings_data';
COMMENT ON COLUMN public.user_settings.checksum IS 'Data integrity verification hash';

COMMENT ON FUNCTION public.get_user_roles(UUID) IS 'Returns active roles for a user with expiration checking';
COMMENT ON FUNCTION public.user_has_permission(UUID, TEXT, TEXT) IS 'Checks if user has specific permission for a resource';
COMMENT ON FUNCTION public.create_default_user_settings(UUID) IS 'Creates comprehensive default settings structure for new users';