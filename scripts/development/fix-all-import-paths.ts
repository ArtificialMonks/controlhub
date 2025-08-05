#!/usr/bin/env tsx
/**
 * Comprehensive Import Path Fix Script
 * Fixes all broken import paths after enterprise-grade directory restructuring
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

const COMPREHENSIVE_IMPORT_MAPPINGS: ImportMapping[] = [
  // Supabase integrations
  {
    oldPath: '@/lib/supabase/client',
    newPath: '@/lib/integrations/supabase/client',
    description: 'Supabase client moved to integrations'
  },
  {
    oldPath: '@/lib/supabase/server',
    newPath: '@/lib/integrations/supabase/server',
    description: 'Supabase server moved to integrations'
  },
  {
    oldPath: '@/lib/supabase/middleware',
    newPath: '@/lib/integrations/supabase/middleware',
    description: 'Supabase middleware moved to integrations'
  },
  
  // Repositories
  {
    oldPath: '@/lib/repositories/automation-repository',
    newPath: '@/lib/data/repositories/automation-repository',
    description: 'Automation repository moved to data domain'
  },
  {
    oldPath: '@/lib/repositories/notification-repository',
    newPath: '@/lib/data/repositories/notification-repository',
    description: 'Notification repository moved to data domain'
  },
  
  // Services
  {
    oldPath: '@/lib/services/automation-service',
    newPath: '@/lib/data/services/automation-service',
    description: 'Automation service moved to data domain'
  },
  {
    oldPath: '@/lib/services/server-automation-service',
    newPath: '@/lib/data/services/server-automation-service',
    description: 'Server automation service moved to data domain'
  },
  {
    oldPath: '@/lib/services/n8n-webhook-service',
    newPath: '@/lib/data/services/n8n-webhook-service',
    description: 'N8N webhook service moved to data domain'
  },
  {
    oldPath: '@/lib/services/audit-logger',
    newPath: '@/lib/data/services/audit-logger',
    description: 'Audit logger moved to data domain'
  },
  
  // Stores
  {
    oldPath: '@/lib/stores/app-store',
    newPath: '@/lib/data/stores/app-store',
    description: 'App store moved to data domain'
  },
  {
    oldPath: '@/lib/stores/auth-store',
    newPath: '@/lib/data/stores/auth-store',
    description: 'Auth store moved to data domain'
  },
  {
    oldPath: '@/lib/stores/automation-store',
    newPath: '@/lib/data/stores/automation-store',
    description: 'Automation store moved to data domain'
  },
  
  // Types
  {
    oldPath: '@/lib/types/automation',
    newPath: '@/lib/core/types/automation',
    description: 'Automation types moved to core domain'
  },
  {
    oldPath: '@/lib/types/filtering',
    newPath: '@/lib/core/types/filtering',
    description: 'Filtering types moved to core domain'
  },
  {
    oldPath: '@/lib/types/database',
    newPath: '@/lib/core/types/database',
    description: 'Database types moved to core domain'
  },
  {
    oldPath: '@/lib/types/webhook-types',
    newPath: '@/lib/core/types/webhook-types',
    description: 'Webhook types moved to core domain'
  },
  
  // Monitoring
  {
    oldPath: '@/lib/monitoring/logger',
    newPath: '@/lib/infrastructure/monitoring/logger',
    description: 'Logger moved to infrastructure domain'
  },
  {
    oldPath: '@/lib/monitoring/production-setup',
    newPath: '@/lib/infrastructure/monitoring/production-setup',
    description: 'Production setup moved to infrastructure domain'
  },
  
  // Security
  {
    oldPath: '@/lib/security/filterSecurity',
    newPath: '@/lib/infrastructure/security/filterSecurity',
    description: 'Filter security moved to infrastructure domain'
  },
  {
    oldPath: '@/lib/security/encryption',
    newPath: '@/lib/infrastructure/security/encryption',
    description: 'Encryption moved to infrastructure domain'
  },
  
  // Performance
  {
    oldPath: '@/lib/performance/webhook-performance-monitor',
    newPath: '@/lib/infrastructure/performance/webhook-performance-monitor',
    description: 'Webhook performance monitor moved to infrastructure domain'
  },
  {
    oldPath: '@/lib/performance/filterBenchmarks',
    newPath: '@/lib/infrastructure/performance/filterBenchmarks',
    description: 'Filter benchmarks moved to infrastructure domain'
  },
  
  // Development tools
  {
    oldPath: '../quality/codeQualityMonitor',
    newPath: '../development/quality/codeQualityMonitor',
    description: 'Code quality monitor moved to development domain'
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
            if (suffix && suffix.startsWith('/')) {
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
  console.log('🔄 Fixing all broken import paths after restructuring...')
  
  const sourceFiles = findSourceFiles()
  console.log(`📁 Found ${sourceFiles.length} source files`)
  
  let updatedFiles = 0
  
  for (const file of sourceFiles) {
    const relativePath = path.relative(PROJECT_ROOT, file)
    
    const hasUpdates = updateImportsInFile(file, COMPREHENSIVE_IMPORT_MAPPINGS)
    if (hasUpdates) {
      updatedFiles++
      console.log(`  ✅ Fixed imports in: ${relativePath}`)
    }
  }
  
  console.log(`\n✅ Fixed imports in ${updatedFiles} files`)
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
    console.error('❌ TypeScript compilation still has errors')
    console.error('Run `npx tsc --noEmit` to see detailed errors')
    return false
  }
}

/**
 * Main execution
 */
function main(): void {
  console.log('🚀 Comprehensive Import Path Fix Script')
  console.log('=' .repeat(50))
  
  updateAllImports()
  
  const compilationSuccess = verifyCompilation()
  
  if (compilationSuccess) {
    console.log('\n🎉 All import paths fixed successfully!')
    console.log('✅ TypeScript compilation is now clean')
  } else {
    console.log('\n⚠️  Import paths updated but some issues remain')
    console.log('Please review remaining TypeScript errors')
  }
}

// Execute if run directly
if (require.main === module) {
  main()
}

export { updateAllImports, verifyCompilation }
