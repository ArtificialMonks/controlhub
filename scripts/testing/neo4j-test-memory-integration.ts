#!/usr/bin/env tsx
/**
 * Neo4j Test Memory Integration
 * Stores test execution history and patterns in Neo4j for agent memory
 */

import * as fs from 'fs'
import * as path from 'path'

interface TestResult {
  script: string
  status: 'passed' | 'failed' | 'skipped'
  executionTime: number
  output: string
  error?: string
  timestamp: Date
}

interface TestMemoryPattern {
  scriptName: string
  phase: number
  questId: string
  executionHistory: TestExecution[]
  successRate: number
  averageExecutionTime: number
  commonFailurePatterns: string[]
  recommendations: string[]
}

interface TestExecution {
  timestamp: Date
  status: 'passed' | 'failed' | 'skipped'
  executionTime: number
  phase: number
  questId: string
  errorMessage?: string
}

class Neo4jTestMemoryIntegration {
  private projectRoot: string

  constructor() {
    this.projectRoot = process.cwd()
  }

  /**
   * Store test results in Neo4j memory format
   */
  async storeTestResults(
    phase: number,
    questId: string,
    testResults: TestResult[]
  ): Promise<void> {
    console.log(`🧠 Storing test results in Neo4j memory format for Phase ${phase}`)

    const cypherQueries: string[] = []

    // Create test execution nodes
    for (const result of testResults) {
      const testExecutionQuery = this.generateTestExecutionCypher(result, phase, questId)
      cypherQueries.push(testExecutionQuery)

      // Create test script node if it doesn't exist
      const testScriptQuery = this.generateTestScriptCypher(result.script, phase)
      cypherQueries.push(testScriptQuery)

      // Create relationships
      const relationshipQuery = this.generateTestRelationshipCypher(result.script, phase, questId)
      cypherQueries.push(relationshipQuery)
    }

    // Store queries in memory file for Neo4j execution
    await this.storeCypherQueries(cypherQueries, phase, questId)

    // Generate test patterns
    await this.generateTestPatterns(testResults, phase, questId)
  }

  /**
   * Generate Cypher query for test execution
   */
  private generateTestExecutionCypher(
    result: TestResult,
    phase: number,
    questId: string
  ): string {
    const escapedError = result.error ? result.error.replace(/'/g, "\\'").replace(/"/g, '\\"') : ''
    const escapedOutput = result.output ? result.output.replace(/'/g, "\\'").replace(/"/g, '\\"').substring(0, 500) : ''

    return `
CREATE (execution:TestExecution {
  id: '${result.script}-${phase}-${questId}-${Date.now()}',
  scriptName: '${result.script}',
  phase: ${phase},
  questId: '${questId}',
  status: '${result.status}',
  executionTime: ${result.executionTime},
  timestamp: datetime('${new Date(result.timestamp).toISOString()}'),
  errorMessage: '${escapedError}',
  output: '${escapedOutput}',
  evidencePath: '/docs/evidence/quest-${questId}/phase-evidence/phase-${phase}-verification/'
});`
  }

  /**
   * Generate Cypher query for test script
   */
  private generateTestScriptCypher(scriptName: string, phase: number): string {
    return `
MERGE (script:TestScript {name: '${scriptName}'})
ON CREATE SET 
  script.phases = [${phase}],
  script.category = '${this.categorizeScript(scriptName)}',
  script.estimatedTime = ${this.estimateScriptTime(scriptName)},
  script.successCriteria = '${this.getSuccessCriteria(scriptName)}',
  script.executionCount = 0,
  script.successRate = 0.0,
  script.createdAt = datetime()
ON MATCH SET
  script.phases = CASE 
    WHEN ${phase} IN script.phases THEN script.phases 
    ELSE script.phases + [${phase}] 
  END,
  script.lastUpdated = datetime();`
  }

