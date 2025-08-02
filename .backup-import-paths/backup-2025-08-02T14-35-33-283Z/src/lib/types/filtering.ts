// src/lib/types/filtering.ts
/**
 * Enhanced TypeScript Interface Definitions for Filtering Functionality
 * Quest 4.3 - Expert Council Validated Implementation
 * 
 * Critical Enhancement: TypeScript Interface Definitions & Error Boundaries
 * Expert Consensus: 100% (6/6 experts)
 * Priority: HIGH
 */

import { AutomationStatus, Automation, Client } from './automation'

// ============================================================================
// CORE FILTER STATE INTERFACES
// ============================================================================

/**
 * Filter State Interface
 * Centralized state management for all filtering operations
 */
export interface FilterState {
  /** Search term for automation and client name filtering */
  search: string
  /** Selected client ID (null for "All clients") */
  client: string | null
  /** Array of selected status filters (empty array for all statuses) */
  status: AutomationStatus[]
}

/**
 * Filter State Update Interface
 * Type-safe filter state updates
 */
export interface FilterStateUpdate {
  search?: string
  client?: string | null
  status?: AutomationStatus[]
}

/**
 * Filter State Actions Interface
 * Type-safe filter state management actions
 */
export interface FilterStateActions {
  /** Update search term with input sanitization */
  updateSearch: (term: string) => void
  /** Update selected client */
  updateClient: (clientId: string | null) => void
  /** Update selected statuses (multi-select) */
  updateStatus: (statuses: AutomationStatus[]) => void
  /** Clear all active filters */
  clearFilters: () => void
  /** Check if any filters are active */
  hasActiveFilters: () => boolean
}

/**
 * Complete Filter State Hook Interface
 * Combines state and actions for useFilterState hook
 */
export interface FilterStateHook extends FilterState, FilterStateActions {
  /** Debounced search term for performance optimization */
  debouncedSearch: string
}

// ============================================================================
// FILTERING FUNCTION INTERFACES
// ============================================================================

/**
 * Filter Function Interface
 * Type-safe filtering function signature
 */
export interface FilterFunction<T = Automation> {
  (items: T[], filters: FilterState, clients?: Client[]): T[]
}

/**
 * Search Filter Function Interface
 * Specific interface for search filtering with client lookup
 */
export interface SearchFilterFunction {
  (
    automations: Automation[],
    searchTerm: string,
    clients: Client[]
  ): Automation[]
}

/**
 * Client Filter Function Interface
 * Specific interface for client filtering
 */
export interface ClientFilterFunction {
  (automations: Automation[], clientId: string | null): Automation[]
}

/**
 * Status Filter Function Interface
 * Specific interface for status filtering (multi-select)
 */
export interface StatusFilterFunction {
  (automations: Automation[], statuses: AutomationStatus[]): Automation[]
}

// ============================================================================
// COMPONENT PROP INTERFACES
// ============================================================================

/**
 * Filter Container Props Interface
 * Props for container components managing filter state
 */
export interface FilterContainerProps {
  /** Array of all automations for filtering */
  automations: Automation[]
  /** Array of all clients for client lookup */
  clients: Client[]
  /** Initial filter state (optional) */
  initialFilters?: Partial<FilterState>
  /** Callback for filtered results */
  onFilteredResults?: (automations: Automation[]) => void
  /** Error boundary fallback component */
  errorFallback?: React.ComponentType<ErrorBoundaryProps>
}

/**
 * Filter Presentation Props Interface
 * Props for presentation components displaying filtered data
 */
export interface FilterPresentationProps {
  /** Filtered automations to display */
  automations: Automation[]
  /** Current filter state */
  filters: FilterState
  /** Filter state actions */
  actions: FilterStateActions
  /** Available clients for dropdown */
  availableClients: Client[]
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: FilterError | null
}

/**
 * Toolbar Props Interface
 * Enhanced props for AutomationsToolbar component
 */
