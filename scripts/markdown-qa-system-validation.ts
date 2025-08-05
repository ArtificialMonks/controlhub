#!/usr/bin/env tsx

/**
 * Markdown QA System Validation Script
 * 
 * Comprehensive validation of the entire Markdown QA Enforcer system
 * Validates all components and integration points
 */

import { exec } from 'child_process'
import { promises as fs } from 'fs'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

interface ValidationResult {
  component: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  details?: string
}

class MarkdownQASystemValidator {
  private results: ValidationResult[] = []
  private projectRoot = process.cwd()

  async validateSystem(): Promise<void> {
    console.log('🔍 Markdown QA System Validation Starting...\n')

    await this.validateCoreComponents()
    await this.validateConfiguration()
    await this.validatePreventionSystem()
    await this.validateIntegration()
    await this.validateDocumentation()

    this.printResults()
  }

  private async validateCoreComponents(): Promise<void> {
    console.log('📋 Validating Core Components...')

    // Check main enforcer script
    await this.checkFile('scripts/markdown-qa-enforcer.ts', 'Main Enforcer Script')

    // Check configuration files
    await this.checkFile('.markdownlint-enhanced.json', 'Enhanced Configuration')
    await this.checkFile('.markdownlint.json', 'Base Configuration')

    // Check pre-commit hook
    await this.checkFile('.git/hooks/pre-commit', 'Pre-commit Hook')

    // Check logs directory
    await this.checkDirectory('logs', 'Logs Directory')
  }

  private async validateConfiguration(): Promise<void> {
    console.log('⚙️  Validating Configuration...')

    try {
      // Validate enhanced configuration
      const enhancedConfig = await fs.readFile('.markdownlint-enhanced.json', 'utf-8')
      const config = JSON.parse(enhancedConfig)
      
      if (config.extends && config.MD044 && config.MD044.names) {
        this.addResult('Enhanced Config Validation', 'PASS', 'Configuration properly extends base config with proper names')
      } else {
        this.addResult('Enhanced Config Validation', 'FAIL', 'Configuration missing required fields')
      }

      // Check proper names dictionary
      const properNames = config.MD044.names
      const expectedNames = ['A.V.A.R.I.C.E.', 'TypeScript', 'JavaScript', 'React', 'Next.js']
      const hasExpectedNames = expectedNames.every(name => properNames.includes(name))
      
      if (hasExpectedNames) {
        this.addResult('Proper Names Dictionary', 'PASS', `${properNames.length} technical terms configured`)
      } else {
        this.addResult('Proper Names Dictionary', 'WARNING', 'Some expected technical terms may be missing')
      }

    } catch (error) {
      this.addResult('Configuration Validation', 'FAIL', `Configuration parsing failed: ${error}`)
    }
  }

  private async validatePreventionSystem(): Promise<void> {
    console.log('🛡️  Validating Prevention System...')

    try {
      // Check pre-commit hook executable
      const hookPath = '.git/hooks/pre-commit'
      const stats = await fs.stat(hookPath)
      const isExecutable = (stats.mode & 0o111) !== 0

      if (isExecutable) {
        this.addResult('Pre-commit Hook Executable', 'PASS', 'Hook is properly executable')
      } else {
        this.addResult('Pre-commit Hook Executable', 'FAIL', 'Hook is not executable')
      }

      // Check hook content
      const hookContent = await fs.readFile(hookPath, 'utf-8')
      const hasValidationLogic = hookContent.includes('markdownlint') && 
                                 hookContent.includes('COMMIT BLOCKED')

      if (hasValidationLogic) {
        this.addResult('Pre-commit Hook Logic', 'PASS', 'Hook contains proper validation logic')
      } else {
        this.addResult('Pre-commit Hook Logic', 'FAIL', 'Hook missing validation logic')
      }

    } catch (error) {
      this.addResult('Prevention System Validation', 'FAIL', `Hook validation failed: ${error}`)
    }
  }

  private async validateIntegration(): Promise<void> {
    console.log('🔗 Validating Integration...')

    try {
      // Test package.json scripts
      const packageJson = await fs.readFile('package.json', 'utf-8')
      const pkg = JSON.parse(packageJson)
      
      const requiredScripts = ['markdown:enforce', 'markdown:fix', 'lint:md', 'lint:md:fix']
      const missingScripts = requiredScripts.filter(script => !pkg.scripts[script])
      
      if (missingScripts.length === 0) {
        this.addResult('Package.json Scripts', 'PASS', 'All required scripts are configured')
      } else {
        this.addResult('Package.json Scripts', 'FAIL', `Missing scripts: ${missingScripts.join(', ')}`)
      }

      // Test script execution (dry run)
      try {
        await execAsync('npx tsx --version')
        this.addResult('TSX Runtime', 'PASS', 'TSX runtime available for script execution')
      } catch (error) {
        this.addResult('TSX Runtime', 'FAIL', 'TSX runtime not available')
      }

      // Test markdownlint availability
      try {
        await execAsync('npx markdownlint --version')
        this.addResult('Markdownlint CLI', 'PASS', 'Markdownlint CLI available')
      } catch (error) {
        this.addResult('Markdownlint CLI', 'FAIL', 'Markdownlint CLI not available')
      }

    } catch (error) {
      this.addResult('Integration Validation', 'FAIL', `Integration check failed: ${error}`)
    }
  }

