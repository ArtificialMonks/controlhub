/**
 * TypeScript interfaces for automation data
 * Aligned with Architecture Document schema requirements for Quest 1.4
 */

/**
 * Automation status enum matching Architecture Document CHECK constraint
 */
export type AutomationStatus = 'Running' | 'Stopped' | 'Error' | 'Stalled'

/**
 * Automation run status enum matching Architecture Document CHECK constraint
 */
export type AutomationRunStatus = 'success' | 'error'

/**
 * Client interface matching Architecture Document schema
 */
export interface Client {
  id: string
  name: string
  created_at: string
}

/**
 * Profile interface matching Architecture Document schema
 */
export interface Profile {
  id: string
  client_id: string | null
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'user'
}

/**
 * Automation interface matching Architecture Document schema exactly
 */
export interface Automation {
  id: string
  client_id: string
  name: string
  status: AutomationStatus
  last_run_at: string | null
  avg_duration_ms: number | null
  success_rate: number
  n8n_run_webhook_url: string
  n8n_stop_webhook_url: string | null
}

/**
 * Automation run interface matching Architecture Document schema exactly
 */
export interface AutomationRun {
  id: number
  automation_id: string
  started_at: string
  completed_at: string | null
  duration_ms: number | null
  status: AutomationRunStatus
  error_message: string | null
}

/**
 * Extended automation interface with client information for UI display
 */
export interface AutomationWithClient extends Automation {
  client: Client
}

/**
 * Automation table row data interface for UI components
 */
export interface AutomationTableRow {
  id: string
  name: string
  client: string
  status: AutomationStatus
  lastRun: string | null
  avgDuration: string | null
  successRate: string
}

/**
 * Mock data interface for testing and development
 */
export interface MockAutomationData {
  automations: Automation[]
  clients: Client[]
  profiles: Profile[]
  automationRuns: AutomationRun[]
}

/**
 * Status badge variant mapping for UI components
 */
export const STATUS_VARIANTS = {
  Running: 'success' as const,
  Stopped: 'secondary' as const,
  Error: 'destructive' as const,
  Stalled: 'warning' as const,
} as const

/**
 * Status colors matching UI specifications
 */
export const STATUS_COLORS = {
  Running: '#22c55e', // Success green
  Stopped: '#9ca3af', // Neutral gray
  Error: '#ef4444',   // Error red
  Stalled: '#FAAD14', // Warning yellow
} as const

/**
 * Utility type for automation table column definitions
 */
export interface AutomationTableColumn {
  key: keyof AutomationTableRow
  label: string
  sortable: boolean
  width?: string
}

/**
 * Default table columns configuration
 */
export const DEFAULT_AUTOMATION_COLUMNS: AutomationTableColumn[] = [
  { key: 'name', label: 'Automation Name', sortable: true },
  { key: 'client', label: 'Client', sortable: true },
  { key: 'status', label: 'Status', sortable: true, width: '120px' },
  { key: 'lastRun', label: 'Last Run', sortable: true, width: '150px' },
  { key: 'avgDuration', label: 'Avg Duration', sortable: true, width: '120px' },
  { key: 'successRate', label: 'Success Rate', sortable: true, width: '120px' },
]
