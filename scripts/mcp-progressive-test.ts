#!/usr/bin/env npx tsx

/**
 * MCP Progressive Testing - Test servers individually with self-monitoring
 * Prevents hanging by testing one server at a time with strict timeouts
 */

import { spawn } from 'child_process'

interface ServerResult {
  server: string
  status: 'healthy' | 'failed' | 'timeout' | 'skipped'
  responseTime: number
  error?: string
}

class MCPProgressiveTester {
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

  private readonly TIMEOUT_MS = 60000 // 60 seconds per server
  private readonly PROGRESS_INTERVAL = 10000 // 10 second progress updates

  async testAllServersProgressively(): Promise<ServerResult[]> {
    console.log('🔍 Starting Progressive MCP Server Testing')
    console.log(`📊 Testing ${this.MCP_SERVERS.length} servers with 60s timeout per server`)
    console.log('⏱️  Progress updates every 10 seconds\n')

    const results: ServerResult[] = []

    for (let i = 0; i < this.MCP_SERVERS.length; i++) {
      const server = this.MCP_SERVERS[i]
      console.log(`[${i + 1}/${this.MCP_SERVERS.length}] 🔍 Testing ${server}...`)
      
      const startTime = Date.now()
      const result = await this.testSingleServer(server)
      
      results.push(result)
      
      const statusIcon = result.status === 'healthy' ? '✅' : 
                        result.status === 'timeout' ? '⏰' :
                        result.status === 'failed' ? '❌' : '⏭️'
      
      console.log(`${statusIcon} ${server}: ${result.status.toUpperCase()} (${result.responseTime}ms)`)
      
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
      console.log()
    }

    return results
  }

  private async testSingleServer(server: string): Promise<ServerResult> {
    return new Promise((resolve) => {
      const startTime = Date.now()
      let progressTimer: NodeJS.Timeout
      let isResolved = false

      // Start progress monitoring
      progressTimer = setInterval(() => {
        const elapsed = Date.now() - startTime
        console.log(`   ⏱️  ${server}: ${Math.floor(elapsed/1000)}s elapsed...`)
      }, this.PROGRESS_INTERVAL)

      // Set absolute timeout
      const timeoutTimer = setTimeout(() => {
        if (!isResolved) {
          isResolved = true
          clearInterval(progressTimer)
          console.log(`   ⏰ ${server}: TIMEOUT after ${this.TIMEOUT_MS/1000}s`)
          resolve({
            server,
            status: 'timeout',
            responseTime: Date.now() - startTime,
            error: 'Server timeout - no response within 60 seconds'
          })
        }
      }, this.TIMEOUT_MS)

      // Test the server
      const child = spawn('claude', ['/mcp', 'status', server], {
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        if (!isResolved) {
          isResolved = true
          clearInterval(progressTimer)
          clearTimeout(timeoutTimer)

          const responseTime = Date.now() - startTime
          const isHealthy = code === 0 || stdout.includes('connected') || stderr.includes('connected')

          resolve({
            server,
            status: isHealthy ? 'healthy' : 'failed',
            responseTime,
            error: isHealthy ? undefined : `Exit code: ${code}, stderr: ${stderr.trim()}`
          })
        }
      })

      child.on('error', (error) => {
        if (!isResolved) {
          isResolved = true
          clearInterval(progressTimer)
          clearTimeout(timeoutTimer)

          resolve({
            server,
            status: 'failed',
            responseTime: Date.now() - startTime,
            error: error.message
          })
        }
      })
    })
  }

  generateSummaryReport(results: ServerResult[]): void {
    console.log('📋 SUMMARY REPORT')
    console.log('=' .repeat(50))

    const healthy = results.filter(r => r.status === 'healthy')
    const failed = results.filter(r => r.status === 'failed')
    const timeout = results.filter(r => r.status === 'timeout')
    const skipped = results.filter(r => r.status === 'skipped')

    console.log(`✅ Healthy: ${healthy.length}`)
    console.log(`❌ Failed: ${failed.length}`)
    console.log(`⏰ Timeout: ${timeout.length}`)
    console.log(`⏭️  Skipped: ${skipped.length}`)
    console.log()

    if (healthy.length > 0) {
      console.log('✅ HEALTHY SERVERS:')
      healthy.forEach(r => {
        console.log(`   • ${r.server} (${r.responseTime}ms)`)
      })
      console.log()
    }

    if (timeout.length > 0) {
      console.log('⏰ HANGING SERVERS (Need Recovery):')
      timeout.forEach(r => {
        console.log(`   • ${r.server} - ${r.error}`)
      })
      console.log()
    }

    if (failed.length > 0) {
      console.log('❌ FAILED SERVERS:')
      failed.forEach(r => {
        console.log(`   • ${r.server} - ${r.error}`)
      })
      console.log()
    }

    console.log('📊 RECOMMENDATIONS:')
    if (timeout.length > 0) {
      console.log('   1. Run force-kill recovery on hanging servers')
      console.log('   2. Restart MCP services for hanging servers')
    }
    if (failed.length > 0) {
      console.log('   3. Check configuration and dependencies for failed servers')
    }
    if (healthy.length === results.length) {
      console.log('   🎉 All servers are healthy - no action needed!')
    }
  }
}

// CLI Interface
async function main() {
  const tester = new MCPProgressiveTester()
  
  console.log('🚀 MCP Progressive Tester Starting...')
  console.log(`📅 ${new Date().toISOString()}`)
  console.log()

  try {
    const results = await tester.testAllServersProgressively()
    console.log()
    tester.generateSummaryReport(results)
    
    const hasProblems = results.some(r => r.status !== 'healthy')
    process.exit(hasProblems ? 1 : 0)
    
  } catch (error) {
    console.error('💥 Progressive tester failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { MCPProgressiveTester }