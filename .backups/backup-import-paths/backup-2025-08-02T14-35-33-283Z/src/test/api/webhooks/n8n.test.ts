// src/test/api/webhooks/n8n.test.ts
/**
 * Integration Tests for Quest 1.3: Backend Telemetry Endpoint
 * Tests the /api/webhooks/n8n endpoint according to quest requirements
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/webhooks/n8n/route'
import { automationRepository } from '@/lib/repositories/automation-repository'
import type { WebhookPayload } from '@/lib/types/webhook-types'

// ============================================================================
// TEST SETUP AND MOCKS
// ============================================================================

// Mock environment variables
const mockEnv = {
  N8N_WEBHOOK_SECRET: 'test-webhook-secret-123'
}

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

// Mock automation repository
vi.mock('@/lib/repositories/automation-repository', () => ({
  automationRepository: {
    getAutomationById: vi.fn(),
    createAutomationRun: vi.fn(),
    updateAutomation: vi.fn(),
    updateAutomationMetrics: vi.fn()
  }
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

// Mock Next.js headers
const mockHeaders = vi.fn()
vi.mock('next/headers', () => ({
  headers: mockHeaders
}))

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Create mock request with headers and body
 */
function createMockRequest(
  body: unknown,
  authHeader?: string
): NextRequest {
  const headers = new Headers()
  if (authHeader) {
    headers.set('authorization', authHeader)
  }
  headers.set('content-type', 'application/json')

  return new NextRequest('http://localhost:3000/api/webhooks/n8n', {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })
}

/**
 * Valid webhook payload for testing
 */
const validPayload: WebhookPayload = {
  final_status: 'success',
  execution_time_ms: 1500,
  automation_id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: '987fcdeb-51a2-43d7-8f9e-123456789abc',
  execution_id: 'exec_123'
}

/**
 * Mock automation data
 */
const mockAutomation = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: '987fcdeb-51a2-43d7-8f9e-123456789abc',
  name: 'Test Automation',
  status: 'active',
  run_count: 5,
  error_count: 1,
  success_rate: 80.0
}

/**
 * Mock automation run data
 */
