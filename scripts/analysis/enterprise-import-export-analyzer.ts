#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { AdvancedASTAnalyzer, type ASTAnalysisResult } from '../utils/ast-utilities.js';
import { createConfig, type ImportExportConfig } from '../config/import-export-config.js';

/**
 * Enterprise-Grade Import/Export Analyzer
 * Integrates advanced AST parsing with TypeScript-ESLint best practices
 * Based on research findings from Context7 and EXA web search
 */

export interface AnalysisReport {
  timestamp: string;
  projectRoot: string;
  totalFiles: number;
  analysisResults: Map<string, ASTAnalysisResult>;
  globalMetrics: GlobalMetrics;
  recommendations: Recommendation[];
  riskAssessment: RiskAssessment;
  performanceProfile: PerformanceProfile;
}

export interface GlobalMetrics {
  totalImports: number;
  totalExports: number;
  unusedImports: number;
  unusedExports: number;
  circularDependencies: string[][];
  averageComplexity: number;
  frameworkDependencies: string[];
  bundleSizeEstimate: number;
  treeshakingOpportunities: number;
}

export interface Recommendation {
  type: 'REMOVE' | 'PRESERVE' | 'IMPLEMENT' | 'RELOCATE' | 'OPTIMIZE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  filePath: string;
  description: string;
  impact: string;
  automatable: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedSavings?: {
    bundleSize?: number;
    buildTime?: number;
    maintainability?: number;
  };
}

export interface RiskAssessment {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  criticalFiles: string[];
  safeDeletions: number;
  reviewRequired: number;
  potentialBreakingChanges: string[];
}

export interface PerformanceProfile {
  analysisTime: number;
  memoryUsage: number;
  filesPerSecond: number;
  cacheHitRate: number;
  parsingErrors: number;
}

export class EnterpriseImportExportAnalyzer {
  private config: ImportExportConfig;
  private astAnalyzer: AdvancedASTAnalyzer;
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private reverseGraph: Map<string, Set<string>> = new Map();
  private analysisCache: Map<string, ASTAnalysisResult> = new Map();
  private performanceMetrics = {
    startTime: 0,
    fileCount: 0,
    cacheHits: 0,
    parsingErrors: 0
  };

  constructor(userConfig?: Partial<ImportExportConfig>) {
    this.config = createConfig(userConfig);
    this.astAnalyzer = new AdvancedASTAnalyzer(this.config.analysis.frameworkEssentials);
  }

  /**
   * Main analysis entry point
   */
  async analyzeProject(projectRoot: string): Promise<AnalysisReport> {
    console.log('🔍 Starting Enterprise-Grade Import/Export Analysis');
    console.log('='.repeat(60));
    
    this.performanceMetrics.startTime = Date.now();
    
    // Initialize TypeScript program for advanced analysis
    if (this.config.parsing.enableTypeChecking) {
      this.astAnalyzer.initializeTypeScript(projectRoot);
    }

    // Discover files to analyze
    const filesToAnalyze = await this.discoverFiles(projectRoot);
    console.log(`📁 Discovered ${filesToAnalyze.length} files to analyze`);

    // Perform analysis with progress tracking
    const analysisResults = await this.analyzeFiles(filesToAnalyze);
    
    // Build dependency graphs
    this.buildDependencyGraphs(analysisResults);
    
    // Generate comprehensive report
    const report = this.generateReport(projectRoot, analysisResults);
    
    // Cache results for future runs
    await this.cacheResults(projectRoot, report);
    
    console.log('✅ Analysis Complete');
    this.printPerformanceMetrics();
    
    return report;
  }

  /**
   * Discover files to analyze based on configuration
   */
  private async discoverFiles(projectRoot: string): Promise<string[]> {
    const allFiles: string[] = [];
    
    for (const includePattern of this.config.analysis.includePatterns) {
      const pattern = path.join(projectRoot, includePattern);
      const files = await glob(pattern, {
        ignore: this.config.analysis.excludePatterns.map(p => path.join(projectRoot, p)),
        absolute: true
      });
      allFiles.push(...files);
    }
    
    // Remove duplicates and filter by include/exclude paths
    const uniqueFiles = [...new Set(allFiles)];
    return uniqueFiles.filter(file => this.shouldAnalyzeFile(file, projectRoot));
  }

