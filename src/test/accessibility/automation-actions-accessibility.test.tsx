// src/test/accessibility/automation-actions-accessibility.test.tsx
/**
 * Automation Actions Accessibility Tests - Quest 4.4
 * Implements expert council WCAG 2.1 AA compliance testing
 * Comprehensive accessibility validation and enhanced feedback testing
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import {
  WCAGComplianceFramework,
  EnhancedFeedbackManager,
  defaultWCAGConfig,
  enhancedFeedbackManager,
  type WCAGComplianceReport
} from './wcag-compliance-framework'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// ============================================================================
// MOCK COMPONENTS FOR ACCESSIBILITY TESTING
// ============================================================================

/**
 * Mock AutomationActionButtons with accessibility features
 */
const AccessibleAutomationActionButtons: React.FC<{
  automationId: string
  automationName: string
  status: 'idle' | 'running' | 'stopped' | 'error'
  onAction?: (action: string) => Promise<void>
}> = ({ automationId, automationName, status, onAction }) => {
  const [isLoading, setIsLoading] = React.useState(false)
  const [feedback, setFeedback] = React.useState<string>('')

  const handleAction = async (action: string) => {
    setIsLoading(true)
    setFeedback('')

    try {
      if (onAction) {
        await onAction(action)
      }
      
      // Show success feedback
      enhancedFeedbackManager.showFeedback(
        `${action} action completed successfully`,
        'success',
        { screenReaderText: `${automationName} ${action} completed` }
      )
      
      setFeedback(`${action} completed successfully`)
    } catch (error) {
      // Show error feedback
      enhancedFeedbackManager.showFeedback(
        `${action} action failed`,
        'error',
        { 
          screenReaderText: `${automationName} ${action} failed`,
          focusTarget: document.querySelector(`[data-testid="error-${action}-${automationId}"]`) as HTMLElement
        }
      )
      
      setFeedback(`${action} failed`)
    } finally {
      setIsLoading(false)
    }
  }

  const canRun = status === 'idle' || status === 'stopped'
  const canStop = status === 'running'

  return (
    <div 
      role="group" 
      aria-labelledby={`automation-title-${automationId}`}
      data-testid={`automation-actions-${automationId}`}
    >
      <h3 id={`automation-title-${automationId}`} className="sr-only">
        {automationName} Actions
      </h3>
      
      {/* Run Button */}
      <button
        type="button"
        data-testid={`run-button-${automationId}`}
        onClick={() => handleAction('run')}
        disabled={!canRun || isLoading}
        aria-label={`Run ${automationName} automation`}
        aria-describedby={`run-description-${automationId}`}
        className="action-button run-button"
      >
        {isLoading && status === 'idle' ? (
          <>
            <span aria-hidden="true">⟳</span>
            <span className="sr-only">Starting...</span>
          </>
        ) : (
          <>
            <span aria-hidden="true">▶</span>
            <span>Run</span>
          </>
        )}
      </button>
      <div id={`run-description-${automationId}`} className="sr-only">
        Start the {automationName} automation
      </div>

      {/* Stop Button */}
      <button
        type="button"
        data-testid={`stop-button-${automationId}`}
        onClick={() => handleAction('stop')}
        disabled={!canStop || isLoading}
        aria-label={`Stop ${automationName} automation`}
        aria-describedby={`stop-description-${automationId}`}
        className="action-button stop-button"
      >
        {isLoading && status === 'running' ? (
          <>
            <span aria-hidden="true">⟳</span>
            <span className="sr-only">Stopping...</span>
          </>
        ) : (
          <>
            <span aria-hidden="true">⏹</span>
            <span>Stop</span>
          </>
        )}
      </button>
      <div id={`stop-description-${automationId}`} className="sr-only">
        Stop the {automationName} automation
      </div>

      {/* Delete Button */}
      <button
        type="button"
        data-testid={`delete-button-${automationId}`}
        onClick={() => handleAction('delete')}
        disabled={isLoading}
        aria-label={`Delete ${automationName} automation`}
        aria-describedby={`delete-description-${automationId}`}
        className="action-button delete-button"
        aria-expanded="false"
      >
        <span aria-hidden="true">🗑</span>
        <span>Delete</span>
      </button>
      <div id={`delete-description-${automationId}`} className="sr-only">
        Permanently delete the {automationName} automation
      </div>

      {/* Status Display */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        data-testid={`status-${automationId}`}
        className="automation-status"
      >
        <span className="sr-only">Automation status: </span>
        {status}
      </div>

      {/* Feedback Display */}
      {feedback && (
        <div 
          role="status" 
          aria-live="polite"
          data-testid={`feedback-${automationId}`}
          className="feedback-display"
        >
          {feedback}
        </div>
      )}

      {/* Error Display */}
      {status === 'error' && (
        <div 
          role="alert"
          aria-live="assertive"
          data-testid={`error-display-${automationId}`}
          className="error-display"
          tabIndex={-1}
        >
          <span className="sr-only">Error: </span>
          Automation encountered an error
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

describe('Automation Actions Accessibility Tests', () => {
  let wcagFramework: WCAGComplianceFramework
  let container: HTMLElement

  beforeEach(() => {
    wcagFramework = new WCAGComplianceFramework(defaultWCAGConfig)
    
    // Add basic styles for testing
    const style = document.createElement('style')
    style.textContent = `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      .action-button {
        padding: 8px 16px;
        margin: 4px;
        border: 1px solid #ccc;
        background: #fff;
        color: #000;
        cursor: pointer;
      }
      .action-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .action-button:focus {
        outline: 2px solid #0066cc;
        outline-offset: 2px;
      }
    `
    document.head.appendChild(style)
  })

  afterEach(() => {
    // Clean up styles
    const styles = document.querySelectorAll('style')
    styles.forEach(style => {
      if (style.textContent?.includes('.sr-only')) {
        style.remove()
      }
    })
  })

  // ==========================================================================
  // WCAG 2.1 AA COMPLIANCE TESTS
  // ==========================================================================

  it('should pass WCAG 2.1 AA compliance testing', async () => {
    const { container } = render(
      <AccessibleAutomationActionButtons
        automationId="test-automation"
        automationName="Test Automation"
        status="idle"
      />
    )

    // Run comprehensive WCAG compliance test
    const complianceReport = await wcagFramework.runComplianceTest(container)

    console.log('WCAG Compliance Report:', JSON.stringify(complianceReport, null, 2))

    // Validate compliance requirements
    expect(complianceReport.summary.complianceScore).toBeGreaterThanOrEqual(80)
    expect(complianceReport.summary.overallStatus).toMatch(/compliant|partial/)
    
    // Check for critical failures
    const criticalFailures = complianceReport.results.filter(
      r => r.status === 'fail' && r.impact === 'critical'
    )
    expect(criticalFailures).toHaveLength(0)
  })

  it('should pass axe-core accessibility testing', async () => {
    const { container } = render(
      <AccessibleAutomationActionButtons
        automationId="axe-test"
        automationName="Axe Test Automation"
        status="running"
      />
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  // ==========================================================================
  // KEYBOARD ACCESSIBILITY TESTS
  // ==========================================================================

  it('should support full keyboard navigation', async () => {
    const user = userEvent.setup()
    
    render(
      <AccessibleAutomationActionButtons
        automationId="keyboard-test"
        automationName="Keyboard Test"
        status="idle"
      />
    )

    // Tab through all interactive elements
    await user.tab()
    expect(screen.getByTestId('run-button-keyboard-test')).toHaveFocus()

    await user.tab()
    expect(screen.getByTestId('stop-button-keyboard-test')).toHaveFocus()

    await user.tab()
    expect(screen.getByTestId('delete-button-keyboard-test')).toHaveFocus()

    // Test keyboard activation
    await user.keyboard('{Enter}')
    
    // Should show feedback
    await waitFor(() => {
      expect(screen.getByTestId('feedback-keyboard-test')).toBeInTheDocument()
    })
  })

  it('should have visible focus indicators', async () => {
    const user = userEvent.setup()
    
    render(
      <AccessibleAutomationActionButtons
        automationId="focus-test"
        automationName="Focus Test"
        status="idle"
      />
    )

    const runButton = screen.getByTestId('run-button-focus-test')
    
    // Focus the button
    await user.tab()
    
    // Check focus styles are applied
    const computedStyle = window.getComputedStyle(runButton)
    expect(computedStyle.outline).toContain('2px')
  })

  // ==========================================================================
  // SCREEN READER ACCESSIBILITY TESTS
  // ==========================================================================

  it('should provide proper screen reader support', () => {
    render(
      <AccessibleAutomationActionButtons
        automationId="sr-test"
        automationName="Screen Reader Test"
        status="idle"
      />
    )

    // Check ARIA labels
    const runButton = screen.getByTestId('run-button-sr-test')
    expect(runButton).toHaveAttribute('aria-label', 'Run Screen Reader Test automation')
    expect(runButton).toHaveAttribute('aria-describedby', 'run-description-sr-test')

    // Check descriptions
    expect(screen.getByText('Start the Screen Reader Test automation')).toBeInTheDocument()

    // Check group labeling
    const group = screen.getByRole('group')
    expect(group).toHaveAttribute('aria-labelledby', 'automation-title-sr-test')
  })

  it('should announce status changes to screen readers', async () => {
    const user = userEvent.setup()
    
    render(
      <AccessibleAutomationActionButtons
        automationId="status-test"
        automationName="Status Test"
        status="idle"
        onAction={async () => {
          // Simulate action completion
        }}
      />
    )

    const statusElement = screen.getByTestId('status-status-test')
    expect(statusElement).toHaveAttribute('aria-live', 'polite')
    expect(statusElement).toHaveAttribute('aria-atomic', 'true')

    // Trigger action to test feedback
    const runButton = screen.getByTestId('run-button-status-test')
    await user.click(runButton)

    // Check feedback is announced
    await waitFor(() => {
      const feedback = screen.getByTestId('feedback-status-test')
      expect(feedback).toHaveAttribute('aria-live', 'polite')
    })
  })

  // ==========================================================================
  // COLOR CONTRAST TESTS
  // ==========================================================================

  it('should meet color contrast requirements', async () => {
    const { container } = render(
      <AccessibleAutomationActionButtons
        automationId="contrast-test"
        automationName="Contrast Test"
        status="idle"
      />
    )

    // Run contrast-specific tests
    const complianceReport = await wcagFramework.runComplianceTest(container)
    
    const contrastResults = complianceReport.results.filter(
      r => r.criterionId === '1.4.3' || r.criterionId === '1.4.11'
    )

    contrastResults.forEach(result => {
      expect(result.status).not.toBe('fail')
    })
  })

  // ==========================================================================
  // ENHANCED FEEDBACK MECHANISM TESTS
  // ==========================================================================

  it('should provide accessible feedback for all actions', async () => {
    const user = userEvent.setup()
    const mockAction = vi.fn().mockResolvedValue(undefined)
    
    render(
      <AccessibleAutomationActionButtons
        automationId="feedback-test"
        automationName="Feedback Test"
        status="idle"
        onAction={mockAction}
      />
    )

    // Test success feedback
    const runButton = screen.getByTestId('run-button-feedback-test')
    await user.click(runButton)

    await waitFor(() => {
      const feedback = screen.getByTestId('feedback-feedback-test')
      expect(feedback).toHaveTextContent('run completed successfully')
    })

    // Check that feedback is accessible
    const feedbackElement = screen.getByTestId('feedback-feedback-test')
    expect(feedbackElement).toHaveAttribute('aria-live', 'polite')
  })

  it('should handle error feedback accessibly', async () => {
    const user = userEvent.setup()
    const mockAction = vi.fn().mockRejectedValue(new Error('Test error'))
    
    render(
      <AccessibleAutomationActionButtons
        automationId="error-test"
        automationName="Error Test"
        status="idle"
        onAction={mockAction}
      />
    )

    const runButton = screen.getByTestId('run-button-error-test')
    await user.click(runButton)

    await waitFor(() => {
      const feedback = screen.getByTestId('feedback-error-test')
      expect(feedback).toHaveTextContent('run failed')
    })
  })

  // ==========================================================================
  // COMPREHENSIVE ACCESSIBILITY REPORT
  // ==========================================================================

  it('should generate comprehensive accessibility report', async () => {
    const { container } = render(
      <div>
        <AccessibleAutomationActionButtons
          automationId="report-test-1"
          automationName="Report Test 1"
          status="idle"
        />
        <AccessibleAutomationActionButtons
          automationId="report-test-2"
          automationName="Report Test 2"
          status="running"
        />
        <AccessibleAutomationActionButtons
          automationId="report-test-3"
          automationName="Report Test 3"
          status="error"
        />
      </div>
    )

    const complianceReport = await wcagFramework.runComplianceTest(container)

    // Validate report structure
    expect(complianceReport).toHaveProperty('reportId')
    expect(complianceReport).toHaveProperty('timestamp')
    expect(complianceReport).toHaveProperty('summary')
    expect(complianceReport).toHaveProperty('results')
    expect(complianceReport).toHaveProperty('recommendations')

    // Validate summary data
    expect(complianceReport.summary.totalCriteria).toBeGreaterThan(0)
    expect(complianceReport.summary.complianceScore).toBeGreaterThanOrEqual(0)
    expect(complianceReport.summary.complianceScore).toBeLessThanOrEqual(100)

    // Validate recommendations
    expect(Array.isArray(complianceReport.recommendations)).toBe(true)

    console.log('='.repeat(60))
    console.log('ACCESSIBILITY COMPLIANCE REPORT')
    console.log('='.repeat(60))
    console.log(`Overall Status: ${complianceReport.summary.overallStatus}`)
    console.log(`Compliance Score: ${complianceReport.summary.complianceScore.toFixed(1)}%`)
    console.log(`Passed: ${complianceReport.summary.passedCriteria}/${complianceReport.summary.totalCriteria}`)
    console.log(`Failed: ${complianceReport.summary.failedCriteria}`)
    console.log(`Warnings: ${complianceReport.summary.warningCriteria}`)
    console.log('\nRecommendations:')
    complianceReport.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`)
    })

    // Expert council requirement: minimum 80% compliance
    expect(complianceReport.summary.complianceScore).toBeGreaterThanOrEqual(80)
  })
})
