// src/hooks/usePerformanceMonitor.ts
/**
 * Performance Monitoring Hook
 * Quest 4.3 - Expert Council Validated Implementation
 * 
 * Important Enhancement: Performance Monitoring & Benchmarking
 * Expert Consensus: 100% (6/6 experts)
 * Priority: MEDIUM
 */

"use client"

import { useState, useCallback, useRef, useMemo } from 'react'
import { 
  FilterPerformanceMetrics, 
  PerformanceMonitor 
} from '@/lib/core/types/filtering'

// ============================================================================
// PERFORMANCE MONITORING CONFIGURATION
// ============================================================================

interface PerformanceMonitorConfig {
  /** Enable performance monitoring */
  enabled: boolean
  /** Maximum number of metrics to store in history */
  maxHistorySize: number
  /** Performance warning threshold in milliseconds */
  warningThreshold: number
  /** Performance error threshold in milliseconds */
  errorThreshold: number
  /** Enable memory usage tracking */
  trackMemory: boolean
  /** Enable console logging of performance warnings */
  logWarnings: boolean
}

const DEFAULT_CONFIG: PerformanceMonitorConfig = {
  enabled: true,
  maxHistorySize: 100,
  warningThreshold: 100, // 100ms
  errorThreshold: 500,   // 500ms
  trackMemory: true,
  logWarnings: true
}

// ============================================================================
// PERFORMANCE MEASUREMENT UTILITIES
// ============================================================================

/**
 * Get memory usage information
 */
function getMemoryUsage(): number | undefined {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
    const memory = (window.performance as unknown as { memory: { usedJSHeapSize: number } }).memory
    return memory.usedJSHeapSize
  }
  return undefined
}

/**
 * Create performance metrics object
 */
function createPerformanceMetrics(
  startTime: number,
  endTime: number,
  itemsProcessed: number,
  itemsReturned: number,
  searchDuration = 0,
  clientLookupDuration = 0
): FilterPerformanceMetrics {
  return {
    filterDuration: endTime - startTime,
    searchDuration,
    clientLookupDuration,
    itemsProcessed,
    itemsReturned,
    memoryUsage: getMemoryUsage(),
    timestamp: new Date()
  }
}

// ============================================================================
// PERFORMANCE MONITOR HOOK
// ============================================================================

/**
 * Performance Monitor Hook
 * 
 * Provides comprehensive performance monitoring for filtering operations
 * with real-time metrics, history tracking, and performance alerts.
 * 
 * Expert Council Validated Features:
 * - Performance Expert: Real-time monitoring and regression detection
 * - Quality Expert: Performance benchmarking and quality metrics
 * - Architecture Expert: Clean separation of performance concerns
 * - Security Expert: Safe performance data collection
 * - Integration Expert: Easy integration with filtering components
 * - UX Expert: Performance impact on user experience tracking
 */
