// src/lib/team-modes/team-mode-config.ts

export interface TeamModeFeatures {
  // Automation limits
  maxAutomations: number
  maxConcurrentRuns: number
  maxRetryAttempts: number
  
  // Advanced features
  schedulingEnabled: boolean
  performanceMonitoring: boolean
  debugMode: boolean
  parallelExecution: boolean
  
  // Notification features
  emailNotifications: boolean
  pushNotifications: boolean
  dailyDigest: boolean
  weeklyReport: boolean
  
  // Security features
  twoFactorAuth: boolean
  sessionTimeout: { min: number, max: number }
  auditLogs: boolean
  
  // Integration features
  webhookSupport: boolean
  apiAccess: boolean
  customIntegrations: boolean
  
  // UI features
  darkMode: boolean
  customThemes: boolean
  advancedAnalytics: boolean
  exportData: boolean
  
  // Support level
  supportLevel: 'community' | 'standard' | 'priority'
  documentationAccess: 'basic' | 'full' | 'enterprise'
}

export const TEAM_MODE_CONFIG: Record<'lite' | 'standard' | 'enterprise', TeamModeFeatures> = {
  lite: {
    // Automation limits
    maxAutomations: 5,
    maxConcurrentRuns: 2,
    maxRetryAttempts: 3,
    
    // Advanced features
    schedulingEnabled: false,
    performanceMonitoring: false,
    debugMode: false,
    parallelExecution: false,
    
    // Notification features
    emailNotifications: true,
    pushNotifications: false,
    dailyDigest: false,
    weeklyReport: false,
    
    // Security features
    twoFactorAuth: false,
    sessionTimeout: { min: 15, max: 60 },
    auditLogs: false,
    
    // Integration features
    webhookSupport: false,
    apiAccess: false,
    customIntegrations: false,
    
    // UI features
    darkMode: true,
    customThemes: false,
    advancedAnalytics: false,
    exportData: false,
    
    // Support level
    supportLevel: 'community',
    documentationAccess: 'basic'
  },
  
  standard: {
    // Automation limits
    maxAutomations: 25,
    maxConcurrentRuns: 10,
    maxRetryAttempts: 5,
    
    // Advanced features
    schedulingEnabled: true,
    performanceMonitoring: true,
    debugMode: false,
    parallelExecution: true,
    
    // Notification features
    emailNotifications: true,
    pushNotifications: true,
    dailyDigest: true,
    weeklyReport: true,
    
    // Security features
    twoFactorAuth: true,
    sessionTimeout: { min: 5, max: 120 },
    auditLogs: false,
    
    // Integration features
    webhookSupport: true,
    apiAccess: true,
    customIntegrations: false,
    
    // UI features
    darkMode: true,
    customThemes: false,
    advancedAnalytics: true,
    exportData: true,
    
    // Support level
    supportLevel: 'standard',
    documentationAccess: 'full'
  },
  
  enterprise: {
    // Automation limits
    maxAutomations: -1, // Unlimited
    maxConcurrentRuns: 50,
    maxRetryAttempts: 10,
    
    // Advanced features
    schedulingEnabled: true,
    performanceMonitoring: true,
    debugMode: true,
    parallelExecution: true,
    
    // Notification features
    emailNotifications: true,
    pushNotifications: true,
    dailyDigest: true,
    weeklyReport: true,
    
    // Security features
    twoFactorAuth: true,
    sessionTimeout: { min: 5, max: 240 },
    auditLogs: true,
    
    // Integration features
    webhookSupport: true,
    apiAccess: true,
    customIntegrations: true,
    
    // UI features
    darkMode: true,
    customThemes: true,
    advancedAnalytics: true,
    exportData: true,
    
    // Support level
    supportLevel: 'priority',
    documentationAccess: 'enterprise'
  }
}

export const TEAM_MODE_DESCRIPTIONS = {
  lite: {
    name: 'Lite Team',
    description: 'Perfect for individuals and small teams getting started',
    price: 'Free',
    highlights: [
      'Up to 5 automations',
      'Basic email notifications',
      'Community support',
      'Essential features only'
    ]
  },
  standard: {
    name: 'Standard Team', 
    description: 'Great for growing teams with advanced automation needs',
    price: '$29/month',
    highlights: [
      'Up to 25 automations',
      'Parallel execution',
      'Advanced analytics',
      'Webhook integration',
      'Standard support'
    ]
  },
  enterprise: {
    name: 'Enterprise Team',
    description: 'Full-featured solution for large organizations',
    price: '$99/month',
    highlights: [
      'Unlimited automations', 
      'Custom integrations',
      'Audit logs & security',
      'Debug mode access',
      'Priority support'
    ]
  }
} as const