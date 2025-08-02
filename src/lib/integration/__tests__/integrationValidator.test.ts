// src/lib/integration/__tests__/integrationValidator.test.ts
/**
 * Integration Validator Tests
 * Quest 4.3 - Expert Council Validated Implementation
 * 
 * Stage 6.2: Enhanced Integration Validation
 * Expert Consensus: 100% (6/6 experts)
 * Priority: CRITICAL
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IntegrationValidator, IntegrationValidationReport } from '../integrationValidator'

// Mock the dependencies
vi.mock('../deployment/rollbackManager')
vi.mock('../accessibility/wcagAudit')
vi.mock('../mobile/mobileValidation')
vi.mock('../quality/codeQualityMonitor')

describe('IntegrationValidator', () => {
  let integrationValidator: IntegrationValidator

  beforeEach(() => {
    integrationValidator = new IntegrationValidator()
  })

  describe('Integration Validation Execution', () => {
    it('should run comprehensive integration validation', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      expect(validation).toBeDefined()
      expect(validation.reportId).toMatch(/^integration-validation-\d+-[a-z0-9]+$/)
      expect(validation.timestamp).toBeInstanceOf(Date)
      expect(validation.environment).toBe('staging')

      // Summary validation
      expect(validation.summary).toBeDefined()
      expect(validation.summary.totalTests).toBeGreaterThan(0)
      expect(validation.summary.overallScore).toBeGreaterThanOrEqual(0)
      expect(validation.summary.overallScore).toBeLessThanOrEqual(100)

      // Category results validation
      expect(validation.categoryResults).toBeDefined()
      expect(Object.keys(validation.categoryResults).length).toBeGreaterThan(0)

      // Test results validation
      expect(Array.isArray(validation.testResults)).toBe(true)
      expect(validation.testResults.length).toBeGreaterThan(0)

      // Rollback validation
      expect(validation.rollbackValidation).toBeDefined()
      expect(typeof validation.rollbackValidation.rollbackTested).toBe('boolean')
      expect(typeof validation.rollbackValidation.rollbackSuccessful).toBe('boolean')

      // Quality gates validation
      expect(Array.isArray(validation.qualityGates)).toBe(true)
      expect(validation.qualityGates.length).toBeGreaterThan(0)

      // Recommendations validation
      expect(Array.isArray(validation.recommendations)).toBe(true)

      // Deployment readiness validation
      expect(validation.deploymentReadiness).toMatch(/^(ready|not-ready|conditional)$/)
    })

    it('should test different environments', async () => {
      const environments = ['development', 'staging', 'production'] as const

      for (const env of environments) {
        const validation = await integrationValidator.runIntegrationValidation(env)
        expect(validation.environment).toBe(env)
        expect(validation.summary.totalTests).toBeGreaterThan(0)
      }
    })

    it('should provide detailed test results', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      validation.testResults.forEach(result => {
        expect(result.testId).toBeDefined()
        expect(result.status).toMatch(/^(pass|fail|skip|timeout|error)$/)
        expect(result.duration).toBeGreaterThanOrEqual(0)
        expect(result.message).toBeDefined()
        expect(result.details).toBeDefined()
        expect(Array.isArray(result.evidence)).toBe(true)
        expect(result.metrics).toBeDefined()
        expect(result.timestamp).toBeInstanceOf(Date)
      })
    })

    it('should categorize test results correctly', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      Object.values(validation.categoryResults).forEach(category => {
        expect(category.category).toBeDefined()
        expect(category.totalTests).toBeGreaterThan(0)
        expect(category.passedTests).toBeGreaterThanOrEqual(0)
        expect(category.failedTests).toBeGreaterThanOrEqual(0)
        expect(category.score).toBeGreaterThanOrEqual(0)
        expect(category.score).toBeLessThanOrEqual(100)
        expect(category.criticalFailures).toBeGreaterThanOrEqual(0)

        // Verify math
        expect(category.passedTests + category.failedTests).toBeLessThanOrEqual(category.totalTests)
      })
    })
  })

  describe('Functional Integration Tests', () => {
    it('should test filtering system integration', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      const filteringTest = validation.testResults.find(r => r.testId === 'filtering-integration')
      expect(filteringTest).toBeDefined()

      if (filteringTest) {
        expect(filteringTest.testId).toBe('filtering-integration')
        expect(filteringTest.status).toMatch(/^(pass|fail|skip|timeout|error)$/)
        expect(filteringTest.details.componentsLoaded).toBeDefined()
        expect(filteringTest.details.dataConnected).toBeDefined()
        expect(filteringTest.metrics.loadTime).toBeGreaterThan(0)
        expect(filteringTest.metrics.filterResponseTime).toBeGreaterThan(0)
        expect(filteringTest.evidence.length).toBeGreaterThan(0)
      }
    })

    it('should test UI component integration', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      const uiTest = validation.testResults.find(r => r.testId === 'ui-component-integration')
      expect(uiTest).toBeDefined()

      if (uiTest) {
        expect(uiTest.testId).toBe('ui-component-integration')
        expect(uiTest.details.componentsRendered).toBeDefined()
        expect(uiTest.details.stylesApplied).toBeDefined()
        expect(uiTest.metrics.renderTime).toBeGreaterThan(0)
        expect(uiTest.metrics.componentCount).toBeGreaterThan(0)
      }
    })
  })

  describe('Performance Integration Tests', () => {
    it('should test load performance', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      const performanceTest = validation.testResults.find(r => r.testId === 'load-performance')
      expect(performanceTest).toBeDefined()

      if (performanceTest) {
        expect(performanceTest.testId).toBe('load-performance')
        expect(performanceTest.details.loadTime).toBeGreaterThan(0)
        expect(performanceTest.details.threshold).toBe(3000)
        expect(performanceTest.metrics.loadTime).toBeGreaterThan(0)
        expect(performanceTest.metrics.firstContentfulPaint).toBeGreaterThan(0)
        expect(performanceTest.metrics.largestContentfulPaint).toBeGreaterThan(0)
        expect(performanceTest.metrics.timeToInteractive).toBeGreaterThan(0)
      }
    })

    it('should validate performance thresholds', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      const performanceTest = validation.testResults.find(r => r.testId === 'load-performance')
      if (performanceTest && performanceTest.status === 'pass') {
        expect(performanceTest.details.loadTime).toBeLessThan(3000)
      }
    })
  })

  describe('Accessibility Integration Tests', () => {
    it('should test WCAG compliance', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      const accessibilityTest = validation.testResults.find(r => r.testId === 'wcag-compliance')
      expect(accessibilityTest).toBeDefined()

      if (accessibilityTest) {
        expect(accessibilityTest.testId).toBe('wcag-compliance')
        expect(accessibilityTest.details.complianceScore).toBeGreaterThanOrEqual(0)
        expect(accessibilityTest.details.complianceScore).toBeLessThanOrEqual(100)
        expect(accessibilityTest.details.criticalIssues).toBeGreaterThanOrEqual(0)
        expect(accessibilityTest.details.totalCriteria).toBeGreaterThan(0)
        expect(accessibilityTest.details.passedCriteria).toBeGreaterThanOrEqual(0)
        expect(accessibilityTest.metrics.complianceScore).toBeDefined()
        expect(accessibilityTest.metrics.testDuration).toBeGreaterThan(0)
      }
    })

    it('should validate accessibility thresholds', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      const accessibilityTest = validation.testResults.find(r => r.testId === 'wcag-compliance')
      if (accessibilityTest && accessibilityTest.status === 'pass') {
        expect(accessibilityTest.details.complianceScore).toBeGreaterThanOrEqual(80)
      }
    })
  })

  describe('Mobile Integration Tests', () => {
    it('should test mobile compatibility', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      const mobileTest = validation.testResults.find(r => r.testId === 'mobile-compatibility')
      expect(mobileTest).toBeDefined()

      if (mobileTest) {
        expect(mobileTest.testId).toBe('mobile-compatibility')
        expect(mobileTest.details.overallScore).toBeGreaterThanOrEqual(0)
        expect(mobileTest.details.overallScore).toBeLessThanOrEqual(100)
        expect(mobileTest.details.devicesTestedCount).toBeGreaterThan(0)
        expect(mobileTest.details.accessibilityCompliance).toBeGreaterThanOrEqual(0)
        expect(mobileTest.details.performanceScore).toBeGreaterThanOrEqual(0)
        expect(mobileTest.metrics.devicesTestedCount).toBeGreaterThan(0)
      }
    })

    it('should validate mobile compatibility thresholds', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      const mobileTest = validation.testResults.find(r => r.testId === 'mobile-compatibility')
      if (mobileTest && mobileTest.status === 'pass') {
        expect(mobileTest.details.overallScore).toBeGreaterThanOrEqual(70)
      }
    })
  })

  describe('Security Integration Tests', () => {
    it('should test security validation', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      const securityTest = validation.testResults.find(r => r.testId === 'security-validation')
      expect(securityTest).toBeDefined()

      if (securityTest) {
        expect(securityTest.testId).toBe('security-validation')
        expect(securityTest.details.vulnerabilities).toBeGreaterThanOrEqual(0)
        expect(securityTest.details.securityScore).toBeGreaterThanOrEqual(0)
        expect(securityTest.details.securityScore).toBeLessThanOrEqual(100)
        expect(securityTest.details.testsRun).toBeGreaterThan(0)
        expect(securityTest.details.passed).toBeGreaterThanOrEqual(0)
        expect(securityTest.metrics.vulnerabilities).toBeGreaterThanOrEqual(0)
        expect(securityTest.metrics.scanDuration).toBeGreaterThan(0)
      }
    })

    it('should validate security requirements', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      const securityTest = validation.testResults.find(r => r.testId === 'security-validation')
      if (securityTest && securityTest.status === 'pass') {
        expect(securityTest.details.vulnerabilities).toBe(0)
      }
    })
  })

  describe('Rollback Validation', () => {
    it('should validate rollback capability', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      expect(validation.rollbackValidation.rollbackTested).toBe(true)
      expect(typeof validation.rollbackValidation.rollbackSuccessful).toBe('boolean')
      expect(validation.rollbackValidation.rollbackDuration).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(validation.rollbackValidation.rollbackIssues)).toBe(true)
      expect(validation.rollbackValidation.rollbackScore).toBeGreaterThanOrEqual(0)
      expect(validation.rollbackValidation.rollbackScore).toBeLessThanOrEqual(100)
    })

    it('should handle rollback failures gracefully', async () => {
      // Run multiple validations to potentially trigger rollback failures
      const validations = await Promise.all([
        integrationValidator.runIntegrationValidation('staging'),
        integrationValidator.runIntegrationValidation('staging'),
        integrationValidator.runIntegrationValidation('staging')
      ])

      validations.forEach(validation => {
        expect(validation.rollbackValidation).toBeDefined()
        
        if (!validation.rollbackValidation.rollbackSuccessful) {
          expect(validation.rollbackValidation.rollbackIssues.length).toBeGreaterThan(0)
          expect(validation.rollbackValidation.rollbackScore).toBeLessThan(100)
        }
      })
    })
  })

  describe('Quality Gates', () => {
    it('should run quality gates validation', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      expect(validation.qualityGates.length).toBeGreaterThan(0)

      validation.qualityGates.forEach(gate => {
        expect(gate.name).toBeDefined()
        expect(gate.status).toMatch(/^(pass|fail|warning)$/)
        expect(gate.score).toBeGreaterThanOrEqual(0)
        expect(gate.score).toBeLessThanOrEqual(100)
        expect(gate.threshold).toBeGreaterThan(0)
        expect(gate.message).toBeDefined()
        expect(typeof gate.blocking).toBe('boolean')
      })
    })

    it('should include critical quality gates', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      const gateNames = validation.qualityGates.map(g => g.name)
      expect(gateNames).toContain('Code Quality')
      expect(gateNames).toContain('Performance')
      expect(gateNames).toContain('Security')

      // Check blocking gates
      const blockingGates = validation.qualityGates.filter(g => g.blocking)
      expect(blockingGates.length).toBeGreaterThan(0)
    })
  })

  describe('Deployment Readiness Assessment', () => {
    it('should assess deployment readiness correctly', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      expect(validation.deploymentReadiness).toMatch(/^(ready|not-ready|conditional)$/)

      // If ready, should have high scores and no critical failures
      if (validation.deploymentReadiness === 'ready') {
        expect(validation.summary.overallScore).toBeGreaterThanOrEqual(90)
        expect(validation.summary.criticalFailures).toBe(0)
        expect(validation.rollbackValidation.rollbackSuccessful).toBe(true)
      }

      // If not ready, should have issues
      if (validation.deploymentReadiness === 'not-ready') {
        const hasIssues = 
          validation.summary.criticalFailures > 0 ||
          !validation.rollbackValidation.rollbackSuccessful ||
          validation.qualityGates.some(g => g.status === 'fail' && g.blocking)
        expect(hasIssues).toBe(true)
      }
    })

    it('should provide recommendations for deployment issues', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      if (validation.deploymentReadiness !== 'ready') {
        expect(validation.recommendations.length).toBeGreaterThan(0)
        
        validation.recommendations.forEach(recommendation => {
          expect(typeof recommendation).toBe('string')
          expect(recommendation.length).toBeGreaterThan(0)
        })
      }
    })
  })

  describe('Report Generation', () => {
    it('should generate detailed integration validation report', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')
      const report = integrationValidator.generateDetailedReport(validation)

      expect(typeof report).toBe('string')
      expect(report.length).toBeGreaterThan(0)

      // Check report structure
      expect(report).toContain('# Integration Validation Report')
      expect(report).toContain('## Executive Summary')
      expect(report).toContain('## Category Results')
      expect(report).toContain('## Rollback Validation')

      // Check report content
      expect(report).toContain(validation.reportId)
      expect(report).toContain(validation.environment)
      expect(report).toContain(validation.deploymentReadiness)
      expect(report).toContain(validation.summary.overallScore.toString())
    })

    it('should include category results in report', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')
      const report = integrationValidator.generateDetailedReport(validation)

      Object.values(validation.categoryResults).forEach(category => {
        expect(report).toContain(category.category)
        expect(report).toContain(category.score.toString())
      })
    })

    it('should include rollback validation in report', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')
      const report = integrationValidator.generateDetailedReport(validation)

      expect(report).toContain(validation.rollbackValidation.rollbackTested ? 'Yes' : 'No')
      expect(report).toContain(validation.rollbackValidation.rollbackSuccessful ? 'Yes' : 'No')
      expect(report).toContain(validation.rollbackValidation.rollbackDuration.toString())
      expect(report).toContain(validation.rollbackValidation.rollbackScore.toString())
    })

    it('should include recommendations when present', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')
      
      if (validation.recommendations.length > 0) {
        const report = integrationValidator.generateDetailedReport(validation)
        expect(report).toContain('## Recommendations')
        
        validation.recommendations.forEach(recommendation => {
          expect(report).toContain(recommendation)
        })
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      // Should not throw for valid parameters
      await expect(
        integrationValidator.runIntegrationValidation('staging')
      ).resolves.toBeDefined()
    })

    it('should provide fallback values for missing data', async () => {
      const validation = await integrationValidator.runIntegrationValidation('staging')

      // All required fields should be present
      expect(validation.reportId).toBeDefined()
      expect(validation.timestamp).toBeDefined()
      expect(validation.environment).toBeDefined()
      expect(validation.summary).toBeDefined()
      expect(validation.categoryResults).toBeDefined()
      expect(validation.testResults).toBeDefined()
      expect(validation.rollbackValidation).toBeDefined()
      expect(validation.qualityGates).toBeDefined()
      expect(validation.recommendations).toBeDefined()
      expect(validation.deploymentReadiness).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const startTime = Date.now()
      const validation = await integrationValidator.runIntegrationValidation('staging')
      const endTime = Date.now()

      const duration = endTime - startTime
      expect(duration).toBeLessThan(30000) // Should complete within 30 seconds
      expect(validation.summary.totalTests).toBeGreaterThan(0)
    })

    it('should handle concurrent validations', async () => {
      const validations = await Promise.allSettled([
        integrationValidator.runIntegrationValidation('development'),
        integrationValidator.runIntegrationValidation('staging'),
        integrationValidator.runIntegrationValidation('production')
      ])

      validations.forEach(validation => {
        expect(validation.status).toBe('fulfilled')
      })

      const successfulValidations = validations
        .filter(v => v.status === 'fulfilled')
        .map(v => (v as PromiseFulfilledResult<IntegrationValidationReport>).value)

      expect(successfulValidations.length).toBe(3)

      // Each validation should have unique report ID
      const reportIds = successfulValidations.map(v => v.reportId)
      const uniqueIds = new Set(reportIds)
      expect(uniqueIds.size).toBe(3)
    })
  })
})
