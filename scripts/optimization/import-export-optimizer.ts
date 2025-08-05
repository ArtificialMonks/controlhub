#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { ImportExportAnalyzer } from '../analysis/analyze-imports-exports';

interface OptimizationPlan {
  filePath: string;
  actions: OptimizationAction[];
}

interface OptimizationAction {
  type: 'REMOVE_IMPORT' | 'REMOVE_EXPORT' | 'IMPLEMENT_MISSING' | 'RELOCATE' | 'ADD_COMMENT';
  line: number;
  oldCode: string;
  newCode?: string;
  reason: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

class ImportExportOptimizer {
  private projectRoot: string;
  private analyzer: ImportExportAnalyzer;
  private backupDir: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.analyzer = new ImportExportAnalyzer(projectRoot);
    this.backupDir = path.join(projectRoot, '.backup-import-optimization');
  }

  async optimize(dryRun: boolean = true): Promise<void> {
    console.log('🚀 Starting import/export optimization process...');
    console.log(`📍 Mode: ${dryRun ? 'DRY RUN' : 'LIVE EXECUTION'}`);

    // Phase 1: Analysis
    console.log('\n📊 Phase 1: Analyzing codebase...');
    const analysisResults = await this.analyzer.analyzeProject();
    
    // Phase 2: Generate optimization plan
    console.log('\n🎯 Phase 2: Generating optimization plan...');
    const optimizationPlan = this.generateOptimizationPlan(analysisResults);
    
    // Phase 3: Validate plan
    console.log('\n🔍 Phase 3: Validating optimization plan...');
    const validatedPlan = this.validateOptimizationPlan(optimizationPlan);
    
    // Phase 4: Execute or show plan
    if (dryRun) {
      console.log('\n📋 Phase 4: Showing optimization plan (DRY RUN)...');
      this.showOptimizationPlan(validatedPlan);
    } else {
      console.log('\n⚡ Phase 4: Executing optimizations...');
      await this.executeOptimizationPlan(validatedPlan);
    }

    // Phase 5: Generate final report
    console.log('\n📈 Phase 5: Generating final report...');
    await this.generateFinalReport(analysisResults, validatedPlan, dryRun);
  }

  private generateOptimizationPlan(analysisResults: Map<string, any>): OptimizationPlan[] {
    const plans: OptimizationPlan[] = [];

    for (const [filePath, analysis] of analysisResults) {
      const actions: OptimizationAction[] = [];

      // Process unused imports
      for (const unusedImport of analysis.analysis.unusedImports) {
        if (unusedImport.category === 'REMOVE' && unusedImport.risk === 'LOW') {
          actions.push({
            type: 'REMOVE_IMPORT',
            line: unusedImport.line,
            oldCode: unusedImport.fullStatement,
            reason: unusedImport.reason,
            risk: unusedImport.risk
          });
        } else if (unusedImport.category === 'PRESERVE') {
          // Add explanatory comment for preserved imports
          actions.push({
            type: 'ADD_COMMENT',
            line: unusedImport.line - 1,
            oldCode: '',
            newCode: `// Preserved: ${unusedImport.reason}`,
            reason: 'Add clarity for preserved import',
            risk: 'LOW'
          });
        }
      }

      // Process unused exports
      for (const unusedExport of analysis.analysis.unusedExports) {
        if (unusedExport.category === 'REMOVE' && unusedExport.risk === 'LOW') {
          actions.push({
            type: 'REMOVE_EXPORT',
            line: unusedExport.line,
            oldCode: unusedExport.fullStatement,
            reason: unusedExport.reason,
            risk: unusedExport.risk
          });
        }
      }

      // Process missing implementations
      for (const missing of analysis.analysis.missingImplementations) {
        actions.push({
          type: 'IMPLEMENT_MISSING',
          line: 0, // Will be determined during implementation
          oldCode: '',
          newCode: missing.suggestedAction,
          reason: `Missing implementation for ${missing.name}`,
          risk: 'MEDIUM'
        });
      }

      if (actions.length > 0) {
        plans.push({ filePath, actions });
      }
    }

    return plans;
  }

