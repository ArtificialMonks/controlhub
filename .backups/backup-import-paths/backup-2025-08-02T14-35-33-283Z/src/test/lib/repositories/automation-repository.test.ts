// src/test/lib/repositories/automation-repository.test.ts
// Quest 1.3: Enhanced Testing Strategy - Comprehensive Integration Tests
// Implements Expert Council Quality Expert recommendations for expanded test coverage
/**
 * Unit Tests for AutomationRepository
 * Tests the Repository Layer implementation for Quest 1.3
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { AutomationRepository } from '@/lib/repositories/automation-repository'
import { 
  AutomationNotFoundError, 
  RepositoryError,
  type CreateAutomationRunRequest,
  type UpdateAutomationRequest 
} from '@/lib/types/webhook-types'

// ============================================================================
// TEST SETUP AND MOCKS
// ============================================================================

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis()
  }))
}

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

// ============================================================================
// TEST DATA
// ============================================================================

const mockAutomation = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: '987fcdeb-51a2-43d7-8f9e-123456789abc',
  client_id: 'client-123',
  name: 'Test Automation',
  description: 'Test automation description',
  workflow_type: 'data_sync',
  status: 'active',
  is_enabled: true,
  last_run_at: '2024-01-15T10:30:00Z',
  last_run_status: 'success',
  run_count: 10,
  error_count: 2,
  success_rate: 80.0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T10:30:00Z'
}

const mockAutomationRun = {
  id: 'run-123e4567-e89b-12d3-a456-426614174000',
  automation_id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: '987fcdeb-51a2-43d7-8f9e-123456789abc',
  execution_id: 'exec-123',
  status: 'success',
  duration_ms: 1500,
  started_at: '2024-01-15T10:30:00Z',
  completed_at: '2024-01-15T10:31:30Z',
  created_at: '2024-01-15T10:30:00Z'
}

const mockRunStats = [
  { status: 'success', duration_ms: 1000 },
  { status: 'success', duration_ms: 1500 },
  { status: 'error', duration_ms: null },
  { status: 'success', duration_ms: 2000 }
]

// ============================================================================
// TEST SUITES
// ============================================================================

describe('AutomationRepository', () => {
  let repository: AutomationRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new AutomationRepository()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  // ==========================================================================
  // AUTOMATION OPERATIONS TESTS
  // ==========================================================================

  describe('getAutomationById', () => {
    it('should return automation when found', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAutomation, error: null })
      }
      mockSupabaseClient.from.mockReturnValue(mockChain)

      const result = await repository.getAutomationById('123e4567-e89b-12d3-a456-426614174000')

      expect(result).toEqual(mockAutomation)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('automations')
      expect(mockChain.select).toHaveBeenCalledWith('*')
      expect(mockChain.eq).toHaveBeenCalledWith('id', '123e4567-e89b-12d3-a456-426614174000')
    })

    it('should return null when automation not found', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116', message: 'No rows found' } 
        })
      }
      mockSupabaseClient.from.mockReturnValue(mockChain)

      const result = await repository.getAutomationById('nonexistent-id')

      expect(result).toBeNull()
    })

    it('should throw RepositoryError on database error', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST000', message: 'Database error' } 
        })
      }
      mockSupabaseClient.from.mockReturnValue(mockChain)

      await expect(repository.getAutomationById('test-id')).rejects.toThrow(RepositoryError)
    })
  })

  describe('updateAutomation', () => {
    const updateRequest: UpdateAutomationRequest = {
      automation_id: '123e4567-e89b-12d3-a456-426614174000',
      last_run_at: '2024-01-15T10:30:00Z',
      last_run_status: 'success',
      run_count: 11,
      success_rate: 85.0
    }

    it('should update automation successfully', async () => {
      // Mock getAutomationById
      const getChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAutomation, error: null })
      }
      
      // Mock update operation
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ...mockAutomation, ...updateRequest }, error: null })
      }

      mockSupabaseClient.from
        .mockReturnValueOnce(getChain)  // First call for getAutomationById
        .mockReturnValueOnce(updateChain)  // Second call for update

      const result = await repository.updateAutomation(updateRequest)

      expect(result).toEqual({ ...mockAutomation, ...updateRequest })
      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          last_run_at: updateRequest.last_run_at,
          last_run_status: updateRequest.last_run_status,
          run_count: updateRequest.run_count,
          success_rate: updateRequest.success_rate,
          updated_at: expect.any(String)
        })
      )
    })

    it('should throw AutomationNotFoundError when automation does not exist', async () => {
      const getChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116', message: 'No rows found' } 
        })
      }
      mockSupabaseClient.from.mockReturnValue(getChain)

      await expect(repository.updateAutomation(updateRequest)).rejects.toThrow(AutomationNotFoundError)
    })
  })

  // ==========================================================================
  // AUTOMATION RUN OPERATIONS TESTS
  // ==========================================================================

  describe('createAutomationRun', () => {
    const createRequest: CreateAutomationRunRequest = {
      automation_id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '987fcdeb-51a2-43d7-8f9e-123456789abc',
      execution_id: 'exec-123',
      status: 'success',
      duration_ms: 1500
    }

    it('should create automation run successfully', async () => {
      // Mock getAutomationById
      const getChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAutomation, error: null })
      }
      
      // Mock insert operation
      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAutomationRun, error: null })
      }

      mockSupabaseClient.from
        .mockReturnValueOnce(getChain)  // First call for getAutomationById
        .mockReturnValueOnce(insertChain)  // Second call for insert

      const result = await repository.createAutomationRun(createRequest)

      expect(result).toEqual(mockAutomationRun)
      expect(insertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          automation_id: createRequest.automation_id,
          user_id: createRequest.user_id,
          execution_id: createRequest.execution_id,
          status: createRequest.status,
          duration_ms: createRequest.duration_ms,
          started_at: expect.any(String),
          created_at: expect.any(String)
        })
      )
    })

    it('should throw AutomationNotFoundError when automation does not exist', async () => {
      const getChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116', message: 'No rows found' } 
        })
      }
      mockSupabaseClient.from.mockReturnValue(getChain)

      await expect(repository.createAutomationRun(createRequest)).rejects.toThrow(AutomationNotFoundError)
    })
  })

  describe('getAutomationRuns', () => {
    it('should return automation runs with pagination', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis().mockResolvedValue({ 
          data: [mockAutomationRun], 
          error: null 
        })
      }
      mockSupabaseClient.from.mockReturnValue(mockChain)

      const result = await repository.getAutomationRuns('123e4567-e89b-12d3-a456-426614174000', 10, 0)

      expect(result).toEqual([mockAutomationRun])
      expect(mockChain.eq).toHaveBeenCalledWith('automation_id', '123e4567-e89b-12d3-a456-426614174000')
      expect(mockChain.order).toHaveBeenCalledWith('started_at', { ascending: false })
      expect(mockChain.range).toHaveBeenCalledWith(0, 9)
    })
  })

  // ==========================================================================
  // METRICS AND ANALYTICS TESTS
  // ==========================================================================

  describe('getAutomationMetrics', () => {
    it('should calculate metrics correctly', async () => {
      // Mock getAutomationById
      const getChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAutomation, error: null })
      }
      
      // Mock stats query
      const statsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis().mockResolvedValue({ 
          data: mockRunStats, 
          error: null 
        })
      }

      mockSupabaseClient.from
        .mockReturnValueOnce(getChain)  // First call for getAutomationById
        .mockReturnValueOnce(statsChain)  // Second call for stats

      const result = await repository.getAutomationMetrics('123e4567-e89b-12d3-a456-426614174000')

      expect(result).toEqual({
        total_runs: 4,
        successful_runs: 3,
        failed_runs: 1,
        success_rate: 75.0,
        average_duration_ms: 1500, // (1000 + 1500 + 2000) / 3
        last_run_at: mockAutomation.last_run_at,
        last_run_status: mockAutomation.last_run_status
      })
    })

    it('should handle empty run history', async () => {
      // Mock getAutomationById
      const getChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAutomation, error: null })
      }
      
      // Mock empty stats query
      const statsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis().mockResolvedValue({ 
          data: [], 
          error: null 
        })
      }

      mockSupabaseClient.from
        .mockReturnValueOnce(getChain)
        .mockReturnValueOnce(statsChain)

      const result = await repository.getAutomationMetrics('123e4567-e89b-12d3-a456-426614174000')

      expect(result).toEqual({
        total_runs: 0,
        successful_runs: 0,
        failed_runs: 0,
        success_rate: 0,
        average_duration_ms: 0,
        last_run_at: mockAutomation.last_run_at,
        last_run_status: mockAutomation.last_run_status
      })
    })
  })
})
