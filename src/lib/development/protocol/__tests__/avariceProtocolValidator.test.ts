// src/lib/protocol/__tests__/avariceProtocolValidator.test.ts
/**
 * A.V.A.R.I.C.E. Protocol Validator Tests
 * Phase 7.1: A.V.A.R.I.C.E. Protocol Compliance Verification
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AvariceProtocolValidator } from '../avariceProtocolValidator'

describe('AvariceProtocolValidator', () => {
  let validator: AvariceProtocolValidator

  beforeEach(() => {
    validator = new AvariceProtocolValidator()
  })

  describe('Protocol Compliance Validation', () => {
    it('should validate complete A.V.A.R.I.C.E. Protocol compliance', async () => {
      const validation = await validator.validateProtocolCompliance()

      expect(validation).toBeDefined()
      expect(validation.protocolId).toBe('avarice-protocol-v1.0')
      expect(validation.protocolName).toBe('A.V.A.R.I.C.E. Protocol')
      expect(validation.version).toBe('1.0.0')
      expect(validation.validationTimestamp).toBeInstanceOf(Date)

      // Overall compliance validation
      expect(validation.overallCompliance).toBeDefined()
      expect(typeof validation.overallCompliance.isCompliant).toBe('boolean')
      expect(['full', 'substantial', 'partial', 'minimal']).toContain(validation.overallCompliance.complianceLevel)
      expect(validation.overallCompliance.overallScore).toBeGreaterThanOrEqual(0)
      expect(validation.overallCompliance.overallScore).toBeLessThanOrEqual(100)

      // Compliance score validation
      expect(validation.complianceScore).toBeGreaterThanOrEqual(0)
      expect(validation.complianceScore).toBeLessThanOrEqual(100)
      expect(validation.complianceScore).toBeGreaterThan(80) // Should be high quality

      // Recommendations validation
      expect(Array.isArray(validation.recommendations)).toBe(true)
      expect(validation.recommendations.length).toBeGreaterThan(0)
    })

    it('should validate all 9 protocol phases', async () => {
      const validation = await validator.validateProtocolCompliance()

      expect(validation.phaseValidations.length).toBe(9)

      const expectedPhases = [
        'Strategic Planning',
        'Contextual Grounding', 
        'Expert Council',
        'Implementation',
        'Multi-Layer Verification',
        'Architectural Review',
        'Protocol Validation',
        'Knowledge Memorization',
        'Autonomous Termination'
      ]

      validation.phaseValidations.forEach((phase, index) => {
        expect(phase.phaseNumber).toBe(index + 1)
        expect(phase.phaseName).toBe(expectedPhases[index])
        expect(['completed', 'in-progress', 'not-started', 'failed']).toContain(phase.status)
        expect(phase.completionPercentage).toBeGreaterThanOrEqual(0)
        expect(phase.completionPercentage).toBeLessThanOrEqual(100)
        expect(phase.qualityScore).toBeGreaterThanOrEqual(0)
        expect(phase.qualityScore).toBeLessThanOrEqual(100)
        expect(phase.evidenceCount).toBeGreaterThan(0)
        expect(Array.isArray(phase.requirements)).toBe(true)
        expect(Array.isArray(phase.violations)).toBe(true)
      })

      // Validate completed phases (1-6)
      const completedPhases = validation.phaseValidations.slice(0, 6)
      completedPhases.forEach(phase => {
        expect(phase.status).toBe('completed')
        expect(phase.completionPercentage).toBe(100)
        expect(phase.qualityScore).toBeGreaterThan(80)
      })

      // Validate current phase (7)
      const currentPhase = validation.phaseValidations[6]
      expect(currentPhase.status).toBe('in-progress')
      expect(currentPhase.completionPercentage).toBeGreaterThan(0)

      // Validate future phases (8-9)
      const futurePhases = validation.phaseValidations.slice(7)
      futurePhases.forEach(phase => {
        expect(phase.status).toBe('not-started')
        expect(phase.completionPercentage).toBe(0)
      })
    })

    it('should validate phase requirements', async () => {
      const validation = await validator.validateProtocolCompliance()

      validation.phaseValidations.forEach(phase => {
        expect(phase.requirements.length).toBeGreaterThan(0)
        
        phase.requirements.forEach(requirement => {
          expect(requirement.requirementId).toBeDefined()
          expect(requirement.description).toBeDefined()
          expect(['met', 'partially-met', 'not-met']).toContain(requirement.status)
          expect(Array.isArray(requirement.evidence)).toBe(true)
          expect(requirement.score).toBeGreaterThanOrEqual(0)
          expect(requirement.score).toBeLessThanOrEqual(100)
        })
      })

      // Completed phases should have all requirements met
      const completedPhases = validation.phaseValidations.slice(0, 6)
      completedPhases.forEach(phase => {
        phase.requirements.forEach(requirement => {
          expect(requirement.status).toBe('met')
          expect(requirement.score).toBeGreaterThan(80)
        })
      })
    })

    it('should validate protocol violations', async () => {
      const validation = await validator.validateProtocolCompliance()

      validation.phaseValidations.forEach(phase => {
        phase.violations.forEach(violation => {
          expect(violation.violationId).toBeDefined()
          expect(['critical', 'major', 'minor', 'info']).toContain(violation.severity)
          expect(violation.phase).toBeDefined()
          expect(violation.description).toBeDefined()
          expect(violation.impact).toBeDefined()
          expect(violation.remediation).toBeDefined()
        })
      })

      // Should have minimal critical violations
      const totalCriticalViolations = validation.phaseValidations.reduce((sum, phase) => 
        sum + phase.violations.filter(v => v.severity === 'critical').length, 0
      )
      expect(totalCriticalViolations).toBeLessThanOrEqual(1) // Should be minimal
    })
  })

  describe('Quality Gates Validation', () => {
    it('should validate all quality gates', async () => {
      const validation = await validator.validateProtocolCompliance()

      expect(validation.qualityGates.length).toBeGreaterThan(0)

      const expectedGates = [
        'Static Analysis & Linting',
        'Dynamic Testing & Execution',
        'Formal Verification & Logic',
        'Security Testing & Validation',
        'Performance Validation & Optimization',
        'Architectural Review'
      ]

      validation.qualityGates.forEach((gate, index) => {
        expect(gate.gateId).toBeDefined()
        expect(gate.gateName).toBe(expectedGates[index])
        expect(['passed', 'failed', 'warning']).toContain(gate.status)
        expect(gate.score).toBeGreaterThanOrEqual(0)
        expect(gate.score).toBeLessThanOrEqual(100)
        expect(gate.threshold).toBeGreaterThan(0)
        expect(Array.isArray(gate.metrics)).toBe(true)
        expect(gate.metrics.length).toBeGreaterThan(0)
      })

      // All gates should pass for high-quality implementation
      const passedGates = validation.qualityGates.filter(gate => gate.status === 'passed')
      expect(passedGates.length).toBe(validation.qualityGates.length)
    })

    it('should validate quality gate metrics', async () => {
      const validation = await validator.validateProtocolCompliance()

      validation.qualityGates.forEach(gate => {
        gate.metrics.forEach(metric => {
          expect(metric.metricName).toBeDefined()
          expect(metric.value).toBeGreaterThanOrEqual(0)
          expect(metric.threshold).toBeGreaterThan(0)
          expect(['pass', 'fail', 'warning']).toContain(metric.status)

          // Metrics should generally pass thresholds
          if (metric.status === 'pass') {
            expect(metric.value).toBeGreaterThanOrEqual(metric.threshold)
          }
        })
      })
    })

    it('should validate specific quality gates', async () => {
      const validation = await validator.validateProtocolCompliance()

      // Static Analysis gate
      const staticAnalysisGate = validation.qualityGates.find(g => g.gateId === 'static-analysis')
      expect(staticAnalysisGate).toBeDefined()
      expect(staticAnalysisGate?.status).toBe('passed')
      expect(staticAnalysisGate?.score).toBeGreaterThan(95)

      // Performance gate
      const performanceGate = validation.qualityGates.find(g => g.gateId === 'performance-validation')
      expect(performanceGate).toBeDefined()
      expect(performanceGate?.status).toBe('passed')
      expect(performanceGate?.score).toBeGreaterThan(90)

      // Security gate
      const securityGate = validation.qualityGates.find(g => g.gateId === 'security-testing')
      expect(securityGate).toBeDefined()
      expect(securityGate?.status).toBe('passed')
      expect(securityGate?.score).toBeGreaterThan(80)
    })
  })

  describe('Evidence Validation', () => {
    it('should validate evidence collection', async () => {
      const validation = await validator.validateProtocolCompliance()

      const evidence = validation.evidenceValidation
      expect(evidence.totalEvidence).toBeGreaterThan(100) // Comprehensive evidence
      expect(evidence.evidenceByPhase).toBeDefined()
      expect(['excellent', 'good', 'fair', 'poor']).toContain(evidence.evidenceQuality)
      expect(typeof evidence.storageCompliance).toBe('boolean')
      expect(evidence.documentationScore).toBeGreaterThanOrEqual(0)
      expect(evidence.documentationScore).toBeLessThanOrEqual(100)

      // Evidence quality should be high
      expect(evidence.evidenceQuality).toMatch(/^(excellent|good)$/)
      expect(evidence.storageCompliance).toBe(true)
      expect(evidence.documentationScore).toBeGreaterThan(85)
    })

    it('should validate evidence by phase', async () => {
      const validation = await validator.validateProtocolCompliance()

      const evidenceByPhase = validation.evidenceValidation.evidenceByPhase
      
      // Should have evidence for completed phases
      expect(evidenceByPhase['Phase 1']).toBeGreaterThan(0)
      expect(evidenceByPhase['Phase 2']).toBeGreaterThan(0)
      expect(evidenceByPhase['Phase 3']).toBeGreaterThan(0)
      expect(evidenceByPhase['Phase 4']).toBeGreaterThan(0)
      expect(evidenceByPhase['Phase 5']).toBeGreaterThan(0)
      expect(evidenceByPhase['Phase 6']).toBeGreaterThan(0)

      // Evidence should increase with phase complexity
      const phaseEvidence = Object.values(evidenceByPhase)
      expect(phaseEvidence.every(count => count > 10)).toBe(true) // Substantial evidence per phase
    })
  })

  describe('Autonomous Execution Validation', () => {
    it('should validate autonomous execution capabilities', async () => {
      const validation = await validator.validateProtocolCompliance()

      const autonomy = validation.autonomousExecution
      expect(autonomy.autonomyLevel).toBeGreaterThanOrEqual(0)
      expect(autonomy.autonomyLevel).toBeLessThanOrEqual(100)
      expect(autonomy.humanInterventions).toBeGreaterThanOrEqual(0)
      expect(autonomy.decisionQuality).toBeGreaterThanOrEqual(0)
      expect(autonomy.decisionQuality).toBeLessThanOrEqual(100)
      expect(autonomy.executionEfficiency).toBeGreaterThanOrEqual(0)
      expect(autonomy.executionEfficiency).toBeLessThanOrEqual(100)
      expect(autonomy.errorRecovery).toBeGreaterThanOrEqual(0)
      expect(autonomy.errorRecovery).toBeLessThanOrEqual(100)
      expect(['full', 'high', 'moderate', 'low']).toContain(autonomy.overallAutonomy)

      // Should demonstrate high autonomy
      expect(autonomy.autonomyLevel).toBeGreaterThan(90)
      expect(autonomy.humanInterventions).toBeLessThan(5)
      expect(autonomy.decisionQuality).toBeGreaterThan(85)
      expect(autonomy.executionEfficiency).toBeGreaterThan(85)
      expect(autonomy.overallAutonomy).toMatch(/^(full|high)$/)
    })
  })

  describe('Compliance Scoring', () => {
    it('should calculate accurate compliance scores', async () => {
      const validation = await validator.validateProtocolCompliance()

      expect(validation.complianceScore).toBeGreaterThanOrEqual(0)
      expect(validation.complianceScore).toBeLessThanOrEqual(100)

      // High-quality implementation should have high compliance score
      expect(validation.complianceScore).toBeGreaterThan(85)

      // Compliance score should reflect overall quality
      if (validation.overallCompliance.isCompliant) {
        expect(validation.complianceScore).toBeGreaterThan(80)
      }

      if (validation.overallCompliance.complianceLevel === 'full') {
        expect(validation.complianceScore).toBeGreaterThan(90)
      }
    })

    it('should generate appropriate recommendations', async () => {
      const validation = await validator.validateProtocolCompliance()

      expect(Array.isArray(validation.recommendations)).toBe(true)
      expect(validation.recommendations.length).toBeGreaterThan(0)

      validation.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string')
        expect(recommendation.length).toBeGreaterThan(0)
      })

      // High compliance should generate positive recommendations
      if (validation.complianceScore >= 95) {
        expect(validation.recommendations.some(r => 
          r.includes('Exceptional') || r.includes('Ready for autonomous termination')
        )).toBe(true)
      }

      // Full autonomy should be recognized
      if (validation.autonomousExecution.overallAutonomy === 'full') {
        expect(validation.recommendations.some(r => 
          r.includes('Full autonomous execution achieved')
        )).toBe(true)
      }
    })
  })

  describe('Report Generation', () => {
    it('should generate detailed protocol validation report', async () => {
      const validation = await validator.validateProtocolCompliance()
      const report = validator.generateDetailedReport(validation)

      expect(typeof report).toBe('string')
      expect(report.length).toBeGreaterThan(0)

      // Check report structure
      expect(report).toContain('# A.V.A.R.I.C.E. Protocol Validation Report')
      expect(report).toContain('## Executive Summary')
      expect(report).toContain('## Phase Validation Results')
      expect(report).toContain('## Quality Gates Status')
      expect(report).toContain('## Evidence Validation')
      expect(report).toContain('## Autonomous Execution Assessment')

      // Check report content
      expect(report).toContain(validation.protocolName)
      expect(report).toContain(validation.version)
      expect(report).toContain(validation.complianceScore.toString())

      // Check all phases are included
      validation.phaseValidations.forEach(phase => {
        expect(report).toContain(phase.phaseName)
      })

      // Check all quality gates are included
      validation.qualityGates.forEach(gate => {
        expect(report).toContain(gate.gateName)
      })

      // Check recommendations if present
      if (validation.recommendations.length > 0) {
        expect(report).toContain('## Recommendations')
        validation.recommendations.forEach(recommendation => {
          expect(report).toContain(recommendation)
        })
      }
    })

    it('should include compliance status in report', async () => {
      const validation = await validator.validateProtocolCompliance()
      const report = validator.generateDetailedReport(validation)

      if (validation.overallCompliance.isCompliant) {
        expect(report).toContain('COMPLIANT')
      } else {
        expect(report).toContain('NON-COMPLIANT')
      }

      expect(report).toContain(validation.overallCompliance.complianceLevel)
      expect(report).toContain(`${validation.overallCompliance.criticalViolations}`)
      expect(report).toContain(`${validation.overallCompliance.majorViolations}`)
      expect(report).toContain(`${validation.overallCompliance.minorViolations}`)
    })
  })

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const startTime = Date.now()
      const validation = await validator.validateProtocolCompliance()
      const endTime = Date.now()

      const duration = endTime - startTime
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
      expect(validation.phaseValidations.length).toBe(9)
      expect(validation.qualityGates.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      // Should not throw for normal validation
      await expect(validator.validateProtocolCompliance()).resolves.toBeDefined()
    })

    it('should provide meaningful validation results', async () => {
      const validation = await validator.validateProtocolCompliance()

      // All required fields should be present
      expect(validation.protocolId).toBeDefined()
      expect(validation.protocolName).toBeDefined()
      expect(validation.version).toBeDefined()
      expect(validation.validationTimestamp).toBeDefined()
      expect(validation.overallCompliance).toBeDefined()
      expect(validation.phaseValidations).toBeDefined()
      expect(validation.qualityGates).toBeDefined()
      expect(validation.evidenceValidation).toBeDefined()
      expect(validation.autonomousExecution).toBeDefined()
      expect(validation.recommendations).toBeDefined()
      expect(validation.complianceScore).toBeDefined()
    })
  })

  describe('Protocol Standards Compliance', () => {
    it('should meet A.V.A.R.I.C.E. Protocol standards', async () => {
      const validation = await validator.validateProtocolCompliance()

      // Should demonstrate full protocol compliance
      expect(validation.overallCompliance.isCompliant).toBe(true)
      expect(validation.overallCompliance.complianceLevel).toMatch(/^(full|substantial)$/)
      expect(validation.overallCompliance.criticalViolations).toBeLessThanOrEqual(1)

      // Should have high-quality evidence
      expect(validation.evidenceValidation.evidenceQuality).toMatch(/^(excellent|good)$/)
      expect(validation.evidenceValidation.storageCompliance).toBe(true)

      // Should demonstrate autonomous execution
      expect(validation.autonomousExecution.overallAutonomy).toMatch(/^(full|high)$/)
      expect(validation.autonomousExecution.autonomyLevel).toBeGreaterThan(85)

      // Should pass all quality gates
      const passedGates = validation.qualityGates.filter(gate => gate.status === 'passed')
      expect(passedGates.length).toBe(validation.qualityGates.length)
    })

    it('should validate quest-specific requirements', async () => {
      const validation = await validator.validateProtocolCompliance()

      // Quest 4.3 specific validations
      expect(validation.evidenceValidation.totalEvidence).toBeGreaterThan(100)
      expect(validation.complianceScore).toBeGreaterThan(85)
      
      // Should have comprehensive phase completion
      const completedPhases = validation.phaseValidations.filter(p => p.status === 'completed')
      expect(completedPhases.length).toBeGreaterThanOrEqual(6)

      // Should demonstrate filtering system implementation
      const implementationPhase = validation.phaseValidations.find(p => p.phaseName === 'Implementation')
      expect(implementationPhase?.status).toBe('completed')
      expect(implementationPhase?.qualityScore).toBeGreaterThan(85)
    })
  })
})
