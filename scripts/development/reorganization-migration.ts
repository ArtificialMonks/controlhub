#!/usr/bin/env tsx
/**
 * Enterprise-Grade Directory Structure Reorganization Migration Script
 * Executes the complete reorganization plan with safe file movement and import updates
 */

import { MigrationHelper, type MigrationRule } from './migration-helper'
import path from 'path'
import fs from 'fs'

const PROJECT_ROOT = process.cwd()

/**
 * Phase 2: Core Reorganization Migration Rules
 */
const PHASE_2_RULES: MigrationRule[] = [
  // Move root level files (except CLAUDE.md which stays)
  {
    from: 'dev.log',
    to: 'logs/development.log',
    updateImports: false
  },
  {
    from: 'package.json.backup',
    to: '.backups/package.json.backup',
    updateImports: false
  },
  
  // Consolidate automation components
  {
    from: 'src/components/automation',
    to: 'src/components/features/automations/legacy-automation',
    updateImports: true,
    preserveOriginal: false
  },
  {
    from: 'src/components/automations',
    to: 'src/components/features/automations/legacy-automations',
    updateImports: true,
    preserveOriginal: false
  },
  
  // Move dashboard components
  {
    from: 'src/components/dashboard/charts',
    to: 'src/components/features/dashboard/charts',
    updateImports: true
  },
  {
    from: 'src/components/dashboard/skeletons',
    to: 'src/components/features/dashboard/skeletons',
    updateImports: true
  },
  {
    from: 'src/components/dashboard/drill-down',
    to: 'src/components/features/dashboard/drill-down',
    updateImports: true
  }
]

/**
 * Phase 3: Library Optimization Migration Rules
 */
const PHASE_3_RULES: MigrationRule[] = [
  // Core utilities
  {
    from: 'src/lib/config.ts',
    to: 'src/lib/core/config/index.ts',
    updateImports: true
  },
  {
    from: 'src/lib/utils.ts',
    to: 'src/lib/core/utils/index.ts',
    updateImports: true
  },
  {
    from: 'src/lib/utils',
    to: 'src/lib/core/utils',
    updateImports: true
  },
  {
    from: 'src/lib/types',
    to: 'src/lib/core/types',
    updateImports: true
  },
  
  // Data layer
  {
    from: 'src/lib/repositories',
    to: 'src/lib/data/repositories',
    updateImports: true
  },
  {
    from: 'src/lib/services',
    to: 'src/lib/data/services',
    updateImports: true
  },
  {
    from: 'src/lib/stores',
    to: 'src/lib/data/stores',
    updateImports: true
  },
  
  // Infrastructure
  {
    from: 'src/lib/monitoring',
    to: 'src/lib/infrastructure/monitoring',
    updateImports: true
  },
  {
    from: 'src/lib/security',
    to: 'src/lib/infrastructure/security',
    updateImports: true
  },
  {
    from: 'src/lib/performance-optimization.ts',
    to: 'src/lib/infrastructure/performance/optimization.ts',
    updateImports: true
  },
  {
    from: 'src/lib/performance-monitor.ts',
    to: 'src/lib/infrastructure/performance/monitor.ts',
    updateImports: true
  },
  {
    from: 'src/lib/performance',
    to: 'src/lib/infrastructure/performance',
    updateImports: true
  },
  
  // Integrations
  {
    from: 'src/lib/supabase',
    to: 'src/lib/integrations/supabase',
    updateImports: true
  },
  
  // Development tools
  {
    from: 'src/lib/quality',
    to: 'src/lib/development/quality',
    updateImports: true
  },
  {
    from: 'src/lib/architecture',
    to: 'src/lib/development/architecture',
    updateImports: true
  },
  {
    from: 'src/lib/protocol',
    to: 'src/lib/development/protocol',
    updateImports: true
  }
]

/**
 * Phase 4: Testing & Configuration Migration Rules
 */