  private validateOptimizationPlan(plans: OptimizationPlan[]): OptimizationPlan[] {
    console.log('🔍 Validating optimization plan...');
    
    const validatedPlans: OptimizationPlan[] = [];
    let totalActions = 0;
    let highRiskActions = 0;

    for (const plan of plans) {
      const validatedActions: OptimizationAction[] = [];

      for (const action of plan.actions) {
        totalActions++;
        
        // Skip high-risk actions in production code
        if (action.risk === 'HIGH') {
          highRiskActions++;
          console.log(`⚠️  Skipping high-risk action in ${path.relative(this.projectRoot, plan.filePath)}:${action.line}`);
          continue;
        }

        // Validate that the file still exists and line numbers are valid
        if (fs.existsSync(plan.filePath)) {
          const fileContent = fs.readFileSync(plan.filePath, 'utf-8').split('\n');
          
          if (action.line > 0 && action.line <= fileContent.length) {
            validatedActions.push(action);
          } else {
            console.log(`⚠️  Invalid line number ${action.line} in ${path.relative(this.projectRoot, plan.filePath)}`);
          }
        }
      }

      if (validatedActions.length > 0) {
        validatedPlans.push({ ...plan, actions: validatedActions });
      }
    }

    console.log(`✅ Validation complete: ${validatedPlans.length} files, ${totalActions - highRiskActions} safe actions`);
    if (highRiskActions > 0) {
      console.log(`⚠️  Skipped ${highRiskActions} high-risk actions`);
    }

    return validatedPlans;
  }

  private showOptimizationPlan(plans: OptimizationPlan[]): void {
    console.log('\n📋 OPTIMIZATION PLAN (DRY RUN)');
    console.log('=' .repeat(60));

    let totalFiles = 0;
    let totalActions = 0;

    for (const plan of plans) {
      totalFiles++;
      const relativePath = path.relative(this.projectRoot, plan.filePath);
      
      console.log(`\n📁 ${relativePath}`);
      console.log('-'.repeat(40));

      for (const action of plan.actions) {
        totalActions++;
        console.log(`${this.getActionIcon(action.type)} Line ${action.line}: ${action.type}`);
        console.log(`   Risk: ${action.risk} | Reason: ${action.reason}`);
        
        if (action.oldCode) {
          console.log(`   Remove: ${action.oldCode.trim()}`);
        }
        
        if (action.newCode) {
          console.log(`   Add: ${action.newCode.trim()}`);
        }
        
        console.log('');
      }
    }

    console.log('\n📊 SUMMARY');
    console.log('-'.repeat(20));
    console.log(`Files to modify: ${totalFiles}`);
    console.log(`Total actions: ${totalActions}`);
    console.log('\n💡 Run with --execute flag to apply changes');
  }