const mockAutomationRun = {
  id: 'run_123e4567-e89b-12d3-a456-426614174000',
  automation_id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: '987fcdeb-51a2-43d7-8f9e-123456789abc',
  status: 'success',
  duration_ms: 1500,
  created_at: new Date().toISOString()
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('/api/webhooks/n8n endpoint', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Set up environment variables
    process.env.N8N_WEBHOOK_SECRET = mockEnv.N8N_WEBHOOK_SECRET
    
    // Mock headers function
    mockHeaders.mockResolvedValue(new Map())
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  // ==========================================================================
  // AUTHENTICATION TESTS
  // ==========================================================================

  describe('Authentication', () => {
    it('should return 401 for missing Authorization header', async () => {
      mockHeaders.mockResolvedValue(new Map())

      const request = createMockRequest(validPayload)
      const response = await POST(request)

      expect(response.status).toBe(401)

      const body = await response.json()
      expect(body.error).toBe('Unauthorized webhook')
      expect(body.details).toBe('Invalid or missing Authorization header')
    })

    it('should return 401 for incorrect secret token', async () => {
      const headerMap = new Map()
      headerMap.set('authorization', 'wrong-secret')
      mockHeaders.mockResolvedValue(headerMap)

      const request = createMockRequest(validPayload, 'wrong-secret')
      const response = await POST(request)

      expect(response.status).toBe(401)

      const body = await response.json()
      expect(body.error).toBe('Unauthorized webhook')
    })

    it('should accept correct secret token', async () => {
      const headerMap = new Map()
      headerMap.set('authorization', mockEnv.N8N_WEBHOOK_SECRET)
      mockHeaders.mockResolvedValue(headerMap)

      // Mock repository methods
      vi.mocked(automationRepository.getAutomationById).mockResolvedValue(mockAutomation as typeof mockAutomation)
      vi.mocked(automationRepository.createAutomationRun).mockResolvedValue(mockAutomationRun as typeof mockAutomationRun)
      vi.mocked(automationRepository.updateAutomation).mockResolvedValue(mockAutomation as typeof mockAutomation)
      vi.mocked(automationRepository.updateAutomationMetrics).mockResolvedValue(mockAutomation as typeof mockAutomation)

      const request = createMockRequest(validPayload, mockEnv.N8N_WEBHOOK_SECRET)
      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should accept Bearer token format', async () => {
      const headerMap = new Map()
      headerMap.set('authorization', `Bearer ${mockEnv.N8N_WEBHOOK_SECRET}`)
      mockHeaders.mockResolvedValue(headerMap)

      // Mock repository methods
      vi.mocked(automationRepository.getAutomationById).mockResolvedValue(mockAutomation as typeof mockAutomation)
      vi.mocked(automationRepository.createAutomationRun).mockResolvedValue(mockAutomationRun as typeof mockAutomationRun)
      vi.mocked(automationRepository.updateAutomation).mockResolvedValue(mockAutomation as typeof mockAutomation)
      vi.mocked(automationRepository.updateAutomationMetrics).mockResolvedValue(mockAutomation as typeof mockAutomation)

      const request = createMockRequest(validPayload, `Bearer ${mockEnv.N8N_WEBHOOK_SECRET}`)
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  // ==========================================================================
  // PAYLOAD VALIDATION TESTS
  // ==========================================================================

  describe('Payload Validation', () => {
    beforeEach(() => {
      const headerMap = new Map()
      headerMap.set('authorization', mockEnv.N8N_WEBHOOK_SECRET)
      mockHeaders.mockResolvedValue(headerMap)
    })

    it('should return 400 for malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/n8n', {
        method: 'POST',
        headers: { 'authorization': mockEnv.N8N_WEBHOOK_SECRET },
        body: 'invalid json'
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      
      const body = await response.json()
      expect(body.error).toBe('Malformed JSON payload')
    })

    it('should return 400 for missing required fields', async () => {
      const invalidPayload = {
        execution_time_ms: 1500
        // Missing final_status
      }
      
      const request = createMockRequest(invalidPayload, mockEnv.N8N_WEBHOOK_SECRET)
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      
      const body = await response.json()
      expect(body.error).toBe('Invalid payload format')
    })

    it('should return 400 for invalid final_status', async () => {
      const invalidPayload = {
        final_status: 'invalid_status',
        execution_time_ms: 1500,
        automation_id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '987fcdeb-51a2-43d7-8f9e-123456789abc'
      }
      
      const request = createMockRequest(invalidPayload, mockEnv.N8N_WEBHOOK_SECRET)
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      
      const body = await response.json()
      expect(body.error).toBe('Invalid payload format')
    })

    it('should return 400 for negative execution_time_ms', async () => {
      const invalidPayload = {
        final_status: 'success',
        execution_time_ms: -100,
        automation_id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '987fcdeb-51a2-43d7-8f9e-123456789abc'
      }
      
      const request = createMockRequest(invalidPayload, mockEnv.N8N_WEBHOOK_SECRET)
      const response = await POST(request)
      
      expect(response.status).toBe(400)
    })
  })

  // ==========================================================================
  // SUCCESSFUL PROCESSING TESTS
  // ==========================================================================

  describe('Successful Processing', () => {
    beforeEach(() => {
      const headerMap = new Map()
      headerMap.set('authorization', mockEnv.N8N_WEBHOOK_SECRET)
      mockHeaders.mockResolvedValue(headerMap)

      // Mock repository methods
      vi.mocked(automationRepository.getAutomationById).mockResolvedValue(mockAutomation as typeof mockAutomation)
      vi.mocked(automationRepository.createAutomationRun).mockResolvedValue(mockAutomationRun as typeof mockAutomationRun)
      vi.mocked(automationRepository.updateAutomation).mockResolvedValue(mockAutomation as typeof mockAutomation)
      vi.mocked(automationRepository.updateAutomationMetrics).mockResolvedValue(mockAutomation as typeof mockAutomation)
    })

    it('should process valid webhook payload successfully', async () => {
      const request = createMockRequest(validPayload, mockEnv.N8N_WEBHOOK_SECRET)
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.automation_run_id).toBe(mockAutomationRun.id)
      expect(body.timestamp).toBeDefined()
    })

    it('should call repository methods in correct order', async () => {
      const request = createMockRequest(validPayload, mockEnv.N8N_WEBHOOK_SECRET)
      await POST(request)
      
      expect(automationRepository.createAutomationRun).toHaveBeenCalledWith({
        automation_id: validPayload.automation_id,
        user_id: validPayload.user_id,
        execution_id: validPayload.execution_id,
        status: validPayload.final_status,
        duration_ms: validPayload.execution_time_ms,
        error_message: validPayload.error_message,
        completed_at: expect.any(String)
      })
      
      expect(automationRepository.updateAutomation).toHaveBeenCalledWith({
        automation_id: validPayload.automation_id,
        last_run_at: expect.any(String),
        last_run_status: validPayload.final_status
      })
      
      expect(automationRepository.updateAutomationMetrics).toHaveBeenCalledWith(
        validPayload.automation_id
      )
    })
  })

  // ==========================================================================
  // HTTP METHOD TESTS
  // ==========================================================================

  describe('HTTP Methods', () => {
    it('should return 405 for GET requests', async () => {
      const response = await GET()
      
      expect(response.status).toBe(405)
      
      const body = await response.json()
      expect(body.error).toBe('Method not allowed')
      expect(body.details).toBe('This endpoint only accepts POST requests')
    })
  })
})
