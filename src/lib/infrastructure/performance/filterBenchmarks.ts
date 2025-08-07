// src/lib/infrastructure/performance/filterBenchmarks.ts
/**
 * Filter Performance Benchmarking Utilities
 * Quest 4.3 - Expert Council Validated Implementation
 * 
 * Important Enhancement: Performance Monitoring & Benchmarking
 * Expert Consensus: 100% (6/6 experts)
 * Priority: MEDIUM
 */

import { Automation, Client } from '../../core/types/automation'
import FilterSecurityValidator from '../security/filterSecurity'

// ============================================================================
// BENCHMARK CONFIGURATION
// ============================================================================

interface BenchmarkConfig {
  /** Number of iterations to run for each test */
  iterations: number
  /** Warmup iterations before actual measurement */
  warmupIterations: number
  /** Enable garbage collection between tests (if available) */
  enableGC: boolean
  /** Enable detailed memory tracking */
  trackMemory: boolean
}

const DEFAULT_BENCHMARK_CONFIG: BenchmarkConfig = {
  iterations: 100,
  warmupIterations: 10,
  enableGC: true,
  trackMemory: true
}

// ============================================================================
// BENCHMARK RESULT INTERFACES
// ============================================================================

interface BenchmarkResult {
  testName: string
  averageDuration: number
  minDuration: number
  maxDuration: number
  standardDeviation: number
  operationsPerSecond: number
  memoryUsage?: {
    before: number
    after: number
    delta: number
  }
  iterations: number
  timestamp: Date
}

interface BenchmarkSuite {
  suiteName: string
  results: BenchmarkResult[]
  totalDuration: number
  summary: {
    fastestTest: string
    slowestTest: string
    averageOpsPerSecond: number
    totalOperations: number
  }
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

/**
 * Generate mock automations for benchmarking
 */
function generateMockAutomations(count: number): Automation[] {
  const automations: Automation[] = []
  const statuses = ['Running', 'Stopped', 'Error', 'Stalled'] as const
  const clientIds = Array.from({ length: Math.min(count / 10, 50) }, (_, i) => `client-${i + 1}`)

  for (let i = 0; i < count; i++) {
    automations.push({
      id: `automation-${i + 1}`,
      user_id: `user-${Math.floor(i / 10) + 1}`,
      client_id: clientIds[i % clientIds.length],
      name: `Test Automation ${i + 1}`,
      status: statuses[i % statuses.length],
      last_run_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      avg_duration_ms: Math.floor(Math.random() * 10000),
      success_rate: Math.round(Math.random() * 100),
      n8n_run_webhook_url: `https://api.example.com/webhook/${i + 1}`,
      n8n_stop_webhook_url: `https://api.example.com/stop/${i + 1}`
    })
  }

  return automations
}

/**
 * Generate mock clients for benchmarking
 */
function generateMockClients(count: number): Client[] {
  const clients: Client[] = []

  for (let i = 0; i < count; i++) {
    clients.push({
      id: `client-${i + 1}`,
      name: `Test Client ${i + 1}`,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    })
  }

  return clients
}

// ============================================================================
// BENCHMARK UTILITIES
// ============================================================================

/**
 * Force garbage collection if available
 */
function forceGC(): void {
  if (typeof window !== 'undefined' && 'gc' in window) {
    (window as unknown as { gc: () => void }).gc()
  }
}

/**
 * Get memory usage
 */
function getMemoryUsage(): number {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
    const memory = (window.performance as unknown as { memory: { usedJSHeapSize: number } }).memory
    return memory.usedJSHeapSize
  }
  return 0
}

/**
 * Calculate standard deviation
 */
function calculateStandardDeviation(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2))
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length
  return Math.sqrt(avgSquaredDiff)
}

// ============================================================================
// FILTERING BENCHMARK FUNCTIONS
// ============================================================================

/**
 * Benchmark search filtering performance
 */
function benchmarkSearchFilter(
  automations: Automation[],
  clients: Client[],
  _searchTerms: string[],
  securityValidator: FilterSecurityValidator
): (searchTerm: string) => number {
  const clientsMap = new Map(clients.map(client => [client.id, client]))

  return (searchTerm: string): number => {
    const startTime = performance.now()

    // Security validation
    const sanitizedInput = securityValidator.sanitizeSearchInput(searchTerm)
    const sanitizedTerm = sanitizedInput.sanitized.toLowerCase()

    if (!sanitizedTerm) {
      return performance.now() - startTime
    }

    // Filtering operation
    automations.filter(automation => {
      const nameMatch = automation.name.toLowerCase().includes(sanitizedTerm)
      const client = clientsMap.get(automation.client_id)
      const clientMatch = client ? client.name.toLowerCase().includes(sanitizedTerm) : false
      return nameMatch || clientMatch
    })

    const endTime = performance.now()
    return endTime - startTime
  }
}

/**
 * Benchmark client filtering performance
 */
function benchmarkClientFilter(
  automations: Automation[],
  _clientIds: string[]
): (clientId: string) => number {
  return (clientId: string): number => {
    const startTime = performance.now()

    automations.filter(automation => automation.client_id === clientId)

    const endTime = performance.now()
    return endTime - startTime
  }
}

/**
 * Benchmark status filtering performance
 */
function benchmarkStatusFilter(
  automations: Automation[],
  _statusCombinations: string[][]
): (statuses: string[]) => number {
  return (statuses: string[]): number => {
    const startTime = performance.now()

    automations.filter(automation => 
      statuses.length === 0 || statuses.includes(automation.status)
    )

    const endTime = performance.now()
    return endTime - startTime
  }
}

