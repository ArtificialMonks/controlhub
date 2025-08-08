// src/hooks/useTeamMode.ts
"use client"

import { useProfile } from "@/contexts/ProfileContext"
import { TEAM_MODE_CONFIG, TEAM_MODE_DESCRIPTIONS, type TeamModeFeatures } from "@/lib/team-modes/team-mode-config"

export interface UseTeamModeReturn {
  teamMode: 'lite' | 'standard' | 'enterprise'
  features: TeamModeFeatures
  description: typeof TEAM_MODE_DESCRIPTIONS[keyof typeof TEAM_MODE_DESCRIPTIONS]
  
  // Helper functions
  canUseFeature: (feature: keyof TeamModeFeatures) => boolean
  isAtLimit: (currentCount: number, limitKey: keyof Pick<TeamModeFeatures, 'maxAutomations' | 'maxConcurrentRuns' | 'maxRetryAttempts'>) => boolean
  getUpgradeMessage: (feature: keyof TeamModeFeatures) => string | null
  
  // Specific feature checks
  canCreateAutomation: (currentCount: number) => boolean
  canUseScheduling: () => boolean
  canUseWebhooks: () => boolean
  canUseAdvancedAnalytics: () => boolean
  canUseTwoFactor: () => boolean
  canUseDebugMode: () => boolean
}

export function useTeamMode(): UseTeamModeReturn {
  const { profile } = useProfile()
  const teamMode = profile?.team_mode || 'lite'
  const features = TEAM_MODE_CONFIG[teamMode]
  const description = TEAM_MODE_DESCRIPTIONS[teamMode]

  const canUseFeature = (feature: keyof TeamModeFeatures): boolean => {
    const featureValue = features[feature]
    if (typeof featureValue === 'boolean') {
      return featureValue
    }
    if (typeof featureValue === 'number') {
      return featureValue > 0
    }
    return true
  }

  const isAtLimit = (
    currentCount: number, 
    limitKey: keyof Pick<TeamModeFeatures, 'maxAutomations' | 'maxConcurrentRuns' | 'maxRetryAttempts'>
  ): boolean => {
    const limit = features[limitKey] as number
    if (limit === -1) return false // Unlimited
    return currentCount >= limit
  }

  const getUpgradeMessage = (feature: keyof TeamModeFeatures): string | null => {
    if (canUseFeature(feature)) return null
    
    const upgradeMap: Record<string, string> = {
      schedulingEnabled: "Upgrade to Standard or Enterprise to schedule automations",
      performanceMonitoring: "Upgrade to Standard or Enterprise for performance insights", 
      debugMode: "Upgrade to Enterprise for debug mode access",
      parallelExecution: "Upgrade to Standard or Enterprise for parallel execution",
      pushNotifications: "Upgrade to Standard or Enterprise for push notifications",
      dailyDigest: "Upgrade to Standard or Enterprise for daily digest emails",
      weeklyReport: "Upgrade to Standard or Enterprise for weekly reports",
      twoFactorAuth: "Upgrade to Standard or Enterprise for two-factor authentication",
      auditLogs: "Upgrade to Enterprise for audit log access",
      webhookSupport: "Upgrade to Standard or Enterprise for webhook integration",
      apiAccess: "Upgrade to Standard or Enterprise for API access",
      customIntegrations: "Upgrade to Enterprise for custom integrations",
      customThemes: "Upgrade to Enterprise for custom theme support",
      advancedAnalytics: "Upgrade to Standard or Enterprise for advanced analytics",
      exportData: "Upgrade to Standard or Enterprise to export your data"
    }

    return upgradeMap[feature] || "Upgrade your plan to access this feature"
  }

  const canCreateAutomation = (currentCount: number): boolean => {
    return !isAtLimit(currentCount, 'maxAutomations')
  }

  const canUseScheduling = (): boolean => features.schedulingEnabled
  const canUseWebhooks = (): boolean => features.webhookSupport
  const canUseAdvancedAnalytics = (): boolean => features.advancedAnalytics
  const canUseTwoFactor = (): boolean => features.twoFactorAuth
  const canUseDebugMode = (): boolean => features.debugMode

  return {
    teamMode,
    features,
    description,
    canUseFeature,
    isAtLimit,
    getUpgradeMessage,
    canCreateAutomation,
    canUseScheduling,
    canUseWebhooks,
    canUseAdvancedAnalytics,
    canUseTwoFactor,
    canUseDebugMode
  }
}