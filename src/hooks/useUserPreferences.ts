'use client'

import { useState, useEffect, useCallback } from 'react'

interface UserPreferences {
  drillDownSettings: {
    defaultTimeRange: '7d' | '30d' | '90d'
    visibleColumns: {
      name: boolean
      client: boolean
      status: boolean
      successRate: boolean
      lastRun: boolean
      executions: boolean
    }
    defaultFilters: Array<{ label: string; value: string; selected: boolean }>
  }
  dashboardSettings: {
    refreshInterval: number
    theme: 'light' | 'dark' | 'system'
    compactMode: boolean
  }
}

const DEFAULT_PREFERENCES: UserPreferences = {
  drillDownSettings: {
    defaultTimeRange: '7d',
    visibleColumns: {
      name: true,
      client: true,
      status: true,
      successRate: true,
      lastRun: true,
      executions: true
    },
    defaultFilters: [
      { label: 'Running', value: 'Running', selected: true },
      { label: 'Stopped', value: 'Stopped', selected: true },
      { label: 'Error', value: 'Error', selected: true },
      { label: 'Stalled', value: 'Stalled', selected: true }
    ]
  },
  dashboardSettings: {
    refreshInterval: 30000, // 30 seconds
    theme: 'system',
    compactMode: false
  }
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [isLoading, setIsLoading] = useState(true)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('chub-user-preferences')
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreferences(prev => ({
          ...prev,
          ...parsed
        }))
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save preferences to localStorage
  const savePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    try {
      const updated = {
        ...preferences,
        ...newPreferences
      }
      setPreferences(updated)
      localStorage.setItem('chub-user-preferences', JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save user preferences:', error)
    }
  }, [preferences])

  // Update drill-down settings
  const updateDrillDownSettings = useCallback((settings: Partial<UserPreferences['drillDownSettings']>) => {
    savePreferences({
      drillDownSettings: {
        ...preferences.drillDownSettings,
        ...settings
      }
    })
  }, [preferences.drillDownSettings, savePreferences])

  // Update dashboard settings
  const updateDashboardSettings = useCallback((settings: Partial<UserPreferences['dashboardSettings']>) => {
    savePreferences({
      dashboardSettings: {
        ...preferences.dashboardSettings,
        ...settings
      }
    })
  }, [preferences.dashboardSettings, savePreferences])

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES)
    localStorage.removeItem('chub-user-preferences')
  }, [])

  return {
    preferences,
    isLoading,
    updateDrillDownSettings,
    updateDashboardSettings,
    resetPreferences,
    savePreferences
  }
}