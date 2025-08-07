// src/types/settings.ts
/**
 * Comprehensive TypeScript interfaces for Quest 6.1 Enterprise-Grade Settings Page
 * Defines all settings categories with proper type safety and validation
 */

// Base interfaces for common patterns
export interface BaseSettingsSection {
  id: string
  name: string
  description: string
  enabled: boolean
  lastModified: Date
  version: number
}

export interface AuditTrail {
  userId: string
  timestamp: Date
  action: 'create' | 'update' | 'delete'
  field: string
  oldValue?: unknown
  newValue?: unknown
  ipAddress?: string
  userAgent?: string
}

// 1. User Profile Settings
export interface UserProfileSettings extends BaseSettingsSection {
  personalInfo: {
    firstName: string
    lastName: string
    displayName: string
    email: string
    phoneNumber?: string
    timezone: string
    language: string
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
    timeFormat: '12h' | '24h'
  }
  avatar: {
    url?: string
    uploadedAt?: Date
    size: number
    mimeType: string
  }
  contactPreferences: {
    allowEmailContact: boolean
    allowPhoneContact: boolean
    allowMarketingEmails: boolean
    allowProductUpdates: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private' | 'team'
    showOnlineStatus: boolean
    allowDataExport: boolean
    allowDataDeletion: boolean
  }
}

// 2. Appearance & Theme Settings
export interface AppearanceSettings extends BaseSettingsSection {
  theme: {
    mode: 'light' | 'dark' | 'system'
    customColors?: {
      primary: string
      secondary: string
      accent: string
    }
    highContrast: boolean
    reducedMotion: boolean
  }
  typography: {
    fontSize: 'small' | 'medium' | 'large' | 'extra-large'
    fontFamily: 'system' | 'orbitron' | 'inter'
    lineHeight: 'compact' | 'normal' | 'relaxed'
    letterSpacing: 'tight' | 'normal' | 'wide'
  }
  layout: {
    density: 'compact' | 'comfortable' | 'spacious'
    sidebarCollapsed: boolean
    showTooltips: boolean
    animationSpeed: 'slow' | 'normal' | 'fast' | 'disabled'
  }
  accessibility: {
    screenReaderOptimized: boolean
    keyboardNavigationEnhanced: boolean
    focusIndicatorEnhanced: boolean
    colorBlindnessSupport: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  }
}

// 3. Automation Settings
export interface AutomationSettings extends BaseSettingsSection {
  defaults: {
    autoStart: boolean
    retryAttempts: number
    retryDelay: number // in seconds
    timeout: number // in seconds
    logLevel: 'error' | 'warn' | 'info' | 'debug'
    enableTelemetry: boolean
  }
  execution: {
    maxConcurrentRuns: number
    queuePriority: 'fifo' | 'lifo' | 'priority'
    resourceLimits: {
      maxMemoryMB: number
      maxCpuPercent: number
      maxExecutionTime: number
    }
  }
  monitoring: {
    enableRealTimeUpdates: boolean
    refreshInterval: number // in seconds
    alertThresholds: {
      errorRate: number // percentage
      responseTime: number // in milliseconds
      failureCount: number
    }
  }
  webhooks: {
    enableStartNotifications: boolean
    enableCompletionNotifications: boolean
    enableErrorNotifications: boolean
    customEndpoints: Array<{
      id: string
      name: string
      url: string
      events: string[]
      headers?: Record<string, string>
      enabled: boolean
    }>
  }
}

