// src/hooks/useOptimizedFiltering.ts
/**
 * Optimized Filtering Hook with Performance Monitoring
 * Quest 4.3 - Expert Council Validated Implementation
 * 
 * Enhanced Performance Implementation: Optimized hooks with performance tracking
 * Expert Consensus: 100% (6/6 experts)
 * Priority: MEDIUM
 */

"use client"

import { useMemo, useCallback } from 'react'
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'
import FilterSecurityValidator from '@/lib/infrastructure/security/filterSecurity'
import { 
  FilterState, 
  FilterPerformanceMetrics 
} from '@/lib/core/types/filtering'
import { Automation, Client } from '@/lib/core/types/automation'

// ============================================================================
// OPTIMIZED FILTERING CONFIGURATION
// ============================================================================

interface OptimizedFilteringConfig {
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean
  /** Performance warning threshold in milliseconds */
  performanceWarningThreshold?: number
  /** Performance error threshold in milliseconds */
  performanceErrorThreshold?: boolean
  /** Enable security validation */
  enableSecurityValidation?: boolean
  /** Enable client lookup memoization */
  enableClientMemoization?: boolean
  /** Enable console performance logging */
  enablePerformanceLogging?: boolean
}

const DEFAULT_CONFIG: OptimizedFilteringConfig = {
  enablePerformanceMonitoring: true,
  performanceWarningThreshold: 50,
  performanceErrorThreshold: false,
  enableSecurityValidation: true,
  enableClientMemoization: true,
  enablePerformanceLogging: false
}

// ============================================================================
// OPTIMIZED FILTERING HOOK
// ============================================================================

/**
 * Optimized Filtering Hook
 * 
 * Provides high-performance filtering with integrated monitoring,
 * security validation, and memoization optimizations.
 * 
 * Expert Council Validated Features:
 * - Performance Expert: Real-time monitoring and optimization
 * - Security Expert: Integrated security validation
 * - Architecture Expert: Clean separation and memoization
 * - Quality Expert: Performance benchmarking integration
 * - Integration Expert: Easy integration with existing components
 * - UX Expert: Responsive filtering with performance feedback
 */
