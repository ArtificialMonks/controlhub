#!/usr/bin/env npx tsx

/**
 * Ecosystem Connectivity Validator
 * 
 * Comprehensive Zero Isolation Policy compliance audit tool that analyzes
 * module connectivity, identifies isolated components, and generates
 * detailed recovery strategies.
 * 
 * Part of the A.V.A.R.I.C.E. Protocol Phase 5 Multi-Layer Verification
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as glob from 'glob'

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface ModuleAnalysis {
  path: string
  imports: string[]
  exports: string[]
  importCount: number
  exportCount: number
  isReachable: boolean
  reachabilityReason: string
  dependencies: string[]
  dependents: string[]
}

interface ConnectivityReport {
  timestamp: string
  overallScore: number
  connectivityCompliance: number
  totalModules: number
  connectedModules: number
  isolatedModules: ModuleAnalysis[]
  brokenImports: string[]
  integrationPoints: {
    componentInterfaces: number
    serviceEndpoints: number
    stateStores: number
    eventChannels: number
  }
  violations: Array<{
    type: string
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    description: string
    impact: string
  }>
  recommendations: string[]
  recoveryStrategies: Array<{
    module: string
    strategy: string
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    estimatedEffort: string
  }>
}

// ============================================================================
// ECOSYSTEM CONNECTIVITY VALIDATOR CLASS
// ============================================================================

export class EcosystemConnectivityValidator {
  private projectRoot: string
  private entryPoints: string[]
  private moduleCache: Map<string, ModuleAnalysis> = new Map()

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
    this.entryPoints = [
      'src/app/**/*.tsx',
      'src/app/**/*.ts',
      'src/pages/**/*.tsx',
      'src/pages/**/*.ts',
      'src/components/**/*.tsx',
      'src/lib/**/*.ts',
      'src/hooks/**/*.ts'
    ]
  }

  /**
   * Execute comprehensive connectivity validation
   */
  async validateConnectivity(): Promise<ConnectivityReport> {
    console.log('🔍 Starting Ecosystem Connectivity Validation...')
    
    const timestamp = new Date().toISOString()
    
    // Step 1: Discover all modules
    const allModules = await this.discoverModules()
    console.log(`📊 Discovered ${allModules.length} modules`)
    
    // Step 2: Analyze each module
    const moduleAnalyses = await this.analyzeModules(allModules)
    console.log(`🔬 Analyzed ${moduleAnalyses.length} modules`)
    
    // Step 3: Build dependency graph
    const dependencyGraph = this.buildDependencyGraph(moduleAnalyses)
    console.log(`🕸️  Built dependency graph with ${dependencyGraph.nodes} nodes`)
    
    // Step 4: Identify reachable modules
    const reachabilityAnalysis = this.analyzeReachability(moduleAnalyses)
    console.log(`🎯 Reachability analysis complete`)
    
    // Step 5: Generate connectivity report
    const report = this.generateConnectivityReport(
      timestamp,
      moduleAnalyses,
      reachabilityAnalysis
    )
    
    // Step 6: Save report
    await this.saveReport(report)
    
    console.log(`✅ Connectivity validation complete. Score: ${report.overallScore.toFixed(1)}%`)
    
    return report
  }

  /**
   * Discover all TypeScript/JavaScript modules in the project
   */
  private async discoverModules(): Promise<string[]> {
    const patterns = [
      'src/**/*.ts',
      'src/**/*.tsx',
      'src/**/*.js',
      'src/**/*.jsx',
      '!src/**/*.test.*',
      '!src/**/*.spec.*',
      '!src/**/*.d.ts'
    ]
    
    const modules: string[] = []
    
    for (const pattern of patterns) {
      const files = glob.sync(pattern, { cwd: this.projectRoot })
      modules.push(...files.map(file => path.resolve(this.projectRoot, file)))
    }
    
    return [...new Set(modules)] // Remove duplicates
  }

  /**
   * Analyze individual modules for imports/exports
   */
  private async analyzeModules(modulePaths: string[]): Promise<ModuleAnalysis[]> {
    const analyses: ModuleAnalysis[] = []
    
    for (const modulePath of modulePaths) {
      try {
        const analysis = await this.analyzeModule(modulePath)
        analyses.push(analysis)
        this.moduleCache.set(modulePath, analysis)
      } catch (error) {
        console.warn(`⚠️  Failed to analyze ${modulePath}:`, error)
      }
    }
    
    return analyses
  }

  /**
   * Analyze a single module
   */
  private async analyzeModule(modulePath: string): Promise<ModuleAnalysis> {
    const content = fs.readFileSync(modulePath, 'utf-8')
    const relativePath = path.relative(this.projectRoot, modulePath)
    
    // Extract imports
    const imports = this.extractImports(content)
    
    // Extract exports
    const exports = this.extractExports(content)
    
    return {
      path: relativePath,
      imports,
      exports,
      importCount: imports.length,
      exportCount: exports.length,
      isReachable: false, // Will be determined later
      reachabilityReason: 'Not analyzed',
      dependencies: [],
      dependents: []
    }
  }

  /**
   * Extract import statements from module content
   */
  private extractImports(content: string): string[] {
    const imports: string[] = []
    
    // Match various import patterns
    const importPatterns = [
      /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
      /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
    ]
    
    for (const pattern of importPatterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1])
      }
    }
    
    return imports
  }

  /**
   * Extract export statements from module content
   */
  private extractExports(content: string): string[] {
    const exports: string[] = []
    
    // Match various export patterns
    const exportPatterns = [
      /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g,
      /export\s*\{\s*([^}]+)\s*\}/g,
      /export\s+default\s+(\w+)/g
    ]
    
    for (const pattern of exportPatterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        if (match[1].includes(',')) {
          // Handle multiple exports in braces
          const multipleExports = match[1].split(',').map(e => e.trim())
          exports.push(...multipleExports)
        } else {
          exports.push(match[1])
        }
      }
    }
    
    return exports
  }

  /**
   * Build dependency graph
   */
  private buildDependencyGraph(modules: ModuleAnalysis[]): { nodes: number; edges: number } {
    let edges = 0
    
    for (const module of modules) {
      for (const importPath of module.imports) {
        // Find the imported module
        const importedModule = this.resolveImport(importPath, module.path)
        if (importedModule) {
          module.dependencies.push(importedModule.path)
          importedModule.dependents.push(module.path)
          edges++
        }
      }
    }
    
    return { nodes: modules.length, edges }
  }

  /**
   * Resolve import path to actual module
   */
  private resolveImport(importPath: string, fromModule: string): ModuleAnalysis | null {
    // Skip external dependencies
    if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
      return null
    }
    
    // Resolve relative imports
    let resolvedPath: string
    if (importPath.startsWith('@/')) {
      resolvedPath = importPath.replace('@/', 'src/')
    } else {
      const fromDir = path.dirname(fromModule)
      resolvedPath = path.resolve(fromDir, importPath)
    }
    
    // Try different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx']
    for (const ext of extensions) {
      const fullPath = resolvedPath + ext
      if (this.moduleCache.has(fullPath)) {
        return this.moduleCache.get(fullPath)!
      }
    }
    
    return null
  }

  /**
   * Analyze module reachability from entry points
   */
  private analyzeReachability(modules: ModuleAnalysis[]): void {
    const visited = new Set<string>()
    const entryModules = this.findEntryModules(modules)
    
    console.log(`🚪 Found ${entryModules.length} entry point modules`)
    
    // Mark all modules reachable from entry points
    for (const entryModule of entryModules) {
      this.markReachable(entryModule, visited, modules)
    }
    
    // Update reachability status
    for (const module of modules) {
      module.isReachable = visited.has(module.path)
      module.reachabilityReason = module.isReachable 
        ? 'Reachable from entry points'
        : 'Not reachable from main entry points'
    }
  }

  /**
   * Find entry point modules (pages, API routes, etc.)
   */
  private findEntryModules(modules: ModuleAnalysis[]): ModuleAnalysis[] {
    return modules.filter(module => {
      const path = module.path
      return (
        path.includes('src/app/') ||
        path.includes('src/pages/') ||
        path.includes('src/app/api/') ||
        path.includes('src/pages/api/') ||
        path.includes('layout.tsx') ||
        path.includes('page.tsx') ||
        path.includes('route.ts')
      )
    })
  }

  /**
   * Recursively mark modules as reachable
   */
  private markReachable(
    module: ModuleAnalysis,
    visited: Set<string>,
    allModules: ModuleAnalysis[]
  ): void {
    if (visited.has(module.path)) return
    
    visited.add(module.path)
    
    // Mark all dependencies as reachable
    for (const depPath of module.dependencies) {
      const depModule = allModules.find(m => m.path === depPath)
      if (depModule) {
        this.markReachable(depModule, visited, allModules)
      }
    }
  }

  /**
   * Generate comprehensive connectivity report
   */
  private generateConnectivityReport(
    timestamp: string,
    modules: ModuleAnalysis[],
    _reachabilityAnalysis: void
  ): ConnectivityReport {
    const connectedModules = modules.filter(m => m.isReachable)
    const isolatedModules = modules.filter(m => !m.isReachable)
    
    const connectivityCompliance = (connectedModules.length / modules.length) * 100
    const overallScore = connectivityCompliance
    
    const violations = []
    if (connectivityCompliance < 100) {
      violations.push({
        type: 'CONNECTIVITY_VIOLATION',
        severity: 'CRITICAL' as const,
        description: `Connectivity compliance ${connectivityCompliance.toFixed(1)}% below required 100%`,
        impact: 'System integrity compromised'
      })
    }
    
    if (isolatedModules.length > 0) {
      violations.push({
        type: 'ISOLATED_MODULES',
        severity: 'HIGH' as const,
        description: `${isolatedModules.length} isolated modules detected`,
        impact: 'Dead code and unused functionality'
      })
    }
    
    const recommendations = [
      `Connect ${isolatedModules.length} isolated modules to main system`,
      '⚠️ Zero Isolation Policy violations must be resolved'
    ]
    
    const recoveryStrategies = isolatedModules.map(module => ({
      module: module.path,
      strategy: this.generateRecoveryStrategy(module),
      priority: 'HIGH' as const,
      estimatedEffort: '30-60 minutes'
    }))
    
    return {
      timestamp,
      overallScore,
      connectivityCompliance,
      totalModules: modules.length,
      connectedModules: connectedModules.length,
      isolatedModules,
      brokenImports: [],
      integrationPoints: {
        componentInterfaces: this.countComponentInterfaces(modules),
        serviceEndpoints: this.countServiceEndpoints(modules),
        stateStores: this.countStateStores(modules),
        eventChannels: this.countEventChannels(modules)
      },
      violations,
      recommendations,
      recoveryStrategies
    }
  }

  /**
   * Generate recovery strategy for isolated module
   */
  private generateRecoveryStrategy(module: ModuleAnalysis): string {
    if (module.path.includes('components/')) {
      return 'Import and use component in appropriate pages or parent components'
    } else if (module.path.includes('hooks/')) {
      return 'Import and use hook in relevant components'
    } else if (module.path.includes('lib/') || module.path.includes('utils/')) {
      return 'Import and use utility functions in appropriate modules'
    } else if (module.path.includes('types/')) {
      return 'Import and use type definitions in relevant modules'
    } else {
      return 'Analyze module purpose and create appropriate import connections'
    }
  }

  /**
   * Count component interfaces
   */
  private countComponentInterfaces(modules: ModuleAnalysis[]): number {
    return modules.filter(m => 
      m.path.includes('components/') && m.exportCount > 0
    ).length
  }

  /**
   * Count service endpoints
   */
  private countServiceEndpoints(modules: ModuleAnalysis[]): number {
    return modules.filter(m => 
      m.path.includes('api/') || m.path.includes('services/')
    ).length
  }

  /**
   * Count state stores
   */
  private countStateStores(modules: ModuleAnalysis[]): number {
    return modules.filter(m =>
      m.path.includes('store') || m.path.includes('context')
    ).length
  }

  /**
   * Count event channels
   */
  private countEventChannels(modules: ModuleAnalysis[]): number {
    return modules.filter(m => 
      m.path.includes('events') || m.path.includes('websocket')
    ).length
  }

  /**
   * Save connectivity report
   */
  private async saveReport(report: ConnectivityReport): Promise<void> {
    const reportPath = path.join(this.projectRoot, 'avarice-protocol/logs/zero-isolation-verification-report.json')
    
    // Ensure directory exists
    const reportDir = path.dirname(reportPath)
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`📄 Report saved to: ${reportPath}`)
  }
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

if (require.main === module) {
  const validator = new EcosystemConnectivityValidator()
  validator.validateConnectivity()
    .then(report => {
      console.log('\n🎯 Zero Isolation Policy Compliance Audit Complete!')
      console.log(`📊 Overall Score: ${report.overallScore.toFixed(1)}%`)
      console.log(`🔗 Connectivity: ${report.connectivityCompliance.toFixed(1)}%`)
      console.log(`📦 Total Modules: ${report.totalModules}`)
      console.log(`✅ Connected: ${report.connectedModules}`)
      console.log(`❌ Isolated: ${report.isolatedModules.length}`)
      
      if (report.isolatedModules.length > 0) {
        console.log('\n🚨 Isolated Modules:')
        report.isolatedModules.forEach(module => {
          console.log(`   - ${module.path} (${module.exportCount} exports)`)
        })
      }
      
      process.exit(report.isolatedModules.length > 0 ? 1 : 0)
    })
    .catch(error => {
      console.error('❌ Connectivity validation failed:', error)
      process.exit(1)
    })
}
