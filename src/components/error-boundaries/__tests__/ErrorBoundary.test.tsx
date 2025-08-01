// src/components/error-boundaries/__tests__/ErrorBoundary.test.tsx
/**
 * Enhanced Error Boundary Tests - Quest 4.4
 * Implements expert council error boundary testing requirements
 * Comprehensive test coverage for error handling and recovery
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ErrorBoundary, PageErrorBoundary, FeatureErrorBoundary, ComponentErrorBoundary } from '../ErrorBoundary'

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Component that throws an error for testing
 */
const ThrowError: React.FC<{ shouldThrow?: boolean; errorMessage?: string }> = ({ 
  shouldThrow = true, 
  errorMessage = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage)
  }
  return <div>No error</div>
}

/**
 * Mock fetch for error reporting tests
 */
const mockFetch = vi.fn()
global.fetch = mockFetch

/**
 * Mock console methods
 */
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

// ============================================================================
// TEST SETUP
// ============================================================================

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  // ==========================================================================
  // BASIC ERROR BOUNDARY FUNCTIONALITY
  // ==========================================================================

  describe('Basic Error Handling', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should catch and display error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument()
    })

    it('should display error ID for support tracking', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const errorIdElement = screen.getByText(/Error ID:/)
      expect(errorIdElement).toBeInTheDocument()
      expect(errorIdElement.textContent).toMatch(/error-\d+-[a-z0-9]+/)
    })

    it('should call onError callback when error occurs', () => {
      const onError = vi.fn()
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError errorMessage="Custom error message" />
        </ErrorBoundary>
      )

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        }),
        expect.stringMatching(/error-\d+-[a-z0-9]+/)
      )
    })
  })

  // ==========================================================================
  // ERROR BOUNDARY LEVELS
  // ==========================================================================

  describe('Error Boundary Levels', () => {
    it('should display "Page Error" for page-level boundary', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Page Error')).toBeInTheDocument()
    })

    it('should display "Something went wrong" for component-level boundary', () => {
      render(
        <ErrorBoundary level="component">
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should display "Something went wrong" for feature-level boundary', () => {
      render(
        <ErrorBoundary level="feature">
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // RETRY FUNCTIONALITY
  // ==========================================================================

  describe('Retry Functionality', () => {
    it('should show retry button when enableRetry is true', () => {
      render(
        <ErrorBoundary enableRetry={true}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('should not show retry button when enableRetry is false', () => {
      render(
        <ErrorBoundary enableRetry={false}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
    })

    it('should retry and recover when retry button is clicked', async () => {
      const user = userEvent.setup()
      let shouldThrow = true

      const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />

      render(
        <ErrorBoundary enableRetry={true}>
          <TestComponent />
        </ErrorBoundary>
      )

      // Verify error state
      expect(screen.getByRole('alert')).toBeInTheDocument()

      // Change the error condition
      shouldThrow = false

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /try again/i })
      await user.click(retryButton)

      // Wait for retry delay and verify recovery
      await waitFor(() => {
        expect(screen.getByText('No error')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should show retry count and disable retry after max attempts', async () => {
      const user = userEvent.setup()

      render(
        <ErrorBoundary enableRetry={true} maxRetries={2}>
          <ThrowError />
        </ErrorBoundary>
      )

      // First retry
      const retryButton = screen.getByRole('button', { name: /try again/i })
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('Retry attempt: 1/3')).toBeInTheDocument()
      })

      // Second retry
      await user.click(screen.getByRole('button', { name: /try again/i }))

      await waitFor(() => {
        expect(screen.getByText('Retry attempt: 2/3')).toBeInTheDocument()
      })

      // Third retry should not be available
      await user.click(screen.getByRole('button', { name: /try again/i }))

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // ACTION BUTTONS
  // ==========================================================================

  describe('Action Buttons', () => {
    it('should show all action buttons', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /report bug/i })).toBeInTheDocument()
    })

    it('should reset error state when reset button is clicked', async () => {
      const user = userEvent.setup()
      let shouldThrow = true

      const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />

      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      )

      // Verify error state
      expect(screen.getByRole('alert')).toBeInTheDocument()

      // Change the error condition
      shouldThrow = false

      // Click reset button
      const resetButton = screen.getByRole('button', { name: /reset/i })
      await user.click(resetButton)

      // Verify recovery
      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('should open mailto link when report bug button is clicked', async () => {
      const user = userEvent.setup()
      const mockOpen = vi.fn()
      Object.defineProperty(window, 'open', { value: mockOpen })

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const reportButton = screen.getByRole('button', { name: /report bug/i })
      await user.click(reportButton)

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('mailto:support@communitee.com')
      )
    })
  })

  // ==========================================================================
  // ERROR DETAILS
  // ==========================================================================

  describe('Error Details', () => {
    it('should show error details when showErrorDetails is true', () => {
      render(
        <ErrorBoundary showErrorDetails={true}>
          <ThrowError errorMessage="Detailed error message" />
        </ErrorBoundary>
      )

      expect(screen.getByText('Detailed error message')).toBeInTheDocument()
      expect(screen.getByText('Component Stack')).toBeInTheDocument()
    })

    it('should not show error details when showErrorDetails is false', () => {
      render(
        <ErrorBoundary showErrorDetails={false}>
          <ThrowError errorMessage="Hidden error message" />
        </ErrorBoundary>
      )

      expect(screen.queryByText('Hidden error message')).not.toBeInTheDocument()
      expect(screen.queryByText('Component Stack')).not.toBeInTheDocument()
    })
  })

  // ==========================================================================
  // CUSTOM FALLBACK
  // ==========================================================================

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom error message')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })
  })

  // ==========================================================================
  // ERROR REPORTING
  // ==========================================================================

  describe('Error Reporting', () => {
    it('should report error to API in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      render(
        <ErrorBoundary>
          <ThrowError errorMessage="Production error" />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/errors/report',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: expect.stringContaining('Production error')
          })
        )
      })

      process.env.NODE_ENV = originalEnv
    })

    it('should not report error to API in development', async () => {
      process.env.NODE_ENV = 'development'

      render(
        <ErrorBoundary>
          <ThrowError errorMessage="Development error" />
        </ErrorBoundary>
      )

      // Wait a bit to ensure no API call is made
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // CONVENIENCE COMPONENTS
  // ==========================================================================

  describe('Convenience Components', () => {
    it('should render PageErrorBoundary with correct props', () => {
      render(
        <PageErrorBoundary>
          <ThrowError />
        </PageErrorBoundary>
      )

      expect(screen.getByText('Page Error')).toBeInTheDocument()
    })

    it('should render FeatureErrorBoundary with correct props', () => {
      render(
        <FeatureErrorBoundary>
          <ThrowError />
        </FeatureErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should render ComponentErrorBoundary with correct props', () => {
      render(
        <ComponentErrorBoundary>
          <ThrowError />
        </ComponentErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const errorContainer = screen.getByRole('alert')
      expect(errorContainer).toBeInTheDocument()
    })

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // Tab through buttons
      await user.tab()
      expect(screen.getByRole('button', { name: /try again/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: /reset/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: /go home/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: /report bug/i })).toHaveFocus()
    })
  })
})
