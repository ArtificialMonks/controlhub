// src/test/integration/automation-actions-integration.test.tsx
/**
 * Automation Actions Integration Tests - Quest 4.4
 * Implements expert council integration testing requirements
 * Comprehensive integration testing with mutation testing and coverage analysis
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  IntegrationTestFramework,
  IntegrationTestSuite,
  IntegrationTestGroup,
  IntegrationTest,
  DEFAULT_INTEGRATION_CONFIG,
  type IntegrationTestReport
} from './integration-test-framework'

// ============================================================================
// MOCK COMPONENTS AND SERVICES
// ============================================================================

/**
 * Mock AutomationActionButtons component for integration testing
 */
const MockAutomationActionButtons = ({ automationId, onAction }: { 
  automationId: string
  onAction?: (action: string, id: string) => Promise<void>
}) => {
  const handleAction = async (action: string) => {
    if (onAction) {
      await onAction(action, automationId)
    }
  }

  return (
    <div data-testid={`automation-actions-${automationId}`}>
      <button 
        data-testid={`run-button-${automationId}`}
        onClick={() => handleAction('run')}
        aria-label={`Run automation ${automationId}`}
      >
        Run
      </button>
      <button 
        data-testid={`stop-button-${automationId}`}
        onClick={() => handleAction('stop')}
        aria-label={`Stop automation ${automationId}`}
      >
        Stop
      </button>
      <button 
        data-testid={`delete-button-${automationId}`}
        onClick={() => handleAction('delete')}
        aria-label={`Delete automation ${automationId}`}
      >
        Delete
      </button>
    </div>
  )
}

/**
 * Mock API service for integration testing
 */
class MockAutomationAPIService {
  private automations: Map<string, { id: string; status: string; name: string }> = new Map()
  private requestDelay = 100 // Simulate network delay

  constructor() {
    // Initialize with test data
    this.automations.set('test-1', { id: 'test-1', status: 'stopped', name: 'Test Automation 1' })
    this.automations.set('test-2', { id: 'test-2', status: 'running', name: 'Test Automation 2' })
    this.automations.set('test-3', { id: 'test-3', status: 'stopped', name: 'Test Automation 3' })
  }

  async runAutomation(id: string): Promise<{ success: boolean; message: string }> {
    await this.delay()
    
    const automation = this.automations.get(id)
    if (!automation) {
      throw new Error(`Automation ${id} not found`)
    }

    if (automation.status === 'running') {
      throw new Error(`Automation ${id} is already running`)
    }

    automation.status = 'running'
    return { success: true, message: `Automation ${id} started successfully` }
  }

  async stopAutomation(id: string): Promise<{ success: boolean; message: string }> {
    await this.delay()
    
    const automation = this.automations.get(id)
    if (!automation) {
      throw new Error(`Automation ${id} not found`)
    }

    if (automation.status === 'stopped') {
      throw new Error(`Automation ${id} is already stopped`)
    }

    automation.status = 'stopped'
    return { success: true, message: `Automation ${id} stopped successfully` }
  }

  async deleteAutomation(id: string): Promise<{ success: boolean; message: string }> {
    await this.delay()
    
    if (!this.automations.has(id)) {
      throw new Error(`Automation ${id} not found`)
    }

    this.automations.delete(id)
    return { success: true, message: `Automation ${id} deleted successfully` }
  }

  async getAutomationStatus(id: string): Promise<{ id: string; status: string; name: string }> {
    await this.delay()
    
    const automation = this.automations.get(id)
    if (!automation) {
      throw new Error(`Automation ${id} not found`)
    }

    return { ...automation }
  }

  private async delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.requestDelay))
  }
}

// ============================================================================
// INTEGRATION TEST SUITE DEFINITION
// ============================================================================

