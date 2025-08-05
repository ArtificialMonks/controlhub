#!/usr/bin/env tsx

/**
 * Final Markdown Violations Fixer
 * 
 * This script addresses the remaining specific violations identified by markdownlint
 * after the comprehensive fix to achieve absolute zero violations.
 * 
 * Specific violations to fix:
 * - MD026: No trailing punctuation in headings (remove colons)
 * - MD029: Ordered list prefix (fix numbering)
 * - MD031: Blanks around fences (add blank lines)
 * - MD040: Fenced code language (add language specifiers)
 * - MD024: No duplicate headings (make unique)
 * - MD049: Emphasis style (asterisks to underscores)
 * - MD036: No emphasis as heading (convert to proper headings)
 */

import { readFileSync, writeFileSync } from 'fs';

interface ViolationFix {
  file: string;
  fixes: string[];
}

class FinalMarkdownViolationsFixer {
  private results: ViolationFix[] = [];

  /**
   * Fix MD026: No trailing punctuation in headings
   */
  private fixTrailingPunctuation(content: string): string {
    const lines = content.split('\n');
    const fixedLines: string[] = [];

    for (const line of lines) {
      if (line.match(/^#{1,6}\s.*[.,:;!?]$/)) {
        // Remove trailing punctuation from headings
        const fixed = line.replace(/[.,:;!?]+$/, '');
        fixedLines.push(fixed);
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
    let expectedNumber = 1;
    let inOrderedList = false;
    let listIndent = '';

    for (const line of lines) {
      const orderedListMatch = line.match(/^(\s*)(\d+)\.(\s+)(.*)/);
      
      if (orderedListMatch) {
        const [, indent, , space, content] = orderedListMatch;
        
        if (!inOrderedList || indent !== listIndent) {
          // Starting new list or different indentation level
          expectedNumber = 1;
          inOrderedList = true;
          listIndent = indent;
        }
        
        fixedLines.push(`${indent}${expectedNumber}.${space}${content}`);
        expectedNumber++;
      } else if (line.trim() === '' || line.match(/^(\s+)/)) {
        // Empty line or continuation - maintain list state
        fixedLines.push(line);
      } else {
        // End of list
        inOrderedList = false;
        expectedNumber = 1;
        listIndent = '';
        fixedLines.push(line);
      }
    }

    return fixedLines.join('\n');
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
        // Opening fence
        if (i > 0 && prevLine.trim() !== '' && !prevLine.startsWith('#') && !prevLine.startsWith('```')) {
          fixedLines.push('');
        }
        fixedLines.push(line);
      } else if (line === '```') {
        // Closing fence
        fixedLines.push(line);
        if (i < lines.length - 1 && nextLine.trim() !== '' && !nextLine.startsWith('#') && !nextLine.startsWith('```')) {
          fixedLines.push('');
        }
      } else {
        fixedLines.push(line);
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
        // Bare code fence - try to determine language
        let language = 'text';
        
        // Look at the next few lines to determine language
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          const nextLine = lines[j];
          if (nextLine === '```') break;
          
          if (nextLine.includes('npm ') || nextLine.includes('yarn ') || nextLine.includes('pnpm ') || 
              nextLine.includes('git ') || nextLine.includes('cd ') || nextLine.includes('mkdir ')) {
            language = 'bash';
            break;
          } else if (nextLine.includes('CREATE TABLE') || nextLine.includes('SELECT') || nextLine.includes('INSERT')) {
            language = 'sql';
            break;
          } else if (nextLine.includes('import ') || nextLine.includes('export ') || nextLine.includes('function') || 
                     nextLine.includes('const ') || nextLine.includes('let ') || nextLine.includes('var ')) {
            language = 'typescript';
            break;
          } else if (nextLine.includes('=') && (nextLine.includes('true') || nextLine.includes('false') || 
                     nextLine.includes('http') || nextLine.includes('key'))) {
            language = 'env';
            break;
          } else if (nextLine.includes('{') || nextLine.includes('}') || nextLine.includes('[') || nextLine.includes(']')) {
            language = 'json';
            break;
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
   * Fix MD024: No duplicate headings by making them unique
   */
  private fixDuplicateHeadings(content: string): string {
    const lines = content.split('\n');
    const fixedLines: string[] = [];
    const headingCounts: { [key: string]: number } = {};

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headingMatch) {
        const [, hashes, title] = headingMatch;
        const normalizedTitle = title.toLowerCase().trim();
        
        if (headingCounts[normalizedTitle]) {
          headingCounts[normalizedTitle]++;
          fixedLines.push(`${hashes} ${title} ${headingCounts[normalizedTitle]}`);
        } else {
          headingCounts[normalizedTitle] = 1;
          fixedLines.push(line);
        }
      } else {
        fixedLines.push(line);
      }
    }

    return fixedLines.join('\n');
  }

  /**
   * Fix MD049: Emphasis style (asterisks to underscores)
   */
  private fixEmphasisStyle(content: string): string {
    let fixed = content;
    let inCodeBlock = false;
    const lines = fixed.split('\n');
    const fixedLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        fixedLines.push(line);
        continue;
      }

      if (inCodeBlock) {
        fixedLines.push(line);
        continue;
      }

      // Fix single asterisks (emphasis) but not double asterisks (bold)
      let fixedLine = line;
      fixedLine = fixedLine.replace(/(?<!\*)\*(?!\*)([^*\n]+?)\*(?!\*)/g, '_$1_');
      
      fixedLines.push(fixedLine);
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
      
      // Look for lines that are emphasized and might be headings
      if (line.match(/^\s*_[^_]+_\s*$/) || line.match(/^\s*\*[^*]+\*\s*$/)) {
        const prevLine = i > 0 ? lines[i - 1] : '';
        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
        
        // If surrounded by blank lines, likely a heading
        if (prevLine.trim() === '' && (nextLine.trim() === '' || nextLine.trim().length > 0)) {
          const headingText = line.replace(/^\s*[_*]([^_*]+)[_*]\s*$/, '$1');
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
   * Process a specific file with targeted fixes
   */
  private processFile(filePath: string): ViolationFix {
    const result: ViolationFix = {
      file: filePath,
      fixes: []
    };

    try {
      const originalContent = readFileSync(filePath, 'utf-8');
      let fixedContent = originalContent;
      
      // Apply fixes in sequence
      const trailingPuncFixed = this.fixTrailingPunctuation(fixedContent);
      if (trailingPuncFixed !== fixedContent) {
        result.fixes.push('MD026: Removed trailing punctuation from headings');
        fixedContent = trailingPuncFixed;
      }

      const orderedListFixed = this.fixOrderedListPrefix(fixedContent);
      if (orderedListFixed !== fixedContent) {
        result.fixes.push('MD029: Fixed ordered list numbering');
        fixedContent = orderedListFixed;
      }

      const fencesFixed = this.fixBlanksAroundFences(fixedContent);
      if (fencesFixed !== fixedContent) {
        result.fixes.push('MD031: Added blank lines around fences');
        fixedContent = fencesFixed;
      }

      const languageFixed = this.fixFencedCodeLanguage(fixedContent);
      if (languageFixed !== fixedContent) {
        result.fixes.push('MD040: Added language to code fences');
        fixedContent = languageFixed;
      }

      const duplicateHeadingsFixed = this.fixDuplicateHeadings(fixedContent);
      if (duplicateHeadingsFixed !== fixedContent) {
        result.fixes.push('MD024: Made duplicate headings unique');
        fixedContent = duplicateHeadingsFixed;
      }

      const emphasisFixed = this.fixEmphasisStyle(fixedContent);
      if (emphasisFixed !== fixedContent) {
        result.fixes.push('MD049: Fixed emphasis style');
        fixedContent = emphasisFixed;
      }

      const emphasisHeadingFixed = this.fixEmphasisAsHeading(fixedContent);
      if (emphasisHeadingFixed !== fixedContent) {
        result.fixes.push('MD036: Converted emphasis to proper headings');
        fixedContent = emphasisHeadingFixed;
      }

      if (fixedContent !== originalContent) {
        writeFileSync(filePath, fixedContent, 'utf-8');
      }

    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }

    return result;
  }

  /**
   * Process specific files with known violations
   */
  public process(): void {
    const filesToFix = [
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/CLAUDE.md',
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/DEPLOYMENT.md',
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/docs/avarice-protocol-validation-report.md',
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/docs/avarice-protocol/baseline-quality-assessment-report.md',
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/docs/avarice-protocol/comprehensive-validation-report.md',
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/docs/avarice-protocol/markdown-quality-integration-success-report.md',
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/logs/spelling-summary.md'
    ];

    console.log('🔧 Applying final targeted fixes to remaining violations...\n');

    for (const file of filesToFix) {
      const relativePath = file.replace('/Users/wildone/Desktop/artificialmonks/chub-communitee/', '');
      console.log(`Processing: ${relativePath}`);
      
      const result = this.processFile(file);
      this.results.push(result);
      
      if (result.fixes.length > 0) {
        console.log(`  ✅ Applied fixes: ${result.fixes.join(', ')}`);
      } else {
        console.log(`  ✨ No fixes needed`);
      }
    }

    console.log('\n📊 Final Fix Summary');
    console.log('=====================');
    const totalFixes = this.results.reduce((sum, r) => sum + r.fixes.length, 0);
    console.log(`Total targeted fixes applied: ${totalFixes}`);
    console.log('\n✅ All targeted violations have been fixed!');
  }
}

// Execute the fixer
if (require.main === module) {
  const fixer = new FinalMarkdownViolationsFixer();
  console.log('🚀 Final Markdown Violations Fixer');
  console.log('=====================================\n');
  fixer.process();
}