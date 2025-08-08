// src/contexts/ProfileContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { profileService, type UserProfile } from '@/lib/services/profile-service'

interface ProfileContextValue {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  
  // Actions
  updateProfile: (updates: Partial<UserProfile>) => void
  saveProfile: () => Promise<boolean>
  revertChanges: () => void
  refreshProfile: () => Promise<void>
  
  // Utility
  hasChanges: () => boolean
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined)

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}

interface ProfileProviderProps {
  children: ReactNode
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load profile on mount
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      console.log('[PROFILE CONTEXT] ===== LOAD PROFILE START =====')
      setLoading(true)
      setError(null)
      
      console.log('[PROFILE CONTEXT] Calling profileService.getCurrentProfile...')
      let currentProfile = await profileService.getCurrentProfile()
      
      console.log('[PROFILE CONTEXT] Current profile result:', currentProfile ? 'found' : 'null')
      
      // If no profile exists, create a default one
      if (!currentProfile) {
        console.log('[PROFILE CONTEXT] No profile found, attempting to create default...')
        const created = await profileService.createDefaultProfile()
        console.log('[PROFILE CONTEXT] Default profile creation result:', created ? 'success' : 'failed')
        
        if (created) {
          console.log('[PROFILE CONTEXT] Fetching newly created profile...')
          currentProfile = await profileService.getCurrentProfile()
          console.log('[PROFILE CONTEXT] Newly created profile:', currentProfile ? 'found' : 'still null')
        }
      }
      
      if (currentProfile) {
        console.log('[PROFILE CONTEXT] ✅ Setting profile in state:', currentProfile)
        setProfile(currentProfile)
        setOriginalProfile({ ...currentProfile })
        console.log('[PROFILE CONTEXT] ✅ Profile loaded successfully')
      } else {
        console.error('[PROFILE CONTEXT] ❌ Failed to load or create profile')
        setError('Failed to load or create profile')
      }
    } catch (err) {
      console.error('[PROFILE CONTEXT] ❌ Exception during loadProfile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
      console.log('[PROFILE CONTEXT] ===== LOAD PROFILE END =====')
    }
  }

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!profile) return
    
    console.log('[PROFILE CONTEXT] Updating profile with:', updates)
    
    setProfile(prev => {
      if (!prev) return null
      return { ...prev, ...updates }
    })
  }

  const saveProfile = async (): Promise<boolean> => {
    if (!profile) {
      console.error('[PROFILE CONTEXT] No profile to save')
      return false
    }

    try {
      console.log('[PROFILE CONTEXT] Saving profile...')
      
      const success = await profileService.saveProfile(profile)
      
      if (success) {
        console.log('[PROFILE CONTEXT] ✅ Profile saved successfully')
        // Update the original profile to reflect the saved state
        setOriginalProfile({ ...profile })
        return true
      } else {
        console.error('[PROFILE CONTEXT] ❌ Profile save failed')
        return false
      }
    } catch (err) {
      console.error('[PROFILE CONTEXT] Exception during save:', err)
      return false
    }
  }

  const revertChanges = () => {
    if (originalProfile) {
      console.log('[PROFILE CONTEXT] Reverting changes')
      setProfile({ ...originalProfile })
    }
  }

  const refreshProfile = async (): Promise<void> => {
    await loadProfile()
  }

  const hasChanges = (): boolean => {
    if (!profile || !originalProfile) return false
    
    return JSON.stringify(profile) !== JSON.stringify(originalProfile)
  }

  const value: ProfileContextValue = {
    profile,
    loading,
    error,
    updateProfile,
    saveProfile,
    revertChanges,
    refreshProfile,
    hasChanges
  }

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
}