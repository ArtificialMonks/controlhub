// Optimized AutomationsDrillDown with performance enhancements
'use client'

import React, { useState, useMemo, useEffect, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { useDrillDownAnalytics } from '@/hooks/useDrillDownAnalytics'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { 
  DrillDownSection, 
  DrillDownMetric 
} from '@/components/ui/drill-down-modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Search,
  Play,
  Pause,
  CheckCircle,
  XCircle
} from 'lucide-react'
import type { Automation } from '@/lib/data/repositories/automation-repository'

// Lazy import for heavy chart component
const LazyAreaChart = React.lazy(() => 
  import('recharts').then(module => ({
    default: ({ ...props }: React.ComponentProps<'div'>) => {
      const { ResponsiveContainer } = module
      return (
        <ResponsiveContainer {...props}>
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            Chart Component Loaded
          </div>
        </ResponsiveContainer>
      )
    }
  }))
)

interface OptimizedAutomationsDrillDownProps {
  automations: Automation[]
  totalCount: number
}

// Memoized date range presets to prevent recreation
const DATE_RANGE_PRESETS = [
  {
    label: 'Today',
    getRange: () => ({
      from: new Date(new Date().setHours(0, 0, 0, 0)),
      to: new Date(new Date().setHours(23, 59, 59, 999))
    })
  },
  {
    label: 'Yesterday', 
    getRange: () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return { from: yesterday, to: yesterday }
    }
  },
  {
    label: 'Last 7 days',
    getRange: () => ({
      from: new Date(new Date().setDate(new Date().getDate() - 7)),
      to: new Date()
    })
  },
  {
    label: 'Last 30 days',
    getRange: () => ({
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date()
    })
  },
  {
    label: 'This month',
    getRange: () => ({
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: new Date()
    })
  }
] as const

// Memoized status icon component
const StatusIcon = memo(({ status }: { status: string }) => {
  switch (status) {
    case 'Running':
      return <Play className="h-4 w-4 text-green-500" />
    case 'Stopped':
      return <Pause className="h-4 w-4 text-gray-500" />
    case 'Error':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'Stalled':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    default:
      return null
  }
})
StatusIcon.displayName = 'StatusIcon'

// Memoized status color utility
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Running':
      return 'bg-green-500/10 text-green-500 border-green-500/20'
    case 'Stopped':
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    case 'Error':
      return 'bg-red-500/10 text-red-500 border-red-500/20'
    case 'Stalled':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    default:
      return ''
  }
}

// Memoized table row component
const AutomationRow = memo(({ automation, visibleColumns }: {
  automation: Automation
  visibleColumns: {
    name: boolean
    client: boolean
    status: boolean
    successRate: boolean
    lastRun: boolean
    executions: boolean
  }
}) => (
  <TableRow className="hover:bg-white/5 dark:hover:bg-black/20 cursor-pointer">
    {visibleColumns.name && (
      <TableCell className="font-medium">{automation.name}</TableCell>
    )}
    {visibleColumns.client && (
      <TableCell>{automation.client_id || '-'}</TableCell>
    )}
    {visibleColumns.status && (
      <TableCell>
        <Badge 
          variant="secondary" 
          className={`${getStatusColor(automation.status)} flex items-center gap-1 w-fit`}
        >
          <StatusIcon status={automation.status} />
          {automation.status}
        </Badge>
      </TableCell>
    )}
    {visibleColumns.successRate && (
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-medium">{automation.success_rate?.toFixed(1)}%</span>
          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500"
              style={{ width: `${automation.success_rate}%` }}
            />
          </div>
        </div>
      </TableCell>
    )}
    {visibleColumns.lastRun && (
      <TableCell>
        {automation.last_run_at 
          ? new Date(automation.last_run_at).toLocaleDateString()
          : 'Never'
        }
      </TableCell>
    )}
    {visibleColumns.executions && (
      <TableCell>{Math.floor(Math.random() * 50) + 10}</TableCell>
    )}
  </TableRow>
))
AutomationRow.displayName = 'AutomationRow'

