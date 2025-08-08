// src/contexts/SettingsContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useTheme } from 'next-themes'
import { settingsService } from '@/lib/services/settings'
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

interface SettingsContextValue {
  // Settings state
  profileSettings: UserProfileSettings
  appearanceSettings: AppearanceSettings
  securitySettings: SecuritySettings
  privacySettings: PrivacySettings
  notificationSettings: NotificationSettings
  integrationSettings: IntegrationSettings
  automationSettings: AutomationSettings
  
  // Loading states
  loading: boolean
  
  // Actions
  updateProfileSettings: (settings: Partial<UserProfileSettings>) => void
  updateAppearanceSettings: (settings: Partial<AppearanceSettings>) => void
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void
  updateIntegrationSettings: (settings: Partial<IntegrationSettings>) => void
  updateAutomationSettings: (settings: Partial<AutomationSettings>) => void
  
  // Save actions
  saveProfileSettings: () => Promise<boolean>
  saveAppearanceSettings: () => Promise<boolean>
  saveSecuritySettings: () => Promise<boolean>
  savePrivacySettings: () => Promise<boolean>
  saveNotificationSettings: () => Promise<boolean>
  saveIntegrationSettings: () => Promise<boolean>
  saveAutomationSettings: () => Promise<boolean>
  
  // Utility
  hasUnsavedChanges: () => boolean
  hasProfileChanges: () => boolean
  hasAppearanceChanges: () => boolean
  hasSecurityChanges: () => boolean
  hasPrivacyChanges: () => boolean
  hasNotificationChanges: () => boolean
  hasIntegrationChanges: () => boolean
  hasAutomationChanges: () => boolean
  refreshSettings: () => Promise<void>
  
