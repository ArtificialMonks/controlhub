// src/lib/performance-optimization.ts
/**
 * Performance Optimization Framework - Quest 4.4
 * Implements expert council performance optimization requirements
 * Comprehensive caching strategy, memory management, and optimization utilities
 */

import React from 'react'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CacheConfig {
  maxSize: number
  ttl: number // Time to live in milliseconds
  strategy: 'lru' | 'lfu' | 'fifo'
  enablePersistence: boolean
  compressionEnabled: boolean
}

export interface CacheEntry<T> {
  key: string
  value: T
  timestamp: number
  accessCount: number
  lastAccessed: number
  size: number
}

export interface MemoryMetrics {
  heapUsed: number
  heapTotal: number
  external: number
  arrayBuffers: number
  usagePercentage: number
  timestamp: number
}

export interface PerformanceOptimizationConfig {
  cache: CacheConfig
  memoryManagement: {
    enableGarbageCollection: boolean
    gcThreshold: number // Memory usage percentage to trigger GC
    enableMemoryMonitoring: boolean
    monitoringInterval: number
  }
  optimization: {
    enableLazyLoading: boolean
    enableVirtualization: boolean
    enableMemoization: boolean
    enableDebouncing: boolean
    debounceDelay: number
  }
}

export interface OptimizationReport {
  reportId: string
  timestamp: string
  cacheMetrics: {
    hitRate: number
    missRate: number
    totalRequests: number
    cacheSize: number
    memoryUsage: number
  }
  memoryMetrics: MemoryMetrics
  performanceGains: {
    averageResponseTime: number
    cacheHitSavings: number
    memoryOptimization: number
  }
  recommendations: string[]
}

// ============================================================================
// ADVANCED CACHE IMPLEMENTATION
// ============================================================================

export class AdvancedCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private config: CacheConfig
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0
  }

  constructor(config: CacheConfig) {
    this.config = config
    this.startCleanupInterval()
  }

  /**
   * Get value from cache
   */
  public get(key: string): T | null {
    this.stats.totalRequests++
    
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = Date.now()
    this.stats.hits++

    return entry.value
  }

  /**
   * Set value in cache
   */
  public set(key: string, value: T): void {
    const now = Date.now()
    const size = this.calculateSize(value)

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxSize) {
      this.evictEntries()
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      size
    }

    this.cache.set(key, entry)

    // Persist if enabled
    if (this.config.enablePersistence) {
      this.persistEntry(key, entry)
    }
  }

  /**
   * Delete value from cache
   */
  public delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    
    if (deleted && this.config.enablePersistence) {
      this.removePersistentEntry(key)
    }

    return deleted
  }

  /**
   * Clear entire cache
   */
  public clear(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0, evictions: 0, totalRequests: 0 }
    
    if (this.config.enablePersistence) {
      this.clearPersistentCache()
    }
  }

  /**
   * Get cache statistics
   */
  public getStats() {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0

    const missRate = this.stats.totalRequests > 0 
      ? (this.stats.misses / this.stats.totalRequests) * 100 
      : 0

    return {
      ...this.stats,
      hitRate,
      missRate,
      size: this.cache.size,
      memoryUsage: this.getMemoryUsage()
    }
  }

  /**
   * Get cache size in bytes
   */
  public getMemoryUsage(): number {
    let totalSize = 0
    for (const entry of this.cache.values()) {
      totalSize += entry.size
    }
    return totalSize
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.config.ttl
  }

  private evictEntries(): void {
    const entriesToEvict = Math.ceil(this.config.maxSize * 0.1) // Evict 10%
    
    switch (this.config.strategy) {
      case 'lru':
        this.evictLRU(entriesToEvict)
        break
      case 'lfu':
        this.evictLFU(entriesToEvict)
        break
      case 'fifo':
        this.evictFIFO(entriesToEvict)
        break
    }
  }

  private evictLRU(count: number): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
      .slice(0, count)

    entries.forEach(([key]) => {
      this.cache.delete(key)
      this.stats.evictions++
    })
  }

  private evictLFU(count: number): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.accessCount - b.accessCount)
      .slice(0, count)

    entries.forEach(([key]) => {
      this.cache.delete(key)
      this.stats.evictions++
    })
  }

  private evictFIFO(count: number): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, count)

    entries.forEach(([key]) => {
      this.cache.delete(key)
      this.stats.evictions++
    })
  }

  private calculateSize(value: T): number {
    // Rough estimation of object size in bytes
    const jsonString = JSON.stringify(value)
    return new Blob([jsonString]).size
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredEntries()
    }, this.config.ttl / 4) // Cleanup every quarter of TTL
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(key)
      }
    }
  }

  private persistEntry(key: string, entry: CacheEntry<T>): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const serialized = JSON.stringify({
          value: entry.value,
          timestamp: entry.timestamp,
          ttl: this.config.ttl
        })
        
        if (this.config.compressionEnabled) {
          // In a real implementation, use compression library
          localStorage.setItem(`cache_${key}`, serialized)
        } else {
          localStorage.setItem(`cache_${key}`, serialized)
        }
      } catch (error) {
        console.warn('Failed to persist cache entry:', error)
      }
    }
  }

  private removePersistentEntry(key: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(`cache_${key}`)
    }
  }

  private clearPersistentCache(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'))
      keys.forEach(key => localStorage.removeItem(key))
    }
  }
}

