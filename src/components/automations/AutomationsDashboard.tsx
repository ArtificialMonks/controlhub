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
import { Automation } from '@/lib/repositories/automation-repository'
import { Button } from '@/components/ui/button'
import { RefreshCw, Download } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

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
      toast({
        title: "Refresh failed",
        description: "Unable to refresh automation data.",
        variant: "destructive"
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExport = () => {
    // Export functionality
    const csvContent = [
      ['Name', 'Client', 'Status', 'Success Rate', 'Avg Duration', 'Last Run'],
      ...filteredAutomations.map(a => [
        a.name,
        clients.find(c => c.id === a.client_id)?.name || 'Unknown',
        a.status,
        `${a.success_rate}%`,
        `${a.avg_duration_ms || 0}ms`,
        a.last_run_at || 'Never'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `automations-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
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
        className="border-b bg-background"
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Automation Control Center</h1>
              <p className="text-muted-foreground">
                Monitor and manage your automation workflows
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="px-6 py-6 space-y-6 h-full overflow-auto">
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
          className="bg-card rounded-lg border shadow-sm"
        >
          {/* Filters */}
          <div className="p-4 border-b space-y-4">
            <AutomationFilters
              automations={automations}
              clients={clients}
              onFilterChange={setFilteredAutomations}
            />
          </div>

          {/* Data Table */}
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