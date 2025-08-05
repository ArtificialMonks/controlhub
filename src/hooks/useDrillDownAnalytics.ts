// src/hooks/useDrillDownAnalytics.ts
'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Automation } from '@/lib/repositories/automation-repository'

interface DrillDownAnalyticsState {
  dateRange: { from: Date | undefined; to: Date | undefined }
  selectedFilters: Array<{ label: string; value: string; selected: boolean }>
  timeRange: '7d' | '30d' | '90d' | 'custom'
}

interface AnalyticsData {
  totalExecutions: number
  successRate: number
  errorRate: number
  avgDuration: number
  trendData: Array<{
    date: string
    executions: number
    successRate: number
    errorRate: number
    avgDuration: number
  }>
  topPerformers: Automation[]
  recentFailures: Automation[]
}

export function useDrillDownAnalytics(automations: Automation[]) {
  const [state, setState] = useState<DrillDownAnalyticsState>({
    dateRange: { from: undefined, to: undefined },
    selectedFilters: [
      { label: 'Running', value: 'Running', selected: true },
      { label: 'Stopped', value: 'Stopped', selected: true },
      { label: 'Error', value: 'Error', selected: true },
      { label: 'Stalled', value: 'Stalled', selected: true }
    ],
    timeRange: '7d'
  })

  // Filter automations based on current state
  const filteredAutomations = useMemo(() => {
    let filtered = [...automations]

    // Apply status filters
    const selectedStatuses = state.selectedFilters
      .filter(f => f.selected)
      .map(f => f.value)
    
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(a => selectedStatuses.includes(a.status))
    }

    // Apply date range filter
    if (state.dateRange.from || state.dateRange.to) {
      filtered = filtered.filter(automation => {
        if (!automation.last_run_at) return false
        
        const runDate = new Date(automation.last_run_at)
        const fromDate = state.dateRange.from
        const toDate = state.dateRange.to
        
        if (fromDate && runDate < fromDate) return false
        if (toDate && runDate > toDate) return false
        
        return true
      })
    }

    return filtered
  }, [automations, state.selectedFilters, state.dateRange])

  // Calculate analytics data
  const analyticsData = useMemo((): AnalyticsData => {
    if (filteredAutomations.length === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        errorRate: 0,
        avgDuration: 0,
        trendData: [],
        topPerformers: [],
        recentFailures: []
      }
    }

    // Calculate basic metrics
    const runningCount = filteredAutomations.filter(a => a.status === 'Running').length
    const errorCount = filteredAutomations.filter(a => a.status === 'Error').length
    const totalExecutions = filteredAutomations.length * 10 // Estimated executions
    const successRate = (runningCount / filteredAutomations.length) * 100
    const errorRate = (errorCount / filteredAutomations.length) * 100
    const avgDuration = filteredAutomations.reduce((sum, a) => sum + (a.avg_duration_ms || 0), 0) / filteredAutomations.length

    // Generate trend data based on timeRange
    const days = state.timeRange === '7d' ? 7 : state.timeRange === '30d' ? 30 : 90
    const now = new Date()
    
    const trendData = Array.from({ length: days }, (_, i) => {
      const date = new Date(now)
      date.setDate(date.getDate() - (days - 1 - i))
      
      // Filter automations for this day
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      
      const dayAutomations = filteredAutomations.filter(a => {
        if (!a.last_run_at) return false
        const runDate = new Date(a.last_run_at)
        return runDate >= dayStart && runDate <= dayEnd
      })
      
      const dayRunning = dayAutomations.filter(a => a.status === 'Running').length
      const dayError = dayAutomations.filter(a => a.status === 'Error').length
      const dayTotal = dayAutomations.length || 1
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        executions: dayTotal * 8, // Estimated daily executions
        successRate: Math.round((dayRunning / dayTotal) * 100),
        errorRate: Math.round((dayError / dayTotal) * 100),
        avgDuration: Math.round(1000 + Math.random() * 2000) // Mock data for now
      }
    })

    // Get top performers (highest success rate)
    const topPerformers = [...filteredAutomations]
      .sort((a, b) => (b.success_rate || 0) - (a.success_rate || 0))
      .slice(0, 5)

    // Get recent failures
    const recentFailures = filteredAutomations
      .filter(a => a.status === 'Error')
      .sort((a, b) => {
        const aTime = a.last_run_at ? new Date(a.last_run_at).getTime() : 0
        const bTime = b.last_run_at ? new Date(b.last_run_at).getTime() : 0
        return bTime - aTime
      })
      .slice(0, 5)

    return {
      totalExecutions,
      successRate,
      errorRate,
      avgDuration,
      trendData,
      topPerformers,
      recentFailures
    }
  }, [filteredAutomations, state.timeRange])

  // Update functions
  const updateDateRange = useCallback((range: { from: Date | undefined; to: Date | undefined }) => {
    setState(prev => ({
      ...prev,
      dateRange: range,
      timeRange: 'custom'
    }))
  }, [])

  const updateFilters = useCallback((filters: Array<{ label: string; value: string; selected: boolean }>) => {
    setState(prev => ({
      ...prev,
      selectedFilters: filters
    }))
  }, [])

  const updateTimeRange = useCallback((timeRange: '7d' | '30d' | '90d') => {
    setState(prev => ({
      ...prev,
      timeRange,
      dateRange: { from: undefined, to: undefined } // Clear custom date range
    }))
  }, [])

  return {
    // State
    dateRange: state.dateRange,
    selectedFilters: state.selectedFilters,
    timeRange: state.timeRange,
    
    // Data
    filteredAutomations,
    analyticsData,
    
    // Actions
    updateDateRange,
    updateFilters,
    updateTimeRange
  }
}