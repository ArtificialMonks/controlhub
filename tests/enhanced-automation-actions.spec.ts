/**
 * Enhanced Automation Actions E2E Tests - Quest 4.4
 * Implements expert council E2E testing with performance monitoring
 * Comprehensive end-to-end validation with Core Web Vitals tracking
 */

import { test, expect, Page } from '@playwright/test'

// ============================================================================
// PERFORMANCE MONITORING UTILITIES
// ============================================================================

interface PerformanceMetrics {
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  inp: number // Interaction to Next Paint
  ttfb: number // Time to First Byte
  fcp: number // First Contentful Paint
  loadTime: number
  domContentLoaded: number
}

interface ActionPerformanceResult {
  actionName: string
  responseTime: number
  success: boolean
  metrics: PerformanceMetrics
  timestamp: string
}

/**
 * Collect Core Web Vitals and performance metrics
 */
async function collectPerformanceMetrics(page: Page): Promise<PerformanceMetrics> {
  return await page.evaluate(() => {
    return new Promise<PerformanceMetrics>((resolve) => {
      // Wait for page to be fully loaded
      if (document.readyState === 'complete') {
        collectMetrics()
      } else {
        window.addEventListener('load', collectMetrics)
      }

      function collectMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        // Core Web Vitals
        let lcp = 0
        let fid = 0
        let cls = 0
        let inp = 0

        // LCP - Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          lcp = lastEntry.startTime
        }).observe({ type: 'largest-contentful-paint', buffered: true })

        // FID - First Input Delay (deprecated, using INP instead)
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              fid = entry.processingStart - entry.startTime
            }
          })
        }).observe({ type: 'first-input', buffered: true })

        // CLS - Cumulative Layout Shift
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              cls += entry.value
            }
          })
        }).observe({ type: 'layout-shift', buffered: true })

        // INP - Interaction to Next Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            inp = Math.max(inp, entry.duration)
          })
        }).observe({ type: 'event', buffered: true })

        // Basic timing metrics
        const ttfb = navigation.responseStart - navigation.requestStart
        const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart

        // Wait a bit for observers to collect data
        setTimeout(() => {
          resolve({
            lcp: lcp || 0,
            fid: fid || 0,
            cls: cls || 0,
            inp: inp || 0,
            ttfb,
            fcp,
            loadTime,
            domContentLoaded
          })
        }, 1000)
      }
    })
  })
}

/**
 * Measure action response time with performance monitoring
 */
