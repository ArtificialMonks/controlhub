// src/app/(dashboard)/settings/page.tsx
"use client"

import * as React from "react"
import { 
  User, 
  Palette, 
  Shield,
  Bell,
  Plug,
  Cog
} from "lucide-react"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { useTeamMode } from "@/hooks/useTeamMode"

import { SettingsSection, SettingsGroup, SettingsRow, SettingsDivider } from "@/components/settings/compound/SettingsSection"
import { 
  SettingsTextInput, 
  SettingsSwitch, 
  SettingsSelect, 
  SettingsSlider 
} from "@/components/settings/compound/SettingsFormControls"
import { useSettings } from "@/contexts/SettingsContext"
import { TIMEZONE_OPTIONS, LANGUAGE_OPTIONS } from "@/lib/utils/locale"
import { LiveTimezoneDisplay } from "@/components/settings/LiveTimezoneDisplay"
import { TwoFactorAuthSettings } from "@/components/settings/TwoFactorAuthSettings"
import { EmailChangeModal } from "@/components/settings/EmailChangeModal"
import { PasswordChangeModal } from "@/components/settings/PasswordChangeModal"

export default function SettingsPage() {
  const { theme: nextTheme, setTheme } = useTheme()
  const { description: teamModeDescription, features: teamFeatures, canUseFeature, getUpgradeMessage } = useTeamMode()
  const [showEmailChange, setShowEmailChange] = React.useState(false)
  const [showPasswordChange, setShowPasswordChange] = React.useState(false)
  
  const {
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
    hasProfileChanges,
    hasAppearanceChanges,
    hasSecurityChanges,
    hasPrivacyChanges,
    hasNotificationChanges,
    hasIntegrationChanges,
    hasAutomationChanges,
    revertProfileSettings,
    revertAppearanceSettings,
    revertSecuritySettings,
    revertPrivacySettings,
    revertNotificationSettings,
    revertIntegrationSettings,
    revertAutomationSettings
  } = useSettings()

  // Save handlers with proper error handling
  const handleSaveProfile = async () => {
    try {
      console.log('[SETTINGS PAGE] Starting profile save, current settings:', profileSettings)
      const success = await saveProfileSettings()
      console.log('[SETTINGS PAGE] Profile save result:', success)
      if (success) {
        toast.success('Profile settings saved successfully')
      } else {
        toast.error('Failed to save profile settings')
      }
    } catch (error) {
      console.error('[SETTINGS PAGE] Profile save error:', error)
      toast.error('Failed to save profile settings')
      throw error
    }
  }

  const handleSaveAppearance = async () => {
    try {
      console.log('[SETTINGS PAGE] Starting appearance save, current settings:', appearanceSettings)
      const success = await saveAppearanceSettings()
      console.log('[SETTINGS PAGE] Appearance save result:', success)
      if (success) {
        toast.success('Appearance settings saved successfully')
      } else {
        toast.error('Failed to save appearance settings')
      }
    } catch (error) {
      console.error('[SETTINGS PAGE] Appearance save error:', error)
      toast.error('Failed to save appearance settings')
      throw error
    }
  }

  const handleSaveSecurity = async () => {
    try {
      const success = await saveSecuritySettings()
      if (success) {
        toast.success('Security settings saved successfully')
      } else {
        toast.error('Failed to save security settings')
      }
    } catch (error) {
      toast.error('Failed to save security settings')
      throw error
    }
  }

  const handleSavePrivacy = async () => {
    try {
      const success = await savePrivacySettings()
      if (success) {
        toast.success('Privacy settings saved successfully')
      } else {
        toast.error('Failed to save privacy settings')
      }
    } catch (error) {
      toast.error('Failed to save privacy settings')
      throw error
    }
  }

  const handleSaveNotifications = async () => {
    try {
      const success = await saveNotificationSettings()
      if (success) {
        toast.success('Notification settings saved successfully')
      } else {
        toast.error('Failed to save notification settings')
      }
    } catch (error) {
      toast.error('Failed to save notification settings')
      throw error
    }
  }

  const handleSaveIntegrations = async () => {
    try {
      const success = await saveIntegrationSettings()
      if (success) {
        toast.success('Integration settings saved successfully')
      } else {
        toast.error('Failed to save integration settings')
      }
    } catch (error) {
      toast.error('Failed to save integration settings')
      throw error
    }
  }

  const handleSaveAutomations = async () => {
    try {
      const success = await saveAutomationSettings()
      if (success) {
        toast.success('Automation settings saved successfully')
      } else {
        toast.error('Failed to save automation settings')
      }
    } catch (error) {
      toast.error('Failed to save automation settings')
      throw error
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading settings...</p>
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
          onReset={revertProfileSettings}
        >
          <SettingsGroup title="Basic Information">
            <SettingsRow>
              <SettingsTextInput
                label="Display Name"
                value={profileSettings.displayName}
                onChange={(value) => updateProfileSettings({ displayName: value })}
                placeholder="Enter your display name"
                description="This is how you'll appear to others"
              />
              
              <div className="space-y-2">
                <SettingsTextInput
                  label="Email Address"
                  type="email"
                  value={profileSettings.email}
                  onChange={(value) => updateProfileSettings({ email: value })}
                  placeholder="your@email.com"
                  description="Your primary email address"
                  required
                  disabled
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailChange(true)}
                    className="text-xs text-primary hover:text-primary/80 underline"
                  >
                    Change Email Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordChange(true)}
                    className="text-xs text-primary hover:text-primary/80 underline"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </SettingsRow>
            
            <SettingsTextInput
              label="Bio"
              value={profileSettings.bio || ""}
              onChange={(value) => updateProfileSettings({ bio: value })}
              placeholder="Tell us about yourself"
              description="A brief description about you"
              maxLength={200}
            />
            
            <div className="space-y-4">
              <SettingsSelect
                label="Team Mode"
                value={profileSettings.teamMode}
                onChange={(value) => updateProfileSettings({ 
                  teamMode: value as 'lite' | 'standard' | 'enterprise' 
                })}
                options={[
                  { label: "Lite Team - Free", value: "lite" },
                  { label: "Standard Team - $29/month", value: "standard" },
                  { label: "Enterprise Team - $99/month", value: "enterprise" }
                ]}
                description="Choose your team collaboration level"
              />
              
              {/* Current team mode details */}
              <div className="p-4 bg-muted/30 border border-border/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{teamModeDescription.name}</h4>
                  <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {teamModeDescription.price}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{teamModeDescription.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {teamModeDescription.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SettingsGroup>
          
          <SettingsDivider />
          
          <SettingsGroup title="Localization">
            <SettingsRow>
              <SettingsSelect
                label="Timezone"
                value={profileSettings.timezone}
                onChange={(value) => updateProfileSettings({ timezone: value })}
                options={TIMEZONE_OPTIONS.map(tz => ({
                  label: `${tz.label} (${tz.offset})`,
                  value: tz.value
                }))}
                description="Your local timezone for date/time display"
              />
              
              <SettingsSelect
                label="Language"
                value={profileSettings.language}
                onChange={(value) => updateProfileSettings({ language: value })}
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
              <LiveTimezoneDisplay timezone={profileSettings.timezone} />
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
          onReset={revertAppearanceSettings}
        >
          <SettingsGroup title="Theme">
            <SettingsSelect
              label="Theme Mode"
              value={nextTheme || 'light'}
              onChange={(value) => {
                setTheme(value as 'light' | 'dark')
                // Also update settings context to keep it in sync for saving
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
                checked={appearanceSettings.highContrast}
                onCheckedChange={(checked) => updateAppearanceSettings({ 
                  highContrast: checked 
                })}
                description="Increase contrast for better visibility"
              />
              
              <SettingsSwitch
                label="Reduced Motion"
                checked={appearanceSettings.reducedMotion}
                onCheckedChange={(checked) => updateAppearanceSettings({ 
                  reducedMotion: checked 
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
                value={appearanceSettings.fontSize}
                onChange={(value) => updateAppearanceSettings({ 
                  fontSize: value as 'small' | 'medium' | 'large' 
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
                value={appearanceSettings.fontFamily}
                onChange={(value) => updateAppearanceSettings({ 
                  fontFamily: value as 'default' | 'orbitron' | 'mono' 
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
        </SettingsSection>

        {/* Security & Privacy Section */}
        <SettingsSection
          title="Security & Privacy"
          description="Manage your security settings and privacy preferences"
          icon={<Shield />}
          hasChanges={hasSecurityChanges() || hasPrivacyChanges()}
          onSave={async () => {
            if (hasSecurityChanges()) await handleSaveSecurity()
            if (hasPrivacyChanges()) await handleSavePrivacy()
          }}
          onReset={() => {
            revertSecuritySettings()
            revertPrivacySettings()
          }}
        >
          <SettingsGroup title="Authentication">
            {canUseFeature('twoFactorAuth') ? (
              <TwoFactorAuthSettings
                enabled={securitySettings.twoFactorEnabled}
                onToggle={(enabled) => updateSecuritySettings({ twoFactorEnabled: enabled })}
              />
            ) : (
              <div className="p-4 bg-muted/20 border border-dashed border-muted-foreground/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                    <span className="text-xs font-medium">🔒</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground/80">{getUpgradeMessage('twoFactorAuth')}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <SettingsSlider
                label="Session Timeout"
                value={[Math.max(teamFeatures.sessionTimeout.min, Math.min(teamFeatures.sessionTimeout.max, securitySettings.sessionTimeout))]}
                onValueChange={(value) => updateSecuritySettings({ 
                  sessionTimeout: value[0] 
                })}
                min={teamFeatures.sessionTimeout.min}
                max={teamFeatures.sessionTimeout.max}
                step={5}
                unit=" min"
                description={`Automatically log out after period of inactivity (${teamFeatures.sessionTimeout.min}-${teamFeatures.sessionTimeout.max} min for ${teamModeDescription.name})`}
              />
            </div>
          </SettingsGroup>
          
          <SettingsDivider />
          
          <SettingsGroup title="Privacy">
            <SettingsRow>
              <SettingsSwitch
                label="Analytics"
                checked={privacySettings.analyticsEnabled}
                onCheckedChange={(checked) => updatePrivacySettings({ 
                  analyticsEnabled: checked 
                })}
                description="Help improve the app with usage data"
              />
              
              <SettingsSwitch
                label="Personalization"
                checked={privacySettings.personalizationEnabled}
                onCheckedChange={(checked) => updatePrivacySettings({ 
                  personalizationEnabled: checked 
                })}
                description="Get personalized recommendations"
              />
            </SettingsRow>
          </SettingsGroup>
        </SettingsSection>

        {/* Notification Settings Section */}
        <SettingsSection
          title="Notification Settings"
          description="Manage your notification preferences and alert settings"
          icon={<Bell />}
          hasChanges={hasNotificationChanges()}
          onSave={handleSaveNotifications}
          onReset={revertNotificationSettings}
        >
          <SettingsGroup title="Email Notifications">
            <SettingsRow>
              <SettingsSwitch
                label="Email Notifications"
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) => updateNotificationSettings({ 
                  emailNotifications: checked 
                })}
                description="Receive notifications via email"
              />
              
              <SettingsSwitch
                label="Marketing Emails"
                checked={notificationSettings.marketingEmails}
                onCheckedChange={(checked) => updateNotificationSettings({ 
                  marketingEmails: checked 
                })}
                description="Receive promotional and feature announcements"
              />
            </SettingsRow>
            
            <SettingsRow>
              <SettingsSwitch
                label="Daily Digest"
                checked={notificationSettings.dailyDigest}
                onCheckedChange={(checked) => updateNotificationSettings({ 
                  dailyDigest: checked 
                })}
                description="Daily summary of activity and alerts"
              />
              
              <SettingsSwitch
                label="Weekly Report"
                checked={notificationSettings.weeklyReport}
                onCheckedChange={(checked) => updateNotificationSettings({ 
                  weeklyReport: checked 
                })}
                description="Weekly performance and insights report"
              />
            </SettingsRow>
          </SettingsGroup>
          
          <SettingsDivider />
          
          <SettingsGroup title="System Alerts">
            <SettingsRow>
              <SettingsSwitch
                label="In-App Notifications"
                checked={notificationSettings.inAppNotifications}
                onCheckedChange={(checked) => updateNotificationSettings({ 
                  inAppNotifications: checked 
                })}
                description="Show notifications within the application"
              />
              
              <div className="space-y-2">
                <SettingsSwitch
                  label="Push Notifications"
                  checked={canUseFeature('pushNotifications') ? notificationSettings.pushNotifications : false}
                  onCheckedChange={(checked) => updateNotificationSettings({ 
                    pushNotifications: checked 
                  })}
                  description="Browser push notifications when app is closed"
                  disabled={!canUseFeature('pushNotifications')}
                />
                {!canUseFeature('pushNotifications') && (
                  <p className="text-xs text-muted-foreground/70 ml-6">{getUpgradeMessage('pushNotifications')}</p>
                )}
              </div>
            </SettingsRow>
            
            <SettingsRow>
              <SettingsSwitch
                label="Automation Alerts"
                checked={notificationSettings.automationAlerts}
                onCheckedChange={(checked) => updateNotificationSettings({ 
                  automationAlerts: checked 
                })}
                description="Notifications for automation status changes"
              />
              
              <SettingsSwitch
                label="System Updates"
                checked={notificationSettings.systemUpdates}
                onCheckedChange={(checked) => updateNotificationSettings({ 
                  systemUpdates: checked 
                })}
                description="Notifications about system maintenance and updates"
              />
            </SettingsRow>
            
            <SettingsSelect
              label="Notification Frequency"
              value={notificationSettings.notificationFrequency}
              onChange={(value) => updateNotificationSettings({ 
                notificationFrequency: value as 'realtime' | 'hourly' | 'daily' | 'weekly'
              })}
              options={[
                { label: "Real-time", value: "realtime" },
                { label: "Hourly", value: "hourly" },
                { label: "Daily", value: "daily" },
                { label: "Weekly", value: "weekly" }
              ]}
              description="How often to receive non-critical notifications"
            />
          </SettingsGroup>
        </SettingsSection>

        {/* Integration Settings Section */}
        <SettingsSection
          title="Integration Settings"
          description="Manage external service connections and API integrations"
          icon={<Plug />}
          hasChanges={hasIntegrationChanges()}
          onSave={handleSaveIntegrations}
          onReset={revertIntegrationSettings}
        >
          <SettingsGroup title="Webhook Configuration">
            {canUseFeature('webhookSupport') ? (
              <SettingsTextInput
                label="Webhook URL"
                type="url"
                value={integrationSettings.webhookUrl || ''}
                onChange={(value) => updateIntegrationSettings({ webhookUrl: value })}
                placeholder="https://your-domain.com/webhook"
                description="URL to receive automation event notifications"
              />
            ) : (
              <div className="p-4 bg-muted/20 border border-dashed border-muted-foreground/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                    <span className="text-xs font-medium">🔗</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Webhook Integration</p>
                    <p className="text-xs text-muted-foreground/80">{getUpgradeMessage('webhookSupport')}</p>
                  </div>
                </div>
              </div>
            )}
          </SettingsGroup>
          
          <SettingsDivider />
          
          <SettingsGroup title="Synchronization">
            <SettingsRow>
              <SettingsSwitch
                label="Sync Enabled"
                checked={integrationSettings.syncEnabled}
                onCheckedChange={(checked) => updateIntegrationSettings({ 
                  syncEnabled: checked 
                })}
                description="Enable automatic data synchronization"
              />
              
              <SettingsSwitch
                label="Auto Backup"
                checked={integrationSettings.autoBackup}
                onCheckedChange={(checked) => updateIntegrationSettings({ 
                  autoBackup: checked 
                })}
                description="Automatically backup settings and data"
              />
            </SettingsRow>
            
            <SettingsSelect
              label="Export Format"
              value={integrationSettings.exportFormat}
              onChange={(value) => updateIntegrationSettings({ 
                exportFormat: value as 'json' | 'csv' | 'xml'
              })}
              options={[
                { label: "JSON", value: "json" },
                { label: "CSV", value: "csv" },
                { label: "XML", value: "xml" }
              ]}
              description="Default format for data exports"
            />
          </SettingsGroup>
        </SettingsSection>

        {/* Automation Settings Section */}
        <SettingsSection
          title="Automation Settings"
          description="Configure automation behavior and performance preferences"
          icon={<Cog />}
          hasChanges={hasAutomationChanges()}
          onSave={handleSaveAutomations}
          onReset={revertAutomationSettings}
        >
          <SettingsGroup title="Execution Settings">
            <SettingsSlider
              label="Default Timeout"
              value={[automationSettings.defaultTimeout]}
              onValueChange={(value) => updateAutomationSettings({ 
                defaultTimeout: value[0] 
              })}
              min={5}
              max={300}
              step={5}
              unit=" sec"
              description="Maximum time to wait for automation completion"
            />
            
            <SettingsSlider
              label="Retry Attempts"
              value={[Math.min(teamFeatures.maxRetryAttempts, automationSettings.retryAttempts)]}
              onValueChange={(value) => updateAutomationSettings({ 
                retryAttempts: value[0] 
              })}
              min={1}
              max={teamFeatures.maxRetryAttempts}
              step={1}
              unit=" attempts"
              description={`Number of times to retry failed automations (max ${teamFeatures.maxRetryAttempts} for ${teamModeDescription.name})`}
            />
            
            <SettingsSelect
              label="Error Handling"
              value={automationSettings.errorHandling}
              onChange={(value) => updateAutomationSettings({ 
                errorHandling: value as 'stop' | 'continue' | 'rollback'
              })}
              options={[
                { label: "Stop on Error", value: "stop" },
                { label: "Continue on Error", value: "continue" },
                { label: "Rollback on Error", value: "rollback" }
              ]}
              description="How to handle automation errors"
            />
          </SettingsGroup>
          
          <SettingsDivider />
          
          <SettingsGroup title="Performance">
            <SettingsRow>
              <div className="space-y-2">
                <SettingsSwitch
                  label="Parallel Execution"
                  checked={canUseFeature('parallelExecution') ? automationSettings.parallelExecution : false}
                  onCheckedChange={(checked) => updateAutomationSettings({ 
                    parallelExecution: checked 
                  })}
                  description="Allow multiple automations to run simultaneously"
                  disabled={!canUseFeature('parallelExecution')}
                />
                {!canUseFeature('parallelExecution') && (
                  <p className="text-xs text-muted-foreground/70 ml-6">{getUpgradeMessage('parallelExecution')}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <SettingsSwitch
                  label="Performance Monitoring"
                  checked={canUseFeature('performanceMonitoring') ? automationSettings.performanceMonitoring : false}
                  onCheckedChange={(checked) => updateAutomationSettings({ 
                    performanceMonitoring: checked 
                  })}
                  description="Track and analyze automation performance metrics"
                  disabled={!canUseFeature('performanceMonitoring')}
                />
                {!canUseFeature('performanceMonitoring') && (
                  <p className="text-xs text-muted-foreground/70 ml-6">{getUpgradeMessage('performanceMonitoring')}</p>
                )}
              </div>
            </SettingsRow>
            
            <SettingsRow>
              <div className="space-y-2">
                <SettingsSwitch
                  label="Scheduling Enabled"
                  checked={canUseFeature('schedulingEnabled') ? automationSettings.schedulingEnabled : false}
                  onCheckedChange={(checked) => updateAutomationSettings({ 
                    schedulingEnabled: checked 
                  })}
                  description="Enable scheduled automation execution"
                  disabled={!canUseFeature('schedulingEnabled')}
                />
                {!canUseFeature('schedulingEnabled') && (
                  <p className="text-xs text-muted-foreground/70 ml-6">{getUpgradeMessage('schedulingEnabled')}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <SettingsSwitch
                  label="Debug Mode"
                  checked={canUseFeature('debugMode') ? automationSettings.debugMode : false}
                  onCheckedChange={(checked) => updateAutomationSettings({ 
                    debugMode: checked 
                  })}
                  description="Enable detailed logging for troubleshooting"
                  disabled={!canUseFeature('debugMode')}
                />
                {!canUseFeature('debugMode') && (
                  <p className="text-xs text-muted-foreground/70 ml-6">{getUpgradeMessage('debugMode')}</p>
                )}
              </div>
            </SettingsRow>
            
            <SettingsSlider
              label="Max Concurrent Runs"
              value={[Math.min(teamFeatures.maxConcurrentRuns, automationSettings.maxConcurrentRuns)]}
              onValueChange={(value) => updateAutomationSettings({ 
                maxConcurrentRuns: value[0] 
              })}
              min={1}
              max={teamFeatures.maxConcurrentRuns}
              step={1}
              unit=" runs"
              description={`Maximum number of automations running simultaneously (max ${teamFeatures.maxConcurrentRuns} for ${teamModeDescription.name})`}
            />
          </SettingsGroup>
        </SettingsSection>
      </div>

      {/* Modals */}
      <EmailChangeModal
        isOpen={showEmailChange}
        onClose={() => setShowEmailChange(false)}
        currentEmail={profileSettings.email}
      />

      <PasswordChangeModal
        isOpen={showPasswordChange}
        onClose={() => setShowPasswordChange(false)}
        userEmail={profileSettings.email}
      />
    </div>
  )
}