// src/contexts/AppearanceContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { appearanceService, type UserAppearanceSettings } from '@/lib/services/appearance-service'

interface AppearanceContextValue {
  settings: UserAppearanceSettings | null
  loading: boolean
  error: string | null
  
  // Actions
  updateSettings: (updates: Partial<UserAppearanceSettings>) => void
  saveSettings: () => Promise<boolean>
  revertChanges: () => void
  refreshSettings: () => Promise<void>
  
  // Utility
  hasChanges: () => boolean
}

const AppearanceContext = createContext<AppearanceContextValue | undefined>(undefined)

export function useAppearance() {
  const context = useContext(AppearanceContext)
  if (context === undefined) {
    throw new Error('useAppearance must be used within an AppearanceProvider')
  }
  return context
}

interface AppearanceProviderProps {
  children: ReactNode
}

export function AppearanceProvider({ children }: AppearanceProviderProps) {
  const [settings, setSettings] = useState<UserAppearanceSettings | null>(null)
  const [originalSettings, setOriginalSettings] = useState<UserAppearanceSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      console.log('[APPEARANCE CONTEXT] ===== LOAD SETTINGS START =====')
      setLoading(true)
      setError(null)
      
      console.log('[APPEARANCE CONTEXT] Calling appearanceService.getCurrentSettings...')
      const currentSettings = await appearanceService.getCurrentSettings()
      
      console.log('[APPEARANCE CONTEXT] Current settings result:', currentSettings ? 'found' : 'null')
      
      if (currentSettings) {
        console.log('[APPEARANCE CONTEXT] ✅ Setting settings in state:', currentSettings)
        setSettings(currentSettings)
        setOriginalSettings({ ...currentSettings })
        console.log('[APPEARANCE CONTEXT] ✅ Settings loaded successfully')
      } else {
        console.error('[APPEARANCE CONTEXT] ❌ Failed to load settings')
        setError('Failed to load appearance settings')
      }
    } catch (err) {
      console.error('[APPEARANCE CONTEXT] ❌ Exception during loadSettings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
      console.log('[APPEARANCE CONTEXT] ===== LOAD SETTINGS END =====')
    }
  }

  const updateSettings = (updates: Partial<UserAppearanceSettings>) => {
    if (!settings) return
    
    console.log('[APPEARANCE CONTEXT] Updating settings with:', updates)
    
    setSettings(prev => {
      if (!prev) return null
      return { ...prev, ...updates }
    })
  }

  const saveSettings = async (): Promise<boolean> => {
    if (!settings) {
      console.error('[APPEARANCE CONTEXT] No settings to save')
      return false
    }

    try {
      console.log('[APPEARANCE CONTEXT] Saving settings...')
      
      const success = await appearanceService.saveSettings(settings)
      
      if (success) {
        console.log('[APPEARANCE CONTEXT] ✅ Settings saved successfully')
        // Update the original settings to reflect the saved state
        setOriginalSettings({ ...settings })
        return true
      } else {
        console.error('[APPEARANCE CONTEXT] ❌ Settings save failed')
        return false
      }
    } catch (err) {
      console.error('[APPEARANCE CONTEXT] Exception during save:', err)
      return false
    }
  }

  const revertChanges = () => {
    if (originalSettings) {
      console.log('[APPEARANCE CONTEXT] Reverting changes')
      setSettings({ ...originalSettings })
    }
  }

  const refreshSettings = async (): Promise<void> => {
    await loadSettings()
  }

  const hasChanges = (): boolean => {
    if (!settings || !originalSettings) return false
    
    return JSON.stringify(settings) !== JSON.stringify(originalSettings)
  }

  const value: AppearanceContextValue = {
    settings,
    loading,
    error,
    updateSettings,
    saveSettings,
    revertChanges,
    refreshSettings,
    hasChanges
  }

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  )
}