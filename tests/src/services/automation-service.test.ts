// src/test/services/automation-service.test.ts
/**
 * Unit Tests for Automation Service
 * Quest 2.4: Wire Up Individual Action Buttons
 * 
 * Tests the frontend automation service with comprehensive scenarios
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { automationService, AutomationServiceError } from '@/lib/services/automation-service'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('AutomationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('runAutomation', () => {
    it('should successfully run an automation', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        automationId: 'automation-123',
        action: 'run',
        timestamp: new Date().toISOString(),
        executionTime: 1500,
        result: {
          webhookTriggered: true,
          webhookStatus: 200,
          executionId: 'exec-123',
          message: 'Automation run triggered successfully'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      })

      // Act
      const result = await automationService.runAutomation('automation-123')

      // Assert
      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/automations/automation-123/run',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('should throw AutomationServiceError on API error', async () => {
      // Arrange
      const errorResponse = {
        success: false,
        error: 'Automation not found',
        automationId: 'nonexistent-id',
        action: 'run'
      }

      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue(errorResponse)
      })

      // Act & Assert
      const error = await automationService.runAutomation('nonexistent-id').catch((e: unknown) => e)
      expect(error).toBeInstanceOf(AutomationServiceError)
      expect((error as AutomationServiceError).status).toBe(404)
      expect((error as AutomationServiceError).automationId).toBe('nonexistent-id')
      expect((error as AutomationServiceError).action).toBe('run')
      // The service transforms 404 errors to "Automation not found." message
      expect((error as AutomationServiceError).message).toBe('Automation not found.')
    })

    it('should throw AutomationServiceError on network error', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Network error'))

      // Act & Assert
      const error = await automationService.runAutomation('automation-123').catch((e: unknown) => e)
      expect(error).toBeInstanceOf(AutomationServiceError)
      expect((error as AutomationServiceError).status).toBe(500)
      // The service prefixes network errors with "Failed to run automation: "
      expect((error as AutomationServiceError).message).toBe('Failed to run automation: Network error')
    })

    it('should validate automation ID', async () => {
      // Act & Assert
      await expect(automationService.runAutomation(''))
        .rejects.toThrow(AutomationServiceError)
      
      await expect(automationService.runAutomation(null as unknown as string))
        .rejects.toThrow(AutomationServiceError)
    })
  })

  describe('stopAutomation', () => {
    it('should successfully stop an automation', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        automationId: 'automation-123',
        action: 'stop',
        timestamp: new Date().toISOString(),
        executionTime: 1200,
        result: {
          webhookTriggered: true,
          webhookStatus: 200,
          executionId: 'exec-123',
          message: 'Automation stop triggered successfully'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      })

      // Act
      const result = await automationService.stopAutomation('automation-123')

      // Assert
      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/automations/automation-123/stop',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('should handle 409 conflict when automation is not running', async () => {
      // Arrange
      const errorResponse = {
        success: false,
        error: 'Automation is not currently running',
        automationId: 'automation-123',
        action: 'stop',
        details: 'Only running automations can be stopped',
        currentStatus: 'success'
      }

      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: vi.fn().mockResolvedValue(errorResponse)
      })

      // Act & Assert
      const error = await automationService.stopAutomation('automation-123').catch((e: unknown) => e)
      expect(error).toBeInstanceOf(AutomationServiceError)
      expect((error as AutomationServiceError).status).toBe(409)
      // The service uses the details field or defaults to "Automation is in a conflicting state."
      expect((error as AutomationServiceError).message).toBe('Only running automations can be stopped')
    })
  })

  describe('bulkAction', () => {
    it('should successfully execute bulk run action', async () => {
      // Arrange
      const automationIds = ['auto-1', 'auto-2', 'auto-3']
      const mockResponse = {
        success: true,
        action: 'run',
        totalRequested: 3,
        results: [
          { id: 'auto-1', success: true, timestamp: new Date().toISOString() },
          { id: 'auto-2', success: true, timestamp: new Date().toISOString() },
          { id: 'auto-3', success: false, error: 'Webhook failed', timestamp: new Date().toISOString() }
        ],
        summary: {
          successful: 2,
          failed: 1,
          processingTime: new Date().toISOString()
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      })

      // Act
      const result = await automationService.bulkAction('run', automationIds)

      // Assert
      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/automations/bulk-action',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Request-ID': expect.any(String)
          }),
          body: expect.stringContaining('"action":"run"'),
          signal: expect.any(AbortSignal)
        })
      )

      // Verify the body contains the expected data structure
      const callArgs = mockFetch.mock.calls[0]
      const requestBody = JSON.parse(callArgs[1].body)
      expect(requestBody).toEqual(expect.objectContaining({
        action: 'run',
        automationIds,
        requestId: expect.any(String),
        timestamp: expect.any(String)
      }))
    })

    it('should throw error when no automations are selected', async () => {
      // Act & Assert
      await expect(automationService.bulkAction('run', []))
        .rejects.toThrow(AutomationServiceError)
      
      await expect(automationService.bulkAction('run', null as unknown as string[]))
        .rejects.toThrow(AutomationServiceError)
    })

    it('should handle batch size limitation error', async () => {
      // Arrange
      const tooManyAutomations = Array.from({ length: 51 }, (_, i) => `auto-${i}`)
      const errorResponse = {
        success: false,
        error: 'Batch size limited to 50 automations for MVP. Contact support for larger batches.',
        action: 'bulk-action',
        details: {
          requested: 51,
          maximum: 50,
          productionEnhancement: 'Database job queue with background processing available for production'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse)
      })

      // Act & Assert
      await expect(automationService.bulkAction('run', tooManyAutomations))
        .rejects.toThrow(AutomationServiceError)
    })

    it('should successfully execute bulk stop action', async () => {
      // Arrange
      const automationIds = ['auto-1', 'auto-2']
      const mockResponse = {
        success: true,
        action: 'stop',
        totalRequested: 2,
        results: [
          { id: 'auto-1', success: true, timestamp: new Date().toISOString() },
          { id: 'auto-2', success: true, timestamp: new Date().toISOString() }
        ],
        summary: {
          successful: 2,
          failed: 0,
          processingTime: new Date().toISOString()
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      })

      // Act
      const result = await automationService.bulkAction('stop', automationIds)

      // Assert
      expect(result).toEqual(mockResponse)
      expect(result.action).toBe('stop')
      expect(result.summary.successful).toBe(2)
      expect(result.summary.failed).toBe(0)
    })
  })

  describe('getAutomationStatus', () => {
    it('should successfully get automation status', async () => {
      // Arrange
      const mockResponse = {
        status: 'Running',
        lastRun: new Date().toISOString()
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      })

      // Act
      const result = await automationService.getAutomationStatus('automation-123')

      // Assert
      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/automations/automation-123/status',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('should handle status fetch error', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      // Act & Assert
      await expect(automationService.getAutomationStatus('nonexistent-id'))
        .rejects.toThrow(AutomationServiceError)
    })
  })
})