export function usePerformanceMonitor(
  config: Partial<PerformanceMonitorConfig> = {}
): PerformanceMonitor {
  
  // ============================================================================
  // CONFIGURATION
  // ============================================================================
  
  const monitorConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])
  
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [currentMetrics, setCurrentMetrics] = useState<FilterPerformanceMetrics | null>(null)
  const [history, setHistory] = useState<FilterPerformanceMetrics[]>([])
  
  // Performance measurement state
  const measurementRef = useRef<{
    startTime: number
    searchStartTime?: number
    clientLookupStartTime?: number
    searchDuration: number
    clientLookupDuration: number
  } | null>(null)
  
  // ============================================================================
  // PERFORMANCE MEASUREMENT METHODS
  // ============================================================================
  
  /**
   * Start performance measurement
   */
  const startMeasurement = useCallback(() => {
    if (!monitorConfig.enabled) return
    
    measurementRef.current = {
      startTime: performance.now(),
      searchDuration: 0,
      clientLookupDuration: 0
    }
  }, [monitorConfig.enabled])
  
  /**
   * Start search operation measurement
   */
  const startSearchMeasurement = useCallback(() => {
    if (!monitorConfig.enabled || !measurementRef.current) return
    
    measurementRef.current.searchStartTime = performance.now()
  }, [monitorConfig.enabled])
  
  /**
   * End search operation measurement
   */
  const endSearchMeasurement = useCallback(() => {
    if (!monitorConfig.enabled || !measurementRef.current || !measurementRef.current.searchStartTime) return
    
    measurementRef.current.searchDuration = performance.now() - measurementRef.current.searchStartTime
    measurementRef.current.searchStartTime = undefined
  }, [monitorConfig.enabled])
  
  /**
   * Start client lookup operation measurement
   */
  const startClientLookupMeasurement = useCallback(() => {
    if (!monitorConfig.enabled || !measurementRef.current) return
    
    measurementRef.current.clientLookupStartTime = performance.now()
  }, [monitorConfig.enabled])
  
  /**
   * End client lookup operation measurement
   */
  const endClientLookupMeasurement = useCallback(() => {
    if (!monitorConfig.enabled || !measurementRef.current || !measurementRef.current.clientLookupStartTime) return
    
    measurementRef.current.clientLookupDuration = performance.now() - measurementRef.current.clientLookupStartTime
    measurementRef.current.clientLookupStartTime = undefined
  }, [monitorConfig.enabled])
  
  /**
   * End performance measurement
   */
  const endMeasurement = useCallback((itemsProcessed: number, itemsReturned: number) => {
    if (!monitorConfig.enabled || !measurementRef.current) return
    
    const endTime = performance.now()
    const metrics = createPerformanceMetrics(
      measurementRef.current.startTime,
      endTime,
      itemsProcessed,
      itemsReturned,
      measurementRef.current.searchDuration,
      measurementRef.current.clientLookupDuration
    )
    
    // Update current metrics
    setCurrentMetrics(metrics)
    
    // Add to history
    setHistory(prev => {
      const newHistory = [...prev, metrics]
      
      // Limit history size
      if (newHistory.length > monitorConfig.maxHistorySize) {
        return newHistory.slice(-monitorConfig.maxHistorySize)
      }
      
      return newHistory
    })
    
    // Performance warnings and alerts
    if (monitorConfig.logWarnings) {
      if (metrics.filterDuration > monitorConfig.errorThreshold) {
        console.error(`Performance Error: Filtering took ${metrics.filterDuration.toFixed(2)}ms (threshold: ${monitorConfig.errorThreshold}ms)`, metrics)
      } else if (metrics.filterDuration > monitorConfig.warningThreshold) {
        console.warn(`Performance Warning: Filtering took ${metrics.filterDuration.toFixed(2)}ms (threshold: ${monitorConfig.warningThreshold}ms)`, metrics)
      }
    }
    
    // Reset measurement state
    measurementRef.current = null
  }, [monitorConfig.enabled, monitorConfig.maxHistorySize, monitorConfig.errorThreshold, monitorConfig.warningThreshold, monitorConfig.logWarnings])
  
  // ============================================================================
  // HISTORY MANAGEMENT
  // ============================================================================
  
  /**
   * Get performance history
   */
  const getHistory = useCallback(() => {
    return [...history]
  }, [history])
  
  /**
   * Clear performance history
   */
  const clearHistory = useCallback(() => {
    setHistory([])
    setCurrentMetrics(null)
  }, [])
  
  // ============================================================================
  // PERFORMANCE ANALYTICS
  // ============================================================================
  
  /**
   * Get performance statistics
   */
  const getStatistics = useCallback(() => {
    if (history.length === 0) {
      return null
    }
    
    const durations = history.map(m => m.filterDuration)
    const searchDurations = history.map(m => m.searchDuration)
    const clientLookupDurations = history.map(m => m.clientLookupDuration)
    
    return {
      totalMeasurements: history.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      averageSearchDuration: searchDurations.reduce((a, b) => a + b, 0) / searchDurations.length,
      averageClientLookupDuration: clientLookupDurations.reduce((a, b) => a + b, 0) / clientLookupDurations.length,
      performanceScore: calculatePerformanceScore(durations, monitorConfig.warningThreshold),
      regressionDetected: detectPerformanceRegression(durations)
    }
  }, [history, monitorConfig.warningThreshold])
  
  // ============================================================================
  // RETURN PERFORMANCE MONITOR INTERFACE
  // ============================================================================
  
  return {
    metrics: currentMetrics,
    startMeasurement,
    endMeasurement,
    getHistory,
    clearHistory,
    
    // Extended methods for detailed monitoring
    startSearchMeasurement,
    endSearchMeasurement,
    startClientLookupMeasurement,
    endClientLookupMeasurement,
    getStatistics,
    
    // Configuration access
    config: monitorConfig
  } as PerformanceMonitor & {
    startSearchMeasurement: () => void
    endSearchMeasurement: () => void
    startClientLookupMeasurement: () => void
    endClientLookupMeasurement: () => void
    getStatistics: () => FilterPerformanceMetrics | null
    config: PerformanceMonitorConfig
  }
}

// ============================================================================
// PERFORMANCE ANALYSIS UTILITIES
// ============================================================================

/**
 * Calculate performance score (0-100)
 */
function calculatePerformanceScore(durations: number[], threshold: number): number {
  if (durations.length === 0) return 100
  
  const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length
  const score = Math.max(0, 100 - (averageDuration / threshold) * 50)
  
  return Math.round(score)
}

/**
 * Detect performance regression
 */
function detectPerformanceRegression(durations: number[]): boolean {
  if (durations.length < 10) return false
  
  const recentDurations = durations.slice(-5)
  const previousDurations = durations.slice(-10, -5)
  
  const recentAverage = recentDurations.reduce((a, b) => a + b, 0) / recentDurations.length
  const previousAverage = previousDurations.reduce((a, b) => a + b, 0) / previousDurations.length
  
  // Regression if recent performance is 20% worse than previous
  return recentAverage > previousAverage * 1.2
}

// ============================================================================
// EXPORTS
// ============================================================================

export default usePerformanceMonitor
