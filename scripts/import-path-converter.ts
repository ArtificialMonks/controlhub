#!/usr/bin/env npx tsx

/**
 * Import Path Converter
 * 
 * Converts hardcoded absolute paths to relative, project-agnostic paths
 * to ensure portability and eliminate path dependencies that cause
 * module isolation issues.
 * 
 * Part of the A.V.A.R.I.C.E. Protocol Zero Isolation Policy compliance
 */

import * as fs from 'fs'
import * as path from 'path'
import * as glob from 'glob'

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface PathConversion {
  file: string
  originalPath: string
  convertedPath: string
  line: number
  type: 'ABSOLUTE_TO_RELATIVE' | 'HARDCODED_TO_ALIAS' | 'OPTIMIZATION'
}

interface ConversionReport {
  timestamp: string
  totalFiles: number
  filesModified: number
  conversionsApplied: number
  conversions: PathConversion[]
  pathOptimizations: {
    aliasesCreated: number
    relativePaths: number
    hardcodedPathsRemoved: number
  }
  errors: string[]
}

// ============================================================================
// IMPORT PATH CONVERTER CLASS
// ============================================================================

export class ImportPathConverter {
  private projectRoot: string
  private pathAliases: Map<string, string> = new Map()

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
    this.initializePathAliases()
  }

  /**
   * Initialize standard path aliases
   */
  private initializePathAliases(): void {
    this.pathAliases.set('src/', '@/')
    this.pathAliases.set('src/components/', '@/components/')
    this.pathAliases.set('src/lib/', '@/lib/')
    this.pathAliases.set('src/hooks/', '@/hooks/')
    this.pathAliases.set('src/types/', '@/types/')
    this.pathAliases.set('src/utils/', '@/utils/')
    this.pathAliases.set('src/app/', '@/app/')
    this.pathAliases.set('src/pages/', '@/pages/')
  }

  /**
   * Execute comprehensive path conversion
   */
  async convertPaths(): Promise<ConversionReport> {
    console.log('🔄 Starting Import Path Conversion...')
    
    const timestamp = new Date().toISOString()
    const conversions: PathConversion[] = []
    const errors: string[] = []
    
    // Find all TypeScript/JavaScript files
    const files = await this.findSourceFiles()
    console.log(`📁 Found ${files.length} source files`)
    
    let filesModified = 0
    
    for (const file of files) {
      try {
        const fileConversions = await this.convertFileImports(file)
        if (fileConversions.length > 0) {
          conversions.push(...fileConversions)
          filesModified++
          console.log(`✅ Converted ${fileConversions.length} paths in ${file}`)
        }
      } catch (error) {
        const errorMsg = `Failed to convert ${file}: ${error instanceof Error ? error.message : String(error)}`
        errors.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
      }
    }
    
    // Generate report
    const report: ConversionReport = {
      timestamp,
      totalFiles: files.length,
      filesModified,
      conversionsApplied: conversions.length,
      conversions,
      pathOptimizations: this.calculateOptimizations(conversions),
      errors
    }
    
    // Save report
    await this.saveConversionReport(report)
    
    console.log('\n🎯 Path Conversion Complete!')
    console.log(`📊 Files processed: ${files.length}`)
    console.log(`✏️  Files modified: ${filesModified}`)
    console.log(`🔄 Conversions applied: ${conversions.length}`)
    
    return report
  }

  /**
   * Find all source files to process
   */
  private async findSourceFiles(): Promise<string[]> {
    const patterns = [
      'src/**/*.ts',
      'src/**/*.tsx',
      'src/**/*.js',
      'src/**/*.jsx',
      '!src/**/*.test.*',
      '!src/**/*.spec.*',
      '!src/**/*.d.ts',
      '!node_modules/**',
      '!.next/**',
      '!dist/**',
      '!build/**'
    ]
    
    const files: string[] = []
    
    for (const pattern of patterns) {
      const matches = glob.sync(pattern, { cwd: this.projectRoot })
      files.push(...matches.map(file => path.resolve(this.projectRoot, file)))
    }
    
    return [...new Set(files)] // Remove duplicates
  }

  /**
   * Convert import paths in a single file
   */
  private async convertFileImports(filePath: string): Promise<PathConversion[]> {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    const conversions: PathConversion[] = []
    let modified = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNumber = i + 1
      
      // Check for import statements
      const importMatch = line.match(/import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/)
      if (importMatch) {
        const originalPath = importMatch[1]
        const convertedPath = this.convertImportPath(originalPath, filePath)
        
        if (convertedPath !== originalPath) {
          lines[i] = line.replace(originalPath, convertedPath)
          conversions.push({
            file: path.relative(this.projectRoot, filePath),
            originalPath,
            convertedPath,
            line: lineNumber,
            type: this.determineConversionType(originalPath, convertedPath)
          })
          modified = true
        }
      }
      
      // Check for dynamic imports
      const dynamicImportMatch = line.match(/import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/)
      if (dynamicImportMatch) {
        const originalPath = dynamicImportMatch[1]
        const convertedPath = this.convertImportPath(originalPath, filePath)
        
        if (convertedPath !== originalPath) {
          lines[i] = line.replace(originalPath, convertedPath)
          conversions.push({
            file: path.relative(this.projectRoot, filePath),
            originalPath,
            convertedPath,
            line: lineNumber,
            type: this.determineConversionType(originalPath, convertedPath)
          })
          modified = true
        }
      }
      
      // Check for require statements
      const requireMatch = line.match(/require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/)
      if (requireMatch) {
        const originalPath = requireMatch[1]
        const convertedPath = this.convertImportPath(originalPath, filePath)
        
        if (convertedPath !== originalPath) {
          lines[i] = line.replace(originalPath, convertedPath)
          conversions.push({
            file: path.relative(this.projectRoot, filePath),
            originalPath,
            convertedPath,
            line: lineNumber,
            type: this.determineConversionType(originalPath, convertedPath)
          })
          modified = true
        }
      }
    }
    
    // Write back modified content
    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'))
    }
    
    return conversions
  }

  /**
   * Convert a single import path
   */
  private convertImportPath(importPath: string, fromFile: string): string {
    // Skip external dependencies
    if (!importPath.startsWith('.') && !importPath.startsWith('/') && !importPath.startsWith('@/')) {
      return importPath
    }
    
    // Skip already optimized paths
    if (importPath.startsWith('@/')) {
      return importPath
    }
    
    // Convert absolute paths to relative or alias paths
    if (importPath.startsWith('/')) {
      return this.convertAbsolutePath(importPath)
    }
    
    // Optimize relative paths
    if (importPath.startsWith('.')) {
      return this.optimizeRelativePath(importPath, fromFile)
    }
    
    return importPath
  }

  /**
   * Convert absolute path to alias path
   */
  private convertAbsolutePath(absolutePath: string): string {
    // Remove leading slash
    const normalizedPath = absolutePath.startsWith('/') ? absolutePath.slice(1) : absolutePath
    
    // Check for alias matches
    for (const [prefix, alias] of this.pathAliases) {
      if (normalizedPath.startsWith(prefix)) {
        return normalizedPath.replace(prefix, alias)
      }
    }
    
    // Default to @/ alias for src/ paths
    if (normalizedPath.startsWith('src/')) {
      return normalizedPath.replace('src/', '@/')
    }
    
    return absolutePath
  }

  /**
   * Optimize relative path to use aliases when beneficial
   */
  private optimizeRelativePath(relativePath: string, fromFile: string): string {
    try {
      const fromDir = path.dirname(fromFile)
      const resolvedPath = path.resolve(fromDir, relativePath)
      const projectRelativePath = path.relative(this.projectRoot, resolvedPath)
      
      // Check if we can use an alias instead of a long relative path
      const segments = relativePath.split('/').filter(s => s === '..')
      if (segments.length >= 3) { // More than 2 levels up
        // Try to convert to alias
        for (const [prefix, alias] of this.pathAliases) {
          if (projectRelativePath.startsWith(prefix)) {
            return projectRelativePath.replace(prefix, alias)
          }
        }
        
        // Default to @/ alias if it's in src/
        if (projectRelativePath.startsWith('src/')) {
          return projectRelativePath.replace('src/', '@/')
        }
      }
    } catch (error) {
      // If path resolution fails, return original
      return relativePath
    }
    
    return relativePath
  }

  /**
   * Determine the type of conversion applied
   */
  private determineConversionType(originalPath: string, convertedPath: string): PathConversion['type'] {
    if (originalPath.startsWith('/') && convertedPath.startsWith('@/')) {
      return 'ABSOLUTE_TO_RELATIVE'
    }
    
    if (originalPath.includes('../../') && convertedPath.startsWith('@/')) {
      return 'HARDCODED_TO_ALIAS'
    }
    
    return 'OPTIMIZATION'
  }

  /**
   * Calculate optimization statistics
   */
  private calculateOptimizations(conversions: PathConversion[]): ConversionReport['pathOptimizations'] {
    const aliasesCreated = conversions.filter(c => c.convertedPath.startsWith('@/')).length
    const relativePaths = conversions.filter(c => c.type === 'ABSOLUTE_TO_RELATIVE').length
    const hardcodedPathsRemoved = conversions.filter(c => c.type === 'HARDCODED_TO_ALIAS').length
    
    return {
      aliasesCreated,
      relativePaths,
      hardcodedPathsRemoved
    }
  }

  /**
   * Save conversion report
   */
  private async saveConversionReport(report: ConversionReport): Promise<void> {
    const reportPath = path.join(this.projectRoot, 'avarice-protocol/logs/import-path-conversion-report.json')
    
    // Ensure directory exists
    const reportDir = path.dirname(reportPath)
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`📄 Conversion report saved to: ${reportPath}`)
  }

  /**
   * Validate TypeScript configuration supports path aliases
   */
  async validateTSConfig(): Promise<boolean> {
    const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json')
    
    if (!fs.existsSync(tsconfigPath)) {
      console.warn('⚠️  No tsconfig.json found')
      return false
    }
    
    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'))
      const paths = tsconfig.compilerOptions?.paths
      
      if (!paths || !paths['@/*']) {
        console.warn('⚠️  Path alias @/* not configured in tsconfig.json')
        console.log('💡 Add this to your tsconfig.json compilerOptions:')
        console.log('   "paths": { "@/*": ["./src/*"] }')
        return false
      }
      
      console.log('✅ TypeScript path aliases configured correctly')
      return true
    } catch (error) {
      console.error('❌ Failed to parse tsconfig.json:', error)
      return false
    }
  }

  /**
   * Create backup of files before conversion
   */
  async createBackup(): Promise<string> {
    const backupDir = path.join(this.projectRoot, '.backup-import-paths')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(backupDir, `backup-${timestamp}`)
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    // Copy src directory to backup
    const srcPath = path.join(this.projectRoot, 'src')
    if (fs.existsSync(srcPath)) {
      fs.cpSync(srcPath, path.join(backupPath, 'src'), { recursive: true })
      console.log(`💾 Backup created at: ${backupPath}`)
    }
    
    return backupPath
  }
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

if (require.main === module) {
  const converter = new ImportPathConverter()
  
  async function main() {
    try {
      // Validate TypeScript configuration
      const tsconfigValid = await converter.validateTSConfig()
      if (!tsconfigValid) {
        console.log('⚠️  Proceeding anyway, but path aliases may not work correctly')
      }
      
      // Create backup
      await converter.createBackup()
      
      // Execute conversion
      const report = await converter.convertPaths()
      
      if (report.conversionsApplied > 0) {
        console.log('\n🎉 Path conversion successful!')
        console.log('💡 Run TypeScript compilation to verify all paths resolve correctly:')
        console.log('   npx tsc --noEmit')
      } else {
        console.log('\n✅ No path conversions needed - all paths are already optimized!')
      }
      
      process.exit(0)
    } catch (error) {
      console.error('❌ Path conversion failed:', error)
      process.exit(1)
    }
  }
  
  main()
}
