// src/lib/index.ts
// Comprehensive barrel export for all lib modules

// Core utilities and configurations
export * from './utils'
export * from './config'
export * from './dal'

// Performance monitoring
export * from './performance-optimization'
export * from './performance-monitor'
export * from './advanced-monitoring'

// Services
export * from './services/automation-service'
export * from './services/n8n-webhook-service'
export * from './services/audit-logger'
export * from './services/server-automation-service'

// Security
export * from './security/encryption'
export * from './security/filterSecurity'

// Stores
export * from './stores/auth-store'
export * from './stores/automation-store'
export * from './stores/app-store'

// Repositories
export * from './repositories/automation-repository'

// Hooks
export * from './hooks/useAutomations'

// Data
export { mockClients as libMockClients } from './data/mock-clients'
export {
  mockClients,
  mockProfiles,
  mockAutomations,
  mockAutomationRuns,
  getAutomationsWithClients,
  formatDuration,
  formatLastRun,
  getAutomationsByStatus
} from './data/mock-automations'

// Utilities
export { formatDate, formatDateTime, getRelativeTime } from './utils/date-formatting'

// Monitoring and logging
export { logger, LogLevel, Logger, MetricsCollector, PerformanceMonitor } from './monitoring/logger'
export { createProductionLogger, initializeProductionMonitoring, monitorApiEndpoint, monitorDatabaseQuery, productionLoggingConfig } from './monitoring/production-setup'

// Quality and testing
export * from './quality/mutationTesting'
export * from './quality/codeQualityMonitor'

// Architecture
export * from './architecture/designPatternValidator'

// Accessibility
export * from './accessibility/wcagAudit'
export * from './accessibility/accessibilityFixes'

// Memory and knowledge
export * from './memory/knowledgeMemorization'

// Integration
export * from './integration/integrationValidator'

// Deployment
export * from './deployment/rollbackManager'

// Protocol
export * from './protocol/avariceProtocolValidator'

// Performance
export * from './performance/filterBenchmarks'
export * from './performance/webhook-performance-monitor'

// Mobile
export * from './mobile/mobileValidation'

// Middleware
export * from './middleware/error-handler'

// Verification
export * from './verification/formalVerification'

// Termination
export * from './termination/autonomousTermination'

// Supabase
export * from './supabase/client'