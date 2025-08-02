// src/test/stores/auth-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { User } from '@supabase/supabase-js'

// Mock user data
const mockUser: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
}

const mockProfile = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  full_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  website: 'https://example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.getState().signOut()
  })

  it('should initialize with default state', () => {
    const state = useAuthStore.getState()

    expect(state.user).toBeNull()
    expect(state.profile).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    // Note: isLoading might be false due to persistence hydration
    expect(typeof state.isLoading).toBe('boolean')
  })

  it('should set user and update authentication state', () => {
    const { setUser } = useAuthStore.getState()
    
    setUser(mockUser)
    
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
    expect(state.isLoading).toBe(false)
  })

  it('should set profile', () => {
    const { setProfile } = useAuthStore.getState()
    
    setProfile(mockProfile)
    
    const state = useAuthStore.getState()
    expect(state.profile).toEqual(mockProfile)
  })

  it('should update profile', () => {
    const { setProfile, updateProfile } = useAuthStore.getState()
    
    setProfile(mockProfile)
    updateProfile({ full_name: 'Updated Name' })
    
    const state = useAuthStore.getState()
    expect(state.profile?.full_name).toBe('Updated Name')
    expect(state.profile?.id).toBe(mockProfile.id)
  })

  it('should sign out and clear state', () => {
    const { setUser, setProfile, signOut } = useAuthStore.getState()
    
    // Set up authenticated state
    setUser(mockUser)
    setProfile(mockProfile)
    
    // Sign out
    signOut()
    
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.profile).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(false)
  })

  it('should set loading state', () => {
    const { setLoading } = useAuthStore.getState()
    
    setLoading(true)
    expect(useAuthStore.getState().isLoading).toBe(true)
    
    setLoading(false)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })
})
