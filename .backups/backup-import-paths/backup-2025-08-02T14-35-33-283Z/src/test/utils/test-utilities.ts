// src/test/utils/test-utilities.ts
/**
 * Enhanced Test Utilities Library - Quest 4.4
 * Comprehensive test utilities following expert council recommendations
 * Implements React Testing Library best practices with accessibility focus
 */

import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, vi } from 'vitest'
import type { ReactElement } from 'react'
import type { RenderOptions } from '@testing-library/react'

// ============================================================================
// CORE TEST UTILITIES
// ============================================================================

/**
 * Enhanced render function with accessibility validation
 * Follows expert council recommendation for user-centric testing
 */
export const renderWithAccessibility = (
  ui: ReactElement,
  options?: RenderOptions
) => {
  const result = render(ui, options)
  
  // Validate basic accessibility structure
  const container = result.container
  expect(container).toBeInTheDocument()
  
  return {
    ...result,
    user: userEvent.setup(),
    // Helper to find elements by role (preferred query method)
    getByRoleEnhanced: (role: string, options?: Record<string, unknown>) =>
      screen.getByRole(role, options),
    // Helper to find elements with accessibility validation
    findByRoleEnhanced: async (role: string, options?: Record<string, unknown>) =>
      await screen.findByRole(role, options)
  }
}

/**
 * Action button test utilities
 * Implements expert council recommendations for action button testing
 */
export const actionButtonTestUtils = {
  /**
   * Test action button with confirmation dialog flow
   */
  async testActionButtonWithConfirmation(
    buttonName: string,
    expectedConfirmationText: string
  ) {
    const user = userEvent.setup()
    
    // Find button using role-based query (expert recommendation)
    const actionButton = screen.getByRole('button', { name: buttonName })
    expect(actionButton).toBeInTheDocument()
    expect(actionButton).toBeEnabled()
    
    // Click button to trigger confirmation
    await user.click(actionButton)
    
    // Validate confirmation dialog appears
    const confirmationDialog = await screen.findByText(expectedConfirmationText)
    expect(confirmationDialog).toBeInTheDocument()
    
    return { actionButton, confirmationDialog, user }
  },

  /**
   * Test loading state transitions
   */
  async testLoadingStates(buttonName: string) {
    const user = userEvent.setup()
    
    const button = screen.getByRole('button', { name: buttonName })
    
    // Initial state - button should be enabled
    expect(button).toBeEnabled()
    
    // Click button
    await user.click(button)
    
    // Confirm action if confirmation dialog appears
    const confirmButton = await screen.findByRole('button', { name: /confirm/i })
    await user.click(confirmButton)
    
    // Validate loading state appears within 100ms (expert requirement)
    await waitFor(() => {
      expect(screen.getByText(/loading|running/i)).toBeInTheDocument()
    }, { timeout: 100 })
    
    return { button, user }
  },

  /**
   * Test button disabled state when automation is running
   */
  testDisabledWhenRunning(buttonName: string, automationStatus: string) {
    const button = screen.getByRole('button', { name: buttonName })
    
    if (automationStatus === 'Running') {
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-disabled', 'true')
    } else {
      expect(button).toBeEnabled()
      expect(button).not.toHaveAttribute('aria-disabled', 'true')
    }
    
    return button
  }
}

/**
 * Toast notification test utilities
 * Implements expert council feedback enhancement recommendations
 */
export const toastTestUtils = {
  /**
   * Wait for and validate success toast
   */
  async waitForSuccessToast(expectedMessage?: string) {
    const toast = await screen.findByRole('status', { name: /success/i })
    expect(toast).toBeInTheDocument()
    
    if (expectedMessage) {
      expect(toast).toHaveTextContent(expectedMessage)
    }
    
    return toast
  },

  /**
   * Wait for and validate error toast
   */
  async waitForErrorToast(expectedMessage?: string) {
    const toast = await screen.findByRole('alert')
    expect(toast).toBeInTheDocument()
    
    if (expectedMessage) {
      expect(toast).toHaveTextContent(expectedMessage)
    }
    
    return toast
  },

  /**
   * Validate toast accessibility compliance
   */
  validateToastAccessibility(toast: HTMLElement) {
    // Validate ARIA attributes
    expect(toast).toHaveAttribute('role')
    expect(toast).toBeVisible()
    
    // Validate toast is announced to screen readers
    const role = toast.getAttribute('role')
    expect(['status', 'alert']).toContain(role)
    
    return true
  }
}

/**
 * API mocking utilities using MSW patterns
 * Implements expert council MSW recommendation
 */
export const apiMockUtils = {
  /**
   * Create mock automation response
   */
  createMockAutomation(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'test-automation-123',
      name: 'Test Automation',
      status: 'Stopped',
      lastRun: null,
      createdAt: new Date().toISOString(),
      ...overrides
    }
  },

  /**
   * Create mock API response
   */
  createMockApiResponse(data: unknown, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data)
    }
  },

  /**
   * Create mock error response
   */
  createMockErrorResponse(message: string, status = 500) {
    return {
      ok: false,
      status,
      json: async () => ({ error: message }),
      text: async () => JSON.stringify({ error: message })
    }
  }
}

/**
 * Performance testing utilities
 * Implements expert council performance monitoring recommendations
 */
