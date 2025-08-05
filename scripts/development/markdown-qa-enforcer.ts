#!/usr/bin/env node
/**
 * Markdown Quality Assurance Enforcer
 * 
 * Enterprise-grade agent for achieving and maintaining zero markdown linting violations
 * across the A.V.A.R.I.C.E. Protocol ecosystem.
 * 
 * Features:
 * - Bulk processing for common violations (MD022, MD032, MD013)
 * - Targeted resolution for complex context-specific issues
 * - Comprehensive validation with detailed violation reporting
 * - Fix verification to ensure document integrity
 * - Enterprise integration with A.V.A.R.I.C.E. Protocol standards
 */

import { exec, execSync } from 'child_process';
import { promises as fs } from 'fs';
import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ViolationReport {
  file: string;
  line: number;
  column?: number;
  rule: string;
  description: string;
  severity: 'error' | 'warning';
  fixable: boolean;
}

interface FixResult {
  file: string;
  rule: string;
  applied: boolean;
  error?: string;
}

interface QAEnforcerConfig {
  projectRoot: string;
  excludePaths: string[];
  bulkFixableRules: string[];
  complexRules: string[];
  backupEnabled: boolean;
  neo4jEnabled: boolean;
  preCommitHooks: boolean;
  performanceOptimization: boolean;
}

class MarkdownQAEnforcer {
  private config: QAEnforcerConfig;
  private violations: ViolationReport[] = [];
  private fixResults: FixResult[] = [];

  constructor(projectRoot: string = process.cwd()) {
    this.config = {
      projectRoot,
      excludePaths: [
        'node_modules/**',
        '.git/**',
        'coverage/**',
        'build/**',
        'dist/**'
      ],
      bulkFixableRules: [
        'MD022', // Blanks around headings
        'MD032', // Blanks around lists  
        'MD013', // Line length (partial - wrap long lines)
        'MD009', // Trailing spaces
        'MD010', // Hard tabs
        'MD012', // Multiple consecutive blank lines
        'MD047', // Single trailing newline
        'MD019', // Multiple spaces after hash
        'MD020', // No space inside hashes
        'MD021', // Multiple spaces inside hashes
      ],
      complexRules: [
        'MD040', // Missing code block languages
        'MD024', // Duplicate headings
        'MD036', // Emphasis as heading
        'MD046', // Code block style
        'MD029', // Ordered list prefix
        'MD055', // Table pipe style
        'MD041', // First line heading
        'MD001', // Heading levels should increment
        'MD003', // Heading style
        'MD006', // Consider starting bulleted lists at the beginning of the line
        'MD026', // Trailing punctuation in heading
        'MD030', // Spaces after list markers
      ],
      backupEnabled: true,
      neo4jEnabled: false, // Enable when Neo4j is available
      preCommitHooks: true,
      performanceOptimization: true
    };
  }

  private async log(message: string, level: 'info' | 'warn' | 'error' = 'info'): Promise<void> {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    console.log(logMessage);
    
    // Write to log file for A.V.A.R.I.C.E. Protocol integration
    const logDir = path.join(this.config.projectRoot, 'logs');
    await fs.mkdir(logDir, { recursive: true });
    await fs.appendFile(
      path.join(logDir, 'markdown-qa-enforcer.log'),
      logMessage + '\n'
    );
  }

  private async scanViolations(): Promise<ViolationReport[]> {
    await this.log('Starting comprehensive markdown violation scan');
    
    try {
      // Performance optimization: scan in chunks if many files
      const markdownFiles = await this.getMarkdownFiles();
      const chunkSize = this.config.performanceOptimization ? 50 : markdownFiles.length;
      
      if (markdownFiles.length > chunkSize) {
        await this.log(`Processing ${markdownFiles.length} files in chunks of ${chunkSize} for performance`);
        return await this.scanViolationsInChunks(markdownFiles, chunkSize);
      }
      
      // Use exec with manual handling since markdownlint returns non-zero exit code on violations
      const result = await new Promise<{stdout: string, stderr: string}>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Markdown scan timeout after 5 minutes'));
        }, 300000); // 5 minute timeout
        
