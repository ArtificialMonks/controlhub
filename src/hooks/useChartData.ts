// src/hooks/useChartData.ts
'use client'

import { useMemo } from 'react'
import type { Automation } from '@/lib/repositories/automation-repository'

interface AutomationStats {
  total: number
  running: number
  stopped: number
  error: number
  stalled: number
  avgSuccessRate: number
  avgDuration: number
}

// Performance trend data calculation
export function usePerformanceTrendData(
  automations: Automation[],
  timeRange: '7d' | '30d' | '90d'
) {
  return useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const now = new Date()
    
    // Generate data points for the time range
    const data = Array.from({ length: days }, (_, i) => {
      const date = new Date(now)
      date.setDate(date.getDate() - (days - 1 - i))
      
      // Filter automations for this day
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      
      const dayAutomations = automations.filter(a => {
        if (!a.last_run_at) return false
        const runDate = new Date(a.last_run_at)
        return runDate >= dayStart && runDate <= dayEnd
      })
      
      const successful = dayAutomations.filter(a => a.status === 'Running').length
      const total = dayAutomations.length || 1 // Avoid division by zero
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        executions: total,
        successRate: Math.round((successful / total) * 100),
        avgDuration: Math.round(1000 + Math.random() * 2000), // Mock data
        errorRate: Math.round(((total - successful) / total) * 100),
        timestamp: date.getTime()
      }
    })
    
    return data
  }, [automations, timeRange])
}

// Status distribution data calculation
export function useStatusDistributionData(stats: AutomationStats) {
  return useMemo(() => {
    const pieData = [
      { 
        name: 'Running', 
        value: stats.running, 
        color: '#10b981', 
        percentage: Math.round((stats.running / stats.total) * 100)
      },
      { 
        name: 'Stopped', 
        value: stats.stopped, 
        color: '#ef4444', 
        percentage: Math.round((stats.stopped / stats.total) * 100)
      },
      { 
        name: 'Error', 
        value: stats.error, 
        color: '#f59e0b', 
        percentage: Math.round((stats.error / stats.total) * 100)
      }
    ].filter(item => item.value > 0)
    
    return pieData
  }, [stats])
}

// Real-time activity data generation
export function useRealTimeActivityData(initialData: number[] = []) {
  return useMemo(() => {
    // Generate last 20 data points
    const data = Array.from({ length: 20 }, (_, i) => ({
      time: new Date(Date.now() - (19 - i) * 5000).toLocaleTimeString(),
      value: initialData[i] || Math.floor(Math.random() * 50) + 10,
      timestamp: Date.now() - (19 - i) * 5000
    }))
    
    return data
  }, [initialData])
}

// Automation performance metrics
export function useAutomationMetrics(automations: Automation[]) {
  return useMemo(() => {
    const now = new Date()
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000)
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const recentAutomations = automations.filter(a => 
      a.last_run_at && new Date(a.last_run_at) >= last24Hours
    )
    
    const hourlyAutomations = automations.filter(a => 
      a.last_run_at && new Date(a.last_run_at) >= lastHour
    )
    
    return {
      totalExecutions: recentAutomations.length,
      successRate: Math.round(
        (recentAutomations.filter(a => a.status === 'Running').length / 
        (recentAutomations.length || 1)) * 100
      ),
      avgDuration: Math.round(Math.random() * 2000 + 1000), // Mock
      throughput: Math.round(hourlyAutomations.length / 60), // per minute
      errorCount: recentAutomations.filter(a => a.status === 'Error').length
    }
  }, [automations])
}