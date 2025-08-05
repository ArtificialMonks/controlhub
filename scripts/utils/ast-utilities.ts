#!/usr/bin/env node

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from '@typescript-eslint/typescript-estree';
import type { TSESTree } from '@typescript-eslint/types';

/**
 * Advanced TypeScript AST utilities for enterprise-grade import/export analysis
 * Integrates best practices from @typescript-eslint and TypeScript Compiler API
 */

export interface ImportInfo {
  importPath: string;
  importedNames: string[];
  isTypeOnly: boolean;
  isDefault: boolean;
  isNamespace: boolean;
  isDynamic: boolean;
  lineNumber: number;
  columnNumber: number;
  isFrameworkEssential: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ExportInfo {
  exportedNames: string[];
  isDefault: boolean;
  isReExport: boolean;
  reExportPath?: string;
  lineNumber: number;
  columnNumber: number;
  isUsedInternally: boolean;
}

export interface ASTAnalysisResult {
  filePath: string;
  imports: ImportInfo[];
  exports: ExportInfo[];
  dependencies: string[];
  isEntryPoint: boolean;
  hasBarrelPattern: boolean;
  cyclomaticComplexity: number;
  parseErrors: string[];
}

export class AdvancedASTAnalyzer {
  private typeChecker?: ts.TypeChecker;
  private program?: ts.Program;
  private frameworkEssentials: Set<string>;

  constructor(frameworkEssentials: string[] = []) {
    this.frameworkEssentials = new Set(frameworkEssentials);
  }

  /**
   * Initialize TypeScript program for advanced type checking
   */
  initializeTypeScript(projectRoot: string): void {
    const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
    
    if (fs.existsSync(tsconfigPath)) {
      const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        projectRoot
      );
      
      this.program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
      this.typeChecker = this.program.getTypeChecker();
    }
  }

