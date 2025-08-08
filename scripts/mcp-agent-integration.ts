#!/usr/bin/env npx tsx

/**
 * MCP Agent Integration - Easy interface for MCP Guardian
 * Provides simple commands to interact with the MCP Guardian agent
 */

import { MCPGuardian } from './mcp-guardian'

interface AgentCommand {
  name: string
  description: string
  handler: (args: string[]) => Promise<void>
}

class MCPAgentIntegration {
  private guardian: MCPGuardian
  private commands: AgentCommand[]

  constructor() {
    this.guardian = new MCPGuardian()
    
    this.commands = [
      {
        name: 'enable auto-recovery',
        description: 'Start autonomous monitoring with automatic recovery',
        handler: this.enableAutoRecovery.bind(this)
      },
      {
        name: 'status',
        description: 'Show health status of all MCP servers',
        handler: this.showStatus.bind(this)
      },
      {
        name: 'recover',
        description: 'Force recovery of specific server',
        handler: this.recoverServer.bind(this)
      },
      {
        name: 'retry',
        description: 'Retry the last failed operation',
        handler: this.retryLastOperation.bind(this)
      },
      {
        name: 'queue operation',
        description: 'Queue operation for retry (JSON format)',
        handler: this.queueOperation.bind(this)
      },
      {
        name: 'emergency restart',
        description: 'Full system restart with recovery',
        handler: this.emergencyRestart.bind(this)
      },
      {
        name: 'diagnostic report',
        description: 'Generate comprehensive health report',
        handler: this.generateDiagnosticReport.bind(this)
      },
      {
        name: 'check hanging',
        description: 'Check for hanging/unresponsive servers with 60s timeout',
        handler: this.checkHangingServers.bind(this)
      }
    ]
  }

  async processAgentCommand(input: string): Promise<string> {
    const normalizedInput = input.toLowerCase().trim()
    
    // Find matching command
    const command = this.commands.find(cmd => 
      normalizedInput.includes(cmd.name) || normalizedInput.startsWith(cmd.name)
    )
    
    if (!command) {
      return this.getHelpMessage()
    }
    
    try {
      // Extract arguments after command
      const args = input.replace(new RegExp(command.name, 'i'), '').trim().split(' ').filter(Boolean)
      
      await command.handler(args)
      return `✅ Command "${command.name}" executed successfully`
      
    } catch (error) {
      return `❌ Command "${command.name}" failed: ${error instanceof Error ? error.message : String(error)}`
    }
  }

