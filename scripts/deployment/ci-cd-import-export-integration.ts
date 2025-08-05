#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { EnterpriseImportExportAnalyzer } from '../analysis/enterprise-import-export-analyzer.js';
import { EnterpriseImportExportOptimizer } from '../optimization/enterprise-import-export-optimizer.js';
import { createConfig, CONFIG_PRESETS } from '../config/import-export-config.js';

/**
 * CI/CD Pipeline Integration for Enterprise Import/Export Optimization
 * Provides automated quality gates, performance monitoring, and continuous optimization
 */

export interface CICDConfig {
  environment: 'development' | 'staging' | 'production';
  qualityGates: {
    bundleSizeThreshold: number; // Maximum allowed bundle size increase (bytes)
    unusedImportsThreshold: number; // Maximum allowed unused imports
    buildTimeThreshold: number; // Maximum allowed build time increase (ms)
    complexityThreshold: number; // Maximum allowed cyclomatic complexity
  };
  notifications: {
    slack?: {
      webhook: string;
      channel: string;
    };
    email?: {
      recipients: string[];
      smtp: string;
    };
  };
  reporting: {
    uploadToS3?: {
      bucket: string;
      region: string;
    };
    githubComment?: {
      token: string;
      repository: string;
    };
  };
}

export interface QualityGateResult {
  gate: string;
  passed: boolean;
  actual: number;
  threshold: number;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
}

export interface CICDReport {
  timestamp: string;
  environment: string;
  commit: string;
  branch: string;
  buildNumber: string;
  qualityGates: QualityGateResult[];
  overallStatus: 'PASSED' | 'WARNING' | 'FAILED';
  recommendations: string[];
  performanceMetrics: {
    analysisTime: number;
    bundleSizeChange: number;
    unusedImportsFound: number;
    optimizationsApplied: number;
  };
  artifacts: {
    reportUrl?: string;
    backupLocation?: string;
    logsUrl?: string;
  };
}

export class CICDImportExportIntegration {
  private config: CICDConfig;
  private projectRoot: string;
  private buildInfo: {
    commit: string;
    branch: string;
    buildNumber: string;
  };

  constructor(projectRoot: string, config: CICDConfig) {
    this.projectRoot = projectRoot;
    this.config = config;
    this.buildInfo = this.extractBuildInfo();
  }

  /**
   * Main CI/CD integration entry point
   */
  async runCICDPipeline(): Promise<CICDReport> {
    console.log('🚀 CI/CD Import/Export Optimization Pipeline');
    console.log('='.repeat(60));
    console.log(`🌍 Environment: ${this.config.environment}`);
    console.log(`🔧 Commit: ${this.buildInfo.commit}`);
    console.log(`🌿 Branch: ${this.buildInfo.branch}`);
    console.log(`🏗️  Build: ${this.buildInfo.buildNumber}`);

    const startTime = Date.now();
    const report: CICDReport = {
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      commit: this.buildInfo.commit,
      branch: this.buildInfo.branch,
      buildNumber: this.buildInfo.buildNumber,
      qualityGates: [],
      overallStatus: 'PASSED',
      recommendations: [],
      performanceMetrics: {
        analysisTime: 0,
        bundleSizeChange: 0,
        unusedImportsFound: 0,
        optimizationsApplied: 0
      },
      artifacts: {}
    };

    try {
      // Phase 1: Pre-optimization Analysis
      console.log('\n🔍 Phase 1: Pre-optimization Analysis');
      const preAnalysis = await this.runPreAnalysis();
      
      // Phase 2: Quality Gate Validation
      console.log('\n🛡️  Phase 2: Quality Gate Validation');
      const qualityGates = await this.runQualityGates(preAnalysis);
      report.qualityGates = qualityGates;
      
      // Phase 3: Conditional Optimization
      console.log('\n⚡ Phase 3: Conditional Optimization');
      const shouldOptimize = this.shouldRunOptimization(qualityGates);
      let optimizationResults = null;
      
      if (shouldOptimize) {
        optimizationResults = await this.runOptimization();
        report.performanceMetrics.optimizationsApplied = optimizationResults.results.succeeded.length;
      }
      
      // Phase 4: Post-optimization Validation
      console.log('\n✅ Phase 4: Post-optimization Validation');
      const postValidation = await this.runPostValidation(optimizationResults);
      
      // Phase 5: Report Generation
      console.log('\n📊 Phase 5: Report Generation');
      report.performanceMetrics.analysisTime = Date.now() - startTime;
      report.performanceMetrics.unusedImportsFound = preAnalysis.globalMetrics.unusedImports;
      report.overallStatus = this.calculateOverallStatus(qualityGates);
      report.recommendations = this.generateRecommendations(preAnalysis, qualityGates);
      
      // Phase 6: Artifact Upload and Notifications
      console.log('\n📤 Phase 6: Artifact Upload and Notifications');
      await this.uploadArtifacts(report, preAnalysis);
      await this.sendNotifications(report);
      
      return report;

    } catch (error) {
      console.error('❌ CI/CD Pipeline failed:', error);
      report.overallStatus = 'FAILED';
      report.recommendations.push(`Pipeline failed: ${error instanceof Error ? error.message : String(error)}`);
      
      await this.handlePipelineFailure(error, report);
      throw error;
    }
  }