export interface ToolbarProps {
  /** Array of all automations for client extraction */
  automations: Automation[]
  /** Current search term */
  searchTerm: string
  /** Currently selected client ID */
  selectedClient: string | null
  /** Array of selected status filters */
  selectedStatuses: AutomationStatus[]
  /** Search term change handler */
  onSearchChange: (term: string) => void
  /** Client selection change handler */
  onClientChange: (clientId: string | null) => void
  /** Status filter change handler */
  onStatusChange: (statuses: AutomationStatus[]) => void
  /** Clear filters handler */
  onClearFilters: () => void
  /** Bulk action handler */
  onBulkAction?: (action: string, automationIds: string[]) => void
  /** Error boundary props */
  errorBoundary?: ErrorBoundaryConfig
}

// ============================================================================
// ERROR HANDLING INTERFACES
// ============================================================================

/**
 * Filter Error Interface
 * Standardized error handling for filtering operations
 */
export interface FilterError {
  /** Error type classification */
  type: 'validation' | 'search' | 'client_lookup' | 'status_filter' | 'system'
  /** Human-readable error message */
  message: string
  /** Technical error details */
  details?: Record<string, unknown>
  /** Error timestamp */
  timestamp: Date
  /** Correlation ID for debugging */
  correlationId?: string
  /** Recovery suggestions */
  recovery?: string[]
}

/**
 * Error Boundary Props Interface
 * Props for filtering error boundary components
 */
export interface ErrorBoundaryProps {
  /** Error that occurred */
  error: FilterError
  /** Function to reset error state */
  resetError: () => void
  /** Fallback component to render */
  fallback?: React.ComponentType<{ error: FilterError; resetError: () => void }>
}

/**
 * Error Boundary Configuration Interface
 * Configuration for error boundary behavior
 */
export interface ErrorBoundaryConfig {
  /** Enable error boundary */
  enabled: boolean
  /** Custom fallback component */
  fallback?: React.ComponentType<ErrorBoundaryProps>
  /** Error reporting callback */
  onError?: (error: FilterError, errorInfo: React.ErrorInfo) => void
  /** Recovery strategies */
  recovery?: {
    /** Auto-retry on transient errors */
    autoRetry?: boolean
    /** Maximum retry attempts */
    maxRetries?: number
    /** Retry delay in milliseconds */
    retryDelay?: number
  }
}

// ============================================================================
// PERFORMANCE OPTIMIZATION INTERFACES
// ============================================================================

/**
 * Memoization Configuration Interface
 * Configuration for performance optimization
 */
export interface MemoizationConfig {
  /** Enable search debouncing */
  debounceSearch: boolean
  /** Debounce delay in milliseconds */
  debounceDelay: number
  /** Enable client lookup memoization */
  memoizeClientLookup: boolean
  /** Enable filtered results memoization */
  memoizeResults: boolean
  /** Cache size for memoized operations */
  cacheSize?: number
}

/**
 * Performance Metrics Interface
 * Metrics for filtering performance monitoring
 */
export interface FilterPerformanceMetrics {
  /** Filter operation duration in milliseconds */
  filterDuration: number
  /** Search operation duration in milliseconds */
  searchDuration: number
  /** Client lookup duration in milliseconds */
  clientLookupDuration: number
  /** Total items processed */
  itemsProcessed: number
  /** Items returned after filtering */
  itemsReturned: number
  /** Memory usage in bytes */
  memoryUsage?: number
  /** Timestamp of measurement */
  timestamp: Date
}

/**
 * Performance Monitor Interface
 * Interface for performance monitoring hooks
 */
export interface PerformanceMonitor {
  /** Current performance metrics */
  metrics: FilterPerformanceMetrics | null
  /** Start performance measurement */
  startMeasurement: () => void
  /** End performance measurement */
  endMeasurement: (itemsProcessed: number, itemsReturned: number) => void
  /** Get performance history */
  getHistory: () => FilterPerformanceMetrics[]
  /** Clear performance history */
  clearHistory: () => void
}

// ============================================================================
// SECURITY INTERFACES
// ============================================================================