// ============================================================================
// MEMORY MANAGEMENT
// ============================================================================

export class MemoryManager {
  private config: PerformanceOptimizationConfig['memoryManagement']
  private metrics: MemoryMetrics[] = []
  private monitoringInterval?: NodeJS.Timeout

  constructor(config: PerformanceOptimizationConfig['memoryManagement']) {
    this.config = config
    
    if (config.enableMemoryMonitoring) {
      this.startMonitoring()
    }
  }

  /**
   * Get current memory metrics
   */
  public getCurrentMetrics(): MemoryMetrics {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage()
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        arrayBuffers: usage.arrayBuffers,
        usagePercentage: (usage.heapUsed / usage.heapTotal) * 100,
        timestamp: Date.now()
      }
    } else if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory
      return {
        heapUsed: memory.usedJSHeapSize,
        heapTotal: memory.totalJSHeapSize,
        external: 0,
        arrayBuffers: 0,
        usagePercentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
        timestamp: Date.now()
      }
    } else {
      return {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        arrayBuffers: 0,
        usagePercentage: 0,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Force garbage collection if enabled and threshold exceeded
   */
  public checkAndTriggerGC(): void {
    if (!this.config.enableGarbageCollection) return

    const metrics = this.getCurrentMetrics()
    
    if (metrics.usagePercentage > this.config.gcThreshold) {
      this.triggerGarbageCollection()
    }
  }

  /**
   * Get memory usage history
   */
  public getMemoryHistory(): MemoryMetrics[] {
    return [...this.metrics]
  }

  /**
   * Get memory optimization recommendations
   */
  public getOptimizationRecommendations(): string[] {
    const recommendations: string[] = []
    const currentMetrics = this.getCurrentMetrics()

    if (currentMetrics.usagePercentage > 80) {
      recommendations.push('Memory usage is high (>80%). Consider implementing memory cleanup strategies.')
    }

    if (this.metrics.length > 10) {
      const recentMetrics = this.metrics.slice(-10)
      const avgUsage = recentMetrics.reduce((sum, m) => sum + m.usagePercentage, 0) / recentMetrics.length
      
      if (avgUsage > 70) {
        recommendations.push('Average memory usage is consistently high. Consider optimizing data structures.')
      }
    }

    if (currentMetrics.heapUsed > 100 * 1024 * 1024) { // 100MB
      recommendations.push('Heap usage is large. Consider implementing object pooling or lazy loading.')
    }

    if (recommendations.length === 0) {
      recommendations.push('Memory usage is within optimal ranges.')
    }

    return recommendations
  }

  /**
   * Stop memory monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      const metrics = this.getCurrentMetrics()
      this.metrics.push(metrics)

      // Keep only last 100 metrics
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100)
      }

      // Check for GC trigger
      this.checkAndTriggerGC()
    }, this.config.monitoringInterval)
  }

  private triggerGarbageCollection(): void {
    if (typeof global !== 'undefined' && global.gc) {
      try {
        global.gc()
        console.log('Garbage collection triggered')
      } catch (error) {
        console.warn('Failed to trigger garbage collection:', error)
      }
    }
  }
}

// ============================================================================
// OPTIMIZATION UTILITIES
// ============================================================================

export class OptimizationUtilities {
  private static memoCache = new Map<string, any>()
  private static debounceTimers = new Map<string, NodeJS.Timeout>()

  /**
   * Memoization decorator
   */
  public static memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
      
      if (this.memoCache.has(key)) {
        return this.memoCache.get(key)
      }

      const result = fn(...args)
      this.memoCache.set(key, result)
      
      return result
    }) as T
  }

  /**
   * Debounce function
   */
  public static debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number,
    key?: string
  ): T {
    return ((...args: Parameters<T>) => {
      const debounceKey = key || fn.name || 'default'
      
      if (this.debounceTimers.has(debounceKey)) {
        clearTimeout(this.debounceTimers.get(debounceKey)!)
      }

      const timer = setTimeout(() => {
        fn(...args)
        this.debounceTimers.delete(debounceKey)
      }, delay)

      this.debounceTimers.set(debounceKey, timer)
    }) as T
  }

  /**
   * Throttle function
   */
  public static throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number
  ): T {
    let inThrottle = false
    
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }) as T
  }

  /**
   * Lazy loading utility
   */
  public static createLazyLoader<T>(
    loader: () => Promise<T>
  ): () => Promise<T> {
    let cached: T | null = null
    let loading: Promise<T> | null = null

    return async () => {
      if (cached) {
        return cached
      }

      if (loading) {
        return loading
      }

      loading = loader()
      cached = await loading
      loading = null
      
      return cached
    }
  }

  /**
   * Clear memoization cache
   */
  public static clearMemoCache(): void {
    this.memoCache.clear()
  }

  /**
   * Clear debounce timers
   */
  public static clearDebounceTimers(): void {
    this.debounceTimers.forEach(timer => clearTimeout(timer))
    this.debounceTimers.clear()
  }
}

