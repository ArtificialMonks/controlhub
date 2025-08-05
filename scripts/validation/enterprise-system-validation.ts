#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

/**
 * Enterprise System Validation
 * Validates that all enterprise import/export scripts are properly integrated
 */

interface ValidationResult {
  component: string;
  status: 'PASSED' | 'WARNING' | 'FAILED';
  details: string;
}

class EnterpriseSystemValidator {
  private projectRoot: string;
  private results: ValidationResult[] = [];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async validateSystem(): Promise<ValidationResult[]> {
    console.log('🔍 Enterprise Import/Export System Validation');
    console.log('='.repeat(60));

    // Validate directory structure
    this.validateDirectoryStructure();

    // Validate core scripts
    this.validateCoreScripts();

    // Validate agent integration
    this.validateAgentIntegration();

    // Validate configuration
    this.validateConfiguration();

    // Validate documentation
    this.validateDocumentation();

    this.printResults();
    return this.results;
  }

  private validateDirectoryStructure(): void {
    console.log('\n📁 Validating Directory Structure...');

    const requiredDirectories = [
      'scripts/analysis',
      'scripts/optimization', 
      'scripts/validation',
      'scripts/reports',
      'scripts/config',
      'scripts/utils',
      'scripts/deployment'
    ];

    for (const dir of requiredDirectories) {
      const fullPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(fullPath)) {
        this.results.push({
          component: `Directory: ${dir}`,
          status: 'PASSED',
          details: 'Directory exists'
        });
      } else {
        this.results.push({
          component: `Directory: ${dir}`,
          status: 'FAILED',
          details: 'Directory missing'
        });
      }
    }
  }

  private validateCoreScripts(): void {
    console.log('\n📜 Validating Core Scripts...');

    const requiredScripts = [
      // Analysis
      'scripts/analysis/enterprise-import-export-analyzer.ts',
      'scripts/analysis/analyze-imports-exports.ts',
      
      // Optimization
      'scripts/optimization/enterprise-import-export-optimizer.ts',
      'scripts/optimization/import-export-optimizer.ts',
      'scripts/optimization/execute-safe-cleanups.ts',
      
      // Validation
      'scripts/validation/comprehensive-validation.ts',
      
      // Reports
      'scripts/reports/unused-imports-summary.ts',
      
      // Configuration
      'scripts/config/import-export-config.ts',
      
      // Utilities
      'scripts/utils/ast-utilities.ts',
      
      // Deployment
      'scripts/deployment/ci-cd-import-export-integration.ts'
    ];

    for (const script of requiredScripts) {
      const fullPath = path.join(this.projectRoot, script);
      if (fs.existsSync(fullPath)) {
        // Check if script has proper TypeScript structure
        const content = fs.readFileSync(fullPath, 'utf-8');
        const hasProperStructure = this.validateScriptStructure(content, script);
        
        this.results.push({
          component: `Script: ${path.basename(script)}`,
          status: hasProperStructure ? 'PASSED' : 'WARNING',
          details: hasProperStructure ? 'Script exists with proper structure' : 'Script exists but may have structural issues'
        });
      } else {
        this.results.push({
          component: `Script: ${path.basename(script)}`,
          status: 'FAILED',
          details: 'Script missing'
        });
      }
    }
  }

  private validateScriptStructure(content: string, scriptPath: string): boolean {
    // Basic validation checks
    const checks = [
      content.includes('#!/usr/bin/env node'), // Shebang
      content.includes('import '), // ES6 imports
      content.includes('export '), // Exports
      content.length > 100 // Minimum content length
    ];

    // Additional checks based on script type
    if (scriptPath.includes('enterprise-import-export-analyzer')) {
      checks.push(
        content.includes('EnterpriseImportExportAnalyzer'),
        content.includes('AnalysisReport'),
        content.includes('@typescript-eslint')
      );
    }

    if (scriptPath.includes('enterprise-import-export-optimizer')) {
      checks.push(
        content.includes('EnterpriseImportExportOptimizer'),
        content.includes('OptimizationSession'),
        content.includes('ExecutionPlan')
      );
    }

    if (scriptPath.includes('import-export-config')) {
      checks.push(
        content.includes('ImportExportConfig'),
        content.includes('DEFAULT_CONFIG'),
        content.includes('CONFIG_PRESETS')
      );
    }

    return checks.filter(Boolean).length >= checks.length * 0.8; // 80% pass rate
  }

  private validateAgentIntegration(): void {
    console.log('\n🤖 Validating Agent Integration...');

    const agentPath = path.join(this.projectRoot, '.claude/agents/in-export-agent.md');
    
    if (fs.existsSync(agentPath)) {
      const content = fs.readFileSync(agentPath, 'utf-8');
      
      const agentChecks = [
        content.includes('# In-Export Agent'),
        content.includes('enterprise-import-export-analyzer.ts'),
        content.includes('enterprise-import-export-optimizer.ts'),
        content.includes('scripts/config/import-export-config.ts'),
        content.includes('scripts/validation/comprehensive-validation.ts'),
        content.includes('scripts/reports/unused-imports-summary.ts'),
        !content.includes('npm run agent:deploy')
      ];

      const passedChecks = agentChecks.filter(Boolean).length;
      const totalChecks = agentChecks.length;

      this.results.push({
        component: 'Agent: in-export-agent.md',
        status: passedChecks === totalChecks ? 'PASSED' : 'WARNING',
        details: `${passedChecks}/${totalChecks} integration checks passed`
      });
    } else {
      this.results.push({
        component: 'Agent: in-export-agent.md',
        status: 'FAILED',
        details: 'Agent file missing'
      });
    }
  }

  private validateConfiguration(): void {
    console.log('\n⚙️  Validating Configuration...');

    const configPath = path.join(this.projectRoot, 'scripts/config/import-export-config.ts');
    
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      
      const configChecks = [
        content.includes('ImportExportConfig'),
        content.includes('DEFAULT_CONFIG'),
        content.includes('CONFIG_PRESETS'),
        content.includes('ULTRA_SAFE'),
        content.includes('AGGRESSIVE_CLEANUP'),
        content.includes('PERFORMANCE_FOCUSED'),
        content.includes('createConfig'),
        content.includes('getEnvironmentConfig')
      ];

      const passedChecks = configChecks.filter(Boolean).length;
      const totalChecks = configChecks.length;

      this.results.push({
        component: 'Configuration System',
        status: passedChecks === totalChecks ? 'PASSED' : 'WARNING',
        details: `${passedChecks}/${totalChecks} configuration features validated`
      });
    } else {
      this.results.push({
        component: 'Configuration System',
        status: 'FAILED',
        details: 'Configuration file missing'
      });
    }
  }

  private validateDocumentation(): void {
    console.log('\n📚 Validating Documentation...');

    const claudeMdPath = path.join(this.projectRoot, 'CLAUDE.md');
    
    if (fs.existsSync(claudeMdPath)) {
      const content = fs.readFileSync(claudeMdPath, 'utf-8');
      
      const docChecks = [
        content.includes('## Enterprise Import/Export Optimization'),
        content.includes('@"in-export-agent"'),
        content.includes('enterprise-import-export-analyzer.ts'),
        content.includes('enterprise-import-export-optimizer.ts'),
        content.includes('scripts/config/import-export-config.ts'),
        content.includes('Configuration Presets'),
        content.includes('ULTRA_SAFE'),
        content.includes('Quality Gates')
      ];

      const passedChecks = docChecks.filter(Boolean).length;
      const totalChecks = docChecks.length;

      this.results.push({
        component: 'Documentation (CLAUDE.md)',
        status: passedChecks >= totalChecks * 0.9 ? 'PASSED' : 'WARNING',
        details: `${passedChecks}/${totalChecks} documentation sections validated`
      });
    } else {
      this.results.push({
        component: 'Documentation (CLAUDE.md)',
        status: 'FAILED',
        details: 'CLAUDE.md file missing'
      });
    }
  }

  private printResults(): void {
    console.log('\n📊 Validation Results');
    console.log('='.repeat(40));

    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Failed: ${failed}`);

    console.log('\n🔍 Detailed Results:');
    for (const result of this.results) {
      const icon = result.status === 'PASSED' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`${icon} ${result.component}: ${result.details}`);
    }

    const overallStatus = failed === 0 ? (warnings === 0 ? 'PASSED' : 'WARNING') : 'FAILED';
    console.log(`\n🎯 Overall Status: ${overallStatus}`);

    if (overallStatus === 'PASSED') {
      console.log('🎉 Enterprise Import/Export System is fully validated and ready for use!');
    } else if (overallStatus === 'WARNING') {
      console.log('⚠️  System is functional but has some minor issues to address.');
    } else {
      console.log('❌ System has critical issues that need to be resolved.');
    }
  }
}

// CLI execution
async function main() {
  const validator = new EnterpriseSystemValidator(process.cwd());
  const results = await validator.validateSystem();
  
  const failed = results.filter(r => r.status === 'FAILED').length;
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { EnterpriseSystemValidator };