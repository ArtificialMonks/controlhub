// src/lib/repositories/automation-repository.ts
/**
 * Automation Repository Layer
 * Provides data access abstraction for automation-related operations
 * Implements Quest 1.3 requirement for Repository Layer usage
 */

import 'server-only'
import { createClient } from '@/lib/supabase/server'
// Updated type definitions to match actual database schema
export interface Automation {
  id: string
  user_id: string
  client_id: string
  name: string
  status: 'Running' | 'Stopped' | 'Error' | 'Stalled'
  last_run_at: string | null
  avg_duration_ms: number | null
  success_rate: number
  n8n_run_webhook_url: string
  n8n_stop_webhook_url: string | null
  created_at?: string
  updated_at?: string
}

export interface AutomationRun {
  id: number
  automation_id: string
  started_at: string
  completed_at?: string
  duration_ms?: number
  status: 'success' | 'error'
  error_message?: string
}

export interface CreateAutomationRunRequest {
  automation_id: string
  status: 'success' | 'error'
  duration_ms?: number
  error_message?: string
  started_at?: string
  completed_at?: string
}

export interface UpdateAutomationRequest {
  automation_id: string
  last_run_at?: string
  avg_duration_ms?: number
  success_rate?: number
  status?: 'Running' | 'Stopped' | 'Error' | 'Stalled'
}

export interface AutomationMetrics {
  total_runs: number
  successful_runs: number
  failed_runs: number
  success_rate: number
  average_duration_ms: number
  last_run_at?: string
  last_run_status?: string
}

export class RepositoryError extends Error {
  constructor(
    message: string,
    public operation: string,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'RepositoryError'
  }
}

