// src/app/(dashboard)/settings/page.tsx
/**
 * Enhanced Settings Page for Quest 6.1 Enterprise-Grade Settings
 * Implements compound component pattern with React Aria accessibility
 */
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Loader2, User, Palette, Shield, Settings as SettingsIcon } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { SettingsSection, SettingsGroup, SettingsDivider } from '@/components/settings/compound/SettingsSection'
import {
  SettingsSwitch,
  SettingsTextInput,
  SettingsSelect,
  SettingsSlider
} from '@/components/settings/compound/SettingsFormControls'
import { SettingsRepository } from '@/lib/repositories/settings-repository'
import { securityFramework, type SecurityContext } from '@/lib/security/security-framework'
import { inputValidator, settingsValidationRules } from '@/lib/security/input-validation'
import type { UserSettings } from '@/types/settings'

export default function EnhancedSettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [securityContext, setSecurityContext] = useState<SecurityContext | null>(null)
  const [hasChanges, setHasChanges] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({})
  const { toast } = useToast()

  const settingsRepo = useMemo(() => new SettingsRepository(), [])

  // Initialize settings and security context
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        // Get security context
        const context = await securityFramework.getSecurityContext()
        if (!context) {
          throw new Error('Failed to establish security context')
        }
        setSecurityContext(context)

        // Get user data from auth
        const { createClient } = await import('@/lib/integrations/supabase/client')
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          throw new Error('Failed to get user information')
        }

        // Load user settings
        const result = await settingsRepo.getUserSettings(context.userId)
        if (result.success && result.data) {
          // Update settings with real user data if email is empty
          const updatedSettings = { ...result.data }
          if (!updatedSettings.profile.personalInfo.email && user.email) {
            updatedSettings.profile.personalInfo.email = user.email
            // Save the updated email to database
            await settingsRepo.updateSettingsSection(
              context.userId, 
              'profile', 
              updatedSettings.profile
            )
          }
          setSettings(updatedSettings)
        } else {
          // Create default settings with user email
          const defaultSettings = await settingsRepo.createDefaultSettings(context.userId, {
            email: user.email || '',
            displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || ''
          })
          if (defaultSettings.success && defaultSettings.data) {
            setSettings(defaultSettings.data)
          } else {
            throw new Error(defaultSettings.error || 'Failed to create default settings')
          }
        }
      } catch (error) {
        toast({
          title: "Failed to load settings",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    initializeSettings()
  }, [toast, settingsRepo])

  // Handle field changes
  const handleFieldChange = useCallback((section: keyof UserSettings, fieldName: string, value: unknown) => {
    if (!settings) return

    setSettings((prev: UserSettings | null) => {
      if (!prev) return prev

      const updatedSettings = { ...prev }
      const sectionData = { ...(updatedSettings[section] as Record<string, unknown>) }

      // Handle nested field updates
      const fieldPath = fieldName.split('.')
      let current: Record<string, unknown> = sectionData

      for (let i = 0; i < fieldPath.length - 1; i++) {
        if (!current[fieldPath[i]]) current[fieldPath[i]] = {}
        current = current[fieldPath[i]] as Record<string, unknown>
      }

      current[fieldPath[fieldPath.length - 1]] = value
      ;(updatedSettings as Record<string, unknown>)[section] = sectionData

      return updatedSettings
    })

    // Mark section as having changes
    setHasChanges(prev => ({ ...prev, [section]: true }))
  }, [settings])

  // Handle field validation
  const handleFieldValidation = useCallback(async (section: keyof UserSettings, fieldName: string, value: unknown) => {
    const rules = settingsValidationRules[section as keyof typeof settingsValidationRules]
    if (!rules) return { valid: true }

    const rule = rules.find(r => r.field === fieldName)
    if (!rule) return { valid: true }

    const result = inputValidator.validateInput({ [fieldName]: value }, [rule])

    // Update errors state
    setErrors(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [fieldName]: result.errors[0] || ''
      }
    }))

    return { valid: result.valid, error: result.errors[0] }
  }, [settingsRepo])

  // Handle section save
  const handleSectionSave = useCallback(async (section: keyof UserSettings) => {
    if (!settings || !securityContext) return

    try {
      const sectionData = settings[section]
      const result = await settingsRepo.updateSettingsSection(
        securityContext.userId,
        section,
        sectionData
      )

      if (result.success) {
        setHasChanges(prev => ({ ...prev, [section]: false }))
        setErrors(prev => ({ ...prev, [section]: {} }))
        toast({
          title: "Settings saved",
          description: `${section} settings have been updated successfully.`
        })
      } else {
        throw new Error(result.error || 'Failed to save settings')
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive"
      })
    }
  }, [settings, securityContext, settingsRepo, toast])

  // Handle section reset
  const handleSectionReset = useCallback(async (section: keyof UserSettings) => {
    if (!securityContext) return

    try {
      const result = await settingsRepo.resetSettingsSection(securityContext.userId, section)
      if (result.success && result.data) {
        setSettings(result.data)
        setHasChanges(prev => ({ ...prev, [section]: false }))
        setErrors(prev => ({ ...prev, [section]: {} }))
      }
    } catch (error) {
      toast({
        title: "Reset failed",
        description: error instanceof Error ? error.message : "Failed to reset settings",
        variant: "destructive"
      })
    }
  }, [securityContext, settingsRepo, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!settings || !securityContext) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Settings Unavailable</h1>
          <p className="text-muted-foreground mt-2">
            Unable to load settings. Please try refreshing the page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <SettingsIcon className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences with enterprise-grade security.
          </p>
        </div>

        <div className="grid gap-6">
          {/* User Profile Settings */}
          <SettingsSection
            title="User Profile"
            description="Manage your personal information and account details"
            icon={<User className="h-5 w-5" />}
            hasChanges={hasChanges.profile}
            errors={errors.profile || {}}
            securityContext={securityContext}
            onSave={() => handleSectionSave('profile')}
            onReset={() => handleSectionReset('profile')}
            onFieldChange={(fieldName, value) => handleFieldChange('profile', fieldName, value)}
            onValidate={(fieldName, value) => handleFieldValidation('profile', fieldName, value)}
          >
            <SettingsGroup title="Basic Information">
              <SettingsTextInput
                name="displayName"
                label="Display Name"
                description="Your name as it appears to other users"
                required
                value={settings.profile.personalInfo.displayName}
                maxLength={100}
                autoComplete="name"
              />

              <SettingsTextInput
                name="email"
                label="Email Address"
                description="Your primary email address for notifications and account recovery"
                required
                type="email"
                value={settings.profile.personalInfo.email}
                autoComplete="email"
              />
            </SettingsGroup>

            <SettingsDivider />

            <SettingsGroup title="Localization">
              <SettingsSelect
                name="timezone"
                label="Timezone"
                description="Your local timezone for date and time display"
                required
                value={settings.profile.personalInfo.timezone}
                options={[
                  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
                  { value: 'America/New_York', label: 'Eastern Time (ET)' },
                  { value: 'America/Chicago', label: 'Central Time (CT)' },
                  { value: 'America/Denver', label: 'Mountain Time (MT)' },
                  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
                  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
                  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
                  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' }
                ]}
              />

              <SettingsSelect
                name="language"
                label="Language"
                description="Interface language preference"
                required
                value={settings.profile.personalInfo.language}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Español' },
                  { value: 'fr', label: 'Français' },
                  { value: 'de', label: 'Deutsch' },
                  { value: 'ja', label: '日本語' },
                  { value: 'zh', label: '中文' }
                ]}
              />
            </SettingsGroup>
          </SettingsSection>

          {/* Appearance Settings */}
          <SettingsSection
            title="Appearance"
            description="Customize the visual appearance and theme of your dashboard"
            icon={<Palette className="h-5 w-5" />}
            hasChanges={hasChanges.appearance}
            errors={errors.appearance || {}}
            securityContext={securityContext}
            onSave={() => handleSectionSave('appearance')}
            onReset={() => handleSectionReset('appearance')}
            onFieldChange={(fieldName, value) => handleFieldChange('appearance', fieldName, value)}
            onValidate={(fieldName, value) => handleFieldValidation('appearance', fieldName, value)}
          >
            <SettingsGroup title="Theme">
              <SettingsSelect
                name="theme.mode"
                label="Theme Mode"
                description="Choose your preferred color theme"
                required
                value={settings.appearance.theme.mode}
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'System' }
                ]}
              />

              <SettingsSwitch
                name="theme.highContrast"
                label="High Contrast"
                description="Increase contrast for better accessibility"
                value={settings.appearance.theme.highContrast}
              />

              <SettingsSwitch
                name="theme.reducedMotion"
                label="Reduced Motion"
                description="Minimize animations and transitions"
                value={settings.appearance.theme.reducedMotion}
              />
            </SettingsGroup>

            <SettingsDivider />

            <SettingsGroup title="Typography">
              <SettingsSelect
                name="typography.fontSize"
                label="Font Size"
                description="Adjust the base font size for better readability"
                required
                value={settings.appearance.typography.fontSize}
                options={[
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                  { value: 'extra-large', label: 'Extra Large' }
                ]}
              />

              <SettingsSelect
                name="typography.fontFamily"
                label="Font Family"
                description="Choose your preferred font family"
                required
                value={settings.appearance.typography.fontFamily}
                options={[
                  { value: 'system', label: 'System Default' },
                  { value: 'orbitron', label: 'Orbitron (Futuristic)' },
                  { value: 'inter', label: 'Inter (Modern)' }
                ]}
              />
            </SettingsGroup>
          </SettingsSection>

          {/* Security Settings */}
          <SettingsSection
            title="Security & Privacy"
            description="Manage your account security and privacy preferences"
            icon={<Shield className="h-5 w-5" />}
            hasChanges={hasChanges.security}
            errors={errors.security || {}}
            securityContext={securityContext}
            onSave={() => handleSectionSave('security')}
            onReset={() => handleSectionReset('security')}
            onFieldChange={(fieldName, value) => handleFieldChange('security', fieldName, value)}
            onValidate={(fieldName, value) => handleFieldValidation('security', fieldName, value)}
          >
            <SettingsGroup title="Authentication">
              <SettingsSwitch
                name="authentication.twoFactorEnabled"
                label="Two-Factor Authentication"
                description="Add an extra layer of security to your account"
                value={settings.security.authentication.twoFactorEnabled}
              />

              <SettingsSlider
                name="authentication.sessionTimeout"
                label="Session Timeout"
                description="Automatically log out after period of inactivity"
                value={[settings.security.authentication.sessionTimeout]}
                min={5}
                max={1440}
                step={5}
                formatValue={(value) => `${value} minutes`}
              />
            </SettingsGroup>

            <SettingsDivider />

            <SettingsGroup title="Privacy">
              <SettingsSwitch
                name="privacy.allowAnalytics"
                label="Analytics"
                description="Help improve the service by sharing anonymous usage data"
                value={settings.security.privacy.allowAnalytics}
              />

              <SettingsSwitch
                name="privacy.allowPersonalization"
                label="Personalization"
                description="Allow personalized recommendations and content"
                value={settings.security.privacy.allowPersonalization}
              />
            </SettingsGroup>
          </SettingsSection>
        </div>
      </div>
    </div>
  )
}