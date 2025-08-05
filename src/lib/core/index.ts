// src/lib/core/index.ts
// Core utilities, configuration, and types

// Configuration
export * from './config'

// Utilities
export * from './utils'

// Types (selective exports to avoid conflicts)
export type {
  AutomationStatus,
  AutomationRunStatus,
  Client
} from './types/automation'
export type {
  Database
} from './types/database'
export type {
  FilterState
} from './types/filtering'
export type {
  WebhookPayload
} from './types/webhook-types'

// DAL (Data Access Layer)
export * from '../dal'
