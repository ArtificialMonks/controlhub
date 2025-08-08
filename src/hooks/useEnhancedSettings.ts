// src/hooks/useEnhancedSettings.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { settingsService } from '@/lib/services/settings'
import { settingsMigrationService } from '@/lib/services/settings-migration'
import type {
  UserProfileSettings,
  AppearanceSettings,
  SecuritySettings,
  PrivacySettings
} from '@/types/settings'

interface SettingsHealth {
  hasProfile: boolean
  hasAppearance: boolean
  hasSecurity: boolean
  hasPrivacy: boolean
  totalCategories: number
  lastUpdated: string | null
}

interface EnhancedSettingsHook {
  // Settings data
  profileSettings: UserProfileSettings
  appearanceSettings: AppearanceSettings
  securitySettings: SecuritySettings
  privacySettings: PrivacySettings
  
  // Loading and error states
  loading: boolean
  error: string | null
  health: SettingsHealth | null
  
  // Actions
  updateProfileSettings: (settings: Partial<UserProfileSettings>) => void
  updateAppearanceSettings: (settings: Partial<AppearanceSettings>) => void
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void
  
  // Save functions
  saveProfileSettings: () => Promise<boolean>
  saveAppearanceSettings: () => Promise<boolean>
  saveSecuritySettings: () => Promise<boolean>
  savePrivacySettings: () => Promise<boolean>
  saveAllSettings: () => Promise<boolean>
  
  // Utility functions
  hasUnsavedChanges: () => boolean
  hasProfileChanges: () => boolean
  hasAppearanceChanges: () => boolean
  hasSecurityChanges: () => boolean
  hasPrivacyChanges: () => boolean
  refreshSettings: () => Promise<void>
  
  // Migration and health
  initializeDefaults: () => Promise<boolean>
  migrateLegacySettings: () => Promise<boolean>
  checkHealth: () => Promise<void>
  validateAndFix: () => Promise<boolean>
}

