// src/app/api/webhooks/n8n/route.ts
/**
 * Quest 1.3: Backend Telemetry Endpoint
 * Main n8n webhook endpoint for receiving automation completion data
 * 
 * Security: Uses Authorization header with N8N_WEBHOOK_SECRET
 * Validation: Zod schema validation for payload
 * Data Layer: Repository Layer abstraction for database operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import {
  validateWebhookPayload,
  WebhookValidationError,
  AutomationNotFoundError,
  RepositoryError,
  type WebhookResponse,
  type WebhookErrorResponse
} from '@/lib/types/webhook-types'
import { automationRepository } from '@/lib/repositories/automation-repository'
import { createPerformanceMonitor } from '@/lib/performance/webhook-performance-monitor'

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

/**
 * Validate webhook authentication
 */
async function validateAuthentication(): Promise<boolean> {
  try {
    const headersList = await headers()
    const authHeader = headersList.get('authorization')
    
    if (!authHeader) {
      return false
    }
    
    // Extract token from "Bearer <token>" format or direct token
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : authHeader
    
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET
    
    if (!expectedSecret) {
      console.error('N8N_WEBHOOK_SECRET environment variable not configured')
      return false
    }
    
    return token === expectedSecret
  } catch (error) {
    console.error('Authentication validation error:', error)
    return false
  }
}

/**
 * Generate request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create error response
 */
function createErrorResponse(
  error: string,
  status: number,
  details?: string,
  requestId?: string
): NextResponse<WebhookErrorResponse> {
  const response: WebhookErrorResponse = {
    error,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
    ...(requestId && { request_id: requestId })
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Create success response
 */
function createSuccessResponse(
  automationRunId?: string,
  requestId?: string
): NextResponse<WebhookResponse> {
  const response: WebhookResponse = {
    success: true,
    timestamp: new Date().toISOString(),
    ...(automationRunId && { automation_run_id: automationRunId }),
    ...(requestId && { message: `Request processed successfully (${requestId})` })
  }
  
  return NextResponse.json(response, { status: 200 })
}

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

/**
 * POST /api/webhooks/n8n
 * Main webhook endpoint for n8n automation completion data
 * Enhanced with Expert Council P1 performance monitoring
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId()

  // Initialize performance monitoring (Expert Council P1 recommendation)
  const performanceMonitor = createPerformanceMonitor(requestId, '/api/webhooks/n8n', 'POST')

  try {
    // Step 1: Authentication (with performance tracking)
    performanceMonitor.startAuthentication()
    const isAuthenticated = await validateAuthentication()
    performanceMonitor.endAuthentication()

    if (!isAuthenticated) {
      console.warn(`Unauthorized webhook attempt - Request ID: ${requestId}`)
      await performanceMonitor.complete(401)
      return createErrorResponse(
        'Unauthorized webhook',
        401,
        'Invalid or missing Authorization header',
        requestId
      )
    }
    
    // Step 2: Parse and validate payload (with performance tracking)
    performanceMonitor.startValidation()
    let payload
    try {
      const body = await request.json()

      // Track payload size for performance analysis
      const payloadSize = JSON.stringify(body).length
      performanceMonitor.setPayloadSize(payloadSize)

      payload = validateWebhookPayload(body)
      performanceMonitor.endValidation()
    } catch (error) {
      performanceMonitor.endValidation()
      performanceMonitor.recordError('validation_error', error instanceof Error ? error.message : 'Unknown validation error')
      console.error(`Payload validation error - Request ID: ${requestId}:`, error)

      if (error instanceof WebhookValidationError) {
        await performanceMonitor.complete(400)
        return createErrorResponse(
          'Invalid payload format',
          400,
          error.message,
          requestId
        )
      }

      await performanceMonitor.complete(400)
      return createErrorResponse(
        'Malformed JSON payload',
        400,
        'Request body must be valid JSON',
        requestId
      )
    }
    
    // Step 3: Process webhook data through Repository Layer (with performance tracking)
    try {
      // Determine automation_id and user_id
      // If not provided in payload, we'll need to handle this appropriately
      const automationId = payload.automation_id
      const userId = payload.user_id

      if (!automationId || !userId) {
        await performanceMonitor.complete(400)
        return createErrorResponse(
          'Missing required fields',
          400,
          'automation_id and user_id are required for processing',
          requestId
        )
      }

      // Set context for performance tracking
      performanceMonitor.setUserContext(userId)
      performanceMonitor.setAutomationContext(automationId)

      // Start database performance tracking
      performanceMonitor.startDatabase()

      // Create automation run record
      const automationRun = await automationRepository.createAutomationRun({
        automation_id: automationId,
        user_id: userId,
        execution_id: payload.execution_id,
        status: payload.final_status,
        duration_ms: payload.execution_time_ms,
        error_message: payload.error_message,
        completed_at: new Date().toISOString()
      })

      // Update automation status and metrics
      await automationRepository.updateAutomation({
        automation_id: automationId,
        last_run_at: new Date().toISOString(),
        last_run_status: payload.final_status
      })

      // Update automation metrics (run counts, success rate)
      await automationRepository.updateAutomationMetrics(automationId)

      // End database performance tracking
      performanceMonitor.endDatabase()

      console.log(`Webhook processed successfully - Request ID: ${requestId}, Run ID: ${automationRun.id}`)

      // Complete performance monitoring with success
      await performanceMonitor.complete(200)

      return createSuccessResponse(automationRun.id, requestId)
      
    } catch (error) {
      performanceMonitor.endDatabase()
      console.error(`Repository operation error - Request ID: ${requestId}:`, error)

      if (error instanceof AutomationNotFoundError) {
        performanceMonitor.recordError('automation_not_found', error.message)
        await performanceMonitor.complete(404)
        return createErrorResponse(
          'Automation not found',
          404,
          error.message,
          requestId
        )
      }

      if (error instanceof RepositoryError) {
        performanceMonitor.recordError('repository_error', error.message)
        await performanceMonitor.complete(500)
        return createErrorResponse(
          'Database operation failed',
          500,
          'Failed to store automation data',
          requestId
        )
      }

      performanceMonitor.recordError('unexpected_error', error instanceof Error ? error.message : 'Unknown error')
      await performanceMonitor.complete(500)
      return createErrorResponse(
        'Internal server error',
        500,
        'Unexpected error processing webhook',
        requestId
      )
    }

  } catch (error) {
    console.error(`Unexpected webhook error - Request ID: ${requestId}:`, error)

    performanceMonitor.recordError('unexpected_webhook_error', error instanceof Error ? error.message : 'Unknown error')
    await performanceMonitor.complete(500)
    return createErrorResponse(
      'Internal server error',
      500,
      'Unexpected error processing request',
      requestId
    )
  }
}

// ============================================================================
// UNSUPPORTED METHODS
// ============================================================================

/**
 * Handle unsupported HTTP methods
 */
export async function GET() {
  return createErrorResponse(
    'Method not allowed',
    405,
    'This endpoint only accepts POST requests'
  )
}

export async function PUT() {
  return createErrorResponse(
    'Method not allowed',
    405,
    'This endpoint only accepts POST requests'
  )
}

export async function DELETE() {
  return createErrorResponse(
    'Method not allowed',
    405,
    'This endpoint only accepts POST requests'
  )
}

export async function PATCH() {
  return createErrorResponse(
    'Method not allowed',
    405,
    'This endpoint only accepts POST requests'
  )
}
