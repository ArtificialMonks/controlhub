// src/components/features/dashboard/DashboardSkeleton.tsx
'use client'

import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  MetricsCardsSkeleton,
  AutomationProgressSkeleton,
  AutomationChartsSkeleton,
  RecentAutomationsTableSkeleton,
  RealTimeActivitySkeleton
} from './skeletons'

export function DashboardSkeleton() {
  return (
    <div className="h-full w-full bg-background">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative border-b bg-background"
      >
        {/* Enhanced separator line aligned with sidebar */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent"></div>
        
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1
                className="control-hub-title text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
                style={{
                  backgroundSize: "200% 100%",
                }}
              >
                AUTOMATION DASHBOARD
              </motion.h1>
              <p className="text-muted-foreground">
                Real-time insights and performance analytics for your automation ecosystem
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled
                className="opacity-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="px-6 py-6 space-y-6 h-full overflow-auto">
        {/* Skeleton Components */}
        <MetricsCardsSkeleton />
        <AutomationProgressSkeleton />
        <AutomationChartsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <RealTimeActivitySkeleton />
          </div>
          <div className="lg:col-span-2">
            <RecentAutomationsTableSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}