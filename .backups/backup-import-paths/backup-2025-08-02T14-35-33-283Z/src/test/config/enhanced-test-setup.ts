// src/test/config/enhanced-test-setup.ts
/**
 * Enhanced Test Setup Configuration - Quest 4.4
 * Implements expert council testing architecture recommendations
 * Provides comprehensive test environment setup
 */

import { beforeAll, afterAll, beforeEach, afterEach, vi, expect } from 'vitest'
import { cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// ============================================================================
// GLOBAL TEST SETUP
// ============================================================================

/**
 * Global test setup - runs once before all tests
 * Implements expert council testing infrastructure requirements
 */
beforeAll(() => {
  // Setup performance monitoring for tests
  if (typeof performance === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    global.performance = require('perf_hooks').performance
  }

  // Setup console error suppression for expected errors
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    // Suppress React Testing Library act() warnings in tests
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

/**
 * Global test cleanup - runs once after all tests
 */
afterAll(() => {
  // Restore console.error
  console.error = console.error
})

/**
 * Test setup - runs before each test
 * Implements expert council test isolation requirements
 */
beforeEach(() => {
  // Clear all mocks
  vi.clearAllMocks()

  // Reset DOM state
  document.body.innerHTML = ''

  // Reset any global state
  if (typeof window !== 'undefined') {
    window.localStorage.clear()
    window.sessionStorage.clear()
  }
})

/**
 * Test cleanup - runs after each test
 * Implements expert council test cleanup requirements
 */
afterEach(() => {
  // Cleanup React Testing Library
  cleanup()

  // Clear all timers
  vi.clearAllTimers()

  // Reset all mocks
  vi.resetAllMocks()
})

// ============================================================================
// TEST ENVIRONMENT CONFIGURATION
// ============================================================================

/**
 * Test environment configuration
 * Implements expert council environment standards
 */
export const enhancedTestConfig = {
  // Performance thresholds (expert council requirements)
  performance: {
    individualActionTimeout: 2000, // 2 seconds
    bulkActionTimeout: 30000,      // 30 seconds
    loadingStateTimeout: 100,      // 100ms
    toastTimeout: 5000            // 5 seconds
  },

  // Accessibility testing configuration
  accessibility: {
    enableA11yTesting: true,
    wcagLevel: 'AA',
    includeWarnings: true
  },

  // API testing configuration
  api: {
    baseUrl: 'http://localhost:3000',
    timeout: 5000,
    retries: 3
  },

  // Error handling configuration
  errorHandling: {
    suppressConsoleErrors: true,
    captureErrorBoundaries: true,
    validateErrorMessages: true
  }
}

// ============================================================================
// CUSTOM MATCHERS
// ============================================================================

/**
 * Custom Jest/Vitest matchers for enhanced testing
 * Implements expert council testing enhancement requirements
 */

// Custom matcher: toBeAccessible
expect.extend({
  toBeAccessible(received: HTMLElement) {
    const pass = received.getAttribute('role') !== null ||
                 received.tagName.toLowerCase() === 'button' ||
                 received.tagName.toLowerCase() === 'input' ||
                 received.getAttribute('aria-label') !== null

    return {
      message: () =>
        pass
          ? `Expected element not to be accessible`
          : `Expected element to be accessible (have role, be semantic element, or have aria-label)`,
      pass
    }
  }
})

// Custom matcher: toHaveLoadingState
expect.extend({
  toHaveLoadingState(received: HTMLElement) {
    const hasLoadingText = received.textContent?.toLowerCase().includes('loading') ||
                          received.textContent?.toLowerCase().includes('running')
    const hasLoadingAttribute = received.getAttribute('aria-busy') === 'true'
    const hasDisabledState = received.hasAttribute('disabled')

    const pass = hasLoadingText || hasLoadingAttribute || hasDisabledState

    return {
      message: () =>
        pass
          ? `Expected element not to have loading state`
          : `Expected element to have loading state (loading text, aria-busy, or disabled)`,
      pass
    }
  }
})

// Custom matcher: toHaveValidErrorMessage
expect.extend({
  toHaveValidErrorMessage(received: HTMLElement) {
    const text = received.textContent || ''
    const hasErrorRole = received.getAttribute('role') === 'alert'
    const hasErrorText = text.toLowerCase().includes('error') ||
                        text.toLowerCase().includes('failed') ||
                        text.toLowerCase().includes('unable')
    const isNotEmpty = text.trim().length > 0

    const pass = hasErrorRole && hasErrorText && isNotEmpty

    return {
      message: () =>
        pass
          ? `Expected element not to have valid error message`
          : `Expected element to have valid error message (role="alert", error text, and non-empty)`,
      pass
    }
  }
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create test automation data
 * Standardized test data factory
 */
export const createEnhancedTestAutomation = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'test-automation-123',
  name: 'Test Automation',
  description: 'Test automation for testing purposes',
  status: 'Stopped',
  lastRun: null,
  nextRun: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
})

/**
 * Create test user event instance
 * Standardized user event setup
 */
export const createEnhancedTestUser = () => {
  return userEvent.setup({
    advanceTimers: vi.advanceTimersByTime
  })
}

/**
 * Wait for element with performance tracking
 * Enhanced waitFor with performance monitoring
 */
export const waitForWithEnhancedPerformance = async (
  callback: () => void | Promise<void>,
  options: { timeout?: number } = {}
) => {
  const startTime = performance.now()
  
  await waitFor(callback, {
    timeout: options.timeout || enhancedTestConfig.performance.individualActionTimeout
  })
  
  const endTime = performance.now()
  const duration = endTime - startTime
  
  // Log performance for monitoring
  console.log(`waitFor completed in ${duration}ms`)
  
  return duration
}

/**
 * Mock API response factory
 * Creates standardized mock responses for testing
 */
export const createMockApiResponse = (data: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data)
})

/**
 * Mock error response factory
 * Creates standardized error responses for testing
 */
export const createMockErrorResponse = (message: string, status = 500) => ({
  ok: false,
  status,
  json: async () => ({ error: message }),
  text: async () => JSON.stringify({ error: message })
})

// ============================================================================
// EXPORTS
// ============================================================================

export {
  enhancedTestConfig as testConfig,
  createEnhancedTestAutomation as createTestAutomation,
  createEnhancedTestUser as createTestUser,
  waitForWithEnhancedPerformance as waitForWithPerformance
}

// Re-export testing utilities
export * from '@testing-library/react'
export * from '@testing-library/user-event'
export { vi } from 'vitest'
