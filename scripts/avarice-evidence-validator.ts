#!/usr/bin/env npx tsx

/**
 * A.V.A.R.I.C.E. Protocol Evidence Validator Integration
 * 
 * This script integrates evidence validation into the A.V.A.R.I.C.E. Protocol
 * execution flow and provides automated validation during protocol phases.
 */

import { EvidenceStructureValidator, ValidationResult } from './validate-evidence-structure'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

interface AvariceValidationConfig {
  questId: string
  phase: string
  agent: string
  strictMode: boolean
  autoFix: boolean
}

class AvariceEvidenceValidator {
  private validator: EvidenceStructureValidator
  private projectRoot: string

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
    this.validator = new EvidenceStructureValidator(projectRoot)
  }

  /**
   * Validate evidence structure for specific quest
   */
  async validateQuest(questId: string): Promise<ValidationResult> {
    console.log(`🔍 Validating evidence structure for ${questId}...`)
    
    const result = await this.validator.validateEvidenceStructure()
    
    // Filter results for specific quest
    const questSpecificResult: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      questDirectories: result.questDirectories.filter(dir => dir === questId),
      invalidDirectories: result.invalidDirectories.filter(dir => dir === questId)
    }

    // Filter errors and warnings for specific quest
    questSpecificResult.errors = result.errors.filter(error => error.includes(questId))
    questSpecificResult.warnings = result.warnings.filter(warning => warning.includes(questId))
    
    if (questSpecificResult.errors.length > 0 || questSpecificResult.invalidDirectories.length > 0) {
      questSpecificResult.valid = false
    }

    return questSpecificResult
  }

  /**
   * Create quest directory structure if it doesn't exist
   */
  async createQuestStructure(questId: string): Promise<void> {
    const questPath = resolve(this.projectRoot, 'docs', 'evidence', questId)
    
    if (existsSync(questPath)) {
      console.log(`📁 Quest directory already exists: ${questId}`)
      return
    }

    console.log(`📁 Creating quest directory structure: ${questId}`)

    // Create main quest directory
    mkdirSync(questPath, { recursive: true })

    // Create required subdirectories
    const subdirectories = [
      'phase-evidence',
      'agent-reports', 
      'quality-gates',
      'memorization'
    ]

    for (const subdir of subdirectories) {
      const subdirPath = join(questPath, subdir)
      mkdirSync(subdirPath, { recursive: true })
      
      // Create README.md in each subdirectory
      const readmePath = join(subdirPath, 'README.md')
      const readmeContent = this.generateSubdirectoryReadme(subdir, questId)
      writeFileSync(readmePath, readmeContent)
    }

    // Create main quest README
    const questReadmePath = join(questPath, 'README.md')
    const questReadmeContent = this.generateQuestReadme(questId)
    writeFileSync(questReadmePath, questReadmeContent)

    console.log(`✅ Quest directory structure created: ${questId}`)
  }

  /**
   * Validate evidence during A.V.A.R.I.C.E. Protocol execution
   */
  async validateDuringProtocol(config: AvariceValidationConfig): Promise<boolean> {
    console.log(`🔍 A.V.A.R.I.C.E. Protocol Evidence Validation`)
    console.log(`   Quest: ${config.questId}`)
    console.log(`   Phase: ${config.phase}`)
    console.log(`   Agent: ${config.agent}`)
    console.log(`   Strict Mode: ${config.strictMode}`)
    console.log('')

    // Ensure quest structure exists
    await this.createQuestStructure(config.questId)

    // Validate evidence structure
    const result = await this.validateQuest(config.questId)

    if (!result.valid) {
      console.log('❌ Evidence structure validation FAILED')
      console.log('Errors:')
      result.errors.forEach(error => console.log(`  • ${error}`))
      
      if (config.strictMode) {
        console.log('')
        console.log('🛑 STRICT MODE: Protocol execution halted due to evidence violations')
        console.log('Fix all errors before proceeding with A.V.A.R.I.C.E. Protocol')
        return false
      }
    }

    if (result.warnings.length > 0) {
      console.log('⚠️  Warnings:')
      result.warnings.forEach(warning => console.log(`  • ${warning}`))
    }

    console.log('✅ Evidence structure validation completed')
    return true
  }

  /**
   * Generate subdirectory README content
   */
  private generateSubdirectoryReadme(subdirectory: string, questId: string): string {
    const timestamp = new Date().toISOString()
    
    return `# ${subdirectory.charAt(0).toUpperCase() + subdirectory.slice(1).replace('-', ' ')} - ${questId}

## Overview
This directory contains ${subdirectory.replace('-', ' ')} for ${questId} A.V.A.R.I.C.E. Protocol execution.

## Structure
Evidence artifacts should be organized by category and include:
- Timestamps for all evidence
- Agent identification and context
- Quest-specific references
- Audit trail documentation

## Compliance
- All evidence must be verifiable and concrete
- Evidence must support A.V.A.R.I.C.E. Protocol requirements
- Evidence must maintain chain of custody
- Evidence must be stored with proper metadata

## Created
- Timestamp: ${timestamp}
- Quest: ${questId}
- Structure: A.V.A.R.I.C.E. Protocol Standardized
`
  }

  /**
   * Generate quest README content
   */
  private generateQuestReadme(questId: string): string {
    const timestamp = new Date().toISOString()
    
    return `# ${questId} - A.V.A.R.I.C.E. Protocol Evidence

## Overview
This directory contains all evidence artifacts for ${questId} execution under the A.V.A.R.I.C.E. Protocol.

## Directory Structure
- \`phase-evidence/\`: Evidence from all 9 protocol phases
- \`agent-reports/\`: Agent-specific reports and outputs
- \`quality-gates/\`: Quality gate validation results
- \`memorization/\`: Neo4j memory storage confirmations

## Protocol Compliance
This quest follows the standardized A.V.A.R.I.C.E. Protocol evidence structure:
- Zero tolerance for evidence outside designated directories
- Automated validation during protocol execution
- Complete audit trail maintenance
- Neo4j integration for institutional memory

## Quest Information
- Quest ID: ${questId}
- Created: ${timestamp}
- Protocol: A.V.A.R.I.C.E. v1.0
- Structure: Standardized Template

## Evidence Requirements
All evidence must include:
- Timestamp and quest context
- Agent identification
- Phase-specific organization
- Verifiable artifacts and documentation
`
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  if (!command) {
    console.log('Usage: npx tsx avarice-evidence-validator.ts <command> [options]')
    console.log('')
    console.log('Commands:')
    console.log('  validate <questId>     - Validate evidence structure for specific quest')
    console.log('  create <questId>       - Create quest directory structure')
    console.log('  protocol <questId> <phase> <agent> - Validate during protocol execution')
    console.log('')
    process.exit(1)
  }

  const validator = new AvariceEvidenceValidator()

  try {
    switch (command) {
      case 'validate':
        if (!args[1]) {
          console.error('❌ Quest ID required for validation')
          process.exit(1)
        }
        const result = await validator.validateQuest(args[1])
        if (!result.valid) {
          console.log('❌ Validation failed')
          process.exit(1)
        }
        console.log('✅ Validation passed')
        break

      case 'create':
        if (!args[1]) {
          console.error('❌ Quest ID required for creation')
          process.exit(1)
        }
        await validator.createQuestStructure(args[1])
        break

      case 'protocol':
        if (!args[1] || !args[2] || !args[3]) {
          console.error('❌ Quest ID, phase, and agent required for protocol validation')
          process.exit(1)
        }
        const config: AvariceValidationConfig = {
          questId: args[1],
          phase: args[2],
          agent: args[3],
          strictMode: true,
          autoFix: false
        }
        const success = await validator.validateDuringProtocol(config)
        if (!success) {
          process.exit(1)
        }
        break

      default:
        console.error(`❌ Unknown command: ${command}`)
        process.exit(1)
    }
  } catch (error) {
    console.error('❌ Validation failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { AvariceEvidenceValidator }
export type { AvariceValidationConfig }
