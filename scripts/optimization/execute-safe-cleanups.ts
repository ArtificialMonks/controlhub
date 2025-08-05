#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { ImportExportOptimizer } from './import-export-optimizer';

class SafeCleanupExecutor {
  private projectRoot: string;
  private optimizer: ImportExportOptimizer;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.optimizer = new ImportExportOptimizer(projectRoot);
  }

  async executeSafeCleanups(): Promise<void> {
    console.log('🧹 Executing Safe Import/Export Cleanups...');
    console.log('='.repeat(50));

    // Step 1: Run analysis
    console.log('📊 Running comprehensive analysis...');
    const analysisResults = await this.optimizer['analyzer'].analyzeProject();
    
    // Step 2: Identify truly safe removals
    const safeRemovals = this.identifySafeRemovals(analysisResults);
    
    // Step 3: Execute safe removals in batches
    await this.executeSafeRemovalBatch(safeRemovals);
    
    console.log('\n✅ Safe cleanup execution completed!');
  }

  private identifySafeRemovals(analysisResults: Map<string, any>): Array<{
    filePath: string;
    removals: Array<{
      line: number;
      type: 'import' | 'export';
      statement: string;
      reason: string;
    }>;
  }> {
    const safeRemovals: Array<{
      filePath: string;
      removals: Array<{
        line: number;
        type: 'import' | 'export';
        statement: string;
        reason: string;
      }>;
    }> = [];

    for (const [filePath, analysis] of analysisResults) {
      const removals: Array<{
        line: number;
        type: 'import' | 'export';
        statement: string;
        reason: string;
      }> = [];

      // Only process truly safe removals (LOW risk, REMOVE category)
      for (const unusedImport of analysis.analysis.unusedImports) {
        if (unusedImport.category === 'REMOVE' && 
            unusedImport.risk === 'LOW' && 
            !this.isFrameworkCritical(unusedImport.source)) {
          removals.push({
            line: unusedImport.line,
            type: 'import',
            statement: unusedImport.fullStatement,
            reason: unusedImport.reason
          });
        }
      }

      for (const unusedExport of analysis.analysis.unusedExports) {
        if (unusedExport.category === 'REMOVE' && 
            unusedExport.risk === 'LOW' &&
            !unusedExport.isDefault) { // Never remove default exports automatically
          removals.push({
            line: unusedExport.line,
            type: 'export',
            statement: unusedExport.fullStatement,
            reason: unusedExport.reason
          });
        }
      }

      if (removals.length > 0) {
        safeRemovals.push({ filePath, removals });
      }
    }

    return safeRemovals;
  }

  private isFrameworkCritical(source: string): boolean {
    const criticalModules = [
      'react',
      'react-dom',
      'next',
      'next/',
      '@supabase/',
      '@radix-ui/',
      'framer-motion'
    ];

    return criticalModules.some(module => source.startsWith(module));
  }

  private async executeSafeRemovalBatch(safeRemovals: Array<{
    filePath: string;
    removals: Array<{
      line: number;
      type: 'import' | 'export';
      statement: string;
      reason: string;
    }>;
  }>): Promise<void> {
    console.log(`\n📝 Found ${safeRemovals.length} files with safe removals`);
    
    let totalRemovals = 0;
    let filesProcessed = 0;

    // Create backup directory
    const backupDir = path.join(this.projectRoot, '.backup-safe-cleanups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    for (const fileBatch of safeRemovals) {
      try {
        const relativePath = path.relative(this.projectRoot, fileBatch.filePath);
        console.log(`\n🔧 Processing: ${relativePath}`);
        console.log(`   Removals: ${fileBatch.removals.length}`);

        // Create backup
        const backupPath = path.join(backupDir, relativePath + '.backup');
        const backupDirPath = path.dirname(backupPath);
        if (!fs.existsSync(backupDirPath)) {
          fs.mkdirSync(backupDirPath, { recursive: true });
        }
        fs.copyFileSync(fileBatch.filePath, backupPath);

        // Read file content
        let fileLines = fs.readFileSync(fileBatch.filePath, 'utf-8').split('\n');
        
        // Sort removals by line number in descending order to avoid line shifts
        const sortedRemovals = [...fileBatch.removals].sort((a, b) => b.line - a.line);

        // Execute removals
        for (const removal of sortedRemovals) {
          if (removal.line > 0 && removal.line <= fileLines.length) {
            console.log(`   ✂️  Line ${removal.line}: Removing ${removal.type}`);
            console.log(`      Reason: ${removal.reason}`);
            fileLines.splice(removal.line - 1, 1);
            totalRemovals++;
          }
        }

        // Write back to file
        fs.writeFileSync(fileBatch.filePath, fileLines.join('\n'));
        filesProcessed++;

        console.log(`   ✅ Successfully processed ${relativePath}`);

      } catch (error) {
        const relativePath = path.relative(this.projectRoot, fileBatch.filePath);
        console.error(`   ❌ Error processing ${relativePath}:`, error);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Files processed: ${filesProcessed}`);
    console.log(`   Total removals: ${totalRemovals}`);
    console.log(`   Backup location: ${backupDir}`);
  }
}

// Main execution
async function main() {
  const projectRoot = process.cwd();
  const executor = new SafeCleanupExecutor(projectRoot);
  
  try {
    await executor.executeSafeCleanups();
  } catch (error) {
    console.error('❌ Safe cleanup execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { SafeCleanupExecutor };