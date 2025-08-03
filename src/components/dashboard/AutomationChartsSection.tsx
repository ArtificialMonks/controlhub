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
        <Card className="border border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md hover:bg-white/10 dark:hover:bg-black/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 h-full group">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <TrendingUp className="h-5 w-5 text-primary drop-shadow-lg" />
                </motion.div>
                <CardTitle className="text-lg font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Completed Automations Over Time
                </CardTitle>
              </div>
              <Badge variant="secondary" className="bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10 text-primary hover:scale-105 transition-transform">
                <Calendar className="h-3 w-3 mr-1" />
                {currentMonth}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trend summary */}
            <div className="flex items-center gap-4 mb-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="p-3 rounded-lg bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10"
              >
                <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  {stats.running + stats.stopped}
                </p>
                <p className="text-sm text-muted-foreground">Total Completed</p>
              </motion.div>
              <motion.div 
                className="flex items-center gap-1 text-green-500 p-2 rounded-lg bg-green-500/10 border border-green-500/20"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">{trendPercentage}%</span>
              </motion.div>
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
        <Card className="border border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md hover:bg-white/10 dark:hover:bg-black/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 h-full group">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Status Distribution
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Current automation status breakdown
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Success rate highlight */}
            <div className="text-center mb-6">
              <motion.div 
                className="relative inline-flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <div className="text-center p-4 rounded-xl bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10">
                  <motion.p 
                    className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent mb-1"
                    animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    style={{ backgroundSize: "200% 100%" }}
                  >
                    {Math.round(stats.avgSuccessRate)}%
                  </motion.p>
                  <p className="text-sm text-muted-foreground">
                    Success Rate
                  </p>
                </div>
              </motion.div>
            </div>
            
            {/* Chart */}
            <div className="h-48">
              <StatusDistributionChart stats={stats} />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/30">
              <motion.div 
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 dark:hover:bg-black/20 transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/30"></div>
                <span className="text-sm text-muted-foreground">Running ({stats.running})</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 dark:hover:bg-black/20 transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/30"></div>
                <span className="text-sm text-muted-foreground">Stopped ({stats.stopped})</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 dark:hover:bg-black/20 transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/30"></div>
                <span className="text-sm text-muted-foreground">Error ({stats.error})</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 dark:hover:bg-black/20 transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <div className="w-3 h-3 rounded-full bg-gray-500 shadow-lg shadow-gray-500/30"></div>
                <span className="text-sm text-muted-foreground">Stalled ({stats.stalled})</span>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