export function useEnhancedSettings(): EnhancedSettingsHook {
  // Settings state
  const [profileSettings, setProfileSettings] = useState<UserProfileSettings>({
    displayName: '',
    email: '',
    bio: '',
    avatarUrl: '',
    timezone: 'UTC',
    language: 'en',
    country: '',
    phoneNumber: '',
    teamMode: 'lite'
  })
  
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: 'light',
    fontSize: 'small',
    fontFamily: 'default',
    highContrast: false,
    reducedMotion: false,
    density: 'comfortable'
  })
  
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginNotifications: true,
    apiKeyRotation: false
  })
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    analyticsEnabled: true,
    personalizationEnabled: true,
    dataSharing: false,
    publicProfile: false,
    activityVisibility: 'private',
    searchEngineIndexing: false
  })
  
  // Original settings for change detection
  const [originalProfileSettings, setOriginalProfileSettings] = useState<UserProfileSettings>(profileSettings)
  const [originalAppearanceSettings, setOriginalAppearanceSettings] = useState<AppearanceSettings>(appearanceSettings)
  const [originalSecuritySettings, setOriginalSecuritySettings] = useState<SecuritySettings>(securitySettings)
  const [originalPrivacySettings, setOriginalPrivacySettings] = useState<PrivacySettings>(privacySettings)
  
  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<SettingsHealth | null>(null)

  // Load settings on mount with enhanced error handling
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // First check health
        const healthStatus = await settingsMigrationService.getSettingsHealth()
        setHealth(healthStatus)
        
        // If no settings exist, initialize defaults
        if (healthStatus.totalCategories === 0) {
          await settingsMigrationService.initializeDefaultSettings()
        }
        
        // Load all settings
        const allSettings = await settingsService.getAllSettings()
        
        setProfileSettings(allSettings.profile)
        setOriginalProfileSettings(allSettings.profile)
        
        setAppearanceSettings(allSettings.appearance)
        setOriginalAppearanceSettings(allSettings.appearance)
        
        setSecuritySettings(allSettings.security)
        setOriginalSecuritySettings(allSettings.security)
        
        setPrivacySettings(allSettings.privacy)
        setOriginalPrivacySettings(allSettings.privacy)
        
      } catch (err) {
        console.error('Failed to load settings:', err)
        setError('Failed to load settings. Please try refreshing the page.')
      } finally {
        setLoading(false)
      }
    }
    
    loadSettings()
  }, [])

  // Update functions
  const updateProfileSettings = useCallback((updates: Partial<UserProfileSettings>) => {
    setProfileSettings(prev => ({ ...prev, ...updates }))
  }, [])
  
  const updateAppearanceSettings = useCallback((updates: Partial<AppearanceSettings>) => {
    setAppearanceSettings(prev => ({ ...prev, ...updates }))
  }, [])
  
  const updateSecuritySettings = useCallback((updates: Partial<SecuritySettings>) => {
    setSecuritySettings(prev => ({ ...prev, ...updates }))
  }, [])
  
  const updatePrivacySettings = useCallback((updates: Partial<PrivacySettings>) => {
    setPrivacySettings(prev => ({ ...prev, ...updates }))
  }, [])

  // Save functions with enhanced error handling
  const saveProfileSettings = useCallback(async (): Promise<boolean> => {
    try {
      const success = await settingsService.saveProfileSettings(profileSettings)
      if (success) {
        setOriginalProfileSettings(profileSettings)
      } else {
        setError('Failed to save profile settings')
      }
      return success
    } catch (err) {
      console.error('Error saving profile settings:', err)
      setError('Failed to save profile settings')
      return false
    }
  }, [profileSettings])
  
  const saveAppearanceSettings = useCallback(async (): Promise<boolean> => {
    try {
      const success = await settingsService.saveAppearanceSettings(appearanceSettings)
      if (success) {
        setOriginalAppearanceSettings(appearanceSettings)
      } else {
        setError('Failed to save appearance settings')
      }
      return success
    } catch (err) {
      console.error('Error saving appearance settings:', err)
      setError('Failed to save appearance settings')
      return false
    }
  }, [appearanceSettings])
  
  const saveSecuritySettings = useCallback(async (): Promise<boolean> => {
    try {
      const success = await settingsService.saveSecuritySettings(securitySettings)
      if (success) {
        setOriginalSecuritySettings(securitySettings)
      } else {
        setError('Failed to save security settings')
      }
      return success
    } catch (err) {
      console.error('Error saving security settings:', err)
      setError('Failed to save security settings')
      return false
    }
  }, [securitySettings])
  
  const savePrivacySettings = useCallback(async (): Promise<boolean> => {
    try {
      const success = await settingsService.savePrivacySettings(privacySettings)
      if (success) {
        setOriginalPrivacySettings(privacySettings)
      } else {
        setError('Failed to save privacy settings')
      }
      return success
    } catch (err) {
      console.error('Error saving privacy settings:', err)
      setError('Failed to save privacy settings')
      return false
    }
  }, [privacySettings])

  // Utility functions
  const hasProfileChanges = useCallback((): boolean => {
    return JSON.stringify(profileSettings) !== JSON.stringify(originalProfileSettings)
  }, [profileSettings, originalProfileSettings])

  const hasAppearanceChanges = useCallback((): boolean => {
    return JSON.stringify(appearanceSettings) !== JSON.stringify(originalAppearanceSettings)
  }, [appearanceSettings, originalAppearanceSettings])

  const hasSecurityChanges = useCallback((): boolean => {
    return JSON.stringify(securitySettings) !== JSON.stringify(originalSecuritySettings)
  }, [securitySettings, originalSecuritySettings])

  const hasPrivacyChanges = useCallback((): boolean => {
    return JSON.stringify(privacySettings) !== JSON.stringify(originalPrivacySettings)
  }, [privacySettings, originalPrivacySettings])

  // Save all settings
  const saveAllSettings = useCallback(async (): Promise<boolean> => {
    try {
      const results = await Promise.all([
        hasProfileChanges() ? saveProfileSettings() : Promise.resolve(true),
        hasAppearanceChanges() ? saveAppearanceSettings() : Promise.resolve(true),
        hasSecurityChanges() ? saveSecuritySettings() : Promise.resolve(true),
        hasPrivacyChanges() ? savePrivacySettings() : Promise.resolve(true)
      ])
      
      const allSuccessful = results.every(result => result)
      if (!allSuccessful) {
        setError('Some settings failed to save')
      }
      return allSuccessful
    } catch (err) {
      console.error('Error saving all settings:', err)
      setError('Failed to save settings')
      return false
    }
  }, [saveProfileSettings, saveAppearanceSettings, saveSecuritySettings, savePrivacySettings, hasProfileChanges, hasAppearanceChanges, hasSecurityChanges, hasPrivacyChanges])

  // Additional utility function
  const hasUnsavedChanges = useCallback((): boolean => {
    return hasProfileChanges() || hasAppearanceChanges() || hasSecurityChanges() || hasPrivacyChanges()
  }, [hasProfileChanges, hasAppearanceChanges, hasSecurityChanges, hasPrivacyChanges])

  
  // Refresh all settings
  const refreshSettings = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const allSettings = await settingsService.getAllSettings()
      
      setProfileSettings(allSettings.profile)
      setOriginalProfileSettings(allSettings.profile)
      
      setAppearanceSettings(allSettings.appearance)
      setOriginalAppearanceSettings(allSettings.appearance)
      
      setSecuritySettings(allSettings.security)
      setOriginalSecuritySettings(allSettings.security)
      
      setPrivacySettings(allSettings.privacy)
      setOriginalPrivacySettings(allSettings.privacy)
    } catch (err) {
      console.error('Error refreshing settings:', err)
      setError('Failed to refresh settings')
    } finally {
      setLoading(false)
    }
  }, [])

  // Health check function
  const checkHealth = useCallback(async (): Promise<void> => {
    try {
      const healthStatus = await settingsMigrationService.getSettingsHealth()
      setHealth(healthStatus)
    } catch (err) {
      console.error('Error checking settings health:', err)
    }
  }, [])

  // Migration and health functions
  const initializeDefaults = useCallback(async (): Promise<boolean> => {
    try {
      const success = await settingsMigrationService.initializeDefaultSettings()
      if (success) {
        await refreshSettings()
        await checkHealth()
      }
      return success
    } catch (err) {
      console.error('Error initializing defaults:', err)
      return false
    }
  }, [refreshSettings, checkHealth])

  const migrateLegacySettings = useCallback(async (): Promise<boolean> => {
    try {
      const success = await settingsMigrationService.migrateLegacySettings()
      if (success) {
        await refreshSettings()
        await checkHealth()
      }
      return success
    } catch (err) {
      console.error('Error migrating settings:', err)
      return false
    }
  }, [refreshSettings, checkHealth])


  const validateAndFix = useCallback(async (): Promise<boolean> => {
    try {
      const success = await settingsMigrationService.validateAndFixSettings()
      if (success) {
        await refreshSettings()
        await checkHealth()
      }
      return success
    } catch (err) {
      console.error('Error validating settings:', err)
      return false
    }
  }, [refreshSettings, checkHealth])

  return {
    // Settings data
    profileSettings,
    appearanceSettings,
    securitySettings,
    privacySettings,
    
    // Loading and error states
    loading,
    error,
    health,
    
    // Actions
    updateProfileSettings,
    updateAppearanceSettings,
    updateSecuritySettings,
    updatePrivacySettings,
    
    // Save functions
    saveProfileSettings,
    saveAppearanceSettings,
    saveSecuritySettings,
    savePrivacySettings,
    saveAllSettings,
    
    // Utility functions
    hasUnsavedChanges,
    hasProfileChanges,
    hasAppearanceChanges,
    hasSecurityChanges,
    hasPrivacyChanges,
    refreshSettings,
    
    // Migration and health
    initializeDefaults,
    migrateLegacySettings,
    checkHealth,
    validateAndFix
  }
}