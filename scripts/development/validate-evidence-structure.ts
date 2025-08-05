#!/usr/bin/env npx tsx

/**
 * A.V.A.R.I.C.E. Protocol Evidence Structure Validation Script
 * 
 * This script validates that all evidence is stored in the correct quest-specific
 * directory structure and enforces zero tolerance for deviations.
 */

import { existsSync, readdirSync, statSync } from 'fs'
import { join, resolve } from 'path'

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  questDirectories: string[]
  invalidDirectories: string[]
}

interface QuestStructure {
  questId: string
  path: string
  hasPhaseEvidence: boolean
  hasAgentReports: boolean
  hasQualityGates: boolean
  hasMemorization: boolean
  missingDirectories: string[]
}

class EvidenceStructureValidator {
  private readonly evidenceBasePath: string
  private readonly requiredSubdirectories = [
    'phase-evidence',
    'agent-reports', 
    'quality-gates',
    'memorization'
  ]

  private readonly validQuestPattern = /^quest-\d+\.\d+$/
  private readonly templateDirectory = 'TEMPLATE-quest-structure'

  constructor(projectRoot: string = process.cwd()) {
    this.evidenceBasePath = resolve(projectRoot, 'docs', 'evidence')
  }

  /**
   * Main validation function
   */
  async validateEvidenceStructure(): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      questDirectories: [],
      invalidDirectories: []
    }

    // Check if evidence directory exists
    if (!existsSync(this.evidenceBasePath)) {
      result.errors.push(`Evidence directory does not exist: ${this.evidenceBasePath}`)
      result.valid = false
      return result
    }

    // Get all directories in evidence folder
    const directories = this.getDirectories(this.evidenceBasePath)
    
    // Validate each directory
    for (const dir of directories) {
      if (dir === this.templateDirectory) {
        continue // Skip template directory
      }

      if (this.isValidQuestDirectory(dir)) {
        result.questDirectories.push(dir)
        const questValidation = this.validateQuestStructure(dir)
        
        if (!questValidation.valid) {
          result.errors.push(...questValidation.errors)
          result.warnings.push(...questValidation.warnings)
          result.valid = false
        }
      } else {
        result.invalidDirectories.push(dir)
        result.errors.push(`Invalid quest directory name: ${dir}. Must follow format 'quest-{major}.{minor}'`)
        result.valid = false
      }
    }

    // Check for evidence outside quest directories
    const invalidEvidence = this.findEvidenceOutsideQuestDirectories()
    if (invalidEvidence.length > 0) {
      result.errors.push(`Evidence found outside quest directories: ${invalidEvidence.join(', ')}`)
      result.valid = false
    }

    return result
  }

  /**
   * Validate individual quest directory structure
   */
  private validateQuestStructure(questId: string): ValidationResult {
    const questPath = join(this.evidenceBasePath, questId)
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      questDirectories: [questId],
      invalidDirectories: []
    }

    // Check required subdirectories
    for (const subdir of this.requiredSubdirectories) {
      const subdirPath = join(questPath, subdir)
      
      if (!existsSync(subdirPath)) {
        result.errors.push(`Missing required subdirectory in ${questId}: ${subdir}`)
        result.valid = false
      } else if (!statSync(subdirPath).isDirectory()) {
        result.errors.push(`${subdir} in ${questId} is not a directory`)
        result.valid = false
      }
    }

    // Check for unexpected files/directories in quest root
    const questContents = readdirSync(questPath)
    const allowedItems = [...this.requiredSubdirectories, 'README.md']
    
    for (const item of questContents) {
      if (!allowedItems.includes(item)) {
        result.warnings.push(`Unexpected item in ${questId}: ${item}`)
      }
    }

    // Validate phase-evidence structure
    this.validatePhaseEvidenceStructure(questId, result)

    return result
  }

  /**
   * Validate phase-evidence subdirectory structure
   */
  private validatePhaseEvidenceStructure(questId: string, result: ValidationResult): void {
    const phaseEvidencePath = join(this.evidenceBasePath, questId, 'phase-evidence')
    
    if (!existsSync(phaseEvidencePath)) {
      return // Already reported as missing
    }

    const expectedPhases = [
      'phase-1-strategic-planning',
      'phase-2-contextual-grounding', 
      'phase-3-expert-council',
      'phase-4-implementation',
      'phase-5-multi-layer-verification',
      'phase-6-architectural-review',
      'phase-7-protocol-validation',
      'phase-8-knowledge-memorization',
      'phase-9-autonomous-termination'
    ]

    const phaseDirectories = this.getDirectories(phaseEvidencePath)
    
    for (const phaseDir of phaseDirectories) {
      if (!expectedPhases.includes(phaseDir)) {
        result.warnings.push(`Unexpected phase directory in ${questId}: ${phaseDir}`)
      }
    }
  }

  /**
   * Check if directory name follows valid quest pattern
   */
  private isValidQuestDirectory(dirName: string): boolean {
    return this.validQuestPattern.test(dirName)
  }

  /**
   * Get all directories in a path
   */
  private getDirectories(path: string): string[] {
    if (!existsSync(path)) {
      return []
    }

    return readdirSync(path).filter(item => {
      const itemPath = join(path, item)
      return statSync(itemPath).isDirectory()
    })
  }

  /**
   * Find evidence files outside quest directories
   */
  private findEvidenceOutsideQuestDirectories(): string[] {
    const invalidEvidence: string[] = []
    const evidenceContents = readdirSync(this.evidenceBasePath)

    for (const item of evidenceContents) {
      const itemPath = join(this.evidenceBasePath, item)
      
      if (statSync(itemPath).isDirectory()) {
        if (!this.isValidQuestDirectory(item) && item !== this.templateDirectory) {
          invalidEvidence.push(item)
        }
      } else {
        // Files should not be in evidence root
        invalidEvidence.push(item)
      }
    }

    return invalidEvidence
  }

  /**
   * Generate detailed validation report
   */
  generateReport(result: ValidationResult): string {
    const lines: string[] = []
    
    lines.push('='.repeat(80))
    lines.push('A.V.A.R.I.C.E. PROTOCOL EVIDENCE STRUCTURE VALIDATION REPORT')
    lines.push('='.repeat(80))
    lines.push('')
    
    lines.push(`Validation Status: ${result.valid ? '✅ PASSED' : '❌ FAILED'}`)
    lines.push(`Timestamp: ${new Date().toISOString()}`)
    lines.push(`Evidence Base Path: ${this.evidenceBasePath}`)
    lines.push('')

    if (result.questDirectories.length > 0) {
      lines.push('📁 Valid Quest Directories:')
      result.questDirectories.forEach(dir => {
        lines.push(`  ✅ ${dir}`)
      })
      lines.push('')
    }

    if (result.invalidDirectories.length > 0) {
      lines.push('❌ Invalid Directory Names:')
      result.invalidDirectories.forEach(dir => {
        lines.push(`  ❌ ${dir}`)
      })
      lines.push('')
    }

    if (result.errors.length > 0) {
      lines.push('🚨 ERRORS (Zero Tolerance - Must Fix):')
      result.errors.forEach(error => {
        lines.push(`  ❌ ${error}`)
      })
      lines.push('')
    }

    if (result.warnings.length > 0) {
      lines.push('⚠️  WARNINGS:')
      result.warnings.forEach(warning => {
        lines.push(`  ⚠️  ${warning}`)
      })
      lines.push('')
    }

    lines.push('📋 COMPLIANCE REQUIREMENTS:')
    lines.push('  • All evidence MUST be stored in quest-specific directories')
    lines.push('  • Quest directories MUST follow format: quest-{major}.{minor}')
    lines.push('  • Required subdirectories: phase-evidence/, agent-reports/, quality-gates/, memorization/')
    lines.push('  • ZERO TOLERANCE for evidence outside designated structure')
    lines.push('')

    if (!result.valid) {
      lines.push('🛑 IMMEDIATE ACTION REQUIRED:')
      lines.push('  • Fix all errors before proceeding with A.V.A.R.I.C.E. Protocol execution')
      lines.push('  • Evidence structure violations trigger immediate stop-work order')
      lines.push('  • Refer to docs/evidence/TEMPLATE-quest-structure/ for correct structure')
    }

    lines.push('='.repeat(80))
    
    return lines.join('\n')
  }
}

// CLI execution
async function main() {
  const validator = new EvidenceStructureValidator()
  
  console.log('🔍 Validating A.V.A.R.I.C.E. Protocol Evidence Structure...\n')
  
  try {
    const result = await validator.validateEvidenceStructure()
    const report = validator.generateReport(result)
    
    console.log(report)
    
    // Exit with error code if validation failed
    if (!result.valid) {
      process.exit(1)
    }
    
    console.log('\n✅ Evidence structure validation completed successfully!')
    
  } catch (error) {
    console.error('❌ Validation script failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { EvidenceStructureValidator }
export type { ValidationResult, QuestStructure }