// ============================================================================
// PERFORMANCE OPTIMIZATION MANAGER
// ============================================================================

export class PerformanceOptimizationManager {
  private cache: AdvancedCache<any>
  private memoryManager: MemoryManager
  private config: PerformanceOptimizationConfig

  constructor(config: PerformanceOptimizationConfig) {
    this.config = config
    this.cache = new AdvancedCache(config.cache)
    this.memoryManager = new MemoryManager(config.memoryManagement)
  }

  /**
   * Get comprehensive optimization report
   */
  public generateOptimizationReport(): OptimizationReport {
    const cacheStats = this.cache.getStats()
    const memoryMetrics = this.memoryManager.getCurrentMetrics()
    const memoryRecommendations = this.memoryManager.getOptimizationRecommendations()

    const performanceGains = {
      averageResponseTime: this.calculateAverageResponseTime(),
      cacheHitSavings: this.calculateCacheHitSavings(cacheStats.hitRate),
      memoryOptimization: this.calculateMemoryOptimization(memoryMetrics)
    }

    const recommendations = [
      ...memoryRecommendations,
      ...this.generateCacheRecommendations(cacheStats),
      ...this.generateGeneralRecommendations()
    ]

    return {
      reportId: `perf-report-${Date.now()}`,
      timestamp: new Date().toISOString(),
      cacheMetrics: {
        hitRate: cacheStats.hitRate,
        missRate: cacheStats.missRate,
        totalRequests: cacheStats.totalRequests,
        cacheSize: cacheStats.size,
        memoryUsage: cacheStats.memoryUsage
      },
      memoryMetrics,
      performanceGains,
      recommendations
    }
  }

  /**
   * Get cache instance
   */
  public getCache(): AdvancedCache<any> {
    return this.cache
  }

