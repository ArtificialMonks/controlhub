// src/app/api/automations/[id]/run/route.ts
/**
 * Individual Automation Run API Endpoint
 * Quest 2.3: Create Backend for Individual Actions
 * 
 * Expert Council Validated Implementation:
 * - Authentication via verifySession (DAL pattern)
 * - Authorization via client-based filtering
 * - n8n webhook service integration
 * - Comprehensive error handling and audit logging
 * - Standardized JSON response format
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/dal'
import { AutomationRepository } from '@/lib/repositories/automation-repository'
import { n8nWebhookService } from '@/lib/services/n8n-webhook-service'
import { auditLogger } from '@/lib/services/audit-logger'
import type { User } from '@supabase/supabase-js'

/**
 * POST /api/automations/[id]/run
 * Trigger a specific automation to run
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id: automationId } = await params
  let session: User | null = null

  try {
    // 1. Authentication Layer - Verify user session
    session = await verifySession()
    if (!session) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          automationId,
          action: 'run'
        },
        { status: 401 }
      )
    }

    // 2. Input Validation
    if (!automationId || typeof automationId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid automation ID',
          automationId,
          action: 'run'
        },
        { status: 400 }
      )
    }

    // 3. Data Access Layer - Get automation details
    const automationRepository = new AutomationRepository()
    const automation = await automationRepository.getAutomationById(automationId)

    if (!automation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Automation not found',
          automationId,
          action: 'run'
        },
        { status: 404 }
      )
    }

    // 4. Authorization Layer - Client-based filtering
    // Note: Using user_id for authorization as per current schema
    // In production, this would use client_id when available
    if (automation.user_id !== session.id) {
      await auditLogger.logUnauthorizedAccess({
        userId: session.id,
        automationId,
        action: 'run',
        reason: 'user_mismatch'
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access to automation',
          automationId,
          action: 'run'
        },
        { status: 403 }
      )
    }

    // 5. Business Logic Layer - Validate automation state
    if (!automation.is_enabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'Automation is disabled',
          automationId,
          action: 'run',
          details: 'Enable the automation before running it'
        },
        { status: 400 }
      )
    }

    // Check if automation is already running
    if (automation.last_run_status === 'running') {
      return NextResponse.json(
        {
          success: false,
          error: 'Automation is already running',
          automationId,
          action: 'run',
          details: 'Wait for current execution to complete'
        },
        { status: 409 }
      )
    }

    // 6. n8n Webhook Service Integration
    const webhookUrl = automation.n8n_run_webhook_url
    if (!webhookUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'No run webhook URL configured',
          automationId,
          action: 'run'
        },
        { status: 400 }
      )
    }

    // Trigger n8n webhook
    const webhookResult = await n8nWebhookService.triggerRun(webhookUrl)

    // 7. Update Automation Status
    await automationRepository.updateAutomation({
      automation_id: automationId,
      last_run_at: new Date().toISOString(),
      last_run_status: 'running'
    })

    // 8. Audit Logging - Success
    await auditLogger.logAutomationAction({
      action: 'run',
      automationId,
      userId: session.id,
      clientId: automation.client_id,
      result: webhookResult.success,
      executionTime: Date.now() - startTime,
      webhookResponse: webhookResult as unknown as Record<string, unknown>
    })

    // 9. Standardized Success Response
    return NextResponse.json({
      success: true,
      automationId,
      action: 'run',
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - startTime,
      result: {
        webhookTriggered: true,
        webhookStatus: webhookResult.status,
        executionId: webhookResult.data?.executionId,
        message: 'Automation run triggered successfully'
      }
    })

  } catch (error) {
    // Comprehensive Error Handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const executionTime = Date.now() - startTime

    // Log error for debugging
    console.error('Automation run error:', {
      automationId,
      error: errorMessage,
      executionTime,
      userId: session?.id,
      timestamp: new Date().toISOString()
    })

    // Audit logging for errors
    if (session) {
      await auditLogger.logAutomationAction({
        action: 'run',
        automationId,
        userId: session.id,
        clientId: undefined,
        result: false,
        executionTime,
        error: errorMessage
      }).catch(auditError => {
        console.error('Audit logging failed:', auditError)
      })
    }

    // Return standardized error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run automation',
        automationId,
        action: 'run',
        details: errorMessage,
        executionTime
      },
      { status: 500 }
    )
  }
}