// ============================================================================
// BENCHMARK RUNNER
// ============================================================================

/**
 * Run a single benchmark test
 */
async function runBenchmarkTest(
  testName: string,
  testFunction: () => number,
  config: BenchmarkConfig
): Promise<BenchmarkResult> {
  const durations: number[] = []
  let memoryBefore = 0
  let memoryAfter = 0

  // Warmup iterations
  for (let i = 0; i < config.warmupIterations; i++) {
    testFunction()
  }

  // Force GC before measurement
  if (config.enableGC) {
    forceGC()
    await new Promise(resolve => setTimeout(resolve, 10))
  }

  // Memory measurement before
  if (config.trackMemory) {
    memoryBefore = getMemoryUsage()
  }

  // Actual benchmark iterations
  for (let i = 0; i < config.iterations; i++) {
    const duration = testFunction()
    durations.push(duration)

    // Small delay to prevent overwhelming the system
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1))
    }
  }

  // Memory measurement after
  if (config.trackMemory) {
    memoryAfter = getMemoryUsage()
  }

  // Calculate statistics
  const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length
  const minDuration = Math.min(...durations)
  const maxDuration = Math.max(...durations)
  const standardDeviation = calculateStandardDeviation(durations)
  const operationsPerSecond = 1000 / averageDuration

  return {
    testName,
    averageDuration,
    minDuration,
    maxDuration,
    standardDeviation,
    operationsPerSecond,
    memoryUsage: config.trackMemory ? {
      before: memoryBefore,
      after: memoryAfter,
      delta: memoryAfter - memoryBefore
    } : undefined,
    iterations: config.iterations,
    timestamp: new Date()
  }
}

// ============================================================================
// COMPREHENSIVE BENCHMARK SUITE
// ============================================================================

/**
 * Run comprehensive filtering performance benchmarks
 */
export async function runFilteringBenchmarks(
  datasetSizes: number[] = [100, 500, 1000, 5000],
  config: Partial<BenchmarkConfig> = {}
): Promise<BenchmarkSuite> {
  const benchmarkConfig = { ...DEFAULT_BENCHMARK_CONFIG, ...config }
  const results: BenchmarkResult[] = []
  const suiteStartTime = performance.now()

  console.log('🚀 Starting Filtering Performance Benchmarks...')

  for (const datasetSize of datasetSizes) {
    console.log(`📊 Testing with ${datasetSize} automations...`)

    // Generate test data
    const automations = generateMockAutomations(datasetSize)
    const clients = generateMockClients(Math.ceil(datasetSize / 10))
    const securityValidator = new FilterSecurityValidator()

    // Test data
    const searchTerms = ['test', 'automation', 'client', 'workflow', 'api']
    const clientIds = clients.slice(0, 5).map(c => c.id)
    const statusCombinations = [
      ['Running'],
      ['Running', 'Stopped'],
      ['Error', 'Stalled'],
      ['Running', 'Stopped', 'Error']
    ]

    // Search filtering benchmarks
    const searchFilterFn = benchmarkSearchFilter(automations, clients, searchTerms, securityValidator)
    for (const searchTerm of searchTerms) {
      const result = await runBenchmarkTest(
        `Search Filter (${datasetSize} items, "${searchTerm}")`,
        () => searchFilterFn(searchTerm),
        benchmarkConfig
      )
      results.push(result)
    }

    // Client filtering benchmarks
    const clientFilterFn = benchmarkClientFilter(automations, clientIds)
    for (const clientId of clientIds.slice(0, 3)) {
      const result = await runBenchmarkTest(
        `Client Filter (${datasetSize} items, "${clientId}")`,
        () => clientFilterFn(clientId),
        benchmarkConfig
      )
      results.push(result)
    }

    // Status filtering benchmarks
    const statusFilterFn = benchmarkStatusFilter(automations, statusCombinations)
    for (const statuses of statusCombinations.slice(0, 2)) {
      const result = await runBenchmarkTest(
        `Status Filter (${datasetSize} items, [${statuses.join(', ')}])`,
        () => statusFilterFn(statuses),
        benchmarkConfig
      )
      results.push(result)
    }
  }

  const totalDuration = performance.now() - suiteStartTime

  // Calculate summary
  const fastestTest = results.length > 0 ? results.reduce((fastest, current) =>
    current.averageDuration < fastest.averageDuration ? current : fastest
  ) : null
  const slowestTest = results.length > 0 ? results.reduce((slowest, current) =>
    current.averageDuration > slowest.averageDuration ? current : slowest
  ) : null
  const averageOpsPerSecond = results.length > 0 ? results.reduce((sum, result) => sum + result.operationsPerSecond, 0) / results.length : 0
  const totalOperations = results.reduce((sum, result) => sum + result.iterations, 0)

  console.log('✅ Filtering Performance Benchmarks Complete!')
  console.log(`📈 Total Duration: ${totalDuration.toFixed(2)}ms`)
  console.log(`⚡ Average Ops/Second: ${averageOpsPerSecond.toFixed(2)}`)

  return {
    suiteName: 'Filtering Performance Benchmarks',
    results,
    totalDuration,
    summary: {
      fastestTest: fastestTest?.testName || 'No tests run',
      slowestTest: slowestTest?.testName || 'No tests run',
      averageOpsPerSecond,
      totalOperations
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { BenchmarkResult, BenchmarkSuite, BenchmarkConfig }
export default runFilteringBenchmarks