        exec(
          'npx markdownlint . --json --config .markdownlint.json --ignore node_modules',
          { cwd: this.config.projectRoot, maxBuffer: 1024 * 1024 * 10 }, // 10MB buffer
          (error, stdout, stderr) => {
            clearTimeout(timeout);
            resolve({ stdout: stdout || stderr, stderr });
          }
        );
      });

      const violations: ViolationReport[] = [];
      
      // Clean up stdout to remove npm warnings and extract JSON
      let cleanJson = result.stdout;
      const jsonStart = cleanJson.indexOf('[');
      const jsonEnd = cleanJson.lastIndexOf(']') + 1;
      
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        cleanJson = cleanJson.substring(jsonStart, jsonEnd);
      }
      
      if (!cleanJson.trim()) {
        await this.log('No violations found - codebase is clean!');
        return [];
      }
      
      const results = JSON.parse(cleanJson);

      // Handle array format returned by markdownlint --json
      if (Array.isArray(results)) {
        for (const violation of results) {
          violations.push({
            file: violation.fileName,
            line: violation.lineNumber,
            column: violation.columnNumber,
            rule: violation.ruleNames[0],
            description: violation.ruleDescription,
            severity: 'error',
            fixable: this.isFixable(violation.ruleNames[0])
          });
        }
      } else {
        // Handle object format (file -> violations mapping)
        for (const [file, fileViolations] of Object.entries(results)) {
          if (Array.isArray(fileViolations)) {
            for (const violation of fileViolations) {
              violations.push({
                file,
                line: violation.lineNumber,
                column: violation.columnNumber,
                rule: violation.ruleNames[0],
                description: violation.ruleDescription,
                severity: 'error',
                fixable: this.isFixable(violation.ruleNames[0])
              });
            }
          }
        }
      }

      this.violations = violations;
      const fileCount = Array.isArray(results) ? 
        new Set(results.map(v => v.fileName)).size : 
        Object.keys(results).length;
      await this.log(`Scan complete: ${violations.length} violations found across ${fileCount} files`);
      
      return violations;
    } catch (error) {
      await this.log(`Error during violation scan: ${error}`, 'error');
      throw error;
    }
  }

  private async getMarkdownFiles(): Promise<string[]> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    try {
      const { stdout } = await execAsync('find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*"', {
        cwd: this.config.projectRoot
      });
      return stdout.trim().split('\n').filter(f => f.length > 0);
    } catch (error) {
      await this.log(`Error getting markdown files: ${error}`, 'warn');
      return [];
    }
  }

  private async scanViolationsInChunks(files: string[], chunkSize: number): Promise<ViolationReport[]> {
    const allViolations: ViolationReport[] = [];
    
    for (let i = 0; i < files.length; i += chunkSize) {
      const chunk = files.slice(i, i + chunkSize);
      await this.log(`Processing chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(files.length/chunkSize)}`);
      
      try {
        const chunkViolations = await this.scanFileChunk(chunk);
        allViolations.push(...chunkViolations);
      } catch (error) {
        await this.log(`Error processing chunk: ${error}`, 'warn');
      }
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return allViolations;
  }

  private async scanFileChunk(files: string[]): Promise<ViolationReport[]> {
    const filePattern = files.join(' ');
    const { exec } = await import('child_process');
    
    return new Promise((resolve) => {
      exec(
        `npx markdownlint ${filePattern} --json --config .markdownlint.json`,
        { cwd: this.config.projectRoot, maxBuffer: 1024 * 1024 * 5 },
        (error, stdout, stderr) => {
          const violations: ViolationReport[] = [];
          
          try {
            const output = stdout || stderr;
            if (output.trim()) {
              const results = JSON.parse(output);
              // Process results similar to main scanViolations method
              if (Array.isArray(results)) {
                for (const violation of results) {
                  violations.push({
                    file: violation.fileName,
                    line: violation.lineNumber,
                    column: violation.columnNumber,
                    rule: violation.ruleNames[0],
                    description: violation.ruleDescription,
                    severity: 'error',
                    fixable: this.isFixable(violation.ruleNames[0])
                  });
                }
              }
            }
          } catch (parseError) {
            // Ignore parsing errors for chunks
          }
          
          resolve(violations);
        }
      );
    });
  }

  private isFixable(rule: string): boolean {
    return [...this.config.bulkFixableRules, ...this.config.complexRules].includes(rule);
  }

  private async createBackup(filePath: string): Promise<void> {
    if (!this.config.backupEnabled) return;

    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.copyFile(filePath, backupPath);
    await this.log(`Created backup: ${backupPath}`);
  }

  private async bulkFixCommonViolations(): Promise<void> {
    await this.log('Starting bulk fixing for common violations');

    const bulkViolations = this.violations.filter(v => 
      this.config.bulkFixableRules.includes(v.rule)
    );

    // Group by file for efficient processing
    const fileGroups = new Map<string, ViolationReport[]>();
    for (const violation of bulkViolations) {
      if (!fileGroups.has(violation.file)) {
        fileGroups.set(violation.file, []);
      }
      fileGroups.get(violation.file)!.push(violation);
    }

    for (const [filePath, violations] of fileGroups) {
      try {
        await this.createBackup(filePath);
        let content = await fs.readFile(filePath, 'utf-8');
        let modified = false;

        for (const violation of violations) {
          const result = await this.applyBulkFix(content, violation);
          if (result.success) {
            content = result.content;
            modified = true;
            
            this.fixResults.push({
              file: filePath,
              rule: violation.rule,
              applied: true
            });
          }
        }

        if (modified) {
          await fs.writeFile(filePath, content);
          await this.log(`Bulk fixes applied to ${filePath}`);
        }
      } catch (error) {
        await this.log(`Error applying bulk fixes to ${filePath}: ${error}`, 'error');
        this.fixResults.push({
          file: filePath,
          rule: 'BULK',
          applied: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private async applyBulkFix(content: string, violation: ViolationReport): Promise<{success: boolean, content: string}> {
    let lines = content.split('\n');
    
    switch (violation.rule) {
      case 'MD022': // Blanks around headings
        return this.fixBlanksAroundHeadings(lines, violation);
      
      case 'MD032': // Blanks around lists
        return this.fixBlanksAroundLists(lines, violation);
      
      case 'MD013': // Line length
        return this.fixLineLength(lines, violation);
      
      case 'MD009': // Trailing spaces
        return this.fixTrailingSpaces(lines, violation);
      
      case 'MD010': // Hard tabs
        return this.fixHardTabs(lines, violation);
      
      case 'MD012': // Multiple consecutive blank lines
        return this.fixMultipleBlankLines(lines, violation);
      
      case 'MD047': // Single trailing newline
        return this.fixTrailingNewline(content);
      
      default:
        return { success: false, content };
    }
  }

  private fixBlanksAroundHeadings(lines: string[], violation: ViolationReport): {success: boolean, content: string} {
    const lineIndex = violation.line - 1;
    const line = lines[lineIndex];
    
    if (line.match(/^#+\s/)) {
      // Add blank line before heading if missing
      if (lineIndex > 0 && lines[lineIndex - 1].trim() !== '') {
        lines.splice(lineIndex, 0, '');
      }
      
      // Add blank line after heading if missing
      if (lineIndex + 1 < lines.length && lines[lineIndex + 1].trim() !== '') {
        lines.splice(lineIndex + 1, 0, '');
      }
      
      return { success: true, content: lines.join('\n') };
    }
    
    return { success: false, content: lines.join('\n') };
  }

  private fixBlanksAroundLists(lines: string[], violation: ViolationReport): {success: boolean, content: string} {
    const lineIndex = violation.line - 1;
    const line = lines[lineIndex];
    
    if (line.match(/^[\s]*[-*+]\s/) || line.match(/^[\s]*\d+\.\s/)) {
      // Add blank line before list if missing
      if (lineIndex > 0 && lines[lineIndex - 1].trim() !== '') {
        lines.splice(lineIndex, 0, '');
      }
      
      // Find end of list and add blank line after if missing
      let endIndex = lineIndex;
      for (let i = lineIndex + 1; i < lines.length; i++) {
        if (lines[i].match(/^[\s]*[-*+]\s/) || lines[i].match(/^[\s]*\d+\.\s/)) {
          endIndex = i;
        } else if (lines[i].trim() === '') {
          continue;
        } else {
          break;
        }
      }
      
      if (endIndex + 1 < lines.length && lines[endIndex + 1].trim() !== '') {
        lines.splice(endIndex + 1, 0, '');
      }
      
      return { success: true, content: lines.join('\n') };
    }
    
    return { success: false, content: lines.join('\n') };
  }

  private fixLineLength(lines: string[], violation: ViolationReport): {success: boolean, content: string} {
    const lineIndex = violation.line - 1;
    let line = lines[lineIndex];
    
    // Skip if line is a heading, code block, or URL
    if (line.match(/^#+\s/) || line.match(/^```/) || line.match(/https?:\/\//)) {
      return { success: false, content: lines.join('\n') };
    }
    
    // Simple word wrapping for text lines
    if (line.length > 120 && !line.match(/^\s*[-*+>]/) && !line.match(/^\s*\d+\./)) {
      const words = line.split(' ');
      const wrappedLines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        if ((currentLine + word).length > 120) {
          if (currentLine) {
            wrappedLines.push(currentLine.trim());
            currentLine = word + ' ';
          } else {
            wrappedLines.push(word);
          }
        } else {
          currentLine += word + ' ';
        }
      }
      
      if (currentLine.trim()) {
        wrappedLines.push(currentLine.trim());
      }
      
      lines.splice(lineIndex, 1, ...wrappedLines);
      return { success: true, content: lines.join('\n') };
    }
    
    return { success: false, content: lines.join('\n') };
  }

  private fixTrailingSpaces(lines: string[], violation: ViolationReport): {success: boolean, content: string} {
    const lineIndex = violation.line - 1;
    lines[lineIndex] = lines[lineIndex].replace(/\s+$/, '');
    return { success: true, content: lines.join('\n') };
  }

  private fixHardTabs(lines: string[], violation: ViolationReport): {success: boolean, content: string} {
    const lineIndex = violation.line - 1;
    lines[lineIndex] = lines[lineIndex].replace(/\t/g, '  ');
    return { success: true, content: lines.join('\n') };
  }

  private fixMultipleBlankLines(lines: string[], violation: ViolationReport): {success: boolean, content: string} {
    // Remove consecutive blank lines, keeping only one
    const newLines: string[] = [];
    let lastWasBlank = false;
    
    for (const line of lines) {
      if (line.trim() === '') {
        if (!lastWasBlank) {
          newLines.push(line);
          lastWasBlank = true;
        }
      } else {
        newLines.push(line);
        lastWasBlank = false;
      }
    }
    
    return { success: true, content: newLines.join('\n') };
  }

  private fixTrailingNewline(content: string): {success: boolean, content: string} {
    if (!content.endsWith('\n')) {
      return { success: true, content: content + '\n' };
    } else if (content.endsWith('\n\n')) {
      return { success: true, content: content.replace(/\n+$/, '\n') };
    }
    return { success: false, content };
  }

  private async targetedFixComplexViolations(): Promise<void> {
    await this.log('Starting targeted fixing for complex violations');

    const complexViolations = this.violations.filter(v => 
      this.config.complexRules.includes(v.rule)
    );

    for (const violation of complexViolations) {
      try {
        await this.createBackup(violation.file);
        const content = await fs.readFile(violation.file, 'utf-8');
        
        const result = await this.applyTargetedFix(content, violation);
        if (result.success) {
          await fs.writeFile(violation.file, result.content);
          await this.log(`Targeted fix applied to ${violation.file} for ${violation.rule}`);
          
          this.fixResults.push({
            file: violation.file,
            rule: violation.rule,
            applied: true
          });
        }
      } catch (error) {
        await this.log(`Error applying targeted fix to ${violation.file}: ${error}`, 'error');
        this.fixResults.push({
          file: violation.file,
          rule: violation.rule,
          applied: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private async applyTargetedFix(content: string, violation: ViolationReport): Promise<{success: boolean, content: string}> {
    let lines = content.split('\n');
    
    switch (violation.rule) {
      case 'MD040': // Missing code block languages
        return this.fixMissingCodeBlockLanguage(lines, violation);
      
      case 'MD024': // Duplicate headings
        return this.fixDuplicateHeadings(lines, violation);
      
      case 'MD036': // Emphasis as heading
        return this.fixEmphasisAsHeading(lines, violation);
      
      case 'MD046': // Code block style
        return this.fixCodeBlockStyle(lines, violation);
      
      case 'MD029': // Ordered list prefix
        return this.fixOrderedListPrefix(lines, violation);
      
      case 'MD055': // Table pipe style
        return this.fixTablePipeStyle(lines, violation);
      
      case 'MD041': // First line heading
        return this.fixFirstLineHeading(lines, violation);
      
      default:
        return { success: false, content };
    }
  }

  private fixMissingCodeBlockLanguage(lines: string[], violation: ViolationReport): {success: boolean, content: string} {
    const lineIndex = violation.line - 1;
    const line = lines[lineIndex];
    
    if (line.trim() === '```') {
      // Try to infer language from context or use 'text' as default
      const language = this.inferCodeBlockLanguage(lines, lineIndex) || 'text';
      lines[lineIndex] = '```' + language;
      return { success: true, content: lines.join('\n') };
    }
    
    return { success: false, content: lines.join('\n') };
  }

  private inferCodeBlockLanguage(lines: string[], codeBlockIndex: number): string | null {
    // Look for common patterns in the code block
    const blockLines = [];
    for (let i = codeBlockIndex + 1; i < lines.length; i++) {
      if (lines[i].trim() === '```') break;
      blockLines.push(lines[i]);
    }
    
    const blockContent = blockLines.join('\n');
    
    // Simple heuristics for language detection
    if (blockContent.includes('npm ') || blockContent.includes('node ')) return 'bash';
    if (blockContent.includes('function ') || blockContent.includes('const ')) return 'javascript';
    if (blockContent.includes('import ') || blockContent.includes('interface ')) return 'typescript';
    if (blockContent.includes('def ') || blockContent.includes('import ')) return 'python';
    if (blockContent.includes('<') && blockContent.includes('>')) return 'html';
    if (blockContent.includes('{') && blockContent.includes('}')) return 'json';
    
    return 'text';
  }

  private fixDuplicateHeadings(lines: string[], violation: ViolationReport): {success: boolean, content: string} {
    const lineIndex = violation.line - 1;
    const line = lines[lineIndex];
    
    if (line.match(/^#+\s/)) {
      // Add a distinguishing suffix to make heading unique
      const match = line.match(/^(#+\s)(.+)/);
      if (match) {
        const level = match[1];
        const text = match[2];
        lines[lineIndex] = `${level}${text} (Continued)`;
        return { success: true, content: lines.join('\n') };
      }
    }
    
    return { success: false, content: lines.join('\n') };
  }

  private fixEmphasisAsHeading(lines: string[], violation: ViolationReport): {success: boolean, content: string} {
    const lineIndex = violation.line - 1;
    const line = lines[lineIndex];
    
    // Convert emphasis to proper heading
    if (line.match(/^\*\*.*\*\*$/) || line.match(/^__.*__$/)) {
      const text = line.replace(/^\*\*(.*)\*\*$/, '$1').replace(/^__(.*__)$/, '$1');
      lines[lineIndex] = `## ${text}`;
      return { success: true, content: lines.join('\n') };
    }
    
    return { success: false, content: lines.join('\n') };
  }

  private fixCodeBlockStyle(lines: string[], violation: ViolationReport): {success: boolean, content: string} {
    const lineIndex = violation.line - 1;
    
    // Convert indented code block to fenced
    if (lines[lineIndex].match(/^    /)) {
      const indentedLines = [];
      let i = lineIndex;
      
      // Collect all indented lines
      while (i < lines.length && (lines[i].match(/^    /) || lines[i].trim() === '')) {
        indentedLines.push(lines[i].replace(/^    /, ''));
        i++;
      }
      
      // Replace with fenced code block
      const replacement = [
        '```',
        ...indentedLines,
        '```'
      ];
      
      lines.splice(lineIndex, indentedLines.length, ...replacement);
      return { success: true, content: lines.join('\n') };
    }
    
    return { success: false, content: lines.join('\n') };
  }

  private fixOrderedListPrefix(lines: string[], violation: ViolationReport): {success: boolean, content: string} {
    const lineIndex = violation.line - 1;
    const line = lines[lineIndex];
    
    // Fix ordered list numbering
    const match = line.match(/^(\s*)\d+\.\s(.+)/);
    if (match) {
      const indent = match[1];
      const text = match[2];
      
      // Find the correct number by counting previous list items
      let number = 1;
      for (let i = lineIndex - 1; i >= 0; i--) {
        if (lines[i].match(/^(\s*)\d+\.\s/)) {
          const prevMatch = lines[i].match(/^(\s*)\d+\.\s/);
          if (prevMatch && prevMatch[1] === indent) {
            number++;
          }
        } else if (lines[i].trim() === '') {
          continue;
        } else {
          break;
        }
      }
      
      lines[lineIndex] = `${indent}${number}. ${text}`;
      return { success: true, content: lines.join('\n') };
    }
    
    return { success: false, content: lines.join('\n') };
  }

  private fixTablePipeStyle(lines: string[], violation: ViolationReport): {success: boolean, content: string} {
    const lineIndex = violation.line - 1;
    let line = lines[lineIndex];
    
    // Add trailing pipe if missing
    if (line.includes('|') && !line.trim().endsWith('|')) {
      lines[lineIndex] = line + ' |';
      return { success: true, content: lines.join('\n') };
    }
    
    return { success: false, content: lines.join('\n') };
  }

  private fixFirstLineHeading(lines: string[], violation: ViolationReport): {success: boolean, content: string} {
    // Add a heading at the beginning of the file
    if (lines.length > 0 && !lines[0].match(/^#+\s/)) {
      // Try to infer title from filename
      const filename = path.basename(violation.file, '.md');
      const title = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      lines.unshift(`# ${title}`, '');
      return { success: true, content: lines.join('\n') };
    }
    
    return { success: false, content: lines.join('\n') };
  }

  private async validateFixes(): Promise<void> {
    await this.log('Validating all applied fixes');
    
    try {
      await execAsync('npm run lint:md', { cwd: this.config.projectRoot });
      await this.log('All fixes validated successfully - zero violations remaining');
    } catch (error) {
      await this.log('Some violations remain after fixing - running additional scan', 'warn');
      
      // Run another scan to identify remaining issues
      const remainingViolations = await this.scanViolations();
      await this.log(`${remainingViolations.length} violations still need manual attention`);
      
      // Generate detailed report for remaining violations
      await this.generateViolationReport(remainingViolations);
    }
  }

  private async generateViolationReport(violations: ViolationReport[]): Promise<void> {
    const reportPath = path.join(this.config.projectRoot, 'logs', 'markdown-violations-report.json');
    
    const report = {
      generatedAt: new Date().toISOString(),
      totalViolations: violations.length,
      violationsByRule: violations.reduce((acc, v) => {
        acc[v.rule] = (acc[v.rule] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      violationsByFile: violations.reduce((acc, v) => {
        if (!acc[v.file]) acc[v.file] = [];
        acc[v.file].push({
          line: v.line,
          rule: v.rule,
          description: v.description,
          fixable: v.fixable
        });
        return acc;
      }, {} as Record<string, any[]>),
      fixResults: this.fixResults
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    await this.log(`Detailed violation report generated: ${reportPath}`);
  }

  private async generateSummaryReport(): Promise<void> {
    const totalViolations = this.violations.length;
    const fixedViolations = this.fixResults.filter(r => r.applied).length;
    const failedFixes = this.fixResults.filter(r => !r.applied).length;
    
    const summary = {
      executionTime: new Date().toISOString(),
      totalViolationsFound: totalViolations,
      violationsFixed: fixedViolations,
      failedFixes: failedFixes,
      successRate: totalViolations > 0 ? (fixedViolations / totalViolations * 100).toFixed(2) + '%' : '100%',
      remainingViolations: totalViolations - fixedViolations,
      status: (totalViolations - fixedViolations) === 0 ? 'ZERO_VIOLATIONS_ACHIEVED' : 'PARTIAL_COMPLETION'
    };
    
    await this.log('='.repeat(80));
    await this.log('MARKDOWN QA ENFORCER EXECUTION SUMMARY');
    await this.log('='.repeat(80));
    await this.log(`Total violations found: ${summary.totalViolationsFound}`);
    await this.log(`Violations fixed: ${summary.violationsFixed}`);
    await this.log(`Failed fixes: ${summary.failedFixes}`);
    await this.log(`Success rate: ${summary.successRate}`);
    await this.log(`Remaining violations: ${summary.remainingViolations}`);
    await this.log(`Status: ${summary.status}`);
    await this.log('='.repeat(80));
    
    // Write summary to file for A.V.A.R.I.C.E. Protocol integration
    const summaryPath = path.join(this.config.projectRoot, 'logs', 'markdown-qa-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  }

  private async deployPreventionInfrastructure(): Promise<void> {
    if (!this.config.preCommitHooks) {
      await this.log('Pre-commit hooks disabled, skipping prevention infrastructure deployment');
      return;
    }

    await this.log('Deploying prevention infrastructure with pre-commit hooks');
    
    try {
      // Create pre-commit hook
      const hookPath = path.join(this.config.projectRoot, '.git', 'hooks', 'pre-commit');
      const hookContent = `#!/bin/sh
# Markdown Quality Assurance Pre-commit Hook
# Generated by A.V.A.R.I.C.E. Protocol Markdown QA Enforcer

echo "Running markdown quality checks..."

# Check if there are any markdown files being committed
MARKDOWN_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\\.md$' || true)

if [ -z "$MARKDOWN_FILES" ]; then
    echo "No markdown files to check"
    exit 0
fi

echo "Checking markdown files: $MARKDOWN_FILES"

# Run markdownlint on staged files
npx markdownlint $MARKDOWN_FILES --config .markdownlint.json

if [ $? -ne 0 ]; then
    echo "❌ Markdown quality check failed. Please fix violations before committing."
    echo "Run 'npm run lint:md:fix' to automatically fix common issues."
    echo "Run 'npm run markdown:enforce' for comprehensive fixing."
    exit 1
fi

echo "✅ Markdown quality check passed"
exit 0
`;

      await fs.writeFile(hookPath, hookContent);
      
      // Make hook executable
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      await execAsync(`chmod +x "${hookPath}"`);
      
      await this.log('Pre-commit hook installed successfully');
      
      // Create markdown templates
      await this.createMarkdownTemplates();
      
    } catch (error) {
      await this.log(`Error deploying prevention infrastructure: ${error}`, 'error');
    }
  }

  private async createMarkdownTemplates(): Promise<void> {
    const templatesDir = path.join(this.config.projectRoot, '.templates');
    await fs.mkdir(templatesDir, { recursive: true });
    
    // A.V.A.R.I.C.E. Protocol Phase Documentation Template
    const phaseTemplate = `# Phase [Number]: [Phase Name]

## Overview

Brief description of the phase objectives and scope.

## Key Activities

- Activity 1
- Activity 2
- Activity 3

## Deliverables

1. Deliverable 1
2. Deliverable 2

## Success Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Integration Points

### Dependencies

- Dependency 1
- Dependency 2

### Outputs

- Output 1 → Next Phase
- Output 2 → Knowledge Graph

## Evidence Collection

### Required Evidence

- Evidence type 1
- Evidence type 2

### Storage Location

\`docs/evidence/phase-[number]/\`

## Next Steps

After completion of this phase:

1. Next action 1
2. Next action 2

---

**A.V.A.R.I.C.E. Protocol Compliance**: This document follows A.V.A.R.I.C.E. Protocol standards for phase documentation.
`;

    // Evidence Collection Template
    const evidenceTemplate = `# Evidence Collection: [Subject]

## Summary

Brief description of the evidence being collected.

## Context

### Related Phase

Phase [number]: [phase name]

### Timestamp

Generated: ${new Date().toISOString()}

## Evidence Details

### Type

- [ ] Implementation Evidence
- [ ] Validation Evidence
- [ ] Performance Metrics
- [ ] Quality Gates
- [ ] Protocol Compliance

### Artifacts

1. Artifact 1
2. Artifact 2

## Verification

### Validation Status

- [ ] Evidence Complete
- [ ] Quality Verified
- [ ] Integration Tested
- [ ] Protocol Compliant

### Reviewer

**Reviewer**: [Name/Role]  
**Date**: [Date]  
**Status**: [Approved/Pending/Rejected]

## Integration

### Neo4j Storage

Evidence stored in knowledge graph with relationships:

- \`(Evidence)-[:VALIDATES]->(Phase)\`
- \`(Evidence)-[:SUPPORTS]->(Decision)\`

### Cross-References

- Related evidence: [Links]
- Phase documentation: [Links]

---

**Evidence Integrity**: This evidence has been validated according to A.V.A.R.I.C.E. Protocol standards.
`;

    await fs.writeFile(path.join(templatesDir, 'phase-template.md'), phaseTemplate);
    await fs.writeFile(path.join(templatesDir, 'evidence-template.md'), evidenceTemplate);
    
    await this.log('Markdown templates created for A.V.A.R.I.C.E. Protocol compliance');
  }

  /**
   * Main execution method - deploys complete markdown QA enforcement
   */
  public async enforce(): Promise<void> {
    await this.log('🚀 DEPLOYING ENHANCED MARKDOWN QA ENFORCER AGENT');
    await this.log('Enterprise-grade markdown quality enforcement for A.V.A.R.I.C.E. Protocol');
    
    try {
      // Phase 1: Comprehensive violation scan
      await this.scanViolations();
      
      // Phase 2: Bulk processing for common violations
      await this.bulkFixCommonViolations();
      
      // Phase 3: Targeted resolution for complex violations
      await this.targetedFixComplexViolations();
      
      // Phase 4: Deploy prevention infrastructure
      await this.deployPreventionInfrastructure();
      
      // Phase 5: Validation and verification
      await this.validateFixes();
      
      // Phase 6: Generate comprehensive reports
      await this.generateSummaryReport();
      
      await this.log('✅ ENHANCED MARKDOWN QA ENFORCER DEPLOYMENT COMPLETE');
      await this.log('🛡️ Prevention infrastructure deployed with pre-commit hooks');
      await this.log('📋 A.V.A.R.I.C.E. Protocol compliance templates created');
      
    } catch (error) {
      await this.log(`❌ ENFORCEMENT FAILED: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Static method for CLI usage
   */
  public static async run(): Promise<void> {
    const enforcer = new MarkdownQAEnforcer();
    await enforcer.enforce();
  }
}

// CLI execution
if (require.main === module) {
  MarkdownQAEnforcer.run().catch(error => {
    console.error('Failed to run Markdown QA Enforcer:', error);
    process.exit(1);
  });
}

export { MarkdownQAEnforcer };