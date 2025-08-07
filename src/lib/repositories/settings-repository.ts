// src/lib/repositories/settings-repository.ts
/**
 * Settings Repository Implementation for Quest 6.1 Enterprise-Grade Settings
 * Provides specialized data access for user settings with encryption and validation
 */

import { BaseRepository, type RepositoryResult, type QueryOptions } from './base-repository'
import type { UserSettings, SettingsUpdateRequest } from '@/types/settings'
import { z } from 'zod'
import CryptoJS from 'crypto-js'

// Validation schemas
const userProfileSchema = z.object({
  displayName: z.string().min(1).max(100),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  avatar: z.string().optional(),
  timezone: z.string(),
  language: z.string().min(2).max(5),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
  timeFormat: z.enum(['12h', '24h'])
})

const appearanceSchema = z.object({
  theme: z.object({
    mode: z.enum(['light', 'dark', 'system']),
    customColors: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string()
    }).optional(),
    highContrast: z.boolean(),
    reducedMotion: z.boolean()
  }),
  typography: z.object({
    fontSize: z.enum(['small', 'medium', 'large', 'extra-large']),
    fontFamily: z.enum(['system', 'orbitron', 'inter']),
    lineHeight: z.enum(['compact', 'normal', 'relaxed']),
    letterSpacing: z.enum(['tight', 'normal', 'wide'])
  }),
  layout: z.object({
    density: z.enum(['compact', 'comfortable', 'spacious']),
    sidebarCollapsed: z.boolean(),
    showTooltips: z.boolean(),
    animationSpeed: z.enum(['slow', 'normal', 'fast', 'disabled'])
  })
})

const securitySchema = z.object({
  authentication: z.object({
    twoFactorEnabled: z.boolean(),
    twoFactorMethod: z.enum(['totp', 'sms', 'email']),
    sessionTimeout: z.number().min(5).max(1440), // 5 minutes to 24 hours
    requirePasswordChange: z.boolean(),
    passwordChangeInterval: z.number().min(30).max(365) // 30 days to 1 year
  }),
  sessions: z.object({
    maxActiveSessions: z.number().min(1).max(10),
    logoutInactiveSessions: z.boolean(),
    inactivityTimeout: z.number().min(5).max(480), // 5 minutes to 8 hours
    rememberDevice: z.boolean(),
    deviceTrustDuration: z.number().min(1).max(90) // 1 to 90 days
  }),
  privacy: z.object({
    dataRetentionPeriod: z.number().min(30).max(2555), // 30 days to 7 years
    allowAnalytics: z.boolean(),
    allowCrashReporting: z.boolean(),
    allowUsageTracking: z.boolean(),
    allowPersonalization: z.boolean()
  })
})

export interface SettingsRecord {
  id: string
  user_id: string
  settings_data: UserSettings
  encrypted_fields: string[] // List of encrypted field paths
  version: number
  created_at: string
  updated_at: string
}

/**
 * Settings Repository with enterprise-grade security and validation
 */
export class SettingsRepository extends BaseRepository<SettingsRecord & Record<string, unknown>> {
  private encryptionKey: string

  constructor() {
    super('user_settings', {
      cache: {
        ttl: 600, // 10 minutes for settings
        maxSize: 500,
        enabled: true
      },
      retry: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 5000,
        backoffFactor: 2
      },
      enableAuditTrail: true,
      encryptSensitiveData: true
    })

