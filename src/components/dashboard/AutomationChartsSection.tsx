// src/components/dashboard/AutomationChartsSection.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { StatusDistributionChart } from '@/components/automations/statistics/StatusDistributionChart'
import { PerformanceTrendChart } from '@/components/automations/statistics/PerformanceTrendChart'
import { Calendar, TrendingUp } from 'lucide-react'
import type { Automation } from '@/lib/repositories/automation-repository'

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
  // Calculate trend data
  const currentMonth = new Date().toLocaleString('default', { month: 'short', year: 'numeric' })
  const trendPercentage = 24.8 // Mock trend percentage

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Performance Trend Chart */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-0 bg-card/50 backdrop-blur-sm h-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">Completed Automations Over Time</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                <Calendar className="h-3 w-3 mr-1" />
                {currentMonth}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trend summary */}
            <div className="flex items-center gap-4 mb-4">
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {stats.running + stats.stopped}
                </p>
                <p className="text-sm text-muted-foreground">Total Completed</p>
              </div>
              <div className="flex items-center gap-1 text-green-500">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">{trendPercentage}%</span>
              </div>
            </div>
            
            {/* Chart */}
            <div className="h-64">
              <PerformanceTrendChart automations={automations} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 bg-card/50 backdrop-blur-sm h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Status Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">
              Current automation status breakdown
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Success rate highlight */}
            <div className="text-center mb-6">
              <div className="relative inline-flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl font-bold text-foreground mb-1">
                    {Math.round(stats.avgSuccessRate)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Success Rate
                  </p>
                </div>
              </div>
            </div>
            
            {/* Chart */}
            <div className="h-48">
              <StatusDistributionChart stats={stats} />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-muted-foreground">Running ({stats.running})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-muted-foreground">Stopped ({stats.stopped})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-muted-foreground">Error ({stats.error})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span className="text-sm text-muted-foreground">Stalled ({stats.stalled})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