  /**
   * Check if a file should be analyzed based on configuration
   */
  private shouldAnalyzeFile(filePath: string, projectRoot: string): boolean {
    const relativePath = path.relative(projectRoot, filePath);
    
    // Check include paths
    const shouldInclude = this.config.analysis.includePaths.some(includePath =>
      relativePath.startsWith(includePath)
    );
    
    if (!shouldInclude) return false;
    
    // Check exclude paths
    const shouldExclude = this.config.analysis.excludePaths.some(excludePath =>
      relativePath.startsWith(excludePath)
    );
    
    return !shouldExclude;
  }

  /**
   * Analyze multiple files with progress tracking and caching
   */
  private async analyzeFiles(filePaths: string[]): Promise<Map<string, ASTAnalysisResult>> {
    const results = new Map<string, ASTAnalysisResult>();
    const batchSize = this.config.optimization.batchSize;
    
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      const batchPromises = batch.map(filePath => this.analyzeFileWithCache(filePath));
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach((result, index) => {
        if (result) {
          results.set(batch[index], result);
        }
      });
      
      // Progress update
      const progress = Math.round(((i + batch.length) / filePaths.length) * 100);
      console.log(`📊 Analysis Progress: ${progress}% (${i + batch.length}/${filePaths.length})`);
    }
    
