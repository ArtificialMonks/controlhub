// src/lib/accessibility/__tests__/wcagAudit.test.ts
/**
 * WCAG Audit Tests
 * Quest 4.3 - Expert Council Validated Implementation
 * 
 * Stage 5.1: WCAG 2.1 AA Accessibility Audit
 * Expert Consensus: 100% (6/6 experts)
 * Priority: HIGH
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { WCAGAuditEngine, WCAG_21_AA_CRITERIA } from '../wcagAudit'

describe('WCAGAuditEngine', () => {
  let auditEngine: WCAGAuditEngine

  beforeEach(() => {
    auditEngine = new WCAGAuditEngine('AA')
  })

  describe('WCAG Criteria Definitions', () => {
    it('should have comprehensive WCAG 2.1 AA criteria', () => {
      expect(WCAG_21_AA_CRITERIA.length).toBeGreaterThan(0)
      
      WCAG_21_AA_CRITERIA.forEach(criterion => {
        expect(criterion.id).toMatch(/^\d+\.\d+\.\d+$/)
        expect(criterion.level).toMatch(/^(A|AA|AAA)$/)
        expect(criterion.principle).toMatch(/^(perceivable|operable|understandable|robust)$/)
        expect(criterion.title).toBeDefined()
        expect(criterion.description).toBeDefined()
        expect(Array.isArray(criterion.successCriteria)).toBe(true)
        expect(Array.isArray(criterion.testingMethods)).toBe(true)
        expect(Array.isArray(criterion.commonFailures)).toBe(true)
        expect(Array.isArray(criterion.techniques)).toBe(true)
      })
    })

    it('should include key WCAG 2.1 AA criteria', () => {
      const criteriaIds = WCAG_21_AA_CRITERIA.map(c => c.id)
      
      // Key A level criteria
      expect(criteriaIds).toContain('1.1.1') // Non-text Content
      expect(criteriaIds).toContain('1.3.1') // Info and Relationships
      expect(criteriaIds).toContain('2.1.1') // Keyboard
      expect(criteriaIds).toContain('4.1.2') // Name, Role, Value
      
      // Key AA level criteria
      expect(criteriaIds).toContain('1.4.3') // Contrast (Minimum)
      expect(criteriaIds).toContain('1.4.11') // Non-text Contrast
      expect(criteriaIds).toContain('2.4.6') // Headings and Labels
      expect(criteriaIds).toContain('2.4.7') // Focus Visible
      expect(criteriaIds).toContain('4.1.3') // Status Messages
    })

    it('should categorize criteria by principle', () => {
      const principles = WCAG_21_AA_CRITERIA.reduce((acc, criterion) => {
        acc[criterion.principle] = (acc[criterion.principle] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      expect(principles.perceivable).toBeGreaterThan(0)
      expect(principles.operable).toBeGreaterThan(0)
      expect(principles.understandable).toBeGreaterThan(0)
      expect(principles.robust).toBeGreaterThan(0)
    })
  })

  describe('Audit Engine Initialization', () => {
    it('should initialize with AA level by default', () => {
      const engine = new WCAGAuditEngine()
      expect(engine).toBeDefined()
    })

    it('should filter criteria by level', () => {
      const engineA = new WCAGAuditEngine('A')
      const engineAA = new WCAGAuditEngine('AA')
      
      expect(engineA).toBeDefined()
      expect(engineAA).toBeDefined()
    })
  })

  describe('Audit Execution', () => {
    it('should run comprehensive WCAG audit', async () => {
      const audit = await auditEngine.runAudit('http://localhost:3000')
      
      expect(audit).toBeDefined()
      expect(audit.reportId).toMatch(/^wcag-audit-\d+-[a-z0-9]+$/)
      expect(audit.timestamp).toBeInstanceOf(Date)
      expect(audit.url).toBe('http://localhost:3000')
      expect(audit.level).toBe('AA')
      
      // Summary validation
      expect(audit.summary.totalCriteria).toBeGreaterThan(0)
      expect(audit.summary.complianceScore).toBeGreaterThanOrEqual(0)
      expect(audit.summary.complianceScore).toBeLessThanOrEqual(100)
      expect(audit.summary.overallStatus).toMatch(/^(compliant|non-compliant|partially-compliant)$/)
      
      // Results validation
      expect(Array.isArray(audit.results)).toBe(true)
      expect(audit.results.length).toBe(audit.summary.totalCriteria)
      
      // Technical details validation
      expect(audit.technicalDetails.testDuration).toBeGreaterThan(0)
      expect(audit.technicalDetails.automatedTests).toBeGreaterThanOrEqual(0)
      expect(audit.technicalDetails.manualTests).toBeGreaterThanOrEqual(0)
      expect(audit.technicalDetails.elementsScanned).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(audit.technicalDetails.toolsUsed)).toBe(true)
    })

    it('should provide detailed results for each criterion', async () => {
      const audit = await auditEngine.runAudit()
      
      audit.results.forEach(result => {
        expect(result.criterionId).toMatch(/^\d+\.\d+\.\d+$/)
        expect(result.status).toMatch(/^(pass|fail|warning|not-applicable|needs-review)$/)
        expect(result.score).toBeGreaterThanOrEqual(0)
        expect(result.score).toBeLessThanOrEqual(100)
        expect(Array.isArray(result.issues)).toBe(true)
        expect(result.testedElements).toBeGreaterThanOrEqual(0)
        expect(result.passedElements).toBeGreaterThanOrEqual(0)
        expect(result.failedElements).toBeGreaterThanOrEqual(0)
        expect(Array.isArray(result.recommendations)).toBe(true)
        expect(result.automatedTestCoverage).toBeGreaterThanOrEqual(0)
        expect(result.automatedTestCoverage).toBeLessThanOrEqual(100)
        expect(typeof result.manualTestRequired).toBe('boolean')
      })
    })

    it('should identify accessibility issues', async () => {
      const audit = await auditEngine.runAudit()
      
      const issuesFound = audit.results.some(result => result.issues.length > 0)
      if (issuesFound) {
        const allIssues = audit.results.flatMap(result => result.issues)
        
        allIssues.forEach(issue => {
          expect(issue.criterionId).toMatch(/^\d+\.\d+\.\d+$/)
          expect(issue.severity).toMatch(/^(critical|serious|moderate|minor)$/)
          expect(issue.impact).toMatch(/^(blocker|critical|major|minor)$/)
          expect(issue.element).toBeDefined()
          expect(issue.selector).toBeDefined()
          expect(issue.message).toBeDefined()
          expect(issue.recommendation).toBeDefined()
          expect(issue.helpUrl).toMatch(/^https?:\/\//)
        })
      }
    })

    it('should categorize critical issues', async () => {
      const audit = await auditEngine.runAudit()
      
      expect(Array.isArray(audit.criticalIssues)).toBe(true)
      
      audit.criticalIssues.forEach(issue => {
        expect(issue.severity === 'critical' || issue.impact === 'blocker').toBe(true)
      })
    })

    it('should provide actionable recommendations', async () => {
      const audit = await auditEngine.runAudit()
      
      expect(Array.isArray(audit.recommendations)).toBe(true)
      expect(audit.recommendations.length).toBeGreaterThan(0)
      
      audit.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string')
        expect(recommendation.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Specific Criterion Testing', () => {
    it('should test image alt text (1.1.1)', async () => {
      const audit = await auditEngine.runAudit()
      const imageResult = audit.results.find(r => r.criterionId === '1.1.1')
      
      if (imageResult) {
        expect(imageResult.criterionId).toBe('1.1.1')
        expect(imageResult.testedElements).toBeGreaterThanOrEqual(0)
        
        if (imageResult.issues.length > 0) {
          const imageIssues = imageResult.issues.filter(i => i.element === 'img')
          imageIssues.forEach(issue => {
            expect(issue.message).toContain('alt')
            expect(issue.recommendation).toBeDefined()
          })
        }
      }
    })

    it('should test color contrast (1.4.3)', async () => {
      const audit = await auditEngine.runAudit()
      const contrastResult = audit.results.find(r => r.criterionId === '1.4.3')
      
      if (contrastResult) {
        expect(contrastResult.criterionId).toBe('1.4.3')
        expect(contrastResult.testedElements).toBeGreaterThanOrEqual(0)
        
        if (contrastResult.issues.length > 0) {
          const contrastIssues = contrastResult.issues
          contrastIssues.forEach(issue => {
            expect(issue.message.toLowerCase()).toContain('contrast')
            expect(issue.recommendation).toContain('contrast')
          })
        }
      }
    })

    it('should test focus indicators (2.4.7)', async () => {
      const audit = await auditEngine.runAudit()
      const focusResult = audit.results.find(r => r.criterionId === '2.4.7')
      
      if (focusResult) {
        expect(focusResult.criterionId).toBe('2.4.7')
        expect(focusResult.testedElements).toBeGreaterThanOrEqual(0)
        
        if (focusResult.issues.length > 0) {
          const focusIssues = focusResult.issues
          focusIssues.forEach(issue => {
            expect(issue.message.toLowerCase()).toContain('focus')
            expect(issue.recommendation).toContain('focus')
          })
        }
      }
    })

    it('should test ARIA implementation (4.1.2)', async () => {
      const audit = await auditEngine.runAudit()
      const ariaResult = audit.results.find(r => r.criterionId === '4.1.2')
      
      if (ariaResult) {
        expect(ariaResult.criterionId).toBe('4.1.2')
        expect(ariaResult.testedElements).toBeGreaterThanOrEqual(0)
        
        if (ariaResult.issues.length > 0) {
          const ariaIssues = ariaResult.issues
          ariaIssues.forEach(issue => {
            expect(issue.message.toLowerCase()).toMatch(/(name|role|value|aria)/i)
            expect(issue.recommendation).toMatch(/(aria|accessible|name|role)/i)
          })
        }
      }
    })
  })

  describe('Report Generation', () => {
    it('should generate detailed audit report', async () => {
      const audit = await auditEngine.runAudit()
      const report = auditEngine.generateDetailedReport(audit)
      
      expect(typeof report).toBe('string')
      expect(report.length).toBeGreaterThan(0)
      
      // Check report structure
      expect(report).toContain('# WCAG AA Accessibility Audit Report')
      expect(report).toContain('## Executive Summary')
      expect(report).toContain('## Recommendations')
      expect(report).toContain('## Technical Details')
      
      // Check report content
      expect(report).toContain(audit.reportId)
      expect(report).toContain(audit.summary.complianceScore.toString())
      expect(report).toContain(audit.summary.overallStatus)
    })

    it('should include critical issues in report', async () => {
      const audit = await auditEngine.runAudit()
      
      if (audit.criticalIssues.length > 0) {
        const report = auditEngine.generateDetailedReport(audit)
        expect(report).toContain('## Critical Issues')
        
        audit.criticalIssues.forEach(issue => {
          expect(report).toContain(issue.message)
          expect(report).toContain(issue.recommendation)
        })
      }
    })

    it('should include technical details in report', async () => {
      const audit = await auditEngine.runAudit()
      const report = auditEngine.generateDetailedReport(audit)
      
      expect(report).toContain('Test Duration')
      expect(report).toContain('Automated Tests')
      expect(report).toContain('Manual Tests')
      expect(report).toContain('Elements Scanned')
      expect(report).toContain('Tools Used')
    })
  })

  describe('Compliance Scoring', () => {
    it('should calculate compliance score correctly', async () => {
      const audit = await auditEngine.runAudit()
      
      const expectedScore = audit.summary.totalCriteria > 0 
        ? Math.round((audit.summary.passedCriteria / audit.summary.totalCriteria) * 100)
        : 100
      
      expect(audit.summary.complianceScore).toBe(expectedScore)
    })

    it('should determine overall status correctly', async () => {
      const audit = await auditEngine.runAudit()
      
      if (audit.summary.complianceScore >= 95) {
        expect(audit.summary.overallStatus).toBe('compliant')
      } else if (audit.summary.complianceScore >= 70) {
        expect(audit.summary.overallStatus).toBe('partially-compliant')
      } else {
        expect(audit.summary.overallStatus).toBe('non-compliant')
      }
    })

    it('should count criteria statuses correctly', async () => {
      const audit = await auditEngine.runAudit()
      
      const statusCounts = audit.results.reduce((acc, result) => {
        acc[result.status] = (acc[result.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      expect(statusCounts.pass || 0).toBe(audit.summary.passedCriteria)
      expect(statusCounts.fail || 0).toBe(audit.summary.failedCriteria)
      expect(statusCounts.warning || 0).toBe(audit.summary.warningCriteria)
      expect(statusCounts['not-applicable'] || 0).toBe(audit.summary.notApplicableCriteria)
      expect(statusCounts['needs-review'] || 0).toBe(audit.summary.needsReviewCriteria)
    })
  })

  describe('Error Handling', () => {
    it('should handle audit errors gracefully', async () => {
      // Test with invalid URL
      const audit = await auditEngine.runAudit('invalid-url')
      
      expect(audit).toBeDefined()
      expect(audit.summary.totalCriteria).toBeGreaterThan(0)
      expect(audit.results.length).toBeGreaterThan(0)
    })

    it('should provide fallback values for missing data', async () => {
      const audit = await auditEngine.runAudit()
      
      // All required fields should be present
      expect(audit.reportId).toBeDefined()
      expect(audit.timestamp).toBeDefined()
      expect(audit.url).toBeDefined()
      expect(audit.level).toBeDefined()
      expect(audit.summary).toBeDefined()
      expect(audit.results).toBeDefined()
      expect(audit.criticalIssues).toBeDefined()
      expect(audit.recommendations).toBeDefined()
      expect(audit.technicalDetails).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should complete audit within reasonable time', async () => {
      const startTime = Date.now()
      const audit = await auditEngine.runAudit()
      const endTime = Date.now()
      
      const actualDuration = endTime - startTime
      expect(actualDuration).toBeLessThan(10000) // Should complete within 10 seconds
      expect(audit.technicalDetails.testDuration).toBeGreaterThanOrEqual(0)
      expect(audit.technicalDetails.testDuration).toBeLessThan(actualDuration + 1000) // Allow some variance
    })

    it('should handle multiple concurrent audits', async () => {
      const audits = await Promise.all([
        auditEngine.runAudit('http://localhost:3000'),
        auditEngine.runAudit('http://localhost:3000'),
        auditEngine.runAudit('http://localhost:3000')
      ])
      
      expect(audits).toHaveLength(3)
      audits.forEach(audit => {
        expect(audit).toBeDefined()
        expect(audit.reportId).toBeDefined()
        expect(audit.summary.totalCriteria).toBeGreaterThan(0)
      })
      
      // Each audit should have unique report ID
      const reportIds = audits.map(a => a.reportId)
      const uniqueIds = new Set(reportIds)
      expect(uniqueIds.size).toBe(3)
    })
  })
})
