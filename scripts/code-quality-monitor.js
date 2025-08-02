#!/usr/bin/env node

/**
 * Code Quality Monitoring Script
 * 
 * Automated script for monitoring code quality and detecting dead code.
 * Part of the Dead Code Recovery Protocol prevention system.
 * 
 * Usage:
 *   node scripts/code-quality-monitor.js
 *   npm run monitor:quality
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  thresholds: {
    unusedFiles: 5,
    unusedExports: 10,
    bundleSizeIncrease: 500000, // 500KB
    testCoverage: 80
  },
  outputDir: 'reports',
  alertsEnabled: process.env.NODE_ENV === 'production'
};

// Ensure reports directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Execute command and return output
 */
function execCommand(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      ...options 
    });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return null;
  }
}

/**
 * Analyze dead code using knip
 */
function analyzeDeadCode() {
  console.log('🔍 Analyzing dead code with knip...');
  
  const output = execCommand('npx knip --reporter json');
  if (!output) return null;
  
  try {
    const result = JSON.parse(output);
    const unusedFiles = result.files?.length || 0;
    const unusedExports = result.exports?.length || 0;
    const unusedTypes = result.types?.length || 0;
    
    const analysis = {
      timestamp: new Date().toISOString(),
      unusedFiles,
      unusedExports,
      unusedTypes,
      details: result
    };
    
    // Save detailed report
    const reportPath = path.join(CONFIG.outputDir, `dead-code-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
    
    console.log(`📊 Dead Code Analysis:`);
    console.log(`   Unused Files: ${unusedFiles}`);
    console.log(`   Unused Exports: ${unusedExports}`);
    console.log(`   Unused Types: ${unusedTypes}`);
    
    // Check thresholds
    if (unusedFiles > CONFIG.thresholds.unusedFiles) {
      console.warn(`⚠️  WARNING: ${unusedFiles} unused files exceeds threshold of ${CONFIG.thresholds.unusedFiles}`);
    }
    
    if (unusedExports > CONFIG.thresholds.unusedExports) {
      console.warn(`⚠️  WARNING: ${unusedExports} unused exports exceeds threshold of ${CONFIG.thresholds.unusedExports}`);
    }
    
    return analysis;
  } catch (error) {
    console.error('Error parsing knip output:', error.message);
    return null;
  }
}

/**
 * Analyze dependencies
 */
function analyzeDependencies() {
  console.log('📦 Analyzing dependencies...');
  
  const output = execCommand('npx depcheck --json');
  if (!output) return null;
  
  try {
    const result = JSON.parse(output);
    const unusedDeps = Object.keys(result.dependencies || {}).length;
    const missingDeps = Object.keys(result.missing || {}).length;
    
    const analysis = {
      timestamp: new Date().toISOString(),
      unusedDependencies: unusedDeps,
      missingDependencies: missingDeps,
      details: result
    };
    
    console.log(`📊 Dependency Analysis:`);
    console.log(`   Unused Dependencies: ${unusedDeps}`);
    console.log(`   Missing Dependencies: ${missingDeps}`);
    
    if (unusedDeps > 0) {
      console.warn(`⚠️  WARNING: ${unusedDeps} unused dependencies found`);
      console.log('   Unused:', Object.keys(result.dependencies || {}));
    }
    
    if (missingDeps > 0) {
      console.warn(`⚠️  WARNING: ${missingDeps} missing dependencies found`);
      console.log('   Missing:', Object.keys(result.missing || {}));
    }
    
    return analysis;
  } catch (error) {
    console.error('Error parsing depcheck output:', error.message);
    return null;
  }
}

/**
 * Check build status
 */
function checkBuildStatus() {
  console.log('🏗️  Checking build status...');
  
  const buildOutput = execCommand('npm run build');
  const buildSuccess = buildOutput !== null;
  
  console.log(`📊 Build Status: ${buildSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  return {
    timestamp: new Date().toISOString(),
    success: buildSuccess,
    output: buildOutput
  };
}

/**
 * Run test coverage analysis
 */
function analyzeTestCoverage() {
  console.log('🧪 Analyzing test coverage...');
  
  const output = execCommand('npm run test -- --coverage --reporter=json');
  if (!output) return null;
  
  try {
    // Extract coverage information (simplified)
    const lines = output.split('\n');
    const coverageLine = lines.find(line => line.includes('All files'));
    
    if (coverageLine) {
      // Parse coverage percentage (simplified parsing)
      const match = coverageLine.match(/(\d+\.?\d*)%/);
      const coverage = match ? parseFloat(match[1]) : 0;
      
      console.log(`📊 Test Coverage: ${coverage}%`);
      
      if (coverage < CONFIG.thresholds.testCoverage) {
        console.warn(`⚠️  WARNING: Test coverage ${coverage}% is below threshold of ${CONFIG.thresholds.testCoverage}%`);
      }
      
      return {
        timestamp: new Date().toISOString(),
        coverage,
        details: output
      };
    }
  } catch (error) {
    console.error('Error analyzing test coverage:', error.message);
  }
  
  return null;
}

/**
 * Generate summary report
 */
function generateSummaryReport(analyses) {
  const summary = {
    timestamp: new Date().toISOString(),
    status: 'completed',
    analyses: analyses.filter(Boolean),
    alerts: []
  };
  
  // Check for alerts
  const deadCodeAnalysis = analyses.find(a => a.unusedFiles !== undefined);
  if (deadCodeAnalysis) {
    if (deadCodeAnalysis.unusedFiles > CONFIG.thresholds.unusedFiles) {
      summary.alerts.push({
        type: 'dead_code',
        severity: 'warning',
        message: `${deadCodeAnalysis.unusedFiles} unused files exceed threshold`
      });
    }
  }
  
  const depAnalysis = analyses.find(a => a.unusedDependencies !== undefined);
  if (depAnalysis && depAnalysis.unusedDependencies > 0) {
    summary.alerts.push({
      type: 'dependencies',
      severity: 'warning',
      message: `${depAnalysis.unusedDependencies} unused dependencies found`
    });
  }
  
  const buildAnalysis = analyses.find(a => a.success !== undefined);
  if (buildAnalysis && !buildAnalysis.success) {
    summary.alerts.push({
      type: 'build',
      severity: 'error',
      message: 'Build failed'
    });
  }
  
  // Save summary report
  const summaryPath = path.join(CONFIG.outputDir, `quality-summary-${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('\n📋 Quality Summary:');
  console.log(`   Analyses Completed: ${summary.analyses.length}`);
  console.log(`   Alerts Generated: ${summary.alerts.length}`);
  
  if (summary.alerts.length > 0) {
    console.log('\n🚨 Alerts:');
    summary.alerts.forEach(alert => {
      const icon = alert.severity === 'error' ? '❌' : '⚠️';
      console.log(`   ${icon} ${alert.type.toUpperCase()}: ${alert.message}`);
    });
  }
  
  return summary;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Code Quality Monitor...\n');
  
  const startTime = Date.now();
  
  // Run all analyses
  const analyses = [
    analyzeDeadCode(),
    analyzeDependencies(),
    checkBuildStatus(),
    analyzeTestCoverage()
  ];
  
  // Generate summary
  const summary = generateSummaryReport(analyses);
  
  const duration = Date.now() - startTime;
  console.log(`\n✅ Code Quality Monitor completed in ${duration}ms`);
  
  // Exit with error code if there are error-level alerts
  const hasErrors = summary.alerts.some(alert => alert.severity === 'error');
  if (hasErrors) {
    console.log('❌ Exiting with error due to critical issues');
    process.exit(1);
  }
  
  console.log('✅ All quality checks passed');
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Code Quality Monitor failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  analyzeDeadCode,
  analyzeDependencies,
  checkBuildStatus,
  analyzeTestCoverage,
  generateSummaryReport
};