  /**
   * Generate Cypher query for test relationships
   */
  private generateTestRelationshipCypher(
    scriptName: string,
    phase: number,
    questId: string
  ): string {
    return `
MATCH (script:TestScript {name: '${scriptName}'})
MATCH (execution:TestExecution {scriptName: '${scriptName}', phase: ${phase}, questId: '${questId}'})
MERGE (script)-[:EXECUTED_IN]->(phase_node:Phase {number: ${phase}, name: 'Phase ${phase}'})
MERGE (execution)-[:BELONGS_TO]->(script)
MERGE (execution)-[:EXECUTED_IN]->(phase_node)
MERGE (execution)-[:PART_OF]->(quest:Quest {id: '${questId}'});`
  }

  /**
   * Categorize script by name
   */
  private categorizeScript(scriptName: string): string {
    if (scriptName.includes('test:')) return 'testing'
    if (scriptName.includes('analyze:')) return 'analysis'
    if (scriptName.includes('ci:')) return 'ci-cd'
    if (scriptName.includes('lint:')) return 'quality'
    if (scriptName.includes('validate:')) return 'validation'
    if (scriptName.includes('monitor:')) return 'monitoring'
    return 'utility'
  }

  /**
   * Estimate script execution time
   */
  private estimateScriptTime(scriptName: string): number {
    const timeEstimates: Record<string, number> = {
      'test:unit': 60000,
      'test:coverage': 180000,
      'test:security': 240000,
      'test:e2e': 600000,
      'test:accessibility': 90000,
      'analyze:all': 120000,
      'ci:validate': 60000,
      'ci:quality-gates': 240000,
      'lint:all': 90000,
      'monitor:quality': 90000,
      'validate:avarice': 180000,
      'performance:lighthouse': 300000
    }
    return timeEstimates[scriptName] || 60000
  }

  /**
   * Get success criteria for script
   */
  private getSuccessCriteria(scriptName: string): string {
    const criteria: Record<string, string> = {
      'test:unit': 'All unit tests pass',
      'test:coverage': 'Coverage >= 80%',
      'test:security': 'No security vulnerabilities',
      'test:e2e': 'All E2E scenarios pass',
      'test:accessibility': 'WCAG AA compliance',
      'analyze:all': 'No critical issues detected',
      'ci:validate': 'CI/CD configuration valid',
      'ci:quality-gates': 'TypeScript + ESLint pass',
      'lint:all': 'No linting violations',
      'monitor:quality': 'Quality baseline established',
      'validate:avarice': 'Protocol compliance >= 90%',
      'performance:lighthouse': 'Core Web Vitals meet thresholds'
    }
    return criteria[scriptName] || 'Execution completes successfully'
  }

  /**
   * Store Cypher queries in memory file
   */
  private async storeCypherQueries(
    queries: string[],
    phase: number,
    questId: string
  ): Promise<void> {
    const memoryDir = path.join(
      this.projectRoot,
      'docs',
      'evidence',
      `quest-${questId}`,
      'memorization'
    )

    fs.mkdirSync(memoryDir, { recursive: true })

    const cypherFile = path.join(memoryDir, `phase-${phase}-test-memory.cypher`)
    const cypherContent = queries.join('\n\n')

    fs.writeFileSync(cypherFile, cypherContent)
    console.log(`📁 Neo4j Cypher queries stored: ${cypherFile}`)
  }

  /**
   * Generate test patterns and insights
   */
  private async generateTestPatterns(
    testResults: TestResult[],
    phase: number,
    questId: string
  ): Promise<void> {
    const patterns: TestMemoryPattern[] = []

    // Group results by script
    const scriptGroups = testResults.reduce((groups, result) => {
      if (!groups[result.script]) {
        groups[result.script] = []
      }
      groups[result.script].push(result)
      return groups
    }, {} as Record<string, TestResult[]>)

    // Generate patterns for each script
    for (const [scriptName, results] of Object.entries(scriptGroups)) {
      const pattern = this.analyzeTestPattern(scriptName, results, phase, questId)
      patterns.push(pattern)
    }

    // Store patterns
    await this.storeTestPatterns(patterns, phase, questId)
  }

