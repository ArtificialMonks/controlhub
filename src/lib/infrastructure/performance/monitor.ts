// src/lib/infrastructure/performance/monitor.ts
"use client"

import { useEffect } from 'react'

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  type: 'navigation' | 'resource' | 'paint' | 'measure'
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observer: PerformanceObserver | null = null

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObserver()
    }
  }

  private initializeObserver() {
    try {
      // Observe different performance entry types
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: entry.name,
            value: entry.duration || entry.startTime,
            timestamp: Date.now(),
            type: entry.entryType as 'navigation' | 'resource' | 'paint' | 'measure'
          })
        }
      })

      // Observe paint timing
      this.observer.observe({ entryTypes: ['paint', 'navigation', 'measure'] })
    } catch (error) {
      console.error('Failed to initialize performance observer:', error)
    }
  }

  // Record a custom metric
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    
    // Log important metrics
    if (metric.type === 'paint' || metric.name === 'first-contentful-paint') {
      console.log(`Performance: ${metric.name} - ${metric.value.toFixed(2)}ms`)
    }
  }

  // Measure component render time
  measureComponent(componentName: string, callback: () => void) {
    const startMark = `${componentName}-start`
    const endMark = `${componentName}-end`
    const measureName = `${componentName}-render`

    performance.mark(startMark)
    callback()
    performance.mark(endMark)
    
    try {
      performance.measure(measureName, startMark, endMark)
      const measure = performance.getEntriesByName(measureName)[0]
      
      if (measure) {
        this.recordMetric({
          name: measureName,
          value: measure.duration,
          timestamp: Date.now(),
          type: 'measure'
        })
      }
    } catch (error) {
      console.error('Failed to measure performance:', error)
    } finally {
      // Clean up marks
      performance.clearMarks(startMark)
      performance.clearMarks(endMark)
      performance.clearMeasures(measureName)
    }
  }

  // Get Core Web Vitals
  getCoreWebVitals() {
    if (typeof window === 'undefined') return null

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paintEntries = performance.getEntriesByType('paint')

    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    const lcp = this.metrics.find(m => m.name.includes('largest-contentful-paint'))

    return {
      // First Contentful Paint
      FCP: fcp ? fcp.startTime : null,
      // Largest Contentful Paint (would need additional library like web-vitals)
      LCP: lcp ? lcp.value : null,
      // Time to First Byte
      TTFB: navigation ? navigation.responseStart - navigation.requestStart : null,
      // DOM Content Loaded
      DCL: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : null,
      // Load Complete
      LoadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : null
    }
  }

  // Get performance summary
  getSummary() {
    const vitals = this.getCoreWebVitals()
    const componentMetrics = this.metrics
      .filter(m => m.type === 'measure')
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 slowest components

    return {
      vitals,
      slowestComponents: componentMetrics,
      totalMetrics: this.metrics.length
    }
  }

  // Clear metrics
  clear() {
    this.metrics = []
  }

  // Cleanup
  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Hook for React components
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      performanceMonitor.recordMetric({
        name: `${componentName}-lifecycle`,
        value: duration,
        timestamp: Date.now(),
        type: 'measure'
      })
    }
  }, [componentName])
}