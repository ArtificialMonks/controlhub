// src/lib/repositories/automation-repository.ts
/**
 * Automation Repository Layer
 * Provides data access abstraction for automation-related operations
 * Implements Quest 1.3 requirement for Repository Layer usage
 */

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import {
  Automation,
  AutomationRun,
  CreateAutomationRunRequest,
  UpdateAutomationRequest,
  AutomationMetrics,
  RepositoryError,
  AutomationNotFoundError
} from '@/lib/types/webhook-types'

// ============================================================================
// AUTOMATION REPOSITORY CLASS
// ============================================================================

export class AutomationRepository {
  /**
   * Get Supabase client
   */
  private async getClient() {
    return await createClient()
  }

  // ==========================================================================
  // AUTOMATION OPERATIONS
  // ==========================================================================

  /**
   * Get all automations for a user
   * Implements Quest 1.5 requirement for real-time data display
   */
  async getAllAutomations(userId: string): Promise<Automation[]> {
    try {
      const supabase = await this.getClient()

      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new RepositoryError(
          `Failed to fetch automations: ${error.message}`,
          'getAllAutomations',
          { userId, error }
        )
      }

      return data as Automation[] || []
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error
      }
      throw new RepositoryError(
        'Unexpected error fetching automations',
        'getAllAutomations',
        { userId, error }
      )
    }
  }

  /**
   * Get automation by ID
   */
  async getAutomationById(automationId: string): Promise<Automation | null> {
    try {
      const supabase = await this.getClient()
      
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('id', automationId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Not found
        }
        throw new RepositoryError(
          `Failed to fetch automation: ${error.message}`,
          'getAutomationById',
          { automationId, error }
        )
      }

      return data as Automation
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error
      }
      throw new RepositoryError(
        'Unexpected error fetching automation',
        'getAutomationById',
        { automationId, error }
      )
    }
  }

  /**
   * Update automation status and metrics
   */
  async updateAutomation(request: UpdateAutomationRequest): Promise<Automation> {
    try {
      const supabase = await this.getClient()
      
      // First verify automation exists
      const automation = await this.getAutomationById(request.automation_id)
      if (!automation) {
        throw new AutomationNotFoundError(request.automation_id)
      }

      const updateData: Partial<Automation> = {
        updated_at: new Date().toISOString()
      }

      if (request.last_run_at) {
        updateData.last_run_at = request.last_run_at
      }
      if (request.last_run_status) {
        updateData.last_run_status = request.last_run_status
      }
      if (request.run_count !== undefined) {
        updateData.run_count = request.run_count
      }
      if (request.error_count !== undefined) {
        updateData.error_count = request.error_count
      }
      if (request.success_rate !== undefined) {
        updateData.success_rate = request.success_rate
      }

      const { data, error } = await supabase
        .from('automations')
        .update(updateData)
        .eq('id', request.automation_id)
        .select()
        .single()

      if (error) {
        throw new RepositoryError(
          `Failed to update automation: ${error.message}`,
          'updateAutomation',
          { request, error }
        )
      }

      return data as Automation
    } catch (error) {
      if (error instanceof RepositoryError || error instanceof AutomationNotFoundError) {
        throw error
      }
      throw new RepositoryError(
        'Unexpected error updating automation',
        'updateAutomation',
        { request, error }
      )
    }
  }

  // ==========================================================================
  // AUTOMATION RUN OPERATIONS
  // ==========================================================================

  /**
   * Create new automation run record
   */
  async createAutomationRun(request: CreateAutomationRunRequest): Promise<AutomationRun> {
    try {
      const supabase = await this.getClient()
      
      // Verify automation exists
      const automation = await this.getAutomationById(request.automation_id)
      if (!automation) {
        throw new AutomationNotFoundError(request.automation_id)
      }

      const runData = {
        automation_id: request.automation_id,
        user_id: request.user_id,
        execution_id: request.execution_id,
        status: request.status,
        duration_ms: request.duration_ms,
        error_message: request.error_message,
        started_at: request.started_at || new Date().toISOString(),
        completed_at: request.completed_at,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('automation_runs')
        .insert(runData)
        .select()
        .single()

      if (error) {
        throw new RepositoryError(
          `Failed to create automation run: ${error.message}`,
          'createAutomationRun',
          { request, error }
        )
      }

      return data as AutomationRun
    } catch (error) {
      if (error instanceof RepositoryError || error instanceof AutomationNotFoundError) {
        throw error
      }
      throw new RepositoryError(
        'Unexpected error creating automation run',
        'createAutomationRun',
        { request, error }
      )
    }
  }

  /**
   * Get automation runs for a specific automation
   */
  async getAutomationRuns(
    automationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AutomationRun[]> {
    try {
      const supabase = await this.getClient()
      
      const { data, error } = await supabase
        .from('automation_runs')
        .select('*')
        .eq('automation_id', automationId)
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw new RepositoryError(
          `Failed to fetch automation runs: ${error.message}`,
          'getAutomationRuns',
          { automationId, limit, offset, error }
        )
      }

      return data as AutomationRun[]
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error
      }
      throw new RepositoryError(
        'Unexpected error fetching automation runs',
        'getAutomationRuns',
        { automationId, limit, offset, error }
      )
    }
  }

  // ==========================================================================
  // METRICS AND ANALYTICS
  // ==========================================================================

  /**
   * Calculate and get automation metrics
   */
  async getAutomationMetrics(automationId: string): Promise<AutomationMetrics> {
    try {
      const supabase = await this.getClient()
      
      // Get automation basic info
      const automation = await this.getAutomationById(automationId)
      if (!automation) {
        throw new AutomationNotFoundError(automationId)
      }

      // Get run statistics
      const { data: stats, error: statsError } = await supabase
        .from('automation_runs')
        .select('status, duration_ms')
        .eq('automation_id', automationId)

      if (statsError) {
        throw new RepositoryError(
          `Failed to fetch automation statistics: ${statsError.message}`,
          'getAutomationMetrics',
          { automationId, error: statsError }
        )
      }

      const totalRuns = stats.length
      const successfulRuns = stats.filter(run => run.status === 'success').length
      const failedRuns = stats.filter(run => run.status === 'error').length
      const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0
      
      const durations = stats
        .filter(run => run.duration_ms !== null)
        .map(run => run.duration_ms)
      const averageDurationMs = durations.length > 0 
        ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
        : 0

      return {
        total_runs: totalRuns,
        successful_runs: successfulRuns,
        failed_runs: failedRuns,
        success_rate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
        average_duration_ms: Math.round(averageDurationMs),
        last_run_at: automation.last_run_at,
        last_run_status: automation.last_run_status
      }
    } catch (error) {
      if (error instanceof RepositoryError || error instanceof AutomationNotFoundError) {
        throw error
      }
      throw new RepositoryError(
        'Unexpected error calculating automation metrics',
        'getAutomationMetrics',
        { automationId, error }
      )
    }
  }

  /**
   * Update automation metrics based on latest run data
   */
  async updateAutomationMetrics(automationId: string): Promise<Automation> {
    try {
      const metrics = await this.getAutomationMetrics(automationId)
      
      return await this.updateAutomation({
        automation_id: automationId,
        run_count: metrics.total_runs,
        error_count: metrics.failed_runs,
        success_rate: metrics.success_rate
      })
    } catch (error) {
      if (error instanceof RepositoryError || error instanceof AutomationNotFoundError) {
        throw error
      }
      throw new RepositoryError(
        'Unexpected error updating automation metrics',
        'updateAutomationMetrics',
        { automationId, error }
      )
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const automationRepository = new AutomationRepository()
