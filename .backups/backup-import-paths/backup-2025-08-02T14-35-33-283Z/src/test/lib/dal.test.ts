// src/test/lib/dal.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUser, getProfile, updateProfile } from '@/lib/dal'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
}))

describe('Data Access Layer (DAL)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await getUser()
      
      expect(result).toEqual(mockUser)
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledOnce()
    })

    it('should return null when not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await getUser()
      
      expect(result).toBeNull()
    })

    it('should return null when there is an error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      })

      const result = await getUser()
      
      expect(result).toBeNull()
    })
  })

  describe('getProfile', () => {
    it('should return profile for valid user ID', async () => {
      const mockProfile = {
        id: '123',
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      }

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await getProfile('123')
      
      expect(result).toEqual(mockProfile)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '123')
      expect(mockQuery.single).toHaveBeenCalledOnce()
    })

    it('should return null when profile not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Profile not found' },
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await getProfile('123')
      
      expect(result).toBeNull()
    })
  })

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const mockUpdatedProfile = {
        id: '123',
        full_name: 'Updated Name',
        avatar_url: 'https://example.com/new-avatar.jpg',
      }

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedProfile,
          error: null,
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const updates = {
        full_name: 'Updated Name',
        avatar_url: 'https://example.com/new-avatar.jpg',
      }

      const result = await updateProfile('123', updates)
      
      expect(result).toEqual(mockUpdatedProfile)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockQuery.update).toHaveBeenCalledWith({
        ...updates,
        updated_at: expect.any(String),
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '123')
    })

    it('should return null when update fails', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await updateProfile('123', { full_name: 'Test' })
      
      expect(result).toBeNull()
    })
  })
})
