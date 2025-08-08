#!/usr/bin/env npx tsx

/**
 * MCP Health Check and Auto-Recovery Script
 * Monitors MCP server connections and automatically reconnects when needed
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface MCPServer {
  name: string
  type: 'http' | 'stdio'
  url?: string
  command?: string
  args?: string[]
  healthEndpoint?: string
}

const MCP_SERVERS: MCPServer[] = [
  {
    name: 'supabase-community-supabase-mcp',
    type: 'http',
    url: 'https://server.smithery.ai/@supabase-community/supabase-mcp/mcp',
    healthEndpoint: '/health'
  },
  {
    name: 'cloudflare-playwright-mcp',
    type: 'http', 
    url: 'https://server.smithery.ai/@cloudflare/playwright-mcp/mcp',
    healthEndpoint: '/health'
  },
  {
    name: 'exa',
    type: 'stdio',
    command: 'npx',
    args: ['-y', 'exa-mcp-server']
  },
  {
    name: 'neo4j',
    type: 'stdio',
    command: '/opt/homebrew/bin/uvx',
    args: ['mcp-neo4j-data-modeling@0.2.0', '--transport', 'stdio']
  },
  {
    name: 'firecrawl-mcp-server',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@smithery/cli@latest', 'run', '@Krieg2065/firecrawl-mcp-server']
  },
  {
    name: '@21st-dev/magic',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@21st-dev/magic@latest']
  },
  {
    name: 'context7',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp@latest']
  },
  {
    name: 'mcp-sequentialthinking-tools',
    type: 'stdio',
    command: 'npx',
    args: ['-y', 'mcp-sequentialthinking-tools']
  }
]

async function checkServerHealth(server: MCPServer): Promise<{healthy: boolean, error?: string, timeout?: boolean}> {
  try {
    console.log(`  🔍 Testing ${server.name}...`)
    
    if (server.type === 'http' && server.url) {
      // For HTTP servers, try a health check with 60s timeout
      const { stdout } = await execAsync(
        `curl -s -m 60 -o /dev/null -w "%{http_code}" "${server.url}${server.healthEndpoint || ''}"`, 
        { timeout: 60000 }
      )
      const statusCode = parseInt(stdout.trim())
      const isHealthy = statusCode >= 200 && statusCode < 300
      console.log(`    HTTP Response: ${statusCode} (${isHealthy ? 'healthy' : 'unhealthy'})`)
      return { healthy: isHealthy }
    }
    
    // For stdio servers, try to test MCP connection with timeout
    if (server.name) {
      try {
        // Test actual MCP connection with Claude
        const { stdout, stderr } = await execAsync(
          `timeout 60 claude mcp test ${server.name}`, 
          { timeout: 60000 }
        )
        
        if (stderr && stderr.includes('timeout')) {
          console.log(`    ⏰ Connection timeout (>60s)`)
          return { healthy: false, timeout: true, error: 'Connection timeout' }
        }
        
        if (stderr && stderr.includes('error')) {
          console.log(`    ❌ MCP Error: ${stderr.trim()}`)
          return { healthy: false, error: stderr.trim() }
        }
        
        console.log(`    ✅ MCP connection successful`)
        return { healthy: true }
        
      } catch (testError: any) {
        // Fallback to process check
        console.log(`    🔄 Falling back to process check...`)
        
        if (server.command) {
          try {
            const processName = server.args ? server.args[server.args.length - 1] : server.command
            const { stdout } = await execAsync(`pgrep -f "${processName}"`, { timeout: 5000 })
            const isRunning = stdout.trim().length > 0
            console.log(`    Process running: ${isRunning}`)
            return { healthy: isRunning }
          } catch (procError) {
            console.log(`    ❌ Process not found`)
            return { healthy: false, error: 'Process not running' }
          }
        }
        
        return { healthy: false, error: testError.message }
      }
    }
    
    return { healthy: false, error: 'Unknown server configuration' }
    
  } catch (error: any) {
    console.log(`    ❌ Health check error: ${error.message}`)
    return { healthy: false, error: error.message }
  }
}

async function forceKillHangingProcesses(serverName: string): Promise<boolean> {
  try {
    console.log(`  🔪 Force-killing hanging processes for ${serverName}...`)
    
    const server = MCP_SERVERS.find(s => s.name === serverName)
    if (!server?.command) {
      console.log(`  ⚠️  No process to kill for HTTP server ${serverName}`)
      return true
    }
    
    // Find and kill hanging processes
    const processName = server.args ? server.args[server.args.length - 1] : server.command
    try {
      const { stdout } = await execAsync(`pgrep -f "${processName}"`, { timeout: 5000 })
      const pids = stdout.trim().split('\n').filter(pid => pid.length > 0)
      
      if (pids.length > 0) {
        console.log(`  🎯 Found ${pids.length} processes to kill: ${pids.join(', ')}`)
        
        for (const pid of pids) {
          try {
            await execAsync(`kill -9 ${pid}`, { timeout: 5000 })
            console.log(`  ✅ Killed process ${pid}`)
          } catch (killError) {
            console.log(`  ⚠️  Failed to kill process ${pid}`)
          }
        }
        
        // Wait for processes to die
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        console.log(`  ✅ No hanging processes found`)
      }
      
      return true
      
    } catch (error) {
      console.log(`  ✅ No processes to kill (already clean)`)
      return true
    }
    
  } catch (error: any) {
    console.log(`  ❌ Force-kill failed: ${error.message}`)
    return false
  }
}

async function reconnectMCPServer(serverName: string, forceKill: boolean = false): Promise<boolean> {
  try {
    console.log(`🔄 Reconnecting ${serverName}${forceKill ? ' (with force-kill)' : ''}...`)
    
    if (forceKill) {
      await forceKillHangingProcesses(serverName)
    }
    
    // Try to reconnect using Claude MCP command
    const { stdout, stderr } = await execAsync(`claude mcp restart ${serverName}`, { timeout: 45000 })
    
    if (stderr && stderr.includes('error')) {
      console.warn(`  ⚠️  Reconnection warning: ${stderr.trim()}`)
    }
    
    // Verify connection
    await new Promise(resolve => setTimeout(resolve, 3000))
    const healthResult = await checkServerHealth(MCP_SERVERS.find(s => s.name === serverName)!)
    
    if (healthResult.healthy) {
      console.log(`  ✅ Successfully reconnected and verified ${serverName}`)
      return true
    } else {
      console.log(`  ❌ Reconnection failed verification: ${healthResult.error}`)
      return false
    }
    
  } catch (error: any) {
    console.error(`  ❌ Failed to reconnect ${serverName}: ${error.message}`)
    return false
  }
}

async function restartAllMCPServers(): Promise<void> {
  try {
    console.log('🔄 Restarting all MCP servers...')
    await execAsync('claude /mcp restart', { timeout: 60000 })
    console.log('✅ All MCP servers restarted successfully')
  } catch (error) {
    console.error('❌ Failed to restart MCP servers:', error)
  }
}

async function monitorMCPServers(intervalMs: number = 30000): Promise<void> {
  console.log(`🔍 Starting MCP server monitoring (checking every ${intervalMs/1000}s)...`)
  
  setInterval(async () => {
    console.log('\n📊 Checking MCP server health...')
    
    let unhealthyServers = 0
    
    for (const server of MCP_SERVERS) {
      const isHealthy = await checkServerHealth(server)
      
      if (isHealthy) {
        console.log(`✅ ${server.name}: Healthy`)
      } else {
        console.log(`❌ ${server.name}: Unhealthy - attempting reconnection`)
        unhealthyServers++
        
        const reconnected = await reconnectMCPServer(server.name)
        if (!reconnected) {
          console.error(`⚠️  Failed to reconnect ${server.name}`)
        }
      }
    }
    
    // If multiple servers are down, restart everything
    if (unhealthyServers >= 2) {
      console.log('⚠️  Multiple servers unhealthy, restarting all MCP services...')
      await restartAllMCPServers()
    }
    
    console.log(`📊 Health check complete. ${MCP_SERVERS.length - unhealthyServers}/${MCP_SERVERS.length} servers healthy\n`)
    
  }, intervalMs)
}

async function performComprehensiveHealthCheck(): Promise<void> {
  console.log('🏥 COMPREHENSIVE MCP SERVER HEALTH CHECK')
  console.log('='.repeat(60))
  console.log(`Testing ${MCP_SERVERS.length} MCP servers with 60-second timeout protection\n`)
  
  let healthyServers = 0
  let unhealthyServers = 0
  let timeoutServers = 0
  const problemServers: string[] = []
  
  for (let i = 0; i < MCP_SERVERS.length; i++) {
    const server = MCP_SERVERS[i]
    console.log(`[${i + 1}/${MCP_SERVERS.length}] 🔍 ${server.name}`)
    console.log(`  Type: ${server.type}${server.url ? ` | URL: ${server.url}` : ''}`)
    
    const healthResult = await checkServerHealth(server)
    
    if (healthResult.healthy) {
      console.log(`  ✅ Status: HEALTHY`)
      healthyServers++
    } else {
      console.log(`  ❌ Status: UNHEALTHY - ${healthResult.error}`)
      if (healthResult.timeout) {
        timeoutServers++
        console.log(`  ⏰ Issue: SERVER HANGING (timeout >60s)`)
      }
      
      unhealthyServers++
      problemServers.push(server.name)
      
      // Apply recovery strategy
      console.log(`  🚑 Applying recovery strategy...`)
      const forceKill = healthResult.timeout || false
      const reconnected = await reconnectMCPServer(server.name, forceKill)
      
      if (reconnected) {
        console.log(`  ✅ Recovery: SUCCESS - Server restored`)
        healthyServers++
        unhealthyServers--
        problemServers.pop()
      } else {
        console.log(`  ❌ Recovery: FAILED - Manual intervention required`)
      }
    }
    
    console.log()
  }
  
  // Summary Report
  console.log('📊 HEALTH CHECK SUMMARY')
  console.log('='.repeat(40))
  console.log(`✅ Healthy servers: ${healthyServers}/${MCP_SERVERS.length}`)
  console.log(`❌ Unhealthy servers: ${unhealthyServers}/${MCP_SERVERS.length}`)
  console.log(`⏰ Timeout servers: ${timeoutServers}/${MCP_SERVERS.length}`)
  
  if (problemServers.length > 0) {
    console.log(`\n🚨 SERVERS REQUIRING ATTENTION:`)
    problemServers.forEach(server => console.log(`  - ${server}`))
    
    // System-wide recovery if needed
    if (problemServers.length >= 3) {
      console.log(`\n⚠️  Multiple server failures detected. Applying system-wide optimizations...`)
      await setupMCPOptimizations()
      await restartAllMCPServers()
    }
  } else {
    console.log(`\n🎉 ALL SERVERS HEALTHY - System operating at 100% capacity`)
  }
  
  console.log('\n' + '='.repeat(60))
}

async function checkHangingServers(): Promise<void> {
  console.log('⏰ CHECKING FOR HANGING MCP SERVERS')
  console.log('='.repeat(50))
  console.log(`Identifying servers not responding within 60 seconds...\n`)
  
  const hangingServers: string[] = []
  
  for (let i = 0; i < MCP_SERVERS.length; i++) {
    const server = MCP_SERVERS[i]
    console.log(`[${i + 1}/${MCP_SERVERS.length}] 🕐 Testing ${server.name}...`)
    
    const startTime = Date.now()
    const healthResult = await checkServerHealth(server)
    const responseTime = Date.now() - startTime
    
    console.log(`  Response time: ${responseTime}ms`)
    
    if (healthResult.timeout || responseTime > 60000) {
      console.log(`  ⏰ HANGING - Server not responding within timeout`)
      hangingServers.push(server.name)
      
      console.log(`  🔪 Force-killing hanging processes...`)
      await forceKillHangingProcesses(server.name)
    } else if (!healthResult.healthy) {
      console.log(`  ❌ UNHEALTHY - ${healthResult.error}`)
    } else {
      console.log(`  ✅ RESPONSIVE - Server healthy`)
    }
    
    console.log()
  }
  
  console.log('📊 HANGING SERVER SUMMARY')
  console.log('='.repeat(30))
  
  if (hangingServers.length > 0) {
    console.log(`🚨 ${hangingServers.length} hanging servers detected:`)
    hangingServers.forEach(server => console.log(`  - ${server}`))
    
    console.log('\n🚑 Applying recovery to hanging servers...')
    for (const serverName of hangingServers) {
      await reconnectMCPServer(serverName, true)
    }
  } else {
    console.log('✅ No hanging servers detected - All servers responsive')
  }
}

async function setupMCPOptimizations(): Promise<void> {
  console.log('⚙️  Setting up MCP optimizations...')
  
  try {
    // Increase Node.js event loop timeout
    process.env.UV_THREADPOOL_SIZE = '16'
    process.env.NODE_OPTIONS = '--max-old-space-size=4096'
    
    // Configure network settings for better reliability
    const networkOptimizations = [
      'export NODE_TLS_REJECT_UNAUTHORIZED=0', // For development only
      'export NODE_HTTP_MAX_HEADER_SIZE=65536',
      'export NODE_HTTP_TIMEOUT=300000', // 5 minute timeout
      'export NODE_KEEP_ALIVE_TIMEOUT=120000', // 2 minute keep-alive
    ]
    
    for (const optimization of networkOptimizations) {
      await execAsync(optimization)
    }
    
    console.log('✅ MCP optimizations configured')
    
  } catch (error) {
    console.warn('⚠️  Some optimizations failed:', error)
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const command = args[0]
  
  switch (command) {
    case 'check':
    case 'comprehensive':
      await performComprehensiveHealthCheck()
      break
      
    case 'hanging':
    case 'check-hanging':
      await checkHangingServers()
      break
      
    case 'monitor':
      const interval = parseInt(args[1]) || 30000
      await setupMCPOptimizations()
      await monitorMCPServers(interval)
      break
      
    case 'optimize':
      await setupMCPOptimizations()
      break
      
    case 'reconnect':
      const serverName = args[1]
      if (!serverName) {
        console.error('❌ Please specify a server name')
        process.exit(1)
      }
      await reconnectMCPServer(serverName)
      break
      
    default:
      console.log(`
🏥 MCP Health Check and Recovery Tool - Guardian Agent

Usage:
  npx tsx scripts/mcp-health-check.ts check                    # Comprehensive health check of all 8 servers
  npx tsx scripts/mcp-health-check.ts hanging                  # Check for hanging servers (60s timeout)
  npx tsx scripts/mcp-health-check.ts monitor [ms]             # Monitor continuously (default 30s)
  npx tsx scripts/mcp-health-check.ts optimize                 # Apply network optimizations
  npx tsx scripts/mcp-health-check.ts reconnect <name>         # Reconnect specific server

MCP Servers Monitored:
  ✓ supabase-community-supabase-mcp    (HTTP)
  ✓ cloudflare-playwright-mcp          (HTTP) 
  ✓ exa                                (STDIO)
  ✓ neo4j                              (STDIO)
  ✓ firecrawl-mcp-server               (STDIO)
  ✓ @21st-dev/magic                    (STDIO)
  ✓ context7                           (STDIO)
  ✓ mcp-sequentialthinking-tools       (STDIO)

Examples:
  npx tsx scripts/mcp-health-check.ts check
  npx tsx scripts/mcp-health-check.ts hanging
  npx tsx scripts/mcp-health-check.ts monitor 10000
  npx tsx scripts/mcp-health-check.ts reconnect exa
      `)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 MCP monitoring stopped')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n👋 MCP monitoring terminated')
  process.exit(0)
})

if (require.main === module) {
  main().catch(console.error)
}