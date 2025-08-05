// src/components/error-boundaries/ErrorBoundary.tsx
/**
 * Enhanced Error Boundary Component - Quest 4.4
 * Implements expert council error boundary enhancement recommendations
 * Provides comprehensive error handling with user-friendly recovery options
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  retryCount: number
  isRecovering: boolean
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void
  enableRetry?: boolean
  maxRetries?: number
  showErrorDetails?: boolean
  level?: 'page' | 'component' | 'feature'
}

interface ErrorReport {
  errorId: string
  timestamp: string
  error: {
    name: string
    message: string
    stack?: string
  }
  errorInfo: {
    componentStack: string
  }
  userAgent: string
  url: string
  userId?: string
  level: string
  retryCount: number
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Enhanced Error Boundary with comprehensive error handling
 * Implements expert council recommendations for production stability
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      isRecovering: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props
    const { errorId } = this.state

    // Update state with error info
    this.setState({ errorInfo })

    // Create comprehensive error report
    const errorReport: ErrorReport = {
      errorId,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack || ''
      },
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      level,
      retryCount: this.state.retryCount
    }

    // Log error for monitoring
    console.error('Error Boundary caught an error:', errorReport)

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo, errorId)
    }

    // Report error to monitoring service (in production)
    this.reportError(errorReport)
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  /**
   * Report error to monitoring service
   * Implements expert council error reporting requirements
   */
  private reportError = async (errorReport: ErrorReport) => {
    try {
      // In production, send to error monitoring service
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/errors/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(errorReport)
        })
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  /**
   * Retry mechanism with exponential backoff
   * Implements expert council error recovery recommendations
   */
  private handleRetry = () => {
    const { maxRetries = 3 } = this.props
    const { retryCount } = this.state

    if (retryCount >= maxRetries) {
      console.warn('Maximum retry attempts reached')
      return
    }

    this.setState({ isRecovering: true })

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, retryCount) * 1000

    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
        isRecovering: false
      })
    }, delay)
  }

  /**
   * Reset error boundary state
   */
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      isRecovering: false
    })
  }

  /**
   * Navigate to home page
   */
  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  /**
   * Report bug to support
   */
  private handleReportBug = () => {
    const { errorId, error } = this.state
    const subject = encodeURIComponent(`Bug Report - Error ID: ${errorId}`)
    const body = encodeURIComponent(`
Error ID: ${errorId}
Error Message: ${error?.message || 'Unknown error'}
URL: ${typeof window !== 'undefined' ? window.location.href : 'Unknown'}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
    `)
    
    const mailtoUrl = `mailto:support@communitee.com?subject=${subject}&body=${body}`
    
    if (typeof window !== 'undefined') {
      window.open(mailtoUrl)
    }
  }

  render() {
    const { children, fallback, enableRetry = true, showErrorDetails = false, level = 'component' } = this.props
    const { hasError, error, errorInfo, errorId, retryCount, isRecovering } = this.state

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Render comprehensive error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4" role="alert">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl font-semibold">
                {level === 'page' ? 'Page Error' : 'Something went wrong'}
              </CardTitle>
              <CardDescription>
                We encountered an unexpected error. Our team has been notified and is working on a fix.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error ID for support */}
              <Alert>
                <AlertDescription>
                  <strong>Error ID:</strong> {errorId}
                  <br />
                  <span className="text-sm text-muted-foreground">
                    Please include this ID when reporting the issue.
                  </span>
                </AlertDescription>
              </Alert>

              {/* Error details (development only) */}
              {showErrorDetails && error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Error:</strong> {error.message}
                    {errorInfo && (
                      <details className="mt-2">
                        <summary className="cursor-pointer">Component Stack</summary>
                        <pre className="mt-2 text-xs overflow-auto">
                          {errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {enableRetry && retryCount < 3 && (
                  <Button
                    onClick={this.handleRetry}
                    disabled={isRecovering}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRecovering ? 'animate-spin' : ''}`} />
                    {isRecovering ? 'Retrying...' : 'Try Again'}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={this.handleReset}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </Button>

                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>

                <Button
                  variant="outline"
                  onClick={this.handleReportBug}
                  className="flex items-center gap-2"
                >
                  <Bug className="h-4 w-4" />
                  Report Bug
                </Button>
              </div>

              {/* Retry count indicator */}
              {retryCount > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  Retry attempt: {retryCount}/3
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return children
  }
}

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

/**
 * Page-level error boundary
 * For wrapping entire pages
 */
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="page"
    enableRetry={true}
    maxRetries={2}
    showErrorDetails={process.env.NODE_ENV === 'development'}
  >
    {children}
  </ErrorBoundary>
)

/**
 * Feature-level error boundary
 * For wrapping major features
 */
export const FeatureErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="feature"
    enableRetry={true}
    maxRetries={3}
    showErrorDetails={process.env.NODE_ENV === 'development'}
  >
    {children}
  </ErrorBoundary>
)

/**
 * Component-level error boundary
 * For wrapping individual components
 */
export const ComponentErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="component"
    enableRetry={true}
    maxRetries={1}
    showErrorDetails={false}
  >
    {children}
  </ErrorBoundary>
)