export class AutomationNotFoundError extends Error {
  constructor(automationId: string) {
    super(`Automation not found: ${automationId}`)
    this.name = 'AutomationNotFoundError'
  }
}

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

      // Query automations through clients table since automations.client_id -> clients.user_id
      const { data, error } = await supabase
        .from('automations')
        .select(`
          *,
          clients!inner(
            user_id,
            name
          )
        `)
        .eq('clients.user_id', userId)
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
  async updateAutomation(automationId: string, userId: string, updateData: Partial<Automation>): Promise<Automation> {
    try {
      const supabase = await this.getClient()
      
      // First verify automation exists and belongs to user through client relationship
      const { data: automationCheck, error: checkError } = await supabase
        .from('automations')
        .select(`
          *,
          clients!inner(user_id)
        `)
        .eq('id', automationId)
        .eq('clients.user_id', userId)
        .single()

      if (checkError || !automationCheck) {
        throw new AutomationNotFoundError(automationId)
      }

      const finalUpdateData = {
        ...updateData,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('automations')
        .update(finalUpdateData)
        .eq('id', automationId)
        .select()
        .single()

      if (error) {
        throw new RepositoryError(
          `Failed to update automation: ${error.message}`,
          'updateAutomation',
          { automationId, userId, updateData, error }
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
        { automationId, userId, updateData, error }
      )
    }
  }

  // CREATE AUTOMATION REMOVED - Automations are managed externally

  // DELETE AUTOMATION REMOVED - Automations are managed externally

  /**
   * Update automation status
   */
  async updateAutomationStatus(automationId: string, userId: string, status: 'Running' | 'Stopped' | 'Error' | 'Stalled'): Promise<Automation> {
    return this.updateAutomation(automationId, userId, { status })
  }

  /**
   * Create automation run record
   */
  async createAutomationRun(data: CreateAutomationRunRequest): Promise<AutomationRun> {
    try {
      const supabase = await this.getClient()
      
      const { data: run, error } = await supabase
        .from('automation_runs')
        .insert(data)
        .select()
        .single()
      
      if (error) {
        throw new RepositoryError(
          `Failed to create automation run: ${error.message}`,
          'createAutomationRun',
          { data, error }
        )
      }
      
      return run as AutomationRun
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error
      }
      throw new RepositoryError(
        'Unexpected error creating automation run',
        'createAutomationRun',
        { data, error }
      )
    }
  }

  /**
   * Update automation metrics based on runs
   */
  async updateAutomationMetrics(automationId: string, data: UpdateAutomationRequest): Promise<Automation> {
    try {
      const supabase = await this.getClient()
      
      const { data: automation, error } = await supabase
        .from('automations')
        .update(data)
        .eq('id', automationId)
        .select()
        .single()
      
      if (error) {
        throw new RepositoryError(
          `Failed to update automation metrics: ${error.message}`,
          'updateAutomationMetrics',
          { automationId, data, error }
        )
      }
      
      return automation as Automation
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error
      }
      throw new RepositoryError(
        'Unexpected error updating automation metrics',
        'updateAutomationMetrics',
        { automationId, data, error }
      )
    }
  }


  /**
   * Record an automation run execution
   */
  async recordAutomationRun(automationId: string, durationMs: number, success: boolean): Promise<void> {
    try {
      const supabase = await this.getClient()
      
      const runData = {
        automation_id: automationId,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        status: success ? 'success' as const : 'error' as const
      }

      const { error } = await supabase
        .from('automation_runs')
        .insert(runData)

      if (error) {
        console.error('Failed to record automation run:', error)
        // Don't throw error as this is non-critical logging
      }
    } catch (error) {
      console.error('Failed to record automation run:', error)
      // Don't throw error as this is non-critical logging
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

      // Get run statistics from automation_runs table
      const { data: runs, error } = await supabase
        .from('automation_runs')
        .select('status, duration_ms')
        .eq('automation_id', automationId)

      if (error) {
        throw new RepositoryError(
          `Failed to fetch automation runs: ${error.message}`,
          'getAutomationMetrics',
          { automationId, error }
        )
      }

      const totalRuns = runs?.length || 0
      const successfulRuns = runs?.filter(run => run.status === 'success').length || 0
      const failedRuns = runs?.filter(run => run.status === 'error').length || 0
      const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : automation.success_rate
      const avgDuration = runs?.length ? 
        runs.reduce((sum, run) => sum + (run.duration_ms || 0), 0) / runs.length :
        automation.avg_duration_ms || 0

      return {
        total_runs: totalRuns,
        successful_runs: successfulRuns,
        failed_runs: failedRuns,
        success_rate: Math.round(successRate * 100) / 100,
        average_duration_ms: Math.round(avgDuration),
        last_run_at: automation.last_run_at || undefined
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
   * Get automations by status
   */
  async getAutomationsByStatus(userId: string, status: 'Running' | 'Stopped' | 'Error' | 'Stalled'): Promise<Automation[]> {
    try {
      const supabase = await this.getClient()
      
      const { data, error } = await supabase
        .from('automations')
        .select(`
          *,
          clients!inner(user_id, name)
        `)
        .eq('clients.user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new RepositoryError(
          `Failed to fetch automations by status: ${error.message}`,
          'getAutomationsByStatus',
          { userId, status, error }
        )
      }
      
      return data as Automation[] || []
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error
      }
      throw new RepositoryError(
        'Unexpected error fetching automations by status',
        'getAutomationsByStatus',
        { userId, status, error }
      )
    }
  }

  /**
   * Get automations by client name
   */
  async getAutomationsByClient(userId: string, clientName: string): Promise<Automation[]> {
    try {
      const supabase = await this.getClient()
      
      const { data, error } = await supabase
        .from('automations')
        .select(`
          *,
          clients!inner(user_id, name)
        `)
        .eq('clients.user_id', userId)
        .eq('clients.name', clientName)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new RepositoryError(
          `Failed to fetch automations by client: ${error.message}`,
          'getAutomationsByClient',
          { userId, clientName, error }
        )
      }
      
      return data as Automation[] || []
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error
      }
      throw new RepositoryError(
        'Unexpected error fetching automations by client',
        'getAutomationsByClient',
        { userId, clientName, error }
      )
    }
  }

  /**
   * Search automations
   */
  async searchAutomations(userId: string, query: string): Promise<Automation[]> {
    try {
      const supabase = await this.getClient()
      
      const { data, error } = await supabase
        .from('automations')
        .select(`
          *,
          clients!inner(user_id, name)
        `)
        .eq('clients.user_id', userId)
        .or(`name.ilike.%${query}%,clients.name.ilike.%${query}%`)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new RepositoryError(
          `Failed to search automations: ${error.message}`,
          'searchAutomations',
          { userId, query, error }
        )
      }
      
      return data as Automation[] || []
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error
      }
      throw new RepositoryError(
        'Unexpected error searching automations',
        'searchAutomations',
        { userId, query, error }
      )
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const automationRepository = new AutomationRepository()