    // Get encryption key from environment
    this.encryptionKey = process.env.SETTINGS_ENCRYPTION_KEY || 'default-key-change-in-production'
  }

  /**
   * Get user settings by user ID
   */
  async getUserSettings(userId: string, options: QueryOptions = {}): Promise<RepositoryResult<UserSettings>> {
    try {
      const { data, error } = await this.supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // Check if table doesn't exist (relation does not exist error)
        if (error.message?.includes('relation') || error.message?.includes('does not exist') || error.code === '42P01') {
          console.log('⚠️  Settings table not yet created, returning default settings')
          const defaultSettings = this.getDefaultSettings(userId)
          return {
            success: true,
            data: defaultSettings,
            timestamp: new Date()
          }
        }
        
        // Check if no record found
        if (error.code !== 'PGRST116') {
          throw error
        }
      }

      if (!data) {
        // Return default settings if none exist
        const defaultSettings = this.getDefaultSettings(userId)
        return {
          success: true,
          data: defaultSettings,
          timestamp: new Date()
        }
      }

      // Decrypt sensitive fields
      const decryptedSettings = await this.decryptSensitiveFields(data.settings_data, data.encrypted_fields || [])

      return {
        success: true,
        data: decryptedSettings as UserSettings,
        timestamp: new Date()
      }
    } catch (error) {
      console.log('ℹ️  Falling back to default settings due to database issue:', error instanceof Error ? error.message : 'Unknown error')
      // Fallback to default settings on any database error
      const defaultSettings = this.getDefaultSettings(userId)
      return {
        success: true,
        data: defaultSettings,
        timestamp: new Date()
      }
    }
  }

  /**
   * Update specific settings section
   */
  async updateSettingsSection<T extends keyof UserSettings>(
    userId: string,
    section: T,
    data: Partial<UserSettings[T]>,
    options: QueryOptions = {}
  ): Promise<RepositoryResult<UserSettings>> {
    try {
      // Get current settings
      const currentResult = await this.getUserSettings(userId, { skipAudit: true })
      if (!currentResult.success) {
        return currentResult
      }

      const currentSettings = currentResult.data!
      
      // Validate the section data
      const validationResult = await this.validateSettingsSection(String(section), data)
      if (!validationResult.valid) {
        return {
          success: false,
          error: `Validation failed: ${validationResult.errors.join(', ')}`,
          timestamp: new Date()
        }
      }

      // Merge with current settings
      const updatedSettings: UserSettings = {
        ...currentSettings,
        [section]: {
          ...(currentSettings[section] as Record<string, unknown>),
          ...data
        },
        metadata: {
          ...currentSettings.metadata,
          lastSync: new Date(),
          version: currentSettings.metadata.version + 1
        }
      }

      try {
        // Encrypt sensitive fields
        const { encryptedData, encryptedFields } = await this.encryptSettingsData(updatedSettings)

        // Update in database
        const { data: updated, error } = await this.supabase
          .from('user_settings')
          .upsert({
            user_id: userId,
            settings_data: encryptedData,
            encrypted_fields: encryptedFields,
            version: updatedSettings.metadata.version,
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) {
          // Check if table doesn't exist
          if (error.message?.includes('relation') || error.message?.includes('does not exist') || error.code === '42P01') {
            console.log('⚠️  Settings table not yet created, settings updated in memory only')
          } else {
            throw error
          }
        } else {
          // Invalidate cache only if database update succeeded
          this.invalidateCache(`user_settings:${userId}`)
        }

        // Audit trail (only if database is available)
        if (this.config.enableAuditTrail && !options.skipAudit && !error) {
          await this.createSettingsAuditEntry(userId, String(section), currentSettings[section as keyof typeof currentSettings], data)
        }

      } catch (dbError) {
        console.log('ℹ️  Database update failed, continuing with in-memory settings:', dbError instanceof Error ? dbError.message : 'Unknown error')
        // Continue even if database update fails - the UI will still work with the updated settings
      }

      return {
        success: true,
        data: updatedSettings,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update settings',
        timestamp: new Date()
      }
    }
  }

  /**
   * Reset settings section to defaults
   */
  async resetSettingsSection(
    userId: string,
    section: keyof UserSettings,
    options: QueryOptions = {}
  ): Promise<RepositoryResult<UserSettings>> {
    const defaultSettings = this.getDefaultSettings(userId)
    return this.updateSettingsSection(userId, section, defaultSettings[section], options)
  }

  /**
   * Export user settings for backup/migration
   */
  async exportUserSettings(userId: string): Promise<RepositoryResult<UserSettings>> {
    const result = await this.getUserSettings(userId, { skipAudit: true })
    if (!result.success) return result

    // Remove sensitive data for export
    const exportData = { ...result.data! }
    if (exportData.security?.authentication) {
      exportData.security.authentication = {
        ...exportData.security.authentication,
        backupCodes: []
      }
    }
    if (exportData.security?.apiAccess?.apiKeys) {
      exportData.security.apiAccess.apiKeys = exportData.security.apiAccess.apiKeys.map((key: Record<string, unknown>) => ({
        id: key.id as string,
        name: key.name as string,
        key: '[REDACTED]',
        permissions: key.permissions as string[],
        lastUsed: key.lastUsed as Date | undefined,
        expiresAt: key.expiresAt as Date | undefined,
        enabled: key.enabled as boolean
      }))
    }

    return {
      success: true,
      data: exportData,
      timestamp: new Date()
    }
  }

  // Implementation of abstract methods
  protected async validateData(data: Partial<SettingsRecord>, operation: 'create' | 'update'): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    if (operation === 'create') {
      if (!data.user_id) errors.push('User ID is required')
      if (!data.settings_data) errors.push('Settings data is required')
    }

    if (data.settings_data) {
      // Validate each settings section
      for (const [section, sectionData] of Object.entries(data.settings_data)) {
        const sectionValidation = await this.validateSettingsSection(section as keyof UserSettings, sectionData)
        if (!sectionValidation.valid) {
          errors.push(...sectionValidation.errors.map(err => `${section}: ${err}`))
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  protected async encryptSensitiveFields(data: Partial<SettingsRecord>): Promise<Partial<SettingsRecord>> {
    if (!data.settings_data) return data

    const { encryptedData, encryptedFields } = await this.encryptSettingsData(data.settings_data)
    
    return {
      ...data,
      settings_data: encryptedData,
      encrypted_fields: encryptedFields
    }
  }

  protected getSensitiveFields(): string[] {
    return [
      'security.authentication.backupCodes',
      'security.apiAccess.apiKeys',
      'integration.externalServices.slack.webhookUrl',
      'integration.externalServices.discord.webhookUrl',
      'integration.externalServices.email.smtpConfig.password',
      'integration.webhooks.inbound',
      'integration.webhooks.outbound'
    ]
  }

  // Private helper methods
  private async validateSettingsSection(section: string, data: unknown): Promise<{ valid: boolean; errors: string[] }> {
    try {
      switch (section) {
        case 'profile':
          userProfileSchema.parse(data)
          break
        case 'appearance':
          appearanceSchema.parse(data)
          break
        case 'security':
          securitySchema.parse(data)
          break
        // Add other section validations as needed
        default:
          // Allow unknown sections for extensibility
          break
      }
      return { valid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)
        }
      }
      return {
        valid: false,
        errors: ['Validation failed']
      }
    }
  }

  private async encryptSettingsData(settings: UserSettings): Promise<{ encryptedData: UserSettings; encryptedFields: string[] }> {
    const encryptedData = JSON.parse(JSON.stringify(settings)) // Deep clone
    const encryptedFields: string[] = []

    for (const fieldPath of this.getSensitiveFields()) {
      const value = this.getNestedValue(encryptedData, fieldPath)
      if (value !== undefined) {
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(value), this.encryptionKey).toString()
        this.setNestedValue(encryptedData, fieldPath, encrypted)
        encryptedFields.push(fieldPath)
      }
    }

    return { encryptedData, encryptedFields }
  }

  private async decryptSensitiveFields(settings: UserSettings, encryptedFields: string[]): Promise<UserSettings> {
    const decryptedData = JSON.parse(JSON.stringify(settings)) // Deep clone

    for (const fieldPath of encryptedFields) {
      const encryptedValue = this.getNestedValue(decryptedData, fieldPath)
      if (typeof encryptedValue === 'string') {
        try {
          const decrypted = CryptoJS.AES.decrypt(encryptedValue, this.encryptionKey).toString(CryptoJS.enc.Utf8)
          const value = JSON.parse(decrypted)
          this.setNestedValue(decryptedData, fieldPath, value)
        } catch (error) {
          console.warn(`Failed to decrypt field ${fieldPath}:`, error)
        }
      }
    }

    return decryptedData
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      return (current as Record<string, unknown>)?.[key]
    }, obj)
  }

  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current: Record<string, unknown>, key: string) => {
      if (!current[key]) current[key] = {}
      return current[key] as Record<string, unknown>
    }, obj)
    target[lastKey] = value
  }

  private getDefaultSettings(userId: string): UserSettings {
    return {
      userId,
      profile: {
        id: 'profile',
        name: 'User Profile',
        description: 'Personal information and preferences',
        enabled: true,
        lastModified: new Date(),
        version: 1,
        personalInfo: {
          firstName: '',
          lastName: '',
          displayName: '',
          email: '',
          phoneNumber: '',
          timezone: 'UTC',
          language: 'en',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h'
        },
        avatar: {
          url: '',
          uploadedAt: new Date(),
          size: 0,
          mimeType: 'image/jpeg'
        },
        contactPreferences: {
          allowEmailContact: true,
          allowPhoneContact: false,
          allowMarketingEmails: false,
          allowProductUpdates: true
        },
        privacy: {
          profileVisibility: 'private',
          showOnlineStatus: false,
          allowDataExport: true,
          allowDataDeletion: true
        }
      },
      appearance: {
        id: 'appearance',
        name: 'Appearance',
        description: 'Visual preferences and theme settings',
        enabled: true,
        lastModified: new Date(),
        version: 1,
        theme: {
          mode: 'system',
          highContrast: false,
          reducedMotion: false
        },
        typography: {
          fontSize: 'medium',
          fontFamily: 'orbitron',
          lineHeight: 'normal',
          letterSpacing: 'normal'
        },
        layout: {
          density: 'comfortable',
          sidebarCollapsed: false,
          showTooltips: true,
          animationSpeed: 'normal'
        },
        accessibility: {
          screenReaderOptimized: false,
          keyboardNavigationEnhanced: false,
          focusIndicatorEnhanced: false,
          colorBlindnessSupport: 'none'
        }
      },
      automation: {
        id: 'automation',
        name: 'Automation',
        description: 'Workflow and automation preferences',
        enabled: true,
        lastModified: new Date(),
        version: 1,
        defaults: {
          autoStart: false,
          retryAttempts: 3,
          retryDelay: 5,
          timeout: 300,
          logLevel: 'info',
          enableTelemetry: true
        },
        execution: {
          maxConcurrentRuns: 5,
          queuePriority: 'fifo',
          resourceLimits: {
            maxMemoryMB: 512,
            maxCpuPercent: 80,
            maxExecutionTime: 3600
          }
        },
        monitoring: {
          enableRealTimeUpdates: true,
          refreshInterval: 30,
          alertThresholds: {
            errorRate: 10,
            responseTime: 5000,
            failureCount: 5
          }
        },
        webhooks: {
          enableStartNotifications: false,
          enableCompletionNotifications: true,
          enableErrorNotifications: true,
          customEndpoints: []
        }
      },
      security: {
        id: 'security',
        name: 'Security',
        description: 'Security and privacy settings',
        enabled: true,
        lastModified: new Date(),
        version: 1,
        authentication: {
          twoFactorEnabled: false,
          twoFactorMethod: 'totp',
          backupCodes: [],
          sessionTimeout: 60,
          requirePasswordChange: false,
          passwordChangeInterval: 90
        },
        sessions: {
          maxActiveSessions: 3,
          logoutInactiveSessions: true,
          inactivityTimeout: 30,
          rememberDevice: false,
          deviceTrustDuration: 30
        },
        privacy: {
          dataRetentionPeriod: 365,
          allowAnalytics: true,
          allowCrashReporting: true,
          allowUsageTracking: false,
          allowPersonalization: true
        },
        apiAccess: {
          enableApiAccess: false,
          apiKeys: [],
          rateLimits: {
            requestsPerMinute: 60,
            requestsPerHour: 1000,
            requestsPerDay: 10000
          }
        }
      },
      integration: {
        id: 'integration',
        name: 'Integration',
        description: 'External service integrations',
        enabled: true,
        lastModified: new Date(),
        version: 1,
        externalServices: {
          slack: {
            enabled: false,
            channels: [],
            notificationTypes: []
          },
          discord: {
            enabled: false,
            channels: [],
            notificationTypes: []
          },
          email: {
            enabled: true,
            templates: {}
          }
        },
        webhooks: {
          inbound: [],
          outbound: []
        },
        apiConnections: []
      },
      notification: {
        id: 'notification',
        name: 'Notification',
        description: 'Notification preferences and settings',
        enabled: true,
        lastModified: new Date(),
        version: 1,
        channels: {
          email: {
            enabled: true,
            address: '',
            verified: false,
            frequency: 'daily'
          },
          mobile: {
            enabled: false,
            pushToken: '',
            quietHours: {
              enabled: false,
              startTime: '22:00',
              endTime: '08:00',
              timezone: 'UTC'
            }
          },
          inApp: {
            enabled: true,
            showDesktopNotifications: true,
            playSound: true,
            soundVolume: 50
          }
        },
        categories: {
          automationEvents: {
            started: false,
            completed: true,
            failed: true,
            stalled: true
          },
          systemEvents: {
            maintenance: true,
            updates: true,
            security: true,
            performance: false
          },
          accountEvents: {
            login: true,
            passwordChange: true,
            profileUpdate: false,
            settingsChange: false
          }
        },
        rules: []
      },
      metadata: {
        version: '1.0.0',
        lastSync: new Date(),
        checksum: ''
      },
      auditTrail: []
    }
  }

  private async createSettingsAuditEntry(
    userId: string,
    section: string,
    oldValue: unknown,
    newValue: unknown
  ): Promise<void> {
    try {
      await this.supabase
        .from('settings_audit_trail')
        .insert({
          user_id: userId,
          section,
          old_value: oldValue,
          new_value: newValue,
          timestamp: new Date().toISOString(),
          ip_address: '', // Would be populated from request context
          user_agent: '' // Would be populated from request context
        })
    } catch (error) {
      console.warn('Failed to create settings audit entry:', error)
    }
  }

  /**
   * Create default settings for a user with personalized data
   */
  async createDefaultSettings(
    userId: string, 
    userData: { email: string; displayName: string }
  ): Promise<RepositoryResult<UserSettings>> {
    try {
      // Get default settings template
      const defaultSettings = this.getDefaultSettings(userId)
      
      // Personalize with user data
      defaultSettings.profile.personalInfo.email = userData.email
      defaultSettings.profile.personalInfo.displayName = userData.displayName
      
      // Insert into database
      const { data, error } = await this.supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          settings_data: defaultSettings,
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data.settings_data as UserSettings,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date()
      }
    }
  }
}