  /**
   * Analyze a single TypeScript/JavaScript file with advanced AST parsing
   */
  analyzeFile(filePath: string): ASTAnalysisResult {
    const content = fs.readFileSync(filePath, 'utf-8');
    const result: ASTAnalysisResult = {
      filePath,
      imports: [],
      exports: [],
      dependencies: [],
      isEntryPoint: this.isEntryPoint(filePath),
      hasBarrelPattern: this.hasBarrelPattern(content),
      cyclomaticComplexity: 0,
      parseErrors: []
    };

    try {
      // Use TypeScript-ESLint parser for comprehensive AST analysis
      const ast = parse(content, {
        loc: true,
        range: true,
        tokens: true,
        comments: true,
        jsx: filePath.endsWith('.tsx') || filePath.endsWith('.jsx'),
        errorOnUnknownASTType: false,
        errorOnTypeScriptSyntacticAndSemanticIssues: false
      });

      // Analyze imports
      result.imports = this.extractImports(ast, filePath);
      
      // Analyze exports
      result.exports = this.extractExports(ast, filePath);
      
      // Calculate complexity
      result.cyclomaticComplexity = this.calculateComplexity(ast);
      
      // Extract dependencies
      result.dependencies = result.imports.map(imp => imp.importPath);

    } catch (error) {
      result.parseErrors.push(`Parse error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Extract import statements with advanced analysis
   */
  private extractImports(ast: TSESTree.Program, filePath: string): ImportInfo[] {
    const imports: ImportInfo[] = [];

    const traverse = (node: any) => {
      if (node.type === 'ImportDeclaration') {
        const importPath = node.source.value;
        const importInfo: ImportInfo = {
          importPath,
          importedNames: [],
          isTypeOnly: node.importKind === 'type',
          isDefault: false,
          isNamespace: false,
          isDynamic: false,
          lineNumber: node.loc?.start.line || 0,
          columnNumber: node.loc?.start.column || 0,
          isFrameworkEssential: this.isFrameworkEssential(importPath),
          riskLevel: 'LOW'
        };

        // Analyze import specifiers
        if (node.specifiers) {
          for (const specifier of node.specifiers) {
            switch (specifier.type) {
              case 'ImportDefaultSpecifier':
                importInfo.isDefault = true;
                importInfo.importedNames.push('default');
                break;
              case 'ImportNamespaceSpecifier':
                importInfo.isNamespace = true;
                importInfo.importedNames.push('*');
                break;
              case 'ImportSpecifier':
                importInfo.importedNames.push(specifier.imported.name);
                break;
            }
          }
        }

        // Determine risk level
        importInfo.riskLevel = this.calculateImportRisk(importInfo, filePath);
        
        imports.push(importInfo);
      }
      
      // Handle dynamic imports
      if (node.type === 'CallExpression' && 
          node.callee.type === 'Import' && 
          node.arguments.length > 0) {
        const dynamicImportPath = node.arguments[0].value;
        if (typeof dynamicImportPath === 'string') {
          imports.push({
            importPath: dynamicImportPath,
            importedNames: ['*'],
            isTypeOnly: false,
            isDefault: false,
            isNamespace: true,
            isDynamic: true,
            lineNumber: node.loc?.start.line || 0,
            columnNumber: node.loc?.start.column || 0,
            isFrameworkEssential: this.isFrameworkEssential(dynamicImportPath),
            riskLevel: 'HIGH' // Dynamic imports are high risk to remove
          });
        }
      }

      // Recursively traverse child nodes
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach(traverse);
          } else {
            traverse(node[key]);
          }
        }
      }
    };

    traverse(ast);
    return imports;
  }

  /**
   * Extract export statements with re-export analysis
   */
  private extractExports(ast: TSESTree.Program, filePath: string): ExportInfo[] {
    const exports: ExportInfo[] = [];

    const traverse = (node: any) => {
      if (node.type === 'ExportNamedDeclaration') {
        const exportInfo: ExportInfo = {
          exportedNames: [],
          isDefault: false,
          isReExport: !!node.source,
          reExportPath: node.source?.value,
          lineNumber: node.loc?.start.line || 0,
          columnNumber: node.loc?.start.column || 0,
          isUsedInternally: false
        };

        if (node.specifiers) {
          for (const specifier of node.specifiers) {
            exportInfo.exportedNames.push(specifier.exported.name);
          }
        }

        if (node.declaration) {
          // Handle export declarations (export const, export function, etc.)
          if (node.declaration.type === 'VariableDeclaration') {
            node.declaration.declarations.forEach((decl: any) => {
              if (decl.id.name) {
                exportInfo.exportedNames.push(decl.id.name);
              }
            });
          } else if (node.declaration.name) {
            exportInfo.exportedNames.push(node.declaration.name);
          }
        }

        exports.push(exportInfo);
      }
      
      if (node.type === 'ExportDefaultDeclaration') {
        exports.push({
          exportedNames: ['default'],
          isDefault: true,
          isReExport: false,
          lineNumber: node.loc?.start.line || 0,
          columnNumber: node.loc?.start.column || 0,
          isUsedInternally: false
        });
      }

      // Recursively traverse child nodes
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach(traverse);
          } else {
            traverse(node[key]);
          }
        }
      }
    };

    traverse(ast);
    return exports;
  }

  /**
   * Calculate cyclomatic complexity of the AST
   */
  private calculateComplexity(ast: TSESTree.Program): number {
    let complexity = 1; // Base complexity

    const traverse = (node: any) => {
      // Add complexity for control flow statements
      if (['IfStatement', 'WhileStatement', 'ForStatement', 'ForInStatement', 
           'ForOfStatement', 'SwitchCase', 'ConditionalExpression',
           'LogicalExpression', 'TryStatement', 'CatchClause'].includes(node.type)) {
        complexity++;
      }

      // Recursively traverse
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach(traverse);
          } else {
            traverse(node[key]);
          }
        }
      }
    };

    traverse(ast);
    return complexity;
  }

  /**
   * Check if a path represents a framework-essential import
   */
  private isFrameworkEssential(importPath: string): boolean {
    return Array.from(this.frameworkEssentials).some(essential => 
      importPath.startsWith(essential) || importPath.includes(essential)
    );
  }

  /**
   * Calculate risk level for removing an import
   */
  private calculateImportRisk(importInfo: ImportInfo, filePath: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    // High risk factors
    if (importInfo.isDynamic) return 'HIGH';
    if (importInfo.isFrameworkEssential) return 'HIGH';
    if (importInfo.importPath.startsWith('.') && importInfo.importPath.includes('..')) return 'HIGH';
    
    // Medium risk factors
    if (importInfo.isTypeOnly) return 'MEDIUM';
    if (importInfo.importPath.startsWith('@/')) return 'MEDIUM';
    if (filePath.includes('index.ts') || filePath.includes('index.tsx')) return 'MEDIUM';
    
    // Low risk (most likely safe to remove if unused)
    return 'LOW';
  }

  /**
   * Check if file is an entry point (pages, API routes, etc.)
   */
  private isEntryPoint(filePath: string): boolean {
    const entryPointPatterns = [
      /\/pages\/.*\.(tsx?|jsx?)$/,
      /\/app\/.*\/page\.(tsx?|jsx?)$/,
      /\/app\/.*\/route\.(tsx?|jsx?)$/,
      /\/app\/layout\.(tsx?|jsx?)$/,
      /\/api\/.*\.(tsx?|jsx?)$/,
      /main\.(tsx?|jsx?)$/,
      /index\.(tsx?|jsx?)$/
    ];

    return entryPointPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Check if file has barrel export pattern
   */
  private hasBarrelPattern(content: string): boolean {
    const exportLines = content.split('\n').filter(line => 
      line.trim().startsWith('export ') && line.includes('from ')
    );
    
    return exportLines.length > 3; // Arbitrary threshold for barrel pattern
  }

  /**
   * Resolve module path using TypeScript module resolution
   */
  resolveModulePath(importPath: string, containingFile: string): string | null {
    if (!this.program) return null;

    const resolvedModule = ts.resolveModuleName(
      importPath,
      containingFile,
      this.program.getCompilerOptions(),
      ts.sys
    );

    return resolvedModule.resolvedModule?.resolvedFileName || null;
  }

  /**
   * Get type information for a symbol (requires TypeScript program)
   */
  getTypeInfo(node: ts.Node): string | null {
    if (!this.typeChecker) return null;

    const symbol = this.typeChecker.getSymbolAtLocation(node);
    if (symbol) {
      return this.typeChecker.typeToString(
        this.typeChecker.getTypeOfSymbolAtLocation(symbol, node)
      );
    }

    return null;
  }
}

/**
 * Utility functions for AST manipulation
 */
export class ASTManipulator {
  /**
   * Remove unused import from source code
   */
  static removeImport(sourceCode: string, importInfo: ImportInfo): string {
    const lines = sourceCode.split('\n');
    const lineIndex = importInfo.lineNumber - 1;
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
      lines.splice(lineIndex, 1);
    }
    
    return lines.join('\n');
  }

  /**
   * Add import to source code
   */
  static addImport(sourceCode: string, importPath: string, importNames: string[]): string {
    const importStatement = this.generateImportStatement(importPath, importNames);
    const lines = sourceCode.split('\n');
    
    // Find insertion point (after existing imports)
    let insertIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() && !lines[i].trim().startsWith('//')) {
        break;
      }
    }
    
    lines.splice(insertIndex, 0, importStatement);
    return lines.join('\n');
  }

  /**
   * Generate import statement string
   */
  private static generateImportStatement(importPath: string, importNames: string[]): string {
    if (importNames.includes('default')) {
      const defaultName = importNames.find(name => name !== 'default') || 'DefaultImport';
      const namedImports = importNames.filter(name => name !== 'default');
      
      if (namedImports.length > 0) {
        return `import ${defaultName}, { ${namedImports.join(', ')} } from '${importPath}';`;
      } else {
        return `import ${defaultName} from '${importPath}';`;
      }
    } else if (importNames.includes('*')) {
      return `import * as ImportedModule from '${importPath}';`;
    } else {
      return `import { ${importNames.join(', ')} } from '${importPath}';`;
    }
  }

  /**
   * Validate TypeScript syntax after modification
   */
  static validateSyntax(sourceCode: string, filePath: string): string[] {
    const errors: string[] = [];
    
    try {
      const sourceFile = ts.createSourceFile(
        filePath,
        sourceCode,
        ts.ScriptTarget.Latest,
        true,
        filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );
      
      // Check for syntax errors using TypeScript program
      const program = ts.createProgram([filePath], { allowJs: true, checkJs: false });
      const diagnostics = program.getSyntacticDiagnostics(sourceFile);
      diagnostics.forEach(diagnostic => {
        if (diagnostic.messageText) {
          errors.push(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
        }
      });
      
    } catch (error) {
      errors.push(`Syntax validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return errors;
  }
}