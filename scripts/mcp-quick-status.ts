#!/usr/bin/env npx tsx

/**
 * Quick MCP Status - Fast individual server testing
 * Tests each server with short timeout for quick overview
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface QuickStatus {
  server: string
  status: 'healthy' | 'failed' | 'timeout'
  responseTime: number
}

async function testServerQuick(server: string): Promise<QuickStatus> {
  const startTime = Date.now()
  
  try {
    // Quick 10-second test
    await execAsync(`claude /mcp status ${server}`, { timeout: 10000 })
    return {
      server,
      status: 'healthy',
      responseTime: Date.now() - startTime
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    
    if (error.killed && responseTime >= 10000) {
      return { server, status: 'timeout', responseTime }
    } else {
      return { server, status: 'failed', responseTime }
    }
  }
}

async function main() {
  const servers = [
    'supabase-community-supabase-mcp',
    'cloudflare-playwright-mcp',
    'context7',
    'exa',
    'neo4j', 
    'firecrawl-mcp-server',
    '@21st-dev/magic',
    'mcp-sequentialthinking-tools'
  ]

  console.log('⚡ Quick MCP Status Check (10s timeout per server)')
  console.log('=' .repeat(60))

  const results: QuickStatus[] = []

  for (const server of servers) {
    process.stdout.write(`🔍 ${server}... `)
    
    const result = await testServerQuick(server)
    results.push(result)

    const icon = result.status === 'healthy' ? '✅' : 
                 result.status === 'timeout' ? '⏰' : '❌'
    
    console.log(`${icon} ${result.status.toUpperCase()} (${result.responseTime}ms)`)
  }

  console.log('\n📊 SUMMARY:')
  const healthy = results.filter(r => r.status === 'healthy')
  const timeout = results.filter(r => r.status === 'timeout') 
  const failed = results.filter(r => r.status === 'failed')

  console.log(`✅ Healthy: ${healthy.length}`)
  console.log(`⏰ Hanging: ${timeout.length}`)
  console.log(`❌ Failed: ${failed.length}`)

  if (timeout.length > 0) {
    console.log('\n⚠️  HANGING SERVERS DETECTED:')
    timeout.forEach(r => console.log(`   • ${r.server}`))
    console.log('\nRecommendation: Run MCP Guardian recovery on hanging servers')
  }
}

if (require.main === module) {
  main().catch(console.error)
}