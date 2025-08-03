// src/components/dashboard/charts/LazyChart.tsx
'use client'

import { Suspense, lazy } from 'react'

// Lazy load chart components
export const LazyPerformanceTrendChart = lazy(() => 
  import('./EnhancedPerformanceTrendChart').then(module => ({
    default: module.EnhancedPerformanceTrendChart
  }))
)

export const LazyStatusDistributionChart = lazy(() => 
  import('./EnhancedStatusDistributionChart').then(module => ({
    default: module.EnhancedStatusDistributionChart
  }))
)

export const LazyRealTimeActivityMonitor = lazy(() => 
  import('./RealTimeActivityMonitor').then(module => ({
    default: module.RealTimeActivityMonitor
  }))
)

// Chart loading skeleton
export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`${height} w-full animate-pulse`}>
      <div className="h-full bg-gradient-to-br from-gray-200/50 to-gray-300/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg" />
    </div>
  )
}

// Wrapper component for lazy charts
export function LazyChartWrapper({ 
  children, 
  height = "h-64" 
}: { 
  children: React.ReactNode
  height?: string 
}) {
  return (
    <Suspense fallback={<ChartSkeleton height={height} />}>
      {children}
    </Suspense>
  )
}