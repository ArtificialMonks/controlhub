# Database Setup Guide - Enterprise Settings Infrastructure

## Overview

This guide helps you apply the enterprise-grade settings infrastructure to your Supabase database. The system includes:

- **Core Settings Infrastructure** (Migration 009)
- **Security & Audit System** (Migration 010)
- **Default Data & Optimization** (Migration 011)

## Prerequisites

1. Access to Supabase Dashboard: https://supabase.com/dashboard/project/xxttsckupjbvvhrykprf
2. SQL Editor permissions
3. Environment variables configured in `.env.local`

## Migration Application Steps

### Step 1: Apply Core Settings Infrastructure (Migration 009)

Navigate to **SQL Editor** in your Supabase dashboard and run:

```sql
-- Copy and paste the contents of: supabase/migrations/009_create_settings_infrastructure.sql
```

**What this creates:**

- `user_settings` table with JSONB storage
- `user_roles` table for RBAC
- `role_permissions` table for fine-grained permissions
- Row Level Security (RLS) policies
- Helper functions for user management
- Automatic triggers for new users

### Step 2: Apply Security & Audit System (Migration 010)

Run in SQL Editor:

```sql
-- Copy and paste the contents of: supabase/migrations/010_create_security_audit_system.sql
```

**What this creates:**

- `user_sessions` table for session tracking
- `security_audit_trail` table for security events
- `settings_audit_trail` table for settings changes
- Audit logging functions
- Performance indexes and views
- Automatic cleanup procedures

### Step 3: Apply Default Data & Optimization (Migration 011)

Run in SQL Editor:

```sql
-- Copy and paste the contents of: supabase/migrations/011_populate_default_data.sql
```

**What this creates:**

- Default role permissions for all user types
- Performance optimizations and indexes
- Materialized views for fast queries
- Maintenance functions
- System configuration defaults

## Verification Steps

After applying all migrations, verify the setup:

### 1. Check Tables Created

```sql
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_settings', 'user_roles', 'role_permissions', 
                    'user_sessions', 'security_audit_trail', 'settings_audit_trail')
ORDER BY tablename;
```

Expected result: 6 tables

### 2. Verify RLS Policies

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Expected result: Multiple RLS policies for each table

### 3. Check Default Permissions

```sql
SELECT role, COUNT(*) as permission_count
FROM public.role_permissions
GROUP BY role
ORDER BY role;
```

Expected result:

- admin: ~20+ permissions
- editor: ~15+ permissions  
- user: ~10+ permissions
- viewer: ~6+ permissions
- api: ~8+ permissions

### 4. Test Default Settings Creation

```sql
-- This should show a comprehensive default settings structure
SELECT settings_data->'profile'->>'name' as profile_name,
       settings_data->'appearance'->>'name' as appearance_name,
       settings_data->'security'->>'name' as security_name
FROM public.user_settings 
WHERE user_id = '00000000-0000-0000-0000-000000000000'; -- System settings
```

## Database Schema Overview

### Core Tables

1. **user_settings**
   - Primary settings storage with JSONB
   - Encryption field tracking
   - Version control and checksums

2. **user_roles**
   - Role-based access control
   - Expiration support
   - Assignment tracking

3. **role_permissions**
   - Fine-grained permissions
   - Resource and action mapping
   - Conditional access rules

### Security Tables

1. **user_sessions**
   - Session management and tracking
   - Device fingerprinting
   - Geographic location data

2. **security_audit_trail**
   - Comprehensive security logging
   - Risk scoring and severity levels
   - Event categorization

3. **settings_audit_trail**
   - Settings change tracking
   - Field-level audit trails
   - Human-readable summaries

### Performance Features

- **Materialized Views**: Fast permission lookups and security summaries
- **Composite Indexes**: Optimized for common query patterns
- **GIN Indexes**: Fast JSONB searches
- **Partial Indexes**: Efficient filtering for recent data

## Environment Variables Required

Ensure these are set in your `.env.local`:

```bash
# Security Framework Keys
SECURITY_MASTER_KEY="chub_security_master_2025_enterprise_aes256_gcm_encryption_key_ultra_secure"
ENCRYPTION_SALT="chub_salt_2025_pbkdf2_key_derivation_secure_random_salt"  
SETTINGS_ENCRYPTION_KEY="chub_settings_2025_aes256_ctr_mode_enterprise_encryption_key_secure"
```

## Security Features

### Encryption

- AES-256-GCM for sensitive data
- PBKDF2 key derivation with 100,000 iterations
- Field-level encryption tracking

### Access Control

- Role-Based Access Control (RBAC)
- Row Level Security (RLS) on all tables
- Permission-based resource access

### Audit Trail

- Complete activity logging
- Risk scoring and threat detection
- Automatic data archival and cleanup

## Maintenance

### Daily Tasks (Automated)

```sql
SELECT public.daily_maintenance();
```

### Weekly Tasks (Automated)

```sql
SELECT public.weekly_maintenance();
```

### Manual Cleanup

```sql
-- Clean up old data (customize retention periods)
SELECT public.cleanup_old_data(365, 90, 30);
```

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Ensure RLS policies are applied
   - Check user roles are assigned correctly

2. **Encryption Errors**
   - Verify environment variables are set
   - Check encryption keys are 32+ characters

3. **Performance Issues**
   - Run `SELECT public.refresh_performance_views();`
   - Check if indexes were created properly

### Support

For issues with this database setup:

1. Check the migration files for any error messages
2. Verify all environment variables are configured
3. Ensure proper Supabase permissions for SQL execution

## Next Steps

After successful database setup:

1. **Test Settings Page**: Navigate to `/settings` to verify functionality
2. **Validate Security**: Check encryption and audit logging
3. **Performance Testing**: Monitor query performance and caching
4. **User Testing**: Create test users and verify role permissions

The enterprise-grade settings infrastructure is now ready for production use with comprehensive security, audit trails, and performance optimization.
