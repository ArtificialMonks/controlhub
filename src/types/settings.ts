// src/types/settings.ts
export interface UserProfileSettings {
  displayName: string
  email: string
  bio?: string
  avatarUrl?: string
  timezone: string
  language: string
  country?: string
  phoneNumber?: string
  teamMode: 'lite' | 'standard' | 'enterprise'
}

export interface AppearanceSettings {
  theme: 'light' | 'dark'
  fontSize: 'small' | 'medium' | 'large'
  fontFamily: 'default' | 'orbitron' | 'mono'
  highContrast: boolean
  reducedMotion: boolean
  colorScheme?: string
  density: 'compact' | 'comfortable' | 'spacious'
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  sessionTimeout: number // in minutes
  loginNotifications: boolean
  apiKeyRotation: boolean
  passwordLastChanged?: Date
  backupCodes?: string[]
  trustedDevices?: string[]
}

export interface PrivacySettings {
  analyticsEnabled: boolean
  personalizationEnabled: boolean
  dataSharing: boolean
  publicProfile: boolean
  activityVisibility: 'public' | 'private' | 'friends'
  searchEngineIndexing: boolean
}

export interface NotificationSettings {
  emailNotifications: boolean
  inAppNotifications: boolean
  pushNotifications: boolean
  automationAlerts: boolean
  systemUpdates: boolean
  marketingEmails: boolean
  dailyDigest: boolean
  weeklyReport: boolean
  notificationFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
}

export interface IntegrationSettings {
  webhookUrl?: string
  apiKeys?: Record<string, string>
  connectedServices?: string[]
  oauthTokens?: Record<string, string>
  syncEnabled: boolean
  autoBackup: boolean
  exportFormat: 'json' | 'csv' | 'xml'
}

export interface AutomationSettings {
  defaultTimeout: number
  retryAttempts: number
  errorHandling: 'stop' | 'continue' | 'rollback'
  parallelExecution: boolean
  maxConcurrentRuns: number
  schedulingEnabled: boolean
  performanceMonitoring: boolean
  debugMode: boolean
}

export interface UserSettings {
  profile: UserProfileSettings
  appearance: AppearanceSettings
  security: SecuritySettings
  privacy: PrivacySettings
  notifications: NotificationSettings
  integrations: IntegrationSettings
  automations: AutomationSettings
  createdAt?: Date
  updatedAt?: Date
  version?: number
}

export interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  icon?: React.ReactNode
  badge?: string
  onSave?: () => Promise<void>
  onReset?: () => void
  hasChanges?: boolean
  isLoading?: boolean
  error?: string
}

export interface SettingsFormControlProps {
  label: string
  description?: string
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export interface SettingsTextInputProps extends SettingsFormControlProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'url' | 'tel'
  maxLength?: number
  pattern?: string
}

export interface SettingsSwitchProps extends SettingsFormControlProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  size?: 'sm' | 'md' | 'lg'
}

export interface SettingsSelectProps extends SettingsFormControlProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
  placeholder?: string
}

export interface SettingsSliderProps extends SettingsFormControlProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min: number
  max: number
  step?: number
  unit?: string
}

export type SettingsCategory = 
  | 'profile'
  | 'appearance'
  | 'security'
  | 'privacy'
  | 'notifications'
  | 'integrations'
  | 'automations'

export interface SettingsUpdatePayload {
  category: SettingsCategory
  data: Partial<UserSettings[SettingsCategory]>
  userId: string
}

export interface SettingsValidationError {
  field: string
  message: string
  code?: string
}

export interface SettingsApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  errors?: SettingsValidationError[]
}