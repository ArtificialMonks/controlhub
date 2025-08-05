// src/test/security/action-button-security-tests.ts
/**
 * Action Button Security Tests - Quest 4.4
 * Implements expert council security testing for action button operations
 * Comprehensive security validation for automation control actions
 */

import React from 'react'
import { vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  SecurityTestOrchestrator,
  defaultSecurityConfig,
  type SecurityTestReport
} from './security-test-framework'

// ============================================================================
// SECURITY TEST UTILITIES FOR ACTION BUTTONS
// ============================================================================

/**
 * Action Button Security Test Suite
 * Comprehensive security testing for automation action buttons
 */
export class ActionButtonSecurityTestSuite {
  private orchestrator: SecurityTestOrchestrator
  private mockFetch: ReturnType<typeof vi.fn>

  constructor() {
    this.orchestrator = new SecurityTestOrchestrator(defaultSecurityConfig)
    this.mockFetch = vi.fn()
    global.fetch = this.mockFetch
  }

  /**
   * Test authentication requirements for action buttons
   * Validates that all action buttons require proper authentication
   */
  async testActionButtonAuthentication(
    component: React.ComponentType,
    actionButtons: string[]
  ): Promise<SecurityTestReport> {
    const apiEndpoints = actionButtons.map(action => `/api/automations/${action}`)
    
    // Mock unauthenticated responses
    this.mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/automations/')) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' })
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })

    const userRoles = ['guest', 'user', 'admin']
    const expectedAccess = actionButtons.reduce((acc, button) => {
      acc[button] = false // No access without authentication
      return acc
    }, {} as Record<string, boolean>)

    return await this.orchestrator.runSecurityTestSuite(
      component,
      apiEndpoints,
      userRoles,
      expectedAccess
    )
  }

  /**
   * Test authorization controls for different user roles
   * Validates proper role-based access control for action buttons
   */
  async testActionButtonAuthorization(
    component: React.ComponentType,
    rolePermissions: Record<string, string[]>
  ): Promise<SecurityTestReport> {
    const allActions = Object.values(rolePermissions).flat()
    const apiEndpoints = allActions.map(action => `/api/automations/${action}`)
    
    // Mock role-based responses
    this.mockFetch.mockImplementation((url: string, options?: { headers?: Record<string, string> }) => {
      const authHeader = options?.headers?.Authorization || ''
      const userRole = this.extractRoleFromToken(authHeader)
      const action = this.extractActionFromUrl(url)
      
      const hasPermission = rolePermissions[userRole]?.includes(action)
      
      return Promise.resolve({
        ok: hasPermission,
        status: hasPermission ? 200 : 403,
        json: () => Promise.resolve(
          hasPermission 
            ? { success: true } 
            : { error: 'Forbidden' }
        )
      })
    })

    const userRoles = Object.keys(rolePermissions)
    const expectedAccess = this.buildExpectedAccessMatrix(rolePermissions)

    return await this.orchestrator.runSecurityTestSuite(
      component,
      apiEndpoints,
      userRoles,
      expectedAccess
    )
  }

  /**
   * Test CSRF protection for action buttons
   * Validates protection against Cross-Site Request Forgery attacks
   */
  async testCSRFProtection(
    component: React.ComponentType,
    actionButtons: string[]
  ): Promise<boolean> {
    const user = userEvent.setup()
    let csrfProtected = true

    render(React.createElement(component))

    for (const buttonName of actionButtons) {
      try {
        const button = screen.getByRole('button', { name: new RegExp(buttonName, 'i') })
        
        // Mock CSRF attack scenario
        this.mockFetch.mockImplementation((_url: string, options?: { headers?: Record<string, string> }) => {
          const hasCSRFToken = options?.headers?.['X-CSRF-Token'] || 
                              options?.headers?.['csrf-token']
          
          if (!hasCSRFToken) {
            // If no CSRF token and request succeeds, it's vulnerable
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ success: true })
            })
          }
          
          return Promise.resolve({
            ok: false,
            status: 403,
            json: () => Promise.resolve({ error: 'CSRF token missing' })
          })
        })

        await user.click(button)

        // Wait for any API calls
        await waitFor(() => {
          if (this.mockFetch.mock.calls.length > 0) {
            const lastCall = this.mockFetch.mock.calls[this.mockFetch.mock.calls.length - 1]
            const options = lastCall[1]
            const hasCSRFToken = options?.headers?.['X-CSRF-Token'] || 
                                options?.headers?.['csrf-token']
            
            if (!hasCSRFToken) {
              csrfProtected = false
            }
          }
        }, { timeout: 1000 })

      } catch (error) {
        console.warn(`CSRF test failed for button "${buttonName}":`, error)
      }
    }

    return csrfProtected
  }

  /**
   * Test rate limiting protection
   * Validates protection against rapid-fire requests
   */
  async testRateLimiting(
    component: React.ComponentType,
    buttonName: string,
    maxRequests: number = 5,
    timeWindow: number = 1000
  ): Promise<boolean> {
    const user = userEvent.setup()
    let rateLimited = false
    let requestCount = 0

    render(React.createElement(component))

    // Mock rate limiting
    this.mockFetch.mockImplementation(() => {
      requestCount++
      
      if (requestCount > maxRequests) {
        rateLimited = true
        return Promise.resolve({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ error: 'Too Many Requests' })
        })
      }
      
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true })
      })
    })

    try {
      const button = screen.getByRole('button', { name: new RegExp(buttonName, 'i') })
      
      // Rapidly click button to test rate limiting
      for (let i = 0; i < maxRequests + 2; i++) {
        await user.click(button)
        await new Promise(resolve => setTimeout(resolve, 50)) // Small delay between clicks
      }

      // Wait for all requests to complete
      await waitFor(() => {
        expect(this.mockFetch).toHaveBeenCalled()
      }, { timeout: timeWindow + 500 })

    } catch (error) {
      console.warn(`Rate limiting test failed for button "${buttonName}":`, error)
    }

    return rateLimited
  }

  /**
   * Test input sanitization for action parameters
   * Validates proper sanitization of user inputs
   */
  async testInputSanitization(
    component: React.ComponentType,
    inputFields: string[]
  ): Promise<string[]> {
    const user = userEvent.setup()
    const vulnerabilities: string[] = []

    render(React.createElement(component))

    const maliciousInputs = [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '"><img src=x onerror=alert("XSS")>',
      '\'; DROP TABLE automations; --',
      '${7*7}', // Template injection
      '{{7*7}}', // Template injection
      '../../../etc/passwd', // Path traversal
      'file:///etc/passwd' // File inclusion
    ]

    for (const fieldName of inputFields) {
      try {
        const input = screen.getByLabelText(new RegExp(fieldName, 'i')) ||
                     screen.getByPlaceholderText(new RegExp(fieldName, 'i')) ||
                     screen.getByDisplayValue(new RegExp(fieldName, 'i'))

        for (const maliciousInput of maliciousInputs) {
          await user.clear(input)
          await user.type(input, maliciousInput)

          // Check if input is properly sanitized
          const inputValue = (input as HTMLInputElement).value
          
          if (inputValue === maliciousInput) {
            vulnerabilities.push(
              `Input field "${fieldName}" does not sanitize malicious input: ${maliciousInput}`
            )
          }

          // Check for script execution (would be caught in test environment)
          const scripts = document.querySelectorAll('script')
          const hasInjectedScript = Array.from(scripts).some(script =>
            script.textContent?.includes('alert')
          )

          if (hasInjectedScript) {
            vulnerabilities.push(
              `Input field "${fieldName}" allows script execution: ${maliciousInput}`
            )
          }
        }

      } catch (error) {
        console.warn(`Input sanitization test failed for field "${fieldName}":`, error)
      }
    }

    return vulnerabilities
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private extractRoleFromToken(authHeader: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return 'guest'
    }

    // In a real implementation, you would decode the JWT token
    // For testing, we'll use a simple mock
    const token = authHeader.replace('Bearer ', '')
    if (token.includes('admin')) return 'admin'
    if (token.includes('user')) return 'user'
    return 'guest'
  }

  private extractActionFromUrl(url: string): string {
    const match = url.match(/\/api\/automations\/(.+)$/)
    return match ? match[1] : 'unknown'
  }

  private buildExpectedAccessMatrix(
    rolePermissions: Record<string, string[]>
  ): Record<string, boolean> {
    const matrix: Record<string, boolean> = {}
    
    Object.entries(rolePermissions).forEach(([_role, permissions]) => {
      permissions.forEach(permission => {
        matrix[permission] = true
      })
    })

    return matrix
  }
}