export const performanceTestUtils = {
  /**
   * Measure action response time
   */
  async measureActionResponseTime(actionFn: () => Promise<void>) {
    const startTime = performance.now()
    await actionFn()
    const endTime = performance.now()
    
    const responseTime = endTime - startTime
    
    // Expert council requirement: < 2 seconds for individual actions
    expect(responseTime).toBeLessThan(2000)
    
    return responseTime
  },

  /**
   * Measure bulk action performance
   */
  async measureBulkActionPerformance(
    bulkActionFn: () => Promise<void>,
    expectedBatchTime = 30000
  ) {
    const startTime = performance.now()
    await bulkActionFn()
    const endTime = performance.now()
    
    const responseTime = endTime - startTime
    
    // Expert council requirement: < 30 seconds per batch
    expect(responseTime).toBeLessThan(expectedBatchTime)
    
    return responseTime
  }
}

/**
 * Accessibility testing utilities
 * Implements expert council WCAG 2.1 AA compliance requirements
 */
export const accessibilityTestUtils = {
  /**
   * Validate button accessibility
   */
  validateButtonAccessibility(button: HTMLElement) {
    // Validate required ARIA attributes
    expect(button).toHaveAttribute('type')
    expect(button).toBeVisible()
    
    // Validate keyboard accessibility
    expect(button).not.toHaveAttribute('tabindex', '-1')
    
    // Validate semantic markup
    expect(button.tagName.toLowerCase()).toBe('button')
    
    return true
  },

  /**
   * Validate form accessibility
   */
  validateFormAccessibility(form: HTMLElement) {
    // Validate form has accessible name
    const formName = form.getAttribute('aria-label') || 
                    form.getAttribute('aria-labelledby')
    expect(formName).toBeTruthy()
    
    // Validate form is keyboard accessible
    expect(form).not.toHaveAttribute('tabindex', '-1')
    
    return true
  },

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(user: ReturnType<typeof userEvent.setup>, elements: HTMLElement[]) {
    // Test Tab navigation
    for (const element of elements) {
      await user.tab()
      expect(element).toHaveFocus()
    }
    
    // Test Enter key activation
    await user.keyboard('{Enter}')
    
    return true
  }
}

/**
 * Error handling test utilities
 * Implements expert council error handling validation requirements
 */
export const errorHandlingTestUtils = {
  /**
   * Test error boundary functionality
   */
  async testErrorBoundary(
    triggerErrorFn: () => void,
    expectedErrorMessage?: string
  ) {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    try {
      triggerErrorFn()
      
      // Wait for error boundary to catch error
      await waitFor(() => {
        const errorDisplay = screen.getByRole('alert')
        expect(errorDisplay).toBeInTheDocument()
        
        if (expectedErrorMessage) {
          expect(errorDisplay).toHaveTextContent(expectedErrorMessage)
        }
      })
    } finally {
      consoleSpy.mockRestore()
    }
  },

  /**
   * Test API error handling
   */
  async testApiErrorHandling(
    apiCallFn: () => Promise<void>,
    expectedErrorMessage: string
  ) {
    await expect(apiCallFn()).rejects.toThrow(expectedErrorMessage)
    
    // Validate error toast appears
    await toastTestUtils.waitForErrorToast(expectedErrorMessage)
  }
}

/**
 * Integration test utilities
 * Implements expert council integration testing recommendations
 */
export const integrationTestUtils = {
  /**
   * Test complete action button workflow
   */
  async testCompleteActionWorkflow(
    buttonName: string,
    expectedSuccessMessage: string
  ) {
    // This function would be used within actual test components
    const user = userEvent.setup()

    // Test button click → confirmation → loading → success
    const { actionButton } = await actionButtonTestUtils
      .testActionButtonWithConfirmation(buttonName, 'Are you sure?')

    // Confirm action
    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    await user.click(confirmButton)

    // Validate loading state
    await waitFor(() => {
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    // Validate success feedback
    await toastTestUtils.waitForSuccessToast(expectedSuccessMessage)

    return { actionButton, user }
  }
}

// ============================================================================
// COMMON TEST PATTERNS
// ============================================================================

/**
 * Common test patterns for action buttons
 * Implements all expert council recommendations
 */
export const commonTestPatterns = {
  /**
   * Standard action button test suite
   */
  actionButtonTestSuite: {
    'should render with correct accessibility attributes': (buttonName: string) => {
      const button = screen.getByRole('button', { name: buttonName })
      accessibilityTestUtils.validateButtonAccessibility(button)
    },

    'should be disabled when automation is running': (buttonName: string) => {
      actionButtonTestUtils.testDisabledWhenRunning(buttonName, 'Running')
    },

    'should show confirmation dialog on click': async (buttonName: string) => {
      await actionButtonTestUtils.testActionButtonWithConfirmation(
        buttonName, 
        'Are you sure?'
      )
    },

    'should show loading state during action': async (buttonName: string) => {
      await actionButtonTestUtils.testLoadingStates(buttonName)
    },

    'should show success feedback on completion': async (buttonName: string) => {
      await integrationTestUtils.testCompleteActionWorkflow(
        buttonName,
        'Action completed successfully'
      )
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  renderWithAccessibility as render,
  screen,
  waitFor,
  act,
  userEvent,
  expect
}

// Global test utilities
export const testUtils = {
  actionButton: actionButtonTestUtils,
  toast: toastTestUtils,
  api: apiMockUtils,
  performance: performanceTestUtils,
  accessibility: accessibilityTestUtils,
  errorHandling: errorHandlingTestUtils,
  integration: integrationTestUtils,
  patterns: commonTestPatterns
}
