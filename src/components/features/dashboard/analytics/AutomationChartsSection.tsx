// src/components/dashboard/AutomationChartsSection.tsx
'use client'

import { EnhancedPerformanceTrendChart } from '@/components/features/dashboard/charts/EnhancedPerformanceTrendChart'
import { EnhancedStatusDistributionChart } from '@/components/features/dashboard/charts/EnhancedStatusDistributionChart'
import type { Automation } from '@/lib/data/repositories/automation-repository'

interface AutomationChartsSectionProps {
  stats: {
    total: number
    running: number
    stopped: number
    error: number
    stalled: number
    avgSuccessRate: number
    avgDuration: number
  }
  automations: Automation[]
}

export function AutomationChartsSection({ stats, automations }: AutomationChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Enhanced Performance Trend Chart */}
      <EnhancedPerformanceTrendChart automations={automations} />
      
      {/* Enhanced Status Distribution Chart */}
      <EnhancedStatusDistributionChart stats={stats} />
    </div>
  )
}
