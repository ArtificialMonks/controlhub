// src/lib/stores/auth-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  website: string | null
  created_at: string
  updated_at: string
}

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => void
  updateProfile: (updates: Partial<Profile>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => {
        set({ 
          user, 
          isAuthenticated: !!user,
          isLoading: false 
        })
      },

      setProfile: (profile) => {
        set({ profile })
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      signOut: () => {
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      updateProfile: (updates) => {
        const currentProfile = get().profile
        if (currentProfile) {
          set({
            profile: {
              ...currentProfile,
              ...updates,
              updated_at: new Date().toISOString(),
            }
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
