// src/lib/types/webhook-types.ts
/**
 * TypeScript interfaces for Quest 1.3: Backend Telemetry Endpoint
 * Defines types for webhook payload validation and automation data management
 */

import { z } from 'zod'

// ============================================================================
// WEBHOOK PAYLOAD INTERFACES
// ============================================================================

/**
 * Quest 1.3 Webhook Payload Schema
 * Simplified payload containing only essential completion data
 */
export const WebhookPayloadSchema = z.object({
  final_status: z.enum(['success', 'error'], {
    message: 'final_status must be either "success" or "error"'
  }),
  error_message: z.string().optional(),
  execution_time_ms: z.number().int().positive({
    message: 'execution_time_ms must be a positive integer'
  }),
  // Optional fields for enhanced functionality
  automation_id: z.string().optional(),
  execution_id: z.string().optional(),
  user_id: z.string().optional()
})

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>

/**
 * Webhook Response Interface
 */
export interface WebhookResponse {
  success: boolean
  message?: string
  automation_run_id?: string
  timestamp: string
}

/**
 * Webhook Error Response Interface
 */
export interface WebhookErrorResponse {
  error: string
  details?: string
  timestamp: string
  request_id?: string
}

// ============================================================================
// AUTOMATION DATA INTERFACES
// ============================================================================

/**
 * Automation Status Enum
 */
export type AutomationStatus = 'draft' | 'active' | 'paused' | 'error' | 'archived'

/**
 * Automation Run Status Enum
 */
export type AutomationRunStatus = 'running' | 'success' | 'error' | 'cancelled' | 'timeout'

/**
 * Automation Interface (matches database schema)
 */
export interface Automation {
  id: string
  user_id: string
  client_id?: string
  name: string
  description?: string
  workflow_type: 'data_sync' | 'notification' | 'reporting' | 'integration' | 'custom'
  n8n_workflow_id?: string
  configuration: Record<string, unknown>
  triggers: unknown[]
  actions: unknown[]
  status: AutomationStatus
  is_enabled: boolean
  last_run_at?: string
  last_run_status?: AutomationRunStatus
  run_count: number
  error_count: number
  success_rate: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

/**
 * Automation Run Interface (matches database schema)
 */
export interface AutomationRun {
  id: string
  automation_id: string
  user_id: string
  execution_id?: string
  status: AutomationRunStatus
  trigger_data?: Record<string, unknown>
  workflow_name?: string
  started_at: string
  completed_at?: string
  duration_ms?: number
  error_message?: string
  error_details?: Record<string, unknown>
  output_data?: Record<string, unknown>
  metadata?: Record<string, unknown>
  created_at: string
}

// ============================================================================
// REPOSITORY LAYER INTERFACES
// ============================================================================

/**
 * Create Automation Run Request
 */
export interface CreateAutomationRunRequest {
  automation_id: string
  user_id: string
  execution_id?: string
  status: AutomationRunStatus
  duration_ms?: number
  error_message?: string
  started_at?: string
  completed_at?: string
}

/**
 * Update Automation Request
 */
export interface UpdateAutomationRequest {
  automation_id: string
  last_run_at?: string
  last_run_status?: AutomationRunStatus
  run_count?: number
  error_count?: number
  success_rate?: number
}

/**
 * Automation Metrics Interface
 */
export interface AutomationMetrics {
  total_runs: number
  successful_runs: number
  failed_runs: number
  success_rate: number
  average_duration_ms: number
  last_run_at?: string
  last_run_status?: AutomationRunStatus
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate webhook payload
 */
export function validateWebhookPayload(data: unknown): WebhookPayload {
  return WebhookPayloadSchema.parse(data)
}

/**
 * Check if payload is valid without throwing
 */
export function isValidWebhookPayload(data: unknown): data is WebhookPayload {
  try {
    WebhookPayloadSchema.parse(data)
    return true
  } catch {
    return false
  }
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Webhook Validation Error
 */
export class WebhookValidationError extends Error {
  constructor(
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'WebhookValidationError'
  }
}

/**
 * Automation Not Found Error
 */
export class AutomationNotFoundError extends Error {
  constructor(automationId: string) {
    super(`Automation not found: ${automationId}`)
    this.name = 'AutomationNotFoundError'
  }
}

/**
 * Repository Error
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public operation: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'RepositoryError'
  }
}
