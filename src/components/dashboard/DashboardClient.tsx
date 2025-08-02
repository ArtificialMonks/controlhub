// src/components/dashboard/DashboardClient.tsx
'use client'

import { Card } from '@/components/ui'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { MetricsCards } from '@/components/dashboard/MetricsCards'
import { AutomationProgressSection } from '@/components/dashboard/AutomationProgressSection'
import { AutomationChartsSection } from '@/components/dashboard/AutomationChartsSection'
import { RecentAutomationsTable } from '@/components/dashboard/RecentAutomationsTable'
import type { Automation } from '@/lib/repositories/automation-repository'

interface Client {
  id: string
  name: string
}

interface DashboardClientProps {
  automations: Automation[]
  clients: Client[]
  error: string | null
}

export function DashboardClient({ automations, clients, error }: DashboardClientProps) {
  // Calculate statistics from automation data
  const stats = {
    total: automations?.length || 0,
    running: automations?.filter(a => a.status === 'Running').length || 0,
    stopped: automations?.filter(a => a.status === 'Stopped').length || 0,
    error: automations?.filter(a => a.status === 'Error').length || 0,
    stalled: automations?.filter(a => a.status === 'Stalled').length || 0,
    avgSuccessRate: automations && automations.length > 0 
      ? automations.reduce((sum, a) => sum + (a.success_rate || 0), 0) / automations.length 
      : 0,
    avgDuration: automations && automations.length > 0
      ? automations.reduce((sum, a) => sum + (a.avg_duration_ms || 0), 0) / automations.length 
      : 0
  }

  const handleRefresh = () => {
    // Refresh functionality - could trigger a router refresh or API call
    window.location.reload()
  }

  return (
    <div className="h-full w-full">
      <div className="p-6 space-y-6 h-full overflow-auto">
        {/* Modern Dashboard Header */}
        <DashboardHeader onRefresh={handleRefresh} />

        {/* Error Display */}
        {error && (
          <Card className="p-6 border-destructive bg-destructive/5">
            <h3 className="text-lg font-semibold mb-2 text-destructive">Data Load Error</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </Card>
        )}

        {/* Key Metrics Cards */}
        <MetricsCards stats={stats} />

        {/* Automation Progress Section */}
        <AutomationProgressSection stats={stats} />

        {/* Charts Section */}
        <AutomationChartsSection stats={stats} automations={automations} />

        {/* Recent Automations Table */}
        <RecentAutomationsTable automations={automations} clients={clients} />
      </div>
    </div>
  )
}
