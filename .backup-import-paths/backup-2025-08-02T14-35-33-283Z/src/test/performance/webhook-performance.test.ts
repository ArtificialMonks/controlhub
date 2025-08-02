// src/test/performance/webhook-performance.test.ts
// Implements Expert Council P1 recommendation for performance validation
// Quality Expert consensus: comprehensive testing with performance benchmarks

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { WebhookPerformanceAnalyzer } from '@/lib/performance/webhook-performance-monitor'

// Test configuration
const TEST_CONFIG = {
  // Expert Council threshold: API response < 200ms
  MAX_RESPONSE_TIME_MS: 200,
  // Database operation threshold: < 50ms
  MAX_DATABASE_TIME_MS: 50,
  // Authentication threshold: < 20ms
  MAX_AUTH_TIME_MS: 20,
  // Validation threshold: < 10ms
  MAX_VALIDATION_TIME_MS: 10,
  // Performance test iterations
  PERFORMANCE_TEST_ITERATIONS: 10,
}

// Test webhook endpoint
const WEBHOOK_ENDPOINT = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/n8n`
  : 'http://localhost:3000/api/webhooks/n8n'

// Test authentication secret
const TEST_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || 'test-secret'

// Test payload
const TEST_PAYLOAD = {
  automation_id: 'test-automation-id',
  user_id: 'test-user-id',
  execution_id: 'test-execution-id',
  final_status: 'success' as const,
  execution_time_ms: 1500,
  error_message: null,
}

describe('Webhook Performance Benchmarks', () => {
  let supabase: ReturnType<typeof createClient>

  beforeAll(async () => {
    // Initialize Supabase client for performance data analysis
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  })

  afterAll(async () => {
    // Clean up test performance data
    await supabase
      .from('webhook_performance_logs')
      .delete()
      .like('request_id', 'test-%')
  })

  describe('API Response Time Performance', () => {
    test('should respond within Expert Council threshold (< 200ms)', async () => {
      const startTime = performance.now()
      
      const response = await fetch(WEBHOOK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_WEBHOOK_SECRET}`,
        },
        body: JSON.stringify(TEST_PAYLOAD),
      })
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(TEST_CONFIG.MAX_RESPONSE_TIME_MS)
      
      console.log(`✅ API Response Time: ${responseTime.toFixed(2)}ms (threshold: ${TEST_CONFIG.MAX_RESPONSE_TIME_MS}ms)`)
    }, 10000)

    test('should maintain consistent performance under load', async () => {
      const responseTimes: number[] = []
      
      // Run multiple iterations to test consistency
      for (let i = 0; i < TEST_CONFIG.PERFORMANCE_TEST_ITERATIONS; i++) {
        const startTime = performance.now()
        
        const response = await fetch(WEBHOOK_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TEST_WEBHOOK_SECRET}`,
          },
          body: JSON.stringify({
            ...TEST_PAYLOAD,
            execution_id: `test-execution-${i}`,
          }),
        })
        
        const endTime = performance.now()
        const responseTime = endTime - startTime
        responseTimes.push(responseTime)
        
        expect(response.status).toBe(200)
      }
      
      // Calculate performance statistics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      const maxResponseTime = Math.max(...responseTimes)
      const minResponseTime = Math.min(...responseTimes)
      
      // Validate performance consistency
      expect(avgResponseTime).toBeLessThan(TEST_CONFIG.MAX_RESPONSE_TIME_MS)
      expect(maxResponseTime).toBeLessThan(TEST_CONFIG.MAX_RESPONSE_TIME_MS * 1.5) // Allow 50% variance
      
      console.log(`📊 Performance Statistics:`)
      console.log(`   Average: ${avgResponseTime.toFixed(2)}ms`)
      console.log(`   Min: ${minResponseTime.toFixed(2)}ms`)
      console.log(`   Max: ${maxResponseTime.toFixed(2)}ms`)
      console.log(`   Iterations: ${TEST_CONFIG.PERFORMANCE_TEST_ITERATIONS}`)
    }, 30000)
  })

  describe('Database Performance Validation', () => {
    test('should validate RLS policy optimization performance', async () => {
      // Test RLS policy performance with function wrapping
      const { data: rlsValidation, error } = await supabase
        .rpc('validate_rls_performance')
      
      expect(error).toBeNull()
      expect(rlsValidation).toBeDefined()
      expect(Array.isArray(rlsValidation)).toBe(true)
      expect(rlsValidation.length).toBeGreaterThan(0)
      
      // Validate that all tables have optimized policies
      const expectedTables = ['automations', 'automation_runs', 'automation_telemetry']
      const validatedTables = rlsValidation.map((row: { table_name: string }) => row.table_name)

      expectedTables.forEach(table => {
        expect(validatedTables).toContain(table)
      })

      console.log('✅ RLS Policy Optimization Validated:')
      rlsValidation.forEach((row: { table_name: string; estimated_performance_improvement: string }) => {
        console.log(`   ${row.table_name}: ${row.estimated_performance_improvement}`)
      })
    })

    test('should validate database index effectiveness', async () => {
      // Test that required indexes exist and are being used
      const { data: indexes, error } = await supabase
        .from('pg_indexes')
        .select('indexname, tablename')
        .in('tablename', ['automations', 'automation_runs', 'automation_telemetry'])
        .like('indexname', 'idx_%')
      
      expect(error).toBeNull()
      expect(indexes).toBeDefined()
      expect(Array.isArray(indexes)).toBe(true)
      
      // Validate critical indexes exist
      const indexNames = indexes.map((idx) => (idx as { indexname: string }).indexname)
      const requiredIndexes = [
        'idx_automation_runs_user_id',
        'idx_automations_user_id',
        'idx_automation_runs_automation_id',
      ]

      requiredIndexes.forEach(requiredIndex => {
        expect(indexNames).toContain(requiredIndex)
      })

      console.log('✅ Database Indexes Validated:')
      indexes.forEach((idx) => {
        const typedIdx = idx as { tablename: string; indexname: string }
        console.log(`   ${typedIdx.tablename}.${typedIdx.indexname}`)
      })
    })
  })

  describe('Performance Monitoring Integration', () => {
    test('should store performance metrics in database', async () => {
      // Make a webhook request to generate performance data
      const testRequestId = `test-perf-${Date.now()}`
      
      const response = await fetch(WEBHOOK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_WEBHOOK_SECRET}`,
        },
        body: JSON.stringify({
          ...TEST_PAYLOAD,
          execution_id: testRequestId,
        }),
      })
      
      expect(response.status).toBe(200)
      
      // Wait for performance data to be stored
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verify performance data was stored
      const { data: performanceData, error } = await supabase
        .from('webhook_performance_logs')
        .select('*')
        .eq('endpoint_path', '/api/webhooks/n8n')
        .order('request_timestamp', { ascending: false })
        .limit(1)
      
      expect(error).toBeNull()
      expect(performanceData).toBeDefined()
      expect(performanceData).not.toBeNull()
      expect(performanceData!.length).toBeGreaterThan(0)

      const latestMetrics = performanceData![0]
      expect(latestMetrics.response_time_ms).toBeDefined()
      expect(latestMetrics.response_time_ms).toBeGreaterThan(0)
      expect(latestMetrics.status_code).toBe(200)
      
      console.log('✅ Performance Metrics Stored:')
      console.log(`   Response Time: ${latestMetrics.response_time_ms}ms`)
      console.log(`   Auth Time: ${latestMetrics.authentication_time_ms || 'N/A'}ms`)
      console.log(`   DB Time: ${latestMetrics.database_time_ms || 'N/A'}ms`)
    })

    test('should provide performance analysis through analyzer', async () => {
      // Test performance analyzer functionality
      const performanceSummary = await WebhookPerformanceAnalyzer.getEndpointPerformanceSummary(
        '/api/webhooks/n8n',
        1 // Last 1 hour
      )
      
      expect(performanceSummary).toBeDefined()
      
      if (performanceSummary) {
        expect(performanceSummary.totalRequests).toBeGreaterThanOrEqual(0)
        expect(performanceSummary.avgResponseTimeMs).toBeGreaterThanOrEqual(0)
        expect(performanceSummary.successRate).toBeGreaterThanOrEqual(0)
        expect(performanceSummary.successRate).toBeLessThanOrEqual(100)
        
        console.log('✅ Performance Analysis Summary:')
        console.log(`   Total Requests: ${performanceSummary.totalRequests}`)
        console.log(`   Avg Response Time: ${performanceSummary.avgResponseTimeMs}ms`)
        console.log(`   P95 Response Time: ${performanceSummary.p95ResponseTimeMs}ms`)
        console.log(`   Success Rate: ${performanceSummary.successRate}%`)
        console.log(`   Error Count: ${performanceSummary.errorCount}`)
      }
    })
  })

  describe('Performance Threshold Validation', () => {
    test('should validate all performance thresholds are met', async () => {
      // Get recent performance data
      const { data: recentMetrics, error } = await supabase
        .from('webhook_performance_logs')
        .select('*')
        .eq('endpoint_path', '/api/webhooks/n8n')
        .gte('request_timestamp', new Date(Date.now() - 60000).toISOString()) // Last minute
        .order('request_timestamp', { ascending: false })
      
      expect(error).toBeNull()
      
      if (recentMetrics && recentMetrics.length > 0) {
        recentMetrics.forEach((metrics) => {
          const typedMetrics = metrics as {
            response_time_ms: number;
            database_time_ms?: number;
            authentication_time_ms?: number;
            validation_time_ms?: number;
          }

          // Validate Expert Council thresholds
          expect(typedMetrics.response_time_ms).toBeLessThan(TEST_CONFIG.MAX_RESPONSE_TIME_MS)

          if (typedMetrics.database_time_ms) {
            expect(typedMetrics.database_time_ms).toBeLessThan(TEST_CONFIG.MAX_DATABASE_TIME_MS)
          }

          if (typedMetrics.authentication_time_ms) {
            expect(typedMetrics.authentication_time_ms).toBeLessThan(TEST_CONFIG.MAX_AUTH_TIME_MS)
          }

          if (typedMetrics.validation_time_ms) {
            expect(typedMetrics.validation_time_ms).toBeLessThan(TEST_CONFIG.MAX_VALIDATION_TIME_MS)
          }
        })
        
        console.log(`✅ All ${recentMetrics.length} recent requests meet performance thresholds`)
      }
    })
  })
})
