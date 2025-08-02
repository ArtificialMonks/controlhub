// src/app/api/automations/__tests__/route.test.ts
/**
 * Integration tests for /api/automations route
 * Quest 1.5: Real-Time Data Display - API route testing
 * Quality Expert validated comprehensive test coverage
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, OPTIONS } from '../route'

// Mock dependencies
vi.mock('@/lib/dal', () => ({
  verifySession: vi.fn()
}))

vi.mock('@/lib/repositories/automation-repository', () => ({
  AutomationRepository: vi.fn().mockImplementation(() => ({
    getAllAutomations: vi.fn()
  }))
}))

import { verifySession } from '@/lib/dal'
import { AutomationRepository } from '@/lib/repositories/automation-repository'

describe('/api/automations route', () => {
  let mockVerifySession: Mock
  let mockGetAllAutomations: Mock
  let mockRequest: NextRequest

  beforeEach(() => {
    mockVerifySession = verifySession as Mock
    mockGetAllAutomations = vi.fn()
    
    // Mock AutomationRepository constructor
    ;(AutomationRepository as Mock).mockImplementation(() => ({
      getAllAutomations: mockGetAllAutomations
    }))

    // Mock NextRequest
    mockRequest = {
      headers: new Headers({
        'user-agent': 'test-agent',
        'x-forwarded-for': '127.0.0.1'
      })
    } as NextRequest

    vi.clearAllMocks()
  })

  describe('GET /api/automations', () => {
    describe('Successful requests', () => {
      it('should return automations for authenticated user', async () => {
        // Arrange
        const mockSession = { id: 'user-123' }
        const mockAutomations = [
          {
            id: 'auto-1',
            user_id: 'user-123',
            name: 'Test Automation',
            status: 'Running'
          }
        ]

        mockVerifySession.mockResolvedValue(mockSession)
        mockGetAllAutomations.mockResolvedValue(mockAutomations)

        // Act
        const response = await GET(mockRequest)
        const responseData = await response.json()

        // Assert
        expect(response.status).toBe(200)
        expect(responseData).toEqual(mockAutomations)
        expect(mockVerifySession).toHaveBeenCalledOnce()
        expect(mockGetAllAutomations).toHaveBeenCalledWith('user-123')
      })

      it('should include proper caching headers', async () => {
        // Arrange
        const mockSession = { id: 'user-123' }
        const mockAutomations = []

        mockVerifySession.mockResolvedValue(mockSession)
        mockGetAllAutomations.mockResolvedValue(mockAutomations)

        // Act
        const response = await GET(mockRequest)

        // Assert
        expect(response.headers.get('Cache-Control')).toBe('private, max-age=60, must-revalidate')
        expect(response.headers.get('Content-Type')).toBe('application/json')
        expect(response.headers.get('X-Total-Count')).toBe('0')
      })

      it('should include total count header', async () => {
        // Arrange
        const mockSession = { id: 'user-123' }
        const mockAutomations = [
          { id: 'auto-1', user_id: 'user-123' },
          { id: 'auto-2', user_id: 'user-123' }
        ]

        mockVerifySession.mockResolvedValue(mockSession)
        mockGetAllAutomations.mockResolvedValue(mockAutomations)

        // Act
        const response = await GET(mockRequest)

        // Assert
        expect(response.headers.get('X-Total-Count')).toBe('2')
      })
    })

    describe('Authentication failures', () => {
      it('should return 401 for missing session', async () => {
        // Arrange
        mockVerifySession.mockResolvedValue(null)

        // Act
        const response = await GET(mockRequest)
        const responseData = await response.json()

        // Assert
        expect(response.status).toBe(401)
        expect(responseData.error).toBe('Unauthorized')
        expect(responseData.message).toBe('Valid session required to access automations')
        expect(mockGetAllAutomations).not.toHaveBeenCalled()
      })

      it('should return 401 for session without user ID', async () => {
        // Arrange
        mockVerifySession.mockResolvedValue({}) // Session without id

        // Act
        const response = await GET(mockRequest)
        const responseData = await response.json()

        // Assert
        expect(response.status).toBe(401)
        expect(responseData.error).toBe('Unauthorized')
        expect(mockGetAllAutomations).not.toHaveBeenCalled()
      })
    })

    describe('Repository errors', () => {
      it('should return 500 for repository errors', async () => {
        // Arrange
        const mockSession = { id: 'user-123' }
        mockVerifySession.mockResolvedValue(mockSession)
        mockGetAllAutomations.mockRejectedValue(new Error('Database error'))

        // Act
        const response = await GET(mockRequest)
        const responseData = await response.json()

        // Assert
        expect(response.status).toBe(500)
        expect(responseData.error).toBe('Internal Server Error')
        expect(responseData.message).toBe('Failed to fetch automations. Please try again later.')
      })

      it('should not expose internal error details', async () => {
        // Arrange
        const mockSession = { id: 'user-123' }
        mockVerifySession.mockResolvedValue(mockSession)
        mockGetAllAutomations.mockRejectedValue(new Error('Sensitive database connection string exposed'))

        // Act
        const response = await GET(mockRequest)
        const responseData = await response.json()

        // Assert
        expect(response.status).toBe(500)
        expect(responseData.message).not.toContain('Sensitive database connection string')
        expect(responseData.message).toBe('Failed to fetch automations. Please try again later.')
      })
    })

    describe('Error logging', () => {
      it('should log errors with context', async () => {
        // Arrange
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const mockSession = { id: 'user-123' }
        const testError = new Error('Test error')
        
        mockVerifySession.mockResolvedValue(mockSession)
        mockGetAllAutomations.mockRejectedValue(testError)

        // Act
        await GET(mockRequest)

        // Assert
        expect(consoleSpy).toHaveBeenCalledWith('API Error - /api/automations:', {
          error: 'Test error',
          timestamp: expect.any(String),
          userAgent: 'test-agent',
          ip: '127.0.0.1'
        })

        consoleSpy.mockRestore()
      })
    })
  })

  describe('OPTIONS /api/automations', () => {
    it('should return proper CORS headers', async () => {
      // Act
      const response = await OPTIONS()
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData).toEqual({})
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization')
    })
  })

  describe('Request handling', () => {
    it('should handle requests with missing headers gracefully', async () => {
      // Arrange
      const requestWithoutHeaders = {
        headers: new Headers()
      } as NextRequest

      const mockSession = { id: 'user-123' }
      mockVerifySession.mockResolvedValue(mockSession)
      mockGetAllAutomations.mockRejectedValue(new Error('Test error'))

      // Spy on console.error to verify logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Act
      await GET(requestWithoutHeaders)

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('API Error - /api/automations:', {
        error: 'Test error',
        timestamp: expect.any(String),
        userAgent: null,
        ip: 'unknown'
      })

      consoleSpy.mockRestore()
    })
  })
})