  /**
   * Extract build information from CI environment
   */
  private extractBuildInfo() {
    return {
      commit: process.env.GITHUB_SHA || 
              process.env.GITLAB_COMMIT_SHA || 
              process.env.CI_COMMIT_SHA || 
              this.getGitCommit(),
      branch: process.env.GITHUB_REF_NAME || 
              process.env.GITLAB_BRANCH || 
              process.env.CI_COMMIT_REF_NAME || 
              this.getGitBranch(),
      buildNumber: process.env.GITHUB_RUN_NUMBER || 
                   process.env.GITLAB_PIPELINE_ID || 
                   process.env.CI_PIPELINE_ID || 
                   Date.now().toString()
    };
  }

  /**
   * Get Git commit hash
   */
  private getGitCommit(): string {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get Git branch name
   */
  private getGitBranch(): string {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Run pre-optimization analysis
   */
  private async runPreAnalysis() {
    const config = createConfig({
      ...CONFIG_PRESETS.PERFORMANCE_FOCUSED,
      optimization: { dryRun: true } // Always dry-run in CI
    });
    
    const analyzer = new EnterpriseImportExportAnalyzer(config);
    return await analyzer.analyzeProject(this.projectRoot);
  }

  /**
   * Run quality gates validation
   */
  private async runQualityGates(analysisReport: any): Promise<QualityGateResult[]> {
    const gates: QualityGateResult[] = [];
    
    // Bundle Size Gate
    const bundleSizeGate = await this.validateBundleSize(analysisReport);
    gates.push(bundleSizeGate);
    
    // Unused Imports Gate
    const unusedImportsGate = this.validateUnusedImports(analysisReport);
    gates.push(unusedImportsGate);
    
    // Build Time Gate
    const buildTimeGate = await this.validateBuildTime();
    gates.push(buildTimeGate);
    
    // Complexity Gate
    const complexityGate = this.validateComplexity(analysisReport);
    gates.push(complexityGate);
    
    // Security Gate
    const securityGate = await this.validateSecurity(analysisReport);
    gates.push(securityGate);
    
    return gates;
  }

  /**
   * Validate bundle size
   */
  private async validateBundleSize(analysisReport: any): Promise<QualityGateResult> {
    const currentSize = analysisReport.globalMetrics.bundleSizeEstimate;
    const threshold = this.config.qualityGates.bundleSizeThreshold;
    
    // Compare with previous build if available
    const previousSize = await this.getPreviousBundleSize();
    const sizeIncrease = previousSize ? currentSize - previousSize : 0;
    
    return {
      gate: 'Bundle Size',
      passed: sizeIncrease <= threshold,
      actual: sizeIncrease,
      threshold,
      severity: sizeIncrease > threshold ? 'ERROR' : sizeIncrease > threshold * 0.8 ? 'WARNING' : 'INFO',
      message: `Bundle size ${sizeIncrease > 0 ? 'increased' : 'decreased'} by ${Math.abs(sizeIncrease)} bytes`
    };
  }

  /**
   * Validate unused imports count
   */
  private validateUnusedImports(analysisReport: any): QualityGateResult {
    const unusedImports = analysisReport.globalMetrics.unusedImports;
    const threshold = this.config.qualityGates.unusedImportsThreshold;
    
    return {
      gate: 'Unused Imports',
      passed: unusedImports <= threshold,
      actual: unusedImports,
      threshold,
      severity: unusedImports > threshold ? 'WARNING' : 'INFO',
      message: `Found ${unusedImports} unused imports (threshold: ${threshold})`
    };
  }

  /**
   * Validate build time
   */
  private async validateBuildTime(): Promise<QualityGateResult> {
    const startTime = Date.now();
    
    try {
      // Run a test build
      execSync('npm run build', { 
        cwd: this.projectRoot,
        stdio: 'pipe',
        timeout: 300000 // 5 minutes max
      });
      
      const buildTime = Date.now() - startTime;
      const threshold = this.config.qualityGates.buildTimeThreshold;
      
      return {
        gate: 'Build Time',
        passed: buildTime <= threshold,
        actual: buildTime,
        threshold,
        severity: buildTime > threshold ? 'WARNING' : 'INFO',
        message: `Build completed in ${buildTime}ms (threshold: ${threshold}ms)`
      };
      
    } catch (error) {
      return {
        gate: 'Build Time',
        passed: false,
        actual: Date.now() - startTime,
        threshold: this.config.qualityGates.buildTimeThreshold,
        severity: 'ERROR',
        message: `Build failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Validate complexity metrics
   */
  private validateComplexity(analysisReport: any): QualityGateResult {
    const avgComplexity = analysisReport.globalMetrics.averageComplexity;
    const threshold = this.config.qualityGates.complexityThreshold;
    
    return {
      gate: 'Complexity',
      passed: avgComplexity <= threshold,
      actual: avgComplexity,
      threshold,
      severity: avgComplexity > threshold ? 'WARNING' : 'INFO',
      message: `Average cyclomatic complexity: ${avgComplexity} (threshold: ${threshold})`
    };
  }

  /**
   * Validate security aspects
   */
  private async validateSecurity(analysisReport: any): Promise<QualityGateResult> {
    // Check for potential security issues in imports
    let securityIssues = 0;
    
    for (const [filePath, result] of analysisReport.analysisResults) {
      for (const importInfo of result.imports) {
        // Check for suspicious imports
        if (this.isSuspiciousImport(importInfo.importPath)) {
          securityIssues++;
        }
      }
    }
    
    return {
      gate: 'Security',
      passed: securityIssues === 0,
      actual: securityIssues,
      threshold: 0,
      severity: securityIssues > 0 ? 'ERROR' : 'INFO',
      message: securityIssues > 0 ? 
        `Found ${securityIssues} potentially suspicious imports` : 
        'No security issues detected in imports'
    };
  }

  /**
   * Check if an import path is suspicious
   */
  private isSuspiciousImport(importPath: string): boolean {
    const suspiciousPatterns = [
      /eval/i,
      /function\s*\(/i,
      /document\.write/i,
      /innerHTML/i,
      /dangerouslySetInnerHTML/i,
      /require\s*\(\s*['"]child_process['"]/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(importPath));
  }

  /**
   * Determine if optimization should run based on quality gates
   */
  private shouldRunOptimization(qualityGates: QualityGateResult[]): boolean {
    // Don't optimize in production unless specifically enabled
    if (this.config.environment === 'production') {
      return false;
    }
    
    // Don't optimize if there are security errors
    const securityGate = qualityGates.find(gate => gate.gate === 'Security');
    if (securityGate && !securityGate.passed) {
      return false;
    }
    
    // Optimize if there are unused imports above threshold
    const unusedImportsGate = qualityGates.find(gate => gate.gate === 'Unused Imports');
    if (unusedImportsGate && !unusedImportsGate.passed) {
      return true;
    }
    
    return false;
  }

  /**
   * Run optimization if conditions are met
   */
  private async runOptimization() {
    const config = createConfig({
      ...CONFIG_PRESETS.PERFORMANCE_FOCUSED,
      optimization: { 
        dryRun: this.config.environment === 'production', // Never execute in production
        riskTolerance: 'conservative'
      }
    });
    
    const optimizer = new EnterpriseImportExportOptimizer(this.projectRoot, config);
    return await optimizer.optimize();
  }

  /**
   * Run post-optimization validation
   */
  private async runPostValidation(optimizationResults: any): Promise<boolean> {
    if (!optimizationResults) {
      return true; // No optimization was run, so validation passes
    }
    
    // Ensure the application still builds after optimization
    try {
      execSync('npm run build', { 
        cwd: this.projectRoot,
        stdio: 'pipe',
        timeout: 300000
      });
      
      console.log('✅ Post-optimization build successful');
      return true;
      
    } catch (error) {
      console.error('❌ Post-optimization build failed:', error);
      
      // Attempt rollback if available
      if (optimizationResults.results.rollbackScript) {
        console.log('🔄 Attempting automatic rollback...');
        try {
          execSync(`bash "${optimizationResults.results.rollbackScript}"`, {
            cwd: this.projectRoot,
            stdio: 'inherit'
          });
          console.log('✅ Rollback successful');
        } catch (rollbackError) {
          console.error('❌ Rollback failed:', rollbackError);
        }
      }
      
      return false;
    }
  }

  /**
   * Calculate overall status from quality gates
   */
  private calculateOverallStatus(qualityGates: QualityGateResult[]): 'PASSED' | 'WARNING' | 'FAILED' {
    const hasErrors = qualityGates.some(gate => gate.severity === 'ERROR' && !gate.passed);
    const hasWarnings = qualityGates.some(gate => gate.severity === 'WARNING' && !gate.passed);
    
    if (hasErrors) return 'FAILED';
    if (hasWarnings) return 'WARNING';
    return 'PASSED';
  }

  /**
   * Generate recommendations based on analysis and quality gates
   */
  private generateRecommendations(analysisReport: any, qualityGates: QualityGateResult[]): string[] {
    const recommendations: string[] = [];
    
    // Recommendations based on quality gate failures
    for (const gate of qualityGates) {
      if (!gate.passed) {
        switch (gate.gate) {
          case 'Bundle Size':
            recommendations.push('Consider running import/export optimization to reduce bundle size');
            recommendations.push('Review large dependencies and consider alternatives');
            break;
          case 'Unused Imports':
            recommendations.push('Run import/export cleanup to remove unused imports');
            recommendations.push('Enable automatic import optimization in pre-commit hooks');
            break;
          case 'Build Time':
            recommendations.push('Optimize TypeScript configuration for faster builds');
            recommendations.push('Consider incremental compilation options');
            break;
          case 'Complexity':
            recommendations.push('Consider refactoring high-complexity files');
            recommendations.push('Break down large components into smaller ones');
            break;
          case 'Security':
            recommendations.push('Review and remove suspicious import patterns');
            recommendations.push('Run security audit on dependencies');
            break;
        }
      }
    }
    
    // General recommendations based on analysis
    if (analysisReport.globalMetrics.circularDependencies.length > 0) {
      recommendations.push(`Found ${analysisReport.globalMetrics.circularDependencies.length} circular dependencies - consider refactoring`);
    }
    
    if (analysisReport.globalMetrics.treeshakingOpportunities > 10) {
      recommendations.push('Multiple tree-shaking opportunities detected - consider import optimization');
    }
    
    return recommendations;
  }

  /**
   * Upload artifacts to configured destinations
   */
  private async uploadArtifacts(report: CICDReport, analysisReport: any): Promise<void> {
    // Generate comprehensive report
    const reportContent = this.generateCICDReport(report, analysisReport);
    const reportPath = path.join(this.projectRoot, 'logs', `cicd-report-${report.buildNumber}.md`);
    
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, reportContent);
    
    report.artifacts.logsUrl = reportPath;
    
    // Upload to S3 if configured
    if (this.config.reporting.uploadToS3) {
      const s3Url = await this.uploadToS3(reportPath, report);
      report.artifacts.reportUrl = s3Url;
    }
    
    // Post GitHub comment if configured
    if (this.config.reporting.githubComment) {
      await this.postGitHubComment(report, reportContent);
    }
  }

  /**
   * Send notifications based on configuration
   */
  private async sendNotifications(report: CICDReport): Promise<void> {
    // Slack notification
    if (this.config.notifications.slack) {
      await this.sendSlackNotification(report);
    }
    
    // Email notification
    if (this.config.notifications.email) {
      await this.sendEmailNotification(report);
    }
  }

  /**
   * Get previous bundle size for comparison
   */
  private async getPreviousBundleSize(): Promise<number | null> {
    try {
      const cacheFile = path.join(this.projectRoot, 'logs', '.bundle-size-cache.json');
      if (fs.existsSync(cacheFile)) {
        const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
        return cache.bundleSize || null;
      }
    } catch (error) {
      console.warn('Could not read previous bundle size:', error);
    }
    return null;
  }

  /**
   * Generate CI/CD report content
   */
  private generateCICDReport(report: CICDReport, analysisReport: any): string {
    return `# CI/CD Import/Export Optimization Report

## Build Information
- **Environment**: ${report.environment}
- **Build Number**: ${report.buildNumber}
- **Commit**: ${report.commit}
- **Branch**: ${report.branch}
- **Timestamp**: ${new Date(report.timestamp).toLocaleString()}
- **Overall Status**: ${this.getStatusEmoji(report.overallStatus)} ${report.overallStatus}

## Quality Gates
${report.qualityGates.map(gate => 
  `- **${gate.gate}**: ${gate.passed ? '✅' : '❌'} ${gate.message}`
).join('\n')}

## Performance Metrics
- **Analysis Time**: ${report.performanceMetrics.analysisTime}ms
- **Bundle Size Change**: ${report.performanceMetrics.bundleSizeChange} bytes
- **Unused Imports Found**: ${report.performanceMetrics.unusedImportsFound}
- **Optimizations Applied**: ${report.performanceMetrics.optimizationsApplied}

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Detailed Analysis
- **Total Files Analyzed**: ${analysisReport.totalFiles}
- **Total Imports**: ${analysisReport.globalMetrics.totalImports}
- **Total Exports**: ${analysisReport.globalMetrics.totalExports}
- **Circular Dependencies**: ${analysisReport.globalMetrics.circularDependencies.length}
- **Average Complexity**: ${analysisReport.globalMetrics.averageComplexity}

---
*Generated by CI/CD Import/Export Integration*`;
  }

  /**
   * Get status emoji
   */
  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'PASSED': return '✅';
      case 'WARNING': return '⚠️';
      case 'FAILED': return '❌';
      default: return '❓';
    }
  }

  /**
   * Upload report to S3 (placeholder)
   */
  private async uploadToS3(reportPath: string, report: CICDReport): Promise<string> {
    // This would integrate with AWS SDK
    console.log('📤 S3 upload configured but not implemented');
    return `s3://${this.config.reporting.uploadToS3!.bucket}/reports/${report.buildNumber}.md`;
  }

  /**
   * Post GitHub comment (placeholder)
   */
  private async postGitHubComment(report: CICDReport, content: string): Promise<void> {
    // This would integrate with GitHub API
    console.log('💬 GitHub comment configured but not implemented');
  }

  /**
   * Send Slack notification (placeholder)
   */
  private async sendSlackNotification(report: CICDReport): Promise<void> {
    // This would integrate with Slack API
    console.log('📢 Slack notification configured but not implemented');
  }

  /**
   * Send email notification (placeholder)
   */
  private async sendEmailNotification(report: CICDReport): Promise<void> {
    // This would integrate with email service
    console.log('📧 Email notification configured but not implemented');
  }

  /**
   * Handle pipeline failure
   */
  private async handlePipelineFailure(error: any, report: CICDReport): Promise<void> {
    console.error('💥 CI/CD Pipeline failure handling');
    
    // Log failure details
    const failureLog = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      report
    };
    
    const logPath = path.join(this.projectRoot, 'logs', `pipeline-failure-${report.buildNumber}.json`);
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(logPath, JSON.stringify(failureLog, null, 2));
    
    console.log(`📋 Failure log saved to: ${logPath}`);
  }
}

// CLI interface
async function main() {
  const environment = (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production';
  
  const config: CICDConfig = {
    environment,
    qualityGates: {
      bundleSizeThreshold: 100000, // 100KB
      unusedImportsThreshold: 50,
      buildTimeThreshold: 300000, // 5 minutes
      complexityThreshold: 15
    },
    notifications: {
      // Configure based on environment variables
    },
    reporting: {
      // Configure based on environment variables
    }
  };
  
  const integration = new CICDImportExportIntegration(process.cwd(), config);
  
  try {
    const report = await integration.runCICDPipeline();
    
    console.log(`\n🎉 CI/CD Pipeline ${report.overallStatus}`);
    console.log(`📊 Quality Gates: ${report.qualityGates.filter(g => g.passed).length}/${report.qualityGates.length} passed`);
    
    if (report.overallStatus === 'FAILED') {
      process.exit(1);
    } else if (report.overallStatus === 'WARNING') {
      console.log('⚠️  Pipeline completed with warnings');
    }
    
  } catch (error) {
    console.error('❌ CI/CD Pipeline failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}