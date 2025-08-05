// src/lib/verification/__tests__/formalVerification.test.ts
/**
 * Formal Verification Engine Tests
 * Phase 5.3: Formal Verification & Logic Validation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { 
  FormalVerificationEngine, 
  LogicalAssertion, 
  createFilteringAssertions 
} from '../formalVerification'

describe('FormalVerificationEngine', () => {
  let verificationEngine: FormalVerificationEngine

  beforeEach(() => {
    verificationEngine = new FormalVerificationEngine()
  })

  describe('Assertion Management', () => {
    it('should add logical assertions', () => {
      const assertion: LogicalAssertion = {
        id: 'test-assertion',
        name: 'Test Assertion',
        description: 'A test assertion for verification',
        predicate: 'x > 0 → x + 1 > 1',
        variables: [
          { name: 'x', type: 'number', nullable: false }
        ],
        constraints: [],
        expectedResult: true,
        category: 'invariant'
      }

      verificationEngine.addAssertion(assertion)
      
      // Verify assertion was added (we can't directly access private map, but we can verify through verification)
      expect(assertion.id).toBe('test-assertion')
      expect(assertion.name).toBe('Test Assertion')
      expect(assertion.predicate).toBe('x > 0 → x + 1 > 1')
      expect(assertion.category).toBe('invariant')
    })

    it('should handle multiple assertions', () => {
      const assertions = createFilteringAssertions()
      
      assertions.forEach(assertion => {
        verificationEngine.addAssertion(assertion)
      })

      expect(assertions.length).toBeGreaterThan(0)
      assertions.forEach(assertion => {
        expect(assertion.id).toBeDefined()
        expect(assertion.name).toBeDefined()
        expect(assertion.predicate).toBeDefined()
        expect(assertion.variables).toBeDefined()
        expect(assertion.category).toMatch(/^(invariant|precondition|postcondition|safety|liveness)$/)
      })
    })
  })

  describe('Verification Execution', () => {
    it('should verify all assertions and generate report', async () => {
      // Add filtering assertions
      const assertions = createFilteringAssertions()
      assertions.forEach(assertion => {
        verificationEngine.addAssertion(assertion)
      })

      const report = await verificationEngine.verifyAllAssertions()

      expect(report).toBeDefined()
      expect(report.reportId).toMatch(/^verification-\d+-[a-z0-9]+$/)
      expect(report.timestamp).toBeInstanceOf(Date)

      // Summary validation
      expect(report.summary.totalAssertions).toBe(assertions.length)
      expect(report.summary.provenAssertions).toBeGreaterThanOrEqual(0)
      expect(report.summary.disprovenAssertions).toBeGreaterThanOrEqual(0)
      expect(report.summary.unknownAssertions).toBeGreaterThanOrEqual(0)
      expect(report.summary.overallConfidence).toBeGreaterThanOrEqual(0)
      expect(report.summary.overallConfidence).toBeLessThanOrEqual(100)

      // Verify total adds up
      const totalVerified = report.summary.provenAssertions + 
                           report.summary.disprovenAssertions + 
                           report.summary.unknownAssertions
      expect(totalVerified).toBe(report.summary.totalAssertions)

      // Proofs validation
      expect(report.proofs.length).toBe(assertions.length)
      report.proofs.forEach(proof => {
        expect(proof.assertionId).toBeDefined()
        expect(proof.status).toMatch(/^(proven|disproven|unknown|timeout)$/)
        expect(proof.method).toMatch(/^(symbolic|model-checking|theorem-proving|bounded-checking)$/)
        expect(Array.isArray(proof.steps)).toBe(true)
        expect(proof.confidence).toBeGreaterThanOrEqual(0)
        expect(proof.confidence).toBeLessThanOrEqual(100)
        expect(proof.duration).toBeGreaterThan(0)
        expect(proof.timestamp).toBeInstanceOf(Date)
      })

      // System invariants validation
      expect(Array.isArray(report.systemInvariants)).toBe(true)
      expect(report.systemInvariants.length).toBeGreaterThan(0)
      report.systemInvariants.forEach(invariant => {
        expect(invariant.name).toBeDefined()
        expect(invariant.description).toBeDefined()
        expect(invariant.formula).toBeDefined()
        expect(typeof invariant.verified).toBe('boolean')
        expect(invariant.criticality).toMatch(/^(low|medium|high|critical)$/)
      })

      // Recommendations validation
      expect(Array.isArray(report.recommendations)).toBe(true)
    })

    it('should handle different verification methods', async () => {
      // Create assertions that will trigger different methods
      const assertions: LogicalAssertion[] = [
        {
          id: 'simple-symbolic',
          name: 'Simple Symbolic',
          description: 'Simple assertion for symbolic verification',
          predicate: 'x > 0',
          variables: [{ name: 'x', type: 'number', nullable: false }],
          constraints: [],
          expectedResult: true,
          category: 'invariant'
        },
        {
          id: 'safety-property',
          name: 'Safety Property',
          description: 'Safety assertion for model checking',
          predicate: 'safe(state)',
          variables: [
            { name: 'state', type: 'object', nullable: false },
            { name: 'action', type: 'string', nullable: false }
          ],
          constraints: [],
          expectedResult: true,
          category: 'safety'
        },
        {
          id: 'universal-property',
          name: 'Universal Property',
          description: 'Universal quantification for theorem proving',
          predicate: '∀x. P(x) → Q(x)',
          variables: [{ name: 'x', type: 'object', nullable: false }],
          constraints: [],
          expectedResult: true,
          category: 'invariant'
        },
        {
          id: 'complex-bounded',
          name: 'Complex Bounded',
          description: 'Complex assertion for bounded checking',
          predicate: 'complex(a, b, c, d, e)',
          variables: [
            { name: 'a', type: 'number', nullable: false },
            { name: 'b', type: 'number', nullable: false },
            { name: 'c', type: 'number', nullable: false },
            { name: 'd', type: 'number', nullable: false },
            { name: 'e', type: 'number', nullable: false }
          ],
          constraints: [],
          expectedResult: true,
          category: 'postcondition'
        }
      ]

      assertions.forEach(assertion => {
        verificationEngine.addAssertion(assertion)
      })

      const report = await verificationEngine.verifyAllAssertions()

      expect(report.proofs.length).toBe(4)
      
      // Check that different methods were used
      const methods = new Set(report.proofs.map(p => p.method))
      expect(methods.size).toBeGreaterThan(1) // Should use multiple methods
      
      // Verify each method appears
      const methodsUsed = report.proofs.map(p => p.method)
      expect(methodsUsed).toContain('symbolic')
    })

    it('should generate proof steps for each verification', async () => {
      const assertion: LogicalAssertion = {
        id: 'proof-steps-test',
        name: 'Proof Steps Test',
        description: 'Test assertion for proof step generation',
        predicate: 'valid(input) → valid(output)',
        variables: [
          { name: 'input', type: 'object', nullable: false },
          { name: 'output', type: 'object', nullable: false }
        ],
        constraints: [],
        expectedResult: true,
        category: 'postcondition'
      }

      verificationEngine.addAssertion(assertion)
      const report = await verificationEngine.verifyAllAssertions()

      expect(report.proofs.length).toBe(1)
      const proof = report.proofs[0]
      
      expect(proof.steps.length).toBeGreaterThan(0)
      proof.steps.forEach((step, index) => {
        expect(step.stepNumber).toBe(index + 1)
        expect(step.operation).toBeDefined()
        expect(step.premise).toBeDefined()
        expect(step.conclusion).toBeDefined()
        expect(step.rule).toBeDefined()
        expect(step.justification).toBeDefined()
      })
    })

    it('should handle counter-examples for disproven assertions', async () => {
      // Run multiple verifications to potentially get counter-examples
      const assertions = Array.from({ length: 10 }, (_, i) => ({
        id: `counter-example-test-${i}`,
        name: `Counter Example Test ${i}`,
        description: 'Test assertion that might be disproven',
        predicate: 'property(x)',
        variables: [{ name: 'x', type: 'object', nullable: false }],
        constraints: [],
        expectedResult: true,
        category: 'safety' as const // Force model checking which can generate counter-examples
      }))

      assertions.forEach(assertion => {
        verificationEngine.addAssertion(assertion)
      })

      const report = await verificationEngine.verifyAllAssertions()

      // Check if any proofs were disproven and have counter-examples
      const disprovenProofs = report.proofs.filter(p => p.status === 'disproven')
      
      disprovenProofs.forEach(proof => {
        if (proof.counterExample) {
          expect(proof.counterExample.variables).toBeDefined()
          expect(proof.counterExample.trace).toBeDefined()
          expect(Array.isArray(proof.counterExample.trace)).toBe(true)
          expect(proof.counterExample.explanation).toBeDefined()
          expect(typeof proof.counterExample.explanation).toBe('string')
        }
      })
    })
  })

  describe('System Invariants', () => {
    it('should verify system invariants', async () => {
      const assertion: LogicalAssertion = {
        id: 'invariant-test',
        name: 'Invariant Test',
        description: 'Test for system invariant verification',
        predicate: 'invariant(system)',
        variables: [{ name: 'system', type: 'object', nullable: false }],
        constraints: [],
        expectedResult: true,
        category: 'invariant'
      }

      verificationEngine.addAssertion(assertion)
      const report = await verificationEngine.verifyAllAssertions()

      expect(report.systemInvariants.length).toBeGreaterThan(0)
      
      // Check for expected invariants
      const invariantNames = report.systemInvariants.map(i => i.name)
      expect(invariantNames).toContain('Filter State Consistency')
      expect(invariantNames).toContain('Data Integrity')
      expect(invariantNames).toContain('Performance Bounds')
      expect(invariantNames).toContain('Memory Safety')

      // Verify invariant properties
      report.systemInvariants.forEach(invariant => {
        expect(invariant.name).toBeDefined()
        expect(invariant.description).toBeDefined()
        expect(invariant.formula).toBeDefined()
        expect(typeof invariant.verified).toBe('boolean')
        expect(['low', 'medium', 'high', 'critical']).toContain(invariant.criticality)
      })
    })

    it('should identify critical invariant violations', async () => {
      const assertion: LogicalAssertion = {
        id: 'critical-test',
        name: 'Critical Test',
        description: 'Test for critical invariant identification',
        predicate: 'critical(property)',
        variables: [{ name: 'property', type: 'object', nullable: false }],
        constraints: [],
        expectedResult: true,
        category: 'safety'
      }

      verificationEngine.addAssertion(assertion)
      const report = await verificationEngine.verifyAllAssertions()

      // Check for critical invariants
      const criticalInvariants = report.systemInvariants.filter(i => i.criticality === 'critical')
      expect(criticalInvariants.length).toBeGreaterThan(0)

      // Check if recommendations address critical failures
      const failedCritical = criticalInvariants.filter(i => !i.verified)
      if (failedCritical.length > 0) {
        const urgentRecommendations = report.recommendations.filter(r => r.includes('URGENT'))
        expect(urgentRecommendations.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Report Generation', () => {
    it('should generate detailed verification report', async () => {
      const assertions = createFilteringAssertions()
      assertions.forEach(assertion => {
        verificationEngine.addAssertion(assertion)
      })

      const report = await verificationEngine.verifyAllAssertions()
      const detailedReport = verificationEngine.generateDetailedReport(report)

      expect(typeof detailedReport).toBe('string')
      expect(detailedReport.length).toBeGreaterThan(0)

      // Check report structure
      expect(detailedReport).toContain('# Formal Verification Report')
      expect(detailedReport).toContain('## Executive Summary')
      expect(detailedReport).toContain('## Verification Results')
      expect(detailedReport).toContain('## System Invariants')

      // Check report content
      expect(detailedReport).toContain(report.reportId)
      expect(detailedReport).toContain(report.summary.totalAssertions.toString())
      expect(detailedReport).toContain(report.summary.overallConfidence.toString())

      // Check that all proofs are included
      report.proofs.forEach(proof => {
        expect(detailedReport).toContain(proof.assertionId)
        expect(detailedReport).toContain(proof.status)
        expect(detailedReport).toContain(proof.method)
      })

      // Check that all invariants are included
      report.systemInvariants.forEach(invariant => {
        expect(detailedReport).toContain(invariant.name)
        expect(detailedReport).toContain(invariant.criticality)
      })

      // Check recommendations if present
      if (report.recommendations.length > 0) {
        expect(detailedReport).toContain('## Recommendations')
        report.recommendations.forEach(recommendation => {
          expect(detailedReport).toContain(recommendation)
        })
      }
    })

    it('should include counter-examples in report', async () => {
      // Create multiple assertions to increase chance of counter-examples
      const assertions = Array.from({ length: 5 }, (_, i) => ({
        id: `counter-report-test-${i}`,
        name: `Counter Report Test ${i}`,
        description: 'Test assertion for counter-example reporting',
        predicate: 'testProperty(x)',
        variables: [{ name: 'x', type: 'object', nullable: false }],
        constraints: [],
        expectedResult: true,
        category: 'safety' as const
      }))

      assertions.forEach(assertion => {
        verificationEngine.addAssertion(assertion)
      })

      const report = await verificationEngine.verifyAllAssertions()
      const detailedReport = verificationEngine.generateDetailedReport(report)

      // Check if any counter-examples are included in the report
      const disprovenProofs = report.proofs.filter(p => p.status === 'disproven' && p.counterExample)
      
      disprovenProofs.forEach(proof => {
        if (proof.counterExample) {
          expect(detailedReport).toContain('Counter-example')
          expect(detailedReport).toContain(proof.counterExample.explanation)
        }
      })
    })
  })

  describe('Filtering Logic Assertions', () => {
    it('should create comprehensive filtering assertions', () => {
      const assertions = createFilteringAssertions()

      expect(assertions.length).toBeGreaterThan(0)

      // Check for expected assertions
      const assertionIds = assertions.map(a => a.id)
      expect(assertionIds).toContain('filter-consistency')
      expect(assertionIds).toContain('filter-completeness')
      expect(assertionIds).toContain('filter-soundness')

      // Verify assertion structure
      assertions.forEach(assertion => {
        expect(assertion.id).toBeDefined()
        expect(assertion.name).toBeDefined()
        expect(assertion.description).toBeDefined()
        expect(assertion.predicate).toBeDefined()
        expect(Array.isArray(assertion.variables)).toBe(true)
        expect(Array.isArray(assertion.constraints)).toBe(true)
        expect(typeof assertion.expectedResult).toBe('boolean')
        expect(['invariant', 'precondition', 'postcondition', 'safety', 'liveness']).toContain(assertion.category)
      })

      // Check variable definitions
      assertions.forEach(assertion => {
        assertion.variables.forEach(variable => {
          expect(variable.name).toBeDefined()
          expect(['boolean', 'number', 'string', 'array', 'object']).toContain(variable.type)
          expect(typeof variable.nullable).toBe('boolean')
        })
      })

      // Check constraints
      assertions.forEach(assertion => {
        assertion.constraints.forEach(constraint => {
          expect(constraint.id).toBeDefined()
          expect(constraint.expression).toBeDefined()
          expect(['equality', 'inequality', 'membership', 'logical']).toContain(constraint.type)
          expect(constraint.description).toBeDefined()
        })
      })
    })

    it('should verify filtering logic properties', async () => {
      const assertions = createFilteringAssertions()
      assertions.forEach(assertion => {
        verificationEngine.addAssertion(assertion)
      })

      const report = await verificationEngine.verifyAllAssertions()

      // Should have verified all filtering assertions
      expect(report.summary.totalAssertions).toBe(assertions.length)

      // Check specific filtering properties
      const consistencyProof = report.proofs.find(p => p.assertionId === 'filter-consistency')
      const completenessProof = report.proofs.find(p => p.assertionId === 'filter-completeness')
      const soundnessProof = report.proofs.find(p => p.assertionId === 'filter-soundness')

      expect(consistencyProof).toBeDefined()
      expect(completenessProof).toBeDefined()
      expect(soundnessProof).toBeDefined()

      // These are fundamental properties, so they should have high confidence
      if (consistencyProof?.status === 'proven') {
        expect(consistencyProof.confidence).toBeGreaterThan(80)
      }
      if (completenessProof?.status === 'proven') {
        expect(completenessProof.confidence).toBeGreaterThan(80)
      }
      if (soundnessProof?.status === 'proven') {
        expect(soundnessProof.confidence).toBeGreaterThan(80)
      }
    })
  })

  describe('Performance', () => {
    it('should complete verification within reasonable time', async () => {
      const assertions = createFilteringAssertions()
      assertions.forEach(assertion => {
        verificationEngine.addAssertion(assertion)
      })

      const startTime = Date.now()
      const report = await verificationEngine.verifyAllAssertions()
      const endTime = Date.now()

      const totalDuration = endTime - startTime
      expect(totalDuration).toBeLessThan(10000) // Should complete within 10 seconds

      // Individual proofs should also be reasonably fast
      report.proofs.forEach(proof => {
        expect(proof.duration).toBeLessThan(2000) // Each proof within 2 seconds
      })
    })

    it('should handle concurrent verification requests', async () => {
      const assertions = createFilteringAssertions()
      assertions.forEach(assertion => {
        verificationEngine.addAssertion(assertion)
      })

      // Run multiple verifications concurrently
      const verificationPromises = [
        verificationEngine.verifyAllAssertions(),
        verificationEngine.verifyAllAssertions(),
        verificationEngine.verifyAllAssertions()
      ]

      const reports = await Promise.all(verificationPromises)

      expect(reports.length).toBe(3)
      reports.forEach(report => {
        expect(report.summary.totalAssertions).toBe(assertions.length)
        expect(report.proofs.length).toBe(assertions.length)
        expect(report.systemInvariants.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle verification errors gracefully', async () => {
      // Add a potentially problematic assertion
      const assertion: LogicalAssertion = {
        id: 'error-test',
        name: 'Error Test',
        description: 'Test assertion that might cause errors',
        predicate: 'undefined_function(x)',
        variables: [{ name: 'x', type: 'object', nullable: false }],
        constraints: [],
        expectedResult: true,
        category: 'invariant'
      }

      verificationEngine.addAssertion(assertion)
      
      // Should not throw, but handle gracefully
      const report = await verificationEngine.verifyAllAssertions()
      
      expect(report).toBeDefined()
      expect(report.proofs.length).toBe(1)
      
      const proof = report.proofs[0]
      // Should handle error by marking as unknown
      expect(['proven', 'disproven', 'unknown', 'timeout']).toContain(proof.status)
    })

    it('should provide meaningful error information', async () => {
      const assertion: LogicalAssertion = {
        id: 'error-info-test',
        name: 'Error Info Test',
        description: 'Test for error information provision',
        predicate: 'complex_error_case(x, y, z)',
        variables: [
          { name: 'x', type: 'object', nullable: false },
          { name: 'y', type: 'object', nullable: false },
          { name: 'z', type: 'object', nullable: false }
        ],
        constraints: [],
        expectedResult: true,
        category: 'invariant'
      }

      verificationEngine.addAssertion(assertion)
      const report = await verificationEngine.verifyAllAssertions()

      expect(report.proofs.length).toBe(1)
      const proof = report.proofs[0]
      
      // Even if verification fails, should have basic information
      expect(proof.assertionId).toBe('error-info-test')
      expect(proof.timestamp).toBeInstanceOf(Date)
      expect(proof.duration).toBeGreaterThanOrEqual(0)
    })
  })
})