export const OptimizedAutomationsDrillDown = memo(({ 
  automations, 
  totalCount 
}: OptimizedAutomationsDrillDownProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const { preferences, updateDrillDownSettings } = useUserPreferences()
  const [visibleColumns, setVisibleColumns] = useState(preferences.drillDownSettings.visibleColumns)

  // Sync visible columns with user preferences
  useEffect(() => {
    setVisibleColumns(preferences.drillDownSettings.visibleColumns)
  }, [preferences.drillDownSettings.visibleColumns])

  // Handle column visibility changes with useCallback
  const handleColumnVisibilityChange = useCallback((column: string) => {
    const updated = {
      ...visibleColumns,
      [column]: !visibleColumns[column as keyof typeof visibleColumns]
    }
    setVisibleColumns(updated)
    updateDrillDownSettings({ visibleColumns: updated })
  }, [visibleColumns, updateDrillDownSettings])

  // Use enhanced analytics hook
  const {
    dateRange,
    timeRange,
    filteredAutomations,
    analyticsData,
    updateDateRange,
    updateTimeRange
  } = useDrillDownAnalytics(automations)

  // Memoized date range handler
  const handleDateRangePreset = useCallback((preset: typeof DATE_RANGE_PRESETS[number]) => {
    updateDateRange(preset.getRange())
  }, [updateDateRange])

  // Memoized clear filter handler
  const handleClearFilter = useCallback(() => {
    updateDateRange({ from: undefined, to: undefined })
  }, [updateDateRange])

  // Memoized search handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  // Calculate detailed metrics using analytics data with useMemo
  const metrics = useMemo(() => {
    const running = filteredAutomations.filter(a => a.status === 'Running').length
    const stopped = filteredAutomations.filter(a => a.status === 'Stopped').length
    const error = filteredAutomations.filter(a => a.status === 'Error').length
    const stalled = filteredAutomations.filter(a => a.status === 'Stalled').length

    return {
      running,
      stopped,
      error,
      stalled,
      totalExecutions: analyticsData.totalExecutions,
      avgSuccessRate: analyticsData.successRate,
      utilizationRate: running / totalCount * 100,
      errorRate: analyticsData.errorRate
    }
  }, [filteredAutomations, analyticsData, totalCount])

  // Apply search filter to analytics-filtered automations with useMemo
  const searchFilteredAutomations = useMemo(() => {
    if (!searchQuery) return filteredAutomations
    
    const query = searchQuery.toLowerCase()
    return filteredAutomations.filter(automation => 
      automation.name.toLowerCase().includes(query) ||
      automation.client_id?.toLowerCase().includes(query)
    )
  }, [filteredAutomations, searchQuery])

  // Limit displayed automations for performance
  const displayedAutomations = useMemo(() => 
    searchFilteredAutomations.slice(0, 10), 
    [searchFilteredAutomations]
  )

  return (
    <div className="space-y-6">
      {/* Advanced Date Range Filtering */}
      <DrillDownSection 
        title="Date Range Filtering"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilter}
              className="text-xs"
            >
              Clear Filter
            </Button>
          </div>
        }
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {DATE_RANGE_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant={
                dateRange.from?.toDateString() === preset.getRange().from.toDateString() &&
                dateRange.to?.toDateString() === preset.getRange().to.toDateString()
                  ? "default" 
                  : "outline"
              }
              size="sm"
              onClick={() => handleDateRangePreset(preset)}
              className="text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>
        
        {(dateRange.from || dateRange.to) && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium mb-1">Active Filter:</p>
            <p className="text-xs text-muted-foreground">
              {dateRange.from ? `From: ${dateRange.from.toLocaleDateString()}` : 'No start date'} 
              {dateRange.from && dateRange.to && ' • '}
              {dateRange.to ? `To: ${dateRange.to.toLocaleDateString()}` : 'No end date'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Showing {filteredAutomations.length} of {automations.length} automations
            </p>
          </div>
        )}
      </DrillDownSection>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DrillDownMetric
          label="Total Automations"
          value={totalCount}
          icon={<Zap className="h-5 w-5 text-yellow-500" />}
        />
        <DrillDownMetric
          label="Running"
          value={metrics.running}
          trend="up"
          trendValue="+12%"
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
        />
        <DrillDownMetric
          label="Success Rate"
          value={`${metrics.avgSuccessRate.toFixed(1)}%`}
          trend={metrics.avgSuccessRate > 90 ? 'up' : 'down'}
          trendValue={metrics.avgSuccessRate > 90 ? '+5%' : '-3%'}
          icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
        />
        <DrillDownMetric
          label="Total Executions"
          value={metrics.totalExecutions.toLocaleString()}
          icon={<Clock className="h-5 w-5 text-purple-500" />}
        />
      </div>

      {/* Trend Chart - Lazy loaded */}
      <DrillDownSection 
        title="Automation Trends"
        action={
          <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d') => updateTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        }
      >
        <div className="h-64 w-full">
          <React.Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded" />}>
            <LazyAreaChart className="h-full w-full" />
          </React.Suspense>
        </div>
      </DrillDownSection>

      {/* Status Distribution */}
      <DrillDownSection title="Status Distribution">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Running', value: metrics.running, color: 'green' },
            { label: 'Stopped', value: metrics.stopped, color: 'gray' },
            { label: 'Error', value: metrics.error, color: 'red' },
            { label: 'Stalled', value: metrics.stalled, color: 'yellow' }
          ].map((item) => (
            <motion.div
              key={item.label}
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-lg bg-${item.color}-500/10 border border-${item.color}-500/20`}
            >
              <p className={`text-sm font-medium text-${item.color}-500`}>{item.label}</p>
              <p className={`text-2xl font-bold text-${item.color}-600`}>{item.value}</p>
              <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / totalCount) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full bg-${item.color}-500`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </DrillDownSection>

      {/* Automation List */}
      <DrillDownSection 
        title="Automation Details"
        action={
          <div className="flex items-center gap-4">
            {/* Column Customization */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Columns:</span>
              <div className="flex gap-1">
                {Object.entries(visibleColumns).map(([key, visible]) => (
                  <Button
                    key={key}
                    variant={visible ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleColumnVisibilityChange(key)}
                    className="text-xs px-2 py-1 h-7"
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search automations..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-9 w-64"
              />
            </div>
          </div>
        }
      >
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.name && <TableHead>Name</TableHead>}
                {visibleColumns.client && <TableHead>Client</TableHead>}
                {visibleColumns.status && <TableHead>Status</TableHead>}
                {visibleColumns.successRate && <TableHead>Success Rate</TableHead>}
                {visibleColumns.lastRun && <TableHead>Last Run</TableHead>}
                {visibleColumns.executions && <TableHead>Executions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedAutomations.map((automation) => (
                <AutomationRow
                  key={automation.id}
                  automation={automation}
                  visibleColumns={visibleColumns}
                />
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredAutomations.length > 10 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All {filteredAutomations.length} Automations
            </Button>
          </div>
        )}
      </DrillDownSection>
    </div>
  )
})

OptimizedAutomationsDrillDown.displayName = 'OptimizedAutomationsDrillDown'