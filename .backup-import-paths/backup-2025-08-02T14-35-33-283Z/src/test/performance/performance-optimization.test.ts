// src/test/performance/performance-optimization.test.ts
/**
 * Performance Optimization Tests - Quest 4.4
 * Validates expert council performance optimization implementation
 * Tests caching strategy, memory management, and optimization utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  AdvancedCache,
  MemoryManager,
  OptimizationUtilities,
  PerformanceOptimizationManager,
  defaultPerformanceConfig,
  globalPerformanceManager
} from '@/lib/performance-optimization'

// ============================================================================
// ADVANCED CACHE TESTS
// ============================================================================

describe('AdvancedCache', () => {
  let cache: AdvancedCache<string>

  beforeEach(() => {
    cache = new AdvancedCache({
      maxSize: 5,
      ttl: 1000, // 1 second
      strategy: 'lru',
      enablePersistence: false,
      compressionEnabled: false
    })
  })

  it('should store and retrieve values', () => {
    cache.set('key1', 'value1')
    expect(cache.get('key1')).toBe('value1')
  })

  it('should return null for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeNull()
  })

  it('should handle TTL expiration', async () => {
    cache.set('key1', 'value1')
    expect(cache.get('key1')).toBe('value1')

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 1100))
    expect(cache.get('key1')).toBeNull()
  })

  it('should evict entries when max size is reached', () => {
    // Fill cache to max size
    for (let i = 0; i < 5; i++) {
      cache.set(`key${i}`, `value${i}`)
    }

    // Add one more to trigger eviction
    cache.set('key5', 'value5')

    const stats = cache.getStats()
    expect(stats.size).toBeLessThanOrEqual(5)
    expect(stats.evictions).toBeGreaterThan(0)
  })

  it('should track cache statistics', () => {
    cache.set('key1', 'value1')
    cache.get('key1') // Hit
    cache.get('key2') // Miss

    const stats = cache.getStats()
    expect(stats.hits).toBe(1)
    expect(stats.misses).toBe(1)
    expect(stats.totalRequests).toBe(2)
    expect(stats.hitRate).toBe(50)
    expect(stats.missRate).toBe(50)
  })

  it('should clear cache', () => {
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    
    cache.clear()
    
    expect(cache.get('key1')).toBeNull()
    expect(cache.get('key2')).toBeNull()
    
    const stats = cache.getStats()
    expect(stats.size).toBe(0)
  })
})

// ============================================================================
// MEMORY MANAGER TESTS
// ============================================================================

describe('MemoryManager', () => {
  let memoryManager: MemoryManager

  beforeEach(() => {
    memoryManager = new MemoryManager({
      enableGarbageCollection: true,
      gcThreshold: 80,
      enableMemoryMonitoring: false, // Disable for testing
      monitoringInterval: 1000
    })
  })

  afterEach(() => {
    memoryManager.stopMonitoring()
  })

  it('should get current memory metrics', () => {
    const metrics = memoryManager.getCurrentMetrics()
    
    expect(metrics).toHaveProperty('heapUsed')
    expect(metrics).toHaveProperty('heapTotal')
    expect(metrics).toHaveProperty('usagePercentage')
    expect(metrics).toHaveProperty('timestamp')
    expect(typeof metrics.usagePercentage).toBe('number')
  })

  it('should provide optimization recommendations', () => {
    const recommendations = memoryManager.getOptimizationRecommendations()
    
    expect(Array.isArray(recommendations)).toBe(true)
    expect(recommendations.length).toBeGreaterThan(0)
    expect(typeof recommendations[0]).toBe('string')
  })

  it('should track memory history when monitoring is enabled', () => {
    const memoryManagerWithMonitoring = new MemoryManager({
      enableGarbageCollection: false,
      gcThreshold: 80,
      enableMemoryMonitoring: true,
      monitoringInterval: 100
    })

    // Wait for some metrics to be collected
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const history = memoryManagerWithMonitoring.getMemoryHistory()
        expect(history.length).toBeGreaterThan(0)
        memoryManagerWithMonitoring.stopMonitoring()
        resolve()
      }, 250)
    })
  })
})

// ============================================================================
// OPTIMIZATION UTILITIES TESTS
// ============================================================================

describe('OptimizationUtilities', () => {
  beforeEach(() => {
    OptimizationUtilities.clearMemoCache()
    OptimizationUtilities.clearDebounceTimers()
  })

  afterEach(() => {
    OptimizationUtilities.clearMemoCache()
    OptimizationUtilities.clearDebounceTimers()
  })

  it('should memoize function results', () => {
    let callCount = 0
    const expensiveFunction = (x: number) => {
      callCount++
      return x * 2
    }

    const memoizedFunction = OptimizationUtilities.memoize(expensiveFunction)

    // First call
    expect(memoizedFunction(5)).toBe(10)
    expect(callCount).toBe(1)

    // Second call with same argument (should use cache)
    expect(memoizedFunction(5)).toBe(10)
    expect(callCount).toBe(1)

    // Third call with different argument
    expect(memoizedFunction(10)).toBe(20)
    expect(callCount).toBe(2)
  })

  it('should debounce function calls', async () => {
    let callCount = 0
    const debouncedFunction = OptimizationUtilities.debounce(() => {
      callCount++
    }, 100)

    // Call multiple times rapidly
    debouncedFunction()
    debouncedFunction()
    debouncedFunction()

    // Should not have been called yet
    expect(callCount).toBe(0)

    // Wait for debounce delay
    await new Promise(resolve => setTimeout(resolve, 150))

    // Should have been called only once
    expect(callCount).toBe(1)
  })

  it('should throttle function calls', async () => {
    let callCount = 0
    const throttledFunction = OptimizationUtilities.throttle(() => {
      callCount++
    }, 100)

    // Call multiple times rapidly
    throttledFunction()
    throttledFunction()
    throttledFunction()

    // Should have been called once immediately
    expect(callCount).toBe(1)

    // Wait for throttle limit
    await new Promise(resolve => setTimeout(resolve, 150))

    // Call again
    throttledFunction()
    expect(callCount).toBe(2)
  })

  it('should create lazy loader', async () => {
    let loadCount = 0
    const loader = async () => {
      loadCount++
      return 'loaded data'
    }

    const lazyLoader = OptimizationUtilities.createLazyLoader(loader)

    // First call
    const result1 = await lazyLoader()
    expect(result1).toBe('loaded data')
    expect(loadCount).toBe(1)

    // Second call (should use cached result)
    const result2 = await lazyLoader()
    expect(result2).toBe('loaded data')
    expect(loadCount).toBe(1)
  })
})

// ============================================================================
// PERFORMANCE OPTIMIZATION MANAGER TESTS
// ============================================================================

describe('PerformanceOptimizationManager', () => {
  let manager: PerformanceOptimizationManager

  beforeEach(() => {
    manager = new PerformanceOptimizationManager(defaultPerformanceConfig)
  })

  afterEach(() => {
    manager.getMemoryManager().stopMonitoring()
  })

  it('should provide cache and memory manager instances', () => {
    expect(manager.getCache()).toBeInstanceOf(AdvancedCache)
    expect(manager.getMemoryManager()).toBeInstanceOf(MemoryManager)
  })

  it('should generate optimization report', () => {
    const report = manager.generateOptimizationReport()

    expect(report).toHaveProperty('reportId')
    expect(report).toHaveProperty('timestamp')
    expect(report).toHaveProperty('cacheMetrics')
    expect(report).toHaveProperty('memoryMetrics')
    expect(report).toHaveProperty('performanceGains')
    expect(report).toHaveProperty('recommendations')

    // Validate cache metrics
    expect(report.cacheMetrics).toHaveProperty('hitRate')
    expect(report.cacheMetrics).toHaveProperty('missRate')
    expect(report.cacheMetrics).toHaveProperty('totalRequests')

    // Validate memory metrics
    expect(report.memoryMetrics).toHaveProperty('heapUsed')
    expect(report.memoryMetrics).toHaveProperty('usagePercentage')

    // Validate performance gains
    expect(report.performanceGains).toHaveProperty('averageResponseTime')
    expect(report.performanceGains).toHaveProperty('cacheHitSavings')
    expect(report.performanceGains).toHaveProperty('memoryOptimization')

    // Validate recommendations
    expect(Array.isArray(report.recommendations)).toBe(true)
  })

  it('should track cache performance', () => {
    const cache = manager.getCache()

    // Perform some cache operations
    cache.set('test1', 'value1')
    cache.set('test2', 'value2')
    cache.get('test1') // Hit
    cache.get('test3') // Miss

    const report = manager.generateOptimizationReport()
    
    expect(report.cacheMetrics.totalRequests).toBe(2)
    expect(report.cacheMetrics.hitRate).toBe(50)
    expect(report.cacheMetrics.missRate).toBe(50)
  })
})

// ============================================================================
// GLOBAL PERFORMANCE MANAGER TESTS
// ============================================================================

describe('Global Performance Manager', () => {
  it('should provide global performance manager instance', () => {
    expect(globalPerformanceManager).toBeInstanceOf(PerformanceOptimizationManager)
  })

  it('should generate global performance report', () => {
    const report = globalPerformanceManager.generateOptimizationReport()
    
    expect(report).toHaveProperty('reportId')
    expect(report).toHaveProperty('cacheMetrics')
    expect(report).toHaveProperty('memoryMetrics')
    expect(report).toHaveProperty('recommendations')
  })
})

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Performance Optimization Integration', () => {
  it('should demonstrate complete optimization workflow', async () => {
    const manager = new PerformanceOptimizationManager({
      ...defaultPerformanceConfig,
      cache: {
        ...defaultPerformanceConfig.cache,
        maxSize: 10,
        ttl: 500
      }
    })

    const cache = manager.getCache()

    // Simulate application usage
    for (let i = 0; i < 5; i++) {
      cache.set(`key${i}`, `value${i}`)
    }

    // Simulate cache hits and misses
    cache.get('key0') // Hit
    cache.get('key1') // Hit
    cache.get('nonexistent') // Miss

    // Generate report
    const report = manager.generateOptimizationReport()

    // Validate optimization metrics
    expect(report.cacheMetrics.hitRate).toBeGreaterThan(0)
    expect(report.performanceGains.averageResponseTime).toBeGreaterThan(0)
    expect(report.recommendations.length).toBeGreaterThan(0)

    // Cleanup
    manager.getMemoryManager().stopMonitoring()
  })

  it('should handle memory optimization recommendations', () => {
    const manager = new PerformanceOptimizationManager(defaultPerformanceConfig)
    const memoryManager = manager.getMemoryManager()

    const recommendations = memoryManager.getOptimizationRecommendations()
    expect(recommendations).toContain('Memory usage is within optimal ranges.')

    manager.getMemoryManager().stopMonitoring()
  })
})
