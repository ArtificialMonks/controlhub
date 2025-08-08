#!/usr/bin/env npx tsx

/**
 * MCP Force Recovery - Progressive recovery for hanging servers
 * Uses force-kill and restart strategies with timeout protection
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function forceKillMCPProcesses(): Promise<void> {
  console.log('🔪 Force killing all MCP processes...')
  
  try {
    // Kill all MCP-related processes
    await execAsync('pkill -f "mcp" || true', { timeout: 5000 })
    await execAsync('pkill -f "claude" || true', { timeout: 5000 })
    await execAsync('pkill -f "exa-mcp-server" || true', { timeout: 5000 })
    await execAsync('pkill -f "@21st-dev/magic" || true', { timeout: 5000 })
    await execAsync('pkill -f "firecrawl-mcp-server" || true', { timeout: 5000 })
    
    console.log('✅ Force kill completed')
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000))
    
  } catch (error) {
    console.log('⚠️  Force kill may have failed, continuing...')
  }
}

async function restartMCPServices(): Promise<void> {
  console.log('🔄 Restarting MCP services...')
  
  try {
    // Restart MCP system
    await execAsync('claude /mcp restart', { timeout: 30000 })
    console.log('✅ MCP services restarted')
    
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 5000))
    
  } catch (error) {
    console.log('⚠️  MCP restart may have failed, continuing...')
  }
}

async function testSingleServerRecovery(server: string): Promise<boolean> {
  console.log(`🔍 Testing ${server} recovery...`)
  
  try {
    await execAsync(`claude /mcp status ${server}`, { timeout: 15000 })
    console.log(`✅ ${server} - RECOVERED`)
    return true
  } catch (error) {
    console.log(`❌ ${server} - Still problematic`)
    return false
  }
}

async function main() {
  const hangingServers = [
    'supabase-community-supabase-mcp',
    'cloudflare-playwright-mcp',
    'context7',
    'exa',
    'neo4j',
    'firecrawl-mcp-server',
    '@21st-dev/magic',
    'mcp-sequentialthinking-tools'
  ]

  console.log('🚨 MCP Force Recovery Starting')
  console.log(`🎯 Targeting ${hangingServers.length} hanging servers`)
  console.log('⏱️  Using aggressive timeout limits to prevent hanging\n')

  // Step 1: Force kill all MCP processes
  await forceKillMCPProcesses()

  // Step 2: Restart MCP services  
  await restartMCPServices()

  // Step 3: Test each server individually
  console.log('🔬 Testing individual server recovery...')
  const recoveredServers: string[] = []
  const stillProblematic: string[] = []

  for (const server of hangingServers) {
    const recovered = await testSingleServerRecovery(server)
    
    if (recovered) {
      recoveredServers.push(server)
    } else {
      stillProblematic.push(server)
    }
  }

  console.log('\n📋 RECOVERY REPORT')
  console.log('=' .repeat(50))
  console.log(`✅ Recovered: ${recoveredServers.length}`)
  console.log(`❌ Still problematic: ${stillProblematic.length}`)

  if (recoveredServers.length > 0) {
    console.log('\n✅ RECOVERED SERVERS:')
    recoveredServers.forEach(server => {
      console.log(`   • ${server}`)
    })
  }

  if (stillProblematic.length > 0) {
    console.log('\n❌ STILL PROBLEMATIC:')
    stillProblematic.forEach(server => {
      console.log(`   • ${server}`)
    })
    
    console.log('\n💡 RECOMMENDATIONS FOR PROBLEMATIC SERVERS:')
    console.log('   1. Check .mcp.json configuration')
    console.log('   2. Verify API keys and credentials')
    console.log('   3. Check network connectivity')
    console.log('   4. Review server logs for specific errors')
    console.log('   5. Try manual reconnection with specific server')
  }

  if (recoveredServers.length === hangingServers.length) {
    console.log('\n🎉 SUCCESS: All servers recovered!')
  } else {
    console.log(`\n⚠️  PARTIAL SUCCESS: ${recoveredServers.length}/${hangingServers.length} servers recovered`)
  }
}

if (require.main === module) {
  main().catch(console.error)
}