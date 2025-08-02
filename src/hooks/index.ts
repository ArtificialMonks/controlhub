// src/hooks/index.ts
// Comprehensive barrel export for all custom hooks

// Performance hooks
export * from './usePerformanceMonitor'
export * from './useOptimizedFiltering'

// State management hooks
export * from './useFilterState'
export * from './useAutomationState'

// Utility hooks
export * from './useDebounce'
export * from './use-toast'

// Lib hooks (re-export from lib/hooks)
export * from '../lib/hooks/useAutomations'
