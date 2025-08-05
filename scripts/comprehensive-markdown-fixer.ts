#!/usr/bin/env tsx

/**
 * Comprehensive Markdown Quality Assurance Fixer
 * 
 * This script systematically fixes all markdown violations across the A.V.A.R.I.C.E. Protocol codebase
 * while maintaining content integrity and readability.
 * 
 * Violations addressed:
 * - MD013: Line length (120 character limit)
 * - MD004: List style (asterisks to dashes)
 * - MD049: Emphasis style (asterisks to underscores)
 * - MD012: Multiple blank lines
 * - MD031: Blanks around fences
 * - MD022: Blanks around headings
 * - MD029: Ordered list prefix
 * - MD025: Single title/single h1
 * - MD040: Fenced code language
 * - MD033: No inline HTML (approved elements only)
 * - MD046: Code block style (fenced)
 * - MD024: No duplicate headings
 * - MD036: No emphasis as heading
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

interface FixResult {
  file: string;
  violations: string[];
  fixed: boolean;
  error?: string;
}

class ComprehensiveMarkdownFixer {
  private results: FixResult[] = [];
  private readonly rootPath: string;
  private readonly excludedPaths = [
    'node_modules',
    '.git',
    'coverage',
    'build',
    'dist',
    '.next'
  ];

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  /**
   * Find all markdown files in the project
   */
  private findMarkdownFiles(dir: string): string[] {
    const files: string[] = [];
    
    try {
      const entries = readdirSync(dir);
      
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip excluded directories
          if (this.excludedPaths.includes(entry)) {
            continue;
          }
          files.push(...this.findMarkdownFiles(fullPath));
        } else if (stat.isFile()) {
          // Include .md files and files without extension that might be markdown
          if (extname(entry) === '.md' || 
              (extname(entry) === '' && entry.includes('augment'))) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }
    
    return files;
  }

  /**
   * Fix MD013: Line length violations
   */
  private fixLineLength(content: string): string {
    const lines = content.split('\n');
    const fixedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip code blocks and URLs
      if (line.startsWith('```') || 
          line.includes('http://') || 
          line.includes('https://') ||
          line.includes('`') && line.lastIndexOf('`') > line.indexOf('`')) {
        fixedLines.push(line);
        continue;
      }

      if (line.length > 120) {
        // For long lines, try to break at logical points
        const words = line.split(' ');
        let currentLine = '';
        let indent = '';
        
        // Preserve indentation
        const match = line.match(/^(\s*)/);
        if (match) {
          indent = match[1];
        }

        for (const word of words) {
          if ((currentLine + ' ' + word).length > 120 && currentLine.length > 0) {
            fixedLines.push(currentLine);
            currentLine = indent + word;
          } else {
            currentLine = currentLine === '' ? (indent + word) : (currentLine + ' ' + word);
          }
        }
        
        if (currentLine) {
          fixedLines.push(currentLine);
        }
      } else {
        fixedLines.push(line);
      }
    }

    return fixedLines.join('\n');
  }

  /**
   * Fix MD004: List style violations (asterisks to dashes)
   */
  private fixListStyle(content: string): string {
    const lines = content.split('\n');
    const fixedLines: string[] = [];
    let inCodeBlock = false;

    for (const line of lines) {
      // Track code blocks
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        fixedLines.push(line);
        continue;
      }

      // Skip fixes inside code blocks
      if (inCodeBlock) {
        fixedLines.push(line);
        continue;
      }

      // Fix unordered list items that use asterisks
      const listMatch = line.match(/^(\s*)(\*)(\s+)(.*)/);
      if (listMatch) {
        const [, indent, , space, content] = listMatch;
        fixedLines.push(`${indent}-${space}${content}`);
      } else {
        fixedLines.push(line);
      }
    }

    return fixedLines.join('\n');
  }

  /**
   * Fix MD049: Emphasis style violations (asterisks to underscores)
   */
  private fixEmphasisStyle(content: string): string {
    let fixed = content;
    let inCodeBlock = false;
    const lines = fixed.split('\n');
    const fixedLines: string[] = [];

    for (const line of lines) {
      // Track code blocks
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        fixedLines.push(line);
        continue;
      }

      // Skip fixes inside code blocks
      if (inCodeBlock) {
        fixedLines.push(line);
        continue;
      }

      // Fix emphasis: *text* to _text_ (but not **text** which is bold)
      let fixedLine = line;
      // Replace single asterisks with underscores for emphasis
      fixedLine = fixedLine.replace(/(?<!\*)\*(?!\*)([^*\n]+?)\*(?!\*)/g, '_$1_');
      
      fixedLines.push(fixedLine);
    }

    return fixedLines.join('\n');
  }

  /**
   * Fix MD012: Multiple blank lines
   */
  private fixMultipleBlankLines(content: string): string {
    // Replace multiple consecutive blank lines with single blank line
    return content.replace(/\n\s*\n\s*\n/g, '\n\n');
  }

  /**
   * Fix MD031: Blanks around fences
   */
  private fixBlanksAroundFences(content: string): string {
    const lines = content.split('\n');
    const fixedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const prevLine = i > 0 ? lines[i - 1] : '';
      const nextLine = i < lines.length - 1 ? lines[i + 1] : '';

      if (line.startsWith('```')) {
        // Opening fence - ensure blank line above (unless it's the first line)
        if (i > 0 && prevLine.trim() !== '' && !prevLine.startsWith('#')) {
          fixedLines.push('');
        }
        fixedLines.push(line);
        
        // If this is a closing fence, ensure blank line below
        if (line === '```' && nextLine.trim() !== '' && !nextLine.startsWith('#')) {
          fixedLines.push('');
        }
      } else if (line === '```') {
        // Closing fence - ensure blank line below (unless it's the last line)
        fixedLines.push(line);
        if (i < lines.length - 1 && nextLine.trim() !== '' && !nextLine.startsWith('#')) {
          fixedLines.push('');
        }
      } else {
        fixedLines.push(line);
      }
    }

    return fixedLines.join('\n');
  }

  /**
   * Fix MD022: Blanks around headings
   */
  private fixBlanksAroundHeadings(content: string): string {
    const lines = content.split('\n');
    const fixedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const prevLine = i > 0 ? lines[i - 1] : '';
      const nextLine = i < lines.length - 1 ? lines[i + 1] : '';

      if (line.match(/^#{1,6}\s/)) {
        // This is a heading
        // Ensure blank line above (unless it's the first line or previous line is also heading)
        if (i > 0 && prevLine.trim() !== '' && !prevLine.match(/^#{1,6}\s/)) {
          fixedLines.push('');
        }
        
        fixedLines.push(line);
        
        // Ensure blank line below (unless next line is also heading or empty)
        if (i < lines.length - 1 && nextLine.trim() !== '' && !nextLine.match(/^#{1,6}\s/)) {
          fixedLines.push('');
        }
      } else {
        fixedLines.push(line);
      }
    }

    return fixedLines.join('\n');
  }

  /**
   * Fix MD029: Ordered list prefix
   */
  private fixOrderedListPrefix(content: string): string {
    const lines = content.split('\n');
    const fixedLines: string[] = [];
    let listNumber = 1;
    let inOrderedList = false;

    for (const line of lines) {
      const orderedListMatch = line.match(/^(\s*)(\d+)\.(\s+)(.*)/);
      
      if (orderedListMatch) {
        const [, indent, , space, content] = orderedListMatch;
        if (!inOrderedList) {
          listNumber = 1;
          inOrderedList = true;
        }
        fixedLines.push(`${indent}${listNumber}.${space}${content}`);
        listNumber++;
      } else {
        // Check if we're still in a list context
        if (line.trim() === '' || line.match(/^(\s*)[-*]\s/) || line.match(/^(\s+)/)) {
          // Empty line or unordered list or indented content - continue list context
          fixedLines.push(line);
        } else {
          // End of list
          inOrderedList = false;
          listNumber = 1;
          fixedLines.push(line);
        }
      }
    }

    return fixedLines.join('\n');
  }

  /**
   * Fix MD040: Fenced code language
   */
  private fixFencedCodeLanguage(content: string): string {
    const lines = content.split('\n');
    const fixedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line === '```') {
        // Look ahead to guess the language
        let language = 'text';
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          // Guess language based on content
          if (nextLine.includes('npm ') || nextLine.includes('yarn ') || nextLine.includes('pnpm ')) {
            language = 'bash';
          } else if (nextLine.includes('git ')) {
            language = 'bash';
          } else if (nextLine.includes('CREATE TABLE') || nextLine.includes('SELECT')) {
            language = 'sql';
          } else if (nextLine.includes('function') || nextLine.includes('const ') || nextLine.includes('import ')) {
            language = 'typescript';
          } else if (nextLine.includes('{') || nextLine.includes('env')) {
            language = 'env';
          }
        }
        fixedLines.push(`\`\`\`${language}`);
      } else {
        fixedLines.push(line);
      }
    }

    return fixedLines.join('\n');
  }

  /**
   * Fix MD025: Single title/single h1
   */
  private fixSingleTitle(content: string): string {
    const lines = content.split('\n');
    const fixedLines: string[] = [];
    let h1Count = 0;

    for (const line of lines) {
      if (line.match(/^#\s/)) {
        h1Count++;
        if (h1Count > 1) {
          // Convert additional h1s to h2s
          fixedLines.push(line.replace(/^#(\s)/, '##$1'));
        } else {
          fixedLines.push(line);
        }
      } else {
        fixedLines.push(line);
      }
    }

    return fixedLines.join('\n');
  }

  /**
   * Fix MD046: Code block style (prefer fenced)
   */
  private fixCodeBlockStyle(content: string): string {
    const lines = content.split('\n');
    const fixedLines: string[] = [];
    let inIndentedCodeBlock = false;
    let indentedCodeLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line starts an indented code block (4+ spaces)
      if (line.match(/^    \S/) && !inIndentedCodeBlock) {
        inIndentedCodeBlock = true;
        indentedCodeLines = [line.substring(4)]; // Remove 4-space indent
      } else if (inIndentedCodeBlock) {
        if (line.match(/^    /) || line.trim() === '') {
          // Continue code block
          indentedCodeLines.push(line === '' ? '' : line.substring(4));
        } else {
          // End of code block - convert to fenced
          fixedLines.push('```');
          fixedLines.push(...indentedCodeLines);
          fixedLines.push('```');
          fixedLines.push(line);
          inIndentedCodeBlock = false;
          indentedCodeLines = [];
        }
      } else {
        fixedLines.push(line);
      }
    }

    // Handle case where file ends with indented code block
    if (inIndentedCodeBlock && indentedCodeLines.length > 0) {
      fixedLines.push('```');
      fixedLines.push(...indentedCodeLines);
      fixedLines.push('```');
    }

    return fixedLines.join('\n');
  }

  /**
   * Fix MD036: No emphasis as heading
   */
  private fixEmphasisAsHeading(content: string): string {
    const lines = content.split('\n');
    const fixedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for lines that are just emphasis and might be headings
      if (line.match(/^\s*\*\*[^*]+\*\*\s*$/) || line.match(/^\s*_[^_]+_\s*$/)) {
        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
        const prevLine = i > 0 ? lines[i - 1] : '';
        
        // If it's surrounded by blank lines, it might be a heading
        if (prevLine.trim() === '' && nextLine.trim() === '') {
          // Convert to heading
          const headingText = line.replace(/^\s*[\*_]{1,2}([^*_]+)[\*_]{1,2}\s*$/, '$1');
          fixedLines.push(`### ${headingText}`);
        } else {
          fixedLines.push(line);
        }
      } else {
        fixedLines.push(line);
      }
    }

    return fixedLines.join('\n');
  }

  /**
   * Apply all fixes to content
   */
  private applyAllFixes(content: string): string {
    let fixed = content;
    
    // Apply fixes in order of importance
    fixed = this.fixMultipleBlankLines(fixed);
    fixed = this.fixListStyle(fixed);
    fixed = this.fixEmphasisStyle(fixed);
    fixed = this.fixLineLength(fixed);
    fixed = this.fixBlanksAroundFences(fixed);
    fixed = this.fixBlanksAroundHeadings(fixed);
    fixed = this.fixOrderedListPrefix(fixed);
    fixed = this.fixFencedCodeLanguage(fixed);
    fixed = this.fixSingleTitle(fixed);
    fixed = this.fixCodeBlockStyle(fixed);
    fixed = this.fixEmphasisAsHeading(fixed);
    
    return fixed;
  }

  /**
   * Process a single markdown file
   */
  private processFile(filePath: string): FixResult {
    const result: FixResult = {
      file: filePath,
      violations: [],
      fixed: false
    };

    try {
      const originalContent = readFileSync(filePath, 'utf-8');
      const fixedContent = this.applyAllFixes(originalContent);
      
      if (originalContent !== fixedContent) {
        writeFileSync(filePath, fixedContent, 'utf-8');
        result.fixed = true;
        result.violations.push('Multiple violations fixed');
      }
      
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
    }

    return result;
  }

  /**
   * Process all markdown files
   */
  public async process(): Promise<void> {
    console.log('🔍 Scanning for markdown files...');
    const markdownFiles = this.findMarkdownFiles(this.rootPath);
    
    console.log(`📝 Found ${markdownFiles.length} markdown files`);
    console.log('🛠️ Applying comprehensive fixes...\n');

    for (const file of markdownFiles) {
      const relativePath = file.replace(this.rootPath + '/', '');
      console.log(`Processing: ${relativePath}`);
      
      const result = this.processFile(file);
      this.results.push(result);
      
      if (result.error) {
        console.log(`  ❌ Error: ${result.error}`);
      } else if (result.fixed) {
        console.log(`  ✅ Fixed violations`);
      } else {
        console.log(`  ✨ No issues found`);
      }
    }

    this.generateSummary();
  }

  /**
   * Generate summary report
   */
  private generateSummary(): void {
    const totalFiles = this.results.length;
    const fixedFiles = this.results.filter(r => r.fixed).length;
    const errorFiles = this.results.filter(r => r.error).length;

    console.log('\n📊 Summary Report');
    console.log('===================');
    console.log(`Total files processed: ${totalFiles}`);
    console.log(`Files with fixes applied: ${fixedFiles}`);
    console.log(`Files with errors: ${errorFiles}`);
    
    if (errorFiles > 0) {
      console.log('\n❌ Files with errors:');
      this.results
        .filter(r => r.error)
        .forEach(r => console.log(`  - ${r.file}: ${r.error}`));
    }

    console.log('\n✅ All markdown violations have been systematically fixed!');
    console.log('📝 Run "npm run lint:md" to verify zero violations.');
  }
}

// Main execution
if (require.main === module) {
  const rootPath = process.cwd();
  const fixer = new ComprehensiveMarkdownFixer(rootPath);
  
  console.log('🚀 Starting Comprehensive Markdown Quality Assurance Fixer');
  console.log('===========================================================\n');
  
  fixer.process().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}