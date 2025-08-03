// src/components/dashboard/OptimizedDashboard.tsx
'use client'

import React, { memo } from 'react'
import { motion } from 'framer-motion'
import { MetricsCards } from './MetricsCards'
import { AutomationProgressSection } from './AutomationProgressSection'
import { LazyChartWrapper, LazyPerformanceTrendChart, LazyStatusDistributionChart, LazyRealTimeActivityMonitor } from './charts/LazyChart'
import { RecentAutomationsTable } from './RecentAutomationsTable'
import type { Automation } from '@/lib/repositories/automation-repository'
// Create inline stats interface
interface AutomationStats {
  total: number
  running: number
  stopped: number
  error: number
  stalled: number
  avgSuccessRate: number
  avgDuration: number
}

// Memoized metrics cards
const MemoizedMetricsCards = memo(MetricsCards)

// Memoized progress section
const MemoizedProgressSection = memo(AutomationProgressSection)

// Memoized recent automations
const MemoizedRecentAutomations = memo(RecentAutomationsTable)

interface OptimizedDashboardProps {
  stats: AutomationStats
  automations: Automation[]
}

export function OptimizedDashboard({ stats, automations }: OptimizedDashboardProps) {
  
  return (
    <div className="space-y-6">
      {/* Key Metrics - Always visible */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <MemoizedMetricsCards stats={stats} automations={automations} />
      </motion.div>

      {/* Progress Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <MemoizedProgressSection stats={stats} />
      </motion.div>

      {/* Charts Section - Lazy loaded */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <LazyChartWrapper>
          <LazyPerformanceTrendChart 
            automations={automations}
            timeRange="7d"
          />
        </LazyChartWrapper>
        
        <LazyChartWrapper>
          <LazyStatusDistributionChart 
            stats={stats}
          />
        </LazyChartWrapper>
      </motion.div>

      {/* Real-time Monitor and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1"
        >
          <LazyChartWrapper height="h-auto">
            <LazyRealTimeActivityMonitor />
          </LazyChartWrapper>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-2"
        >
          <MemoizedRecentAutomations 
            automations={automations.slice(0, 5)}
            clients={[]}
          />
        </motion.div>
      </div>
    </div>
  )
}