  private async executeOptimizationPlan(plans: OptimizationPlan[]): Promise<void> {
    console.log('⚡ Executing optimization plan...');
    
    // Create backup directory
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`📦 Created backup directory: ${this.backupDir}`);
    }

    let filesModified = 0;
    let actionsExecuted = 0;

    for (const plan of plans) {
      try {
        await this.executeFilePlan(plan);
        filesModified++;
        actionsExecuted += plan.actions.length;
        
        const relativePath = path.relative(this.projectRoot, plan.filePath);
        console.log(`✅ Modified ${relativePath} (${plan.actions.length} actions)`);
        
      } catch (error) {
        const relativePath = path.relative(this.projectRoot, plan.filePath);
        console.error(`❌ Failed to modify ${relativePath}:`, error);
      }
    }

    console.log(`\n🎉 Optimization complete!`);
    console.log(`   Files modified: ${filesModified}`);
    console.log(`   Actions executed: ${actionsExecuted}`);
    console.log(`   Backup location: ${this.backupDir}`);
  }

  private async executeFilePlan(plan: OptimizationPlan): Promise<void> {
    // Create backup
    const backupPath = path.join(
      this.backupDir,
      path.relative(this.projectRoot, plan.filePath) + '.backup'
    );
    
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.copyFileSync(plan.filePath, backupPath);

    // Read current file content
    let fileLines = fs.readFileSync(plan.filePath, 'utf-8').split('\n');
    
    // Sort actions by line number in descending order to avoid line number shifts
    const sortedActions = [...plan.actions].sort((a, b) => b.line - a.line);

    // Execute actions
    for (const action of sortedActions) {
      switch (action.type) {
        case 'REMOVE_IMPORT':
        case 'REMOVE_EXPORT':
          if (action.line > 0 && action.line <= fileLines.length) {
            fileLines.splice(action.line - 1, 1);
          }
          break;

        case 'ADD_COMMENT':
          if (action.line >= 0 && action.line < fileLines.length && action.newCode) {
            fileLines.splice(action.line, 0, action.newCode);
          }
          break;

        case 'IMPLEMENT_MISSING':
          // This would require more sophisticated implementation
          console.log(`⚠️  Manual implementation required: ${action.reason}`);
          break;
      }
    }

    // Write modified content back to file
    fs.writeFileSync(plan.filePath, fileLines.join('\n'));
  }

  private async generateFinalReport(
    analysisResults: Map<string, any>,
    optimizationPlan: OptimizationPlan[],
    dryRun: boolean
  ): Promise<void> {
    const report = this.analyzer.generateReport(analysisResults);
    
    // Add optimization summary to report
    let optimizationSummary = '\n## Optimization Summary\n\n';
    optimizationSummary += `**Mode**: ${dryRun ? 'Dry Run' : 'Live Execution'}\n`;
    optimizationSummary += `**Files planned for modification**: ${optimizationPlan.length}\n`;
    
    const totalActions = optimizationPlan.reduce((sum, plan) => sum + plan.actions.length, 0);
    optimizationSummary += `**Total optimization actions**: ${totalActions}\n\n`;

    // Breakdown by action type
    const actionCounts = new Map<string, number>();
    for (const plan of optimizationPlan) {
      for (const action of plan.actions) {
        actionCounts.set(action.type, (actionCounts.get(action.type) || 0) + 1);
      }
    }

    optimizationSummary += '### Action Breakdown\n\n';
    for (const [actionType, count] of actionCounts) {
      optimizationSummary += `- **${actionType}**: ${count}\n`;
    }

    const finalReport = report + optimizationSummary;
    
    // Write final report
    const reportPath = path.join(this.projectRoot, 'logs', 'import-export-optimization-report.md');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, finalReport);
    
    console.log(`📊 Final report saved to: ${reportPath}`);
  }

  private getActionIcon(actionType: string): string {
    const icons: Record<string, string> = {
      'REMOVE_IMPORT': '🗑️ ',
      'REMOVE_EXPORT': '🗑️ ',
      'IMPLEMENT_MISSING': '🔧',
      'RELOCATE': '📦',
      'ADD_COMMENT': '💬'
    };
    return icons[actionType] || '⚙️ ';
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const projectRoot = process.cwd();

  console.log('🔍 Import/Export Optimizer');
  console.log('='.repeat(40));
  console.log(`📍 Project: ${projectRoot}`);
  console.log(`⚙️  Mode: ${dryRun ? 'DRY RUN' : 'EXECUTION'}`);
  
  if (dryRun) {
    console.log('💡 Add --execute flag to apply changes');
  }
  
  console.log('');

  const optimizer = new ImportExportOptimizer(projectRoot);
  
  try {
    await optimizer.optimize(dryRun);
  } catch (error) {
    console.error('❌ Optimization failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { ImportExportOptimizer };