// 4. Security & Privacy Settings
export interface SecuritySettings extends BaseSettingsSection {
  authentication: {
    twoFactorEnabled: boolean
    twoFactorMethod: 'totp' | 'sms' | 'email'
    backupCodes: string[]
    sessionTimeout: number // in minutes
    requirePasswordChange: boolean
    passwordChangeInterval: number // in days
  }
  sessions: {
    maxActiveSessions: number
    logoutInactiveSessions: boolean
    inactivityTimeout: number // in minutes
    rememberDevice: boolean
    deviceTrustDuration: number // in days
  }
  privacy: {
    dataRetentionPeriod: number // in days
    allowAnalytics: boolean
    allowCrashReporting: boolean
    allowUsageTracking: boolean
    allowPersonalization: boolean
  }
  apiAccess: {
    enableApiAccess: boolean
    apiKeys: Array<{
      id: string
      name: string
      key: string
      permissions: string[]
      lastUsed?: Date
      expiresAt?: Date
      enabled: boolean
    }>
    rateLimits: {
      requestsPerMinute: number
      requestsPerHour: number
      requestsPerDay: number
    }
  }
}

// 5. Integration Settings
export interface IntegrationSettings extends BaseSettingsSection {
  externalServices: {
    slack: {
      enabled: boolean
      webhookUrl?: string
      channels: string[]
      notificationTypes: string[]
    }
    discord: {
      enabled: boolean
      webhookUrl?: string
      channels: string[]
      notificationTypes: string[]
    }
    email: {
      enabled: boolean
      smtpConfig?: {
        host: string
        port: number
        secure: boolean
        username: string
        password: string // encrypted
      }
      templates: Record<string, string>
    }
  }
  webhooks: {
    inbound: Array<{
      id: string
      name: string
      url: string
      secret: string // encrypted
      events: string[]
      enabled: boolean
      lastTriggered?: Date
    }>
    outbound: Array<{
      id: string
      name: string
      targetUrl: string
      events: string[]
      headers?: Record<string, string>
      retryPolicy: {
        maxRetries: number
        backoffMultiplier: number
        maxBackoffSeconds: number
      }
      enabled: boolean
    }>
  }
  apiConnections: Array<{
    id: string
    name: string
    provider: string
    credentials: Record<string, unknown> // encrypted
    scopes: string[]
    lastSync?: Date
    enabled: boolean
  }>
}

// 6. Notification Settings
export interface NotificationSettings extends BaseSettingsSection {
  channels: {
    email: {
      enabled: boolean
      address: string
      verified: boolean
      frequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
    }
    inApp: {
      enabled: boolean
      showDesktopNotifications: boolean
      playSound: boolean
      soundVolume: number // 0-100
    }
    mobile: {
      enabled: boolean
      pushToken?: string
      quietHours: {
        enabled: boolean
        startTime: string // HH:MM
        endTime: string // HH:MM
        timezone: string
      }
    }
  }
  categories: {
    automationEvents: {
      started: boolean
      completed: boolean
      failed: boolean
      stalled: boolean
    }
    systemEvents: {
      maintenance: boolean
      updates: boolean
      security: boolean
      performance: boolean
    }
    accountEvents: {
      login: boolean
      passwordChange: boolean
      profileUpdate: boolean
      settingsChange: boolean
    }
  }
  rules: Array<{
    id: string
    name: string
    condition: string // JSON query
    actions: Array<{
      type: 'email' | 'inApp' | 'webhook'
      config: Record<string, unknown>
    }>
    enabled: boolean
  }>
}

// Composite settings interface
export interface UserSettings {
  userId: string
  profile: UserProfileSettings
  appearance: AppearanceSettings
  automation: AutomationSettings
  security: SecuritySettings
  integration: IntegrationSettings
  notification: NotificationSettings
  metadata: {
    version: string
    lastSync: Date
    checksum: string
  }
  auditTrail: AuditTrail[]
}

// API response types
export interface SettingsResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  timestamp: Date
}

export interface SettingsUpdateRequest<T = unknown> {
  section: keyof UserSettings
  data: Partial<T>
  validateOnly?: boolean
}

// Validation schemas (for use with zod)
export interface SettingsValidationError {
  field: string
  message: string
  code: string
}

export interface SettingsValidationResult {
  valid: boolean
  errors: SettingsValidationError[]
  warnings: SettingsValidationError[]
}
