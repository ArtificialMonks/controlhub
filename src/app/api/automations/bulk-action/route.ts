// src/app/api/automations/bulk-action/route.ts
/**
 * Bulk Automation Actions API Endpoint
 * Quest 2.5: Bulk Actions with Throttling
 * 
 * Expert Council Validated Implementation:
 * - Simplified MVP approach for Vercel serverless limits
 * - Batch size: 50 automations (reduced from 200)
 * - Delay: 30 seconds (reduced from 4 minutes)
 * - Maximum execution time: ~5 minutes (within Vercel limits)
 * - Comprehensive error handling and progress tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/dal'
import { AutomationRepository } from '@/lib/repositories/automation-repository'
import { n8nWebhookService } from '@/lib/services/n8n-webhook-service'
import { auditLogger } from '@/lib/services/audit-logger'
import type { User } from '@supabase/supabase-js'

/**
 * Bulk action result interface
 */
interface BulkActionItemResult {
  id: string
  success: boolean
  result?: {
    webhookTriggered: boolean
    webhookStatus: number
    executionId?: string
  }
  error?: string
  timestamp: string
}

/**
 * POST /api/automations/bulk-action
 * Execute bulk actions (run/stop) on multiple automations
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let processedCount = 0
  let session: User | null = null

  try {
    // 1. Authentication Layer
    session = await verifySession()
    if (!session) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          action: 'bulk-action'
        },
        { status: 401 }
      )
    }

    // 2. Input Validation
    const body = await request.json()
    const { action, automationIds } = body

    if (!['run', 'stop'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Must be "run" or "stop"',
          action: 'bulk-action'
        },
        { status: 400 }
      )
    }

    if (!Array.isArray(automationIds) || automationIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid automationIds. Must be a non-empty array',
          action: 'bulk-action'
        },
        { status: 400 }
      )
    }

    // 3. MVP Batch Size Limitation
    if (automationIds.length > 50) {
      return NextResponse.json(
        {
          success: false,
          error: 'Batch size limited to 50 automations for MVP. Contact support for larger batches.',
          action: 'bulk-action',
          details: {
            requested: automationIds.length,
            maximum: 50,
            productionEnhancement: 'Database job queue with background processing available for production'
          }
        },
        { status: 400 }
      )
    }

    // 4. Process Bulk Action
    const results = await processBulkAction(action, automationIds, session.id)
    processedCount = results.length

    // 5. Generate Summary
    const summary = {
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      processingTime: new Date().toISOString()
    }

    // 6. Audit Logging
    await auditLogger.logSystemAction(
      session.id,
      `bulk_${action}`,
      'automation',
      `bulk-${automationIds.length}`,
      summary.successful > 0,
      {
        totalRequested: automationIds.length,
        successful: summary.successful,
        failed: summary.failed,
        executionTime: Date.now() - startTime
      }
    )

    // 7. Success Response
    return NextResponse.json({
      success: true,
      action,
      totalRequested: automationIds.length,
      results,
      summary,
      executionTime: Date.now() - startTime,
      mvpLimitations: {
        maxBatchSize: 50,
        batchDelay: 30000,
        productionEnhancement: 'Background processing with job queue available'
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const executionTime = Date.now() - startTime

    // Error logging
    console.error('Bulk action error:', {
      error: errorMessage,
      processedCount,
      executionTime,
      userId: session?.id,
      timestamp: new Date().toISOString()
    })

    // Audit logging for errors
    if (session) {
      await auditLogger.logSystemAction(
        session.id,
        'bulk_action_error',
        'automation',
        'bulk-error',
        false,
        { error: errorMessage, processedCount, executionTime }
      ).catch(auditError => {
        console.error('Audit logging failed:', auditError)
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Bulk action failed',
        details: errorMessage,
        processedCount,
        executionTime
      },
      { status: 500 }
    )
  }
}

/**
 * Process bulk action with simplified MVP approach
 */
async function processBulkAction(
  action: 'run' | 'stop',
  automationIds: string[],
  userId: string
): Promise<BulkActionItemResult[]> {
  const results: BulkActionItemResult[] = []
  const automationRepository = new AutomationRepository()
  
  // MVP Configuration
  const batchSize = 10 // Process 10 at a time
  const delay = 30000 // 30 seconds between batches

  console.log(`Starting bulk ${action} for ${automationIds.length} automations`, {
    batchSize,
    delay,
    userId,
    timestamp: new Date().toISOString()
  })

  // Process in batches
  for (let i = 0; i < automationIds.length; i += batchSize) {
    const batch = automationIds.slice(i, i + batchSize)
    const batchNumber = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(automationIds.length / batchSize)

    console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} automations)`)

    // Process batch in parallel
    const batchPromises = batch.map(async (id) => {
      try {
        // Get automation details
        const automation = await automationRepository.getAutomationById(id)
        if (!automation) {
          return {
            id,
            success: false,
            error: 'Automation not found',
            timestamp: new Date().toISOString()
          }
        }

        // Authorization check (user-based for current implementation)
        if (automation.user_id !== userId) {
          return {
            id,
            success: false,
            error: 'Unauthorized access to automation',
            timestamp: new Date().toISOString()
          }
        }

        // Get webhook URL
        const webhookUrl = action === 'run' 
          ? automation.n8n_run_webhook_url 
          : automation.n8n_stop_webhook_url

        if (!webhookUrl) {
          return {
            id,
            success: false,
            error: `No ${action} webhook URL configured`,
            timestamp: new Date().toISOString()
          }
        }

        // Trigger webhook
        const webhookResult = action === 'run'
          ? await n8nWebhookService.triggerRun(webhookUrl)
          : await n8nWebhookService.triggerStop(webhookUrl)

        // Update automation status
        await automationRepository.updateAutomation({
          automation_id: id,
          last_run_at: action === 'run' ? new Date().toISOString() : undefined,
          last_run_status: action === 'run' ? 'running' : 'cancelled'
        })

        return {
          id,
          success: true,
          result: {
            webhookTriggered: true,
            webhookStatus: webhookResult.status,
            executionId: webhookResult.data?.executionId as string
          },
          timestamp: new Date().toISOString()
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Bulk ${action} failed for automation ${id}:`, errorMessage)
        
        return {
          id,
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString()
        }
      }
    })

    // Wait for batch to complete
    const batchResults = await Promise.allSettled(batchPromises)
    const processedBatchResults = batchResults.map(result => 
      result.status === 'fulfilled' ? result.value : {
        id: 'unknown',
        success: false,
        error: 'Promise rejected',
        timestamp: new Date().toISOString()
      }
    )

    results.push(...processedBatchResults)

    // Add delay between batches (except for last batch)
    if (i + batchSize < automationIds.length) {
      console.log(`Waiting ${delay}ms before next batch...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  console.log(`Bulk ${action} completed:`, {
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  })

  return results
}
