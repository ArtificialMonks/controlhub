#!/usr/bin/env tsx
/**
 * A.V.A.R.I.C.E. Protocol Validator
 * Validates complete A.V.A.R.I.C.E. Protocol compliance across all phases
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

interface ValidationResult {
  phase: number
  phaseName: string
  status: 'passed' | 'failed' | 'warning'
  score: number
  issues: string[]
  recommendations: string[]
}

interface ProtocolValidation {
  overallStatus: 'compliant' | 'non-compliant' | 'partial'
  overallScore: number
  phaseResults: ValidationResult[]
  criticalIssues: string[]
  recommendations: string[]
}

class AvariceProtocolValidator {
  private projectRoot: string
  private evidenceBasePath: string

  constructor() {
    this.projectRoot = process.cwd()
    this.evidenceBasePath = path.join(this.projectRoot, 'docs', 'evidence')
  }

  /**
   * Execute complete A.V.A.R.I.C.E. Protocol validation
   */
  async validateProtocol(): Promise<ProtocolValidation> {
    console.log('🔍 Starting A.V.A.R.I.C.E. Protocol Validation')

    const phaseResults: ValidationResult[] = []

    // Validate all 9 phases
    for (let phase = 1; phase <= 9; phase++) {
      const result = await this.validatePhase(phase)
      phaseResults.push(result)
    }

    // Calculate overall compliance
    const overallScore = phaseResults.reduce((sum, result) => sum + result.score, 0) / phaseResults.length
    const criticalIssues = phaseResults.flatMap(result => 
      result.issues.filter(issue => issue.includes('CRITICAL'))
    )

    const overallStatus = overallScore >= 90 ? 'compliant' : 
                         overallScore >= 70 ? 'partial' : 'non-compliant'

    const validation: ProtocolValidation = {
      overallStatus,
      overallScore,
      phaseResults,
      criticalIssues,
      recommendations: this.generateRecommendations(phaseResults)
    }

    this.generateReport(validation)
    return validation
  }

  /**
   * Validate individual phase
   */
  private async validatePhase(phase: number): Promise<ValidationResult> {
    const phaseNames = [
      '', 'Strategic Planning', 'Contextual Grounding', 'Expert Council',
      'Implementation', 'Multi-Layer Verification', 'Architectural Review',
      'Protocol Validation', 'Knowledge Memorization', 'Autonomous Termination'
    ]

    const phaseName = phaseNames[phase]
    console.log(`🔍 Validating Phase ${phase}: ${phaseName}`)

    const issues: string[] = []
    const recommendations: string[] = []
    let score = 100

    // Check phase documentation exists
    const phaseDocPath = path.join(this.projectRoot, 'avarice-protocol', 'avarice-phases', `phase-${phase}-${phaseName.toLowerCase().replace(/\s+/g, '-')}.md`)
    if (!fs.existsSync(phaseDocPath)) {
      issues.push(`CRITICAL: Phase ${phase} documentation missing at ${phaseDocPath}`)
      score -= 30
    } else {
      // Check if documentation includes test integration
      const docContent = fs.readFileSync(phaseDocPath, 'utf8')
      if (!docContent.includes('TEST SCRIPT INTEGRATION') && !docContent.includes('test script')) {
        issues.push(`WARNING: Phase ${phase} documentation missing test integration section`)
        score -= 10
      }
    }

    // Check evidence collection
    const evidencePattern = path.join(this.evidenceBasePath, '*', 'phase-evidence', `phase-${phase}-*`)
    try {
      const evidenceDirs = this.findEvidenceDirectories(evidencePattern)
      if (evidenceDirs.length === 0) {
        issues.push(`WARNING: No evidence found for Phase ${phase}`)
        score -= 10
      }
    } catch (error) {
      issues.push(`WARNING: Could not check evidence for Phase ${phase}`)
      score -= 5
    }

    // Phase-specific validations
    switch (phase) {
      case 1:
        score = await this.validatePhase1(score, issues, recommendations)
        break
      case 4:
        score = await this.validatePhase4(score, issues, recommendations)
        break
      case 5:
        score = await this.validatePhase5(score, issues, recommendations)
        break
      case 7:
        score = await this.validatePhase7(score, issues, recommendations)
        break
    }

    const status = score >= 90 ? 'passed' : score >= 70 ? 'warning' : 'failed'

    return {
      phase,
      phaseName,
      status,
      score: Math.max(0, score),
      issues,
      recommendations
    }
  }

  /**
   * Validate Phase 1: Strategic Planning
   */
  private async validatePhase1(score: number, issues: string[], recommendations: string[]): Promise<number> {
    // Check if package.json has test scripts
    const packageJsonPath = path.join(this.projectRoot, 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      const testScripts = Object.keys(packageJson.scripts || {}).filter(script => script.includes('test'))
      
      if (testScripts.length < 5) {
        issues.push('WARNING: Limited test script coverage in package.json')
        score -= 5
      }
    }

    return score
  }

  /**
   * Validate Phase 4: Implementation
   */
  private async validatePhase4(score: number, issues: string[], recommendations: string[]): Promise<number> {
    try {
      // Check TypeScript compilation
      execSync('npx tsc --noEmit --strict', {
        cwd: this.projectRoot,
        stdio: 'pipe',
        timeout: 22000 // Maximum 22 seconds
      })
    } catch (error) {
      const isTimeout = error instanceof Error && (error.message.includes('ETIMEDOUT') || error.message.includes('timeout'))
      if (isTimeout) {
        issues.push('WARNING: TypeScript compilation timed out (may indicate large codebase)')
        score -= 10
        recommendations.push('Consider optimizing TypeScript compilation or increasing timeout')
      } else {
        issues.push('CRITICAL: TypeScript compilation errors detected')
        score -= 25
        recommendations.push('Fix TypeScript compilation errors before proceeding')
      }
    }

    try {
      // Check ESLint compliance
      execSync('npx eslint src --ext .ts,.tsx --max-warnings 0', {
        cwd: this.projectRoot,
        stdio: 'pipe',
        timeout: 22000 // Maximum 22 seconds
      })
    } catch (error) {
      const isTimeout = error instanceof Error && (error.message.includes('ETIMEDOUT') || error.message.includes('timeout'))
      if (isTimeout) {
        issues.push('WARNING: ESLint validation timed out')
        score -= 5
        recommendations.push('Consider optimizing ESLint configuration or increasing timeout')
      } else {
        issues.push('WARNING: ESLint violations detected')
        score -= 10
        recommendations.push('Address ESLint violations for code quality')
      }
    }

    return score
  }

  /**
   * Validate Phase 5: Multi-Layer Verification
   */
  private async validatePhase5(score: number, issues: string[], recommendations: string[]): Promise<number> {
    // Check if test configuration exists
    const testConfigPath = path.join(this.projectRoot, 'docs', 'avarice-protocol', 'test-integration', 'phase-5-tests.json')
    if (!fs.existsSync(testConfigPath)) {
      issues.push('WARNING: Phase 5 test configuration missing')
      score -= 15
      recommendations.push('Create phase-5-tests.json configuration file')
    }

    return score
  }

  /**
   * Validate Phase 7: Protocol Validation
   */
  private async validatePhase7(score: number, issues: string[], recommendations: string[]): Promise<number> {
    // This is a recursive validation - we're validating the validator!
    // Check if this script exists and is executable
    const validatorPath = path.join(this.projectRoot, 'scripts', 'avarice-protocol-validator.ts')
    if (!fs.existsSync(validatorPath)) {
      issues.push('CRITICAL: A.V.A.R.I.C.E. Protocol validator missing')
      score -= 30
    }

    return score
  }

  /**
   * Find evidence directories matching pattern
   */
  private findEvidenceDirectories(pattern: string): string[] {
    // Simplified evidence directory search
    const evidenceDirs: string[] = []
    
    if (fs.existsSync(this.evidenceBasePath)) {
      const questDirs = fs.readdirSync(this.evidenceBasePath)
        .filter(dir => dir.startsWith('quest-'))
      
      for (const questDir of questDirs) {
        const phaseEvidenceDir = path.join(this.evidenceBasePath, questDir, 'phase-evidence')
        if (fs.existsSync(phaseEvidenceDir)) {
          evidenceDirs.push(phaseEvidenceDir)
        }
      }
    }

    return evidenceDirs
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(phaseResults: ValidationResult[]): string[] {
    const recommendations: string[] = []

    const failedPhases = phaseResults.filter(result => result.status === 'failed')
    if (failedPhases.length > 0) {
      recommendations.push(`Address critical issues in ${failedPhases.length} failed phases`)
    }

    const lowScorePhases = phaseResults.filter(result => result.score < 80)
    if (lowScorePhases.length > 0) {
      recommendations.push(`Improve quality in ${lowScorePhases.length} phases with scores below 80%`)
    }

    return recommendations
  }

  /**
   * Generate validation report
   */
  private generateReport(validation: ProtocolValidation): void {
    const reportPath = path.join(this.projectRoot, 'docs', 'avarice-protocol-validation-report.md')

    const report = `# A.V.A.R.I.C.E. Protocol Validation Report

## Overall Status: ${validation.overallStatus.toUpperCase()}
**Score**: ${validation.overallScore.toFixed(1)}/100

## Phase Results

${validation.phaseResults.map(result => `
### Phase ${result.phase}: ${result.phaseName}
- **Status**: ${result.status === 'passed' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'} ${result.status.toUpperCase()}
- **Score**: ${result.score}/100
- **Issues**: ${result.issues.length}
- **Recommendations**: ${result.recommendations.length}

${result.issues.length > 0 ? `**Issues:**\n${result.issues.map(issue => `- ${issue}`).join('\n')}` : ''}
${result.recommendations.length > 0 ? `**Recommendations:**\n${result.recommendations.map(rec => `- ${rec}`).join('\n')}` : ''}
`).join('\n')}

## Critical Issues
${validation.criticalIssues.length > 0 ? validation.criticalIssues.map(issue => `- ${issue}`).join('\n') : 'None detected'}

## Overall Recommendations
${validation.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Generated by A.V.A.R.I.C.E. Protocol Validator at ${new Date().toISOString()}*
`

    fs.writeFileSync(reportPath, report)
    console.log(`📄 Validation report generated: ${reportPath}`)
  }
}

// CLI execution
async function main() {
  try {
    const validator = new AvariceProtocolValidator()
    const result = await validator.validateProtocol()
    
    console.log(`\n🎯 A.V.A.R.I.C.E. Protocol Validation Complete`)
    console.log(`Overall Status: ${result.overallStatus.toUpperCase()}`)
    console.log(`Overall Score: ${result.overallScore.toFixed(1)}/100`)
    
    if (result.overallStatus === 'compliant') {
      console.log('✅ Protocol is fully compliant')
      process.exit(0)
    } else {
      console.log('❌ Protocol compliance issues detected')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Validation failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { AvariceProtocolValidator }
