#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import * as ts from 'typescript';

interface ImportExportInfo {
  file: string;
  imports: ImportInfo[];
  exports: ExportInfo[];
  dynamicImports: string[];
  typeOnlyImports: ImportInfo[];
}

interface ImportInfo {
  source: string;
  imports: string[];
  isTypeOnly: boolean;
  isDefault: boolean;
  line: number;
  fullStatement: string;
}

interface ExportInfo {
  name: string;
  isDefault: boolean;
  line: number;
  fullStatement: string;
  reExportFrom?: string;
}

interface AnalysisResult {
  category: 'REMOVE' | 'PRESERVE' | 'IMPLEMENT' | 'RELOCATE';
  reason: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
}

interface ImportExportAnalysis extends ImportExportInfo {
  analysis: {
    unusedImports: Array<ImportInfo & AnalysisResult>;
    unusedExports: Array<ExportInfo & AnalysisResult>;
    missingImplementations: Array<{
      name: string;
      referencedIn: string[];
      suggestedAction: string;
    }>;
    circularDependencies: string[];
  };
}

class ImportExportAnalyzer {
  private projectRoot: string;
  private tsConfigPath: string;
  private pathAliases: Map<string, string> = new Map();
  private allFiles: Set<string> = new Set();
  private importExportMap: Map<string, ImportExportInfo> = new Map();
  private usageMap: Map<string, Set<string>> = new Map(); // symbol -> files that use it

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.tsConfigPath = path.join(projectRoot, 'tsconfig.json');
    this.loadTsConfig();
  }

  private loadTsConfig(): void {
    try {
      const tsConfig = JSON.parse(fs.readFileSync(this.tsConfigPath, 'utf-8'));
      const paths = tsConfig.compilerOptions?.paths || {};
      
      // Load path aliases
      for (const [alias, pathArray] of Object.entries(paths)) {
        if (Array.isArray(pathArray) && pathArray.length > 0) {
          const cleanAlias = alias.replace('/*', '');
          const cleanPath = pathArray[0].replace('/*', '');
          this.pathAliases.set(cleanAlias, path.resolve(this.projectRoot, cleanPath));
        }
      }
      
      console.log(`Loaded ${this.pathAliases.size} path aliases`);
    } catch (error) {
      console.error('Failed to load tsconfig.json:', error);
    }
  }

  private resolveImportPath(importPath: string, fromFile: string): string {
    // Handle relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      return path.resolve(path.dirname(fromFile), importPath);
    }

    // Handle path aliases
    for (const [alias, aliasPath] of this.pathAliases) {
      if (importPath.startsWith(alias)) {
        const relativePath = importPath.substring(alias.length);
        return path.join(aliasPath, relativePath);
      }
    }

    // Handle node_modules or built-in modules
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      return importPath; // External module
    }

    return importPath;
  }

  private findActualFile(importPath: string): string | null {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
    
    for (const ext of extensions) {
      const candidate = importPath + ext;
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  private parseSourceFile(filePath: string): ImportExportInfo {
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const imports: ImportInfo[] = [];
    const exports: ExportInfo[] = [];
    const dynamicImports: string[] = [];
    const typeOnlyImports: ImportInfo[] = [];

    const visit = (node: ts.Node) => {
      // Handle import declarations
      if (ts.isImportDeclaration(node)) {
        const importClause = node.importClause;
        const moduleSpecifier = node.moduleSpecifier;
        
        if (ts.isStringLiteral(moduleSpecifier)) {
          const source = moduleSpecifier.text;
          const isTypeOnly = importClause?.isTypeOnly || false;
          
          const importInfo: ImportInfo = {
            source,
            imports: [],
            isTypeOnly,
            isDefault: false,
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            fullStatement: sourceCode.substring(node.getStart(), node.getEnd())
          };

          // Parse import specifiers
          if (importClause) {
            if (importClause.name) {
              // Default import
              importInfo.isDefault = true;
              importInfo.imports.push(importClause.name.text);
            }

            if (importClause.namedBindings) {
              if (ts.isNamedImports(importClause.namedBindings)) {
                // Named imports
                importClause.namedBindings.elements.forEach(element => {
                  importInfo.imports.push(element.name.text);
                });
              } else if (ts.isNamespaceImport(importClause.namedBindings)) {
                // Namespace import (import * as foo)
                importInfo.imports.push(importClause.namedBindings.name.text);
              }
            }
          }

          imports.push(importInfo);
          
          if (isTypeOnly) {
            typeOnlyImports.push(importInfo);
          }
        }
      }

      // Handle export declarations
      if (ts.isExportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        const exportClause = node.exportClause;
        
        if (exportClause && ts.isNamedExports(exportClause)) {
          exportClause.elements.forEach(element => {
            exports.push({
              name: element.name.text,
              isDefault: false,
              line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
              fullStatement: sourceCode.substring(node.getStart(), node.getEnd()),
              reExportFrom: moduleSpecifier && ts.isStringLiteral(moduleSpecifier) 
                ? moduleSpecifier.text 
                : undefined
            });
          });
        }
      }

      // Handle default exports
      if (ts.isExportAssignment(node) && node.isExportEquals === false) {
        exports.push({
          name: 'default',
          isDefault: true,
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
          fullStatement: sourceCode.substring(node.getStart(), node.getEnd())
        });
      }

      // Handle function/class/variable exports
      const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
      if (modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)) {
        let exportName = '';
        let isDefault = modifiers.some(mod => mod.kind === ts.SyntaxKind.DefaultKeyword);

        if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
          exportName = node.name?.text || (isDefault ? 'default' : '');
        } else if (ts.isVariableStatement(node)) {
          node.declarationList.declarations.forEach(decl => {
            if (ts.isIdentifier(decl.name)) {
              exportName = decl.name.text;
            }
          });
        }

        if (exportName) {
          exports.push({
            name: exportName,
            isDefault,
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            fullStatement: sourceCode.substring(node.getStart(), node.getEnd())
          });
        }
      }

      // Handle dynamic imports
      if (ts.isCallExpression(node)) {
        if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
          const arg = node.arguments[0];
          if (ts.isStringLiteral(arg)) {
            dynamicImports.push(arg.text);
          } else if (ts.isTemplateExpression(arg) || ts.isBinaryExpression(arg)) {
            // Dynamic import with template literal or concatenation
            dynamicImports.push(sourceCode.substring(arg.getStart(), arg.getEnd()));
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return {
      file: filePath,
      imports,
      exports,
      dynamicImports,
      typeOnlyImports
    };
  }

  private analyzeImportUsage(importInfo: ImportInfo, fileInfo: ImportExportInfo): AnalysisResult {
    const sourceCode = fs.readFileSync(fileInfo.file, 'utf-8');
    const isFrameworkEssential = this.isFrameworkEssential(importInfo);
    const isSideEffect = this.isSideEffectImport(importInfo);
    const isUsedInFile = this.isImportUsedInFile(importInfo, sourceCode);
    const isUsedDynamically = this.isUsedInDynamicImports(importInfo, fileInfo.dynamicImports);

    // Framework essential imports - always preserve
    if (isFrameworkEssential) {
      return {
        category: 'PRESERVE',
        reason: 'Framework essential import (React, Next.js, etc.)',
        risk: 'HIGH',
        recommendation: 'Keep - required for framework functionality'
      };
    }

    // Side effect imports - always preserve
    if (isSideEffect) {
      return {
        category: 'PRESERVE',
        reason: 'Side-effect import (CSS, polyfills, configurations)',
        risk: 'HIGH',
        recommendation: 'Keep - required for side effects'
      };
    }

    // Type-only imports that are used
    if (importInfo.isTypeOnly && isUsedInFile) {
      return {
        category: 'PRESERVE',
        reason: 'Type-only import used in type annotations',
        risk: 'MEDIUM',
        recommendation: 'Keep - required for TypeScript compilation'
      };
    }

    // Used in dynamic imports
    if (isUsedDynamically) {
      return {
        category: 'PRESERVE',
        reason: 'Used in dynamic import expressions',
        risk: 'HIGH',
        recommendation: 'Keep - required for dynamic loading'
      };
    }

    // Used in file
    if (isUsedInFile) {
      return {
        category: 'PRESERVE',
        reason: 'Import is actively used in the file',
        risk: 'LOW',
        recommendation: 'Keep - actively used'
      };
    }

    // Check if it's used elsewhere in the codebase
    const usageCount = this.getUsageCount(importInfo.source);
    if (usageCount > 1) {
      return {
        category: 'PRESERVE',
        reason: 'Import is used in other parts of the codebase',
        risk: 'MEDIUM',
        recommendation: 'Keep - used elsewhere'
      };
    }

    // Truly unused import
    return {
      category: 'REMOVE',
      reason: 'Import is not used anywhere in the file',
      risk: 'LOW',
      recommendation: 'Safe to remove'
    };
  }

  private isFrameworkEssential(importInfo: ImportInfo): boolean {
    const essentialModules = [
      'react',
      'react-dom',
      'next',
      'next/server',
      'next/navigation',
      'next/headers',
      '@supabase/supabase-js',
      '@supabase/ssr'
    ];

    return essentialModules.some(module => importInfo.source.startsWith(module));
  }

  private isSideEffectImport(importInfo: ImportInfo): boolean {
    // Imports with no named imports (just for side effects)
    if (importInfo.imports.length === 0) {
      return true;
    }

    // CSS imports
    if (importInfo.source.endsWith('.css') || importInfo.source.endsWith('.scss')) {
      return true;
    }

    // Common side-effect modules
    const sideEffectModules = [
      'dotenv/config',
      'server-only',
      '@testing-library/jest-dom'
    ];

    return sideEffectModules.includes(importInfo.source);
  }

  private isImportUsedInFile(importInfo: ImportInfo, sourceCode: string): boolean {
    for (const importedName of importInfo.imports) {
      // Create regex to find usage (word boundary to avoid partial matches)
      const usageRegex = new RegExp(`\\b${importedName}\\b`, 'g');
      const matches = sourceCode.match(usageRegex);
      
      // If found more than once (once for import, others for usage)
      if (matches && matches.length > 1) {
        return true;
      }
    }
    return false;
  }

  private isUsedInDynamicImports(importInfo: ImportInfo, dynamicImports: string[]): boolean {
    return dynamicImports.some(dynamicImport => {
      return importInfo.imports.some(importedName => 
        dynamicImport.includes(importedName)
      );
    });
  }

  private getUsageCount(source: string): number {
    let count = 0;
    for (const [, fileInfo] of this.importExportMap) {
      if (fileInfo.imports.some(imp => imp.source === source)) {
        count++;
      }
    }
    return count;
  }

  async analyzeProject(): Promise<Map<string, ImportExportAnalysis>> {
    console.log('🔍 Starting comprehensive import/export analysis...');
    
    // Find all TypeScript files
    const tsFiles = await glob('src/**/*.{ts,tsx}', { 
      cwd: this.projectRoot,
      ignore: ['**/*.test.ts', '**/*.test.tsx', '**/node_modules/**']
    });

    console.log(`📁 Found ${tsFiles.length} TypeScript files`);

    // Parse all files
    for (const file of tsFiles) {
      const fullPath = path.resolve(this.projectRoot, file);
      this.allFiles.add(fullPath);
      
      try {
        const fileInfo = this.parseSourceFile(fullPath);
        this.importExportMap.set(fullPath, fileInfo);
      } catch (error) {
        console.error(`❌ Error parsing ${file}:`, error);
      }
    }

    console.log('🧠 Analyzing import/export relationships...');

    // Build usage map
    this.buildUsageMap();

    // Analyze each file
    const results = new Map<string, ImportExportAnalysis>();
    
    for (const [filePath, fileInfo] of this.importExportMap) {
      const analysis = this.analyzeFile(fileInfo);
      results.set(filePath, analysis);
    }

    return results;
  }

  private buildUsageMap(): void {
    for (const [, fileInfo] of this.importExportMap) {
      for (const importInfo of fileInfo.imports) {
        for (const importedSymbol of importInfo.imports) {
          if (!this.usageMap.has(importedSymbol)) {
            this.usageMap.set(importedSymbol, new Set());
          }
          this.usageMap.get(importedSymbol)!.add(fileInfo.file);
        }
      }
    }
  }

  private analyzeFile(fileInfo: ImportExportInfo): ImportExportAnalysis {
    const unusedImports: Array<ImportInfo & AnalysisResult> = [];
    const unusedExports: Array<ExportInfo & AnalysisResult> = [];
    const missingImplementations: Array<{
      name: string;
      referencedIn: string[];
      suggestedAction: string;
    }> = [];

    // Analyze imports
    for (const importInfo of fileInfo.imports) {
      const analysis = this.analyzeImportUsage(importInfo, fileInfo);
      if (analysis.category === 'REMOVE') {
        unusedImports.push({ ...importInfo, ...analysis });
      }
    }

    // Analyze exports (basic implementation for now)
    for (const exportInfo of fileInfo.exports) {
      const isUsed = this.isExportUsed(exportInfo, fileInfo.file);
      if (!isUsed && !exportInfo.isDefault) {
        unusedExports.push({
          ...exportInfo,
          category: 'REMOVE',
          reason: 'Export is not used by other files',
          risk: 'LOW',
          recommendation: 'Safe to remove'
        });
      }
    }

    return {
      ...fileInfo,
      analysis: {
        unusedImports,
        unusedExports,
        missingImplementations,
        circularDependencies: [] // TODO: Implement circular dependency detection
      }
    };
  }

  private isExportUsed(exportInfo: ExportInfo, filePath: string): boolean {
    // Check if this export is imported by other files
    for (const [otherFile, otherFileInfo] of this.importExportMap) {
      if (otherFile === filePath) continue;
      
      for (const importInfo of otherFileInfo.imports) {
        const resolvedImportPath = this.resolveImportPath(importInfo.source, otherFile);
        const actualFile = this.findActualFile(resolvedImportPath);
        
        if (actualFile === filePath) {
          if (importInfo.imports.includes(exportInfo.name) || 
              (exportInfo.isDefault && importInfo.isDefault)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  generateReport(results: Map<string, ImportExportAnalysis>): string {
    let report = '# Import/Export Analysis Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    // Summary statistics
    let totalUnusedImports = 0;
    let totalUnusedExports = 0;
    let totalFiles = results.size;

    for (const [, analysis] of results) {
      totalUnusedImports += analysis.analysis.unusedImports.length;
      totalUnusedExports += analysis.analysis.unusedExports.length;
    }

    report += '## Summary\n\n';
    report += `- **Files analyzed**: ${totalFiles}\n`;
    report += `- **Unused imports found**: ${totalUnusedImports}\n`;
    report += `- **Unused exports found**: ${totalUnusedExports}\n\n`;

    // Detailed findings
    report += '## Detailed Findings\n\n';

    for (const [filePath, analysis] of results) {
      const relativePath = path.relative(this.projectRoot, filePath);
      
      if (analysis.analysis.unusedImports.length > 0 || analysis.analysis.unusedExports.length > 0) {
        report += `### ${relativePath}\n\n`;

        if (analysis.analysis.unusedImports.length > 0) {
          report += '#### Unused Imports\n\n';
          for (const unusedImport of analysis.analysis.unusedImports) {
            report += `- **Line ${unusedImport.line}**: \`${unusedImport.source}\`\n`;
            report += `  - **Category**: ${unusedImport.category}\n`;
            report += `  - **Risk**: ${unusedImport.risk}\n`;
            report += `  - **Reason**: ${unusedImport.reason}\n`;
            report += `  - **Recommendation**: ${unusedImport.recommendation}\n\n`;
          }
        }

        if (analysis.analysis.unusedExports.length > 0) {
          report += '#### Unused Exports\n\n';
          for (const unusedExport of analysis.analysis.unusedExports) {
            report += `- **Line ${unusedExport.line}**: \`${unusedExport.name}\`\n`;
            report += `  - **Category**: ${unusedExport.category}\n`;
            report += `  - **Risk**: ${unusedExport.risk}\n`;
            report += `  - **Reason**: ${unusedExport.reason}\n`;
            report += `  - **Recommendation**: ${unusedExport.recommendation}\n\n`;
          }
        }
      }
    }

    return report;
  }
}

// Main execution
async function main() {
  const projectRoot = process.cwd();
  const analyzer = new ImportExportAnalyzer(projectRoot);
  
  try {
    const results = await analyzer.analyzeProject();
    const report = analyzer.generateReport(results);
    
    // Write report to file
    const reportPath = path.join(projectRoot, 'logs', 'import-export-analysis.md');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report);
    
    console.log(`📊 Analysis complete! Report saved to: ${reportPath}`);
    console.log('\n' + '='.repeat(50));
    console.log(report);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { ImportExportAnalyzer };