  /**
   * Get memory manager instance
   */
  public getMemoryManager(): MemoryManager {
    return this.memoryManager
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private calculateAverageResponseTime(): number {
    // Mock calculation - in real implementation, track actual response times
    const cacheStats = this.cache.getStats()
    const baseResponseTime = 100 // ms
    const cacheHitSpeedup = 0.9 // 90% faster with cache hit
    
    return baseResponseTime * (1 - (cacheStats.hitRate / 100) * cacheHitSpeedup)
  }

  private calculateCacheHitSavings(hitRate: number): number {
    // Estimate time saved by cache hits
    const averageRequestTime = 100 // ms
    const cacheHitTime = 10 // ms
    const timeSavedPerHit = averageRequestTime - cacheHitTime
    
    return (hitRate / 100) * timeSavedPerHit
  }

  private calculateMemoryOptimization(metrics: MemoryMetrics): number {
    // Calculate memory optimization score (0-100)
    const usageScore = Math.max(0, 100 - metrics.usagePercentage)
    return usageScore
  }

  private generateCacheRecommendations(stats: any): string[] {
    const recommendations: string[] = []

    if (stats.hitRate < 50) {
      recommendations.push('Cache hit rate is low (<50%). Consider adjusting cache strategy or TTL.')
    }

    if (stats.size >= this.config.cache.maxSize * 0.9) {
      recommendations.push('Cache is near capacity. Consider increasing max size or improving eviction strategy.')
    }

    if (stats.memoryUsage > 50 * 1024 * 1024) { // 50MB
      recommendations.push('Cache memory usage is high. Consider enabling compression or reducing cache size.')
    }

    return recommendations
  }

  private generateGeneralRecommendations(): string[] {
    const recommendations: string[] = []

    if (!this.config.optimization.enableMemoization) {
      recommendations.push('Consider enabling memoization for expensive computations.')
    }

    if (!this.config.optimization.enableLazyLoading) {
      recommendations.push('Consider enabling lazy loading for better initial load performance.')
    }

    if (!this.config.optimization.enableDebouncing) {
      recommendations.push('Consider enabling debouncing for user input handlers.')
    }

    return recommendations
  }
}

// ============================================================================
// DEFAULT CONFIGURATION (MOVED UP TO AVOID DECLARATION ORDER ISSUES)
// ============================================================================

export const defaultPerformanceConfig: PerformanceOptimizationConfig = {
  cache: {
    maxSize: 1000,
    ttl: 5 * 60 * 1000, // 5 minutes
    strategy: 'lru',
    enablePersistence: true,
    compressionEnabled: false
  },
  memoryManagement: {
    enableGarbageCollection: true,
    gcThreshold: 80, // 80% memory usage
    enableMemoryMonitoring: true,
    monitoringInterval: 30000 // 30 seconds
  },
  optimization: {
    enableLazyLoading: true,
    enableVirtualization: true,
    enableMemoization: true,
    enableDebouncing: true,
    debounceDelay: 300
  }
}

// ============================================================================
// REACT INTEGRATION HOOKS
// ============================================================================

/**
 * React hook for performance optimization
 */
export function usePerformanceOptimization(config?: Partial<PerformanceOptimizationConfig>) {
  const [manager] = React.useState(() =>
    new PerformanceOptimizationManager({ ...defaultPerformanceConfig, ...config })
  )

  const [metrics, setMetrics] = React.useState<OptimizationReport | null>(null)

  // Update metrics periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      const report = manager.generateOptimizationReport()
      setMetrics(report)
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [manager])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      manager.getMemoryManager().stopMonitoring()
    }
  }, [manager])

  return {
    cache: manager.getCache(),
    memoryManager: manager.getMemoryManager(),
    metrics,
    generateReport: () => manager.generateOptimizationReport()
  }
}

/**
 * React hook for memoized values with cache integration
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList,
  cacheKey?: string
): T {
  const cache = React.useRef<AdvancedCache<T> | null>(null)

  if (!cache.current) {
    cache.current = new AdvancedCache<T>({
      maxSize: 100,
      ttl: 5 * 60 * 1000,
      strategy: 'lru',
      enablePersistence: false,
      compressionEnabled: false
    })
  }

  return React.useMemo(() => {
    const key = cacheKey || JSON.stringify(deps)
    const cached = cache.current!.get(key)

    if (cached !== null) {
      return cached
    }

    const value = factory()
    cache.current!.set(key, value)
    return value
  }, deps)
}

/**
 * React hook for debounced values
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * React hook for lazy loading with cache
 */
export function useLazyLoad<T>(
  loader: () => Promise<T>,
  deps: React.DependencyList = []
): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const lazyLoader = React.useMemo(
    () => OptimizationUtilities.createLazyLoader(loader),
    deps
  )

  React.useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    lazyLoader()
      .then(result => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, deps)

  return { data, loading, error }
}

// ============================================================================
// GLOBAL PERFORMANCE MANAGER INSTANCE
// ============================================================================

export const globalPerformanceManager = new PerformanceOptimizationManager(defaultPerformanceConfig)