    this.performanceMetrics.fileCount = results.size;
    return results;
  }

  /**
   * Analyze single file with caching support
   */
  private async analyzeFileWithCache(filePath: string): Promise<ASTAnalysisResult | null> {
    try {
      const fileStats = fs.statSync(filePath);
      const cacheKey = `${filePath}:${fileStats.mtime.getTime()}`;
      
      // Check cache
      if (this.analysisCache.has(cacheKey)) {
        this.performanceMetrics.cacheHits++;
        return this.analysisCache.get(cacheKey)!;
      }
      
      // Perform analysis
      const result = this.astAnalyzer.analyzeFile(filePath);
      
      // Enhanced analysis with additional metrics
      result.cyclomaticComplexity = await this.calculateEnhancedComplexity(filePath);
      
      // Cache result
      this.analysisCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      this.performanceMetrics.parsingErrors++;
      console.warn(`⚠️  Failed to analyze ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Calculate enhanced complexity metrics
   */
  private async calculateEnhancedComplexity(filePath: string): Promise<number> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Basic complexity factors
      let complexity = 1;
      
      // Control flow statements
      const controlFlowMatches = content.match(/(if|else|while|for|switch|case|catch|finally)/g);
      complexity += controlFlowMatches ? controlFlowMatches.length : 0;
      
      // Logical operators
      const logicalMatches = content.match(/(\|\||&&|\?)/g);
      complexity += logicalMatches ? logicalMatches.length : 0;
      
      // Function/method definitions
      const functionMatches = content.match(/(function|=>|\bclass\b)/g);
      complexity += functionMatches ? functionMatches.length * 0.5 : 0;
      
      return Math.round(complexity);
    } catch {
      return 1;
    }
  }

  /**
   * Build dependency graphs for circular dependency detection
   */
  private buildDependencyGraphs(analysisResults: Map<string, ASTAnalysisResult>): void {
    // Build forward dependency graph
    for (const [filePath, result] of analysisResults) {
      this.dependencyGraph.set(filePath, new Set());
      
      for (const importInfo of result.imports) {
        if (importInfo.importPath.startsWith('.')) {
          // Resolve relative import path
          const resolvedPath = path.resolve(path.dirname(filePath), importInfo.importPath);
          this.dependencyGraph.get(filePath)!.add(resolvedPath);
        }
      }
    }
    
    // Build reverse dependency graph
    for (const [filePath, dependencies] of this.dependencyGraph) {
      for (const dependency of dependencies) {
        if (!this.reverseGraph.has(dependency)) {
          this.reverseGraph.set(dependency, new Set());
        }
        this.reverseGraph.get(dependency)!.add(filePath);
      }
    }
  }

  /**
   * Detect circular dependencies using DFS
   */
  private detectCircularDependencies(): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];
    
    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        // Found cycle
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart).concat(node));
        }
        return;
      }
      
      if (visited.has(node)) return;
      
      visited.add(node);
      recursionStack.add(node);
      
      const dependencies = this.dependencyGraph.get(node) || new Set();
      for (const dependency of dependencies) {
        dfs(dependency, [...path, node]);
      }
      
      recursionStack.delete(node);
    };
    
    for (const node of this.dependencyGraph.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }
    
    return cycles;
  }

  /**
   * Generate comprehensive analysis report
   */
  private generateReport(projectRoot: string, analysisResults: Map<string, ASTAnalysisResult>): AnalysisReport {
    const globalMetrics = this.calculateGlobalMetrics(analysisResults);
    const recommendations = this.generateRecommendations(analysisResults);
    const riskAssessment = this.assessRisks(recommendations);
    const performanceProfile = this.getPerformanceProfile();
    
    return {
      timestamp: new Date().toISOString(),
      projectRoot,
      totalFiles: analysisResults.size,
      analysisResults,
      globalMetrics,
      recommendations,
      riskAssessment,
      performanceProfile
    };
  }

  /**
   * Calculate global metrics across all analyzed files
   */
  private calculateGlobalMetrics(analysisResults: Map<string, ASTAnalysisResult>): GlobalMetrics {
    let totalImports = 0;
    let totalExports = 0;
    const complexities: number[] = [];
    const frameworkDeps = new Set<string>();
    
    for (const result of analysisResults.values()) {
      totalImports += result.imports.length;
      totalExports += result.exports.length;
      complexities.push(result.cyclomaticComplexity);
      
      result.imports.forEach(imp => {
        if (imp.isFrameworkEssential) {
          frameworkDeps.add(imp.importPath);
        }
      });
    }
    
    const circularDependencies = this.detectCircularDependencies();
    const averageComplexity = complexities.reduce((a, b) => a + b, 0) / complexities.length || 0;
    
    return {
      totalImports,
      totalExports,
      unusedImports: 0, // Will be calculated by usage analysis
      unusedExports: 0, // Will be calculated by usage analysis
      circularDependencies,
      averageComplexity: Math.round(averageComplexity * 100) / 100,
      frameworkDependencies: Array.from(frameworkDeps),
      bundleSizeEstimate: this.estimateBundleSize(analysisResults),
      treeshakingOpportunities: this.calculateTreeshakingOpportunities(analysisResults)
    };
  }

  /**
   * Estimate bundle size impact
   */
  private estimateBundleSize(analysisResults: Map<string, ASTAnalysisResult>): number {
    let totalSize = 0;
    
    for (const [filePath] of analysisResults) {
      try {
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      } catch {
        // File might not exist, skip
      }
    }
    
    return totalSize;
  }

  /**
   * Calculate tree-shaking opportunities
   */
  private calculateTreeshakingOpportunities(analysisResults: Map<string, ASTAnalysisResult>): number {
    let opportunities = 0;
    
    for (const result of analysisResults.values()) {
      // Count imports that could benefit from tree-shaking
      opportunities += result.imports.filter(imp => 
        !imp.isNamespace && !imp.isDynamic && imp.importedNames.length > 1
      ).length;
    }
    
    return opportunities;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(analysisResults: Map<string, ASTAnalysisResult>): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    for (const [filePath, result] of analysisResults) {
      // Analyze each import for optimization opportunities
      for (const importInfo of result.imports) {
        if (importInfo.riskLevel === 'LOW' && !this.isImportUsed(filePath, importInfo, analysisResults)) {
          recommendations.push({
            type: 'REMOVE',
            priority: 'MEDIUM',
            filePath,
            description: `Remove unused import: ${importInfo.importPath}`,
            impact: 'Reduces bundle size and improves build performance',
            automatable: true,
            riskLevel: importInfo.riskLevel,
            estimatedSavings: {
              bundleSize: this.estimateImportSize(importInfo),
              buildTime: 50, // milliseconds
              maintainability: 1
            }
          });
        }
      }
      
      // Check for barrel pattern optimization
      if (result.hasBarrelPattern) {
        recommendations.push({
          type: 'OPTIMIZE',
          priority: 'LOW',
          filePath,
          description: 'Consider breaking up barrel exports for better tree-shaking',
          impact: 'Improves tree-shaking and reduces bundle size',
          automatable: false,
          riskLevel: 'LOW'
        });
      }
      
      // High complexity warning
      if (result.cyclomaticComplexity > 15) {
        recommendations.push({
          type: 'OPTIMIZE',
          priority: 'MEDIUM',
          filePath,
          description: `High complexity (${result.cyclomaticComplexity}) - consider refactoring`,
          impact: 'Improves maintainability and reduces bugs',
          automatable: false,
          riskLevel: 'LOW'
        });
      }
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Check if an import is actually used in the file
   */
  private isImportUsed(filePath: string, importInfo: any, analysisResults: Map<string, ASTAnalysisResult>): boolean {
    // This would require more sophisticated usage analysis
    // For now, return true to avoid false positives
    return true;
  }

  /**
   * Estimate the size impact of an import
   */
  private estimateImportSize(importInfo: any): number {
    // Basic estimation - would need actual bundler analysis for accuracy
    if (importInfo.isFrameworkEssential) return 0;
    if (importInfo.isDynamic) return 1000; // Dynamic imports are larger
    return 100; // Basic import size estimate
  }

  /**
   * Assess risks of proposed changes
   */
  private assessRisks(recommendations: Recommendation[]): RiskAssessment {
    const highRiskRecs = recommendations.filter(r => r.riskLevel === 'HIGH');
    const safeDeletions = recommendations.filter(r => r.riskLevel === 'LOW' && r.automatable).length;
    const reviewRequired = recommendations.filter(r => r.riskLevel === 'MEDIUM' || r.riskLevel === 'HIGH').length;
    
    return {
      overallRisk: highRiskRecs.length > 0 ? 'HIGH' : reviewRequired > 10 ? 'MEDIUM' : 'LOW',
      criticalFiles: highRiskRecs.map(r => r.filePath),
      safeDeletions,
      reviewRequired,
      potentialBreakingChanges: highRiskRecs.map(r => r.description)
    };
  }

  /**
   * Get performance metrics
   */
  private getPerformanceProfile(): PerformanceProfile {
    const totalTime = Date.now() - this.performanceMetrics.startTime;
    
    return {
      analysisTime: totalTime,
      memoryUsage: process.memoryUsage().heapUsed,
      filesPerSecond: Math.round((this.performanceMetrics.fileCount / totalTime) * 1000 * 100) / 100,
      cacheHitRate: Math.round((this.performanceMetrics.cacheHits / this.performanceMetrics.fileCount) * 100),
      parsingErrors: this.performanceMetrics.parsingErrors
    };
  }

  /**
   * Cache analysis results for future runs
   */
  private async cacheResults(projectRoot: string, report: AnalysisReport): Promise<void> {
    if (!this.config.reporting.outputDirectory) return;
    
    const cacheDir = path.join(projectRoot, this.config.reporting.outputDirectory, '.cache');
    fs.mkdirSync(cacheDir, { recursive: true });
    
    const cacheFile = path.join(cacheDir, 'analysis-cache.json');
    const cacheData = {
      timestamp: report.timestamp,
      analysisResults: Array.from(report.analysisResults.entries())
    };
    
    fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
  }

  /**
   * Print performance metrics
   */
  private printPerformanceMetrics(): void {
    const profile = this.getPerformanceProfile();
    
    console.log('\n📊 Performance Metrics:');
    console.log(`   ⏱️  Analysis Time: ${profile.analysisTime}ms`);
    console.log(`   📁 Files Analyzed: ${this.performanceMetrics.fileCount}`);
    console.log(`   🚀 Speed: ${profile.filesPerSecond} files/sec`);
    console.log(`   💾 Cache Hit Rate: ${profile.cacheHitRate}%`);
    console.log(`   ⚠️  Parsing Errors: ${profile.parsingErrors}`);
    console.log(`   🧠 Memory Usage: ${Math.round(profile.memoryUsage / 1024 / 1024)}MB`);
  }
}

// Main execution
if (require.main === module) {
  const analyzer = new EnterpriseImportExportAnalyzer();
  analyzer.analyzeProject(process.cwd())
    .then(report => {
      console.log(`\n✅ Analysis complete! Found ${report.recommendations.length} recommendations.`);
      
      // Output summary
      console.log('\n📋 Summary:');
      console.log(`   📁 Files Analyzed: ${report.totalFiles}`);
      console.log(`   📦 Total Imports: ${report.globalMetrics.totalImports}`);
      console.log(`   📤 Total Exports: ${report.globalMetrics.totalExports}`);
      console.log(`   🔄 Circular Dependencies: ${report.globalMetrics.circularDependencies.length}`);
      console.log(`   🎯 Optimization Opportunities: ${report.recommendations.length}`);
      console.log(`   ⚠️  Overall Risk: ${report.riskAssessment.overallRisk}`);
    })
    .catch(error => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}