  // Revert functions
  revertProfileSettings: () => void
  revertAppearanceSettings: () => void
  revertSecuritySettings: () => void
  revertPrivacySettings: () => void
  revertNotificationSettings: () => void
  revertIntegrationSettings: () => void
  revertAutomationSettings: () => void
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { setTheme } = useTheme()
  const supabase = createClient()
  
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
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    inAppNotifications: true,
    pushNotifications: false,
    automationAlerts: true,
    systemUpdates: true,
    marketingEmails: false,
    dailyDigest: false,
    weeklyReport: true,
    notificationFrequency: 'realtime'
  })
  
  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>({
    webhookUrl: '',
    apiKeys: {},
    connectedServices: [],
    oauthTokens: {},
    syncEnabled: true,
    autoBackup: false,
    exportFormat: 'json'
  })
  
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>({
    defaultTimeout: 30,
    retryAttempts: 3,
    errorHandling: 'continue',
    parallelExecution: true,
    maxConcurrentRuns: 10,
    schedulingEnabled: true,
    performanceMonitoring: true,
    debugMode: false
  })
  
  // Original settings for change detection
  const [originalProfileSettings, setOriginalProfileSettings] = useState<UserProfileSettings>(profileSettings)
  const [originalAppearanceSettings, setOriginalAppearanceSettings] = useState<AppearanceSettings>(appearanceSettings)
  const [originalSecuritySettings, setOriginalSecuritySettings] = useState<SecuritySettings>(securitySettings)
  const [originalPrivacySettings, setOriginalPrivacySettings] = useState<PrivacySettings>(privacySettings)
  const [originalNotificationSettings, setOriginalNotificationSettings] = useState<NotificationSettings>(notificationSettings)
  const [originalIntegrationSettings, setOriginalIntegrationSettings] = useState<IntegrationSettings>(integrationSettings)
  const [originalAutomationSettings, setOriginalAutomationSettings] = useState<AutomationSettings>(automationSettings)
  
  const [loading, setLoading] = useState(true)

  // Apply appearance settings to DOM
  useEffect(() => {
    const applyAppearanceSettings = () => {
      const root = document.documentElement
      
      // Skip theme application - let next-themes handle this completely
      // setTheme(appearanceSettings.theme)
      
      // Apply font size
      root.style.setProperty('--font-size-multiplier', 
        appearanceSettings.fontSize === 'small' ? '0.875' :
        appearanceSettings.fontSize === 'large' ? '1.125' : '1'
      )
      
      // Apply font family
      if (appearanceSettings.fontFamily === 'orbitron') {
        root.style.setProperty('--font-family-custom', 'Orbitron, monospace')
      } else if (appearanceSettings.fontFamily === 'mono') {
        root.style.setProperty('--font-family-custom', 'ui-monospace, monospace')
      } else {
        root.style.setProperty('--font-family-custom', 'ui-sans-serif, system-ui, sans-serif')
      }
      
      // Apply high contrast
      if (appearanceSettings.highContrast) {
        root.classList.add('high-contrast')
      } else {
        root.classList.remove('high-contrast')
      }
      
      // Apply reduced motion
      if (appearanceSettings.reducedMotion) {
        root.style.setProperty('--motion-reduce', 'reduce')
        root.classList.add('reduce-motion')
      } else {
        root.style.setProperty('--motion-reduce', 'no-preference')
        root.classList.remove('reduce-motion')
      }
    }
    
    applyAppearanceSettings()
  }, [appearanceSettings, setTheme])

  // Apply security settings (session timeout)
  useEffect(() => {
    const applySecuritySettings = () => {
      // Store session timeout in localStorage for middleware access
      if (typeof window !== 'undefined') {
        localStorage.setItem('sessionTimeout', securitySettings.sessionTimeout.toString())
        
        // Set up session timeout warning
        const timeoutMinutes = securitySettings.sessionTimeout
        const warningTime = Math.max(5, timeoutMinutes - 5) * 60 * 1000 // 5 min before timeout
        
        const sessionWarningTimer = setTimeout(() => {
          if (confirm(`Your session will expire in 5 minutes due to inactivity. Continue session?`)) {
            // Reset the timer by making a simple API call
            fetch('/api/auth/refresh-session', { method: 'POST' })
          }
        }, warningTime)
        
        return () => clearTimeout(sessionWarningTimer)
      }
    }
    
    return applySecuritySettings()
  }, [securitySettings])

  // Apply profile settings (timezone and language)
  useEffect(() => {
    const applyProfileSettings = () => {
      if (typeof window !== 'undefined') {
        // Store timezone for date/time formatting
        localStorage.setItem('userTimezone', profileSettings.timezone)
        
        // Apply language settings to document
        const htmlElement = document.documentElement
        htmlElement.setAttribute('lang', profileSettings.language)
        
        // Store language preference for i18n libraries
        localStorage.setItem('userLanguage', profileSettings.language)
        
        // Update time format displays throughout the app
        const event = new CustomEvent('timezoneChanged', {
          detail: { timezone: profileSettings.timezone }
        })
        window.dispatchEvent(event)
        
        // Update language displays throughout the app
        const langEvent = new CustomEvent('languageChanged', {
          detail: { language: profileSettings.language }
        })
        window.dispatchEvent(langEvent)
      }
    }
    
    applyProfileSettings()
  }, [profileSettings.timezone, profileSettings.language])

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        
        // Get current user directly with session refresh to ensure latest data
        await supabase.auth.refreshSession()
        const { data: { user } } = await supabase.auth.getUser()
        
        const allSettings = await settingsService.getAllSettings()
        
        // Ensure email is always set from current user
        const profileWithEmail = {
          ...allSettings.profile,
          email: user?.email || allSettings.profile.email || ''
        }
        setProfileSettings(profileWithEmail)
        setOriginalProfileSettings(profileWithEmail)
        
        setAppearanceSettings(allSettings.appearance)
        setOriginalAppearanceSettings(allSettings.appearance)
        
        setSecuritySettings(allSettings.security)
        setOriginalSecuritySettings(allSettings.security)
        
        setPrivacySettings(allSettings.privacy)
        setOriginalPrivacySettings(allSettings.privacy)
        
        setNotificationSettings(prev => allSettings.notifications || prev)
        setOriginalNotificationSettings(prev => allSettings.notifications || prev)
        
        setIntegrationSettings(prev => allSettings.integrations || prev)
        setOriginalIntegrationSettings(prev => allSettings.integrations || prev)
        
        setAutomationSettings(prev => allSettings.automations || prev)
        setOriginalAutomationSettings(prev => allSettings.automations || prev)
        
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadSettings()
  }, [supabase.auth])

  // Update functions
  const updateProfileSettings = (updates: Partial<UserProfileSettings>) => {
    setProfileSettings(prev => ({ ...prev, ...updates }))
  }
  
  const updateAppearanceSettings = (updates: Partial<AppearanceSettings>) => {
    setAppearanceSettings(prev => ({ ...prev, ...updates }))
  }
  
  const updateSecuritySettings = (updates: Partial<SecuritySettings>) => {
    setSecuritySettings(prev => ({ ...prev, ...updates }))
  }
  
  const updatePrivacySettings = (updates: Partial<PrivacySettings>) => {
    setPrivacySettings(prev => ({ ...prev, ...updates }))
  }
  
  const updateNotificationSettings = (updates: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({ ...prev, ...updates }))
  }
  
  const updateIntegrationSettings = (updates: Partial<IntegrationSettings>) => {
    setIntegrationSettings(prev => ({ ...prev, ...updates }))
  }
  
  const updateAutomationSettings = (updates: Partial<AutomationSettings>) => {
    setAutomationSettings(prev => ({ ...prev, ...updates }))
  }

  // Save functions
  const saveProfileSettings = async (): Promise<boolean> => {
    const success = await settingsService.saveProfileSettings(profileSettings)
    if (success) {
      setOriginalProfileSettings(profileSettings)
    }
    return success
  }
  
  const saveAppearanceSettings = async (): Promise<boolean> => {
    const success = await settingsService.saveAppearanceSettings(appearanceSettings)
    if (success) {
      setOriginalAppearanceSettings(appearanceSettings)
    }
    return success
  }
  
  const saveSecuritySettings = async (): Promise<boolean> => {
    const success = await settingsService.saveSecuritySettings(securitySettings)
    if (success) {
      setOriginalSecuritySettings(securitySettings)
    }
    return success
  }
  
  const savePrivacySettings = async (): Promise<boolean> => {
    const success = await settingsService.savePrivacySettings(privacySettings)
    if (success) {
      setOriginalPrivacySettings(privacySettings)
    }
    return success
  }
  
  const saveNotificationSettings = async (): Promise<boolean> => {
    const success = await settingsService.saveNotificationSettings(notificationSettings)
    if (success) {
      setOriginalNotificationSettings(notificationSettings)
    }
    return success
  }
  
  const saveIntegrationSettings = async (): Promise<boolean> => {
    const success = await settingsService.saveIntegrationSettings(integrationSettings)
    if (success) {
      setOriginalIntegrationSettings(integrationSettings)
    }
    return success
  }
  
  const saveAutomationSettings = async (): Promise<boolean> => {
    const success = await settingsService.saveAutomationSettings(automationSettings)
    if (success) {
      setOriginalAutomationSettings(automationSettings)
    }
    return success
  }

  // Utility functions
  const hasUnsavedChanges = (): boolean => {
    return (
      JSON.stringify(profileSettings) !== JSON.stringify(originalProfileSettings) ||
      JSON.stringify(appearanceSettings) !== JSON.stringify(originalAppearanceSettings) ||
      JSON.stringify(securitySettings) !== JSON.stringify(originalSecuritySettings) ||
      JSON.stringify(privacySettings) !== JSON.stringify(originalPrivacySettings) ||
      JSON.stringify(notificationSettings) !== JSON.stringify(originalNotificationSettings) ||
      JSON.stringify(integrationSettings) !== JSON.stringify(originalIntegrationSettings) ||
      JSON.stringify(automationSettings) !== JSON.stringify(originalAutomationSettings)
    )
  }

  const hasProfileChanges = (): boolean => {
    return JSON.stringify(profileSettings) !== JSON.stringify(originalProfileSettings)
  }

  const hasAppearanceChanges = (): boolean => {
    return JSON.stringify(appearanceSettings) !== JSON.stringify(originalAppearanceSettings)
  }

  const hasSecurityChanges = (): boolean => {
    return JSON.stringify(securitySettings) !== JSON.stringify(originalSecuritySettings)
  }

  const hasPrivacyChanges = (): boolean => {
    return JSON.stringify(privacySettings) !== JSON.stringify(originalPrivacySettings)
  }
  
  const hasNotificationChanges = (): boolean => {
    return JSON.stringify(notificationSettings) !== JSON.stringify(originalNotificationSettings)
  }
  
  const hasIntegrationChanges = (): boolean => {
    return JSON.stringify(integrationSettings) !== JSON.stringify(originalIntegrationSettings)
  }
  
  const hasAutomationChanges = (): boolean => {
    return JSON.stringify(automationSettings) !== JSON.stringify(originalAutomationSettings)
  }
  
  const refreshSettings = async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser()
    const allSettings = await settingsService.getAllSettings()
    
    // Force reload user data to ensure we have the latest email
    await supabase.auth.refreshSession()
    const { data: { user: refreshedUser } } = await supabase.auth.getUser()
    
    // Ensure email is always set from current user
    const profileWithEmail = {
      ...allSettings.profile,
      email: refreshedUser?.email || user?.email || allSettings.profile.email || ''
    }
    
    setProfileSettings(profileWithEmail)
    setOriginalProfileSettings(profileWithEmail)
    
    setAppearanceSettings(allSettings.appearance)
    setOriginalAppearanceSettings(allSettings.appearance)
    
    setSecuritySettings(allSettings.security)
    setOriginalSecuritySettings(allSettings.security)
    
    setPrivacySettings(allSettings.privacy)
    setOriginalPrivacySettings(allSettings.privacy)
    
    setNotificationSettings(allSettings.notifications || notificationSettings)
    setOriginalNotificationSettings(allSettings.notifications || notificationSettings)
    
    setIntegrationSettings(allSettings.integrations || integrationSettings)
    setOriginalIntegrationSettings(allSettings.integrations || integrationSettings)
    
    setAutomationSettings(allSettings.automations || automationSettings)
    setOriginalAutomationSettings(allSettings.automations || automationSettings)
  }

  // Revert functions - restore to last saved state
  const revertProfileSettings = () => {
    console.log('[SETTINGS CONTEXT] Reverting profile to:', originalProfileSettings)
    setProfileSettings(originalProfileSettings)
  }
  
  const revertAppearanceSettings = () => {
    console.log('[SETTINGS CONTEXT] Reverting appearance to:', originalAppearanceSettings)
    setAppearanceSettings(originalAppearanceSettings)
  }
  
  const revertSecuritySettings = () => {
    console.log('[SETTINGS CONTEXT] Reverting security to:', originalSecuritySettings)
    setSecuritySettings(originalSecuritySettings)
  }
  
  const revertPrivacySettings = () => {
    console.log('[SETTINGS CONTEXT] Reverting privacy to:', originalPrivacySettings)
    setPrivacySettings(originalPrivacySettings)
  }
  
  const revertNotificationSettings = () => {
    console.log('[SETTINGS CONTEXT] Reverting notifications to:', originalNotificationSettings)
    setNotificationSettings(originalNotificationSettings)
  }
  
  const revertIntegrationSettings = () => {
    console.log('[SETTINGS CONTEXT] Reverting integrations to:', originalIntegrationSettings)
    setIntegrationSettings(originalIntegrationSettings)
  }
  
  const revertAutomationSettings = () => {
    console.log('[SETTINGS CONTEXT] Reverting automations to:', originalAutomationSettings)
    setAutomationSettings(originalAutomationSettings)
  }

  const value: SettingsContextValue = {
    profileSettings,
    appearanceSettings,
    securitySettings,
    privacySettings,
    notificationSettings,
    integrationSettings,
    automationSettings,
    loading,
    updateProfileSettings,
    updateAppearanceSettings,
    updateSecuritySettings,
    updatePrivacySettings,
    updateNotificationSettings,
    updateIntegrationSettings,
    updateAutomationSettings,
    saveProfileSettings,
    saveAppearanceSettings,
    saveSecuritySettings,
    savePrivacySettings,
    saveNotificationSettings,
    saveIntegrationSettings,
    saveAutomationSettings,
    hasUnsavedChanges,
    hasProfileChanges,
    hasAppearanceChanges,
    hasSecurityChanges,
    hasPrivacyChanges,
    hasNotificationChanges,
    hasIntegrationChanges,
    hasAutomationChanges,
    refreshSettings,
    revertProfileSettings,
    revertAppearanceSettings,
    revertSecuritySettings,
    revertPrivacySettings,
    revertNotificationSettings,
    revertIntegrationSettings,
    revertAutomationSettings
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}