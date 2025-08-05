#!/usr/bin/env tsx
/**
 * Migration Helper Script
 * Safely moves files and updates import paths during directory reorganization
 * Part of Enterprise-Grade Directory Structure Reorganization
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

interface MigrationRule {
  from: string
  to: string
  updateImports?: boolean
  preserveOriginal?: boolean
}

interface ImportUpdate {
  oldPath: string
  newPath: string
  files: string[]
}

class MigrationHelper {
  private projectRoot: string
  private dryRun: boolean
  private verbose: boolean

  constructor(projectRoot: string, dryRun = false, verbose = false) {
    this.projectRoot = projectRoot
    this.dryRun = dryRun
    this.verbose = verbose
  }

  /**
   * Execute a migration plan with automatic import updates
   */
  async executeMigration(rules: MigrationRule[]): Promise<void> {
    console.log(`🚀 Starting migration with ${rules.length} rules...`)
    console.log(`📁 Project root: ${this.projectRoot}`)
    console.log(`🔍 Dry run: ${this.dryRun}`)

    for (const rule of rules) {
      await this.executeRule(rule)
    }

    console.log('✅ Migration completed successfully!')
  }

  /**
   * Execute a single migration rule
   */
  private async executeRule(rule: MigrationRule): Promise<void> {
    const fromPath = path.resolve(this.projectRoot, rule.from)
    const toPath = path.resolve(this.projectRoot, rule.to)

    console.log(`\n📦 Migrating: ${rule.from} → ${rule.to}`)

    // Check if source exists
    if (!fs.existsSync(fromPath)) {
      console.log(`⚠️  Source does not exist: ${fromPath}`)
      return
    }

    // Create destination directory
    const toDir = path.dirname(toPath)
    if (!this.dryRun) {
      fs.mkdirSync(toDir, { recursive: true })
    }

    // Update imports before moving files
    if (rule.updateImports) {
      await this.updateImportPaths(rule.from, rule.to)
    }

    // Move the file/directory
    if (!this.dryRun) {
      if (rule.preserveOriginal) {
        this.copyRecursive(fromPath, toPath)
      } else {
        fs.renameSync(fromPath, toPath)
      }
    }

    console.log(`✅ ${this.dryRun ? '[DRY RUN] ' : ''}Moved: ${rule.from} → ${rule.to}`)
  }

  /**
   * Update import paths throughout the codebase
   */
  private async updateImportPaths(oldPath: string, newPath: string): Promise<void> {
    const importUpdates = this.generateImportUpdates(oldPath, newPath)
    
    for (const update of importUpdates) {
      await this.updateImportsInFiles(update)
    }
  }

  /**
   * Generate import path updates
   */
  private generateImportUpdates(oldPath: string, newPath: string): ImportUpdate[] {
    const updates: ImportUpdate[] = []
    
    // Find all TypeScript/JavaScript files that might import from the old path
    const sourceFiles = this.findSourceFiles()
    
    // Generate different import patterns to search for
    const patterns = this.generateImportPatterns(oldPath)
    
    for (const pattern of patterns) {
      const newImportPath = this.convertToNewImportPath(pattern, oldPath, newPath)
      const affectedFiles = this.findFilesWithImport(sourceFiles, pattern)
      
      if (affectedFiles.length > 0) {
        updates.push({
          oldPath: pattern,
          newPath: newImportPath,
          files: affectedFiles
        })
      }
    }
    
    return updates
  }

  /**
   * Find all source files in the project
   */
  private findSourceFiles(): string[] {
    const extensions = ['.ts', '.tsx', '.js', '.jsx']
    const files: string[] = []
    
    const searchDirs = ['src', 'app', 'components', 'lib', 'hooks']
    
    for (const dir of searchDirs) {
      const dirPath = path.join(this.projectRoot, dir)
      if (fs.existsSync(dirPath)) {
        this.findFilesRecursive(dirPath, extensions, files)
      }
    }
    
    return files
  }

  /**
   * Recursively find files with specific extensions
   */
  private findFilesRecursive(dir: string, extensions: string[], files: string[]): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        this.findFilesRecursive(fullPath, extensions, files)
      } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath)
      }
    }
  }

  /**
   * Generate import patterns to search for
   */
  private generateImportPatterns(filePath: string): string[] {
    const patterns: string[] = []
    
    // Remove file extension and convert to import path
    const withoutExt = filePath.replace(/\.(ts|tsx|js|jsx)$/, '')
    
    // Add relative import patterns
    patterns.push(`@/${withoutExt}`)
    patterns.push(`./${withoutExt}`)
    patterns.push(`../${withoutExt}`)
    patterns.push(`../../${withoutExt}`)
    patterns.push(`../../../${withoutExt}`)
    
    // Add directory patterns if it's a directory
    if (fs.existsSync(path.join(this.projectRoot, filePath)) && 
        fs.statSync(path.join(this.projectRoot, filePath)).isDirectory()) {
      patterns.push(`@/${filePath}`)
      patterns.push(`./${filePath}`)
      patterns.push(`../${filePath}`)
    }
    
    return patterns
  }

  /**
   * Convert old import path to new import path
   */
  private convertToNewImportPath(oldPattern: string, oldPath: string, newPath: string): string {
    // Handle alias imports (@/)
    if (oldPattern.startsWith('@/')) {
      const relativePart = oldPattern.substring(2)
      const newRelativePart = relativePart.replace(oldPath.replace(/\.(ts|tsx|js|jsx)$/, ''), 
                                                   newPath.replace(/\.(ts|tsx|js|jsx)$/, ''))
      return `@/${newRelativePart}`
    }
    
    // Handle relative imports - this is more complex and would need path resolution
    // For now, convert to alias imports
    const withoutExt = newPath.replace(/\.(ts|tsx|js|jsx)$/, '')
    return `@/${withoutExt}`
  }

  /**
   * Find files that contain specific import patterns
   */
  private findFilesWithImport(files: string[], importPattern: string): string[] {
    const matchingFiles: string[] = []
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8')
        if (content.includes(importPattern)) {
          matchingFiles.push(file)
        }
      } catch (error) {
        if (this.verbose) {
          console.warn(`Warning: Could not read file ${file}:`, error)
        }
      }
    }
    
    return matchingFiles
  }

  /**
   * Update imports in specific files
   */
  private async updateImportsInFiles(update: ImportUpdate): Promise<void> {
    console.log(`🔄 Updating imports: ${update.oldPath} → ${update.newPath} in ${update.files.length} files`)
    
    for (const file of update.files) {
      if (!this.dryRun) {
        try {
          let content = fs.readFileSync(file, 'utf-8')
          
          // Replace import statements
          content = content.replace(
            new RegExp(`from ['"]${this.escapeRegex(update.oldPath)}['"]`, 'g'),
            `from '${update.newPath}'`
          )
          
          // Replace dynamic imports
          content = content.replace(
            new RegExp(`import\\(['"]${this.escapeRegex(update.oldPath)}['"]\\)`, 'g'),
            `import('${update.newPath}')`
          )
          
          fs.writeFileSync(file, content, 'utf-8')
          
          if (this.verbose) {
            console.log(`  ✅ Updated: ${path.relative(this.projectRoot, file)}`)
          }
        } catch (error) {
          console.error(`❌ Failed to update ${file}:`, error)
        }
      } else {
        console.log(`  📝 [DRY RUN] Would update: ${path.relative(this.projectRoot, file)}`)
      }
    }
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Copy files/directories recursively
   */
  private copyRecursive(src: string, dest: string): void {
    const stat = fs.statSync(src)
    
    if (stat.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true })
      const entries = fs.readdirSync(src)
      
      for (const entry of entries) {
        this.copyRecursive(path.join(src, entry), path.join(dest, entry))
      }
    } else {
      fs.copyFileSync(src, dest)
    }
  }

  /**
   * Verify TypeScript compilation after migration
   */
  async verifyCompilation(): Promise<boolean> {
    console.log('\n🔍 Verifying TypeScript compilation...')
    
    try {
      execSync('npx tsc --noEmit', { 
        cwd: this.projectRoot,
        stdio: this.verbose ? 'inherit' : 'pipe'
      })
      console.log('✅ TypeScript compilation successful!')
      return true
    } catch (error) {
      console.error('❌ TypeScript compilation failed!')
      if (this.verbose) {
        console.error(error)
      }
      return false
    }
  }
}

export { MigrationHelper, type MigrationRule, type ImportUpdate }
