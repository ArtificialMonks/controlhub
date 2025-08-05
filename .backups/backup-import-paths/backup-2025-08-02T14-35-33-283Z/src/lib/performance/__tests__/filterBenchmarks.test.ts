// src/lib/performance/__tests__/filterBenchmarks.test.ts
/**
 * Filter Performance Benchmarks Tests
 * Quest 4.3 - Expert Council Validated Implementation
 * 
 * Important Enhancement: Performance Monitoring & Benchmarking
 * Expert Consensus: 100% (6/6 experts)
 * Priority: MEDIUM
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { runFilteringBenchmarks, BenchmarkResult, BenchmarkSuite } from '../filterBenchmarks'

describe('Filter Performance Benchmarks', () => {
  describe('Benchmark Suite Execution', () => {
    it('should run benchmarks with small dataset', async () => {
      const suite = await runFilteringBenchmarks(
        [50], // Small dataset for fast testing
        {
          iterations: 10,
          warmupIterations: 2,
          enableGC: false,
          trackMemory: true
        }
      )

      expect(suite).toBeDefined()
      expect(suite.suiteName).toBe('Filtering Performance Benchmarks')
      expect(suite.results).toBeInstanceOf(Array)
      expect(suite.results.length).toBeGreaterThan(0)
      expect(suite.totalDuration).toBeGreaterThan(0)
      expect(suite.summary).toBeDefined()
    })

    it('should provide valid benchmark results', async () => {
      const suite = await runFilteringBenchmarks(
        [25], // Very small dataset
        {
          iterations: 5,
          warmupIterations: 1,
          enableGC: false,
          trackMemory: false
        }
      )

      suite.results.forEach((result: BenchmarkResult) => {
        expect(result.testName).toBeDefined()
        expect(typeof result.testName).toBe('string')
        expect(result.averageDuration).toBeGreaterThan(0)
        expect(result.minDuration).toBeGreaterThan(0)
        expect(result.maxDuration).toBeGreaterThan(0)
        expect(result.standardDeviation).toBeGreaterThanOrEqual(0)
        expect(result.operationsPerSecond).toBeGreaterThan(0)
        expect(result.iterations).toBe(5)
        expect(result.timestamp).toBeInstanceOf(Date)
      })
    })

    it('should test different filter types', async () => {
      const suite = await runFilteringBenchmarks(
        [20], // Minimal dataset
        {
          iterations: 3,
          warmupIterations: 1,
          enableGC: false,
          trackMemory: false
        }
      )

      const testNames = suite.results.map(r => r.testName)
      
      // Should include search filter tests
      expect(testNames.some(name => name.includes('Search Filter'))).toBe(true)
      
      // Should include client filter tests
      expect(testNames.some(name => name.includes('Client Filter'))).toBe(true)
      
      // Should include status filter tests
      expect(testNames.some(name => name.includes('Status Filter'))).toBe(true)
    })

    it('should provide performance summary', async () => {
      const suite = await runFilteringBenchmarks(
        [15], // Minimal dataset
        {
          iterations: 3,
          warmupIterations: 1,
          enableGC: false,
          trackMemory: false
        }
      )

      expect(suite.summary.fastestTest).toBeDefined()
      expect(suite.summary.slowestTest).toBeDefined()
      expect(suite.summary.averageOpsPerSecond).toBeGreaterThan(0)
      expect(suite.summary.totalOperations).toBeGreaterThan(0)
      
      // Fastest should be different from slowest (unless only one test)
      if (suite.results.length > 1) {
        expect(suite.summary.fastestTest).not.toBe(suite.summary.slowestTest)
      }
    })
  })

  describe('Performance Thresholds', () => {
    it('should meet performance targets for small datasets', async () => {
      const suite = await runFilteringBenchmarks(
        [100], // Small dataset
        {
          iterations: 10,
          warmupIterations: 2,
          enableGC: false,
          trackMemory: false
        }
      )

      // Performance targets from Expert Council
      const PERFORMANCE_TARGETS = {
        maxAverageDuration: 50, // 50ms max for 100 items
        minOpsPerSecond: 20     // At least 20 operations per second
      }

      suite.results.forEach((result: BenchmarkResult) => {
        expect(result.averageDuration).toBeLessThan(PERFORMANCE_TARGETS.maxAverageDuration)
        expect(result.operationsPerSecond).toBeGreaterThan(PERFORMANCE_TARGETS.minOpsPerSecond)
      })
    })

    it('should scale reasonably with dataset size', async () => {
      const suite = await runFilteringBenchmarks(
        [50, 100], // Two different sizes
        {
          iterations: 5,
          warmupIterations: 1,
          enableGC: false,
          trackMemory: false
        }
      )

      // Group results by dataset size
      const size50Results = suite.results.filter(r => r.testName.includes('(50 items'))
      const size100Results = suite.results.filter(r => r.testName.includes('(100 items'))

      if (size50Results.length > 0 && size100Results.length > 0) {
        const avg50 = size50Results.reduce((sum, r) => sum + r.averageDuration, 0) / size50Results.length
        const avg100 = size100Results.reduce((sum, r) => sum + r.averageDuration, 0) / size100Results.length

        // 100 items should not take more than 3x the time of 50 items (reasonable scaling)
        expect(avg100).toBeLessThan(avg50 * 3)
      }
    })
  })

  describe('Memory Tracking', () => {
    it('should track memory usage when enabled', async () => {
      const suite = await runFilteringBenchmarks(
        [30], // Small dataset
        {
          iterations: 5,
          warmupIterations: 1,
          enableGC: false,
          trackMemory: true
        }
      )

      // Check if memory tracking is working (may not work in all environments)
      const resultsWithMemory = suite.results.filter(r => r.memoryUsage !== undefined)
      
      if (resultsWithMemory.length > 0) {
        resultsWithMemory.forEach((result: BenchmarkResult) => {
          expect(result.memoryUsage).toBeDefined()
          expect(result.memoryUsage!.before).toBeGreaterThanOrEqual(0)
          expect(result.memoryUsage!.after).toBeGreaterThanOrEqual(0)
          expect(typeof result.memoryUsage!.delta).toBe('number')
        })
      }
    })

    it('should not track memory usage when disabled', async () => {
      const suite = await runFilteringBenchmarks(
        [20], // Small dataset
        {
          iterations: 3,
          warmupIterations: 1,
          enableGC: false,
          trackMemory: false
        }
      )

      suite.results.forEach((result: BenchmarkResult) => {
        expect(result.memoryUsage).toBeUndefined()
      })
    })
  })

  describe('Statistical Accuracy', () => {
    it('should provide accurate statistical measures', async () => {
      const suite = await runFilteringBenchmarks(
        [25], // Small dataset
        {
          iterations: 10, // More iterations for better statistics
          warmupIterations: 2,
          enableGC: false,
          trackMemory: false
        }
      )

      suite.results.forEach((result: BenchmarkResult) => {
        // Min should be <= average <= max
        expect(result.minDuration).toBeLessThanOrEqual(result.averageDuration)
        expect(result.averageDuration).toBeLessThanOrEqual(result.maxDuration)
        
        // Standard deviation should be reasonable (not negative, not extremely high)
        expect(result.standardDeviation).toBeGreaterThanOrEqual(0)
        expect(result.standardDeviation).toBeLessThan(result.averageDuration * 2) // Not more than 2x average
        
        // Operations per second should be consistent with average duration
        const expectedOpsPerSecond = 1000 / result.averageDuration
        expect(Math.abs(result.operationsPerSecond - expectedOpsPerSecond)).toBeLessThan(1)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle empty dataset sizes gracefully', async () => {
      const suite = await runFilteringBenchmarks(
        [], // Empty dataset sizes
        {
          iterations: 1,
          warmupIterations: 0,
          enableGC: false,
          trackMemory: false
        }
      )

      expect(suite).toBeDefined()
      expect(suite.results).toBeInstanceOf(Array)
      expect(suite.results.length).toBe(0)
      expect(suite.totalDuration).toBeGreaterThanOrEqual(0)
    })

    it('should handle minimal configuration', async () => {
      const suite = await runFilteringBenchmarks(
        [10], // Very small dataset
        {
          iterations: 1,
          warmupIterations: 0,
          enableGC: false,
          trackMemory: false
        }
      )

      expect(suite).toBeDefined()
      expect(suite.results.length).toBeGreaterThan(0)
      
      suite.results.forEach((result: BenchmarkResult) => {
        expect(result.iterations).toBe(1)
        expect(result.averageDuration).toBeGreaterThan(0)
      })
    })
  })

  describe('Regression Detection', () => {
    it('should provide baseline performance metrics', async () => {
      const suite = await runFilteringBenchmarks(
        [50], // Standard test size
        {
          iterations: 5,
          warmupIterations: 1,
          enableGC: false,
          trackMemory: false
        }
      )

      // Store baseline metrics for regression testing
      const baselineMetrics = {
        averageDuration: suite.results.reduce((sum, r) => sum + r.averageDuration, 0) / suite.results.length,
        averageOpsPerSecond: suite.summary.averageOpsPerSecond,
        totalTests: suite.results.length
      }

      expect(baselineMetrics.averageDuration).toBeGreaterThan(0)
      expect(baselineMetrics.averageOpsPerSecond).toBeGreaterThan(0)
      expect(baselineMetrics.totalTests).toBeGreaterThan(0)

      // These metrics can be used for future regression testing
      console.log('Baseline Performance Metrics:', baselineMetrics)
    })
  })
})
