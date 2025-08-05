#!/usr/bin/env tsx
/**
 * A.V.A.R.I.C.E. Protocol Test Orchestrator
 * Automatically executes phase-appropriate test scripts and stores results
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

interface TestScript {
  script: string
  description: string
  timeout: number
  successCriteria: string
  order: number
}

interface PhaseTestConfig {
  phase: number
  phaseName: string
  testScripts: {
    required: TestScript[]
    optional: TestScript[]
  }
  qualityGates: Record<string, number>
  evidenceCollection: Record<string, string>
}

interface TestResult {
  script: string
  status: 'passed' | 'failed' | 'skipped'
  executionTime: number
  output: string
  error?: string
  timestamp: Date
}

class AvariceTestOrchestrator {
  private projectRoot: string
  private evidenceBasePath: string

  constructor() {
    this.projectRoot = process.cwd()
    this.evidenceBasePath = path.join(this.projectRoot, 'docs', 'evidence')
  }

  /**
   * Execute tests for a specific A.V.A.R.I.C.E. Protocol phase
   */
  async executePhaseTests(phase: number, questId?: string): Promise<TestResult[]> {
    console.log(`🚀 Starting A.V.A.R.I.C.E. Protocol Phase ${phase} Test Execution`)

    const config = await this.loadPhaseTestConfig(phase)
    if (!config) {
      throw new Error(`No test configuration found for Phase ${phase}`)
    }

    const results: TestResult[] = []
    
    // Execute required tests
    for (const testScript of config.testScripts.required) {
      const result = await this.executeTestScript(testScript)
      results.push(result)
      
      if (result.status === 'failed') {
        console.error(`❌ Required test failed: ${testScript.script}`)
        // Continue with other tests but mark phase as failed
      }
    }

    // Execute optional tests
    for (const testScript of config.testScripts.optional) {
      try {
        const result = await this.executeTestScript(testScript)
        results.push(result)
      } catch (error) {
        console.warn(`⚠️ Optional test skipped: ${testScript.script}`)
        results.push({
          script: testScript.script,
          status: 'skipped',
          executionTime: 0,
          output: '',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        })
      }
    }

    // Store results and evidence
    await this.storeTestResults(phase, results, questId)
    await this.validateQualityGates(config, results)

    console.log(`✅ Phase ${phase} test execution completed`)
    return results
  }

  /**
   * Execute individual test script
   */
  private async executeTestScript(testScript: TestScript): Promise<TestResult> {
    console.log(`🔍 Executing: ${testScript.script}`)
    const startTime = Date.now()

    try {
      const output = execSync(`npm run ${testScript.script}`, {
        cwd: this.projectRoot,
        encoding: 'utf8',
        timeout: Math.min(testScript.timeout, 22000), // Maximum 22 seconds
        stdio: 'pipe'
      })

      const executionTime = Date.now() - startTime
      console.log(`✅ ${testScript.script} completed in ${executionTime}ms`)

      return {
        script: testScript.script,
        status: 'passed',
        executionTime,
        output,
        timestamp: new Date()
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const isTimeout = error instanceof Error && (error.message.includes('ETIMEDOUT') || error.message.includes('timeout'))

      if (isTimeout) {
        console.error(`⏰ ${testScript.script} timed out after ${executionTime}ms (max 22s)`)
      } else {
        console.error(`❌ ${testScript.script} failed after ${executionTime}ms`)
      }

      return {
        script: testScript.script,
        status: 'failed',
        executionTime,
        output: '',
        error: isTimeout ? `Timeout after ${executionTime}ms (max 22s)` : (error instanceof Error ? error.message : 'Unknown error'),
        timestamp: new Date()
      }
    }
  }

  /**
   * Load phase-specific test configuration
   */
  private async loadPhaseTestConfig(phase: number): Promise<PhaseTestConfig | null> {
    const configPath = path.join(
      this.projectRoot,
      'avarice-protocol',
      'avarice-phases',
      'frameworks',
      'testing',
      `phase-${phase}-tests.json`
    )

    if (!fs.existsSync(configPath)) {
      console.warn(`⚠️ No test configuration found for Phase ${phase}`)
      return null
    }

    try {
      const configContent = fs.readFileSync(configPath, 'utf8')
      return JSON.parse(configContent) as PhaseTestConfig
    } catch (error) {
      console.error(`❌ Failed to load test configuration for Phase ${phase}:`, error)
      return null
    }
  }

  /**
   * Store test results in evidence directory and Neo4j
   */
  private async storeTestResults(
    phase: number,
    results: TestResult[],
    questId?: string
  ): Promise<void> {
    const evidenceDir = questId
      ? path.join(this.evidenceBasePath, `quest-${questId}`, 'phase-evidence', `phase-${phase}-verification`)
      : path.join(this.evidenceBasePath, 'latest', `phase-${phase}-verification`)

    // Ensure evidence directory exists
    fs.mkdirSync(evidenceDir, { recursive: true })

    // Store test results as JSON
    const resultsPath = path.join(evidenceDir, 'test-results.json')
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2))

    // Store test summary as markdown
    const summaryPath = path.join(evidenceDir, 'test-summary.md')
    const summary = this.generateTestSummary(phase, results)
    fs.writeFileSync(summaryPath, summary)

    console.log(`📁 Test results stored in: ${evidenceDir}`)

    // TODO: Store in Neo4j memory
    // await this.storeInNeo4j(phase, results, questId)
  }

  /**
   * Generate test summary markdown
   */
  private generateTestSummary(phase: number, results: TestResult[]): string {
    const passed = results.filter(r => r.status === 'passed').length
    const failed = results.filter(r => r.status === 'failed').length
    const skipped = results.filter(r => r.status === 'skipped').length
    const total = results.length

    const successRate = total > 0 ? (passed / total * 100).toFixed(1) : '0'

    return `# Phase ${phase} Test Execution Summary

## Overview
- **Total Tests**: ${total}
- **Passed**: ${passed}
- **Failed**: ${failed}
- **Skipped**: ${skipped}
- **Success Rate**: ${successRate}%

## Test Results

${results.map(result => `
### ${result.script}
- **Status**: ${result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏭️'} ${result.status.toUpperCase()}
- **Execution Time**: ${result.executionTime}ms
- **Timestamp**: ${result.timestamp.toISOString()}
${result.error ? `- **Error**: ${result.error}` : ''}
`).join('\n')}

## Quality Gate Status
${failed === 0 ? '✅ All quality gates passed' : '❌ Quality gate failures detected'}

Generated by A.V.A.R.I.C.E. Protocol Test Orchestrator
`
  }

  /**
   * Validate quality gates
   */
  private async validateQualityGates(
    config: PhaseTestConfig,
    results: TestResult[]
  ): Promise<void> {
    const failed = results.filter(r => r.status === 'failed').length
    const total = results.length
    const successRate = total > 0 ? (results.filter(r => r.status === 'passed').length / total * 100) : 0

    console.log(`📊 Quality Gate Validation:`)
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`)
    console.log(`   Failed Tests: ${failed}`)

    if (config.qualityGates.testPassRate && successRate < config.qualityGates.testPassRate) {
      console.error(`❌ Quality gate failure: Success rate ${successRate.toFixed(1)}% below threshold ${config.qualityGates.testPassRate}%`)
    }

    if (failed > 0) {
      console.error(`❌ Quality gate failure: ${failed} test(s) failed`)
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2)
  const phase = parseInt(args[0])
  const questId = args[1]

  if (!phase || phase < 1 || phase > 9) {
    console.error('Usage: tsx scripts/avarice-test-orchestrator.ts <phase> [questId]')
    console.error('Example: tsx scripts/avarice-test-orchestrator.ts 5 4.3')
    process.exit(1)
  }

  try {
    const orchestrator = new AvariceTestOrchestrator()
    const results = await orchestrator.executePhaseTests(phase, questId)
    
    const failed = results.filter(r => r.status === 'failed').length
    if (failed > 0) {
      console.error(`❌ Phase ${phase} test execution completed with ${failed} failures`)
      process.exit(1)
    } else {
      console.log(`✅ Phase ${phase} test execution completed successfully`)
      process.exit(0)
    }
  } catch (error) {
    console.error('❌ Test orchestration failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { AvariceTestOrchestrator }
