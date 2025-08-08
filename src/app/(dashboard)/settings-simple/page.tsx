// src/app/(dashboard)/settings-simple/page.tsx
"use client"

import * as React from "react"
import { User, Palette } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { useProfile } from "@/contexts/ProfileContext"
import { useAppearance } from "@/contexts/AppearanceContext"
import { SettingsSection, SettingsGroup, SettingsRow, SettingsDivider } from "@/components/settings/compound/SettingsSection"
import { 
  SettingsTextInput, 
  SettingsSwitch, 
  SettingsSelect 
} from "@/components/settings/compound/SettingsFormControls"
import { TIMEZONE_OPTIONS, LANGUAGE_OPTIONS } from "@/lib/utils/locale"
import { LiveTimezoneDisplay } from "@/components/settings/LiveTimezoneDisplay"

export default function SettingsSimplePage() {
  const { setTheme } = useTheme()
  
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    updateProfile,
    saveProfile,
    revertChanges,
    hasChanges: hasProfileChanges
  } = useProfile()

  const {
    settings: appearanceSettings,
    loading: appearanceLoading,
    error: appearanceError,
    updateSettings: updateAppearanceSettings,
    saveSettings: saveAppearanceSettings,
    revertChanges: revertAppearanceChanges,
    hasChanges: hasAppearanceChanges
  } = useAppearance()

  
  // Combined loading and error states
  const loading = profileLoading || appearanceLoading
  const error = profileError || appearanceError

  const handleSaveProfile = async () => {
    console.log('[SETTINGS SIMPLE] Starting profile save operation...')
    const success = await saveProfile()
    
    if (success) {
      toast.success('Profile saved successfully!')
      console.log('[SETTINGS SIMPLE] ✅ Profile save successful')
    } else {
      toast.error('Failed to save profile. Please try again.')
      console.log('[SETTINGS SIMPLE] ❌ Profile save failed')
      throw new Error('Failed to save profile')
    }
  }

  const handleSaveAppearance = async () => {
    console.log('[SETTINGS SIMPLE] Starting appearance save operation...')
    const success = await saveAppearanceSettings()
    
    if (success) {
      toast.success('Appearance settings saved successfully!')
      console.log('[SETTINGS SIMPLE] ✅ Appearance save successful')
    } else {
      toast.error('Failed to save appearance settings. Please try again.')
      console.log('[SETTINGS SIMPLE] ❌ Appearance save failed')
      throw new Error('Failed to save appearance settings')
    }
  }

  const handleRevertProfile = () => {
    revertChanges()
    toast.info('Profile changes reverted')
  }

  const handleRevertAppearance = () => {
    revertAppearanceChanges()
    toast.info('Appearance changes reverted')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No profile found</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* User Profile Section */}
        <SettingsSection
          title="User Profile"
          description="Manage your personal information and account details"
          icon={<User />}
          hasChanges={hasProfileChanges()}
          onSave={handleSaveProfile}
          onReset={handleRevertProfile}
          error={profileError || undefined}
        >
          <SettingsGroup title="Basic Information">
            <SettingsRow>
              <SettingsTextInput
                label="Display Name"
                value={profile.display_name || ''}
                onChange={(value) => updateProfile({ display_name: value })}
                placeholder="Enter your display name"
                description="This is how you'll appear to others"
              />
              
              <SettingsTextInput
                label="Email Address"
                type="email"
                value={profile.email}
                onChange={() => {}} // No-op since it's disabled
                placeholder="your@email.com"
                description="Your primary email address (cannot be changed here)"
                disabled
              />
            </SettingsRow>
            
            <SettingsTextInput
              label="Bio"
              value={profile.bio || ""}
              onChange={(value) => updateProfile({ bio: value })}
              placeholder="Tell us about yourself"
              description="A brief description about you (max 200 characters)"
              maxLength={200}
            />
            
            <SettingsSelect
              label="Team Mode"
              value={profile.team_mode}
              onChange={(value) => updateProfile({ 
                team_mode: value as 'lite' | 'standard' | 'enterprise' 
              })}
              options={[
                { label: "Lite Team - Free", value: "lite" },
                { label: "Standard Team - $29/month", value: "standard" },
                { label: "Enterprise Team - $99/month", value: "enterprise" }
              ]}
              description="Choose your team collaboration level"
            />
          </SettingsGroup>
          
          <SettingsDivider />
          
          <SettingsGroup title="Localization">
            <SettingsRow>
              <SettingsSelect
                label="Timezone"
                value={profile.timezone}
                onChange={(value) => updateProfile({ timezone: value })}
                options={TIMEZONE_OPTIONS.map(tz => ({
                  label: `${tz.label} (${tz.offset})`,
                  value: tz.value
                }))}
                description="Your local timezone for date/time display"
              />
              
              <SettingsSelect
                label="Language"
                value={profile.language}
                onChange={(value) => updateProfile({ language: value })}
                options={LANGUAGE_OPTIONS.map(lang => ({
                  label: `${lang.label} (${lang.nativeName})`,
                  value: lang.value
                }))}
                description="Interface language and locale formatting"
              />
            </SettingsRow>
            
            {/* Live timezone preview */}
            <div className="mt-4 p-3 bg-muted/30 border border-border/50 rounded-lg">
              <div className="text-sm font-medium mb-2">Live Preview:</div>
              <LiveTimezoneDisplay timezone={profile.timezone} />
            </div>
          </SettingsGroup>
        </SettingsSection>

        {/* Appearance Section */}
        <SettingsSection
          title="Appearance"
          description="Customize how the application looks and feels"
          icon={<Palette />}
          hasChanges={hasAppearanceChanges()}
          onSave={handleSaveAppearance}
          onReset={handleRevertAppearance}
          error={appearanceError || undefined}
        >
          {appearanceSettings ? (
            <>
              <SettingsGroup title="Theme">
                <SettingsSelect
                  label="Theme Mode"
                  value={appearanceSettings.theme}
                  onChange={(value) => {
                    setTheme(value as 'light' | 'dark')
                    updateAppearanceSettings({ 
                      theme: value as 'light' | 'dark'
                    })
                  }}
                  options={[
                    { label: "Light", value: "light" },
                    { label: "Dark", value: "dark" }
                  ]}
                  description="Choose your preferred color scheme"
                />
                
                <SettingsRow>
                  <SettingsSwitch
                    label="High Contrast"
                    checked={appearanceSettings.high_contrast}
                    onCheckedChange={(checked) => updateAppearanceSettings({ 
                      high_contrast: checked 
                    })}
                    description="Increase contrast for better visibility"
                  />
                  
                  <SettingsSwitch
                    label="Reduced Motion"
                    checked={appearanceSettings.reduced_motion}
                    onCheckedChange={(checked) => updateAppearanceSettings({ 
                      reduced_motion: checked 
                    })}
                    description="Minimize animations and transitions"
                  />
                </SettingsRow>
              </SettingsGroup>
              
              <SettingsDivider />
              
              <SettingsGroup title="Typography">
                <SettingsRow>
                  <SettingsSelect
                    label="Font Size"
                    value={appearanceSettings.font_size}
                    onChange={(value) => updateAppearanceSettings({ 
                      font_size: value as 'small' | 'medium' | 'large' 
                    })}
                    options={[
                      { label: "Small", value: "small" },
                      { label: "Medium", value: "medium" },
                      { label: "Large", value: "large" }
                    ]}
                    description="Adjust text size"
                  />
                  
                  <SettingsSelect
                    label="Font Family"
                    value={appearanceSettings.font_family}
                    onChange={(value) => updateAppearanceSettings({ 
                      font_family: value as 'default' | 'orbitron' | 'mono' 
                    })}
                    options={[
                      { label: "Default", value: "default" },
                      { label: "Orbitron", value: "orbitron" },
                      { label: "Monospace", value: "mono" }
                    ]}
                    description="Choose font style"
                  />
                </SettingsRow>
              </SettingsGroup>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading appearance settings...</p>
            </div>
          )}
        </SettingsSection>
      </div>
    </div>
  )
}