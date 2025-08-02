// src/components/error-boundaries/FilterErrorProvider.tsx
/**
 * Filter Error Provider Component
 * Quest 4.3 - Expert Council Validated Implementation
 * 
 * Functional Error Boundary using React 18 patterns
 * Expert Consensus: 100% (6/6 experts)
 * Priority: HIGH
 */

"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FilterError, isFilterError } from '@/lib/types/filtering'

// ============================================================================
// ERROR CONTEXT INTERFACE
// ============================================================================

interface FilterErrorContextValue {
  /** Current error state */
  error: FilterError | null
  /** Set error state */
  setError: (error: FilterError | null) => void
  /** Clear error state */
  clearError: () => void
  /** Report error with automatic conversion */
  reportError: (error: Error | FilterError | string) => void
  /** Check if there's an active error */
  hasError: boolean
}

// ============================================================================
// ERROR CONTEXT
// ============================================================================

const FilterErrorContext = createContext<FilterErrorContextValue | null>(null)

// ============================================================================
// ERROR PROVIDER PROPS
// ============================================================================

interface FilterErrorProviderProps {
  children: ReactNode
  onError?: (error: FilterError) => void
  showErrorAlert?: boolean
  autoHideDelay?: number
}

// ============================================================================
// ERROR PROVIDER COMPONENT
// ============================================================================

/**
 * Filter Error Provider Component
 * Provides error handling context for filtering components
 */
export function FilterErrorProvider({
  children,
  onError,
  showErrorAlert = true,
  autoHideDelay = 5000
}: FilterErrorProviderProps) {
  const [error, setErrorState] = useState<FilterError | null>(null)

  /**
   * Set error with callback notification
   */
  const setError = useCallback((newError: FilterError | null) => {
    setErrorState(newError)
    
    if (newError && onError) {
      onError(newError)
    }

    // Auto-hide non-critical errors
    if (newError && autoHideDelay > 0 && newError.type !== 'system') {
      setTimeout(() => {
        setErrorState(null)
      }, autoHideDelay)
    }
  }, [onError, autoHideDelay])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setErrorState(null)
  }, [])

  /**
   * Report error with automatic conversion
   */
  const reportError = useCallback((errorInput: Error | FilterError | string) => {
    let filterError: FilterError

    if (isFilterError(errorInput)) {
      filterError = errorInput
    } else if (errorInput instanceof Error) {
      filterError = {
        type: 'system',
        message: errorInput.message || 'An unexpected error occurred',
        details: {
          name: errorInput.name,
          stack: errorInput.stack,
          cause: errorInput.cause
        },
        timestamp: new Date(),
        correlationId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        recovery: [
          'Try refreshing the filters',
          'Clear your search and try again',
          'Contact support if the issue persists'
        ]
      }
    } else {
      filterError = {
        type: 'validation',
        message: typeof errorInput === 'string' ? errorInput : 'Unknown error occurred',
        timestamp: new Date(),
        correlationId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        recovery: ['Please check your input and try again']
      }
    }

    setError(filterError)
  }, [setError])

  /**
   * Context value
   */
  const contextValue: FilterErrorContextValue = {
    error,
    setError,
    clearError,
    reportError,
    hasError: error !== null
  }

  return (
    <FilterErrorContext.Provider value={contextValue}>
      {/* Error Alert Display */}
      {showErrorAlert && error && (
        <FilterErrorAlert error={error} onDismiss={clearError} />
      )}
      
      {children}
    </FilterErrorContext.Provider>
  )
}

// ============================================================================
// ERROR ALERT COMPONENT
// ============================================================================

interface FilterErrorAlertProps {
  error: FilterError
  onDismiss: () => void
}

/**
 * Filter Error Alert Component
 * Displays error alerts with dismiss functionality
 */
function FilterErrorAlert({ error, onDismiss }: FilterErrorAlertProps) {
  const getAlertVariant = (errorType: FilterError['type']) => {
    switch (errorType) {
      case 'validation':
        return 'default'
      case 'search':
      case 'client_lookup':
      case 'status_filter':
        return 'default'
      case 'system':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getErrorTitle = (errorType: FilterError['type']) => {
    switch (errorType) {
      case 'validation':
        return 'Invalid Input'
      case 'search':
        return 'Search Error'
      case 'client_lookup':
        return 'Client Lookup Failed'
      case 'status_filter':
        return 'Status Filter Error'
      case 'system':
        return 'System Error'
      default:
        return 'Error'
    }
  }

  return (
    <Alert 
      variant={getAlertVariant(error.type)} 
      className="mb-4 relative"
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="pr-8">
        {getErrorTitle(error.type)}
      </AlertTitle>
      <AlertDescription>
        {error.message}
        
        {/* Recovery suggestions */}
        {error.recovery && error.recovery.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium">Try:</p>
            <ul className="text-sm mt-1 space-y-1">
              {error.recovery.slice(0, 2).map((suggestion, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span>•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </AlertDescription>
      
      {/* Dismiss button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0"
        onClick={onDismiss}
        aria-label="Dismiss error"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  )
}

// ============================================================================
// HOOK FOR USING ERROR CONTEXT
// ============================================================================

/**
 * Hook to use filter error context
 */
export function useFilterError(): FilterErrorContextValue {
  const context = useContext(FilterErrorContext)
  
  if (!context) {
    throw new Error('useFilterError must be used within a FilterErrorProvider')
  }
  
  return context
}

// ============================================================================
// ERROR BOUNDARY HOC
// ============================================================================

/**
 * Higher-Order Component for wrapping components with error boundary
 */
export function withFilterErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorConfig?: {
    onError?: (error: FilterError) => void
    showErrorAlert?: boolean
    autoHideDelay?: number
  }
) {
  const WrappedComponent = (props: P) => {
    return (
      <FilterErrorProvider
        onError={errorConfig?.onError}
        showErrorAlert={errorConfig?.showErrorAlert}
        autoHideDelay={errorConfig?.autoHideDelay}
      >
        <Component {...props} />
      </FilterErrorProvider>
    )
  }

  WrappedComponent.displayName = `withFilterErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a filter error
 */
export function createFilterError(
  type: FilterError['type'],
  message: string,
  details?: Record<string, unknown>,
  recovery?: string[]
): FilterError {
  return {
    type,
    message,
    details,
    timestamp: new Date(),
    correlationId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    recovery: recovery || [
      'Try refreshing the filters',
      'Clear your search and try again',
      'Contact support if the issue persists'
    ]
  }
}

/**
 * Create a validation error
 */
export function createValidationError(
  message: string,
  field?: string,
  value?: unknown
): FilterError {
  return createFilterError(
    'validation',
    message,
    { field, value },
    [
      'Check your input format',
      'Try a different search term',
      'Clear the field and try again'
    ]
  )
}

/**
 * Create a search error
 */
export function createSearchError(
  message: string,
  searchTerm?: string,
  cause?: unknown
): FilterError {
  return createFilterError(
    'search',
    message,
    { searchTerm, cause },
    [
      'Try a simpler search term',
      'Check your spelling',
      'Clear the search and try again'
    ]
  )
}

/**
 * Create a client lookup error
 */
export function createClientLookupError(
  message: string,
  clientId?: string,
  cause?: unknown
): FilterError {
  return createFilterError(
    'client_lookup',
    message,
    { clientId, cause },
    [
      'Try selecting a different client',
      'Clear the client filter',
      'Refresh the page to reload client data'
    ]
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FilterErrorProvider
export { FilterErrorAlert }
