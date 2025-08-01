// src/test/api/automations/individual-actions.test.ts
/**
 * Integration Tests for Individual Automation Actions
 * Quest 2.3: Create Backend for Individual Actions
 * 
 * Tests the run and stop API endpoints with comprehensive scenarios
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the dependencies
vi.mock('@/lib/dal', () => ({
  verifySession: vi.fn()
}))

vi.mock('@/lib/repositories/automation-repository', () => ({
  AutomationRepository: vi.fn().mockImplementation(() => ({
    getAutomationById: vi.fn(),
    updateAutomation: vi.fn()
  }))
}))

vi.mock('@/lib/services/n8n-webhook-service', () => ({
  n8nWebhookService: {
    triggerRun: vi.fn(),
    triggerStop: vi.fn()
  }
}))

vi.mock('@/lib/services/audit-logger', () => ({
  auditLogger: {
    logAutomationAction: vi.fn(),
    logUnauthorizedAccess: vi.fn()
  }
}))

import { POST as runAutomation } from '@/app/api/automations/[id]/run/route'
import { POST as stopAutomation } from '@/app/api/automations/[id]/stop/route'
import { verifySession } from '@/lib/dal'
import { AutomationRepository } from '@/lib/repositories/automation-repository'
import { n8nWebhookService } from '@/lib/services/n8n-webhook-service'
import { auditLogger } from '@/lib/services/audit-logger'

describe('Individual Automation Actions API', () => {
  let mockAutomationRepository: {
    getAutomationById: ReturnType<typeof vi.fn>
    updateAutomation: ReturnType<typeof vi.fn>
  }
  let mockRequest: NextRequest

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup mock automation repository
    mockAutomationRepository = {
      getAutomationById: vi.fn(),
      updateAutomation: vi.fn()
    }
    
    // Mock the constructor to return our mock instance
    vi.mocked(AutomationRepository).mockImplementation(() => mockAutomationRepository)
    
    // Setup mock request
    mockRequest = new NextRequest('http://localhost:3000/api/automations/test-id/run', {
      method: 'POST'
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/automations/[id]/run', () => {
    it('should successfully run an automation', async () => {
      // Arrange
      const mockSession = { id: 'user-123', email: 'test@example.com' }
      const mockAutomation = {
        id: 'automation-123',
        user_id: 'user-123',
        name: 'Test Automation',
        status: 'active',
        is_enabled: true,
        n8n_run_webhook_url: 'https://test.com/webhook/run'
      }
      const mockWebhookResult = {
        success: true,
        status: 200,
        data: { executionId: 'exec-123' },
        timestamp: new Date().toISOString()
      }

      vi.mocked(verifySession).mockResolvedValue(mockSession)
      mockAutomationRepository.getAutomationById.mockResolvedValue(mockAutomation)
      mockAutomationRepository.updateAutomation.mockResolvedValue(mockAutomation)
      vi.mocked(n8nWebhookService.triggerRun).mockResolvedValue(mockWebhookResult)
      vi.mocked(auditLogger.logAutomationAction).mockResolvedValue(undefined)

      // Act
      const response = await runAutomation(mockRequest, { params: { id: 'automation-123' } })
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.automationId).toBe('automation-123')
      expect(responseData.action).toBe('run')
      expect(responseData.result.webhookTriggered).toBe(true)
      
      // Verify dependencies were called correctly
      expect(verifySession).toHaveBeenCalledOnce()
      expect(mockAutomationRepository.getAutomationById).toHaveBeenCalledWith('automation-123')
      expect(n8nWebhookService.triggerRun).toHaveBeenCalledWith('https://test.com/webhook/run')
      expect(auditLogger.logAutomationAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'run',
          automationId: 'automation-123',
          userId: 'user-123',
          result: true
        })
      )
    })

    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      vi.mocked(verifySession).mockResolvedValue(null)

      // Act
      const response = await runAutomation(mockRequest, { params: { id: 'automation-123' } })
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Authentication required')
    })

    it('should return 404 when automation is not found', async () => {
      // Arrange
      const mockSession = { id: 'user-123', email: 'test@example.com' }
      
      vi.mocked(verifySession).mockResolvedValue(mockSession)
      mockAutomationRepository.getAutomationById.mockResolvedValue(null)

      // Act
      const response = await runAutomation(mockRequest, { params: { id: 'nonexistent-id' } })
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Automation not found')
    })

    it('should return 403 when user is not authorized', async () => {
      // Arrange
      const mockSession = { id: 'user-123', email: 'test@example.com' }
      const mockAutomation = {
        id: 'automation-123',
        user_id: 'different-user',
        name: 'Test Automation',
        status: 'active',
        is_enabled: true
      }

      vi.mocked(verifySession).mockResolvedValue(mockSession)
      mockAutomationRepository.getAutomationById.mockResolvedValue(mockAutomation)
      vi.mocked(auditLogger.logUnauthorizedAccess).mockResolvedValue(undefined)

      // Act
      const response = await runAutomation(mockRequest, { params: { id: 'automation-123' } })
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Unauthorized access to automation')
      expect(auditLogger.logUnauthorizedAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          automationId: 'automation-123',
          action: 'run',
          reason: 'user_mismatch'
        })
      )
    })

    it('should return 400 when automation is disabled', async () => {
      // Arrange
      const mockSession = { id: 'user-123', email: 'test@example.com' }
      const mockAutomation = {
        id: 'automation-123',
        user_id: 'user-123',
        name: 'Test Automation',
        status: 'active',
        is_enabled: false
      }

      vi.mocked(verifySession).mockResolvedValue(mockSession)
      mockAutomationRepository.getAutomationById.mockResolvedValue(mockAutomation)

      // Act
      const response = await runAutomation(mockRequest, { params: { id: 'automation-123' } })
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Automation is disabled')
    })

    it('should return 400 when no webhook URL is configured', async () => {
      // Arrange
      const mockSession = { id: 'user-123', email: 'test@example.com' }
      const mockAutomation = {
        id: 'automation-123',
        user_id: 'user-123',
        name: 'Test Automation',
        status: 'active',
        is_enabled: true,
        n8n_run_webhook_url: null
      }

      vi.mocked(verifySession).mockResolvedValue(mockSession)
      mockAutomationRepository.getAutomationById.mockResolvedValue(mockAutomation)

      // Act
      const response = await runAutomation(mockRequest, { params: { id: 'automation-123' } })
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('No run webhook URL configured')
    })
  })

  describe('POST /api/automations/[id]/stop', () => {
    beforeEach(() => {
      mockRequest = new NextRequest('http://localhost:3000/api/automations/test-id/stop', {
        method: 'POST'
      })
    })

    it('should successfully stop an automation', async () => {
      // Arrange
      const mockSession = { id: 'user-123', email: 'test@example.com' }
      const mockAutomation = {
        id: 'automation-123',
        user_id: 'user-123',
        name: 'Test Automation',
        status: 'active',
        last_run_status: 'running',
        n8n_stop_webhook_url: 'https://test.com/webhook/stop'
      }
      const mockWebhookResult = {
        success: true,
        status: 200,
        data: { executionId: 'exec-123' },
        timestamp: new Date().toISOString()
      }

      vi.mocked(verifySession).mockResolvedValue(mockSession)
      mockAutomationRepository.getAutomationById.mockResolvedValue(mockAutomation)
      mockAutomationRepository.updateAutomation.mockResolvedValue(mockAutomation)
      vi.mocked(n8nWebhookService.triggerStop).mockResolvedValue(mockWebhookResult)
      vi.mocked(auditLogger.logAutomationAction).mockResolvedValue(undefined)

      // Act
      const response = await stopAutomation(mockRequest, { params: { id: 'automation-123' } })
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.automationId).toBe('automation-123')
      expect(responseData.action).toBe('stop')
      expect(responseData.result.webhookTriggered).toBe(true)
      
      // Verify dependencies were called correctly
      expect(verifySession).toHaveBeenCalledOnce()
      expect(mockAutomationRepository.getAutomationById).toHaveBeenCalledWith('automation-123')
      expect(n8nWebhookService.triggerStop).toHaveBeenCalledWith('https://test.com/webhook/stop')
    })

    it('should return 400 when automation is not running', async () => {
      // Arrange
      const mockSession = { id: 'user-123', email: 'test@example.com' }
      const mockAutomation = {
        id: 'automation-123',
        user_id: 'user-123',
        name: 'Test Automation',
        status: 'active',
        last_run_status: 'success'
      }

      vi.mocked(verifySession).mockResolvedValue(mockSession)
      mockAutomationRepository.getAutomationById.mockResolvedValue(mockAutomation)

      // Act
      const response = await stopAutomation(mockRequest, { params: { id: 'automation-123' } })
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Automation is not currently running')
    })
  })
})