export function useOptimizedFiltering(
  automations: Automation[],
  clients: Client[],
  filters: FilterState,
  config: OptimizedFilteringConfig = {}
) {
  
  // ============================================================================
  // CONFIGURATION SETUP
  // ============================================================================
  
  const filterConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])
  
  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================
  
  const performanceMonitor = usePerformanceMonitor({
    enabled: filterConfig.enablePerformanceMonitoring,
    warningThreshold: filterConfig.performanceWarningThreshold || 50,
    errorThreshold: 100,
    logWarnings: filterConfig.enablePerformanceLogging,
    maxHistorySize: 100
  })
  
  // ============================================================================
  // SECURITY VALIDATION
  // ============================================================================
  
  const securityValidator = useMemo(() => {
    return filterConfig.enableSecurityValidation ? new FilterSecurityValidator() : null
  }, [filterConfig.enableSecurityValidation])
  
  // ============================================================================
  // MEMOIZED CLIENT LOOKUP
  // ============================================================================
  
  /**
   * Memoized client lookup Map for O(1) performance
   * Performance Expert: Optimized client lookup
   */
  const clientsMap = useMemo(() => {
    if (!filterConfig.enableClientMemoization) {
      return null
    }
    
    performanceMonitor.startMeasurement()
    const map = new Map(clients.map(client => [client.id, client]))
    performanceMonitor.endMeasurement(clients.length, map.size)
    
    return map
  }, [clients, filterConfig.enableClientMemoization, performanceMonitor])
  
  // ============================================================================
  // OPTIMIZED FILTERING FUNCTIONS
  // ============================================================================
  
  /**
   * Optimized search filtering with security and performance monitoring
   */
  const performOptimizedSearchFilter = useCallback((
    automationsToFilter: Automation[],
    searchTerm: string
  ): Automation[] => {
    if (!searchTerm.trim()) {
      return automationsToFilter
    }
    
    // Performance monitoring
    const searchStartTime = performance.now()
    
    // Security validation
    let sanitizedTerm = searchTerm.toLowerCase()
    if (securityValidator) {
      const sanitizedInput = securityValidator.sanitizeSearchInput(searchTerm)
      sanitizedTerm = sanitizedInput.sanitized.toLowerCase()
      
      if (!sanitizedTerm) {
        return []
      }
    }
    
    // Optimized filtering
    const filtered = automationsToFilter.filter(automation => {
      // Search in automation name
      const nameMatch = automation.name.toLowerCase().includes(sanitizedTerm)
      
      // Search in client name (optimized lookup)
      let clientMatch = false
      if (clientsMap) {
        const client = clientsMap.get(automation.client_id)
        clientMatch = client ? client.name.toLowerCase().includes(sanitizedTerm) : false
      } else {
        // Fallback to linear search if memoization disabled
        const client = clients.find(c => c.id === automation.client_id)
        clientMatch = client ? client.name.toLowerCase().includes(sanitizedTerm) : false
      }
      
      return nameMatch || clientMatch
    })
    
    const searchEndTime = performance.now()
    const searchDuration = searchEndTime - searchStartTime
    
    // Performance logging
    if (filterConfig.enablePerformanceLogging && searchDuration > (filterConfig.performanceWarningThreshold || 50)) {
      console.warn(`Search filtering took ${searchDuration.toFixed(2)}ms for "${searchTerm}" (${automationsToFilter.length} → ${filtered.length} items)`)
    }
    
    return filtered
  }, [securityValidator, clientsMap, clients, filterConfig.enablePerformanceLogging, filterConfig.performanceWarningThreshold])
  
  /**
   * Optimized client filtering
   */
  const performOptimizedClientFilter = useCallback((
    automationsToFilter: Automation[],
    clientId: string | null
  ): Automation[] => {
    if (!clientId) {
      return automationsToFilter
    }
    
    const startTime = performance.now()
    
    const filtered = automationsToFilter.filter(automation => automation.client_id === clientId)
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    if (filterConfig.enablePerformanceLogging && duration > (filterConfig.performanceWarningThreshold || 50)) {
      console.warn(`Client filtering took ${duration.toFixed(2)}ms for client "${clientId}" (${automationsToFilter.length} → ${filtered.length} items)`)
    }
    
    return filtered
  }, [filterConfig.enablePerformanceLogging, filterConfig.performanceWarningThreshold])
  
  /**
   * Optimized status filtering
   */
  const performOptimizedStatusFilter = useCallback((
    automationsToFilter: Automation[],
    statuses: string[]
  ): Automation[] => {
    if (statuses.length === 0) {
      return automationsToFilter
    }
    
    const startTime = performance.now()
    
    // Use Set for O(1) lookup performance
    const statusSet = new Set(statuses)
    const filtered = automationsToFilter.filter(automation => statusSet.has(automation.status))
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    if (filterConfig.enablePerformanceLogging && duration > (filterConfig.performanceWarningThreshold || 50)) {
      console.warn(`Status filtering took ${duration.toFixed(2)}ms for statuses [${statuses.join(', ')}] (${automationsToFilter.length} → ${filtered.length} items)`)
    }
    
    return filtered
  }, [filterConfig.enablePerformanceLogging, filterConfig.performanceWarningThreshold])
  
  // ============================================================================
  // COMBINED OPTIMIZED FILTERING
  // ============================================================================
  
  /**
   * Combined optimized filtering with comprehensive performance monitoring
   */
  const filteredAutomations = useMemo(() => {
    performanceMonitor.startMeasurement()
    
    try {
      let filtered = automations
      
      // Apply search filter
      if (filters.search) {
        filtered = performOptimizedSearchFilter(filtered, filters.search)
      }
      
      // Apply client filter
      if (filters.client) {
        filtered = performOptimizedClientFilter(filtered, filters.client)
      }
      
      // Apply status filter
      if (filters.status.length > 0) {
        filtered = performOptimizedStatusFilter(filtered, filters.status)
      }
      
      performanceMonitor.endMeasurement(automations.length, filtered.length)
      
      return filtered
    } catch (error) {
      console.error('Error during optimized filtering:', error)
      performanceMonitor.endMeasurement(automations.length, 0)
      return automations // Fallback to unfiltered data
    }
  }, [
    automations,
    filters.search,
    filters.client,
    filters.status,
    performOptimizedSearchFilter,
    performOptimizedClientFilter,
    performOptimizedStatusFilter,
    performanceMonitor
  ])
  
  // ============================================================================
  // PERFORMANCE ANALYTICS
  // ============================================================================
  
  /**
   * Get current performance metrics
   */
  const getCurrentPerformanceMetrics = useCallback((): FilterPerformanceMetrics | null => {
    return performanceMonitor.metrics
  }, [performanceMonitor.metrics])
  
  /**
   * Get performance history
   */
  const getPerformanceHistory = useCallback(() => {
    return performanceMonitor.getHistory()
  }, [performanceMonitor])
  
  /**
   * Clear performance history
   */
  const clearPerformanceHistory = useCallback(() => {
    performanceMonitor.clearHistory()
  }, [performanceMonitor])
  
  /**
   * Get performance statistics
   */
  const getPerformanceStatistics = useCallback(() => {
    const history = performanceMonitor.getHistory()
    if (history.length === 0) return null
    
    const durations = history.map(m => m.filterDuration)
    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length
    const minDuration = Math.min(...durations)
    const maxDuration = Math.max(...durations)
    
    return {
      totalMeasurements: history.length,
      averageDuration,
      minDuration,
      maxDuration,
      averageItemsProcessed: history.reduce((sum, m) => sum + m.itemsProcessed, 0) / history.length,
      averageItemsReturned: history.reduce((sum, m) => sum + m.itemsReturned, 0) / history.length,
      performanceScore: Math.max(0, 100 - (averageDuration / (filterConfig.performanceWarningThreshold || 50)) * 50)
    }
  }, [performanceMonitor, filterConfig.performanceWarningThreshold])
  
  // ============================================================================
  // RETURN OPTIMIZED FILTERING INTERFACE
  // ============================================================================
  
  return {
    // Filtered results
    filteredAutomations,
    
    // Performance monitoring
    currentMetrics: getCurrentPerformanceMetrics(),
    performanceHistory: getPerformanceHistory,
    clearPerformanceHistory,
    performanceStatistics: getPerformanceStatistics(),
    
    // Configuration
    config: filterConfig,
    
    // Utilities
    clientsMap,
    securityValidator
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useOptimizedFiltering
