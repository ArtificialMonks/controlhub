// src/hooks/useFilterState.ts
/**
 * Centralized Filter State Management Hook
 * Quest 4.3 - Expert Council Validated Implementation
 * 
 * Enhanced Architecture Refactoring: Container/Presentation Pattern
 * Expert Consensus: 100% (6/6 experts)
 * Priority: HIGH
 */

"use client"

import { useState, useCallback, useMemo } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'
import {
  FilterState,
  FilterStateHook,
  DEFAULT_FILTER_STATE,
  DEFAULT_MEMOIZATION_CONFIG,
  MemoizationConfig
} from '@/lib/types/filtering'
import { AutomationStatus } from '@/lib/types/automation'

// ============================================================================
// HOOK CONFIGURATION INTERFACE
// ============================================================================

interface UseFilterStateConfig {
  /** Initial filter state */
  initialState?: Partial<FilterState>
  /** Memoization configuration */
  memoization?: Partial<MemoizationConfig>
  /** Callback when filters change */
  onChange?: (filters: FilterState) => void
  /** Callback when filters are cleared */
  onClear?: () => void
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean
  /** Performance monitoring configuration */
  performanceConfig?: {
    enabled: boolean
    warningThreshold: number
    errorThreshold: number
    logWarnings: boolean
  }
}

// ============================================================================
// CENTRALIZED FILTER STATE HOOK
// ============================================================================

/**
 * Centralized Filter State Management Hook
 * 
 * Provides type-safe, performance-optimized filter state management
 * with debounced search, memoized operations, and callback support.
 * 
 * Expert Council Validated Features:
 * - Architecture Expert: Clean separation of concerns
 * - Performance Expert: Debounced search and memoization
 * - Security Expert: Input sanitization integration points
 * - Quality Expert: Type-safe state management
 * - Integration Expert: Centralized state for all components
 * - UX Expert: Responsive and accessible state management
 */