  private async validateDocumentation(): Promise<void> {
    console.log('📚 Validating Documentation...')

    const docFiles = [
      'docs/markdown-qa-enforcer-system-documentation.md',
      'docs/markdown-qa-quick-reference.md'
    ]

    for (const docFile of docFiles) {
      await this.checkFile(docFile, `Documentation: ${path.basename(docFile)}`)
    }

    // Check if logs directory has recent reports
    try {
      const reportPath = 'logs/markdown-violations-report.json'
      const stats = await fs.stat(reportPath)
      const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60)
      
      if (ageHours < 24) {
        this.addResult('Recent Violation Report', 'PASS', `Report generated ${ageHours.toFixed(1)} hours ago`)
      } else {
        this.addResult('Recent Violation Report', 'WARNING', `Report is ${ageHours.toFixed(1)} hours old`)
      }
    } catch (error) {
      this.addResult('Recent Violation Report', 'WARNING', 'No recent violation report found')
    }
  }

  private async checkFile(filePath: string, component: string): Promise<void> {
    try {
      await fs.access(filePath)
      const stats = await fs.stat(filePath)
      this.addResult(component, 'PASS', `File exists (${this.formatFileSize(stats.size)})`)
    } catch (error) {
      this.addResult(component, 'FAIL', `File not found: ${filePath}`)
    }
  }

  private async checkDirectory(dirPath: string, component: string): Promise<void> {
    try {
      const stats = await fs.stat(dirPath)
      if (stats.isDirectory()) {
        this.addResult(component, 'PASS', 'Directory exists and accessible')
      } else {
        this.addResult(component, 'FAIL', 'Path exists but is not a directory')
      }
    } catch (error) {
      this.addResult(component, 'FAIL', `Directory not found: ${dirPath}`)
    }
  }

  private addResult(component: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: string): void {
    this.results.push({ component, status, message, details })
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(80))
    console.log('📊 MARKDOWN QA SYSTEM VALIDATION RESULTS')
    console.log('='.repeat(80))

    const statusCounts = { PASS: 0, FAIL: 0, WARNING: 0 }

    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : 
                   result.status === 'FAIL' ? '❌' : '⚠️'
      
      console.log(`${icon} ${result.component}: ${result.message}`)
      if (result.details) {
        console.log(`   Details: ${result.details}`)
      }
      
      statusCounts[result.status]++
    })

    console.log('\n' + '-'.repeat(80))
    console.log('📈 VALIDATION SUMMARY')
    console.log('-'.repeat(80))
    console.log(`✅ PASSED: ${statusCounts.PASS}`)
    console.log(`⚠️  WARNINGS: ${statusCounts.WARNING}`)
    console.log(`❌ FAILED: ${statusCounts.FAIL}`)

    const totalTests = this.results.length
    const successRate = (statusCounts.PASS / totalTests * 100).toFixed(1)
    console.log(`📊 Success Rate: ${successRate}%`)

    if (statusCounts.FAIL === 0) {
      console.log('\n🎉 SYSTEM VALIDATION: ✅ PASSED')
      console.log('🚀 Markdown QA Enforcer system is fully operational and ready for production use.')
    } else {
      console.log('\n⚠️  SYSTEM VALIDATION: ❌ FAILED')
      console.log('🔧 Please address the failed components before using the system in production.')
    }

    console.log('\n📋 Next Steps:')
    if (statusCounts.FAIL === 0 && statusCounts.WARNING === 0) {
      console.log('• System is fully validated and operational')
      console.log('• Run: npm run markdown:enforce to start using the system')
      console.log('• Documentation available in docs/markdown-qa-enforcer-system-documentation.md')
    } else {
      console.log('• Review and address any failed or warning components')
      console.log('• Re-run validation after fixes: npx tsx scripts/markdown-qa-system-validation.ts')
      console.log('• Consult documentation for troubleshooting guidance')
    }

    console.log('='.repeat(80))
  }
}

// Execute validation if run directly
if (require.main === module) {
  const validator = new MarkdownQASystemValidator()
  validator.validateSystem().catch(console.error)
}

export { MarkdownQASystemValidator }