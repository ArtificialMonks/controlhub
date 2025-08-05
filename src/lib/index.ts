// src/lib/index.ts
// Focused domain-based exports

// Core utilities, configuration, and types
export * from './core'

// Data layer: repositories, services, and stores
export * from './data'

// Infrastructure: monitoring, security, and performance (selective exports to avoid conflicts)
export {
  logger,
  LogLevel,
  Logger as InfraLogger,
  MetricsCollector,
  PerformanceMonitor as InfraPerformanceMonitor
} from './infrastructure'

// External integrations
export * from './integrations'

// Remaining modules (to be organized)
export * from './hooks/useAutomations'
export * from './actions/auth'
export * from './accessibility/wcagAudit'
export * from './accessibility/accessibilityFixes'
export * from './memory/knowledgeMemorization'
export * from './integration/integrationValidator'
export * from './deployment/rollbackManager'
export * from './mobile/mobileValidation'
export * from './middleware/error-handler'
export * from './verification/formalVerification'
export * from './termination/autonomousTermination'
export * from './animations/sidebar-animations'

// Development tools (only in development)
// Note: These should be imported directly when needed, not through this barrel
// export * from './development'