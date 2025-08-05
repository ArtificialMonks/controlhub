// src/lib/infrastructure/index.ts
// Infrastructure: monitoring, security, and performance

// Monitoring (selective exports to avoid conflicts)
export {
  logger,
  LogLevel,
  Logger,
  MetricsCollector,
  PerformanceMonitor
} from './monitoring/logger'
export * from './monitoring/production-setup'

// Security
export * from './security/encryption'
export * from './security/edge-encryption'
export * from './security/filterSecurity'
export * from './security/enhanced-analytics-security'

// Performance (selective exports to avoid conflicts)
export * from './performance/optimization'
export {
  performanceMonitor as infraPerformanceMonitor,
  usePerformanceMonitor as useInfraPerformanceMonitor
} from './performance/monitor'
export * from './performance/filterBenchmarks'
export * from './performance/webhook-performance-monitor'
export * from './performance/enhanced-analytics-performance'

// Advanced monitoring
export * from '../advanced-monitoring'
