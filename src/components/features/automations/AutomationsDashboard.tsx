// src/components/features/automations/AutomationsDashboard.tsx
'use client'

import { User } from '@supabase/supabase-js'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { AutomationStatsCards } from './statistics/AutomationStatsCards'
import { StatusDistributionChart } from './statistics/StatusDistributionChart'
import { PerformanceTrendChart } from './statistics/PerformanceTrendChart'
import { AutomationsDataTable } from './data-grid/AutomationsDataTable'
import { AutomationFilters } from './data-grid/AutomationFilters'
import { BulkToggleControls } from './controls/BulkToggleControls'
import { Automation } from '@/lib/data/repositories/automation-repository'
import { Button } from '@/components/ui/button'
import { RefreshCw, Crown, AlertTriangle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useTeamMode } from '@/hooks/useTeamMode'

interface Client {
  id: string
  name: string
}

interface AutomationsDashboardProps {
  user: User
  profile: Record<string, unknown> | null
  initialData: {
    automations: Automation[]
    clients: Client[]
    error: string | null
  }
}

export function AutomationsDashboard({ initialData }: AutomationsDashboardProps) {
  const [automations, setAutomations] = useState<Automation[]>(initialData.automations)
  const [filteredAutomations, setFilteredAutomations] = useState<Automation[]>(initialData.automations)
  const [clients] = useState<Client[]>(initialData.clients)
  const [selectedAutomations, setSelectedAutomations] = useState<string[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()
  const { features: teamFeatures, description: teamModeDescription, canCreateAutomation, isAtLimit } = useTeamMode()

  // Calculate statistics - with null safety
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
      // In a real implementation, this would call the API to refresh data
      const response = await fetch('/api/automations', {
        credentials: 'include' // Include cookies for authentication
      })
      if (response.ok) {
        const data = await response.json()
        // The API returns an array directly, not an object with automations property
        const automationsArray = Array.isArray(data) ? data : data.automations || []
        setAutomations(automationsArray)
        setFilteredAutomations(automationsArray)
        toast({
          title: "Data refreshed",
          description: "Automation data has been updated successfully."
        })
      }
    } catch (error) {
      console.error('Data refresh error:', error)
      toast({
        title: "Refresh failed",
        description: "Unable to refresh automation data.",
        variant: "destructive"
      })
    } finally {
      setIsRefreshing(false)
    }
  }


  const handleBulkAction = async (action: 'run' | 'stop', automationIds: string[]) => {
    console.log(`Making bulk ${action} request for ${automationIds.length} automations:`, automationIds)
    try {
      const response = await fetch('/api/automations/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          action,
          automationIds,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`Bulk API Error (${response.status}):`, errorData)
        throw new Error(errorData.error || `Failed to ${action} automations (${response.status})`)
      }

      const result = await response.json()
      
      // Update local state for successful operations
      if (result.success && result.results) {
        setAutomations(prev => 
          prev.map(automation => {
            const updateResult = result.results.find((r: { id: string; success: boolean }) => r.id === automation.id)
            if (updateResult && updateResult.success) {
              return {
                ...automation,
                status: action === 'run' ? 'Running' : 'Stopped',
                last_run_at: action === 'run' ? new Date().toISOString() : automation.last_run_at
              }
            }
            return automation
          })
        )

        setFilteredAutomations(prev => 
          prev.map(automation => {
            const updateResult = result.results.find((r: { id: string; success: boolean }) => r.id === automation.id)
            if (updateResult && updateResult.success) {
              return {
                ...automation,
                status: action === 'run' ? 'Running' : 'Stopped',
                last_run_at: action === 'run' ? new Date().toISOString() : automation.last_run_at
              }
            }
            return automation
          })
        )

        // Show summary toast
        toast({
          title: `Bulk ${action} completed`,
          description: `${result.summary.successful} automations ${action === 'run' ? 'started' : 'stopped'} successfully. ${result.summary.failed > 0 ? `${result.summary.failed} failed.` : ''}`,
          duration: 5000,
        })
      }
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error)
      toast({
        title: `Bulk ${action} failed`,
        description: 'Please try individual actions or check your connection.',
        variant: 'destructive',
        duration: 4000,
      })
    }
  }

  const handleAutomationStateChange = (id: string, newState: boolean) => {
    // Update local state immediately for responsive UI
    const newStatus = newState ? 'Running' : 'Stopped'
    setAutomations(prev => 
      prev.map(a => a.id === id ? { ...a, status: newStatus } : a)
    )
    setFilteredAutomations(prev => 
      prev.map(a => a.id === id ? { ...a, status: newStatus } : a)
    )
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
                AUTOMATION CONTROL CENTER
              </motion.h1>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-muted-foreground">
                  Monitor and manage your automation workflows
                </p>
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                  <Crown className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {teamModeDescription.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({stats.total}/{teamFeatures.maxAutomations === -1 ? '∞' : teamFeatures.maxAutomations} automations)
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!canCreateAutomation(stats.total) && (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
                  onClick={() => {
                    toast({
                      title: "Upgrade Required",
                      description: `You've reached the limit of ${teamFeatures.maxAutomations} automations for ${teamModeDescription.name}. Upgrade to add more automations.`,
                      variant: "destructive"
                    })
                  }}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              )}
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
        {/* Team Mode Limitations Notice */}
        {(isAtLimit(stats.total, 'maxAutomations') || teamFeatures.maxAutomations <= 10) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`p-4 rounded-lg border ${
              isAtLimit(stats.total, 'maxAutomations') 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                isAtLimit(stats.total, 'maxAutomations') ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
              }`} />
              <div>
                <h4 className={`font-medium ${
                  isAtLimit(stats.total, 'maxAutomations') ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'
                }`}>
                  {isAtLimit(stats.total, 'maxAutomations') ? 'Automation Limit Reached' : 'Approaching Automation Limit'}
                </h4>
                <p className={`text-sm mt-1 ${
                  isAtLimit(stats.total, 'maxAutomations') ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'
                }`}>
                  {isAtLimit(stats.total, 'maxAutomations') 
                    ? `You've reached your limit of ${teamFeatures.maxAutomations} automations for ${teamModeDescription.name}. Upgrade to add more automations.`
                    : `You're using ${stats.total} of ${teamFeatures.maxAutomations} automations available in ${teamModeDescription.name}. Consider upgrading for more capacity.`
                  }
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
                    onClick={() => {
                      toast({
                        title: "Team Mode Information",
                        description: `Standard ($29/month): 25 automations, Enterprise ($99/month): Unlimited automations`,
                        duration: 6000,
                      })
                    }}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    View Upgrade Options
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Statistics Dashboard - 20% of page */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-4"
        >
          <div className="md:col-span-2">
            <AutomationStatsCards stats={stats} />
          </div>
          <StatusDistributionChart stats={stats} />
          <PerformanceTrendChart automations={automations} />
        </motion.div>

        {/* Bulk Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <BulkToggleControls
            selectedAutomations={selectedAutomations}
            filteredAutomations={filteredAutomations}
            allAutomations={automations}
            onBulkAction={handleBulkAction}
            onClearSelection={() => setSelectedAutomations([])}
          />
        </motion.div>

        {/* Advanced Data Grid - 70% of page */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden border border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md hover:bg-white/10 dark:hover:bg-black/30 transition-all duration-300 rounded-lg shadow-xl hover:shadow-primary/20 group"
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          {/* Filters */}
          <div className="p-4 border-b border-white/10 space-y-4 relative z-10">
            <AutomationFilters
              automations={automations}
              clients={clients}
              onFilterChange={setFilteredAutomations}
            />
          </div>

          {/* Data Table */}
          <div className="relative z-10">
          <AutomationsDataTable
            automations={filteredAutomations}
            clients={clients}
            selectedAutomations={selectedAutomations}
            onSelectionChange={setSelectedAutomations}
            onAutomationUpdate={(id, updates) => {
              setAutomations(prev => 
                prev.map(a => a.id === id ? { ...a, ...updates } : a)
              )
              setFilteredAutomations(prev => 
                prev.map(a => a.id === id ? { ...a, ...updates } : a)
              )
            }}
            onStateChange={handleAutomationStateChange}
          />
          </div>
        </motion.div>

        {/* Error Display */}
        {initialData.error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-destructive/10 border border-destructive/20 rounded-lg p-4"
          >
            <p className="text-sm text-destructive">
              Error loading automations: {initialData.error}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}