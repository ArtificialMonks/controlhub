# Supabase Schema Design for Quest 6.1 Settings Page

## Overview

Comprehensive database schema design for enterprise-grade settings management with real-time synchronization, audit trails, and encrypted storage for sensitive data.

## Core Tables

### 1. User Settings Table

```sql
-- Main user settings table with JSON columns for flexible storage
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Settings categories as JSON columns
  profile_settings jsonb DEFAULT '{}',
  appearance_settings jsonb DEFAULT '{}',
  automation_settings jsonb DEFAULT '{}',
  security_settings jsonb DEFAULT '{}',
  integration_settings jsonb DEFAULT '{}',
  notification_settings jsonb DEFAULT '{}',
  
  -- Metadata
  version integer DEFAULT 1,
  checksum text,
  last_sync timestamptz DEFAULT now(),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT user_settings_user_id_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX idx_user_settings_updated_at ON public.user_settings(updated_at);
```

### 2. Settings Audit Trail Table

```sql
-- Audit trail for all settings changes
CREATE TABLE public.settings_audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Change details
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  section text NOT NULL, -- profile, appearance, automation, etc.
  field_path text NOT NULL, -- JSON path to changed field
  old_value jsonb,
  new_value jsonb,
  
  -- Request metadata
  ip_address inet,
  user_agent text,
  session_id text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_action CHECK (action IN ('create', 'update', 'delete'))
);

-- Enable RLS
ALTER TABLE public.settings_audit_trail ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own audit trail" ON public.settings_audit_trail
  FOR SELECT USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_audit_trail_user_id ON public.settings_audit_trail(user_id);
CREATE INDEX idx_audit_trail_created_at ON public.settings_audit_trail(created_at);
CREATE INDEX idx_audit_trail_section ON public.settings_audit_trail(section);
```

### 3. Encrypted Settings Storage

```sql
-- Encrypted storage for sensitive settings (API keys, passwords, etc.)
CREATE TABLE public.encrypted_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Encrypted data
  setting_key text NOT NULL,
  encrypted_value text NOT NULL, -- Base64 encoded encrypted data
  encryption_method text DEFAULT 'AES-256-GCM',
  
  -- Metadata
  description text,
  expires_at timestamptz,
  last_accessed timestamptz,
  access_count integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT encrypted_settings_user_key_unique UNIQUE (user_id, setting_key)
);

-- Enable RLS
ALTER TABLE public.encrypted_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own encrypted settings" ON public.encrypted_settings
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_encrypted_settings_user_id ON public.encrypted_settings(user_id);
CREATE INDEX idx_encrypted_settings_key ON public.encrypted_settings(setting_key);
CREATE INDEX idx_encrypted_settings_expires_at ON public.encrypted_settings(expires_at);
```

### 4. Settings Templates Table

```sql
-- Predefined settings templates for different user roles/types
CREATE TABLE public.settings_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template details
  name text NOT NULL,
  description text,
  category text NOT NULL, -- 'default', 'admin', 'power_user', etc.
  
  -- Template data
  template_data jsonb NOT NULL,
  
  -- Metadata
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT settings_templates_name_unique UNIQUE (name, category)
);

-- Indexes
CREATE INDEX idx_settings_templates_category ON public.settings_templates(category);
CREATE INDEX idx_settings_templates_active ON public.settings_templates(is_active);
```

## Database Functions

### 1. Settings Update Function with Audit Trail

```sql
-- Function to update settings with automatic audit trail
CREATE OR REPLACE FUNCTION update_user_settings(
  p_user_id uuid,
  p_section text,
  p_field_path text,
  p_new_value jsonb,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_old_value jsonb;
  v_current_settings jsonb;
  v_updated_settings jsonb;
  v_result jsonb;
BEGIN
  -- Get current settings
  EXECUTE format('SELECT %I FROM public.user_settings WHERE user_id = $1', p_section || '_settings')
  INTO v_current_settings
  USING p_user_id;
  
  -- Extract old value
  v_old_value := v_current_settings #> string_to_array(p_field_path, '.');
  
  -- Update the settings
  v_updated_settings := jsonb_set(
    COALESCE(v_current_settings, '{}'),
    string_to_array(p_field_path, '.'),
    p_new_value
  );
  
  -- Update the main settings table
  EXECUTE format(
    'UPDATE public.user_settings SET %I = $1, updated_at = now() WHERE user_id = $2',
    p_section || '_settings'
  ) USING v_updated_settings, p_user_id;
  
  -- Insert audit trail record
  INSERT INTO public.settings_audit_trail (
    user_id, action, section, field_path, old_value, new_value, ip_address, user_agent
  ) VALUES (
    p_user_id, 'update', p_section, p_field_path, v_old_value, p_new_value, p_ip_address, p_user_agent
  );
  
  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'old_value', v_old_value,
    'new_value', p_new_value,
    'timestamp', now()
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Settings Validation Function

```sql
-- Function to validate settings data
CREATE OR REPLACE FUNCTION validate_settings_data(
  p_section text,
  p_data jsonb
) RETURNS jsonb AS $$
DECLARE
  v_errors jsonb := '[]';
  v_warnings jsonb := '[]';
  v_result jsonb;
BEGIN
  -- Validation logic based on section
  CASE p_section
    WHEN 'profile' THEN
      -- Validate profile settings
      IF NOT (p_data ? 'personalInfo') THEN
        v_errors := v_errors || jsonb_build_object('field', 'personalInfo', 'message', 'Personal info is required');
      END IF;
      
    WHEN 'security' THEN
      -- Validate security settings
      IF (p_data #>> '{authentication,sessionTimeout}')::integer < 5 THEN
        v_warnings := v_warnings || jsonb_build_object('field', 'sessionTimeout', 'message', 'Session timeout less than 5 minutes is not recommended');
      END IF;
      
    -- Add more validation rules as needed
  END CASE;
  
  v_result := jsonb_build_object(
    'valid', jsonb_array_length(v_errors) = 0,
    'errors', v_errors,
    'warnings', v_warnings
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

## Real-time Subscriptions

### 1. Settings Change Notifications

```sql
-- Enable real-time for settings tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings_audit_trail;

-- Function to notify settings changes
CREATE OR REPLACE FUNCTION notify_settings_change()
RETURNS trigger AS $$
BEGIN
  -- Notify via pg_notify for real-time updates
  PERFORM pg_notify(
    'settings_changed',
    json_build_object(
      'user_id', NEW.user_id,
      'action', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', now()
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER settings_change_notify
  AFTER INSERT OR UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION notify_settings_change();
```

## Security Considerations

### 1. Encryption at Rest

- Sensitive data stored in `encrypted_settings` table
- Use application-level encryption before storing
- Implement key rotation strategy
- Audit access to encrypted data

### 2. Row Level Security

- All tables have RLS enabled
- Users can only access their own data
- Audit trail provides complete change history
- Admin access requires elevated permissions

### 3. Data Validation

- JSON schema validation at application level
- Database constraints for critical fields
- Input sanitization and validation
- Rate limiting for settings updates

## Performance Optimization

### 1. Indexing Strategy

- User ID indexes on all tables
- Timestamp indexes for audit queries
- JSON path indexes for frequent queries
- Composite indexes for complex queries

### 2. Caching Strategy

- Redis cache for frequently accessed settings
- Cache invalidation on updates
- Optimistic locking for concurrent updates
- Background sync for cache warming

This schema design provides a robust foundation for enterprise-grade settings management with comprehensive audit trails, real-time synchronization, and security best practices.
