// src/lib/services/settings-migration.ts
import { createClient } from '@/lib/integrations/supabase/client'

export class SettingsMigrationService {
  private supabase = createClient()

  /**
   * Migrate from legacy user_settings to user_settings_v2 structure
   */
  async migrateLegacySettings(): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      // Check if legacy settings exist
      const { data: legacyData, error: legacyError } = await this.supabase
        .from('user_settings')
        .select('settings_data')
        .eq('user_id', user.id)
        .single()

      if (legacyError || !legacyData?.settings_data) {
        console.log('No legacy settings found to migrate')
        return true
      }

      const legacySettings = legacyData.settings_data
      const migrations: Array<{ category: string; settings: Record<string, unknown> }> = []

      // Migrate profile settings
      if (legacySettings.profile) {
        const profileData = legacySettings.profile
        migrations.push({
          category: 'profile',
          settings: {
            displayName: profileData.personalInfo?.displayName || '',
            email: profileData.personalInfo?.email || '',
            bio: '', // Not in legacy structure
            avatarUrl: '', // Not in legacy structure
            timezone: profileData.personalInfo?.timezone || 'UTC',
            language: profileData.personalInfo?.language || 'en',
            country: '', // Not in legacy structure
            phoneNumber: profileData.personalInfo?.phoneNumber || ''
          }
        })
      }

      // Migrate appearance settings
      if (legacySettings.appearance) {
        const appearanceData = legacySettings.appearance
        migrations.push({
          category: 'appearance',
          settings: {
            theme: appearanceData.theme?.mode || 'system',
            fontSize: 'medium', // Not in legacy structure
            fontFamily: 'default', // Not in legacy structure
            highContrast: appearanceData.theme?.highContrast || false,
            reducedMotion: appearanceData.theme?.reducedMotion || false,
            density: 'comfortable' // Not in legacy structure
          }
        })
      }

      // Migrate security settings
      if (legacySettings.security) {
        const securityData = legacySettings.security
        migrations.push({
          category: 'security',
          settings: {
            twoFactorEnabled: securityData.authentication?.twoFactorEnabled || false,
            sessionTimeout: securityData.authentication?.sessionTimeout || 30,
            loginNotifications: true, // Not in legacy structure
            apiKeyRotation: false // Not in legacy structure
          }
        })
      }

      // Migrate to new structure
      for (const migration of migrations) {
        await this.supabase
          .from('user_settings_v2')
          .upsert({
            user_id: user.id,
            category: migration.category,
            settings: migration.settings
          }, {
            onConflict: 'user_id,category'
          })
      }

      console.log('Settings migration completed successfully')
      return true
    } catch (error) {
      console.error('Settings migration failed:', error)
      return false
    }
  }

  /**
   * Initialize default settings for new users
   */
  async initializeDefaultSettings(): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      const defaultSettings = [
        {
          category: 'profile',
          settings: {
            displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            email: user.email || '',
            bio: '',
            avatarUrl: user.user_metadata?.avatar_url || '',
            timezone: 'UTC',
            language: 'en',
            country: '',
            phoneNumber: ''
          }
        },
        {
          category: 'appearance',
          settings: {
            theme: 'system',
            fontSize: 'medium',
            fontFamily: 'default',
            highContrast: false,
            reducedMotion: false,
            density: 'comfortable'
          }
        },
        {
          category: 'security',
          settings: {
            twoFactorEnabled: false,
            sessionTimeout: 30,
            loginNotifications: true,
            apiKeyRotation: false
          }
        },
        {
          category: 'privacy',
          settings: {
            analyticsEnabled: true,
            personalizationEnabled: true,
            dataSharing: false,
            publicProfile: false,
            activityVisibility: 'private',
            searchEngineIndexing: false
          }
        }
      ]

      // Insert only if settings don't already exist
      for (const setting of defaultSettings) {
        const { data: existing } = await this.supabase
          .from('user_settings_v2')
          .select('id')
          .eq('user_id', user.id)
          .eq('category', setting.category)
          .single()

        if (!existing) {
          await this.supabase
            .from('user_settings_v2')
            .insert({
              user_id: user.id,
              category: setting.category,
              settings: setting.settings
            })
        }
      }

      console.log('Default settings initialized successfully')
      return true
    } catch (error) {
      console.error('Default settings initialization failed:', error)
      return false
    }
  }

  /**
   * Validate settings structure and fix any issues
   */
  async validateAndFixSettings(): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      const { data: settings, error } = await this.supabase
        .from('user_settings_v2')
        .select('*')
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      let fixedCount = 0

      for (const setting of settings || []) {
        let needsUpdate = false
        const updatedSettings = { ...setting.settings }

        // Validate profile settings
        if (setting.category === 'profile') {
          const requiredFields = ['displayName', 'email', 'timezone', 'language']
          for (const field of requiredFields) {
            if (!updatedSettings[field]) {
              needsUpdate = true
              switch (field) {
                case 'displayName':
                  updatedSettings[field] = user.email?.split('@')[0] || ''
                  break
                case 'email':
                  updatedSettings[field] = user.email || ''
                  break
                case 'timezone':
                  updatedSettings[field] = 'UTC'
                  break
                case 'language':
                  updatedSettings[field] = 'en'
                  break
              }
            }
          }
        }

        // Validate appearance settings
        if (setting.category === 'appearance') {
          const defaults = {
            theme: 'system',
            fontSize: 'medium',
            fontFamily: 'default',
            highContrast: false,
            reducedMotion: false,
            density: 'comfortable'
          }

          for (const [key, defaultValue] of Object.entries(defaults)) {
            if (updatedSettings[key] === undefined || updatedSettings[key] === null) {
              needsUpdate = true
              updatedSettings[key] = defaultValue
            }
          }
        }

        if (needsUpdate) {
          await this.supabase
            .from('user_settings_v2')
            .update({ settings: updatedSettings })
            .eq('id', setting.id)
          fixedCount++
        }
      }

      if (fixedCount > 0) {
        console.log(`Fixed ${fixedCount} settings records`)
      }

      return true
    } catch (error) {
      console.error('Settings validation failed:', error)
      return false
    }
  }

  /**
   * Get settings statistics and health check
   */
  async getSettingsHealth(): Promise<{
    hasProfile: boolean
    hasAppearance: boolean
    hasSecurity: boolean
    hasPrivacy: boolean
    totalCategories: number
    lastUpdated: string | null
  }> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      const { data: settings, error } = await this.supabase
        .from('user_settings_v2')
        .select('category, updated_at')
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      const categories = new Set(settings?.map(s => s.category) || [])
      const lastUpdated = settings?.reduce((latest, setting) => {
        const updatedAt = new Date(setting.updated_at)
        return !latest || updatedAt > latest ? updatedAt : latest
      }, null as Date | null)

      return {
        hasProfile: categories.has('profile'),
        hasAppearance: categories.has('appearance'),
        hasSecurity: categories.has('security'),
        hasPrivacy: categories.has('privacy'),
        totalCategories: categories.size,
        lastUpdated: lastUpdated ? lastUpdated.toISOString() : null
      }
    } catch (error) {
      console.error('Settings health check failed:', error)
      return {
        hasProfile: false,
        hasAppearance: false,
        hasSecurity: false,
        hasPrivacy: false,
        totalCategories: 0,
        lastUpdated: null
      }
    }
  }
}

// Export singleton instance
export const settingsMigrationService = new SettingsMigrationService()