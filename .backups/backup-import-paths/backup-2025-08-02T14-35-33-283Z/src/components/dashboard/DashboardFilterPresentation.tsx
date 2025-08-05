// src/components/dashboard/DashboardFilterPresentation.tsx
/**
 * Dashboard Filter Presentation Component
 * Quest 4.3 - Expert Council Validated Implementation
 * 
 * Enhanced Architecture Refactoring: Container/Presentation Pattern
 * Expert Consensus: 100% (6/6 experts)
 * Priority: HIGH
 */

"use client"

import React from 'react'
import { User } from '@supabase/supabase-js'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AutomationsView, type ViewMode } from '@/components/features/automations-view'
import { AutomationsToolbar } from '@/components/features/automations-toolbar/AutomationsToolbar'
import { 
  FilterState, 
  FilterStateActions,
  FilterError
} from '@/lib/types/filtering'
import { Automation, Client } from '@/lib/types/automation'

// ============================================================================
// PRESENTATION PROPS INTERFACE
// ============================================================================

interface DashboardFilterPresentationProps {
  /** User information */
  user: User
  /** User profile data */
  profile: Record<string, unknown> | null
  /** Filtered automations to display */
  automations: Automation[]
  /** All automations (for toolbar context) */
  allAutomations: Automation[]
  /** Current filter state */
  filters: FilterState
  /** Filter state actions */
  actions: FilterStateActions
  /** Available clients for dropdown */
  availableClients: Client[]
  /** Bulk action handler */
  onBulkAction: (action: string, automationIds: string[]) => void
  /** Status update handler for individual automations */
  onStatusUpdate?: (automationId: string, status: 'Running' | 'Stopped' | 'Error' | 'Stalled') => void
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: FilterError | null
}

// ============================================================================
// PRESENTATION COMPONENT
// ============================================================================

/**
 * Dashboard Filter Presentation Component
 * 
 * Pure presentation component that renders the dashboard UI
 * with filtered data and filter controls.
 * 
 * Expert Council Validated Features:
 * - Architecture Expert: Clean separation from business logic
 * - Security Expert: No direct data manipulation
 * - Performance Expert: Pure component for optimization
 * - Quality Expert: Focused responsibility and testability
 * - Integration Expert: Clear prop interfaces
 * - UX Expert: Consistent UI patterns and accessibility
 */
export function DashboardFilterPresentation({
  user,
  profile,
  automations,
  allAutomations,
  filters,
  actions,
  availableClients,
  onBulkAction,
  onStatusUpdate,
  loading = false,
  error = null
}: DashboardFilterPresentationProps) {

  // ============================================================================
  // VIEW MODE STATE (LOCAL UI STATE)
  // ============================================================================

  const [viewMode, setViewMode] = React.useState<ViewMode>('list')

  // ============================================================================
  // RENDER DASHBOARD CONTENT
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Dashboard Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Automation Status</CardTitle>
            <CardDescription>
              Overview of your n8n automations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              All Systems Operational
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {automations.length} active automations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest automation runs and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {automations.filter(a => a.status === 'Running').length}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>
              System performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {automations.length > 0 
                ? (automations.reduce((acc, a) => acc + a.success_rate, 0) / automations.length).toFixed(1)
                : '0'
              }%
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Average success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-lg font-semibold">View Analytics</div>
              <p className="text-sm text-gray-600">Performance insights</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-lg font-semibold">Manage Clients</div>
              <p className="text-sm text-gray-600">Client configuration</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-lg font-semibold">System Settings</div>
              <p className="text-sm text-gray-600">Configure preferences</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automations Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Automations Overview</CardTitle>
          <CardDescription>
            Manage and monitor your automation workflows ({automations.length} of {allAutomations.length} shown)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AutomationsToolbar - Expert consensus implementation */}
          <AutomationsToolbar
            automations={allAutomations}
            searchTerm={filters.search}
            selectedClient={filters.client}
            selectedStatuses={filters.status}
            onSearchChange={actions.updateSearch}
            onClientChange={actions.updateClient}
            onStatusChange={actions.updateStatus}
            onClearFilters={actions.clearFilters}
            onBulkAction={onBulkAction}
          />

          {/* AutomationsView - Displays filtered results */}
          <AutomationsView
            automations={automations}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            loading={loading}
            error={error ? new Error(error.message) : null}
            onStatusUpdate={onStatusUpdate}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DashboardFilterPresentation
