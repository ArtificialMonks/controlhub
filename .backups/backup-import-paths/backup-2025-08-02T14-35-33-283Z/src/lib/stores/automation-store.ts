// src/lib/stores/automation-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Automation {
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
  status: 'draft' | 'active' | 'paused' | 'error' | 'archived'
  is_enabled: boolean
  last_run_at?: string
  last_run_status?: 'success' | 'error' | 'running' | 'cancelled'
  run_count: number
  error_count: number
  success_rate: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

interface AutomationRun {
  id: string
  automation_id: string
  user_id: string
  execution_id?: string
  status: 'running' | 'success' | 'error' | 'cancelled' | 'timeout'
  trigger_data: Record<string, unknown>
  workflow_name?: string
  started_at: string
  completed_at?: string
  duration_ms?: number
  error_message?: string
  error_details?: Record<string, unknown>
  output_data: Record<string, unknown>
  metadata: Record<string, unknown>
  created_at: string
}

interface AutomationState {
  automations: Automation[]
  recentRuns: AutomationRun[]
  selectedAutomation: Automation | null
  isLoading: boolean
  
  // Actions
  setAutomations: (automations: Automation[]) => void
  addAutomation: (automation: Automation) => void
  updateAutomation: (id: string, updates: Partial<Automation>) => void
  deleteAutomation: (id: string) => void
  setSelectedAutomation: (automation: Automation | null) => void
  setRecentRuns: (runs: AutomationRun[]) => void
  addRun: (run: AutomationRun) => void
  setLoading: (loading: boolean) => void
  
  // Computed getters
  getActiveAutomations: () => Automation[]
  getAutomationsByType: (type: string) => Automation[]
  getRunsForAutomation: (automationId: string) => AutomationRun[]
}

export const useAutomationStore = create<AutomationState>()(
  persist(
    (set, get) => ({
      automations: [],
      recentRuns: [],
      selectedAutomation: null,
      isLoading: false,

      setAutomations: (automations) => {
        set({ automations })
      },

      addAutomation: (automation) => {
        set((state) => ({
          automations: [...state.automations, automation]
        }))
      },

      updateAutomation: (id, updates) => {
        set((state) => ({
          automations: state.automations.map((automation) =>
            automation.id === id
              ? { ...automation, ...updates, updated_at: new Date().toISOString() }
              : automation
          )
        }))
      },

      deleteAutomation: (id) => {
        set((state) => ({
          automations: state.automations.filter((automation) => automation.id !== id),
          selectedAutomation: state.selectedAutomation?.id === id ? null : state.selectedAutomation
        }))
      },

      setSelectedAutomation: (automation) => {
        set({ selectedAutomation: automation })
      },

      setRecentRuns: (recentRuns) => {
        set({ recentRuns })
      },

      addRun: (run) => {
        set((state) => ({
          recentRuns: [run, ...state.recentRuns.slice(0, 49)] // Keep last 50 runs
        }))
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      // Computed getters
      getActiveAutomations: () => {
        return get().automations.filter((automation) => automation.status === 'active')
      },

      getAutomationsByType: (type) => {
        return get().automations.filter((automation) => automation.workflow_type === type)
      },

      getRunsForAutomation: (automationId) => {
        return get().recentRuns.filter((run) => run.automation_id === automationId)
      },
    }),
    {
      name: 'automation-storage',
      partialize: (state) => ({
        automations: state.automations,
        recentRuns: state.recentRuns,
        selectedAutomation: state.selectedAutomation,
      }),
    }
  )
)
