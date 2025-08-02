// src/lib/services/automation-service.ts
/**
 * Automation Service - Frontend API Client
 * Quest 2.4: Wire Up Individual Action Buttons
 * 
 * Expert Council Validated Implementation:
 * - Centralized API client for all automation operations
 * - Consistent error handling patterns
 * - Type-safe request/response interfaces
 * - Comprehensive logging and monitoring
 */

/**
 * Automation action result interface
 */
export interface AutomationActionResult {
  success: boolean
  automationId: string
  action: 'run' | 'stop'
  timestamp: string
  executionTime: number
  result?: {
    webhookTriggered: boolean
    webhookStatus: number
    executionId?: string
    message: string
  }
  error?: string
  details?: string
}

/**
 * Bulk action result interface
 */
export interface BulkActionResult {
  success: boolean
  action: 'run' | 'stop'
  totalRequested: number
  results: Array<{
    id: string
    success: boolean
    result?: Record<string, unknown>
    error?: string
    timestamp: string
  }>
  summary: {
    successful: number
    failed: number
    processingTime: string
  }
}

/**
 * API Error class for specific error handling
 */
export class AutomationServiceError extends Error {
  public readonly status: number
  public readonly automationId?: string
  public readonly action?: string
  public readonly details?: string

  constructor(
    message: string, 
    status: number, 
    automationId?: string,
    action?: string,
    details?: string
  ) {
    super(message)
    this.name = 'AutomationServiceError'
    this.status = status
    this.automationId = automationId
    this.action = action
    this.details = details
  }
}

/**
 * Automation Service Class
 * Handles all frontend API communication for automation actions
 */
export class AutomationService {
  private readonly baseUrl = '/api/automations'
  private readonly timeout = 60000 // 60 seconds for automation actions

  /**
   * Run a specific automation
   */
  async runAutomation(id: string): Promise<AutomationActionResult> {
    return this.executeAction(id, 'run')
  }

  /**
   * Stop a specific automation
   */
  async stopAutomation(id: string): Promise<AutomationActionResult> {
    return this.executeAction(id, 'stop')
  }

  /**
   * Execute bulk action on multiple automations
   */
  async bulkAction(action: 'run' | 'stop', automationIds: string[]): Promise<BulkActionResult> {
    if (!automationIds || automationIds.length === 0) {
      throw new AutomationServiceError(
        'No automations selected for bulk action',
        400,
        undefined,
        action
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout * 2) // Longer timeout for bulk actions

    try {
      const startTime = Date.now()

      const response = await fetch(`${this.baseUrl}/bulk-action`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-ID': this.generateRequestId()
        },
        body: JSON.stringify({ 
          action, 
          automationIds,
          requestId: this.generateRequestId(),
          timestamp: new Date().toISOString()
        }),
        signal: controller.signal
      })

      const responseTime = Date.now() - startTime

      // Log API call for monitoring
      console.log('Bulk automation action API call:', {
        action,
        automationCount: automationIds.length,
        status: response.status,
        responseTime,
        timestamp: new Date().toISOString()
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new AutomationServiceError(
          errorData.error || `HTTP ${response.status}: Bulk ${action} action failed`,
          response.status,
          undefined,
          action,
          `Bulk action failed for ${automationIds.length} automations`
        )
      }

      const result = await response.json()
      return result as BulkActionResult

    } catch (error) {
      if (error instanceof AutomationServiceError) {
        throw error
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new AutomationServiceError(
        `Bulk ${action} action failed: ${errorMessage}`,
        500,
        undefined,
        action,
        `Network error during bulk ${action} for ${automationIds.length} automations`
      )
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Execute individual automation action (run/stop)
   */
  private async executeAction(id: string, action: 'run' | 'stop'): Promise<AutomationActionResult> {
    if (!id || typeof id !== 'string') {
      throw new AutomationServiceError(
        'Invalid automation ID',
        400,
        id,
        action
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const startTime = Date.now()

      const response = await fetch(`${this.baseUrl}/${id}/${action}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-ID': this.generateRequestId()
        },
        body: JSON.stringify({
          requestId: this.generateRequestId(),
          timestamp: new Date().toISOString()
        }),
        signal: controller.signal
      })

      const responseTime = Date.now() - startTime

      // Log API call for monitoring
      console.log('Automation action API call:', {
        automationId: id,
        action,
        status: response.status,
        responseTime,
        timestamp: new Date().toISOString()
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Handle specific error cases
        let errorMessage = errorData.error || `HTTP ${response.status}: Failed to ${action} automation`
        
        if (response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.'
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to perform this action.'
        } else if (response.status === 404) {
          errorMessage = 'Automation not found.'
        } else if (response.status === 409) {
          errorMessage = errorData.details || 'Automation is in a conflicting state.'
        }

        throw new AutomationServiceError(
          errorMessage,
          response.status,
          id,
          action,
          `API error for automation ${id}`
        )
      }

      const result = await response.json()
      return result as AutomationActionResult

    } catch (error) {
      if (error instanceof AutomationServiceError) {
        throw error
      }

      // Handle network and other errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      let status = 500

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          status = 408 // Request Timeout
        } else if (error.message.includes('Failed to fetch')) {
          status = 503 // Service Unavailable
        }
      }

      throw new AutomationServiceError(
        `Failed to ${action} automation: ${errorMessage}`,
        status,
        id,
        action,
        `Network error for automation ${id}: ${errorMessage}`
      )
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get automation status (utility method)
   */
  async getAutomationStatus(id: string): Promise<{ status: string; lastRun?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`Failed to get automation status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get automation status:', error)
      throw new AutomationServiceError(
        'Failed to get automation status',
        500,
        id,
        'status'
      )
    }
  }
}

// Export singleton instance
export const automationService = new AutomationService()

// AutomationServiceError is already exported above
