// src/test/monitoring/advanced-monitoring.test.ts
/**
 * Advanced Monitoring & Documentation Tests - Quest 4.4
 * Validates expert council monitoring and documentation implementation
 * Tests system monitoring, alerting, logging, and documentation generation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  AdvancedMonitoringSystem,
  DocumentationFramework,
  defaultMonitoringConfig,
  defaultDocumentationConfig,
  globalMonitoringSystem,
  globalDocumentationFramework,
  type Alert,
  type SystemMetrics,
  type LogEntry,
  type DocumentationEntry
} from '@/lib/advanced-monitoring'

// ============================================================================
// ADVANCED MONITORING SYSTEM TESTS
// ============================================================================

describe('AdvancedMonitoringSystem', () => {
  let monitoringSystem: AdvancedMonitoringSystem

  beforeEach(() => {
    monitoringSystem = new AdvancedMonitoringSystem({
      ...defaultMonitoringConfig,
      enableRealTimeMonitoring: false // Disable for testing
    })
  })

  afterEach(() => {
    monitoringSystem.stopMonitoring()
  })

  it('should collect system metrics', async () => {
    const metrics = await monitoringSystem.collectMetrics()

    expect(metrics).toHaveProperty('timestamp')
    expect(metrics).toHaveProperty('cpu')
    expect(metrics).toHaveProperty('memory')
    expect(metrics).toHaveProperty('disk')
    expect(metrics).toHaveProperty('network')
    expect(metrics).toHaveProperty('application')

    // Validate CPU metrics
    expect(metrics.cpu).toHaveProperty('usage')
    expect(metrics.cpu).toHaveProperty('loadAverage')
    expect(Array.isArray(metrics.cpu.loadAverage)).toBe(true)

    // Validate memory metrics
    expect(metrics.memory).toHaveProperty('used')
    expect(metrics.memory).toHaveProperty('total')
    expect(metrics.memory).toHaveProperty('percentage')
    expect(typeof metrics.memory.percentage).toBe('number')

    // Validate application metrics
    expect(metrics.application).toHaveProperty('activeUsers')
    expect(metrics.application).toHaveProperty('requestsPerSecond')
    expect(metrics.application).toHaveProperty('errorRate')
    expect(metrics.application).toHaveProperty('averageResponseTime')
  })

  it('should log entries with proper structure', () => {
    monitoringSystem.log('info', 'Test message', { userId: '123', action: 'test' })
    
    const logs = monitoringSystem.getRecentLogs(1)
    expect(logs).toHaveLength(1)

    const log = logs[0]
    expect(log).toHaveProperty('timestamp')
    expect(log).toHaveProperty('level')
    expect(log).toHaveProperty('message')
    expect(log).toHaveProperty('context')
    expect(log).toHaveProperty('source')
    expect(log).toHaveProperty('traceId')

    expect(log.level).toBe('info')
    expect(log.message).toBe('Test message')
    expect(log.context.userId).toBe('123')
    expect(log.context.action).toBe('test')
  })

  it('should create and resolve alerts', () => {
    const alert = monitoringSystem.createAlert(
      'warning',
      'Test Alert',
      'This is a test alert',
      80,
      85,
      { metric: 'memory' }
    )

    expect(alert).toHaveProperty('id')
    expect(alert).toHaveProperty('type')
    expect(alert).toHaveProperty('title')
    expect(alert).toHaveProperty('message')
    expect(alert).toHaveProperty('threshold')
    expect(alert).toHaveProperty('currentValue')
    expect(alert).toHaveProperty('timestamp')
    expect(alert).toHaveProperty('resolved')

    expect(alert.type).toBe('warning')
    expect(alert.title).toBe('Test Alert')
    expect(alert.threshold).toBe(80)
    expect(alert.currentValue).toBe(85)
    expect(alert.resolved).toBe(false)

    // Resolve the alert
    const resolved = monitoringSystem.resolveAlert(alert.id)
    expect(resolved).toBe(true)
    expect(alert.resolved).toBe(true)
    expect(alert.resolvedAt).toBeDefined()
  })

  it('should determine system health status', () => {
    // Initially healthy
    expect(monitoringSystem.getSystemHealth()).toBe('healthy')

    // Create warning alert
    monitoringSystem.createAlert('warning', 'Warning', 'Test warning', 80, 85)
    expect(monitoringSystem.getSystemHealth()).toBe('healthy') // Single warning is still healthy

    // Create error alert
    monitoringSystem.createAlert('error', 'Error', 'Test error', 5, 10)
    expect(monitoringSystem.getSystemHealth()).toBe('warning')

    // Create critical alert
    monitoringSystem.createAlert('critical', 'Critical', 'Test critical', 90, 95)
    expect(monitoringSystem.getSystemHealth()).toBe('critical')
  })

  it('should generate comprehensive monitoring report', async () => {
    // Add some test data
    await monitoringSystem.collectMetrics()
    await monitoringSystem.collectMetrics()
    
    monitoringSystem.log('info', 'Test log 1')
    monitoringSystem.log('error', 'Test error')
    
    monitoringSystem.createAlert('warning', 'Test Alert', 'Test message', 80, 85)

    const report = monitoringSystem.generateMonitoringReport()

    expect(report).toHaveProperty('reportId')
    expect(report).toHaveProperty('timestamp')
    expect(report).toHaveProperty('timeRange')
    expect(report).toHaveProperty('summary')
    expect(report).toHaveProperty('metrics')
    expect(report).toHaveProperty('alerts')
    expect(report).toHaveProperty('recommendations')
    expect(report).toHaveProperty('trends')

    // Validate summary
    expect(report.summary).toHaveProperty('totalAlerts')
    expect(report.summary).toHaveProperty('criticalAlerts')
    expect(report.summary).toHaveProperty('systemHealth')
    expect(report.summary).toHaveProperty('uptime')
    expect(report.summary).toHaveProperty('averageResponseTime')
    expect(report.summary).toHaveProperty('errorRate')

    // Validate trends
    expect(report.trends).toHaveProperty('responseTime')
    expect(report.trends).toHaveProperty('errorRate')
    expect(report.trends).toHaveProperty('memoryUsage')

    // Validate recommendations
    expect(Array.isArray(report.recommendations)).toBe(true)
    expect(report.recommendations.length).toBeGreaterThan(0)
  })

  it('should search logs by query and filters', () => {
    // Add test logs
    monitoringSystem.log('info', 'User login successful', { userId: '123', action: 'login' })
    monitoringSystem.log('error', 'Database connection failed', { error: 'timeout' })
    monitoringSystem.log('warn', 'High memory usage detected', { memory: 85 })

    // Search by message content
    const loginLogs = monitoringSystem.searchLogs('login')
    expect(loginLogs).toHaveLength(1)
    expect(loginLogs[0].message).toContain('login')

    // Search by level
    const errorLogs = monitoringSystem.getRecentLogs(10, 'error')
    expect(errorLogs).toHaveLength(1)
    expect(errorLogs[0].level).toBe('error')

    // Search by context
    const memoryLogs = monitoringSystem.searchLogs('memory')
    expect(memoryLogs).toHaveLength(1)
    expect(memoryLogs[0].message).toContain('memory')
  })

  it('should start and stop monitoring', () => {
    expect(monitoringSystem['isMonitoring']).toBe(false)

    monitoringSystem.startMonitoring()
    expect(monitoringSystem['isMonitoring']).toBe(true)

    monitoringSystem.stopMonitoring()
    expect(monitoringSystem['isMonitoring']).toBe(false)
  })
})

// ============================================================================
// DOCUMENTATION FRAMEWORK TESTS
// ============================================================================

describe('DocumentationFramework', () => {
  let docFramework: DocumentationFramework

  beforeEach(() => {
    docFramework = new DocumentationFramework(defaultDocumentationConfig)
  })

  it('should add and retrieve documentation entries', () => {
    const entry: DocumentationEntry = {
      id: 'test-entry',
      title: 'Test Documentation',
      description: 'This is a test documentation entry',
      category: 'guide',
      content: '# Test Documentation\n\nThis is test content.',
      examples: [
        {
          title: 'Basic Usage',
          description: 'How to use the test feature',
          language: 'typescript',
          code: 'const test = new TestClass();',
          output: 'Test instance created'
        }
      ],
      metadata: {
        author: 'Test Author',
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        tags: ['test', 'documentation']
      },
      dependencies: ['react', 'typescript'],
      relatedEntries: ['related-entry-1']
    }

    docFramework.addEntry(entry)

    const allEntries = docFramework.getAllEntries()
    expect(allEntries).toHaveLength(1)
    expect(allEntries[0]).toEqual(entry)
  })

  it('should search documentation entries', () => {
    const entry1: DocumentationEntry = {
      id: 'react-component',
      title: 'React Component Guide',
      description: 'How to create React components',
      category: 'component',
      content: 'React components are the building blocks...',
      examples: [],
      metadata: {
        author: 'React Expert',
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        tags: ['react', 'component']
      },
      dependencies: ['react'],
      relatedEntries: []
    }

    const entry2: DocumentationEntry = {
      id: 'api-testing',
      title: 'API Testing Guide',
      description: 'How to test APIs effectively',
      category: 'test',
      content: 'API testing involves validating endpoints...',
      examples: [],
      metadata: {
        author: 'Testing Expert',
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        tags: ['testing', 'api']
      },
      dependencies: ['vitest'],
      relatedEntries: []
    }

    docFramework.addEntry(entry1)
    docFramework.addEntry(entry2)

    // Search for React-related documentation
    const reactDocs = docFramework.searchDocumentation('react')
    expect(reactDocs).toHaveLength(1)
    expect(reactDocs[0].id).toBe('react-component')

    // Search for testing-related documentation
    const testingDocs = docFramework.searchDocumentation('testing')
    expect(testingDocs).toHaveLength(1)
    expect(testingDocs[0].id).toBe('api-testing')

    // Search for API-related documentation
    const apiDocs = docFramework.searchDocumentation('API')
    expect(apiDocs).toHaveLength(1)
    expect(apiDocs[0].id).toBe('api-testing')
  })

  it('should generate Quest 4.4 documentation', () => {
    const quest44Docs = docFramework.generateQuest44Documentation()

    expect(typeof quest44Docs).toBe('string')
    expect(quest44Docs).toContain('Quest 4.4')
    expect(quest44Docs).toContain('A.V.A.R.I.C.E. Protocol')
    expect(quest44Docs).toContain('Enhanced Implementation')
    expect(quest44Docs).toContain('Expert Council')
    expect(quest44Docs).toContain('COMPLETE')

    // Check for key sections
    expect(quest44Docs).toContain('EXECUTIVE SUMMARY')
    expect(quest44Docs).toContain('IMPLEMENTATION OVERVIEW')
    expect(quest44Docs).toContain('IMPLEMENTED ENHANCEMENTS')
    expect(quest44Docs).toContain('QUALITY METRICS ACHIEVED')
    expect(quest44Docs).toContain('TECHNICAL ARCHITECTURE')
    expect(quest44Docs).toContain('USAGE EXAMPLES')
    expect(quest44Docs).toContain('EXPERT COUNCIL VALIDATION')
  })
})

// ============================================================================
// GLOBAL INSTANCES TESTS
// ============================================================================

describe('Global Monitoring and Documentation Instances', () => {
  afterEach(() => {
    globalMonitoringSystem.stopMonitoring()
  })

  it('should provide global monitoring system instance', () => {
    expect(globalMonitoringSystem).toBeInstanceOf(AdvancedMonitoringSystem)
  })

  it('should provide global documentation framework instance', () => {
    expect(globalDocumentationFramework).toBeInstanceOf(DocumentationFramework)
  })

  it('should generate global monitoring report', () => {
    const report = globalMonitoringSystem.generateMonitoringReport()
    
    expect(report).toHaveProperty('reportId')
    expect(report).toHaveProperty('summary')
    expect(report).toHaveProperty('recommendations')
  })

  it('should generate global Quest 4.4 documentation', () => {
    const docs = globalDocumentationFramework.generateQuest44Documentation()
    
    expect(docs).toContain('Quest 4.4')
    expect(docs).toContain('100% A.V.A.R.I.C.E. Protocol compliance')
  })
})

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Monitoring and Documentation Integration', () => {
  it('should demonstrate complete monitoring workflow', async () => {
    const monitoring = new AdvancedMonitoringSystem({
      ...defaultMonitoringConfig,
      enableRealTimeMonitoring: false,
      alertThresholds: {
        ...defaultMonitoringConfig.alertThresholds,
        errorRate: 1 // Lower threshold for testing
      }
    })

    // Simulate application activity
    await monitoring.collectMetrics()
    
    monitoring.log('info', 'User action started', { userId: '123', action: 'run-automation' })
    monitoring.log('error', 'Action failed', { userId: '123', error: 'timeout' })
    monitoring.log('info', 'User action completed', { userId: '123', action: 'run-automation' })

    // Generate report
    const report = monitoring.generateMonitoringReport()

    // Validate monitoring workflow
    expect(report.summary.totalAlerts).toBeGreaterThanOrEqual(0)
    expect(report.metrics.length).toBeGreaterThan(0)
    expect(report.recommendations.length).toBeGreaterThan(0)

    // Cleanup
    monitoring.stopMonitoring()
  })

  it('should integrate monitoring with documentation', () => {
    const monitoring = globalMonitoringSystem
    const documentation = globalDocumentationFramework

    // Log monitoring activity
    monitoring.log('info', 'Documentation generated', { 
      type: 'quest-4.4', 
      sections: 9,
      wordCount: 5000 
    })

    // Generate documentation
    const docs = documentation.generateQuest44Documentation()

    // Verify integration
    expect(docs).toContain('Advanced Monitoring')
    expect(docs).toContain('Documentation Framework')

    const logs = monitoring.getRecentLogs(10)
    const docLogs = logs.filter(log => log.message.includes('Documentation'))
    expect(docLogs.length).toBeGreaterThan(0)
  })
})
