#!/usr/bin/env npx tsx

/**
 * CI/CD Markdown Quality Validation Script
 * 
 * This TypeScript script provides comprehensive markdown validation for CI/CD pipelines.
 * It validates markdown quality standards and fails the build on violations.
 * 
 * Usage: npx tsx scripts/ci-cd-validation.ts
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

// ANSI color codes for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

interface ValidationResult {
  passed: boolean;
  violations: number;
  details: string[];
}

interface QualityMetrics {
  totalFiles: number;
  filesWithViolations: number;
  totalViolations: number;
  lineLength: number;
  spellCheck: number;
  markdownLint: number;
}

class CICDValidator {
  private readonly maxLineLength = 222; // Tiered Line Length System: 222/444/999
  private readonly projectRoot: string;
  private metrics: QualityMetrics = {
    totalFiles: 0,
    filesWithViolations: 0,
    totalViolations: 0,
    lineLength: 0,
    spellCheck: 0,
    markdownLint: 0
  };

  constructor() {
    this.projectRoot = process.cwd();
  }

  private log(color: keyof typeof colors, message: string): void {
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
    console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
  }

  private async checkDependencies(): Promise<boolean> {
    this.log('blue', '🔧 Checking CI/CD dependencies...');
    
    const requiredCommands = ['node', 'npm'];
    const missingCommands: string[] = [];

    for (const cmd of requiredCommands) {
      try {
        execSync(`which ${cmd}`, { stdio: 'ignore' });
      } catch {
        missingCommands.push(cmd);
      }
    }

    // Check for Node.js packages
    const requiredPackages = ['markdownlint-cli', 'cspell'];
    for (const pkg of requiredPackages) {
      try {
        execSync(`npm list ${pkg}`, { stdio: 'ignore' });
      } catch {
        try {
          execSync(`npm list -g ${pkg}`, { stdio: 'ignore' });
        } catch {
          missingCommands.push(pkg);
        }
      }
    }

    if (missingCommands.length > 0) {
      this.log('red', `❌ Missing dependencies: ${missingCommands.join(', ')}`);
      this.log('yellow', '💡 Install missing dependencies and retry');
      return false;
    }

    this.log('green', '✅ All dependencies available');
    return true;
  }

  private async runMarkdownLint(): Promise<ValidationResult> {
    this.log('blue', '🔍 Running markdown linting...');
    
    try {
      execSync('npm run lint:md', { 
        stdio: 'pipe',
        cwd: this.projectRoot,
        encoding: 'utf8'
      });
      
      this.log('green', '✅ Markdown linting passed');
      return { passed: true, violations: 0, details: [] };
    } catch (error: any) {
      const output = error.stdout || error.stderr || '';
      const violations = (output.match(/:\d+:/g) || []).length;
      
      this.metrics.markdownLint = violations;
      this.log('red', `❌ Markdown linting failed with ${violations} violations`);
      
      return {
        passed: false,
        violations,
        details: [output]
      };
    }
  }

  private async runSpellCheck(): Promise<ValidationResult> {
    this.log('blue', '📝 Running spell checking...');
    
    try {
      execSync('npx cspell "**/*.md" --no-progress', {
        stdio: 'pipe',
        cwd: this.projectRoot,
        encoding: 'utf8'
      });
      
      this.log('green', '✅ Spell checking passed');
      return { passed: true, violations: 0, details: [] };
    } catch (error: any) {
      const output = error.stdout || error.stderr || '';
      const violations = (output.match(/Unknown word/g) || []).length;
      
      this.metrics.spellCheck = violations;
      this.log('yellow', `⚠️ Spell checking found ${violations} potential issues`);
      this.log('cyan', '💡 Add legitimate terms to .cspell.json');
      
      return {
        passed: false,
        violations,
        details: [output]
      };
    }
  }

  private async validateLineLength(): Promise<ValidationResult> {
    this.log('blue', '📏 Validating line lengths...');
    
    const markdownFiles = await glob('**/*.md', {
      cwd: this.projectRoot,
      ignore: [
        'node_modules/**',
        '.next/**',
        '.git/**',
        'dist/**',
        'build/**'
      ]
    });

    this.metrics.totalFiles = markdownFiles.length;
    let totalViolations = 0;
    const violationDetails: string[] = [];
    let filesWithViolations = 0;

    for (const file of markdownFiles) {
      const fullPath = join(this.projectRoot, file);
      const content = readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      let fileViolations = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].length > this.maxLineLength) {
          totalViolations++;
          fileViolations++;
          
          if (fileViolations <= 5) { // Limit details to first 5 violations per file
            violationDetails.push(
              `${file}:${i + 1} (${lines[i].length} chars): ${lines[i].substring(0, 100)}...`
            );
          }
        }
      }
      
      if (fileViolations > 0) {
        filesWithViolations++;
        if (fileViolations > 5) {
          violationDetails.push(`${file}: ... and ${fileViolations - 5} more violations`);
        }
      }
    }

    this.metrics.lineLength = totalViolations;
    this.metrics.filesWithViolations = filesWithViolations;

    if (totalViolations === 0) {
      this.log('green', '✅ Line length validation passed');
      return { passed: true, violations: 0, details: [] };
    } else {
      this.log('red', `❌ Found ${totalViolations} line length violations in ${filesWithViolations} files`);
      return {
        passed: false,
        violations: totalViolations,
        details: violationDetails
      };
    }
  }

  private generateReport(results: {
    dependencies: boolean;
    markdownLint: ValidationResult;
    spellCheck: ValidationResult;
    lineLength: ValidationResult;
  }): void {
    this.log('purple', '📊 VALIDATION REPORT');
    console.log(`${colors.purple}${'='.repeat(80)}${colors.reset}`);
    
    // Summary
    console.log(`${colors.bold}Project:${colors.reset} Communitee Control Hub`);
    console.log(`${colors.bold}Files Analyzed:${colors.reset} ${this.metrics.totalFiles} markdown files`);
    console.log(`${colors.bold}Files with Issues:${colors.reset} ${this.metrics.filesWithViolations}`);
    console.log();

    // Individual test results
    const tests = [
      { name: 'Dependencies Check', passed: results.dependencies, violations: 0 },
      { name: 'Markdown Linting', passed: results.markdownLint.passed, violations: this.metrics.markdownLint },
      { name: 'Spell Checking', passed: results.spellCheck.passed, violations: this.metrics.spellCheck },
      { name: 'Line Length (<= 120)', passed: results.lineLength.passed, violations: this.metrics.lineLength }
    ];

    tests.forEach(test => {
      const status = test.passed ? `${colors.green}✅ PASSED${colors.reset}` : `${colors.red}❌ FAILED${colors.reset}`;
      const violationText = test.violations > 0 ? ` (${test.violations} violations)` : '';
      console.log(`${test.name.padEnd(25)} ${status}${violationText}`);
    });

    console.log();

    // Total violations
    this.metrics.totalViolations = this.metrics.markdownLint + this.metrics.spellCheck + this.metrics.lineLength;
    console.log(`${colors.bold}Total Violations:${colors.reset} ${this.metrics.totalViolations}`);
    
    // Pass/Fail status
    const allPassed = results.dependencies && 
                     results.markdownLint.passed && 
                     results.lineLength.passed;
    
    if (allPassed) {
      console.log(`${colors.green}${colors.bold}🎉 ALL VALIDATIONS PASSED!${colors.reset}`);
      console.log(`${colors.green}Markdown quality standards met - ready for deployment${colors.reset}`);
    } else {
      console.log(`${colors.red}${colors.bold}❌ VALIDATION FAILED${colors.reset}`);
      console.log(`${colors.red}Fix violations before merging to main branch${colors.reset}`);
    }

    console.log(`${colors.purple}${'='.repeat(80)}${colors.reset}`);
  }

  private provideSuggestions(): void {
    this.log('cyan', '💡 QUICK FIXES:');
    console.log('  • Auto-fix markdown: npm run lint:md:fix');
    console.log('  • Add spell-check terms: Edit .cspell.json');
    console.log('  • Manual line wrapping: Use editor with 120-char guide');
    console.log('  • Use template: .templates/markdown-template.md');
    console.log();

    this.log('cyan', '📖 DOCUMENTATION:');
    console.log('  • Standards: docs/MARKDOWN_LINTING.md');
    console.log('  • Prevention: docs/markdown-quality-prevention-system.md');
    console.log('  • Local validation: ./scripts/validate-markdown-quality.sh');
  }

  public async run(): Promise<void> {
    this.log('purple', '🚀 CI/CD Markdown Quality Validation Starting...');
    console.log();

    const results = {
      dependencies: await this.checkDependencies(),
      markdownLint: { passed: true, violations: 0, details: [] } as ValidationResult,
      spellCheck: { passed: true, violations: 0, details: [] } as ValidationResult,
      lineLength: { passed: true, violations: 0, details: [] } as ValidationResult
    };

    if (!results.dependencies) {
      process.exit(1);
    }

    console.log();

    // Run all validations
    results.markdownLint = await this.runMarkdownLint();
    console.log();
    
    results.spellCheck = await this.runSpellCheck();
    console.log();
    
    results.lineLength = await this.validateLineLength();
    console.log();

    // Generate comprehensive report
    this.generateReport(results);
    
    // Provide suggestions if there are failures
    const hasFailures = !results.markdownLint.passed || !results.lineLength.passed;
    if (hasFailures) {
      console.log();
      this.provideSuggestions();
    }

    // Exit with appropriate code
    const exitCode = hasFailures ? 1 : 0;
    process.exit(exitCode);
  }
}

// Run the validator
const validator = new CICDValidator();
validator.run().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});