#!/usr/bin/env npx tsx

/**
 * MCP Guardian Agent - Prototype Implementation
 * Autonomous MCP server monitoring, recovery, and operation retry system
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const execAsync = promisify(exec)

interface MCPOperationState {
  id: string
  server: string
  operation: string
  parameters: Record<string, any>
  startTime: Date
  retryCount: number
  lastError?: string
  status: 'pending' | 'executing' | 'failed' | 'completed'
  checkpoint?: any
}

interface MCPHealthMetrics {
  server: string
  responseTime: number
  successRate: number
  lastFailure?: Date
  connectionStatus: 'healthy' | 'degraded' | 'failed'
  consecutiveFailures: number
  lastRecovery?: Date
}

interface RecoveryStrategy {
  level: 1 | 2 | 3 | 4
  name: string
  actions: string[]
  timeout: number
  retryable: boolean
}

class MCPGuardian {
  private operationQueue: MCPOperationState[] = []
  private healthMetrics: Map<string, MCPHealthMetrics> = new Map()
  private recoveryStrategies: RecoveryStrategy[]
  private monitoringInterval?: NodeJS.Timeout
  private stateFile = 'logs/mcp-guardian-state.json'
  private logFile = 'logs/mcp-guardian.log'
  
  private readonly MCP_SERVERS = [
    'supabase-community-supabase-mcp',
    'cloudflare-playwright-mcp', 
    'context7',
    'exa',
    'neo4j',
    'firecrawl-mcp-server',
    '@21st-dev/magic',
    'mcp-sequentialthinking-tools'
  ]

  constructor() {
    this.recoveryStrategies = [
      {
        level: 1,
        name: 'Soft Recovery',
        actions: ['force-kill-hanging', 'reconnect', 'clear-cache', 'retry-operation'],
        timeout: 30000,
        retryable: true
      },
      {
        level: 2,
        name: 'Configuration Fallback',
        actions: ['switch-config', 'restart-service', 'verify-health', 'replay-operation'],
        timeout: 60000,
        retryable: true
      },
      {
        level: 3,
        name: 'System Recovery',
        actions: ['full-restart', 'optimize-system', 'reset-connections', 'process-queue'],
        timeout: 120000,
        retryable: true
      },
      {
        level: 4,
        name: 'Manual Escalation',
        actions: ['notify-human', 'collect-diagnostics', 'graceful-degradation'],
        timeout: 0,
        retryable: false
      }
    ]
    
    this.loadState()
    this.initializeHealthMetrics()
  }

  private log(level: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] [${level}] ${message}${data ? ` - ${JSON.stringify(data)}` : ''}\n`
    
    console.log(logEntry.trim())
    
    try {
      require('fs').appendFileSync(this.logFile, logEntry)
    } catch (error) {
      console.warn('Failed to write to log file:', error)
    }
  }

  private loadState(): void {
    try {
      if (existsSync(this.stateFile)) {
        const state = JSON.parse(readFileSync(this.stateFile, 'utf8'))
        this.operationQueue = state.operationQueue || []
        
        // Convert date strings back to Date objects
        this.operationQueue.forEach(op => {
          op.startTime = new Date(op.startTime)
        })
        
        this.log('INFO', `Loaded ${this.operationQueue.length} operations from state file`)
      }
    } catch (error) {
      this.log('ERROR', 'Failed to load state file', error)
    }
  }

  private saveState(): void {
    try {
      const state = {
        operationQueue: this.operationQueue,
        lastSave: new Date().toISOString()
      }
      
      writeFileSync(this.stateFile, JSON.stringify(state, null, 2))
    } catch (error) {
      this.log('ERROR', 'Failed to save state file', error)
    }
  }

  private initializeHealthMetrics(): void {
    this.MCP_SERVERS.forEach(server => {
      this.healthMetrics.set(server, {
        server,
        responseTime: 0,
        successRate: 100,
        connectionStatus: 'healthy',
        consecutiveFailures: 0
      })
    })
  }

  async checkServerHealth(server: string): Promise<boolean> {
    const startTime = Date.now()
    let isHealthy = false
    
    try {
      // Test basic MCP connection with 60-second timeout
      const { stdout, stderr } = await execAsync(`claude /mcp status ${server}`, { timeout: 60000 })
      
      if (!stderr || stderr.includes('connected') || stdout.includes('connected')) {
        isHealthy = true
      }
    } catch (error: any) {
      if (error.killed && error.signal === 'SIGTERM') {
        this.log('ERROR', `Health check timeout (60s) for ${server} - server is hanging/unresponsive`)
      } else {
        this.log('WARN', `Health check failed for ${server}`, error)
      }
      isHealthy = false
    }
    
    const responseTime = Date.now() - startTime
    this.updateHealthMetrics(server, isHealthy, responseTime)
    
    return isHealthy
  }

  private updateHealthMetrics(server: string, isHealthy: boolean, responseTime: number): void {
    const metrics = this.healthMetrics.get(server)
    if (!metrics) return

    metrics.responseTime = responseTime
    
    if (isHealthy) {
      metrics.consecutiveFailures = 0
      metrics.successRate = Math.min(100, metrics.successRate + 1)
      metrics.connectionStatus = responseTime > 5000 ? 'degraded' : 'healthy'
    } else {
      metrics.consecutiveFailures++
      metrics.lastFailure = new Date()
      metrics.successRate = Math.max(0, metrics.successRate - 5)
      
      // Special handling for timeout cases (hanging servers)
      if (responseTime >= 60000) {
        metrics.connectionStatus = 'failed'
        this.log('WARN', `Server ${server} detected as hanging (${responseTime}ms response time)`)
      } else {
        metrics.connectionStatus = 'failed'
      }
    }

    this.healthMetrics.set(server, metrics)
  }

  async executeRecoveryStrategy(server: string, level: 1 | 2 | 3 | 4): Promise<boolean> {
    const strategy = this.recoveryStrategies.find(s => s.level === level)
    if (!strategy) {
      this.log('ERROR', `Invalid recovery level: ${level}`)
      return false
    }

    this.log('INFO', `Executing ${strategy.name} for ${server}`)

    try {
      for (const action of strategy.actions) {
        const success = await this.executeRecoveryAction(server, action)
        if (!success && action !== 'notify-human') {
          this.log('WARN', `Recovery action failed: ${action}`)
          return false
        }
      }

      // Update metrics on successful recovery
      const metrics = this.healthMetrics.get(server)
      if (metrics) {
        metrics.lastRecovery = new Date()
        this.healthMetrics.set(server, metrics)
      }

      this.log('SUCCESS', `${strategy.name} completed for ${server}`)
      return true

    } catch (error) {
      this.log('ERROR', `Recovery strategy failed for ${server}`, error)
      return false
    }
  }

  private async executeRecoveryAction(server: string, action: string): Promise<boolean> {
    try {
      switch (action) {
        case 'reconnect':
          await execAsync(`claude /mcp reconnect ${server}`, { timeout: 30000 })
          return true

        case 'clear-cache':
          // Clear Node.js require cache for MCP modules
          Object.keys(require.cache).forEach(key => {
            if (key.includes('mcp') || key.includes('claude')) {
              delete require.cache[key]
            }
          })
          return true

        case 'switch-config':
          await execAsync('./scripts/mcp-wrapper.sh backup', { timeout: 30000 })
          return true

        case 'restart-service':
          await execAsync(`claude /mcp restart`, { timeout: 60000 })
          return true

        case 'verify-health':
          return await this.checkServerHealth(server)

        case 'full-restart':
          await execAsync('./scripts/mcp-wrapper.sh restart', { timeout: 120000 })
          return true

        case 'optimize-system':
          await execAsync('./scripts/mcp-wrapper.sh optimize', { timeout: 30000 })
          return true

        case 'reset-connections':
          // Kill any stale MCP processes
          await execAsync('pkill -f "mcp|claude" || true', { timeout: 10000 })
          await this.sleep(2000)
          return true

        case 'force-kill-hanging':
          // Force kill hanging MCP processes for specific server
          await execAsync(`pkill -f "${server}" || true`, { timeout: 5000 })
          await this.sleep(1000)
          this.log('INFO', `Force killed hanging processes for ${server}`)
          return true

        case 'notify-human':
          this.log('ALERT', `Manual intervention required for ${server}`)
          console.log(`🚨 ALERT: Manual intervention required for ${server}`)
          return true

        case 'collect-diagnostics':
          await this.collectDiagnostics(server)
          return true

        default:
          this.log('WARN', `Unknown recovery action: ${action}`)
          return false
      }
    } catch (error) {
      this.log('ERROR', `Recovery action ${action} failed`, error)
      return false
    }
  }

  async recoverServer(server: string): Promise<boolean> {
    const metrics = this.healthMetrics.get(server)
    if (!metrics) {
      this.log('ERROR', `No metrics found for server: ${server}`)
      return false
    }

    // Determine recovery level based on failure history
    let recoveryLevel: 1 | 2 | 3 | 4 = 1
    
    // Special handling for hanging servers (60s+ response time)
    if (metrics.responseTime >= 60000) {
      this.log('INFO', `Detected hanging server ${server}, starting with force-kill recovery`)
      recoveryLevel = 2 // Start with configuration fallback for hanging servers
    } else if (metrics.consecutiveFailures >= 5) {
      recoveryLevel = 4 // Manual escalation
    } else if (metrics.consecutiveFailures >= 3) {
      recoveryLevel = 3 // System recovery
    } else if (metrics.successRate < 50) {
      recoveryLevel = 2 // Configuration fallback
    }

    this.log('INFO', `Starting Level ${recoveryLevel} recovery for ${server}`)

    // Try recovery strategies in sequence if needed
    for (let level = 1; level <= recoveryLevel; level++) {
      const success = await this.executeRecoveryStrategy(server, level as 1 | 2 | 3 | 4)
      
      if (success) {
        // Verify recovery by checking health
        await this.sleep(2000)
        const isHealthy = await this.checkServerHealth(server)
        
        if (isHealthy) {
          this.log('SUCCESS', `Server ${server} recovered at Level ${level}`)
          return true
        }
      }
    }

    this.log('ERROR', `All recovery attempts failed for ${server}`)
    return false
  }

  queueOperation(operation: MCPOperationState): void {
    operation.id = operation.id || `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    operation.startTime = new Date()
    operation.retryCount = 0
    operation.status = 'pending'
    
    this.operationQueue.push(operation)
    this.saveState()
    
    this.log('INFO', `Queued operation for ${operation.server}`, { id: operation.id, operation: operation.operation })
  }

  async retryOperation(operation: MCPOperationState): Promise<boolean> {
    operation.status = 'executing'
    operation.retryCount++
    
    this.log('INFO', `Retrying operation (attempt ${operation.retryCount})`, { id: operation.id })

    try {
      // This is where you would implement the actual MCP operation retry logic
      // For now, we'll simulate it
      
      switch (operation.operation) {
        case 'execute_sql':
          // Simulate SQL execution
          await this.sleep(1000)
          break
          
        case 'apply_migration':
          // Simulate migration application
          await this.sleep(2000)
          break
          
        default:
          this.log('WARN', `Unknown operation type: ${operation.operation}`)
      }

      operation.status = 'completed'
      this.log('SUCCESS', `Operation completed successfully`, { id: operation.id })
      return true

    } catch (error) {
      operation.status = 'failed'
      operation.lastError = error instanceof Error ? error.message : String(error)
      this.log('ERROR', `Operation retry failed`, { id: operation.id, error: operation.lastError })
      return false
    }
  }

  async processOperationQueue(): Promise<void> {
    const pendingOperations = this.operationQueue.filter(op => op.status === 'pending' || op.status === 'failed')
    
    this.log('INFO', `Processing ${pendingOperations.length} queued operations`)

    for (const operation of pendingOperations) {
      // Check if server is healthy before retrying
      const isHealthy = await this.checkServerHealth(operation.server)
      
      if (!isHealthy) {
        this.log('WARN', `Server ${operation.server} unhealthy, attempting recovery`)
        const recovered = await this.recoverServer(operation.server)
        
        if (!recovered) {
          this.log('ERROR', `Cannot retry operation - server recovery failed`, { id: operation.id })
          continue
        }
      }

      const success = await this.retryOperation(operation)
      
      if (success) {
        // Remove completed operations from queue
        const index = this.operationQueue.indexOf(operation)
        if (index > -1) {
          this.operationQueue.splice(index, 1)
        }
      }
    }

    this.saveState()
  }

  startMonitoring(intervalMs: number = 30000): void {
    this.log('INFO', `Starting MCP Guardian monitoring (interval: ${intervalMs}ms)`)
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.monitorAllServers()
        await this.processOperationQueue()
      } catch (error) {
        this.log('ERROR', 'Monitoring cycle failed', error)
      }
    }, intervalMs)
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
      this.log('INFO', 'MCP Guardian monitoring stopped')
    }
  }

  private async monitorAllServers(): Promise<void> {
    const healthChecks = this.MCP_SERVERS.map(server => this.checkServerHealth(server))
    const results = await Promise.all(healthChecks)
    
    const unhealthyServers = this.MCP_SERVERS.filter((server, index) => !results[index])
    
    if (unhealthyServers.length > 0) {
      this.log('WARN', `Detected ${unhealthyServers.length} unhealthy servers`, { servers: unhealthyServers })
      
      // Attempt recovery for unhealthy servers
      for (const server of unhealthyServers) {
        await this.recoverServer(server)
      }
    }
  }

  async collectDiagnostics(server: string): Promise<void> {
    this.log('INFO', `Collecting diagnostics for ${server}`)
    
    try {
      const diagnostics = {
        timestamp: new Date().toISOString(),
        server,
        metrics: this.healthMetrics.get(server),
        systemInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          memory: process.memoryUsage(),
          uptime: process.uptime()
        },
        queueStatus: {
          total: this.operationQueue.length,
          pending: this.operationQueue.filter(op => op.status === 'pending').length,
          failed: this.operationQueue.filter(op => op.status === 'failed').length
        }
      }
      
      const diagnosticsFile = `logs/mcp-diagnostics-${server}-${Date.now()}.json`
      writeFileSync(diagnosticsFile, JSON.stringify(diagnostics, null, 2))
      
      this.log('INFO', `Diagnostics saved to ${diagnosticsFile}`)
      
    } catch (error) {
      this.log('ERROR', 'Failed to collect diagnostics', error)
    }
  }

  getStatus(): any {
    return {
      servers: Array.from(this.healthMetrics.values()),
      queue: {
        total: this.operationQueue.length,
        pending: this.operationQueue.filter(op => op.status === 'pending').length,
        executing: this.operationQueue.filter(op => op.status === 'executing').length,
        failed: this.operationQueue.filter(op => op.status === 'failed').length,
        completed: this.operationQueue.filter(op => op.status === 'completed').length
      },
      monitoring: !!this.monitoringInterval
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// CLI Interface
async function main() {
  const guardian = new MCPGuardian()
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'status':
      console.log('🔍 MCP Guardian Status:')
      console.log(JSON.stringify(guardian.getStatus(), null, 2))
      break

    case 'monitor':
      const interval = parseInt(args[1]) || 30000
      guardian.startMonitoring(interval)
      console.log(`🤖 MCP Guardian monitoring started (${interval}ms intervals)`)
      
      // Keep process alive
      process.on('SIGINT', () => {
        guardian.stopMonitoring()
        process.exit(0)
      })
      
      // Wait indefinitely
      await new Promise(() => {})
      break

    case 'recover':
      const server = args[1]
      if (!server) {
        console.error('❌ Please specify a server name')
        process.exit(1)
      }
      
      console.log(`🔧 Recovering ${server}...`)
      const success = await guardian.recoverServer(server)
      console.log(success ? '✅ Recovery successful' : '❌ Recovery failed')
      break

    case 'queue':
      const operation = args[1]
      const serverName = args[2] || 'supabase-community-supabase-mcp'
      
      if (!operation) {
        console.error('❌ Please specify an operation')
        process.exit(1)
      }
      
      guardian.queueOperation({
        id: '',
        server: serverName,
        operation,
        parameters: {},
        startTime: new Date(),
        retryCount: 0,
        status: 'pending'
      })
      
      console.log('✅ Operation queued successfully')
      break

    case 'process':
      console.log('🔄 Processing operation queue...')
      await guardian.processOperationQueue()
      console.log('✅ Queue processing completed')
      break

    default:
      console.log(`
🤖 MCP Guardian Agent

Usage:
  npx tsx scripts/mcp-guardian.ts status                    # Show system status
  npx tsx scripts/mcp-guardian.ts monitor [interval_ms]     # Start monitoring (default: 30s)
  npx tsx scripts/mcp-guardian.ts recover <server>          # Recover specific server
  npx tsx scripts/mcp-guardian.ts queue <operation> [server] # Queue operation for retry
  npx tsx scripts/mcp-guardian.ts process                   # Process operation queue

Examples:
  npx tsx scripts/mcp-guardian.ts status
  npx tsx scripts/mcp-guardian.ts monitor 15000
  npx tsx scripts/mcp-guardian.ts recover supabase-community-supabase-mcp
  npx tsx scripts/mcp-guardian.ts queue "execute_sql" supabase-community-supabase-mcp
      `)
      break
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { MCPGuardian }