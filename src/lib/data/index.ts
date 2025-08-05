// src/lib/data/index.ts
// Data layer: repositories, services, and stores

// Repositories
export * from './repositories/automation-repository'
export * from './repositories/notification-repository'

// Services
export * from './services/automation-service'
export * from './services/n8n-webhook-service'
export * from './services/audit-logger'
export * from './services/server-automation-service'

// Stores
export * from './stores/auth-store'
export * from './stores/automation-store'
export * from './stores/app-store'

// Mock data (selective exports to avoid conflicts)
export {
  mockAutomations,
  mockAutomationRuns,
  getAutomationsWithClients,
  formatDuration,
  formatLastRun,
  getAutomationsByStatus
} from './mock-automations'
export { mockClients as dataMockClients } from './mock-clients'
