// src/lib/services/settings.ts
import { createClient } from '@/lib/integrations/supabase/client'
import type {
  UserProfileSettings,
  AppearanceSettings,
  SecuritySettings,
  PrivacySettings,
  NotificationSettings,
  IntegrationSettings,
  AutomationSettings
} from '@/types/settings'

export type SettingsCategory = 'profile' | 'appearance' | 'security' | 'privacy' | 'notifications' | 'integrations' | 'automations' | 'two_factor_setup'

export interface UserSettingsRecord {
  id: string
  user_id: string
  category: SettingsCategory
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export class SettingsService {
  private supabase = createClient()

  async getUserSettings<T = Record<string, unknown>>(
    category: SettingsCategory
  ): Promise<T | null> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await this.supabase
        .from('user_settings_v2')
        .select('settings')
        .eq('user_id', user.id)
        .eq('category', category)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error
      }

      return data?.settings as T || null
    } catch (error) {
      // Improved error handling for empty error objects
      const errorMessage = error && typeof error === 'object' && 'message' in error ? error.message : String(error)
      console.warn(`Warning fetching ${category} settings (will use defaults):`, errorMessage)
      return null
    }
  }

  async saveUserSettings<T = Record<string, unknown>>(
    category: SettingsCategory,
    settings: T
  ): Promise<boolean> {
    try {
      console.log(`[SETTINGS DEBUG] ===== SAVE OPERATION START =====`)
      console.log(`[SETTINGS DEBUG] Category: ${category}`)
      console.log(`[SETTINGS DEBUG] Settings:`, JSON.stringify(settings, null, 2))
      
      // Check auth status with enhanced debugging
      console.log(`[SETTINGS DEBUG] Checking authentication...`)
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      console.log(`[SETTINGS DEBUG] Auth check result:`)
      console.log(`[SETTINGS DEBUG] - User:`, user ? `${user.id} (${user.email})` : 'null')
      console.log(`[SETTINGS DEBUG] - Auth error:`, authError ? JSON.stringify(authError, null, 2) : 'null')
      
      // Also check session status
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
      console.log(`[SETTINGS DEBUG] Session check:`)
      console.log(`[SETTINGS DEBUG] - Session:`, session ? 'exists' : 'null')
      console.log(`[SETTINGS DEBUG] - Session error:`, sessionError ? JSON.stringify(sessionError, null, 2) : 'null')
      console.log(`[SETTINGS DEBUG] - Access token:`, session?.access_token ? 'present' : 'missing')
      
      if (authError) {
        console.error(`[SETTINGS DEBUG] Auth error:`, authError)
        console.error(`[SETTINGS DEBUG] Auth error details:`, JSON.stringify(authError, null, 2))
        throw new Error(`Authentication failed: ${authError.message || 'Unknown auth error'}`)
      }
      
      if (!user) {
        console.error(`[SETTINGS DEBUG] No user found in auth session`)
        throw new Error('User not authenticated - no user in session')
      }
      
      console.log(`[SETTINGS DEBUG] User authenticated: ${user.id} (${user.email})`)

      const upsertData = {
        user_id: user.id,
        category,
        settings: settings as Record<string, unknown>
      }
      console.log(`[SETTINGS DEBUG] Upsert payload:`, JSON.stringify(upsertData, null, 2))

      // Perform the upsert
      console.log(`[SETTINGS DEBUG] Executing upsert to user_settings_v2...`)
      const { data, error } = await this.supabase
        .from('user_settings_v2')
        .upsert(upsertData, {
          onConflict: 'user_id,category'
        })
        .select()

      console.log(`[SETTINGS DEBUG] Upsert response:`)
      console.log(`[SETTINGS DEBUG] - Data:`, JSON.stringify(data, null, 2))
      console.log(`[SETTINGS DEBUG] - Error:`, error ? JSON.stringify(error, null, 2) : 'null')

      if (error) {
        console.error(`[SETTINGS DEBUG] ===== SAVE FAILED =====`)
        console.error(`[SETTINGS DEBUG] Supabase error object:`, error)
        console.error(`[SETTINGS DEBUG] Error stringified:`, JSON.stringify(error, null, 2))
        
        // Try to extract meaningful error information
        const errorInfo = {
          message: error.message || 'No message',
          code: error.code || 'No code',
          details: error.details || 'No details',
          hint: error.hint || 'No hint',
          status: ('status' in error ? error.status : 'No status') as string | number,
          statusText: ('statusText' in error ? error.statusText : 'No statusText') as string
        }
        console.error(`[SETTINGS DEBUG] Error breakdown:`, errorInfo)
        
        // Check for specific common error patterns
        if (error.code === 'PGRST116') {
          console.error(`[SETTINGS DEBUG] PGRST116 - Row not found error`)
        } else if (error.code === 'PGRST301') {
          console.error(`[SETTINGS DEBUG] PGRST301 - JWT missing error`)
        } else if (error.code === '42501') {
          console.error(`[SETTINGS DEBUG] 42501 - Permission denied error`)
        } else if (error.message?.includes('JWT')) {
          console.error(`[SETTINGS DEBUG] JWT-related authentication error`)
        }
        
        throw error
      }

      console.log(`[SETTINGS DEBUG] ===== SAVE SUCCESSFUL =====`)
      console.log(`[SETTINGS DEBUG] Saved data ID:`, data?.[0]?.id)
      return true
    } catch (error) {
      console.error(`[SETTINGS DEBUG] ===== EXCEPTION CAUGHT =====`)
      console.error(`[SETTINGS DEBUG] Exception type:`, typeof error)
      console.error(`[SETTINGS DEBUG] Exception:`, error)
      
      // Enhanced error serialization
      if (error && typeof error === 'object') {
        console.error(`[SETTINGS DEBUG] Error properties:`, Object.keys(error))
        console.error(`[SETTINGS DEBUG] Full error JSON:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
        
        // Check for specific error patterns
        if ('message' in error) {
          console.error(`[SETTINGS DEBUG] Error message:`, error.message)
        }
        if ('code' in error) {
          console.error(`[SETTINGS DEBUG] Error code:`, error.code)
        }
        if ('details' in error) {
          console.error(`[SETTINGS DEBUG] Error details:`, error.details)
        }
        if ('hint' in error) {
          console.error(`[SETTINGS DEBUG] Error hint:`, error.hint)
        }
        if ('status' in error) {
          console.error(`[SETTINGS DEBUG] HTTP status:`, error.status)
        }
      }
      
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : String(error)
      console.error(`[SETTINGS DEBUG] Final error message for ${category}:`, errorMessage)
      console.error(`[SETTINGS DEBUG] ===== SAVE OPERATION END (FAILED) =====`)
      return false
    }
  }

  async getProfileSettings(): Promise<UserProfileSettings> {
    const settings = await this.getUserSettings<UserProfileSettings>('profile')
    const { data: { user } } = await this.supabase.auth.getUser()
    
    console.log('[PROFILE GET DEBUG] Raw settings from DB:', JSON.stringify(settings, null, 2))
    console.log('[PROFILE GET DEBUG] Bio from DB:', settings?.bio)
    
    // Return defaults merged with saved settings, but always use current auth email
    const defaults = {
      displayName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
      email: user?.email || '', // Always use current auth email
      bio: '',
      avatarUrl: user?.user_metadata?.avatar_url || '',
      timezone: 'UTC',
      language: 'en',
      country: '',
      phoneNumber: '',
      teamMode: 'lite' as const
    }
    
    const merged = {
      ...defaults,
      ...settings,
      email: user?.email || '' // Ensure email is always current auth email
    }
    
    console.log('[PROFILE GET DEBUG] Final merged settings:', JSON.stringify(merged, null, 2))
    console.log('[PROFILE GET DEBUG] Final bio value:', merged.bio)
    
    return merged
  }

  async saveProfileSettings(settings: UserProfileSettings): Promise<boolean> {
    console.log('[PROFILE SETTINGS DEBUG] ===== PROFILE SAVE START =====')
    console.log('[PROFILE SETTINGS DEBUG] Incoming settings:', JSON.stringify(settings, null, 2))
    console.log('[PROFILE SETTINGS DEBUG] Bio value specifically:', settings.bio)
    console.log('[PROFILE SETTINGS DEBUG] Bio type:', typeof settings.bio)
    console.log('[PROFILE SETTINGS DEBUG] Bio length:', settings.bio?.length || 'N/A')
    
    // Try using API endpoint instead of direct Supabase client
    console.log('[PROFILE SETTINGS DEBUG] Attempting save via API endpoint...')
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'profile',
          settings: settings
        })
      })
      
      console.log('[PROFILE SETTINGS DEBUG] API Response status:', response.status)
      const result = await response.json()
      console.log('[PROFILE SETTINGS DEBUG] API Response body:', result)
      
      if (result.success) {
        console.log('[PROFILE SETTINGS DEBUG] ✅ API save successful')
        return true
      } else {
        console.log('[PROFILE SETTINGS DEBUG] ❌ API save failed:', result.error)
        return false
      }
      
    } catch (apiError) {
      console.error('[PROFILE SETTINGS DEBUG] API call failed, falling back to direct Supabase:', apiError)
      
      // Fallback to original method
      const result = await this.saveUserSettings('profile', settings)
      
      console.log('[PROFILE SETTINGS DEBUG] Fallback save result:', result)
      console.log('[PROFILE SETTINGS DEBUG] ===== PROFILE SAVE END =====')
      
      return result
    }
  }

  async getAppearanceSettings(): Promise<AppearanceSettings> {
    const settings = await this.getUserSettings<AppearanceSettings>('appearance')
    
    // Return defaults merged with saved settings
    return {
      theme: 'light' as const,
      fontSize: 'small' as const,
      fontFamily: 'default' as const,
      highContrast: false,
      reducedMotion: false,
      density: 'comfortable' as const,
      ...settings
    }
  }

  async saveAppearanceSettings(settings: AppearanceSettings): Promise<boolean> {
    return this.saveUserSettings('appearance', settings)
  }

  async getSecuritySettings(): Promise<SecuritySettings> {
    const settings = await this.getUserSettings<SecuritySettings>('security')
    
    return {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      loginNotifications: true,
      apiKeyRotation: false,
      ...settings
    }
  }

  async saveSecuritySettings(settings: SecuritySettings): Promise<boolean> {
    return this.saveUserSettings('security', settings)
  }

  async getPrivacySettings(): Promise<PrivacySettings> {
    const settings = await this.getUserSettings<PrivacySettings>('privacy')
    
    return {
      analyticsEnabled: true,
      personalizationEnabled: true,
      dataSharing: false,
      publicProfile: false,
      activityVisibility: 'private' as const,
      searchEngineIndexing: false,
      ...settings
    }
  }

  async savePrivacySettings(settings: PrivacySettings): Promise<boolean> {
    return this.saveUserSettings('privacy', settings)
  }
  
  async getNotificationSettings(): Promise<NotificationSettings> {
    const settings = await this.getUserSettings<NotificationSettings>('notifications')
    
    return {
      emailNotifications: true,
      inAppNotifications: true,
      pushNotifications: false,
      automationAlerts: true,
      systemUpdates: true,
      marketingEmails: false,
      dailyDigest: false,
      weeklyReport: true,
      notificationFrequency: 'realtime' as const,
      ...settings
    }
  }
  
  async saveNotificationSettings(settings: NotificationSettings): Promise<boolean> {
    return this.saveUserSettings('notifications', settings)
  }
  
  async getIntegrationSettings(): Promise<IntegrationSettings> {
    const settings = await this.getUserSettings<IntegrationSettings>('integrations')
    
    return {
      webhookUrl: '',
      apiKeys: {},
      connectedServices: [],
      oauthTokens: {},
      syncEnabled: true,
      autoBackup: false,
      exportFormat: 'json' as const,
      ...settings
    }
  }
  
  async saveIntegrationSettings(settings: IntegrationSettings): Promise<boolean> {
    return this.saveUserSettings('integrations', settings)
  }
  
  async getAutomationSettings(): Promise<AutomationSettings> {
    const settings = await this.getUserSettings<AutomationSettings>('automations')
    
    return {
      defaultTimeout: 30,
      retryAttempts: 3,
      errorHandling: 'continue' as const,
      parallelExecution: true,
      maxConcurrentRuns: 10,
      schedulingEnabled: true,
      performanceMonitoring: true,
      debugMode: false,
      ...settings
    }
  }
  
  async saveAutomationSettings(settings: AutomationSettings): Promise<boolean> {
    return this.saveUserSettings('automations', settings)
  }

  async getAllSettings() {
    const [profile, appearance, security, privacy, notifications, integrations, automations] = await Promise.all([
      this.getProfileSettings(),
      this.getAppearanceSettings(),
      this.getSecuritySettings(),
      this.getPrivacySettings(),
      this.getNotificationSettings(),
      this.getIntegrationSettings(),
      this.getAutomationSettings()
    ])

    return {
      profile,
      appearance,
      security,
      privacy,
      notifications,
      integrations,
      automations
    }
  }
}

// Export singleton instance
export const settingsService = new SettingsService()