  /**
   * Analyze test pattern for a script
   */
  private analyzeTestPattern(
    scriptName: string,
    results: TestResult[],
    phase: number,
    questId: string
  ): TestMemoryPattern {
    const executions: TestExecution[] = results.map(result => ({
      timestamp: new Date(result.timestamp),
      status: result.status,
      executionTime: result.executionTime,
      phase,
      questId,
      errorMessage: result.error
    }))

    const successCount = results.filter(r => r.status === 'passed').length
    const successRate = results.length > 0 ? (successCount / results.length) * 100 : 0
    const averageExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length

    const failedResults = results.filter(r => r.status === 'failed')
    const commonFailurePatterns = this.extractFailurePatterns(failedResults)
    const recommendations = this.generateRecommendations(scriptName, successRate, commonFailurePatterns)

    return {
      scriptName,
      phase,
      questId,
      executionHistory: executions,
      successRate,
      averageExecutionTime,
      commonFailurePatterns,
      recommendations
    }
  }

  /**
   * Extract common failure patterns
   */
  private extractFailurePatterns(failedResults: TestResult[]): string[] {
    const patterns: string[] = []

    for (const result of failedResults) {
      if (result.error) {
        if (result.error.includes('command not found')) {
          patterns.push('Missing dependency')
        } else if (result.error.includes('ETIMEDOUT')) {
          patterns.push('Timeout issue')
        } else if (result.error.includes('compilation')) {
          patterns.push('Compilation error')
        } else if (result.error.includes('test')) {
          patterns.push('Test failure')
        }
      }
    }

    return [...new Set(patterns)] // Remove duplicates
  }

  /**
   * Generate recommendations based on patterns
   */
  private generateRecommendations(
    scriptName: string,
    successRate: number,
    failurePatterns: string[]
  ): string[] {
    const recommendations: string[] = []

    if (successRate < 50) {
      recommendations.push(`Critical: ${scriptName} has low success rate (${successRate.toFixed(1)}%)`)
    }

    if (failurePatterns.includes('Missing dependency')) {
      recommendations.push(`Install missing dependencies for ${scriptName}`)
    }

    if (failurePatterns.includes('Timeout issue')) {
      recommendations.push(`Increase timeout for ${scriptName} or optimize execution`)
    }

    if (failurePatterns.includes('Compilation error')) {
      recommendations.push(`Fix TypeScript compilation issues before running ${scriptName}`)
    }

    if (recommendations.length === 0 && successRate > 90) {
      recommendations.push(`${scriptName} is performing well - maintain current approach`)
    }

    return recommendations
  }

  /**
   * Store test patterns in memory file
   */
  private async storeTestPatterns(
    patterns: TestMemoryPattern[],
    phase: number,
    questId: string
  ): Promise<void> {
    const memoryDir = path.join(
      this.projectRoot,
      'docs',
      'evidence',
      `quest-${questId}`,
      'memorization'
    )

    const patternsFile = path.join(memoryDir, `phase-${phase}-test-patterns.json`)
    fs.writeFileSync(patternsFile, JSON.stringify(patterns, null, 2))

    console.log(`🧠 Test patterns stored: ${patternsFile}`)
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2)
  const phase = parseInt(args[0])
  const questId = args[1]
  const testResultsPath = args[2]

  if (!phase || !questId || !testResultsPath) {
    console.error('Usage: tsx scripts/neo4j-test-memory-integration.ts <phase> <questId> <testResultsPath>')
    console.error('Example: tsx scripts/neo4j-test-memory-integration.ts 5 4.3 /path/to/test-results.json')
    process.exit(1)
  }

  try {
    const integration = new Neo4jTestMemoryIntegration()
    
    // Load test results
    const testResults: TestResult[] = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'))
    
    // Store in Neo4j memory format
    await integration.storeTestResults(phase, questId, testResults)
    
    console.log(`✅ Test memory integration completed for Phase ${phase}`)
  } catch (error) {
    console.error('❌ Memory integration failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { Neo4jTestMemoryIntegration }
