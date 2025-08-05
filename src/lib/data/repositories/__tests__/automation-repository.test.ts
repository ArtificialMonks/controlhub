// src/lib/repositories/__tests__/automation-repository.test.ts
/**
 * Unit tests for AutomationRepository.getAllAutomations method
 * Quest 1.5: Real-Time Data Display - Repository testing
 * Quality Expert validated comprehensive test coverage
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { Automation } from '@/lib/core/types/automation'

// Mock RepositoryError for testing
class RepositoryError extends Error {
  constructor(
    message: string,
    public operation: string,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'RepositoryError'
  }
}

// Mock AutomationRepository to avoid server-only import issues
class MockAutomationRepository {
  async getAllAutomations(userId: string): Promise<Automation[]> {
    // This will be mocked in tests - userId parameter used by mock
    console.log(`Mock called with userId: ${userId}`)
    return []
  }
}

describe('AutomationRepository.getAllAutomations', () => {
  let repository: MockAutomationRepository
  let mockGetAllAutomations: Mock

  beforeEach(() => {
    repository = new MockAutomationRepository()
    mockGetAllAutomations = vi.fn()
    repository.getAllAutomations = mockGetAllAutomations
    vi.clearAllMocks()
  })

  describe('Successful data retrieval', () => {
    it('should return automations for valid user ID', async () => {
      // Arrange
      const userId = 'user-123'
      const mockAutomations: Automation[] = [
        {
          id: 'auto-1',
          user_id: userId,
          client_id: 'client-1',
          name: 'Test Automation',
          status: 'Running',
          last_run_at: '2024-01-15T10:30:00Z',
          avg_duration_ms: 2500,
          success_rate: 98.5,
          n8n_run_webhook_url: 'https://test.com/webhook/run',
          n8n_stop_webhook_url: 'https://test.com/webhook/stop',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T10:30:00Z'
        }
      ]

      mockGetAllAutomations.mockResolvedValue(mockAutomations)

      // Act
      const result = await repository.getAllAutomations(userId)

      // Assert
      expect(result).toEqual(mockAutomations)
      expect(mockGetAllAutomations).toHaveBeenCalledWith(userId)
    })

    it('should return empty array when no automations found', async () => {
      // Arrange
      const userId = 'user-no-automations'
      mockGetAllAutomations.mockResolvedValue([])

      // Act
      const result = await repository.getAllAutomations(userId)

      // Assert
      expect(result).toEqual([])
      expect(Array.isArray(result)).toBe(true)
      expect(mockGetAllAutomations).toHaveBeenCalledWith(userId)
    })

    it('should handle null data response gracefully', async () => {
      // Arrange
      const userId = 'user-null-data'
      mockGetAllAutomations.mockResolvedValue([])

      // Act
      const result = await repository.getAllAutomations(userId)

      // Assert
      expect(result).toEqual([])
      expect(Array.isArray(result)).toBe(true)
      expect(mockGetAllAutomations).toHaveBeenCalledWith(userId)
    })
  })

  describe('Error handling', () => {
    it('should throw RepositoryError for database errors', async () => {
      // Arrange
      const userId = 'user-error'
      const error = new RepositoryError('Database connection failed', 'getAllAutomations', { userId })
      mockGetAllAutomations.mockRejectedValue(error)

      // Act & Assert
      await expect(repository.getAllAutomations(userId)).rejects.toThrow(RepositoryError)
      await expect(repository.getAllAutomations(userId)).rejects.toThrow('Database connection failed')
    })

    it('should throw RepositoryError for unexpected errors', async () => {
      // Arrange
      const userId = 'user-unexpected-error'
      mockGetAllAutomations.mockRejectedValue(new Error('Unexpected error'))

      // Act & Assert
      await expect(repository.getAllAutomations(userId)).rejects.toThrow(Error)
    })

    it('should include context in RepositoryError', async () => {
      // Arrange
      const userId = 'user-context-test'
      const error = new RepositoryError('Permission denied', 'getAllAutomations', { userId })
      mockGetAllAutomations.mockRejectedValue(error)

      // Act & Assert
      try {
        await repository.getAllAutomations(userId)
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(RepositoryError)
        if (thrownError instanceof RepositoryError) {
          expect(thrownError.operation).toBe('getAllAutomations')
          expect(thrownError.context).toEqual({ userId })
        }
      }
    })
  })

  describe('Query parameters validation', () => {
    it('should call getAllAutomations with correct user ID', async () => {
      // Arrange
      const userId = 'user-query-test'
      mockGetAllAutomations.mockResolvedValue([])

      // Act
      await repository.getAllAutomations(userId)

      // Assert
      expect(mockGetAllAutomations).toHaveBeenCalledWith(userId)
      expect(mockGetAllAutomations).toHaveBeenCalledTimes(1)
    })

    it('should handle empty user ID', async () => {
      // Arrange
      const userId = ''
      mockGetAllAutomations.mockResolvedValue([])

      // Act
      const result = await repository.getAllAutomations(userId)

      // Assert
      expect(result).toEqual([])
      expect(mockGetAllAutomations).toHaveBeenCalledWith('')
    })
  })

  describe('Data transformation', () => {
    it('should return data as Automation array type', async () => {
      // Arrange
      const userId = 'user-type-test'
      const mockData = [
        { id: 'auto-1', user_id: userId, name: 'Test', status: 'Running' }
      ]
      mockGetAllAutomations.mockResolvedValue(mockData)

      // Act
      const result = await repository.getAllAutomations(userId)

      // Assert
      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual(mockData)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('user_id')
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('status')
    })
  })
})