export function useFilterState(config: UseFilterStateConfig = {}): FilterStateHook {
  // ============================================================================
  // CONFIGURATION SETUP
  // ============================================================================

  const {
    initialState = {},
    memoization = {},
    onChange,
    onClear,
    enablePerformanceMonitoring = false,
    performanceConfig = {
      enabled: false,
      warningThreshold: 50,
      errorThreshold: 100,
      logWarnings: true
    }
  } = config

  const memoConfig = { ...DEFAULT_MEMOIZATION_CONFIG, ...memoization }

  // ============================================================================
  // PERFORMANCE MONITORING SETUP
  // ============================================================================

  const performanceMonitor = usePerformanceMonitor({
    enabled: enablePerformanceMonitoring || performanceConfig.enabled,
    warningThreshold: performanceConfig.warningThreshold,
    errorThreshold: performanceConfig.errorThreshold,
    logWarnings: performanceConfig.logWarnings,
    maxHistorySize: 50
  })

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [filters, setFilters] = useState<FilterState>(() => ({
    ...DEFAULT_FILTER_STATE,
    ...initialState
  }))

  // Performance Expert: Debounced search for optimization
  const debouncedSearch = useDebounce(
    filters.search, 
    memoConfig.debounceSearch ? memoConfig.debounceDelay : 0
  )

  // ============================================================================
  // STATE UPDATE ACTIONS
  // ============================================================================

  /**
   * Update search term with input sanitization integration point
   * Security Expert: Input sanitization should be applied here
   * Performance Expert: Performance monitoring integrated
   */
  const updateSearch = useCallback((term: string) => {
    // Performance monitoring start
    performanceMonitor.startMeasurement()

    // Input sanitization integration point
    const sanitizedTerm = term.trim().substring(0, 100) // Basic length limit

    const newFilters = { ...filters, search: sanitizedTerm }
    setFilters(newFilters)

    // Performance monitoring end
    performanceMonitor.endMeasurement(1, 1) // 1 item processed, 1 item returned

    if (onChange) {
      onChange(newFilters)
    }
  }, [filters, onChange, performanceMonitor])

  /**
   * Update selected client
   * Performance Expert: Performance monitoring integrated
   */
  const updateClient = useCallback((clientId: string | null) => {
    performanceMonitor.startMeasurement()

    const newFilters = { ...filters, client: clientId }
    setFilters(newFilters)

    performanceMonitor.endMeasurement(1, 1)

    if (onChange) {
      onChange(newFilters)
    }
  }, [filters, onChange, performanceMonitor])

  /**
   * Update selected statuses (multi-select)
   * Performance Expert: Performance monitoring integrated
   */
  const updateStatus = useCallback((statuses: AutomationStatus[]) => {
    performanceMonitor.startMeasurement()

    const newFilters = { ...filters, status: [...statuses] }
    setFilters(newFilters)

    performanceMonitor.endMeasurement(statuses.length, 1)

    if (onChange) {
      onChange(newFilters)
    }
  }, [filters, onChange, performanceMonitor])

  /**
   * Clear all active filters
   * Performance Expert: Performance monitoring integrated
   */
  const clearFilters = useCallback(() => {
    performanceMonitor.startMeasurement()

    const clearedFilters = { ...DEFAULT_FILTER_STATE }
    setFilters(clearedFilters)

    performanceMonitor.endMeasurement(1, 1)

    if (onChange) {
      onChange(clearedFilters)
    }

    if (onClear) {
      onClear()
    }
  }, [onChange, onClear, performanceMonitor])

  /**
   * Check if any filters are active
   * Performance Expert: Memoized for optimization
   */
  const hasActiveFilters = useCallback(() => {
    return (
      filters.search.length > 0 ||
      filters.client !== null ||
      filters.status.length > 0
    )
  }, [filters.search.length, filters.client, filters.status.length])

  // ============================================================================
  // MEMOIZED COMPUTED VALUES
  // ============================================================================

  /**
   * Memoized filter state hook result
   * Performance Expert: Prevents unnecessary re-renders and includes performance monitoring
   */
  const filterStateHook = useMemo(() => ({
    // Current filter state
    search: filters.search,
    client: filters.client,
    status: filters.status,

    // Debounced search for performance
    debouncedSearch,

    // State update actions
    updateSearch,
    updateClient,
    updateStatus,
    clearFilters,
    hasActiveFilters,

    // Performance monitoring access
    performanceMetrics: performanceMonitor.metrics,
    getPerformanceHistory: performanceMonitor.getHistory,
    clearPerformanceHistory: performanceMonitor.clearHistory
  }), [
    filters.search,
    filters.client,
    filters.status,
    debouncedSearch,
    updateSearch,
    updateClient,
    updateStatus,
    clearFilters,
    hasActiveFilters,
    performanceMonitor.metrics,
    performanceMonitor.getHistory,
    performanceMonitor.clearHistory
  ])

  return filterStateHook
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for search-only filtering
 * Simplified hook for components that only need search functionality
 */
export function useSearchFilter(
  initialSearch = '',
  debounceDelay = 300,
  onChange?: (search: string) => void
) {
  const [search, setSearch] = useState(initialSearch)
  const debouncedSearch = useDebounce(search, debounceDelay)

  const updateSearch = useCallback((term: string) => {
    const sanitizedTerm = term.trim().substring(0, 100)
    setSearch(sanitizedTerm)
    
    if (onChange) {
      onChange(sanitizedTerm)
    }
  }, [onChange])

  const clearSearch = useCallback(() => {
    setSearch('')
    if (onChange) {
      onChange('')
    }
  }, [onChange])

  return {
    search,
    debouncedSearch,
    updateSearch,
    clearSearch,
    hasSearch: search.length > 0
  }
}

/**
 * Hook for client filtering
 * Simplified hook for components that only need client filtering
 */
export function useClientFilter(
  initialClient: string | null = null,
  onChange?: (clientId: string | null) => void
) {
  const [selectedClient, setSelectedClient] = useState<string | null>(initialClient)

  const updateClient = useCallback((clientId: string | null) => {
    setSelectedClient(clientId)
    
    if (onChange) {
      onChange(clientId)
    }
  }, [onChange])

  const clearClient = useCallback(() => {
    setSelectedClient(null)
    if (onChange) {
      onChange(null)
    }
  }, [onChange])

  return {
    selectedClient,
    updateClient,
    clearClient,
    hasClient: selectedClient !== null
  }
}

/**
 * Hook for status filtering
 * Simplified hook for components that only need status filtering
 */
export function useStatusFilter(
  initialStatuses: AutomationStatus[] = [],
  onChange?: (statuses: AutomationStatus[]) => void
) {
  const [selectedStatuses, setSelectedStatuses] = useState<AutomationStatus[]>(initialStatuses)

  const updateStatuses = useCallback((statuses: AutomationStatus[]) => {
    setSelectedStatuses([...statuses])
    
    if (onChange) {
      onChange([...statuses])
    }
  }, [onChange])

  const addStatus = useCallback((status: AutomationStatus) => {
    if (!selectedStatuses.includes(status)) {
      const newStatuses = [...selectedStatuses, status]
      setSelectedStatuses(newStatuses)
      
      if (onChange) {
        onChange(newStatuses)
      }
    }
  }, [selectedStatuses, onChange])

  const removeStatus = useCallback((status: AutomationStatus) => {
    const newStatuses = selectedStatuses.filter(s => s !== status)
    setSelectedStatuses(newStatuses)
    
    if (onChange) {
      onChange(newStatuses)
    }
  }, [selectedStatuses, onChange])

  const clearStatuses = useCallback(() => {
    setSelectedStatuses([])
    if (onChange) {
      onChange([])
    }
  }, [onChange])

  return {
    selectedStatuses,
    updateStatuses,
    addStatus,
    removeStatus,
    clearStatuses,
    hasStatuses: selectedStatuses.length > 0
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create filter state from URL search params
 * Utility for URL-based filter state persistence
 */
export function createFilterStateFromParams(searchParams: URLSearchParams): Partial<FilterState> {
  const search = searchParams.get('search') || ''
  const client = searchParams.get('client') || null
  const statusParam = searchParams.get('status')
  const status = statusParam ? statusParam.split(',') as AutomationStatus[] : []

  return {
    search,
    client,
    status
  }
}

/**
 * Convert filter state to URL search params
 * Utility for URL-based filter state persistence
 */
export function convertFilterStateToParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.search) {
    params.set('search', filters.search)
  }

  if (filters.client) {
    params.set('client', filters.client)
  }

  if (filters.status.length > 0) {
    params.set('status', filters.status.join(','))
  }

  return params
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useFilterState
