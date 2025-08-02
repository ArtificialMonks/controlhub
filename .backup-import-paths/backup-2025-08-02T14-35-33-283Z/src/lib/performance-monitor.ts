// src/lib/performance-monitor.ts
/**
 * Performance Monitoring Dashboard - Quest 4.4
 * Implements expert council performance monitoring requirements
 * Real-time performance metrics collection and analysis
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CoreWebVitals {
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  inp: number // Interaction to Next Paint
  ttfb: number // Time to First Byte
  fcp: number // First Contentful Paint
}

export interface PerformanceMetrics extends CoreWebVitals {
  loadTime: number
  domContentLoaded: number
  resourceLoadTime: number
  memoryUsage?: number
  timestamp: string
}

export interface ActionPerformanceData {
  actionType: string
  actionId: string
  startTime: number
  endTime: number
  duration: number
  success: boolean
  errorMessage?: string
  metrics: PerformanceMetrics
}

export interface PerformanceBenchmark {
  metric: keyof PerformanceMetrics
  threshold: number
  unit: string
  description: string
  source: 'expert-council' | 'web-vitals' | 'custom'
}

export interface PerformanceReport {
  reportId: string
  timestamp: string
  timeRange: {
    start: string
    end: string
  }
  summary: {
    totalActions: number
    averageResponseTime: number
    successRate: number
    complianceScore: number
  }
  metrics: {
    current: PerformanceMetrics
    average: PerformanceMetrics
    best: PerformanceMetrics
    worst: PerformanceMetrics
  }
  benchmarks: {
    passed: number
    failed: number
    details: Array<{
      benchmark: PerformanceBenchmark
      value: number
      passed: boolean
    }>
  }
  recommendations: string[]
}

// ============================================================================
// PERFORMANCE BENCHMARKS (EXPERT COUNCIL REQUIREMENTS)
// ============================================================================

export const EXPERT_COUNCIL_BENCHMARKS: PerformanceBenchmark[] = [
  {
    metric: 'lcp',
    threshold: 2500,
    unit: 'ms',
    description: 'Largest Contentful Paint should be under 2.5 seconds',
    source: 'expert-council'
  },
  {
    metric: 'fid',
    threshold: 100,
    unit: 'ms',
    description: 'First Input Delay should be under 100ms',
    source: 'expert-council'
  },
  {
    metric: 'cls',
    threshold: 0.1,
    unit: 'score',
    description: 'Cumulative Layout Shift should be under 0.1',
    source: 'expert-council'
  },
  {
    metric: 'inp',
    threshold: 200,
    unit: 'ms',
    description: 'Interaction to Next Paint should be under 200ms',
    source: 'expert-council'
  },
  {
    metric: 'ttfb',
    threshold: 800,
    unit: 'ms',
    description: 'Time to First Byte should be under 800ms',
    source: 'web-vitals'
  },
  {
    metric: 'fcp',
    threshold: 1800,
    unit: 'ms',
    description: 'First Contentful Paint should be under 1.8 seconds',
    source: 'web-vitals'
  }
]

// ============================================================================
// PERFORMANCE MONITOR CLASS
// ============================================================================

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private performanceData: ActionPerformanceData[] = []
  private observers: PerformanceObserver[] = []
  private isMonitoring = false

  private constructor() {
    this.initializeObservers()
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Initialize performance observers for Core Web Vitals
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined') return

    try {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.updateMetric('lcp', lastEntry.startTime)
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
      this.observers.push(lcpObserver)

      // FID Observer
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: PerformanceEntry) => {
          const fidEntry = entry as PerformanceEntry & { processingStart?: number }
          if (fidEntry.processingStart && entry.startTime) {
            this.updateMetric('fid', fidEntry.processingStart - entry.startTime)
          }
        })
      })
      fidObserver.observe({ type: 'first-input', buffered: true })
      this.observers.push(fidObserver)

      // CLS Observer
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: PerformanceEntry) => {
          const clsEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
          if (!clsEntry.hadRecentInput && clsEntry.value) {
            clsValue += clsEntry.value
            this.updateMetric('cls', clsValue)
          }
        })
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
      this.observers.push(clsObserver)

      // INP Observer
      let inpValue = 0
      const inpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: PerformanceEntry) => {
          inpValue = Math.max(inpValue, entry.duration)
          this.updateMetric('inp', inpValue)
        })
      })
      inpObserver.observe({ type: 'event', buffered: true })
      this.observers.push(inpObserver)

    } catch (error) {
      console.warn('Performance observers not supported:', error)
    }
  }

  /**
   * Start monitoring performance
   */
  public startMonitoring(): void {
    this.isMonitoring = true
    console.log('Performance monitoring started')
  }

  /**
   * Stop monitoring performance
   */
  public stopMonitoring(): void {
    this.isMonitoring = false
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    console.log('Performance monitoring stopped')
  }

  /**
   * Collect current performance metrics
   */
  public async collectMetrics(): Promise<PerformanceMetrics> {
    if (typeof window === 'undefined') {
      return this.getDefaultMetrics()
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    // Basic timing metrics
    const ttfb = navigation.responseStart - navigation.requestStart
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
    const loadTime = navigation.loadEventEnd - navigation.loadEventStart
    const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
    
    // Resource load time
    const resources = performance.getEntriesByType('resource')
    const resourceLoadTime = resources.reduce((total, resource) => total + resource.duration, 0)

    // Memory usage (if available)
    const memoryUsage = ('memory' in performance ? (performance as { memory: { usedJSHeapSize: number } }).memory?.usedJSHeapSize : 0) || 0

    return {
      lcp: this.getStoredMetric('lcp'),
      fid: this.getStoredMetric('fid'),
      cls: this.getStoredMetric('cls'),
      inp: this.getStoredMetric('inp'),
      ttfb,
      fcp,
      loadTime,
      domContentLoaded,
      resourceLoadTime,
      memoryUsage,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Measure action performance
   */
  public async measureAction<T>(
    actionType: string,
    actionId: string,
    actionFn: () => Promise<T>
  ): Promise<{ result: T; performance: ActionPerformanceData }> {
    const startTime = performance.now()
    await this.collectMetrics()

    try {
      const result = await actionFn()
      const endTime = performance.now()
      const endMetrics = await this.collectMetrics()

      const performanceData: ActionPerformanceData = {
        actionType,
        actionId,
        startTime,
        endTime,
        duration: endTime - startTime,
        success: true,
        metrics: endMetrics
      }

      this.performanceData.push(performanceData)
      return { result, performance: performanceData }

    } catch (error) {
      const endTime = performance.now()
      const endMetrics = await this.collectMetrics()

      const performanceData: ActionPerformanceData = {
        actionType,
        actionId,
        startTime,
        endTime,
        duration: endTime - startTime,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        metrics: endMetrics
      }

      this.performanceData.push(performanceData)
      throw error
    }
  }

  /**
   * Generate performance report
   */
  public generateReport(timeRange?: { start: Date; end: Date }): PerformanceReport {
    const reportId = `perf-report-${Date.now()}`
    const now = new Date()
    const defaultStart = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago

    const start = timeRange?.start || defaultStart
    const end = timeRange?.end || now

    // Filter data by time range
    const filteredData = this.performanceData.filter(data => {
      const dataTime = new Date(data.metrics.timestamp)
      return dataTime >= start && dataTime <= end
    })

    // Calculate summary
    const totalActions = filteredData.length
    const successfulActions = filteredData.filter(data => data.success)
    const averageResponseTime = totalActions > 0 
      ? filteredData.reduce((sum, data) => sum + data.duration, 0) / totalActions 
      : 0
    const successRate = totalActions > 0 ? (successfulActions.length / totalActions) * 100 : 0

    // Calculate metrics
    const currentMetrics = this.getLatestMetrics()
    const averageMetrics = this.calculateAverageMetrics(filteredData)
    const bestMetrics = this.calculateBestMetrics(filteredData)
    const worstMetrics = this.calculateWorstMetrics(filteredData)

    // Evaluate benchmarks
    const benchmarkResults = EXPERT_COUNCIL_BENCHMARKS.map(benchmark => ({
      benchmark,
      value: currentMetrics[benchmark.metric] as number,
      passed: (currentMetrics[benchmark.metric] as number) <= benchmark.threshold
    }))

    const passedBenchmarks = benchmarkResults.filter(result => result.passed).length
    const failedBenchmarks = benchmarkResults.filter(result => !result.passed).length
    const complianceScore = (passedBenchmarks / EXPERT_COUNCIL_BENCHMARKS.length) * 100

    // Generate recommendations
    const recommendations = this.generateRecommendations(benchmarkResults, averageResponseTime, successRate)

    return {
      reportId,
      timestamp: now.toISOString(),
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      summary: {
        totalActions,
        averageResponseTime,
        successRate,
        complianceScore
      },
      metrics: {
        current: currentMetrics,
        average: averageMetrics,
        best: bestMetrics,
        worst: worstMetrics
      },
      benchmarks: {
        passed: passedBenchmarks,
        failed: failedBenchmarks,
        details: benchmarkResults
      },
      recommendations
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private storedMetrics: Partial<CoreWebVitals> = {}

  private updateMetric(metric: keyof CoreWebVitals, value: number): void {
    this.storedMetrics[metric] = value
  }

  private getStoredMetric(metric: keyof CoreWebVitals): number {
    return this.storedMetrics[metric] || 0
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      lcp: 0,
      fid: 0,
      cls: 0,
      inp: 0,
      ttfb: 0,
      fcp: 0,
      loadTime: 0,
      domContentLoaded: 0,
      resourceLoadTime: 0,
      memoryUsage: 0,
      timestamp: new Date().toISOString()
    }
  }

  private getLatestMetrics(): PerformanceMetrics {
    if (this.performanceData.length === 0) {
      return this.getDefaultMetrics()
    }
    return this.performanceData[this.performanceData.length - 1].metrics
  }

  private calculateAverageMetrics(data: ActionPerformanceData[]): PerformanceMetrics {
    if (data.length === 0) return this.getDefaultMetrics()

    const sum = data.reduce((acc, item) => ({
      lcp: acc.lcp + item.metrics.lcp,
      fid: acc.fid + item.metrics.fid,
      cls: acc.cls + item.metrics.cls,
      inp: acc.inp + item.metrics.inp,
      ttfb: acc.ttfb + item.metrics.ttfb,
      fcp: acc.fcp + item.metrics.fcp,
      loadTime: acc.loadTime + item.metrics.loadTime,
      domContentLoaded: acc.domContentLoaded + item.metrics.domContentLoaded,
      resourceLoadTime: acc.resourceLoadTime + item.metrics.resourceLoadTime,
      memoryUsage: acc.memoryUsage + (item.metrics.memoryUsage || 0)
    }), {
      lcp: 0, fid: 0, cls: 0, inp: 0, ttfb: 0, fcp: 0,
      loadTime: 0, domContentLoaded: 0, resourceLoadTime: 0, memoryUsage: 0
    })

    return {
      lcp: sum.lcp / data.length,
      fid: sum.fid / data.length,
      cls: sum.cls / data.length,
      inp: sum.inp / data.length,
      ttfb: sum.ttfb / data.length,
      fcp: sum.fcp / data.length,
      loadTime: sum.loadTime / data.length,
      domContentLoaded: sum.domContentLoaded / data.length,
      resourceLoadTime: sum.resourceLoadTime / data.length,
      memoryUsage: sum.memoryUsage / data.length,
      timestamp: new Date().toISOString()
    }
  }

  private calculateBestMetrics(data: ActionPerformanceData[]): PerformanceMetrics {
    if (data.length === 0) return this.getDefaultMetrics()

    return data.reduce((best, item) => ({
      lcp: Math.min(best.lcp, item.metrics.lcp),
      fid: Math.min(best.fid, item.metrics.fid),
      cls: Math.min(best.cls, item.metrics.cls),
      inp: Math.min(best.inp, item.metrics.inp),
      ttfb: Math.min(best.ttfb, item.metrics.ttfb),
      fcp: Math.min(best.fcp, item.metrics.fcp),
      loadTime: Math.min(best.loadTime, item.metrics.loadTime),
      domContentLoaded: Math.min(best.domContentLoaded, item.metrics.domContentLoaded),
      resourceLoadTime: Math.min(best.resourceLoadTime, item.metrics.resourceLoadTime),
      memoryUsage: Math.min(best.memoryUsage || Infinity, item.metrics.memoryUsage || Infinity),
      timestamp: new Date().toISOString()
    }), data[0].metrics)
  }

  private calculateWorstMetrics(data: ActionPerformanceData[]): PerformanceMetrics {
    if (data.length === 0) return this.getDefaultMetrics()

    return data.reduce((worst, item) => ({
      lcp: Math.max(worst.lcp, item.metrics.lcp),
      fid: Math.max(worst.fid, item.metrics.fid),
      cls: Math.max(worst.cls, item.metrics.cls),
      inp: Math.max(worst.inp, item.metrics.inp),
      ttfb: Math.max(worst.ttfb, item.metrics.ttfb),
      fcp: Math.max(worst.fcp, item.metrics.fcp),
      loadTime: Math.max(worst.loadTime, item.metrics.loadTime),
      domContentLoaded: Math.max(worst.domContentLoaded, item.metrics.domContentLoaded),
      resourceLoadTime: Math.max(worst.resourceLoadTime, item.metrics.resourceLoadTime),
      memoryUsage: Math.max(worst.memoryUsage || 0, item.metrics.memoryUsage || 0),
      timestamp: new Date().toISOString()
    }), data[0].metrics)
  }

  private generateRecommendations(
    benchmarkResults: Array<{ benchmark: PerformanceBenchmark; value: number; passed: boolean }>,
    averageResponseTime: number,
    successRate: number
  ): string[] {
    const recommendations: string[] = []

    // Check failed benchmarks
    benchmarkResults.forEach(result => {
      if (!result.passed) {
        recommendations.push(
          `Improve ${result.benchmark.metric.toUpperCase()}: Current ${result.value.toFixed(2)}${result.benchmark.unit} exceeds threshold of ${result.benchmark.threshold}${result.benchmark.unit}`
        )
      }
    })

    // Check response time
    if (averageResponseTime > 2000) {
      recommendations.push('Optimize action response times: Average response time exceeds 2 second expert council requirement')
    }

    // Check success rate
    if (successRate < 95) {
      recommendations.push('Improve action reliability: Success rate below 95% threshold')
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Performance is meeting all expert council requirements - continue monitoring')
    }

    return recommendations
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const performanceMonitor = PerformanceMonitor.getInstance()
