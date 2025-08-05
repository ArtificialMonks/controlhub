// src/components/error-boundaries/FilterErrorBoundary.tsx
/**
 * Filter Error Boundary Component
 * Quest 4.3 - Expert Council Validated Implementation
 * 
 * Critical Enhancement: Error Boundary Implementation
 * Expert Consensus: 100% (6/6 experts)
 * Priority: HIGH
 */

"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  FilterError, 
  ErrorBoundaryProps, 
  ErrorBoundaryConfig,
  isFilterError 
} from '@/lib/types/filtering'

// ============================================================================
// ERROR BOUNDARY STATE INTERFACE
// ============================================================================

interface FilterErrorBoundaryState {
  hasError: boolean
  error: FilterError | null
  errorInfo: ErrorInfo | null
  retryCount: number
  isRetrying: boolean
}

// ============================================================================
// ERROR BOUNDARY PROPS INTERFACE
// ============================================================================

interface FilterErrorBoundaryComponentProps {
  children: ReactNode
  config?: ErrorBoundaryConfig
  fallback?: React.ComponentType<ErrorBoundaryProps>
  onError?: (error: FilterError, errorInfo: ErrorInfo) => void
}

// ============================================================================
// FILTER ERROR BOUNDARY CLASS COMPONENT
// ============================================================================

/**
 * Filter Error Boundary Class Component
 * Catches and handles errors in filtering components with graceful degradation
 */
export class FilterErrorBoundary extends Component<
  FilterErrorBoundaryComponentProps,
  FilterErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: FilterErrorBoundaryComponentProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    }
  }

  /**
   * Static method to derive state from error
   */
  static getDerivedStateFromError(error: Error): Partial<FilterErrorBoundaryState> {
    // Convert generic Error to FilterError
    const filterError: FilterError = isFilterError(error) ? error : {
      type: 'system',
      message: error.message || 'An unexpected error occurred in the filtering system',
      details: {
        name: error.name,
        stack: error.stack,
        cause: error.cause
      },
      timestamp: new Date(),
      correlationId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      recovery: [
        'Try refreshing the page',
        'Clear your browser cache',
        'Contact support if the issue persists'
      ]
    }

    return {
      hasError: true,
      error: filterError
    }
  }

  /**
   * Component did catch lifecycle method
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error info
    this.setState({ errorInfo })

    // Log error for debugging
    console.error('FilterErrorBoundary caught an error:', error, errorInfo)

    // Call custom error handler if provided
    if (this.props.onError && this.state.error) {
      this.props.onError(this.state.error, errorInfo)
    }

    // Call config error handler if provided
    if (this.props.config?.onError && this.state.error) {
      this.props.config.onError(this.state.error, errorInfo)
    }
  }

  /**
   * Reset error state
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    })

    // Clear retry timeout if exists
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
      this.retryTimeoutId = null
    }
  }

  /**
   * Retry with auto-retry logic
   */
  retryWithDelay = () => {
    const config = this.props.config
    const maxRetries = config?.recovery?.maxRetries || 3
    const retryDelay = config?.recovery?.retryDelay || 1000

    if (this.state.retryCount >= maxRetries) {
      console.warn('Maximum retry attempts reached')
      return
    }

    this.setState({ 
      isRetrying: true,
      retryCount: this.state.retryCount + 1
    })

    this.retryTimeoutId = setTimeout(() => {
      this.resetError()
    }, retryDelay)
  }

  /**
   * Auto-retry for transient errors
   */
  componentDidUpdate(prevProps: FilterErrorBoundaryComponentProps, prevState: FilterErrorBoundaryState) {
    const config = this.props.config
    
    // Auto-retry logic for transient errors
    if (
      !prevState.hasError && 
      this.state.hasError && 
      config?.recovery?.autoRetry &&
      this.state.error?.type !== 'validation' && // Don't auto-retry validation errors
      this.state.retryCount === 0
    ) {
      setTimeout(() => {
        this.retryWithDelay()
      }, 100) // Small delay before first retry
    }
  }

  /**
   * Cleanup on unmount
   */
  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  /**
   * Render method
   */
  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        )
      }

      // Use config fallback if provided
      if (this.props.config?.fallback) {
        const ConfigFallbackComponent = this.props.config.fallback
        return (
          <ConfigFallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        )
      }

      // Default error boundary UI
      return (
        <FilterErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          retryCount={this.state.retryCount}
          isRetrying={this.state.isRetrying}
          onRetry={this.retryWithDelay}
          maxRetries={this.props.config?.recovery?.maxRetries || 3}
        />
      )
    }

    return this.props.children
  }
}

// ============================================================================
// DEFAULT ERROR FALLBACK COMPONENT
// ============================================================================

interface FilterErrorFallbackProps {
  error: FilterError
  resetError: () => void
  retryCount: number
  isRetrying: boolean
  onRetry: () => void
  maxRetries: number
}

/**
 * Default Filter Error Fallback Component
 * Provides a user-friendly error display with recovery options
 */
function FilterErrorFallback({
  error,
  resetError,
  retryCount,
  isRetrying,
  onRetry,
  maxRetries
}: FilterErrorFallbackProps) {
  const canRetry = retryCount < maxRetries
  const isValidationError = error.type === 'validation'

  return (
    <Card className="w-full max-w-2xl mx-auto my-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          Filtering Error
        </CardTitle>
        <CardDescription>
          An error occurred while processing your filters. Please try the suggested solutions below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Details */}
        <Alert variant={isValidationError ? "default" : "destructive"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {error.type === 'validation' && 'Validation Error'}
            {error.type === 'search' && 'Search Error'}
            {error.type === 'client_lookup' && 'Client Lookup Error'}
            {error.type === 'status_filter' && 'Status Filter Error'}
            {error.type === 'system' && 'System Error'}
          </AlertTitle>
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>

        {/* Recovery Suggestions */}
        {error.recovery && error.recovery.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Suggested Solutions:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {error.recovery.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-xs mt-1">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            onClick={resetError}
            variant="default"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reset Filters
          </Button>

          {canRetry && !isValidationError && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              disabled={isRetrying}
              className="flex items-center gap-2"
            >
              {isRetrying ? (
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              )}
              Retry ({retryCount}/{maxRetries})
            </Button>
          )}

          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Refresh Page
          </Button>
        </div>

        {/* Debug Information (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="text-sm font-medium cursor-pointer flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Debug Information
            </summary>
            <div className="mt-2 p-3 bg-muted rounded-md">
              <pre className="text-xs overflow-auto">
                {JSON.stringify({
                  error: {
                    type: error.type,
                    message: error.message,
                    timestamp: error.timestamp,
                    correlationId: error.correlationId,
                    details: error.details
                  },
                  retryCount,
                  isRetrying
                }, null, 2)}
              </pre>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// HOOK FOR ERROR BOUNDARY USAGE
// ============================================================================

/**
 * Hook to create error boundary configuration
 */
export function useFilterErrorBoundary(
  onError?: (error: FilterError, errorInfo: ErrorInfo) => void
): ErrorBoundaryConfig {
  return {
    enabled: true,
    onError,
    recovery: {
      autoRetry: true,
      maxRetries: 3,
      retryDelay: 1000
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FilterErrorBoundary
export { FilterErrorFallback }