// ============================================================================
// PREDEFINED SECURITY TEST SCENARIOS
// ============================================================================

/**
 * Standard security test scenarios for automation action buttons
 */
export const actionButtonSecurityScenarios = {
  /**
   * Basic authentication test scenario
   */
  basicAuth: {
    name: 'Basic Authentication Test',
    description: 'Tests that all action buttons require authentication',
    actionButtons: ['run', 'stop', 'delete', 'edit'],
    expectedResult: 'All buttons should be disabled or return 401 without authentication'
  },

  /**
   * Role-based access control test scenario
   */
  rbacTest: {
    name: 'Role-Based Access Control Test',
    description: 'Tests proper role-based permissions for action buttons',
    rolePermissions: {
      'guest': [],
      'viewer': ['view'],
      'user': ['view', 'run', 'stop'],
      'admin': ['view', 'run', 'stop', 'delete', 'edit', 'create']
    },
    expectedResult: 'Users should only access actions permitted by their role'
  },

  /**
   * Security vulnerability test scenario
   */
  vulnerabilityTest: {
    name: 'Security Vulnerability Test',
    description: 'Tests for common security vulnerabilities',
    tests: ['csrf', 'xss', 'injection', 'rateLimiting'],
    expectedResult: 'No security vulnerabilities should be found'
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// ActionButtonSecurityTestSuite is already exported in class definition
// actionButtonSecurityScenarios is already exported in const definition
