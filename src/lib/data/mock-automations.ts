// src/lib/data/mock-automations.ts
/**
 * Mock data for automation testing and development
 * Aligned with Architecture Document schema requirements for Quest 1.4
 */

import {
  Automation,
  Client,
  Profile,
  AutomationRun,
  AutomationStatus
} from '@/lib/core/types/automation'

/**
 * Mock clients data
 */
export const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Acme Corporation',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'client-2', 
    name: 'TechStart Inc',
    created_at: '2024-02-01T14:30:00Z'
  },
  {
    id: 'client-3',
    name: 'Global Solutions Ltd',
    created_at: '2024-01-20T09:15:00Z'
  }
]

/**
 * Mock profiles data
 */
export const mockProfiles: Profile[] = [
  {
    id: 'user-1',
    client_id: 'client-1',
    full_name: 'John Smith',
    avatar_url: null,
    role: 'admin'
  },
  {
    id: 'user-2',
    client_id: 'client-2', 
    full_name: 'Sarah Johnson',
    avatar_url: null,
    role: 'user'
  },
  {
    id: 'user-3',
    client_id: 'client-3',
    full_name: 'Mike Chen',
    avatar_url: null,
    role: 'admin'
  }
]

/**
 * Mock automations data with all status types for testing
 */
export const mockAutomations: Automation[] = [
  {
    id: 'auto-1',
    user_id: 'user-1',
    client_id: 'client-1',
    name: 'Customer Data Sync',
    status: 'Running',
    last_run_at: '2024-07-31T08:30:00Z',
    avg_duration_ms: 2500,
    success_rate: 98.5,
    n8n_run_webhook_url: 'https://n8n.acme.com/webhook/run/customer-sync',
    n8n_stop_webhook_url: 'https://n8n.acme.com/webhook/stop/customer-sync',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-07-31T08:30:00Z'
  },
  {
    id: 'auto-2',
    user_id: 'user-1',
    client_id: 'client-1',
    name: 'Email Campaign Automation',
    status: 'Stopped',
    last_run_at: '2024-07-30T16:45:00Z',
    avg_duration_ms: 1800,
    success_rate: 95.2,
    n8n_run_webhook_url: 'https://n8n.acme.com/webhook/run/email-campaign',
    n8n_stop_webhook_url: 'https://n8n.acme.com/webhook/stop/email-campaign',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-07-30T16:45:00Z'
  },
  {
    id: 'auto-3',
    user_id: 'user-2',
    client_id: 'client-2',
    name: 'Inventory Management',
    status: 'Error',
    last_run_at: '2024-07-31T07:15:00Z',
    avg_duration_ms: 3200,
    success_rate: 87.3,
    n8n_run_webhook_url: 'https://n8n.techstart.com/webhook/run/inventory',
    n8n_stop_webhook_url: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-07-31T07:15:00Z'
  },
  {
    id: 'auto-4',
    user_id: 'user-2',
    client_id: 'client-2',
    name: 'Social Media Posting',
    status: 'Running',
    last_run_at: '2024-07-31T09:00:00Z',
    avg_duration_ms: 1200,
    success_rate: 99.1,
    n8n_run_webhook_url: 'https://n8n.techstart.com/webhook/run/social-media',
    n8n_stop_webhook_url: 'https://n8n.techstart.com/webhook/stop/social-media',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-07-31T09:00:00Z'
  },
  {
    id: 'auto-5',
    user_id: 'user-3',
    client_id: 'client-3',
    name: 'Financial Report Generation',
    status: 'Stalled',
    last_run_at: '2024-07-29T23:30:00Z',
    avg_duration_ms: 4500,
    success_rate: 92.8,
    n8n_run_webhook_url: 'https://n8n.global.com/webhook/run/financial-reports',
    n8n_stop_webhook_url: 'https://n8n.global.com/webhook/run/financial-reports',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-07-29T23:30:00Z'
  },
  {
    id: 'auto-6',
    user_id: 'user-3',
    client_id: 'client-3',
    name: 'Backup Automation',
    status: 'Running',
    last_run_at: '2024-07-31T06:00:00Z',
    avg_duration_ms: 8900,
    success_rate: 100.0,
    n8n_run_webhook_url: 'https://n8n.global.com/webhook/run/backup',
    n8n_stop_webhook_url: 'https://n8n.global.com/webhook/stop/backup',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-07-31T06:00:00Z'
  }
]

/**
 * Mock automation runs data
 */
export const mockAutomationRuns: AutomationRun[] = [
  {
    id: 1,
    automation_id: 'auto-1',
    started_at: '2024-07-31T08:30:00Z',
    completed_at: '2024-07-31T08:32:30Z',
    duration_ms: 2500,
    status: 'success',
    error_message: null
  },
  {
    id: 2,
    automation_id: 'auto-3',
    started_at: '2024-07-31T07:15:00Z',
    completed_at: '2024-07-31T07:18:12Z',
    duration_ms: 3200,
    status: 'error',
    error_message: 'Connection timeout to inventory API'
  },
  {
    id: 3,
    automation_id: 'auto-4',
    started_at: '2024-07-31T09:00:00Z',
    completed_at: '2024-07-31T09:01:12Z',
    duration_ms: 1200,
    status: 'success',
    error_message: null
  }
]

// Removed unused mockData export - individual exports are used instead

/**
 * Utility function to get automation with client information
 */
export function getAutomationsWithClients() {
  return mockAutomations.map(automation => ({
    ...automation,
    client: mockClients.find(client => client.id === automation.client_id)!
  }))
}

/**
 * Utility function to format duration for display
 */
export function formatDuration(ms: number | null): string {
  if (!ms) return 'N/A'
  
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

/**
 * Utility function to format last run time for display
 */
export function formatLastRun(timestamp: string | null): string {
  if (!timestamp) return 'Never'
  
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

/**
 * Utility function to get status-specific test data
 */
export function getAutomationsByStatus(status: AutomationStatus) {
  return mockAutomations.filter(automation => automation.status === status)
}
