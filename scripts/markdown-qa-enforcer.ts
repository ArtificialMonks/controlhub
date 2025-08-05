#!/usr/bin/env tsx
/**
 * Markdown Quality Assurance Enforcer
 * 
 * Enterprise-grade markdown quality enforcement system for A.V.A.R.I.C.E. Protocol
 * Achieves zero markdown linting violations through systematic analysis and automated fixes
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { glob } from 'glob';

interface ViolationFix {
  file: string;
  rule: string;
  line?: number;
  column?: number;
  description: string;
  severity: 'safe' | 'manual' | 'complex';
  fixApplied: boolean;
  originalContent?: string;
  fixedContent?: string;
}

interface QualityReport {
  totalFiles: number;
  totalViolations: number;
  violationsFixed: number;
  violationsRequiringManualReview: number;
  filesModified: string[];
  fixes: ViolationFix[];
  summary: {
    [rule: string]: {
      count: number;
      fixed: number;
      description: string;
    };
  };
}

class MarkdownQAEnforcer {
  private projectRoot: string;
  private report: QualityReport;
  private excludePatterns: string[] = [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/.backup*/**'
  ];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.report = {
      totalFiles: 0,
      totalViolations: 0,
      violationsFixed: 0,
      violationsRequiringManualReview: 0,
      filesModified: [],
      fixes: [],
      summary: {}
    };
  }

  /**
   * Main execution method - performs comprehensive markdown QA
   */
  async execute(): Promise<QualityReport> {
    console.log('🔍 Starting Markdown Quality Assurance Enforcement...\n');

    // Step 1: Discover all markdown files
    const markdownFiles = await this.discoverMarkdownFiles();
    this.report.totalFiles = markdownFiles.length;
    console.log(`📋 Found ${markdownFiles.length} markdown files to process\n`);

    // Step 2: Run initial lint and parse violations
    const violations = await this.analyzeViolations();
    this.report.totalViolations = violations.length;
    console.log(`⚠️  Found ${violations.length} total violations\n`);

    // Step 3: Categorize violations by fix complexity
    const categorizedViolations = this.categorizeViolations(violations);
    
    // Step 4: Apply safe automated fixes
    await this.applySafeFixes(categorizedViolations.safe);
    
    // Step 5: Generate comprehensive report
    await this.generateReport();
    
    console.log('✅ Markdown Quality Assurance Enforcement Complete\n');
    return this.report;
  }

  /**
   * Discover all markdown files in the project
   */
  private async discoverMarkdownFiles(): Promise<string[]> {
    const pattern = path.join(this.projectRoot, '**/*.md');
    const files = await glob(pattern, {
      ignore: this.excludePatterns,
      absolute: true
    });
    
    return files.sort();
  }

  /**
   * Analyze current markdown violations using markdownlint
   */
  private async analyzeViolations(): Promise<any[]> {
    try {
      const command = 'npm run lint:md';
      const output = execSync(command, { 
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // If no error, no violations found
      return [];
    } catch (error: any) {
      // markdownlint returns non-zero exit code when violations exist
      // Violations are typically in stderr
      const output = error.stderr || error.stdout || '';
      return this.parseViolationsFromText(output);
    }
  }

  /**
   * Parse violations from text output when JSON parsing fails
   */
  private parseViolationsFromText(output: string): any[] {
    const violations: any[] = [];
    const lines = output.split('\n').filter(line => line.trim() && !line.includes('npm warn'));
    
    for (const line of lines) {
      // Match pattern: file:line[:column] RULE/name Description [Context: "..."]
      const match = line.match(/^(.+?):(\d+)(?::(\d+))?\s+(MD\d+)\/[^\s]+\s+(.+?)(?:\s+\[Context:\s*"([^"]*)"?\])?$/);
      if (match) {
        const [, file, lineNum, column, ruleId, description, context] = match;
        violations.push({
          file: path.resolve(this.projectRoot, file),
          lineNumber: parseInt(lineNum),
          columnNumber: column ? parseInt(column) : undefined,
          ruleNames: [ruleId],
          ruleDescription: description,
          ruleInformation: '',
          errorDetail: description,
          errorContext: context || null,
          errorRange: null
        });
      }
    }
    
    return violations;
  }

  /**
   * Categorize violations by fix complexity and safety
   */
  private categorizeViolations(violations: any[]): {
    safe: any[];
    manual: any[];
    complex: any[];
  } {
    const categorized = {
      safe: [] as any[],
      manual: [] as any[],
      complex: [] as any[]
    };

    for (const violation of violations) {
      const ruleId = violation.ruleNames[0];
      
      // Update summary
      if (!this.report.summary[ruleId]) {
        this.report.summary[ruleId] = {
          count: 0,
          fixed: 0,
          description: violation.ruleDescription || ruleId
        };
      }
      this.report.summary[ruleId].count++;

      // Categorize based on rule type
      switch (ruleId) {
        case 'MD040': // fenced-code-language
        case 'MD047': // single-trailing-newline
        case 'MD029': // ol-prefix (ordered list prefix)
        case 'MD012': // no-multiple-blanks
        case 'MD046': // code-block-style
          categorized.safe.push(violation);
          break;
          
        case 'MD022': // blanks-around-headings
        case 'MD032': // blanks-around-lists
        case 'MD031': // blanks-around-fences
          categorized.safe.push(violation);
          break;
          
        case 'MD013': // line-length
          // Only fix if line is significantly over limit
          if (violation.errorDetail && violation.errorDetail.includes('Actual:')) {
            const actualMatch = violation.errorDetail.match(/Actual: (\d+)/);
            const actual = actualMatch ? parseInt(actualMatch[1]) : 0;
            if (actual > 250) { // Only fix extremely long lines automatically
              categorized.safe.push(violation);
            } else {
              categorized.manual.push(violation);
            }
          } else {
            categorized.manual.push(violation);
          }
          break;
          
        case 'MD025': // single-title/single-h1
        case 'MD036': // no-emphasis-as-heading
          categorized.complex.push(violation);
          break;
          
        default:
          categorized.manual.push(violation);
      }
    }

    console.log(`📊 Violation Analysis:`);
    console.log(`   Safe fixes: ${categorized.safe.length}`);
    console.log(`   Manual review: ${categorized.manual.length}`);
    console.log(`   Complex fixes: ${categorized.complex.length}\n`);

    return categorized;
  }

  /**
   * Apply safe automated fixes to markdown files
   */
  private async applySafeFixes(safeViolations: any[]): Promise<void> {
    console.log('🔧 Applying safe automated fixes...\n');
    
    // Group violations by file for efficient processing
    const violationsByFile = new Map<string, any[]>();
    for (const violation of safeViolations) {
      if (!violationsByFile.has(violation.file)) {
        violationsByFile.set(violation.file, []);
      }
      violationsByFile.get(violation.file)!.push(violation);
    }

    for (const [filePath, violations] of violationsByFile) {
      try {
        let content = await fs.readFile(filePath, 'utf8');
        const originalContent = content;
        let modified = false;

        // Sort violations by line number (descending) to avoid offset issues
        violations.sort((a, b) => (b.lineNumber || 0) - (a.lineNumber || 0));

        for (const violation of violations) {
          const ruleId = violation.ruleNames[0];
          
          switch (ruleId) {
            case 'MD040':
              content = this.fixFencedCodeLanguage(content, violation);
              modified = true;
              break;
              
            case 'MD047':
              content = this.fixTrailingNewline(content);
              modified = true;
              break;
              
            case 'MD029':
              content = this.fixOrderedListPrefix(content, violation);
              modified = true;
              break;
              
            case 'MD022':
              content = this.fixBlanksAroundHeadings(content, violation);
              modified = true;
              break;
              
            case 'MD032':
              content = this.fixBlanksAroundLists(content, violation);
              modified = true;
              break;
              
            case 'MD031':
              content = this.fixBlanksAroundFences(content, violation);
              modified = true;
              break;
              
            case 'MD013':
              const lineBreakResult = this.fixLineLength(content, violation);
              if (lineBreakResult.modified) {
                content = lineBreakResult.content;
                modified = true;
              }
              break;
              
            case 'MD012':
              content = this.fixMultipleBlankLines(content, violation);
              modified = true;
              break;
              
            case 'MD046':
              content = this.fixCodeBlockStyle(content, violation);
              modified = true;
              break;
          }

          // Record the fix
          const fix: ViolationFix = {
            file: filePath,
            rule: ruleId,
            line: violation.lineNumber,
            column: violation.columnNumber,
            description: violation.ruleDescription || ruleId,
            severity: 'safe',
            fixApplied: modified,
            originalContent: modified ? originalContent : undefined,
            fixedContent: modified ? content : undefined
          };
          
          this.report.fixes.push(fix);
          
          if (modified) {
            this.report.summary[ruleId].fixed++;
            this.report.violationsFixed++;
          }
        }

        if (modified) {
          await fs.writeFile(filePath, content, 'utf8');
          this.report.filesModified.push(filePath);
          console.log(`✅ Fixed ${violations.length} violations in ${path.relative(this.projectRoot, filePath)}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error);
      }
    }
  }

  /**
   * Fix MD040: Add language specification to fenced code blocks
   */
  private fixFencedCodeLanguage(content: string, violation: any): string {
    const lines = content.split('\n');
    const lineIndex = (violation.lineNumber || 1) - 1;
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      if (line.trim() === '```') {
        // Determine appropriate language based on context
        let language = 'text';
        const prevLines = lines.slice(Math.max(0, lineIndex - 3), lineIndex);
        const context = prevLines.join(' ').toLowerCase();
        
        if (context.includes('bash') || context.includes('shell') || context.includes('command')) {
          language = 'bash';
        } else if (context.includes('typescript') || context.includes('ts')) {
          language = 'typescript';
        } else if (context.includes('javascript') || context.includes('js')) {
          language = 'javascript';
        } else if (context.includes('json')) {
          language = 'json';
        } else if (context.includes('sql')) {
          language = 'sql';
        } else if (context.includes('yaml') || context.includes('yml')) {
          language = 'yaml';
        }
        
        lines[lineIndex] = `\`\`\`${language}`;
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Fix MD047: Ensure single trailing newline
   */
  private fixTrailingNewline(content: string): string {
    return content.replace(/\n*$/, '\n');
  }

  /**
   * Fix MD029: Correct ordered list prefixes
   */
  private fixOrderedListPrefix(content: string, violation: any): string {
    const lines = content.split('\n');
    const lineIndex = (violation.lineNumber || 1) - 1;
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      const match = line.match(/^(\s*)(\d+)(\.\s+.*)$/);
      
      if (match) {
        const [, indent, , rest] = match;
        
        // Find the expected number by looking at previous list items
        let expectedNumber = 1;
        for (let i = lineIndex - 1; i >= 0; i--) {
          const prevLine = lines[i].trim();
          if (prevLine === '') continue;
          
          const prevMatch = prevLine.match(/^(\s*)(\d+)(\.\s+.*)$/);
          if (prevMatch && prevMatch[1].length === indent.length) {
            expectedNumber = parseInt(prevMatch[2]) + 1;
            break;
          } else if (!prevMatch || prevMatch[1].length < indent.length) {
            break;
          }
        }
        
        lines[lineIndex] = `${indent}${expectedNumber}${rest}`;
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Fix MD022: Add blank lines around headings
   */
  private fixBlanksAroundHeadings(content: string, violation: any): string {
    const lines = content.split('\n');
    const lineIndex = (violation.lineNumber || 1) - 1;
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      if (line.match(/^#+\s/)) {
        // Add blank line before heading if needed
        if (lineIndex > 0 && lines[lineIndex - 1].trim() !== '') {
          lines.splice(lineIndex, 0, '');
        }
        
        // Add blank line after heading if needed
        const afterIndex = lineIndex + (lines[lineIndex - 1] === '' ? 1 : 0);
        if (afterIndex + 1 < lines.length && lines[afterIndex + 1].trim() !== '') {
          lines.splice(afterIndex + 1, 0, '');
        }
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Fix MD032: Add blank lines around lists
   */
  private fixBlanksAroundLists(content: string, violation: any): string {
    const lines = content.split('\n');
    const lineIndex = (violation.lineNumber || 1) - 1;
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      if (line.match(/^\s*[-*+]\s/) || line.match(/^\s*\d+\.\s/)) {
        // Add blank line before list if needed
        if (lineIndex > 0 && lines[lineIndex - 1].trim() !== '' && 
            !lines[lineIndex - 1].match(/^\s*[-*+]\s/) && 
            !lines[lineIndex - 1].match(/^\s*\d+\.\s/)) {
          lines.splice(lineIndex, 0, '');
        }
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Fix MD031: Add blank lines around fenced code blocks
   */
  private fixBlanksAroundFences(content: string, violation: any): string {
    const lines = content.split('\n');
    const lineIndex = (violation.lineNumber || 1) - 1;
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      if (line.trim().startsWith('```')) {
        // Add blank line before fence if needed
        if (lineIndex > 0 && lines[lineIndex - 1].trim() !== '') {
          lines.splice(lineIndex, 0, '');
        }
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Fix MD013: Break long lines at natural break points
   */
  private fixLineLength(content: string, violation: any): { content: string; modified: boolean } {
    const lines = content.split('\n');
    const lineIndex = (violation.lineNumber || 1) - 1;
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      
      // Only fix extremely long lines automatically (>250 chars)
      if (line.length > 250) {
        // Try to break at natural points: after commas, periods, or spaces
        const breakPoints = [', ', '. ', ' - ', ' and ', ' or ', ' but '];
        
        for (const breakPoint of breakPoints) {
          const index = line.lastIndexOf(breakPoint, 200);
          if (index > 100) {
            const firstPart = line.substring(0, index + breakPoint.length).trim();
            const secondPart = line.substring(index + breakPoint.length).trim();
            
            lines[lineIndex] = firstPart;
            lines.splice(lineIndex + 1, 0, secondPart);
            
            return { content: lines.join('\n'), modified: true };
          }
        }
      }
    }
    
    return { content, modified: false };
  }

  /**
   * Fix MD012: Remove multiple consecutive blank lines
   */
  private fixMultipleBlankLines(content: string, violation: any): string {
    // Replace multiple consecutive blank lines with single blank line
    return content.replace(/\n{3,}/g, '\n\n');
  }

  /**
   * Fix MD046: Convert indented code blocks to fenced code blocks
   */
  private fixCodeBlockStyle(content: string, violation: any): string {
    const lines = content.split('\n');
    const lineIndex = (violation.lineNumber || 1) - 1;
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      
      // Check if this is an indented code block (4+ spaces)
      if (line.match(/^    /)) {
        // Find the start and end of the indented code block
        let startIndex = lineIndex;
        let endIndex = lineIndex;
        
        // Find the start (go backwards)
        while (startIndex > 0) {
          const prevLine = lines[startIndex - 1];
          if (prevLine.trim() === '' || prevLine.match(/^    /)) {
            startIndex--;
          } else {
            break;
          }
        }
        
        // Skip empty lines at the beginning
        while (startIndex < lines.length && lines[startIndex].trim() === '') {
          startIndex++;
        }
        
        // Find the end (go forwards)
        while (endIndex < lines.length - 1) {
          const nextLine = lines[endIndex + 1];
          if (nextLine.trim() === '' || nextLine.match(/^    /)) {
            endIndex++;
          } else {
            break;
          }
        }
        
        // Skip empty lines at the end
        while (endIndex >= startIndex && lines[endIndex].trim() === '') {
          endIndex--;
        }
        
        if (startIndex <= endIndex) {
          // Extract code content and remove leading 4 spaces
          const codeLines = lines.slice(startIndex, endIndex + 1)
            .map(line => line.replace(/^    /, ''));
          
          // Replace the indented block with a fenced block
          const replacement = [
            '```text',
            ...codeLines,
            '```'
          ];
          
          lines.splice(startIndex, endIndex - startIndex + 1, ...replacement);
        }
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Generate comprehensive quality assurance report
   */
  private async generateReport(): Promise<void> {
    const reportPath = path.join(this.projectRoot, 'logs', `markdown-qa-report-${Date.now()}.md`);
    
    // Ensure logs directory exists
    await fs.mkdir(path.dirname(reportPath), { recursive: true });

    const reportContent = `# Markdown Quality Assurance Report

Generated: ${new Date().toISOString()}

## Executive Summary

- **Total Files Processed**: ${this.report.totalFiles}
- **Total Violations Found**: ${this.report.totalViolations}
- **Violations Fixed**: ${this.report.violationsFixed}
- **Files Modified**: ${this.report.filesModified.length}
- **Success Rate**: ${((this.report.violationsFixed / this.report.totalViolations) * 100).toFixed(1)}%

## Violation Summary by Rule

${Object.entries(this.report.summary).map(([rule, data]) => `
### ${rule}: ${data.description}

- **Total Found**: ${data.count}
- **Fixed**: ${data.fixed}
- **Fix Rate**: ${((data.fixed / data.count) * 100).toFixed(1)}%
`).join('')}

## Files Modified

${this.report.filesModified.map(file => `- ${path.relative(this.projectRoot, file)}`).join('\n')}

## Detailed Fix Log

${this.report.fixes.filter(fix => fix.fixApplied).map(fix => `
### ${path.relative(this.projectRoot, fix.file)}

- **Rule**: ${fix.rule}
- **Line**: ${fix.line || 'N/A'}
- **Description**: ${fix.description}
- **Severity**: ${fix.severity}
- **Status**: ✅ Fixed
`).join('')}

## Next Steps

1. Review any remaining violations that require manual attention
2. Run \`npm run lint:md\` to verify all fixes were applied correctly
3. Consider adding pre-commit hooks to prevent future violations
4. Update documentation standards based on common violation patterns

---

**A.V.A.R.I.C.E. Protocol Compliance**: This report maintains zero tolerance for quality debt and ensures comprehensive markdown quality enforcement.
`;

    await fs.writeFile(reportPath, reportContent, 'utf8');
    console.log(`📋 Comprehensive report generated: ${path.relative(this.projectRoot, reportPath)}\n`);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const projectRoot = process.cwd();
  const enforcer = new MarkdownQAEnforcer(projectRoot);
  
  enforcer.execute()
    .then(report => {
      console.log('\n🎯 Markdown Quality Assurance Summary:');
      console.log(`   Files processed: ${report.totalFiles}`);
      console.log(`   Violations found: ${report.totalViolations}`);
      console.log(`   Violations fixed: ${report.violationsFixed}`);
      console.log(`   Files modified: ${report.filesModified.length}`);
      console.log(`   Success rate: ${((report.violationsFixed / report.totalViolations) * 100).toFixed(1)}%\n`);
      
      if (report.violationsFixed < report.totalViolations) {
        console.log('⚠️  Some violations require manual review. Check the generated report for details.\n');
        process.exit(1);
      } else {
        console.log('✅ All violations successfully resolved!\n');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('❌ Markdown Quality Assurance failed:', error);
      process.exit(1);
    });
}

export { MarkdownQAEnforcer };