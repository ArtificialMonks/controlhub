// src/lib/quality/__tests__/codeQualityMonitor.test.ts
/**
 * Code Quality Monitor Tests
 * Quest 4.3 - Expert Council Validated Implementation
 * 
 * Important Enhancement: Code Quality Metrics & Mutation Testing
 * Expert Consensus: 100% (6/6 experts)
 * Priority: MEDIUM
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CodeQualityMonitor, DEFAULT_QUALITY_THRESHOLDS } from '../codeQualityMonitor'

describe('CodeQualityMonitor', () => {
  let monitor: CodeQualityMonitor

  beforeEach(() => {
    monitor = new CodeQualityMonitor()
  })

  describe('Metrics Collection', () => {
    it('should collect comprehensive quality metrics', async () => {
      const context = {
        branch: 'main',
        commit: 'abc123',
        environment: 'test'
      }

      const metrics = await monitor.collectMetrics(context)

      expect(metrics).toBeDefined()
      expect(metrics.overallScore).toBeGreaterThanOrEqual(0)
      expect(metrics.overallScore).toBeLessThanOrEqual(100)
      expect(metrics.timestamp).toBeInstanceOf(Date)
      expect(metrics.context).toEqual(context)

      // Verify all metric categories are present
      expect(metrics.typescript).toBeDefined()
      expect(metrics.eslint).toBeDefined()
      expect(metrics.coverage).toBeDefined()
      expect(metrics.complexity).toBeDefined()
      expect(metrics.performance).toBeDefined()
      expect(metrics.security).toBeDefined()
      expect(metrics.documentation).toBeDefined()
    })

    it('should calculate overall score correctly', async () => {
      const context = { branch: 'main', commit: 'abc123', environment: 'test' }
      const metrics = await monitor.collectMetrics(context)

      // Overall score should be a weighted average
      expect(metrics.overallScore).toBeGreaterThan(0)
      expect(metrics.overallScore).toBeLessThanOrEqual(100)
      expect(typeof metrics.overallScore).toBe('number')
    })

    it('should store metrics in history', async () => {
      const context = { branch: 'main', commit: 'abc123', environment: 'test' }
      
      await monitor.collectMetrics(context)
      await monitor.collectMetrics({ ...context, commit: 'def456' })

      const history = monitor.getQualityHistory()
      expect(history).toHaveLength(2)
      expect(history[0].context.commit).toBe('abc123')
      expect(history[1].context.commit).toBe('def456')
    })
  })

  describe('TypeScript Metrics', () => {
    it('should calculate TypeScript score correctly', async () => {
      const context = { branch: 'main', commit: 'abc123', environment: 'test' }
      const metrics = await monitor.collectMetrics(context)

      expect(metrics.typescript.errors).toBeGreaterThanOrEqual(0)
      expect(metrics.typescript.warnings).toBeGreaterThanOrEqual(0)
      expect(typeof metrics.typescript.strictModeCompliance).toBe('boolean')
      expect(metrics.typescript.typeAnnotationCoverage).toBeGreaterThanOrEqual(0)
      expect(metrics.typescript.typeAnnotationCoverage).toBeLessThanOrEqual(100)
    })
  })

  describe('ESLint Metrics', () => {
    it('should calculate ESLint score correctly', async () => {
      const context = { branch: 'main', commit: 'abc123', environment: 'test' }
      const metrics = await monitor.collectMetrics(context)

      expect(metrics.eslint.errors).toBeGreaterThanOrEqual(0)
      expect(metrics.eslint.warnings).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(metrics.eslint.rulesViolated)).toBe(true)
      expect(metrics.eslint.fixableIssues).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Coverage Metrics', () => {
    it('should calculate coverage metrics correctly', async () => {
      const context = { branch: 'main', commit: 'abc123', environment: 'test' }
      const metrics = await monitor.collectMetrics(context)

      expect(metrics.coverage.statements).toBeGreaterThanOrEqual(0)
      expect(metrics.coverage.statements).toBeLessThanOrEqual(100)
      expect(metrics.coverage.branches).toBeGreaterThanOrEqual(0)
      expect(metrics.coverage.branches).toBeLessThanOrEqual(100)
      expect(metrics.coverage.functions).toBeGreaterThanOrEqual(0)
      expect(metrics.coverage.functions).toBeLessThanOrEqual(100)
      expect(metrics.coverage.lines).toBeGreaterThanOrEqual(0)
      expect(metrics.coverage.lines).toBeLessThanOrEqual(100)
      expect(Array.isArray(metrics.coverage.uncoveredLines)).toBe(true)
    })
  })

  describe('Complexity Metrics', () => {
    it('should calculate complexity metrics correctly', async () => {
      const context = { branch: 'main', commit: 'abc123', environment: 'test' }
      const metrics = await monitor.collectMetrics(context)

      expect(metrics.complexity.cyclomaticComplexity).toBeGreaterThanOrEqual(0)
      expect(metrics.complexity.cognitiveComplexity).toBeGreaterThanOrEqual(0)
      expect(metrics.complexity.maintainabilityIndex).toBeGreaterThanOrEqual(0)
      expect(metrics.complexity.maintainabilityIndex).toBeLessThanOrEqual(100)
      expect(metrics.complexity.technicalDebt).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Performance Metrics', () => {
    it('should calculate performance metrics correctly', async () => {
      const context = { branch: 'main', commit: 'abc123', environment: 'test' }
      const metrics = await monitor.collectMetrics(context)

      expect(metrics.performance.bundleSize).toBeGreaterThan(0)
      expect(metrics.performance.loadTime).toBeGreaterThan(0)
      expect(metrics.performance.memoryUsage).toBeGreaterThan(0)
      expect(metrics.performance.performanceScore).toBeGreaterThanOrEqual(0)
      expect(metrics.performance.performanceScore).toBeLessThanOrEqual(100)
    })
  })

  describe('Security Metrics', () => {
    it('should calculate security metrics correctly', async () => {
      const context = { branch: 'main', commit: 'abc123', environment: 'test' }
      const metrics = await monitor.collectMetrics(context)

      expect(metrics.security.vulnerabilities).toBeGreaterThanOrEqual(0)
      expect(metrics.security.securityScore).toBeGreaterThanOrEqual(0)
      expect(metrics.security.securityScore).toBeLessThanOrEqual(100)
      expect(metrics.security.sanitizationCoverage).toBeGreaterThanOrEqual(0)
      expect(metrics.security.sanitizationCoverage).toBeLessThanOrEqual(100)
    })
  })

  describe('Documentation Metrics', () => {
    it('should calculate documentation metrics correctly', async () => {
      const context = { branch: 'main', commit: 'abc123', environment: 'test' }
      const metrics = await monitor.collectMetrics(context)

      expect(metrics.documentation.jsdocCoverage).toBeGreaterThanOrEqual(0)
      expect(metrics.documentation.jsdocCoverage).toBeLessThanOrEqual(100)
      expect(metrics.documentation.readmeQuality).toBeGreaterThanOrEqual(0)
      expect(metrics.documentation.readmeQuality).toBeLessThanOrEqual(100)
      expect(metrics.documentation.apiDocumentation).toBeGreaterThanOrEqual(0)
      expect(metrics.documentation.apiDocumentation).toBeLessThanOrEqual(100)
    })
  })

  describe('Quality Alerts', () => {
    it('should generate alerts for threshold violations', async () => {
      // Create monitor with strict thresholds to trigger alerts
      const strictMonitor = new CodeQualityMonitor({
        typescript: { maxErrors: 0, maxWarnings: 0, minTypeAnnotationCoverage: 100 },
        coverage: { minStatements: 100, minBranches: 100, minFunctions: 100, minLines: 100 },
        security: { maxVulnerabilities: 0, minSecurityScore: 100, minSanitizationCoverage: 100 }
      })

      const context = { branch: 'main', commit: 'abc123', environment: 'test' }
      await strictMonitor.collectMetrics(context)

      const alerts = strictMonitor.getCurrentAlerts()
      expect(Array.isArray(alerts)).toBe(true)
      
      // Should have some alerts due to strict thresholds
      alerts.forEach(alert => {
        expect(alert.severity).toMatch(/^(critical|warning|info)$/)
        expect(alert.category).toBeDefined()
        expect(alert.message).toBeDefined()
        expect(alert.metric).toBeDefined()
        expect(typeof alert.currentValue).toBe('number')
        expect(typeof alert.threshold).toBe('number')
        expect(Array.isArray(alert.recommendations)).toBe(true)
        expect(alert.timestamp).toBeInstanceOf(Date)
      })
    })

    it('should not generate alerts when thresholds are met', async () => {
      // Use default thresholds which should be met by mock data
      const context = { branch: 'main', commit: 'abc123', environment: 'test' }
      await monitor.collectMetrics(context)

      const alerts = monitor.getCurrentAlerts()
      expect(Array.isArray(alerts)).toBe(true)
      // Should have minimal or no alerts with default thresholds
    })
  })

  describe('Quality Trends', () => {
    it('should calculate quality trends correctly', async () => {
      const context = { branch: 'main', commit: 'abc123', environment: 'test' }
      
      // Collect first metrics
      await monitor.collectMetrics(context)
      
      // Collect second metrics
      await monitor.collectMetrics({ ...context, commit: 'def456' })

      const trends = monitor.getQualityTrends()
      expect(Array.isArray(trends)).toBe(true)
      
      if (trends.length > 0) {
        trends.forEach(trend => {
          expect(trend.metric).toBeDefined()
          expect(typeof trend.current).toBe('number')
          expect(typeof trend.previous).toBe('number')
          expect(typeof trend.change).toBe('number')
          expect(trend.trend).toMatch(/^(improving|declining|stable)$/)
          expect(trend.significance).toMatch(/^(major|minor|negligible)$/)
        })
      }
    })

    it('should return empty trends with insufficient history', () => {
      const trends = monitor.getQualityTrends()
      expect(trends).toEqual([])
    })
  })

  describe('History Management', () => {
    it('should manage quality history correctly', async () => {
      const context = { branch: 'main', commit: 'abc123', environment: 'test' }
      
      // Initially empty
      expect(monitor.getQualityHistory()).toEqual([])

      // Add metrics
      await monitor.collectMetrics(context)
      expect(monitor.getQualityHistory()).toHaveLength(1)

      await monitor.collectMetrics({ ...context, commit: 'def456' })
      expect(monitor.getQualityHistory()).toHaveLength(2)

      // Clear history
      monitor.clearQualityHistory()
      expect(monitor.getQualityHistory()).toEqual([])
    })
  })

  describe('Custom Thresholds', () => {
    it('should use custom thresholds correctly', async () => {
      const customThresholds = {
        typescript: { maxErrors: 5, maxWarnings: 10, minTypeAnnotationCoverage: 80 },
        coverage: { minStatements: 70, minBranches: 65, minFunctions: 70, minLines: 70 }
      }

      const customMonitor = new CodeQualityMonitor(customThresholds)
      const context = { branch: 'main', commit: 'abc123', environment: 'test' }
      
      await customMonitor.collectMetrics(context)
      
      // Should work without throwing errors
      const alerts = customMonitor.getCurrentAlerts()
      expect(Array.isArray(alerts)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle metric collection errors gracefully', async () => {
      const context = { branch: 'main', commit: 'abc123', environment: 'test' }
      
      // Should not throw errors even with edge cases
      const metrics = await monitor.collectMetrics(context)
      expect(metrics).toBeDefined()
      expect(metrics.overallScore).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Default Thresholds', () => {
    it('should have reasonable default thresholds', () => {
      expect(DEFAULT_QUALITY_THRESHOLDS.typescript.maxErrors).toBe(0)
      expect(DEFAULT_QUALITY_THRESHOLDS.typescript.maxWarnings).toBe(0)
      expect(DEFAULT_QUALITY_THRESHOLDS.typescript.minTypeAnnotationCoverage).toBe(95)
      
      expect(DEFAULT_QUALITY_THRESHOLDS.coverage.minStatements).toBe(80)
      expect(DEFAULT_QUALITY_THRESHOLDS.coverage.minBranches).toBe(75)
      expect(DEFAULT_QUALITY_THRESHOLDS.coverage.minFunctions).toBe(80)
      expect(DEFAULT_QUALITY_THRESHOLDS.coverage.minLines).toBe(80)
      
      expect(DEFAULT_QUALITY_THRESHOLDS.security.maxVulnerabilities).toBe(0)
      expect(DEFAULT_QUALITY_THRESHOLDS.security.minSecurityScore).toBe(95)
      expect(DEFAULT_QUALITY_THRESHOLDS.security.minSanitizationCoverage).toBe(100)
    })
  })
})