const PHASE_4_RULES: MigrationRule[] = [
  // Consolidate testing
  {
    from: 'src/test',
    to: 'tests/src',
    updateImports: true
  },
  
  // Move configuration files
  {
    from: 'vitest.config.ts',
    to: 'config/testing/vitest.config.ts',
    updateImports: false
  },
  {
    from: 'playwright.config.ts',
    to: 'config/testing/playwright.config.ts',
    updateImports: false
  },
  {
    from: 'tailwind.config.ts',
    to: 'config/build/tailwind.config.ts',
    updateImports: false
  },
  {
    from: '.markdownlint-enhanced.json',
    to: 'config/linting/markdownlint-enhanced.json',
    updateImports: false
  },
  
  // Organize scripts
  {
    from: 'scripts/ci-cd-validation.ts',
    to: 'scripts/deployment/ci-cd-validation.ts',
    updateImports: false
  },
  {
    from: 'scripts/test-database-connectivity.ts',
    to: 'scripts/testing/test-database-connectivity.ts',
    updateImports: false
  },
  {
    from: 'scripts/markdown-qa-enforcer.ts',
    to: 'scripts/development/markdown-qa-enforcer.ts',
    updateImports: false
  }
]

/**
 * Execute migration for a specific phase
 */
async function executePhase(phase: number, rules: MigrationRule[], dryRun = false): Promise<boolean> {
  console.log(`\n🚀 Executing Phase ${phase} Migration`)
  console.log(`📋 Rules: ${rules.length}`)
  console.log(`🔍 Dry run: ${dryRun}`)
  
  const migrationHelper = new MigrationHelper(PROJECT_ROOT, dryRun, true)
  
  try {
    await migrationHelper.executeMigration(rules)
    
    // Verify compilation after migration
    if (!dryRun) {
      const compilationSuccess = await migrationHelper.verifyCompilation()
      if (!compilationSuccess) {
        console.error(`❌ Phase ${phase} failed: TypeScript compilation errors`)
        return false
      }
    }
    
    console.log(`✅ Phase ${phase} completed successfully!`)
    return true
  } catch (error) {
    console.error(`❌ Phase ${phase} failed:`, error)
    return false
  }
}

/**
 * Create backup of current state
 */
function createBackup(): void {
  console.log('📦 Creating backup of current state...')
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(PROJECT_ROOT, '.backups', `pre-reorganization-${timestamp}`)
  
  // Create backup directory
  fs.mkdirSync(backupDir, { recursive: true })
  
  // Backup critical files
  const criticalFiles = [
    'package.json',
    'tsconfig.json',
    'next.config.js',
    'tailwind.config.ts',
    'vitest.config.ts',
    'playwright.config.ts'
  ]
  
  for (const file of criticalFiles) {
    const srcPath = path.join(PROJECT_ROOT, file)
    if (fs.existsSync(srcPath)) {
      const destPath = path.join(backupDir, file)
      fs.copyFileSync(srcPath, destPath)
      console.log(`  ✅ Backed up: ${file}`)
    }
  }
  
  console.log(`📦 Backup created: ${backupDir}`)
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const phase = args.find(arg => arg.startsWith('--phase='))?.split('=')[1]
  
  console.log('🏗️  Enterprise-Grade Directory Structure Reorganization')
  console.log('=' .repeat(60))
  
  if (!dryRun) {
    createBackup()
  }
  
  if (phase) {
    // Execute specific phase
    const phaseNum = parseInt(phase)
    let rules: MigrationRule[] = []
    
    switch (phaseNum) {
      case 2:
        rules = PHASE_2_RULES
        break
      case 3:
        rules = PHASE_3_RULES
        break
      case 4:
        rules = PHASE_4_RULES
        break
      default:
        console.error(`❌ Invalid phase: ${phase}`)
        process.exit(1)
    }
    
    const success = await executePhase(phaseNum, rules, dryRun)
    process.exit(success ? 0 : 1)
  } else {
    // Execute all phases
    const phases = [
      { phase: 2, rules: PHASE_2_RULES },
      { phase: 3, rules: PHASE_3_RULES },
      { phase: 4, rules: PHASE_4_RULES }
    ]
    
    for (const { phase, rules } of phases) {
      const success = await executePhase(phase, rules, dryRun)
      if (!success) {
        console.error(`❌ Migration failed at Phase ${phase}`)
        process.exit(1)
      }
    }
    
    console.log('\n🎉 All phases completed successfully!')
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
}

export { executePhase, PHASE_2_RULES, PHASE_3_RULES, PHASE_4_RULES }
