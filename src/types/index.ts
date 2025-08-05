// src/types/index.ts
// Comprehensive barrel export for all type definitions

// Core automation types
export type { Automation, AutomationRun, AutomationRunStatus, AutomationStatus, Client } from '../lib/core/types/automation'

// Filtering types
export type {
  FilterState,
  FilterStateUpdate,
  FilterStateActions,
  FilterStateHook,
  FilterFunction,
  FilterContainerProps,
  FilterPresentationProps,
  ToolbarProps,
  FilterError,
  ErrorBoundaryProps,
  ErrorBoundaryConfig
} from '../lib/core/types/filtering'

// Database types
export type { Database, Json, Tables, TablesInsert, TablesUpdate } from '../lib/core/types/database'

// Webhook types
export type {
  WebhookResponse,
  AutomationMetrics,
  AutomationNotFoundError,
  CreateAutomationRunRequest,
  RepositoryError,
  UpdateAutomationRequest
} from '../lib/core/types/webhook-types'
