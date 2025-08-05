// src/lib/deployment/__tests__/rollbackManager.test.ts
/**
 * Rollback Manager Tests
 * Quest 4.3 - Expert Council Validated Implementation
 * 
 * Stage 6.1: Integration Rollback Procedures
 * Expert Consensus: 100% (6/6 experts)
 * Priority: CRITICAL
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RollbackManager } from '../rollbackManager'

describe('RollbackManager', () => {
  let rollbackManager: RollbackManager

  beforeEach(() => {
    rollbackManager = new RollbackManager()
  })

  describe('Snapshot Creation', () => {
    it('should create deployment snapshot successfully', async () => {
      const snapshot = await rollbackManager.createSnapshot(
        '1.0.0',
        'main',
        'abc123',
        'production'
      )

      expect(snapshot).toBeDefined()
      expect(snapshot.id).toMatch(/^snapshot-\d+-[a-z0-9]+$/)
      expect(snapshot.version).toBe('1.0.0')
      expect(snapshot.branch).toBe('main')
      expect(snapshot.commit).toBe('abc123')
      expect(snapshot.environment).toBe('production')
      expect(snapshot.timestamp).toBeInstanceOf(Date)

      // Components validation
      expect(snapshot.components).toBeDefined()
      expect(snapshot.components.filtering).toBeDefined()
      expect(snapshot.components.ui).toBeDefined()
      expect(snapshot.components.api).toBeDefined()
      expect(snapshot.components.database).toBeDefined()

      // Health checks validation
      expect(Array.isArray(snapshot.healthChecks)).toBe(true)
      expect(snapshot.healthChecks.length).toBeGreaterThan(0)

      // Performance baseline validation
      expect(snapshot.performanceBaseline).toBeDefined()
      expect(snapshot.performanceBaseline.loadTime).toBeGreaterThan(0)
      expect(snapshot.performanceBaseline.renderTime).toBeGreaterThan(0)

      // Rollback data validation
      expect(snapshot.rollbackData).toBeDefined()
      expect(snapshot.rollbackData.previousVersion).toBeDefined()
      expect(snapshot.rollbackData.previousCommit).toBeDefined()
    })

    it('should capture component snapshots correctly', async () => {
      const snapshot = await rollbackManager.createSnapshot(
        '1.0.0',
        'main',
        'abc123',
        'development'
      )

      // Filtering component validation
      const filteringComponent = snapshot.components.filtering
      expect(filteringComponent.name).toBe('filtering-system')
      expect(filteringComponent.version).toBe('1.0.0')
      expect(Array.isArray(filteringComponent.files)).toBe(true)
      expect(Array.isArray(filteringComponent.dependencies)).toBe(true)
      expect(filteringComponent.configuration).toBeDefined()
      expect(filteringComponent.healthStatus).toMatch(/^(healthy|degraded|unhealthy)$/)

      // File snapshots validation
      filteringComponent.files.forEach(file => {
        expect(file.path).toBeDefined()
        expect(file.hash).toBeDefined()
        expect(file.size).toBeGreaterThan(0)
        expect(file.lastModified).toBeInstanceOf(Date)
      })

      // Dependency snapshots validation
      filteringComponent.dependencies.forEach(dep => {
        expect(dep.name).toBeDefined()
        expect(dep.version).toBeDefined()
        expect(dep.type).toMatch(/^(npm|system|external)$/)
        expect(typeof dep.critical).toBe('boolean')
      })
    })

    it('should run health checks during snapshot creation', async () => {
      const snapshot = await rollbackManager.createSnapshot(
        '1.0.0',
        'main',
        'abc123',
        'staging'
      )

      expect(snapshot.healthChecks.length).toBeGreaterThan(0)

      snapshot.healthChecks.forEach(check => {
        expect(check.name).toBeDefined()
        expect(check.status).toMatch(/^(pass|fail|warning)$/)
        expect(check.responseTime).toBeGreaterThan(0)
        expect(check.message).toBeDefined()
        expect(check.timestamp).toBeInstanceOf(Date)
        expect(typeof check.critical).toBe('boolean')
      })

      // Should include critical health checks
      const criticalChecks = snapshot.healthChecks.filter(check => check.critical)
      expect(criticalChecks.length).toBeGreaterThan(0)
    })

    it('should capture performance baseline', async () => {
      const snapshot = await rollbackManager.createSnapshot(
        '1.0.0',
        'main',
        'abc123',
        'production'
      )

      const baseline = snapshot.performanceBaseline
      expect(baseline.loadTime).toBeGreaterThan(0)
      expect(baseline.renderTime).toBeGreaterThan(0)
      expect(baseline.memoryUsage).toBeGreaterThan(0)
      expect(baseline.cpuUsage).toBeGreaterThanOrEqual(0)
      expect(baseline.cpuUsage).toBeLessThanOrEqual(100)
      expect(baseline.networkRequests).toBeGreaterThan(0)
      expect(baseline.bundleSize).toBeGreaterThan(0)
      expect(baseline.timestamp).toBeInstanceOf(Date)
    })

    it('should store snapshots for retrieval', async () => {
      const snapshot1 = await rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')
      const snapshot2 = await rollbackManager.createSnapshot('1.1.0', 'main', 'def456', 'production')

      const snapshots = rollbackManager.getSnapshots()
      expect(snapshots.length).toBe(2)
      expect(snapshots.find(s => s.id === snapshot1.id)).toBeDefined()
      expect(snapshots.find(s => s.id === snapshot2.id)).toBeDefined()
    })
  })

  describe('Rollback Plan Creation', () => {
    it('should create rollback plan successfully', async () => {
      // Create target snapshot first
      const snapshot = await rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')

      const plan = await rollbackManager.createRollbackPlan('deploy-123', snapshot.id)

      expect(plan).toBeDefined()
      expect(plan.id).toMatch(/^rollback-plan-\d+-[a-z0-9]+$/)
      expect(plan.deploymentId).toBe('deploy-123')
      expect(plan.targetSnapshot).toBe(snapshot.id)
      expect(Array.isArray(plan.steps)).toBe(true)
      expect(plan.steps.length).toBeGreaterThan(0)
      expect(plan.estimatedDuration).toBeGreaterThan(0)
      expect(plan.riskLevel).toMatch(/^(low|medium|high|critical)$/)
      expect(Array.isArray(plan.prerequisites)).toBe(true)
      expect(Array.isArray(plan.validationChecks)).toBe(true)
      expect(Array.isArray(plan.rollbackOrder)).toBe(true)
    })

    it('should generate comprehensive rollback steps', async () => {
      const snapshot = await rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')
      const plan = await rollbackManager.createRollbackPlan('deploy-123', snapshot.id)

      expect(plan.steps.length).toBeGreaterThan(0)

      plan.steps.forEach(step => {
        expect(step.id).toBeDefined()
        expect(step.name).toBeDefined()
        expect(step.description).toBeDefined()
        expect(step.component).toBeDefined()
        expect(step.action).toMatch(/^(revert-files|revert-config|revert-database|revert-dependencies|restart-service|validate)$/)
        expect(step.parameters).toBeDefined()
        expect(step.timeout).toBeGreaterThan(0)
        expect(typeof step.critical).toBe('boolean')
        expect(typeof step.rollbackOnFailure).toBe('boolean')
      })

      // Should include critical steps
      const criticalSteps = plan.steps.filter(step => step.critical)
      expect(criticalSteps.length).toBeGreaterThan(0)

      // Should include validation step
      const validationSteps = plan.steps.filter(step => step.action === 'validate')
      expect(validationSteps.length).toBeGreaterThan(0)
    })

    it('should include validation checks in plan', async () => {
      const snapshot = await rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')
      const plan = await rollbackManager.createRollbackPlan('deploy-123', snapshot.id)

      expect(plan.validationChecks.length).toBeGreaterThan(0)

      plan.validationChecks.forEach(check => {
        expect(check.name).toBeDefined()
        expect(check.type).toMatch(/^(health-check|performance-check|functional-check|security-check)$/)
        expect(check.timeout).toBeGreaterThan(0)
        expect(check.retries).toBeGreaterThanOrEqual(0)
        expect(typeof check.critical).toBe('boolean')
      })

      // Should include critical validation checks
      const criticalChecks = plan.validationChecks.filter(check => check.critical)
      expect(criticalChecks.length).toBeGreaterThan(0)
    })

    it('should throw error for non-existent snapshot', async () => {
      await expect(
        rollbackManager.createRollbackPlan('deploy-123', 'non-existent-snapshot')
      ).rejects.toThrow('Target snapshot non-existent-snapshot not found')
    })

    it('should store rollback plans for retrieval', async () => {
      const snapshot = await rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')
      const plan1 = await rollbackManager.createRollbackPlan('deploy-123', snapshot.id)
      const plan2 = await rollbackManager.createRollbackPlan('deploy-456', snapshot.id)

      const plans = rollbackManager.getRollbackPlans()
      expect(plans.length).toBe(2)
      expect(plans.find(p => p.id === plan1.id)).toBeDefined()
      expect(plans.find(p => p.id === plan2.id)).toBeDefined()
    })
  })

  describe('Rollback Execution', () => {
    it('should execute rollback plan successfully', async () => {
      // Create snapshot and plan
      const snapshot = await rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')
      const plan = await rollbackManager.createRollbackPlan('deploy-123', snapshot.id)

      const result = await rollbackManager.executeRollback(plan.id)

      expect(result).toBeDefined()
      expect(result.id).toMatch(/^rollback-result-\d+-[a-z0-9]+$/)
      expect(result.planId).toBe(plan.id)
      expect(result.status).toMatch(/^(success|partial|failed)$/)
      expect(result.startTime).toBeInstanceOf(Date)
      expect(result.endTime).toBeInstanceOf(Date)
      expect(result.duration).toBeGreaterThan(0)
      expect(Array.isArray(result.stepsExecuted)).toBe(true)
      expect(Array.isArray(result.validationResults)).toBe(true)
      expect(Array.isArray(result.issues)).toBe(true)
      expect(result.finalState).toBeDefined()
    })

    it('should execute all rollback steps', async () => {
      const snapshot = await rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')
      const plan = await rollbackManager.createRollbackPlan('deploy-123', snapshot.id)

      const result = await rollbackManager.executeRollback(plan.id)

      expect(result.stepsExecuted.length).toBe(plan.steps.length)

      result.stepsExecuted.forEach(stepResult => {
        expect(stepResult.stepId).toBeDefined()
        expect(stepResult.status).toMatch(/^(success|failed|skipped)$/)
        expect(stepResult.startTime).toBeInstanceOf(Date)
        expect(stepResult.endTime).toBeInstanceOf(Date)
        expect(stepResult.duration).toBeGreaterThan(0)
        expect(stepResult.output).toBeDefined()
      })
    })

    it('should run validation checks during rollback', async () => {
      const snapshot = await rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')
      const plan = await rollbackManager.createRollbackPlan('deploy-123', snapshot.id)

      const result = await rollbackManager.executeRollback(plan.id)

      expect(result.validationResults.length).toBe(plan.validationChecks.length)

      result.validationResults.forEach(validationResult => {
        expect(validationResult.checkName).toBeDefined()
        expect(validationResult.status).toMatch(/^(pass|fail|warning)$/)
        expect(validationResult.message).toBeDefined()
        expect(validationResult.details).toBeDefined()
        expect(validationResult.timestamp).toBeInstanceOf(Date)
      })
    })

    it('should capture final state after rollback', async () => {
      const snapshot = await rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')
      const plan = await rollbackManager.createRollbackPlan('deploy-123', snapshot.id)

      const result = await rollbackManager.executeRollback(plan.id)

      expect(result.finalState).toBeDefined()
      expect(result.finalState.id).toBeDefined()
      expect(result.finalState.timestamp).toBeInstanceOf(Date)
      expect(result.finalState.components).toBeDefined()
      expect(result.finalState.healthChecks).toBeDefined()
      expect(result.finalState.performanceBaseline).toBeDefined()
    })

    it('should handle rollback failures gracefully', async () => {
      const snapshot = await rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')
      const plan = await rollbackManager.createRollbackPlan('deploy-123', snapshot.id)

      // Execute multiple times to potentially trigger failures (due to random failure simulation)
      const results = await Promise.allSettled([
        rollbackManager.executeRollback(plan.id),
        rollbackManager.executeRollback(plan.id),
        rollbackManager.executeRollback(plan.id)
      ])

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value.status).toMatch(/^(success|partial|failed)$/)
          
          if (result.value.status === 'failed' || result.value.status === 'partial') {
            expect(result.value.issues.length).toBeGreaterThan(0)
          }
        }
      })
    })

    it('should throw error for non-existent plan', async () => {
      await expect(
        rollbackManager.executeRollback('non-existent-plan')
      ).rejects.toThrow('Rollback plan non-existent-plan not found')
    })

    it('should store rollback results in history', async () => {
      const snapshot = await rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')
      const plan = await rollbackManager.createRollbackPlan('deploy-123', snapshot.id)

      await rollbackManager.executeRollback(plan.id)
      await rollbackManager.executeRollback(plan.id)

      const history = rollbackManager.getRollbackHistory()
      expect(history.length).toBe(2)

      history.forEach(result => {
        expect(result.id).toBeDefined()
        expect(result.planId).toBe(plan.id)
        expect(result.status).toMatch(/^(success|partial|failed)$/)
      })
    })
  })

  describe('Report Generation', () => {
    it('should generate comprehensive rollback report', async () => {
      const snapshot = await rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')
      const plan = await rollbackManager.createRollbackPlan('deploy-123', snapshot.id)
      const result = await rollbackManager.executeRollback(plan.id)

      const report = rollbackManager.generateRollbackReport(result.id)

      expect(typeof report).toBe('string')
      expect(report.length).toBeGreaterThan(0)

      // Check report structure
      expect(report).toContain('# Rollback Report')
      expect(report).toContain('## Steps Executed')
      expect(report).toContain(result.id)
      expect(report).toContain(result.planId)
      expect(report).toContain(result.status)

      // Check step details
      result.stepsExecuted.forEach(step => {
        expect(report).toContain(step.stepId)
        expect(report).toContain(step.status)
      })
    })

    it('should include issues in report when present', async () => {
      const snapshot = await rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')
      const plan = await rollbackManager.createRollbackPlan('deploy-123', snapshot.id)

      // Execute multiple times to potentially get failures
      let resultWithIssues = null
      for (let i = 0; i < 5; i++) {
        const result = await rollbackManager.executeRollback(plan.id)
        if (result.issues.length > 0) {
          resultWithIssues = result
          break
        }
      }

      if (resultWithIssues) {
        const report = rollbackManager.generateRollbackReport(resultWithIssues.id)
        expect(report).toContain('## Issues')
        
        resultWithIssues.issues.forEach(issue => {
          expect(report).toContain(issue.message)
          expect(report).toContain(issue.severity)
          expect(report).toContain(issue.component)
          expect(report).toContain(issue.recommendation)
        })
      }
    })

    it('should throw error for non-existent result', () => {
      expect(() => {
        rollbackManager.generateRollbackReport('non-existent-result')
      }).toThrow('Rollback result non-existent-result not found')
    })
  })

  describe('Data Management', () => {
    it('should manage snapshots correctly', async () => {
      const snapshot1 = await rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')
      const snapshot2 = await rollbackManager.createSnapshot('1.1.0', 'main', 'def456', 'staging')

      const snapshots = rollbackManager.getSnapshots()
      expect(snapshots.length).toBe(2)
      
      const ids = snapshots.map(s => s.id)
      expect(ids).toContain(snapshot1.id)
      expect(ids).toContain(snapshot2.id)
    })

    it('should manage rollback plans correctly', async () => {
      const snapshot = await rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')
      const plan1 = await rollbackManager.createRollbackPlan('deploy-123', snapshot.id)
      const plan2 = await rollbackManager.createRollbackPlan('deploy-456', snapshot.id)

      const plans = rollbackManager.getRollbackPlans()
      expect(plans.length).toBe(2)
      
      const ids = plans.map(p => p.id)
      expect(ids).toContain(plan1.id)
      expect(ids).toContain(plan2.id)
    })

    it('should maintain rollback history', async () => {
      const snapshot = await rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')
      const plan = await rollbackManager.createRollbackPlan('deploy-123', snapshot.id)

      await rollbackManager.executeRollback(plan.id)
      await rollbackManager.executeRollback(plan.id)
      await rollbackManager.executeRollback(plan.id)

      const history = rollbackManager.getRollbackHistory()
      expect(history.length).toBe(3)
      
      // History should be in chronological order
      for (let i = 1; i < history.length; i++) {
        expect(history[i].startTime.getTime()).toBeGreaterThanOrEqual(history[i-1].startTime.getTime())
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle snapshot creation errors gracefully', async () => {
      // Should not throw for valid parameters
      await expect(
        rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')
      ).resolves.toBeDefined()
    })

    it('should handle plan creation errors gracefully', async () => {
      // Should throw for invalid snapshot ID
      await expect(
        rollbackManager.createRollbackPlan('deploy-123', 'invalid-snapshot-id')
      ).rejects.toThrow()
    })

    it('should handle rollback execution errors gracefully', async () => {
      // Should throw for invalid plan ID
      await expect(
        rollbackManager.executeRollback('invalid-plan-id')
      ).rejects.toThrow()
    })
  })

  describe('Performance', () => {
    it('should create snapshots within reasonable time', async () => {
      const startTime = Date.now()
      await rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')
      const endTime = Date.now()

      const duration = endTime - startTime
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should execute rollbacks within reasonable time', async () => {
      const snapshot = await rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production')
      const plan = await rollbackManager.createRollbackPlan('deploy-123', snapshot.id)

      const startTime = Date.now()
      await rollbackManager.executeRollback(plan.id)
      const endTime = Date.now()

      const duration = endTime - startTime
      expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
    })

    it('should handle concurrent operations', async () => {
      const operations = await Promise.allSettled([
        rollbackManager.createSnapshot('1.0.0', 'main', 'abc123', 'production'),
        rollbackManager.createSnapshot('1.1.0', 'main', 'def456', 'staging'),
        rollbackManager.createSnapshot('1.2.0', 'main', 'ghi789', 'development')
      ])

      operations.forEach(operation => {
        expect(operation.status).toBe('fulfilled')
      })

      const snapshots = rollbackManager.getSnapshots()
      expect(snapshots.length).toBe(3)
    })
  })
})
