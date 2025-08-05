#!/usr/bin/env tsx
/**
 * Phase 2 Import Update Script
 * Updates import paths for moved components in Phase 2 reorganization
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const PROJECT_ROOT = process.cwd()

interface ImportMapping {
  oldPath: string
  newPath: string
  description: string
}

const IMPORT_MAPPINGS: ImportMapping[] = [
  // Automation components
  {
    oldPath: '@/components/automation/',
    newPath: '@/components/features/automations/',
    description: 'Automation components moved to features'
  },
  {
    oldPath: '@/components/automations/',
    newPath: '@/components/features/automations/',
    description: 'Automations components moved to features'
  },
  
  // Dashboard components - main components
  {
    oldPath: '@/components/dashboard/DashboardClient',
    newPath: '@/components/features/dashboard/DashboardClient',
    description: 'Dashboard client component'
  },
  {
    oldPath: '@/components/dashboard/DashboardHeader',
    newPath: '@/components/features/dashboard/DashboardHeader',
    description: 'Dashboard header component'
  },
  {
    oldPath: '@/components/dashboard/DashboardSkeleton',
    newPath: '@/components/features/dashboard/DashboardSkeleton',
    description: 'Dashboard skeleton component'
  },
  {
    oldPath: '@/components/dashboard/OptimizedDashboard',
    newPath: '@/components/features/dashboard/OptimizedDashboard',
    description: 'Optimized dashboard component'
  },
  
  // Dashboard charts
  {
    oldPath: '@/components/dashboard/charts/',
    newPath: '@/components/features/dashboard/charts/',
    description: 'Dashboard charts moved to features'
  },
  
  // Dashboard skeletons
  {
    oldPath: '@/components/dashboard/skeletons',
    newPath: '@/components/features/dashboard/skeletons',
    description: 'Dashboard skeletons moved to features'
  },
  
  // Dashboard drill-down
  {
    oldPath: '@/components/dashboard/drill-down/',
    newPath: '@/components/features/dashboard/drill-down/',
    description: 'Dashboard drill-down moved to features'
  },
  
  // Specific component mappings
  {
    oldPath: '@/components/dashboard/MetricsCards',
    newPath: '@/components/features/dashboard/metrics/MetricsCards',
    description: 'Metrics cards moved to metrics subdirectory'
  },
  {
    oldPath: '@/components/dashboard/RecentAutomationsTable',
    newPath: '@/components/features/dashboard/tables/RecentAutomationsTable',
    description: 'Recent automations table moved to tables subdirectory'
  },
  {
    oldPath: '@/components/dashboard/AutomationChartsSection',
    newPath: '@/components/features/dashboard/analytics/AutomationChartsSection',
    description: 'Automation charts section moved to analytics'
  },
  {
    oldPath: '@/components/dashboard/AutomationProgressSection',
    newPath: '@/components/features/dashboard/analytics/AutomationProgressSection',
    description: 'Automation progress section moved to analytics'
  }
]

/**
 * Find all TypeScript/JavaScript files in the project
 */
function findSourceFiles(): string[] {
  const files: string[] = []
  const extensions = ['.ts', '.tsx', '.js', '.jsx']
  
  function searchDirectory(dir: string): void {
    if (!fs.existsSync(dir)) return
    
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory() && 
          !entry.name.startsWith('.') && 
          entry.name !== 'node_modules' &&
          entry.name !== '.next' &&
          entry.name !== 'dist' &&
          entry.name !== 'build') {
        searchDirectory(fullPath)
      } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath)
      }
    }
  }
  
  // Search in key directories
  const searchDirs = ['src', 'app', 'components', 'lib', 'hooks', 'pages']
  for (const dir of searchDirs) {
    const fullDir = path.join(PROJECT_ROOT, dir)
    searchDirectory(fullDir)
  }
  
  return files
}

/**
 * Update imports in a single file
 */
function updateImportsInFile(filePath: string, mappings: ImportMapping[]): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf-8')
    let hasChanges = false
    
    for (const mapping of mappings) {
      const oldPathRegex = new RegExp(
        `(from\\s+['"]|import\\s*\\(['"])${escapeRegex(mapping.oldPath)}`,
        'g'
      )
      
      if (oldPathRegex.test(content)) {
        content = content.replace(
          new RegExp(`(from\\s+['"]|import\\s*\\(['"])${escapeRegex(mapping.oldPath)}`, 'g'),
          `$1${mapping.newPath}`
        )
        hasChanges = true
        console.log(`  ✅ Updated: ${mapping.description}`)
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf-8')
      return true
    }
    
    return false
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error)
    return false
  }
}

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Update all import statements
 */
function updateAllImports(): void {
  console.log('🔄 Updating import statements for Phase 2 reorganization...')
  
  const sourceFiles = findSourceFiles()
  console.log(`📁 Found ${sourceFiles.length} source files`)
  
  let updatedFiles = 0
  
  for (const file of sourceFiles) {
    const relativePath = path.relative(PROJECT_ROOT, file)
    console.log(`\n📝 Processing: ${relativePath}`)
    
    const hasUpdates = updateImportsInFile(file, IMPORT_MAPPINGS)
    if (hasUpdates) {
      updatedFiles++
    }
  }
  
  console.log(`\n✅ Updated imports in ${updatedFiles} files`)
}

/**
 * Verify TypeScript compilation
 */
function verifyCompilation(): boolean {
  console.log('\n🔍 Verifying TypeScript compilation...')
  
  try {
    execSync('npx tsc --noEmit', { 
      cwd: PROJECT_ROOT,
      stdio: 'pipe'
    })
    console.log('✅ TypeScript compilation successful!')
    return true
  } catch (error) {
    console.error('❌ TypeScript compilation failed!')
    console.error('Run `npx tsc --noEmit` to see detailed errors')
    return false
  }
}

/**
 * Main execution
 */
function main(): void {
  console.log('🚀 Phase 2 Import Update Script')
  console.log('=' .repeat(40))
  
  updateAllImports()
  
  const compilationSuccess = verifyCompilation()
  
  if (compilationSuccess) {
    console.log('\n🎉 Phase 2 import updates completed successfully!')
  } else {
    console.log('\n⚠️  Import updates completed but compilation has errors')
    console.log('Please review and fix any remaining import issues')
  }
}

// Execute if run directly
if (require.main === module) {
  main()
}

export { updateAllImports, verifyCompilation }
