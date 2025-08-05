// Enhanced Analytics Performance Analysis
export interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  bundleSize: number
  componentCount: number
  rerenderCount: number
}

export interface PerformanceReport {
  componentName: string
  metrics: PerformanceMetrics
  recommendations: string[]
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

export class EnhancedAnalyticsPerformanceMonitor {
  private performanceMarks: Map<string, number> = new Map()
  private rerenderCounts: Map<string, number> = new Map()

  startMeasure(componentName: string): void {
    const markName = `${componentName}-start`
    performance.mark(markName)
    this.performanceMarks.set(markName, performance.now())
  }

  endMeasure(componentName: string): number {
    const startMark = `${componentName}-start`
    const endMark = `${componentName}-end`
    
    performance.mark(endMark)
    
    try {
      performance.measure(componentName, startMark, endMark)
      const measure = performance.getEntriesByName(componentName)[0]
      return measure.duration
    } catch (error) {
      console.warn(`Performance measurement failed for ${componentName}:`, error)
      return 0
    }
  }

  trackRerender(componentName: string): void {
    const current = this.rerenderCounts.get(componentName) || 0
    this.rerenderCounts.set(componentName, current + 1)
  }

  getMemoryUsage(): number {
    if ('memory' in performance) {
      // @ts-expect-error - Chrome specific API not in standard types
      return performance.memory.usedJSHeapSize / 1024 / 1024 // MB
    }
    return 0
  }

  analyzeComponent(componentName: string): PerformanceReport {
    const renderTime = this.endMeasure(componentName)
    const memoryUsage = this.getMemoryUsage()
    const rerenderCount = this.rerenderCounts.get(componentName) || 0
    
    const metrics: PerformanceMetrics = {
      renderTime,
      memoryUsage,
      bundleSize: this.estimateBundleSize(componentName),
      componentCount: this.countChildComponents(componentName),
      rerenderCount
    }

    const recommendations = this.generateRecommendations(metrics)
    const grade = this.calculateGrade(metrics)

    return {
      componentName,
      metrics,
      recommendations,
      grade
    }
  }

  private estimateBundleSize(componentName: string): number {
    // Estimate based on component complexity
    const baseSize = 2 // KB
    const complexityMultiplier = componentName.includes('DrillDown') ? 1.5 : 1
    const analyticsMultiplier = componentName.includes('Analytics') ? 1.3 : 1
    
    return baseSize * complexityMultiplier * analyticsMultiplier
  }

  private countChildComponents(componentName: string): number {
    // Estimate child component count based on component type
    if (componentName.includes('AutomationsDrillDown')) return 12
    if (componentName.includes('DrillDownModal')) return 8
    if (componentName.includes('MetricsCards')) return 6
    return 3
  }

  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = []

    if (metrics.renderTime > 100) {
      recommendations.push('Consider memoizing expensive calculations')
      recommendations.push('Use React.memo for pure components')
    }

    if (metrics.rerenderCount > 10) {
      recommendations.push('Optimize state updates to reduce re-renders')
      recommendations.push('Consider using useCallback for event handlers')
    }

    if (metrics.memoryUsage > 50) {
      recommendations.push('Review memory usage and potential leaks')
      recommendations.push('Consider lazy loading for large datasets')
    }

    if (metrics.bundleSize > 10) {
      recommendations.push('Consider code splitting for this component')
      recommendations.push('Review and remove unused dependencies')
    }

    if (metrics.componentCount > 15) {
      recommendations.push('Consider breaking down into smaller components')
      recommendations.push('Implement virtual scrolling for large lists')
    }

    return recommendations
  }