async function measureActionPerformance(
  page: Page,
  actionName: string,
  actionFn: () => Promise<void>
): Promise<ActionPerformanceResult> {
  const startTime = Date.now()
  
  try {
    // Execute the action
    await actionFn()
    
    const responseTime = Date.now() - startTime
    const metrics = await collectPerformanceMetrics(page)
    
    return {
      actionName,
      responseTime,
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    const metrics = await collectPerformanceMetrics(page)
    
    return {
      actionName,
      responseTime,
      success: false,
      metrics,
      timestamp: new Date().toISOString()
    }
  }
}

// ============================================================================
// ENHANCED E2E TESTS WITH PERFORMANCE MONITORING
// ============================================================================

test.describe('Enhanced Automation Actions E2E Tests', () => {
  let performanceResults: ActionPerformanceResult[] = []

  test.beforeEach(async ({ page }) => {
    // Navigate to automations page
    await page.goto('/automations')
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    
    // Collect initial performance metrics
    const initialMetrics = await collectPerformanceMetrics(page)
    console.log('Initial page metrics:', initialMetrics)
  })

  test.afterEach(async () => {
    // Log performance results
    if (performanceResults.length > 0) {
      console.log('Performance Results:', JSON.stringify(performanceResults, null, 2))
    }
  })

  // ==========================================================================
  // INDIVIDUAL ACTION PERFORMANCE TESTS
  // ==========================================================================

  test('should run automation with performance monitoring', async ({ page }) => {
    // Find the first automation row
    const firstRow = page.locator('[data-testid="automation-row"]').first()
    await expect(firstRow).toBeVisible()

    // Measure run action performance
    const runResult = await measureActionPerformance(page, 'run-automation', async () => {
      const runButton = firstRow.locator('button', { hasText: 'Run' })
      await expect(runButton).toBeVisible()
      await expect(runButton).toBeEnabled()
      
      await runButton.click()
      
      // Wait for confirmation dialog
      const confirmDialog = page.locator('[role="dialog"]')
      await expect(confirmDialog).toBeVisible()
      
      // Confirm the action
      const confirmButton = confirmDialog.locator('button', { hasText: 'Confirm' })
      await confirmButton.click()
      
      // Wait for success feedback
      await expect(page.locator('.toast')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('.toast')).toContainText('started successfully')
    })

    performanceResults.push(runResult)

    // Validate performance requirements (expert council standards)
    expect(runResult.responseTime).toBeLessThan(2000) // < 2 seconds
    expect(runResult.metrics.lcp).toBeLessThan(2500) // < 2.5 seconds
    expect(runResult.metrics.cls).toBeLessThan(0.1) // < 0.1
    expect(runResult.metrics.inp).toBeLessThan(200) // < 200ms
    expect(runResult.success).toBe(true)
  })

  test('should stop automation with performance monitoring', async ({ page }) => {
    // First, start an automation to have something to stop
    const firstRow = page.locator('[data-testid="automation-row"]').first()
    const runButton = firstRow.locator('button', { hasText: 'Run' })
    
    if (await runButton.isVisible() && await runButton.isEnabled()) {
      await runButton.click()
      const confirmDialog = page.locator('[role="dialog"]')
      if (await confirmDialog.isVisible()) {
        await confirmDialog.locator('button', { hasText: 'Confirm' }).click()
        await page.waitForTimeout(2000) // Wait for automation to start
      }
    }

    // Measure stop action performance
    const stopResult = await measureActionPerformance(page, 'stop-automation', async () => {
      const stopButton = firstRow.locator('button', { hasText: 'Stop' })
      await expect(stopButton).toBeVisible()
      await expect(stopButton).toBeEnabled()
      
      await stopButton.click()
      
      // Wait for confirmation dialog
      const confirmDialog = page.locator('[role="dialog"]')
      await expect(confirmDialog).toBeVisible()
      
      // Confirm the action
      const confirmButton = confirmDialog.locator('button', { hasText: 'Confirm' })
      await confirmButton.click()
      
      // Wait for success feedback
      await expect(page.locator('.toast')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('.toast')).toContainText('stopped successfully')
    })

    performanceResults.push(stopResult)

    // Validate performance requirements
    expect(stopResult.responseTime).toBeLessThan(2000) // < 2 seconds
    expect(stopResult.success).toBe(true)
  })

  // ==========================================================================
  // BULK ACTION PERFORMANCE TESTS
  // ==========================================================================

  test('should perform bulk actions with performance monitoring', async ({ page }) => {
    // Select multiple automations
    const checkboxes = page.locator('[data-testid="automation-checkbox"]')
    const checkboxCount = await checkboxes.count()
    
    if (checkboxCount > 0) {
      // Select first 3 automations (or all if less than 3)
      const selectCount = Math.min(3, checkboxCount)
      for (let i = 0; i < selectCount; i++) {
        await checkboxes.nth(i).check()
      }

      // Measure bulk run performance
      const bulkRunResult = await measureActionPerformance(page, 'bulk-run-automations', async () => {
        const bulkRunButton = page.locator('button', { hasText: 'Run Selected' })
        await expect(bulkRunButton).toBeVisible()
        await expect(bulkRunButton).toBeEnabled()
        
        await bulkRunButton.click()
        
        // Wait for confirmation dialog
        const confirmDialog = page.locator('[role="dialog"]')
        await expect(confirmDialog).toBeVisible()
        
        // Confirm the action
        const confirmButton = confirmDialog.locator('button', { hasText: 'Confirm' })
        await confirmButton.click()
        
        // Wait for bulk action completion
        await expect(page.locator('.toast')).toBeVisible({ timeout: 30000 })
        await expect(page.locator('.toast')).toContainText('Bulk run action completed')
      })

      performanceResults.push(bulkRunResult)

      // Validate bulk action performance (expert council: < 30 seconds per batch)
      expect(bulkRunResult.responseTime).toBeLessThan(30000) // < 30 seconds
      expect(bulkRunResult.success).toBe(true)
    }
  })

  // ==========================================================================
  // ACCESSIBILITY & UX PERFORMANCE TESTS
  // ==========================================================================

  test('should validate accessibility with performance monitoring', async ({ page }) => {
    const accessibilityResult = await measureActionPerformance(page, 'accessibility-validation', async () => {
      // Check for proper ARIA labels
      const runButtons = page.locator('button', { hasText: 'Run' })
      const buttonCount = await runButtons.count()
      
      for (let i = 0; i < buttonCount; i++) {
        const button = runButtons.nth(i)
        await expect(button).toHaveAttribute('aria-label')
      }
      
      // Check for keyboard navigation
      await page.keyboard.press('Tab')
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
      
      // Check for screen reader compatibility
      const headings = page.locator('h1, h2, h3, h4, h5, h6')
      await expect(headings.first()).toBeVisible()
    })

    performanceResults.push(accessibilityResult)

    // Validate accessibility performance
    expect(accessibilityResult.responseTime).toBeLessThan(1000) // < 1 second
    expect(accessibilityResult.success).toBe(true)
  })

  // ==========================================================================
  // ERROR HANDLING PERFORMANCE TESTS
  // ==========================================================================

  test('should handle errors gracefully with performance monitoring', async ({ page }) => {
    // Mock API error
    await page.route('**/api/automations/*/run', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })

    const errorHandlingResult = await measureActionPerformance(page, 'error-handling', async () => {
      const firstRow = page.locator('[data-testid="automation-row"]').first()
      const runButton = firstRow.locator('button', { hasText: 'Run' })
      
      await runButton.click()
      
      // Wait for confirmation dialog
      const confirmDialog = page.locator('[role="dialog"]')
      await expect(confirmDialog).toBeVisible()
      
      // Confirm the action
      const confirmButton = confirmDialog.locator('button', { hasText: 'Confirm' })
      await confirmButton.click()
      
      // Wait for error feedback
      await expect(page.locator('.toast')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('.toast')).toContainText('error')
    })

    performanceResults.push(errorHandlingResult)

    // Validate error handling performance
    expect(errorHandlingResult.responseTime).toBeLessThan(5000) // < 5 seconds for error handling
    expect(errorHandlingResult.success).toBe(true)
  })

  // ==========================================================================
  // PERFORMANCE SUMMARY TEST
  // ==========================================================================

  test('should generate performance summary report', async ({ page }) => {
    // This test runs after all others to summarize performance
    if (performanceResults.length > 0) {
      const avgResponseTime = performanceResults.reduce((sum, result) => sum + result.responseTime, 0) / performanceResults.length
      const successRate = (performanceResults.filter(result => result.success).length / performanceResults.length) * 100
      
      console.log('='.repeat(60))
      console.log('PERFORMANCE SUMMARY REPORT')
      console.log('='.repeat(60))
      console.log(`Total Actions Tested: ${performanceResults.length}`)
      console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`)
      console.log(`Success Rate: ${successRate.toFixed(1)}%`)
      console.log(`Expert Council Compliance: ${avgResponseTime < 2000 ? 'PASS' : 'FAIL'}`)
      
      // Validate overall performance
      expect(avgResponseTime).toBeLessThan(2000) // Expert council requirement
      expect(successRate).toBeGreaterThanOrEqual(95) // 95% success rate minimum
    }
  })
})
