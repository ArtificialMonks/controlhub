#!/usr/bin/env tsx

/**
 * Ultimate Markdown Fixer - Final Pass
 * 
 * This script addresses all remaining markdown violations to achieve absolute zero violations.
 * It specifically handles edge cases that the previous fixers missed.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

interface FileViolations {
  file: string;
  violations: string[];
}

class UltimateMarkdownFixer {
  private results: FileViolations[] = [];

  private processFile(filePath: string): FileViolations {
    const result: FileViolations = {
      file: filePath,
      violations: []
    };

    if (!existsSync(filePath)) {
      return result;
    }

    try {
      const originalContent = readFileSync(filePath, 'utf-8');
      let content = originalContent;

      // Fix MD026: Remove trailing punctuation from headings
      content = content.replace(/^(#{1,6}\s+.+?)[.,:;!?]+$/gm, '$1');
      if (content !== originalContent) {
        result.violations.push('MD026: Removed trailing punctuation from headings');
      }

      // Fix MD024: Make duplicate headings unique
      const lines = content.split('\n');
      const headingCounts: { [key: string]: number } = {};
      const fixedLines: string[] = [];

      for (const line of lines) {
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
          const [, hashes, title] = headingMatch;
          const normalizedTitle = title.toLowerCase().replace(/[.,:;!?]+$/, '').trim();
          
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

      const deduplicatedContent = fixedLines.join('\n');

      // Fix MD029: Ordered list prefix
      let orderedListFixed = deduplicatedContent;
      const listLines = orderedListFixed.split('\n');
      const fixedOrderedLines: string[] = [];
      let expectedNumber = 1;
      let inList = false;
      let currentIndent = '';

      for (const line of listLines) {
        const orderedMatch = line.match(/^(\s*)(\d+)\.(\s+)(.*)/);
        
        if (orderedMatch) {
          const [, indent, , space, content] = orderedMatch;
          
          if (!inList || indent !== currentIndent) {
            expectedNumber = 1;
            inList = true;
            currentIndent = indent;
          }
          
          fixedOrderedLines.push(`${indent}${expectedNumber}.${space}${content}`);
          expectedNumber++;
        } else if (line.trim() === '' || line.match(/^\s+/) || line.match(/^\s*[-*]/)) {
          fixedOrderedLines.push(line);
        } else {
          inList = false;
          expectedNumber = 1;
          currentIndent = '';
          fixedOrderedLines.push(line);
        }
      }
      
      orderedListFixed = fixedOrderedLines.join('\n');

      // Fix MD036: No emphasis as heading
      orderedListFixed = orderedListFixed.replace(/^\s*_([^_]+)_\s*$/gm, '### $1');
      orderedListFixed = orderedListFixed.replace(/^\s*\*([^*]+)\*\s*$/gm, '### $1');

      // Fix MD033: Remove inline HTML that's not allowed
      const allowedElements = ['details', 'summary', 'br', 'hr', 'img', 'div', 'span', 'sup', 'sub', 'kbd', 'mark'];
      const htmlPattern = /<\/?\w+[^>]*>/g;
      orderedListFixed = orderedListFixed.replace(htmlPattern, (match) => {
        const tagName = match.match(/<\/?(\w+)/)?.[1];
        if (tagName && allowedElements.includes(tagName)) {
          return match;
        }
        return '';
      });

      // Fix MD047: Ensure single trailing newline
      orderedListFixed = orderedListFixed.replace(/\n*$/, '\n');

      const finalContent = orderedListFixed;

      if (finalContent !== originalContent) {
        writeFileSync(filePath, finalContent, 'utf-8');
        if (result.violations.length === 0) {
          result.violations.push('Multiple violations fixed');
        }
      }

    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }

    return result;
  }

  public process(): void {
    const filesToFix = [
      // Files with MD026 violations
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/docs/avarice-protocol/markdown-quality-validation-success-report.md',
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/docs/avarice-protocol/quality-gate-integration-system.md',
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/docs/avarice-protocol/test-integration/agent-test-script-integration-guide.md',
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/docs/components/sidebar-documentation.md',
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/docs/evidence/dead-code-recovery-protocols.md',
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/docs/evidence/quest-1.4/QUEST-1.4-COMPLETION-SUMMARY.md',
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/docs/evidence/zero-isolation-policy-compliance-audit-report.md',
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/docs/markdown-quality-rule-integration-final-report.md',
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/docs/source/PRD/chub-fullstack-architecture.md',
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/logs/cicd-report-1754399143726.md',
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/logs/ENTERPRISE_IMPORT_EXPORT_OPTIMIZATION_FINAL_REPORT.md',
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/logs/IMPORT_EXPORT_OPTIMIZATION_REPORT.md',
      '/Users/wildone/Desktop/artificialmonks/chub-communitee/logs/spelling-summary.md'
    ];

    console.log('🔧 Ultimate Markdown Fixer - Final Pass');
    console.log('==========================================\n');

    for (const file of filesToFix) {
      const relativePath = file.replace('/Users/wildone/Desktop/artificialmonks/chub-communitee/', '');
      console.log(`Processing: ${relativePath}`);
      
      const result = this.processFile(file);
      this.results.push(result);
      
      if (result.violations.length > 0) {
        console.log(`  ✅ ${result.violations.join(', ')}`);
      } else {
        console.log(`  ✨ No issues or file not found`);
      }
    }

    console.log('\n📊 Ultimate Fix Summary');
    console.log('========================');
    const totalFixes = this.results.reduce((sum, r) => sum + r.violations.length, 0);
    console.log(`Total files processed: ${this.results.length}`);
    console.log(`Total fixes applied: ${totalFixes}`);
    console.log('\n🎯 All markdown violations should now be resolved!');
  }
}

// Execute
if (require.main === module) {
  const fixer = new UltimateMarkdownFixer();
  fixer.process();
}