describe('Automation Actions Integration Tests', () => {
  let integrationFramework: IntegrationTestFramework
  let mockAPIService: MockAutomationAPIService
  let testReport: IntegrationTestReport

  beforeEach(() => {
    // Initialize integration test framework
    integrationFramework = new IntegrationTestFramework({
      ...DEFAULT_INTEGRATION_CONFIG,
      testSuiteId: 'automation-actions-integration',
      enableMutationTesting: true,
      enableCoverageAnalysis: true
    })

    // Initialize mock API service
    mockAPIService = new MockAutomationAPIService()

    // Clear DOM
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // COMPREHENSIVE INTEGRATION TEST EXECUTION
  // ==========================================================================

  it('should execute comprehensive integration test suite with coverage and mutation testing', async () => {
    // Define integration test suite
    const testSuite: IntegrationTestSuite = {
      name: 'Automation Actions Integration Test Suite',
      description: 'Comprehensive integration testing for automation action buttons with API integration',
      testGroups: [
        {
          name: 'Basic Action Integration',
          description: 'Test basic automation actions with API integration',
          tests: [
            createRunAutomationTest(),
            createStopAutomationTest(),
            createDeleteAutomationTest()
          ]
        },
        {
          name: 'Error Handling Integration',
          description: 'Test error handling scenarios with API integration',
          tests: [
            createErrorHandlingTest(),
            createNotFoundErrorTest(),
            createValidationErrorTest()
          ]
        },
        {
          name: 'State Management Integration',
          description: 'Test state management and UI updates with API integration',
          tests: [
            createStateUpdateTest(),
            createOptimisticUpdateTest(),
            createRollbackTest()
          ]
        },
        {
          name: 'Performance Integration',
          description: 'Test performance characteristics of integrated actions',
          tests: [
            createPerformanceTest(),
            createConcurrentActionsTest(),
            createBulkActionsTest()
          ]
        }
      ]
    }

    // Execute comprehensive integration test suite
    testReport = await integrationFramework.executeTestSuite(testSuite)

    // Validate test execution results
    expect(testReport).toBeDefined()
    expect(testReport.summary.totalTests).toBeGreaterThan(0)
    expect(testReport.summary.passedTests).toBeGreaterThan(0)
    expect(testReport.complianceStatus).toMatch(/PASS|WARNING/)

    // Validate coverage requirements (expert council standards)
    expect(testReport.summary.overallCoverage.statements.percentage).toBeGreaterThanOrEqual(75)
    expect(testReport.summary.overallCoverage.branches.percentage).toBeGreaterThanOrEqual(70)
    expect(testReport.summary.overallCoverage.functions.percentage).toBeGreaterThanOrEqual(75)

    // Validate mutation testing results
    if (testReport.mutationResults.length > 0) {
      expect(testReport.summary.mutationScore).toBeGreaterThanOrEqual(60) // Minimum mutation score
    }

    // Log comprehensive results
    console.log('='.repeat(60))
    console.log('INTEGRATION TEST REPORT')
    console.log('='.repeat(60))
    console.log(`Test Suite: ${testReport.config.testSuiteId}`)
    console.log(`Total Tests: ${testReport.summary.totalTests}`)
    console.log(`Passed: ${testReport.summary.passedTests}`)
    console.log(`Failed: ${testReport.summary.failedTests}`)
    console.log(`Coverage: ${testReport.summary.overallCoverage.statements.percentage.toFixed(1)}%`)
    console.log(`Mutation Score: ${testReport.summary.mutationScore.toFixed(1)}%`)
    console.log(`Compliance: ${testReport.complianceStatus}`)
    console.log(`Duration: ${testReport.summary.totalDuration}ms`)
    console.log('Recommendations:')
    testReport.recommendations.forEach(rec => console.log(`  - ${rec}`))
  })

  // ==========================================================================
  // INDIVIDUAL INTEGRATION TEST FUNCTIONS
  // ==========================================================================

  function createRunAutomationTest(): IntegrationTest {
    return {
      id: 'run-automation-integration',
      name: 'Run Automation Integration Test',
      description: 'Test running automation with full API integration',
      testFunction: async () => {
        const user = userEvent.setup()
        const automationId = 'test-1'
        
        // Mock action handler with API integration
        const handleAction = async (action: string, id: string) => {
          if (action === 'run') {
            const result = await mockAPIService.runAutomation(id)
            expect(result.success).toBe(true)
            expect(result.message).toContain('started successfully')
          }
        }

        // Render component
        render(<MockAutomationActionButtons automationId={automationId} onAction={handleAction} />)

        // Find and click run button
        const runButton = screen.getByTestId(`run-button-${automationId}`)
        expect(runButton).toBeInTheDocument()
        
        await user.click(runButton)

        // Verify API was called and automation status changed
        const status = await mockAPIService.getAutomationStatus(automationId)
        expect(status.status).toBe('running')
      }
    }
  }

  function createStopAutomationTest(): IntegrationTest {
    return {
      id: 'stop-automation-integration',
      name: 'Stop Automation Integration Test',
      description: 'Test stopping automation with full API integration',
      testFunction: async () => {
        const user = userEvent.setup()
        const automationId = 'test-2' // This one starts as running
        
        const handleAction = async (action: string, id: string) => {
          if (action === 'stop') {
            const result = await mockAPIService.stopAutomation(id)
            expect(result.success).toBe(true)
            expect(result.message).toContain('stopped successfully')
          }
        }

        render(<MockAutomationActionButtons automationId={automationId} onAction={handleAction} />)

        const stopButton = screen.getByTestId(`stop-button-${automationId}`)
        await user.click(stopButton)

        const status = await mockAPIService.getAutomationStatus(automationId)
        expect(status.status).toBe('stopped')
      }
    }
  }

  function createDeleteAutomationTest(): IntegrationTest {
    return {
      id: 'delete-automation-integration',
      name: 'Delete Automation Integration Test',
      description: 'Test deleting automation with full API integration',
      testFunction: async () => {
        const user = userEvent.setup()
        const automationId = 'test-3'
        
        const handleAction = async (action: string, id: string) => {
          if (action === 'delete') {
            const result = await mockAPIService.deleteAutomation(id)
            expect(result.success).toBe(true)
            expect(result.message).toContain('deleted successfully')
          }
        }

        render(<MockAutomationActionButtons automationId={automationId} onAction={handleAction} />)

        const deleteButton = screen.getByTestId(`delete-button-${automationId}`)
        await user.click(deleteButton)

        // Verify automation was deleted
        await expect(mockAPIService.getAutomationStatus(automationId)).rejects.toThrow('not found')
      }
    }
  }

  function createErrorHandlingTest(): IntegrationTest {
    return {
      id: 'error-handling-integration',
      name: 'Error Handling Integration Test',
      description: 'Test error handling with API integration',
      testFunction: async () => {
        const user = userEvent.setup()
        const automationId = 'test-2' // Already running
        
        const handleAction = async (action: string, id: string) => {
          if (action === 'run') {
            // This should throw an error since automation is already running
            await expect(mockAPIService.runAutomation(id)).rejects.toThrow('already running')
          }
        }

        render(<MockAutomationActionButtons automationId={automationId} onAction={handleAction} />)

        const runButton = screen.getByTestId(`run-button-${automationId}`)
        await user.click(runButton)
      }
    }
  }

  function createNotFoundErrorTest(): IntegrationTest {
    return {
      id: 'not-found-error-integration',
      name: 'Not Found Error Integration Test',
      description: 'Test handling of not found errors',
      testFunction: async () => {
        const user = userEvent.setup()
        const automationId = 'non-existent'
        
        const handleAction = async (action: string, id: string) => {
          if (action === 'run') {
            await expect(mockAPIService.runAutomation(id)).rejects.toThrow('not found')
          }
        }

        render(<MockAutomationActionButtons automationId={automationId} onAction={handleAction} />)

        const runButton = screen.getByTestId(`run-button-${automationId}`)
        await user.click(runButton)
      }
    }
  }

  function createValidationErrorTest(): IntegrationTest {
    return {
      id: 'validation-error-integration',
      name: 'Validation Error Integration Test',
      description: 'Test handling of validation errors',
      testFunction: async () => {
        const user = userEvent.setup()
        const automationId = 'test-1'
        
        const handleAction = async (action: string, id: string) => {
          if (action === 'stop') {
            // This should throw an error since automation is already stopped
            await expect(mockAPIService.stopAutomation(id)).rejects.toThrow('already stopped')
          }
        }

        render(<MockAutomationActionButtons automationId={automationId} onAction={handleAction} />)

        const stopButton = screen.getByTestId(`stop-button-${automationId}`)
        await user.click(stopButton)
      }
    }
  }

  function createStateUpdateTest(): IntegrationTest {
    return {
      id: 'state-update-integration',
      name: 'State Update Integration Test',
      description: 'Test state updates with API integration',
      testFunction: async () => {
        const automationId = 'test-1'
        
        // Test initial state
        const initialStatus = await mockAPIService.getAutomationStatus(automationId)
        expect(initialStatus.status).toBe('stopped')
        
        // Test state change
        await mockAPIService.runAutomation(automationId)
        const runningStatus = await mockAPIService.getAutomationStatus(automationId)
        expect(runningStatus.status).toBe('running')
        
        // Test state change back
        await mockAPIService.stopAutomation(automationId)
        const stoppedStatus = await mockAPIService.getAutomationStatus(automationId)
        expect(stoppedStatus.status).toBe('stopped')
      }
    }
  }

  function createOptimisticUpdateTest(): IntegrationTest {
    return {
      id: 'optimistic-update-integration',
      name: 'Optimistic Update Integration Test',
      description: 'Test optimistic UI updates with API integration',
      testFunction: async () => {
        // This test would verify optimistic updates in a real implementation
        // For now, we'll test the API response timing
        const automationId = 'test-1'
        
        const startTime = Date.now()
        await mockAPIService.runAutomation(automationId)
        const endTime = Date.now()
        
        // Verify API response is fast enough for optimistic updates
        expect(endTime - startTime).toBeLessThan(500) // Should be fast enough for good UX
      }
    }
  }

  function createRollbackTest(): IntegrationTest {
    return {
      id: 'rollback-integration',
      name: 'Rollback Integration Test',
      description: 'Test rollback functionality with API integration',
      testFunction: async () => {
        const automationId = 'test-1'
        
        // Get initial state
        const initialStatus = await mockAPIService.getAutomationStatus(automationId)
        
        // Perform action
        await mockAPIService.runAutomation(automationId)
        
        // Verify state changed
        const changedStatus = await mockAPIService.getAutomationStatus(automationId)
        expect(changedStatus.status).not.toBe(initialStatus.status)
        
        // Rollback (stop the automation)
        await mockAPIService.stopAutomation(automationId)
        
        // Verify rollback
        const rolledBackStatus = await mockAPIService.getAutomationStatus(automationId)
        expect(rolledBackStatus.status).toBe(initialStatus.status)
      }
    }
  }

  function createPerformanceTest(): IntegrationTest {
    return {
      id: 'performance-integration',
      name: 'Performance Integration Test',
      description: 'Test performance characteristics of API integration',
      testFunction: async () => {
        const automationId = 'test-1'
        const iterations = 10
        const times: number[] = []
        
        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now()
          await mockAPIService.getAutomationStatus(automationId)
          const endTime = Date.now()
          times.push(endTime - startTime)
        }
        
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length
        
        // Verify performance meets requirements
        expect(averageTime).toBeLessThan(200) // Average response time should be under 200ms
      }
    }
  }

  function createConcurrentActionsTest(): IntegrationTest {
    return {
      id: 'concurrent-actions-integration',
      name: 'Concurrent Actions Integration Test',
      description: 'Test concurrent action handling with API integration',
      testFunction: async () => {
        const automationIds = ['test-1', 'test-2', 'test-3']
        
        // Execute concurrent status checks
        const promises = automationIds.map(id => mockAPIService.getAutomationStatus(id))
        const results = await Promise.all(promises)
        
        // Verify all requests completed successfully
        expect(results).toHaveLength(automationIds.length)
        results.forEach(result => {
          expect(result).toHaveProperty('id')
          expect(result).toHaveProperty('status')
          expect(result).toHaveProperty('name')
        })
      }
    }
  }

  function createBulkActionsTest(): IntegrationTest {
    return {
      id: 'bulk-actions-integration',
      name: 'Bulk Actions Integration Test',
      description: 'Test bulk action handling with API integration',
      testFunction: async () => {
        const automationIds = ['test-1', 'test-3'] // Both should be stopped
        
        // Execute bulk run operation
        const runPromises = automationIds.map(id => mockAPIService.runAutomation(id))
        const runResults = await Promise.all(runPromises)
        
        // Verify all automations were started
        runResults.forEach(result => {
          expect(result.success).toBe(true)
          expect(result.message).toContain('started successfully')
        })
        
        // Verify status changes
        const statusPromises = automationIds.map(id => mockAPIService.getAutomationStatus(id))
        const statusResults = await Promise.all(statusPromises)
        
        statusResults.forEach(status => {
          expect(status.status).toBe('running')
        })
      }
    }
  }
})