  private async enableAutoRecovery(args: string[]): Promise<void> {
    const interval = parseInt(args[0]) || 30000
    
    console.log(`🤖 Starting MCP Guardian with ${interval/1000}s monitoring interval...`)
    console.log('🔍 Monitoring all MCP servers for failures')
    console.log('🔧 Automatic recovery enabled')
    console.log('📊 Health metrics being collected')
    console.log('')
    console.log('Press Ctrl+C to stop monitoring')
    
    this.guardian.startMonitoring(interval)
    
    // Keep process alive
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        console.log('\n👋 Stopping MCP Guardian...')
        this.guardian.stopMonitoring()
        resolve(undefined)
      })
    })
  }

  private async showStatus(args: string[]): Promise<void> {
    console.log('🔍 MCP Guardian Status Report')
    console.log('=' .repeat(50))
    
    const status = this.guardian.getStatus()
    
    console.log('\n📡 Server Health:')
    status.servers.forEach((server: any) => {
      const statusIcon = server.connectionStatus === 'healthy' ? '✅' : 
                        server.connectionStatus === 'degraded' ? '⚠️' : '❌'
      
      console.log(`  ${statusIcon} ${server.server}`)
      console.log(`     Status: ${server.connectionStatus}`)
      console.log(`     Response Time: ${server.responseTime}ms`)
      console.log(`     Success Rate: ${server.successRate}%`)
      console.log(`     Consecutive Failures: ${server.consecutiveFailures}`)
      console.log('')
    })
    
    console.log('📋 Operation Queue:')
    console.log(`     Total: ${status.queue.total}`)
    console.log(`     Pending: ${status.queue.pending}`)
    console.log(`     Executing: ${status.queue.executing}`)
    console.log(`     Failed: ${status.queue.failed}`)
    console.log(`     Completed: ${status.queue.completed}`)
    
    console.log(`\n🤖 Monitoring: ${status.monitoring ? 'Active' : 'Inactive'}`)
  }

  private async recoverServer(args: string[]): Promise<void> {
    const serverName = args[0]
    
    if (!serverName) {
      throw new Error('Please specify a server name (e.g., "supabase-community-supabase-mcp")')
    }
    
    console.log(`🔧 Initiating recovery for ${serverName}...`)
    
    const success = await this.guardian.recoverServer(serverName)
    
    if (success) {
      console.log(`✅ ${serverName} recovered successfully`)
    } else {
      console.log(`❌ Failed to recover ${serverName}`)
      console.log('💡 Try "emergency restart" if the problem persists')
    }
  }

  private async retryLastOperation(args: string[]): Promise<void> {
    console.log('🔄 Processing operation queue and retrying failed operations...')
    
    await this.guardian.processOperationQueue()
    
    console.log('✅ Operation queue processed')
  }

  private async queueOperation(args: string[]): Promise<void> {
    const jsonString = args.join(' ')
    
    if (!jsonString) {
      throw new Error('Please provide operation details in JSON format')
    }
    
    try {
      const operationData = JSON.parse(jsonString)
      
      // Validate required fields
      if (!operationData.operation || !operationData.server) {
        throw new Error('Operation must include "operation" and "server" fields')
      }
      
      this.guardian.queueOperation({
        id: '',
        server: operationData.server,
        operation: operationData.operation,
        parameters: operationData.parameters || {},
        startTime: new Date(),
        retryCount: 0,
        status: 'pending'
      })
      
      console.log(`✅ Operation queued for ${operationData.server}`)
      
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async emergencyRestart(args: string[]): Promise<void> {
    console.log('🚨 Initiating emergency restart sequence...')
    
    // Stop monitoring first
    this.guardian.stopMonitoring()
    
    console.log('1️⃣ Stopping all MCP processes...')
    await this.executeCommand('pkill -f "mcp|claude" || true')
    
    console.log('2️⃣ Applying system optimizations...')
    await this.executeCommand('./scripts/mcp-wrapper.sh optimize')
    
    console.log('3️⃣ Restarting MCP services...')
    await this.executeCommand('claude /mcp restart')
    
    // Wait for services to initialize
    await this.sleep(5000)
    
    console.log('4️⃣ Verifying all servers...')
    const allServersHealthy = await this.verifyAllServers()
    
    if (allServersHealthy) {
      console.log('✅ Emergency restart completed successfully')
      console.log('🔄 Processing any queued operations...')
      await this.guardian.processOperationQueue()
    } else {
      console.log('⚠️ Some servers may still have issues')
      console.log('💡 Check individual server status for details')
    }
  }

  private async generateDiagnosticReport(args: string[]): Promise<void> {
    console.log('📊 Generating comprehensive diagnostic report...')
    
    const servers = ['supabase-community-supabase-mcp', 'cloudflare-playwright-mcp', 'context7', 'exa', 'neo4j', 'firecrawl-mcp-server', '@21st-dev/magic', 'mcp-sequentialthinking-tools']
    
    for (const server of servers) {
      await this.guardian.collectDiagnostics(server)
    }
    
    console.log('✅ Diagnostic reports generated in logs/ directory')
    console.log('📋 Report includes:')
    console.log('   • Server health metrics')
    console.log('   • System performance data')
    console.log('   • Operation queue status')  
    console.log('   • Connection diagnostics')
  }

  private async checkHangingServers(args: string[]): Promise<void> {
    console.log('🕐 Checking for hanging/unresponsive servers (60s timeout per server)...')
    
    const servers = ['supabase-community-supabase-mcp', 'cloudflare-playwright-mcp', 'context7', 'exa', 'neo4j', 'firecrawl-mcp-server', '@21st-dev/magic', 'mcp-sequentialthinking-tools']
    const hangingServers: string[] = []
    
    for (const server of servers) {
      console.log(`  🔍 Testing ${server}...`)
      const startTime = Date.now()
      
      const isHealthy = await this.guardian.checkServerHealth(server)
      const responseTime = Date.now() - startTime
      
      if (!isHealthy || responseTime >= 60000) {
        hangingServers.push(server)
        console.log(`  ❌ ${server} - ${responseTime >= 60000 ? 'HANGING' : 'FAILED'} (${responseTime}ms)`)
      } else {
        console.log(`  ✅ ${server} - OK (${responseTime}ms)`)
      }
    }
    
    if (hangingServers.length > 0) {
      console.log(`\n🚨 Detected ${hangingServers.length} problematic servers:`)
      hangingServers.forEach(server => console.log(`   • ${server}`))
      console.log('\n🔧 Initiating recovery for hanging servers...')
      
      for (const server of hangingServers) {
        await this.guardian.recoverServer(server)
      }
    } else {
      console.log('\n✅ All servers are responsive and healthy')
    }
  }

  private async verifyAllServers(): Promise<boolean> {
    const servers = ['supabase-community-supabase-mcp', 'cloudflare-playwright-mcp', 'context7', 'exa', 'neo4j', 'firecrawl-mcp-server', '@21st-dev/magic', 'mcp-sequentialthinking-tools']
    const results = await Promise.all(servers.map(server => this.guardian.checkServerHealth(server)))
    
    return results.every(result => result)
  }

  private async executeCommand(command: string): Promise<void> {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)
    
    try {
      await execAsync(command, { timeout: 30000 })
    } catch (error) {
      console.warn(`Command failed: ${command}`)
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private getHelpMessage(): string {
    return `
🤖 MCP Guardian Agent - Available Commands:

${this.commands.map(cmd => `• "${cmd.name}" - ${cmd.description}`).join('\n')}

Examples:
• "enable auto-recovery" - Start monitoring with automatic recovery
• "status" - Show current health status
• "recover supabase-community-supabase-mcp" - Recover specific server
• "retry" - Retry any failed operations
• "queue operation: {"operation": "execute_sql", "server": "supabase-community-supabase-mcp"}"
• "emergency restart" - Full system recovery
• "diagnostic report" - Generate health reports
• "check hanging" - Check for hanging servers with 60s timeout

Usage:
  npx tsx scripts/mcp-agent-integration.ts "[command]"
  
or use with Claude Code:
  @mcp-guardian "[command]"
    `
  }
}

// CLI Interface
async function main() {
  const integration = new MCPAgentIntegration()
  const input = process.argv.slice(2).join(' ')
  
  if (!input) {
    console.log(integration['getHelpMessage']())
    return
  }
  
  const result = await integration.processAgentCommand(input)
  console.log(result)
}

if (require.main === module) {
  main().catch(console.error)
}

export { MCPAgentIntegration }