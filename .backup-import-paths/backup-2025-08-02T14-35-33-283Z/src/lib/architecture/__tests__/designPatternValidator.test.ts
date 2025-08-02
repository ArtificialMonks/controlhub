// src/lib/architecture/__tests__/designPatternValidator.test.ts
/**
 * Design Pattern Validator Tests
 * Phase 6.1: Design Pattern Validation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DesignPatternValidator } from '../designPatternValidator'

describe('DesignPatternValidator', () => {
  let validator: DesignPatternValidator

  beforeEach(() => {
    validator = new DesignPatternValidator()
  })

  describe('Architectural Pattern Validation', () => {
    it('should validate all architectural design patterns', async () => {
      const report = await validator.validateArchitecturalPatterns()

      expect(report).toBeDefined()
      expect(report.reportId).toMatch(/^arch-validation-\d+-[a-z0-9]+$/)
      expect(report.timestamp).toBeInstanceOf(Date)

      // Summary validation
      expect(report.summary.totalPatterns).toBeGreaterThan(0)
      expect(report.summary.compliantPatterns).toBeGreaterThanOrEqual(0)
      expect(report.summary.partiallyCompliantPatterns).toBeGreaterThanOrEqual(0)
      expect(report.summary.nonCompliantPatterns).toBeGreaterThanOrEqual(0)
      expect(report.summary.overallScore).toBeGreaterThanOrEqual(0)
      expect(report.summary.overallScore).toBeLessThanOrEqual(100)
      expect(report.summary.criticalViolations).toBeGreaterThanOrEqual(0)

      // Verify total adds up
      const totalValidated = report.summary.compliantPatterns + 
                            report.summary.partiallyCompliantPatterns + 
                            report.summary.nonCompliantPatterns
      expect(totalValidated).toBe(report.summary.totalPatterns)

      // Pattern validations
      expect(report.patternValidations.length).toBe(report.summary.totalPatterns)
      expect(report.patternValidations.length).toBeGreaterThan(0)

      // Quality metrics
      expect(report.qualityMetrics).toBeDefined()
      expect(report.qualityMetrics.codeOrganization).toBeGreaterThanOrEqual(0)
      expect(report.qualityMetrics.modularity).toBeGreaterThanOrEqual(0)
      expect(report.qualityMetrics.maintainability).toBeGreaterThanOrEqual(0)

      // Recommendations
      expect(Array.isArray(report.architecturalRecommendations)).toBe(true)
    })

    it('should validate specific architectural patterns', async () => {
      const report = await validator.validateArchitecturalPatterns()

      // Check for expected patterns
      const patternIds = report.patternValidations.map(p => p.patternId)
      expect(patternIds).toContain('data-access-layer')
      expect(patternIds).toContain('repository-pattern')
      expect(patternIds).toContain('component-architecture')
      expect(patternIds).toContain('state-management')
      expect(patternIds).toContain('hook-patterns')
      expect(patternIds).toContain('error-handling')
      expect(patternIds).toContain('security-patterns')
      expect(patternIds).toContain('performance-patterns')

      // Verify each pattern has required properties
      report.patternValidations.forEach(pattern => {
        expect(pattern.patternId).toBeDefined()
        expect(pattern.patternName).toBeDefined()
        expect(pattern.description).toBeDefined()
        expect(['structural', 'behavioral', 'creational', 'architectural']).toContain(pattern.category)
        expect(pattern.compliance).toBeDefined()
        expect(Array.isArray(pattern.violations)).toBe(true)
        expect(Array.isArray(pattern.recommendations)).toBe(true)
        expect(pattern.score).toBeGreaterThanOrEqual(0)
        expect(pattern.score).toBeLessThanOrEqual(100)
        expect(Array.isArray(pattern.evidence)).toBe(true)
      })
    })
  })

  describe('Data Access Layer Validation', () => {
    it('should validate DAL pattern implementation', async () => {
      const report = await validator.validateArchitecturalPatterns()
      const dalPattern = report.patternValidations.find(p => p.patternId === 'data-access-layer')

      expect(dalPattern).toBeDefined()
      if (dalPattern) {
        expect(dalPattern.patternName).toBe('Data Access Layer')
        expect(dalPattern.category).toBe('architectural')
        expect(dalPattern.compliance.isCompliant).toBe(true)
        expect(dalPattern.compliance.complianceLevel).toMatch(/^(full|partial|minimal|none)$/)
        expect(dalPattern.compliance.implementationQuality).toMatch(/^(excellent|good|fair|poor)$/)
        expect(dalPattern.compliance.maintainabilityScore).toBeGreaterThan(0)
        expect(dalPattern.compliance.scalabilityScore).toBeGreaterThan(0)
        expect(dalPattern.evidence.length).toBeGreaterThan(0)
      }
    })

    it('should identify DAL violations when present', async () => {
      const report = await validator.validateArchitecturalPatterns()
      const dalPattern = report.patternValidations.find(p => p.patternId === 'data-access-layer')

      if (dalPattern && dalPattern.violations.length > 0) {
        dalPattern.violations.forEach(violation => {
          expect(violation.violationId).toBeDefined()
          expect(['critical', 'major', 'minor', 'info']).toContain(violation.severity)
          expect(violation.description).toBeDefined()
          expect(violation.location).toBeDefined()
          expect(violation.suggestion).toBeDefined()
          expect(violation.impact).toBeDefined()
        })
      }
    })
  })

  describe('Repository Pattern Validation', () => {
    it('should validate repository pattern implementation', async () => {
      const report = await validator.validateArchitecturalPatterns()
      const repoPattern = report.patternValidations.find(p => p.patternId === 'repository-pattern')

      expect(repoPattern).toBeDefined()
      if (repoPattern) {
        expect(repoPattern.patternName).toBe('Repository Pattern')
        expect(repoPattern.category).toBe('structural')
        expect(repoPattern.description).toContain('data access')
        expect(repoPattern.evidence.length).toBeGreaterThan(0)
        expect(repoPattern.score).toBeGreaterThan(80) // Should be high quality
      }
    })
  })

  describe('Component Architecture Validation', () => {
    it('should validate React component architecture', async () => {
      const report = await validator.validateArchitecturalPatterns()
      const componentPattern = report.patternValidations.find(p => p.patternId === 'component-architecture')

      expect(componentPattern).toBeDefined()
      if (componentPattern) {
        expect(componentPattern.patternName).toBe('Component Architecture')
        expect(componentPattern.category).toBe('structural')
        expect(componentPattern.description).toContain('React component')
        expect(componentPattern.evidence).toContain('TypeScript strict mode compliance')
        expect(componentPattern.score).toBeGreaterThan(85) // Should be high quality
      }
    })
  })

  describe('State Management Validation', () => {
    it('should validate state management patterns', async () => {
      const report = await validator.validateArchitecturalPatterns()
      const statePattern = report.patternValidations.find(p => p.patternId === 'state-management')

      expect(statePattern).toBeDefined()
      if (statePattern) {
        expect(statePattern.patternName).toBe('State Management')
        expect(statePattern.category).toBe('behavioral')
        expect(statePattern.evidence).toContain('Zustand store implementation')
        expect(statePattern.evidence).toContain('Immutable state updates')
        expect(statePattern.score).toBeGreaterThan(80)
      }
    })
  })

  describe('Hook Patterns Validation', () => {
    it('should validate React hook patterns', async () => {
      const report = await validator.validateArchitecturalPatterns()
      const hookPattern = report.patternValidations.find(p => p.patternId === 'hook-patterns')

      expect(hookPattern).toBeDefined()
      if (hookPattern) {
        expect(hookPattern.patternName).toBe('Hook Patterns')
        expect(hookPattern.category).toBe('behavioral')
        expect(hookPattern.evidence.some(e => e.includes('useFilterState'))).toBe(true)
        expect(hookPattern.evidence.some(e => e.includes('usePerformanceMonitor'))).toBe(true)
        expect(hookPattern.score).toBeGreaterThan(80)
      }
    })
  })

  describe('Error Handling Validation', () => {
    it('should validate error handling patterns', async () => {
      const report = await validator.validateArchitecturalPatterns()
      const errorPattern = report.patternValidations.find(p => p.patternId === 'error-handling')

      expect(errorPattern).toBeDefined()
      if (errorPattern) {
        expect(errorPattern.patternName).toBe('Error Handling')
        expect(errorPattern.category).toBe('behavioral')
        expect(errorPattern.evidence).toContain('Error boundaries implemented')
        expect(errorPattern.evidence).toContain('Consistent error type definitions')
        expect(errorPattern.score).toBeGreaterThan(75)
      }
    })
  })

  describe('Security Patterns Validation', () => {
    it('should validate security implementation patterns', async () => {
      const report = await validator.validateArchitecturalPatterns()
      const securityPattern = report.patternValidations.find(p => p.patternId === 'security-patterns')

      expect(securityPattern).toBeDefined()
      if (securityPattern) {
        expect(securityPattern.patternName).toBe('Security Patterns')
        expect(securityPattern.category).toBe('architectural')
        expect(securityPattern.evidence).toContain('Input validation and sanitization')
        expect(securityPattern.evidence).toContain('CSRF and XSS protection')
        expect(securityPattern.score).toBeGreaterThan(90) // Security should be high
      }
    })
  })

  describe('Performance Patterns Validation', () => {
    it('should validate performance optimization patterns', async () => {
      const report = await validator.validateArchitecturalPatterns()
      const perfPattern = report.patternValidations.find(p => p.patternId === 'performance-patterns')

      expect(perfPattern).toBeDefined()
      if (perfPattern) {
        expect(perfPattern.patternName).toBe('Performance Patterns')
        expect(perfPattern.category).toBe('architectural')
        expect(perfPattern.evidence).toContain('Performance optimization patterns')
        expect(perfPattern.evidence).toContain('Caching strategies implemented')
        expect(perfPattern.score).toBeGreaterThan(85)
      }
    })
  })

  describe('Quality Metrics', () => {
    it('should calculate comprehensive quality metrics', async () => {
      const report = await validator.validateArchitecturalPatterns()
      const metrics = report.qualityMetrics

      expect(metrics.codeOrganization).toBeGreaterThan(80)
      expect(metrics.codeOrganization).toBeLessThanOrEqual(100)
      
      expect(metrics.modularity).toBeGreaterThan(80)
      expect(metrics.modularity).toBeLessThanOrEqual(100)
      
      expect(metrics.separation).toBeGreaterThan(80)
      expect(metrics.separation).toBeLessThanOrEqual(100)
      
      expect(metrics.abstraction).toBeGreaterThan(80)
      expect(metrics.abstraction).toBeLessThanOrEqual(100)
      
      expect(metrics.coupling).toBeGreaterThanOrEqual(0)
      expect(metrics.coupling).toBeLessThan(50) // Lower coupling is better
      
      expect(metrics.cohesion).toBeGreaterThan(80)
      expect(metrics.cohesion).toBeLessThanOrEqual(100)
      
      expect(metrics.maintainability).toBeGreaterThan(80)
      expect(metrics.maintainability).toBeLessThanOrEqual(100)
      
      expect(metrics.testability).toBeGreaterThan(75)
      expect(metrics.testability).toBeLessThanOrEqual(100)
    })
  })

  describe('Violation Detection', () => {
    it('should detect and categorize violations correctly', async () => {
      const report = await validator.validateArchitecturalPatterns()

      // Check violation structure
      report.patternValidations.forEach(pattern => {
        pattern.violations.forEach(violation => {
          expect(violation.violationId).toBeDefined()
          expect(['critical', 'major', 'minor', 'info']).toContain(violation.severity)
          expect(violation.description).toBeDefined()
          expect(violation.location).toBeDefined()
          expect(violation.suggestion).toBeDefined()
          expect(violation.impact).toBeDefined()
        })
      })

      // Critical violations should be counted correctly
      const totalCriticalViolations = report.patternValidations.reduce((sum, pattern) => 
        sum + pattern.violations.filter(v => v.severity === 'critical').length, 0
      )
      expect(totalCriticalViolations).toBe(report.summary.criticalViolations)
    })
  })

  describe('Compliance Assessment', () => {
    it('should assess compliance levels correctly', async () => {
      const report = await validator.validateArchitecturalPatterns()

      report.patternValidations.forEach(pattern => {
        const compliance = pattern.compliance
        
        expect(typeof compliance.isCompliant).toBe('boolean')
        expect(['full', 'partial', 'minimal', 'none']).toContain(compliance.complianceLevel)
        expect(['excellent', 'good', 'fair', 'poor']).toContain(compliance.implementationQuality)
        expect(compliance.maintainabilityScore).toBeGreaterThanOrEqual(0)
        expect(compliance.maintainabilityScore).toBeLessThanOrEqual(100)
        expect(compliance.scalabilityScore).toBeGreaterThanOrEqual(0)
        expect(compliance.scalabilityScore).toBeLessThanOrEqual(100)

        // Compliance logic validation
        if (compliance.isCompliant) {
          expect(['full', 'partial']).toContain(compliance.complianceLevel)
        }
      })
    })

    it('should calculate overall compliance correctly', async () => {
      const report = await validator.validateArchitecturalPatterns()

      // Overall score should reflect individual pattern scores
      const averageScore = report.patternValidations.reduce((sum, p) => sum + p.score, 0) / report.patternValidations.length
      expect(Math.abs(report.summary.overallScore - averageScore)).toBeLessThan(5) // Allow small rounding differences
    })
  })

  describe('Recommendations Generation', () => {
    it('should generate appropriate architectural recommendations', async () => {
      const report = await validator.validateArchitecturalPatterns()

      expect(Array.isArray(report.architecturalRecommendations)).toBe(true)
      expect(report.architecturalRecommendations.length).toBeGreaterThan(0)

      report.architecturalRecommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string')
        expect(recommendation.length).toBeGreaterThan(0)
      })

      // Should have maintenance recommendations for high-quality systems
      if (report.summary.overallScore > 90 && report.summary.criticalViolations === 0) {
        expect(report.architecturalRecommendations.some(r => 
          r.includes('Maintain') || r.includes('Continue')
        )).toBe(true)
      }
    })

    it('should prioritize critical violations in recommendations', async () => {
      const report = await validator.validateArchitecturalPatterns()

      if (report.summary.criticalViolations > 0) {
        const urgentRecommendations = report.architecturalRecommendations.filter(r => 
          r.includes('URGENT') || r.includes('critical')
        )
        expect(urgentRecommendations.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Report Generation', () => {
    it('should generate detailed architectural report', async () => {
      const report = await validator.validateArchitecturalPatterns()
      const detailedReport = validator.generateDetailedReport(report)

      expect(typeof detailedReport).toBe('string')
      expect(detailedReport.length).toBeGreaterThan(0)

      // Check report structure
      expect(detailedReport).toContain('# Architectural Design Pattern Validation Report')
      expect(detailedReport).toContain('## Executive Summary')
      expect(detailedReport).toContain('## Pattern Validation Results')
      expect(detailedReport).toContain('## Quality Metrics')

      // Check report content
      expect(detailedReport).toContain(report.reportId)
      expect(detailedReport).toContain(report.summary.totalPatterns.toString())
      expect(detailedReport).toContain(report.summary.overallScore.toString())

      // Check that all patterns are included
      report.patternValidations.forEach(pattern => {
        expect(detailedReport).toContain(pattern.patternName)
        expect(detailedReport).toContain(pattern.score.toString())
      })

      // Check quality metrics inclusion
      expect(detailedReport).toContain(report.qualityMetrics.codeOrganization.toString())
      expect(detailedReport).toContain(report.qualityMetrics.maintainability.toString())

      // Check recommendations if present
      if (report.architecturalRecommendations.length > 0) {
        expect(detailedReport).toContain('## Architectural Recommendations')
        report.architecturalRecommendations.forEach(recommendation => {
          expect(detailedReport).toContain(recommendation)
        })
      }
    })
  })

  describe('Pattern Categories', () => {
    it('should validate patterns across all categories', async () => {
      const report = await validator.validateArchitecturalPatterns()

      const categories = new Set(report.patternValidations.map(p => p.category))
      
      // Should have multiple categories
      expect(categories.size).toBeGreaterThan(1)
      
      // Should include key categories
      expect(categories.has('architectural')).toBe(true)
      expect(categories.has('structural')).toBe(true)
      expect(categories.has('behavioral')).toBe(true)
    })

    it('should categorize patterns correctly', async () => {
      const report = await validator.validateArchitecturalPatterns()

      // Check specific pattern categorizations
      const dalPattern = report.patternValidations.find(p => p.patternId === 'data-access-layer')
      expect(dalPattern?.category).toBe('architectural')

      const repoPattern = report.patternValidations.find(p => p.patternId === 'repository-pattern')
      expect(repoPattern?.category).toBe('structural')

      const statePattern = report.patternValidations.find(p => p.patternId === 'state-management')
      expect(statePattern?.category).toBe('behavioral')
    })
  })

  describe('Evidence Collection', () => {
    it('should collect comprehensive evidence for each pattern', async () => {
      const report = await validator.validateArchitecturalPatterns()

      report.patternValidations.forEach(pattern => {
        expect(pattern.evidence.length).toBeGreaterThan(0)
        
        pattern.evidence.forEach(evidence => {
          expect(typeof evidence).toBe('string')
          expect(evidence.length).toBeGreaterThan(0)
        })
      })
    })

    it('should provide specific evidence for key patterns', async () => {
      const report = await validator.validateArchitecturalPatterns()

      // DAL should have specific evidence
      const dalPattern = report.patternValidations.find(p => p.patternId === 'data-access-layer')
      expect(dalPattern?.evidence.some(e => e.includes('DAL structure'))).toBe(true)

      // Component architecture should mention TypeScript
      const componentPattern = report.patternValidations.find(p => p.patternId === 'component-architecture')
      expect(componentPattern?.evidence.some(e => e.includes('TypeScript'))).toBe(true)

      // Security should mention specific protections
      const securityPattern = report.patternValidations.find(p => p.patternId === 'security-patterns')
      expect(securityPattern?.evidence.some(e => e.includes('CSRF') || e.includes('XSS'))).toBe(true)
    })
  })

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const startTime = Date.now()
      const report = await validator.validateArchitecturalPatterns()
      const endTime = Date.now()

      const duration = endTime - startTime
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
      expect(report.patternValidations.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      // Should not throw for normal validation
      await expect(validator.validateArchitecturalPatterns()).resolves.toBeDefined()
    })

    it('should provide meaningful validation results', async () => {
      const report = await validator.validateArchitecturalPatterns()

      // All required fields should be present
      expect(report.reportId).toBeDefined()
      expect(report.timestamp).toBeDefined()
      expect(report.summary).toBeDefined()
      expect(report.patternValidations).toBeDefined()
      expect(report.architecturalRecommendations).toBeDefined()
      expect(report.qualityMetrics).toBeDefined()
    })
  })
})