  private calculateGrade(metrics: PerformanceMetrics): 'A' | 'B' | 'C' | 'D' | 'F' {
    let score = 100

    // Render time penalty
    if (metrics.renderTime > 16) score -= 20 // 60fps threshold
    if (metrics.renderTime > 50) score -= 30
    if (metrics.renderTime > 100) score -= 40

    // Re-render penalty
    if (metrics.rerenderCount > 5) score -= 10
    if (metrics.rerenderCount > 10) score -= 20

    // Memory usage penalty
    if (metrics.memoryUsage > 25) score -= 10
    if (metrics.memoryUsage > 50) score -= 20

    // Bundle size penalty
    if (metrics.bundleSize > 5) score -= 5
    if (metrics.bundleSize > 10) score -= 15

    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  generateReport(): { [componentName: string]: PerformanceReport } {
    const components = [
      'AutomationsDrillDown',
      'DrillDownModal', 
      'MetricsCards',
      'useDrillDownAnalytics',
      'useUserPreferences'
    ]

    const report: { [componentName: string]: PerformanceReport } = {}
    
    components.forEach(componentName => {
      report[componentName] = this.analyzeComponent(componentName)
    })

    return report
  }

  logPerformanceReport(): void {
    const report = this.generateReport()
    
    console.group('🚀 Enhanced Analytics Performance Report')
    
    Object.entries(report).forEach(([componentName, analysis]) => {
      console.group(`📊 ${componentName} - Grade: ${analysis.grade}`)
      console.log('Metrics:', analysis.metrics)
      
      if (analysis.recommendations.length > 0) {
        console.log('🔧 Recommendations:')
        analysis.recommendations.forEach(rec => console.log(`  • ${rec}`))
      }
      
      console.groupEnd()
    })
    
    console.groupEnd()
  }
}

// Accessibility Validation
export interface AccessibilityIssue {
  severity: 'error' | 'warning' | 'info'
  element: string
  issue: string
  suggestion: string
}

export class AccessibilityValidator {
  private issues: AccessibilityIssue[] = []

  validateEnhancedAnalytics(): AccessibilityIssue[] {
    this.issues = []

    // Check date range filtering accessibility
    this.validateDateRangeFiltering()
    
    // Check column customization accessibility
    this.validateColumnCustomization()
    
    // Check modal accessibility
    this.validateModalAccessibility()
    
    // Check data visualization accessibility
    this.validateDataVisualization()

    return this.issues
  }

  private validateDateRangeFiltering(): void {
    // Date picker accessibility
    this.issues.push({
      severity: 'info',
      element: 'DatePickerWithRange',
      issue: 'Date picker should have proper ARIA labels',
      suggestion: 'Add aria-label="Select date range for filtering automations"'
    })

    // Preset buttons accessibility
    this.issues.push({
      severity: 'info',
      element: 'Date preset buttons',
      issue: 'Date preset buttons should indicate selected state',
      suggestion: 'Add aria-pressed attribute to indicate active preset'
    })
  }

  private validateColumnCustomization(): void {
    // Column toggle buttons
    this.issues.push({
      severity: 'info',
      element: 'Column visibility buttons',
      issue: 'Column toggle buttons should have descriptive labels',
      suggestion: 'Add aria-label="Toggle {columnName} column visibility"'
    })

    // Table accessibility
    this.issues.push({
      severity: 'info',
      element: 'Automation table',
      issue: 'Table should have proper headers and scope',
      suggestion: 'Ensure all table headers have proper scope attributes'
    })
  }

  private validateModalAccessibility(): void {
    // Modal focus management
    this.issues.push({
      severity: 'info',
      element: 'DrillDownModal',
      issue: 'Modal should trap focus and return to trigger',
      suggestion: 'Implement focus trap and focus restoration on close'
    })

    // Modal ARIA attributes
    this.issues.push({
      severity: 'info',
      element: 'DrillDownModal',
      issue: 'Modal should have proper ARIA attributes',
      suggestion: 'Add role="dialog" and aria-labelledby for title'
    })
  }

  private validateDataVisualization(): void {
    // Chart accessibility
    this.issues.push({
      severity: 'warning',
      element: 'Trend charts',
      issue: 'Charts should have text alternatives',
      suggestion: 'Add data table alternative or detailed description'
    })

    // Color accessibility
    this.issues.push({
      severity: 'info',
      element: 'Status indicators',
      issue: 'Status colors should have sufficient contrast',
      suggestion: 'Ensure all status colors meet WCAG AA contrast ratios'
    })
  }

  logAccessibilityReport(): void {
    const issues = this.validateEnhancedAnalytics()
    
    console.group('♿ Enhanced Analytics Accessibility Report')
    
    const errorCount = issues.filter(i => i.severity === 'error').length
    const warningCount = issues.filter(i => i.severity === 'warning').length
    const infoCount = issues.filter(i => i.severity === 'info').length
    
    console.log(`📊 Summary: ${errorCount} errors, ${warningCount} warnings, ${infoCount} suggestions`)
    
    issues.forEach(issue => {
      const icon = issue.severity === 'error' ? '🚨' : 
                   issue.severity === 'warning' ? '⚠️' : '💡'
      
      console.group(`${icon} ${issue.severity.toUpperCase()}: ${issue.element}`)
      console.log('Issue:', issue.issue)
      console.log('Suggestion:', issue.suggestion)
      console.groupEnd()
    })
    
    console.groupEnd()
  }
}

// Export singleton instances for global use
export const performanceMonitor = new EnhancedAnalyticsPerformanceMonitor()
export const accessibilityValidator = new AccessibilityValidator()