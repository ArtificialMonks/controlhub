// src/components/features/dashboard/DashboardClient.tsx
'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { MetricsCards } from '@/components/features/dashboard/metrics/MetricsCards'
import { AutomationProgressSection } from '@/components/features/dashboard/analytics/AutomationProgressSection'
import { AutomationChartsSection } from '@/components/features/dashboard/analytics/AutomationChartsSection'
import { RecentAutomationsTable } from '@/components/features/dashboard/tables/RecentAutomationsTable'
import { RealTimeActivityMonitor } from '@/components/features/dashboard/charts/RealTimeActivityMonitor'
import {
  MetricsCardsSkeleton,
  AutomationProgressSkeleton,
  AutomationChartsSkeleton,
  RecentAutomationsTableSkeleton,
  RealTimeActivitySkeleton
} from '@/components/features/dashboard/skeletons'
import type { Automation } from '@/lib/data/repositories/automation-repository'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'

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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading] = useState(false)
  const { toast } = useToast()



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

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Refresh functionality - could trigger a router refresh or API call
      window.location.reload()
    } catch {
      toast({
        title: "Refresh failed",
        description: "Unable to refresh dashboard data.",
        variant: "destructive"
      })
    } finally {
      setIsRefreshing(false)
    }
  }

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
                whileHover={{
                  scale: 1.02,
                  textShadow: "0 0 25px rgba(0, 60, 255, 0.4)"
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
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="hover:bg-primary/10 hover:border-primary/30 hover:shadow-md transition-all duration-300"
              >
                <RefreshCw className={`h-4 w-4 mr-2 transition-transform duration-300 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="px-6 py-6 space-y-6 h-full overflow-auto">
        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-destructive/10 border border-destructive/20 rounded-lg p-4"
          >
            <p className="text-sm text-destructive">
              Error loading dashboard data: {error}
            </p>
          </motion.div>
        )}

        {/* Show skeleton loaders when loading */}
        {isLoading ? (
          <>
            <MetricsCardsSkeleton />
            <AutomationProgressSkeleton />
            <AutomationChartsSkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <RealTimeActivitySkeleton />
              </div>
              <div className="lg:col-span-2">
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
          </>
        ) : (
          <>
            {/* Key Metrics Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <MetricsCards stats={stats} automations={automations} />
            </motion.div>

            {/* Automation Progress Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <AutomationProgressSection stats={stats} />
            </motion.div>

            {/* Charts Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <AutomationChartsSection stats={stats} automations={automations} />
            </motion.div>

            {/* Real-time Activity Monitor and Recent Automations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Real-time Activity Monitor */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="lg:col-span-1"
              >
                <RealTimeActivityMonitor />
              </motion.div>

              {/* Recent Automations Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-2"
              >
                <RecentAutomationsTable automations={automations} clients={clients} />
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
