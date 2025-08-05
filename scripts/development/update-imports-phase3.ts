#!/usr/bin/env tsx
/**
 * Phase 3 Import Update Script
 * Updates import paths for reorganized lib modules in Phase 3 reorganization
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
  // Core utilities
  {
    oldPath: '@/lib/config',
    newPath: '@/lib/core/config',
    description: 'Config moved to core domain'
  },
  {
    oldPath: '@/lib/utils',
    newPath: '@/lib/core/utils',
    description: 'Utils moved to core domain'
  },
  {
    oldPath: '@/lib/types/',
    newPath: '@/lib/core/types/',
    description: 'Types moved to core domain'
  },
  {
    oldPath: '@/lib/utils/',
    newPath: '@/lib/core/utils/',
    description: 'Utils subdirectory moved to core domain'
  },
  
  // Data layer
  {
    oldPath: '@/lib/repositories/',
    newPath: '@/lib/data/repositories/',
    description: 'Repositories moved to data domain'
  },
  {
    oldPath: '@/lib/services/',
    newPath: '@/lib/data/services/',
    description: 'Services moved to data domain'
  },
  {
    oldPath: '@/lib/stores/',
    newPath: '@/lib/data/stores/',
    description: 'Stores moved to data domain'
  },
  
  // Infrastructure
  {
    oldPath: '@/lib/monitoring/',
    newPath: '@/lib/infrastructure/monitoring/',
    description: 'Monitoring moved to infrastructure domain'
  },
  {
    oldPath: '@/lib/security/',
    newPath: '@/lib/infrastructure/security/',
    description: 'Security moved to infrastructure domain'
  },
  {
    oldPath: '@/lib/performance-optimization',
    newPath: '@/lib/infrastructure/performance/optimization',
    description: 'Performance optimization moved to infrastructure'
  },
  {
    oldPath: '@/lib/performance-monitor',
    newPath: '@/lib/infrastructure/performance/monitor',
    description: 'Performance monitor moved to infrastructure'
  },
  {
    oldPath: '@/lib/performance/',
    newPath: '@/lib/infrastructure/performance/',
    description: 'Performance modules moved to infrastructure'
  },
  
  // Integrations
  {
    oldPath: '@/lib/supabase/',
    newPath: '@/lib/integrations/supabase/',
    description: 'Supabase moved to integrations domain'
  },
  
  // Development tools
  {
    oldPath: '@/lib/quality/',
    newPath: '@/lib/development/quality/',
    description: 'Quality tools moved to development domain'
  },
  {
    oldPath: '@/lib/architecture/',
    newPath: '@/lib/development/architecture/',
    description: 'Architecture tools moved to development domain'
  },
  {
    oldPath: '@/lib/protocol/',
    newPath: '@/lib/development/protocol/',
    description: 'Protocol tools moved to development domain'
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
      // Handle both exact matches and path prefixes
      const patterns = [
        // Exact import: from '@/lib/config'
        new RegExp(`(from\\s+['"])${escapeRegex(mapping.oldPath)}(['"])`, 'g'),
        // Dynamic import: import('@/lib/config')
        new RegExp(`(import\\s*\\(['"])${escapeRegex(mapping.oldPath)}(['"]\\))`, 'g'),
        // Path prefix: from '@/lib/config/something'
        new RegExp(`(from\\s+['"])${escapeRegex(mapping.oldPath)}(/[^'"]*['"])`, 'g'),
        // Dynamic path prefix: import('@/lib/config/something')
        new RegExp(`(import\\s*\\(['"])${escapeRegex(mapping.oldPath)}(/[^'"]*['"]\\))`, 'g')
      ]
      
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, (match, prefix, suffix) => {
            if (suffix.startsWith('/')) {
              // Path prefix case
              return `${prefix}${mapping.newPath}${suffix}`
            } else {
              // Exact match case
              return `${prefix}${mapping.newPath}${suffix}`
            }
          })
          hasChanges = true
        }
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
  console.log('🔄 Updating import statements for Phase 3 library reorganization...')
  
  const sourceFiles = findSourceFiles()
  console.log(`📁 Found ${sourceFiles.length} source files`)
  
  let updatedFiles = 0
  
  for (const file of sourceFiles) {
    const relativePath = path.relative(PROJECT_ROOT, file)
    console.log(`\n📝 Processing: ${relativePath}`)
    
    const hasUpdates = updateImportsInFile(file, IMPORT_MAPPINGS)
    if (hasUpdates) {
      updatedFiles++
      console.log(`  ✅ Updated imports in: ${relativePath}`)
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
  console.log('🚀 Phase 3 Library Import Update Script')
  console.log('=' .repeat(45))
  
  updateAllImports()
  
  const compilationSuccess = verifyCompilation()
  
  if (compilationSuccess) {
    console.log('\n🎉 Phase 3 library import updates completed successfully!')
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