/**
 * Input Sanitization Configuration Interface
 * Configuration for input sanitization
 */
export interface SanitizationConfig {
  /** Enable input sanitization */
  enabled: boolean
  /** Maximum input length */
  maxLength: number
  /** Allowed characters regex pattern */
  allowedPattern?: RegExp
  /** Blocked characters regex pattern */
  blockedPattern?: RegExp
  /** HTML sanitization options */
  htmlSanitization?: {
    allowedTags: string[]
    allowedAttributes: string[]
  }
}

/**
 * Sanitized Input Interface
 * Result of input sanitization
 */
export interface SanitizedInput {
  /** Original input value */
  original: string
  /** Sanitized input value */
  sanitized: string
  /** Whether sanitization was applied */
  wasSanitized: boolean
  /** Sanitization warnings */
  warnings?: string[]
}

/**
 * Security Validation Interface
 * Security validation for filtering operations
 */
export interface SecurityValidation {
  /** Validate and sanitize search input */
  sanitizeSearchInput: (input: string) => SanitizedInput
  /** Validate client ID */
  validateClientId: (clientId: string | null) => boolean
  /** Validate status array */
  validateStatusArray: (statuses: AutomationStatus[]) => boolean
  /** Check for malicious patterns */
  checkMaliciousPatterns: (input: string) => boolean
}

// ============================================================================
// MOBILE INTERFACE EXTENSIONS
// ============================================================================

/**
 * Mobile Filter Props Interface
 * Props specific to mobile filtering components
 */
export interface MobileFilterProps extends FilterPresentationProps {
  /** Mobile drawer/modal open state */
  isOpen: boolean
  /** Mobile drawer/modal close handler */
  onClose: () => void
  /** Touch optimization enabled */
  touchOptimized?: boolean
  /** Minimum touch target size in pixels */
  minTouchTarget?: number
}

/**
 * Responsive Configuration Interface
 * Configuration for responsive filtering behavior
 */
export interface ResponsiveConfig {
  /** Mobile breakpoint in pixels */
  mobileBreakpoint: number
  /** Tablet breakpoint in pixels */
  tabletBreakpoint: number
  /** Desktop breakpoint in pixels */
  desktopBreakpoint: number
  /** Enable responsive behavior */
  enabled: boolean
}

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Type guard for FilterState
 */
export function isFilterState(value: unknown): value is FilterState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'search' in value &&
    'client' in value &&
    'status' in value &&
    typeof (value as FilterState).search === 'string' &&
    (typeof (value as FilterState).client === 'string' || (value as FilterState).client === null) &&
    Array.isArray((value as FilterState).status)
  )
}

/**
 * Type guard for FilterError
 */
export function isFilterError(value: unknown): value is FilterError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'message' in value &&
    'timestamp' in value &&
    typeof (value as FilterError).type === 'string' &&
    typeof (value as FilterError).message === 'string' &&
    (value as FilterError).timestamp instanceof Date
  )
}

/**
 * Default filter state
 */
export const DEFAULT_FILTER_STATE: FilterState = {
  search: '',
  client: null,
  status: []
}

/**
 * Default memoization configuration
 */
export const DEFAULT_MEMOIZATION_CONFIG: MemoizationConfig = {
  debounceSearch: true,
  debounceDelay: 300,
  memoizeClientLookup: true,
  memoizeResults: true,
  cacheSize: 100
}

/**
 * Default sanitization configuration
 */
export const DEFAULT_SANITIZATION_CONFIG: SanitizationConfig = {
  enabled: true,
  maxLength: 100,
  allowedPattern: /^[a-zA-Z0-9\s\-_.@]+$/,
  blockedPattern: /[<>'"]/,
  htmlSanitization: {
    allowedTags: [],
    allowedAttributes: []
  }
}

/**
 * Default responsive configuration
 */
export const DEFAULT_RESPONSIVE_CONFIG: ResponsiveConfig = {
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
  desktopBreakpoint: 1280,
  enabled: true
}
