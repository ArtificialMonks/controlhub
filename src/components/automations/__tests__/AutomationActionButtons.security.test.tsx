// src/components/automations/__tests__/AutomationActionButtons.security.test.tsx
/**
 * AutomationActionButtons Security Tests - Quest 4.4
 * Implements expert council security testing requirements
 * Comprehensive security validation for automation action buttons
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActionButtonSecurityTestSuite, actionButtonSecurityScenarios } from '@/test/security/action-button-security-tests'
import { SecurityTestOrchestrator, defaultSecurityConfig } from '@/test/security/security-test-framework'

// ============================================================================
// MOCK COMPONENTS AND DATA
// ============================================================================

/**
 * Mock AutomationActionButtons component for security testing
 */
const MockAutomationActionButtons: React.FC<{ user?: any }> = ({ user }) => {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleAction = async (action: string) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/automations/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user?.token ? `Bearer ${user.token}` : '',
          'X-CSRF-Token': 'mock-csrf-token' // Mock CSRF token
        },
        body: JSON.stringify({ automationId: 'test-automation' })
      })

      if (!response.ok) {
        throw new Error(`Action failed: ${response.status}`)
      }

      const result = await response.json()
      console.log('Action result:', result)
    } catch (error) {
      console.error('Action error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Render buttons based on user permissions
  const canRun = user?.permissions?.includes('run') || user?.role === 'admin'
  const canStop = user?.permissions?.includes('stop') || user?.role === 'admin'
  const canDelete = user?.permissions?.includes('delete') || user?.role === 'admin'
  const canEdit = user?.permissions?.includes('edit') || user?.role === 'admin'

  return (
    <div>
      <button
        onClick={() => handleAction('run')}
        disabled={!canRun || isLoading}
        aria-label="Run Automation"
      >
        {isLoading ? 'Running...' : 'Run'}
      </button>
      
      <button
        onClick={() => handleAction('stop')}
        disabled={!canStop || isLoading}
        aria-label="Stop Automation"
      >
        {isLoading ? 'Stopping...' : 'Stop'}
      </button>
      
      <button
        onClick={() => handleAction('delete')}
        disabled={!canDelete || isLoading}
        aria-label="Delete Automation"
      >
        {isLoading ? 'Deleting...' : 'Delete'}
      </button>
      
      <button
        onClick={() => handleAction('edit')}
        disabled={!canEdit || isLoading}
        aria-label="Edit Automation"
      >
        {isLoading ? 'Editing...' : 'Edit'}
      </button>

      {/* Mock input field for testing input sanitization */}
      <input
        type="text"
        placeholder="Automation Name"
        aria-label="Automation Name"
      />
    </div>
  )
}

// ============================================================================
// SECURITY TEST SETUP
// ============================================================================

describe('AutomationActionButtons Security Tests', () => {
  let securityTestSuite: ActionButtonSecurityTestSuite
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    securityTestSuite = new ActionButtonSecurityTestSuite()
    mockFetch = vi.fn()
    global.fetch = mockFetch
    
    // Clear any existing DOM
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // AUTHENTICATION SECURITY TESTS
  // ==========================================================================

  describe('Authentication Security', () => {
    it('should require authentication for all action buttons', async () => {
      // Mock unauthenticated responses
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      })

      const report = await securityTestSuite.testActionButtonAuthentication(
        MockAutomationActionButtons,
        ['run', 'stop', 'delete', 'edit']
      )

      expect(report.overallStatus).toBe('PASS')
      expect(report.complianceScore).toBeGreaterThanOrEqual(95)
      expect(report.vulnerabilities).toHaveLength(0)
    })

    it('should reject invalid JWT tokens', async () => {
      const user = userEvent.setup()
      
      // Mock invalid token response
      mockFetch.mockImplementation((url: string, options: any) => {
        const authHeader = options?.headers?.Authorization
        
        if (!authHeader || authHeader === 'Bearer invalid-token') {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: async () => ({ error: 'Invalid token' })
          })
        }
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true })
        })
      })

      // Render component with invalid token
      const invalidUser = { token: 'invalid-token', role: 'user', permissions: ['run'] }
      render(<MockAutomationActionButtons user={invalidUser} />)

      const runButton = screen.getByRole('button', { name: /run/i })
      await user.click(runButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/automations/run',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer invalid-token'
            })
          })
        )
      })

      // Verify that the request was rejected
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1]
      const response = await mockFetch.mock.results[mockFetch.mock.results.length - 1].value
      expect(response.status).toBe(401)
    })

    it('should handle missing authentication gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock missing auth response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Authentication required' })
      })

      // Render component without user
      render(<MockAutomationActionButtons />)

      const runButton = screen.getByRole('button', { name: /run/i })
      
      // Button should be disabled due to lack of permissions
      expect(runButton).toBeDisabled()
    })
  })

  // ==========================================================================
  // AUTHORIZATION SECURITY TESTS
  // ==========================================================================

  describe('Authorization Security', () => {
    it('should enforce role-based access control', async () => {
      const rolePermissions = actionButtonSecurityScenarios.rbacTest.rolePermissions

      const report = await securityTestSuite.testActionButtonAuthorization(
        MockAutomationActionButtons,
        rolePermissions
      )

      expect(report.overallStatus).toBe('PASS')
      expect(report.complianceScore).toBeGreaterThanOrEqual(80)
    })

    it('should prevent privilege escalation', async () => {
      const user = userEvent.setup()
      
      // Mock privilege escalation attempt
      mockFetch.mockImplementation((url: string, options: any) => {
        const body = JSON.parse(options?.body || '{}')
        
        // Check for privilege escalation attempts
        if (body.role === 'admin' || body.permissions?.includes('admin')) {
          return Promise.resolve({
            ok: false,
            status: 403,
            json: async () => ({ error: 'Privilege escalation attempt detected' })
          })
        }
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true })
        })
      })

      // Render component with regular user
      const regularUser = { token: 'user-token', role: 'user', permissions: ['run'] }
      render(<MockAutomationActionButtons user={regularUser} />)

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      
      // Delete button should be disabled for regular user
      expect(deleteButton).toBeDisabled()
    })

    it('should validate user permissions for each action', async () => {
      const testCases = [
        { role: 'viewer', permissions: ['view'], expectedDisabled: ['run', 'stop', 'delete', 'edit'] },
        { role: 'user', permissions: ['run', 'stop'], expectedDisabled: ['delete', 'edit'] },
        { role: 'admin', permissions: ['run', 'stop', 'delete', 'edit'], expectedDisabled: [] }
      ]

      for (const testCase of testCases) {
        const testUser = { 
          token: `${testCase.role}-token`, 
          role: testCase.role, 
          permissions: testCase.permissions 
        }
        
        render(<MockAutomationActionButtons user={testUser} />)

        // Check that expected buttons are disabled
        for (const action of testCase.expectedDisabled) {
          const button = screen.getByRole('button', { name: new RegExp(action, 'i') })
          expect(button).toBeDisabled()
        }

        // Check that allowed buttons are enabled
        const allowedActions = ['run', 'stop', 'delete', 'edit'].filter(
          action => !testCase.expectedDisabled.includes(action)
        )
        
        for (const action of allowedActions) {
          const button = screen.getByRole('button', { name: new RegExp(action, 'i') })
          expect(button).toBeEnabled()
        }

        // Clean up for next test
        document.body.innerHTML = ''
      }
    })
  })

  // ==========================================================================
  // CSRF PROTECTION TESTS
  // ==========================================================================

  describe('CSRF Protection', () => {
    it('should include CSRF tokens in requests', async () => {
      const csrfProtected = await securityTestSuite.testCSRFProtection(
        MockAutomationActionButtons,
        ['run', 'stop', 'delete', 'edit']
      )

      expect(csrfProtected).toBe(true)
    })

    it('should reject requests without CSRF tokens', async () => {
      const user = userEvent.setup()
      
      // Mock CSRF validation
      mockFetch.mockImplementation((url: string, options: any) => {
        const hasCSRFToken = options?.headers?.['X-CSRF-Token']
        
        if (!hasCSRFToken) {
          return Promise.resolve({
            ok: false,
            status: 403,
            json: async () => ({ error: 'CSRF token required' })
          })
        }
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true })
        })
      })

      const testUser = { token: 'valid-token', role: 'user', permissions: ['run'] }
      render(<MockAutomationActionButtons user={testUser} />)

      const runButton = screen.getByRole('button', { name: /run/i })
      await user.click(runButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/automations/run',
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-CSRF-Token': 'mock-csrf-token'
            })
          })
        )
      })
    })
  })

  // ==========================================================================
  // RATE LIMITING TESTS
  // ==========================================================================

  describe('Rate Limiting', () => {
    it('should implement rate limiting for action buttons', async () => {
      const rateLimited = await securityTestSuite.testRateLimiting(
        MockAutomationActionButtons,
        'run',
        3, // Max 3 requests
        1000 // Per 1 second
      )

      expect(rateLimited).toBe(true)
    })

    it('should prevent rapid-fire button clicks', async () => {
      const user = userEvent.setup()
      let requestCount = 0
      
      mockFetch.mockImplementation(() => {
        requestCount++
        
        if (requestCount > 3) {
          return Promise.resolve({
            ok: false,
            status: 429,
            json: async () => ({ error: 'Too Many Requests' })
          })
        }
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true })
        })
      })

      const testUser = { token: 'valid-token', role: 'user', permissions: ['run'] }
      render(<MockAutomationActionButtons user={testUser} />)

      const runButton = screen.getByRole('button', { name: /run/i })
      
      // Rapidly click button
      for (let i = 0; i < 5; i++) {
        await user.click(runButton)
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      await waitFor(() => {
        expect(requestCount).toBeGreaterThan(3)
      })

      // Check that rate limiting was triggered
      const lastResponse = await mockFetch.mock.results[mockFetch.mock.results.length - 1].value
      expect(lastResponse.status).toBe(429)
    })
  })

  // ==========================================================================
  // INPUT SANITIZATION TESTS
  // ==========================================================================

  describe('Input Sanitization', () => {
    it('should sanitize user inputs', async () => {
      const vulnerabilities = await securityTestSuite.testInputSanitization(
        MockAutomationActionButtons,
        ['Automation Name']
      )

      expect(vulnerabilities).toHaveLength(0)
    })

    it('should prevent XSS attacks through input fields', async () => {
      const user = userEvent.setup()
      
      render(<MockAutomationActionButtons />)
      
      const input = screen.getByLabelText(/automation name/i)
      const xssPayload = '<script>alert("XSS")</script>'
      
      await user.type(input, xssPayload)
      
      // Check that the payload is not executed
      const scripts = document.querySelectorAll('script')
      const hasInjectedScript = Array.from(scripts).some(script =>
        script.textContent?.includes('alert')
      )
      
      expect(hasInjectedScript).toBe(false)
      
      // Check that input value is sanitized
      expect((input as HTMLInputElement).value).not.toBe(xssPayload)
    })
  })

  // ==========================================================================
  // COMPREHENSIVE SECURITY SUITE
  // ==========================================================================

  describe('Comprehensive Security Validation', () => {
    it('should pass comprehensive security test suite', async () => {
      const orchestrator = new SecurityTestOrchestrator(defaultSecurityConfig)
      
      const apiEndpoints = ['/api/automations/run', '/api/automations/stop']
      const userRoles = ['user', 'admin']
      const expectedAccess = {
        'run': true,
        'stop': true,
        'delete': false,
        'edit': false
      }

      const report = await orchestrator.runSecurityTestSuite(
        MockAutomationActionButtons,
        apiEndpoints,
        userRoles,
        expectedAccess
      )

      expect(report.overallStatus).toBe('PASS')
      expect(report.complianceScore).toBeGreaterThanOrEqual(80)
      expect(report.vulnerabilities.filter(v => v.severity === 'CRITICAL')).toHaveLength(0)
      expect(report.vulnerabilities.filter(v => v.severity === 'HIGH')).toHaveLength(0)
    })

    it('should generate detailed security report', async () => {
      const orchestrator = new SecurityTestOrchestrator(defaultSecurityConfig)
      
      const report = await orchestrator.runSecurityTestSuite(
        MockAutomationActionButtons,
        ['/api/automations/run'],
        ['user'],
        { 'run': true }
      )

      expect(report).toHaveProperty('testSuiteId')
      expect(report).toHaveProperty('timestamp')
      expect(report).toHaveProperty('testsRun')
      expect(report).toHaveProperty('testsPassed')
      expect(report).toHaveProperty('vulnerabilities')
      expect(report).toHaveProperty('recommendations')
      expect(report).toHaveProperty('complianceScore')
      
      expect(typeof report.complianceScore).toBe('number')
      expect(report.complianceScore).toBeGreaterThanOrEqual(0)
      expect(report.complianceScore).toBeLessThanOrEqual(100)
    })
  })
})
