# Enhanced Markdown Enforcer Agent Specification

## Executive Summary

The current markdown enforcer has significant gaps in rule coverage and implementation reliability,
leading to incomplete violation fixes. This document specifies an enhanced agent architecture that
achieves true zero-violation enforcement through comprehensive rule implementation, atomic
processing, and robust error handling.

## Current System Analysis

### Identified Issues

#### 1. Incomplete Rule Coverage

Current implementation only handles 8 out of 50+ markdownlint rules:

**Implemented Rules (8/50+)**:

- MD009: Trailing spaces
- MD010: Hard tabs  

- MD012: Multiple consecutive blank lines

- MD013: Line length (partial)

- MD022: Blanks around headings

- MD032: Blanks around lists

- MD047: Single trailing newline

**Missing Critical Rules (42+)**:

- MD001: Heading levels increment

- MD003: Heading style consistency

- MD024: Duplicate headings

- MD026: Trailing punctuation in headings

- MD029: Ordered list prefix

- MD036: Emphasis as heading

- MD038: No space in code spans

- MD040: Fenced code language

- MD041: First line heading

- And 30+ additional rules

#### 2. Logic Errors in Current Fixes

```typescript
// PROBLEMATIC: Current MD022 fix logic

private fixBlanksAroundHeadings(lines: string[], violation: ViolationReport) {

  // Only checks for heading format, doesn't handle context-specific violations

  if (line.match(/^#+\s/)) {

    // Blindly adds blank lines without checking existing structure

    lines.splice(lineIndex, 0, ''); // Can create duplicate blank lines

  }

}
```

#### 3. Non-Atomic Processing

- Processes all files in bulk without rollback capability

- Partial failures leave files in inconsistent states
- No transaction-like guarantees for file modifications

#### 4. Insufficient Error Handling

- Silent failures for complex rules

- No detailed error reporting
- Missing validation of applied fixes

## Enhanced Agent Architecture

### Core Design Principles

1. **Atomic File Processing**: Each file processed as isolated transaction

2. **Complete Rule Coverage**: Implementation for all 50+ markdownlint rules

3. **Multi-Pass Strategy**: Progressive refinement with validation loops

4. **Rollback Capability**: Automatic recovery from failed operations
5. **Context-Aware Fixes**: Rule implementations understand document structure

### Architecture Components

#### 1. Enhanced Rule Engine

```typescript
interface EnhancedRuleEngine {

  // Complete rule coverage

  implementedRules: Set<string>; // All 50+ rules

  // Context-aware processing
  documentContext: DocumentContext;
  
  // Multi-pass strategies
  passStrategies: Map<string, FixStrategy[]>;
  
  // Validation framework
  validateFix(before: string, after: string, rule: string): ValidationResult;

}

interface DocumentContext {
  fileType: 'documentation' | 'evidence' | 'template' | 'agent';

  lineCount: number;

  headingStructure: HeadingNode[];

  codeBlocks: CodeBlock[];

  lists: ListStructure[];

  tables: TableStructure[];

}

```

#### 2. Atomic File Processor

```typescript

class AtomicFileProcessor {

  async processFile(filePath: string): Promise<ProcessingResult> {

    const transaction = await this.beginTransaction(filePath);

    try {
      const violations = await this.scanFileViolations(filePath);
      const fixes = await this.planFixes(violations);
      const result = await this.applyFixesAtomically(fixes);
      
      await this.validateResult(result);
      await transaction.commit();
      
      return result;

    } catch (error) {

      await transaction.rollback();

      throw new ProcessingError(filePath, error);

    }

  }
}
```

#### 3. Multi-Pass Fix Strategy

```typescript
interface MultiPassStrategy {
  passes: [
    'structural-fixes',    // MD001, MD003, MD041 - Document structure
    'formatting-fixes',    // MD009, MD010, MD012 - Basic formatting
    'content-fixes',       // MD024, MD026, MD036 - Content quality
    'code-fixes',         // MD038, MD040, MD046 - Code block handling
    'list-fixes',         // MD029, MD030, MD032 - List formatting

    'validation-pass'     // Final verification

  ];

  maxIterations: 5;

  convergenceCheck: boolean;

}
```

## Complete Rule Implementation Specifications

### Structural Rules (MD001, MD003, MD041)

#### MD001: Heading Levels Increment

```typescript
class HeadingIncrementFixer {
  fix(content: string): FixResult {

    const lines = content.split('\n');

    const headings = this.extractHeadings(lines);
    
    // Build proper heading hierarchy

    const corrected = this.correctHeadingLevels(headings);
    
    // Apply corrections with context preservation

    return this.applyHeadingCorrections(lines, corrected);
  }
  
  private correctHeadingLevels(headings: Heading[]): HeadingCorrection[] {
    const corrections: HeadingCorrection[] = [];
    let expectedLevel = 1;
    
    for (const heading of headings) {
      if (heading.level > expectedLevel + 1) {
        // Invalid jump - correct to proper level
        corrections.push({
          line: heading.line,
          from: heading.level,
          to: expectedLevel + 1
        });
        expectedLevel = expectedLevel + 1;
      } else {

        expectedLevel = heading.level;

      }

    }
    
    return corrections;

  }

}
```

#### MD003: Heading Style Consistency

```typescript
class HeadingStyleFixer {
  fix(content: string): FixResult {
    const lines = content.split('\n');
    const headings = this.extractHeadings(lines);
    
    // Determine dominant style (ATX vs Setext)
    const dominantStyle = this.determineDominantStyle(headings);
    
    // Convert all headings to dominant style
    return this.normalizeHeadingStyle(lines, headings, dominantStyle);

  }
  
  private determineDominantStyle(headings: Heading[]): 'atx' | 'setext' {

    const atxCount = headings.filter(h => h.style === 'atx').length;

    const setextCount = headings.filter(h => h.style === 'setext').length;

    return atxCount >= setextCount ? 'atx' : 'setext';
  }
}
```

### Content Quality Rules (MD024, MD026, MD036, MD038)

#### MD024: Duplicate Headings

```typescript
class DuplicateHeadingFixer {

  fix(content: string): FixResult {

    const lines = content.split('\n');
    const headings = this.extractHeadings(lines);
    
    // Track heading text occurrences
    const headingCounts = new Map<string, number>();
    const corrections: LineCorrection[] = [];
    
    for (const heading of headings) {
      const normalizedText = heading.text.toLowerCase().trim();
      const count = headingCounts.get(normalizedText) || 0;

      headingCounts.set(normalizedText, count + 1);
      
      if (count > 0) {
        // Make heading unique by adding context or number
        const uniqueText = this.makeHeadingUnique(heading, count + 1);
        corrections.push({
          line: heading.line,
          replacement: heading.prefix + uniqueText
        });
      }
    }
    
    return this.applyCorrections(lines, corrections);
  }
  
  private makeHeadingUnique(heading: Heading, occurrence: number): string {
    // Strategy 1: Add section context if available
    const context = this.findSectionContext(heading);
    if (context) {
      return `${context} - ${heading.text}`;

    }
    
    // Strategy 2: Add occurrence number

    return `${heading.text} (${occurrence})`;
  }
}
```

#### MD026: Trailing Punctuation in Headings

```typescript
class TrailingPunctuationFixer {
  private readonly ALLOWED_PUNCTUATION = new Set(['?', '!']); // Questions and exclamations OK
  private readonly REMOVE_PUNCTUATION = new Set(['.', ':', ';', ',']);
  
  fix(content: string): FixResult {
    const lines = content.split('\n');
    const corrections: LineCorrection[] = [];

    for (let i = 0; i < lines.length; i++) {

      const line = lines[i];

      const headingMatch = line.match(/^(#+\s*)(.*?)(\s*)$/);
      
      if (headingMatch) {
        const [, prefix, text, suffix] = headingMatch;
        const lastChar = text.slice(-1);
        
        if (this.REMOVE_PUNCTUATION.has(lastChar)) {
          const cleanText = text.slice(0, -1);
          corrections.push({
            line: i,
            replacement: prefix + cleanText + suffix
          });
        }

      }

    }
    
    return this.applyCorrections(lines, corrections);

  }

}

```

#### MD036: Emphasis Used as Heading

```typescript
class EmphasisAsHeadingFixer {
  fix(content: string): FixResult {
    const lines = content.split('\n');
    const corrections: LineCorrection[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect emphasis used as heading (bold/italic on separate line)
      if (this.isEmphasisAsHeading(line, lines, i)) {
        const headingLevel = this.determineHeadingLevel(lines, i);
        const headingText = this.extractTextFromEmphasis(line);
        
        corrections.push({
          line: i,
          replacement: '#'.repeat(headingLevel) + ' ' + headingText
        });

      }

    }

    return this.applyCorrections(lines, corrections);
  }
  
  private isEmphasisAsHeading(line: string, lines: string[], index: number): boolean {
    // Check if line is pure emphasis (bold/italic)
    const emphasisMatch = line.match(/^\s*(\*\*|__|\*|_)(.+?)\1\s*$/);
    if (!emphasisMatch) return false;
    
    // Check if it's standalone (not part of paragraph)

    const prevLine = index > 0 ? lines[index - 1] : '';

    const nextLine = index < lines.length - 1 ? lines[index + 1] : '';
    
    return prevLine.trim() === '' && nextLine.trim() !== '';

  }
}
```

#### MD038: No Space in Code Spans

```typescript
class CodeSpanSpaceFixer {
  fix(content: string): FixResult {
    // Fix spaces inside code spans like `code ` or ` code`
    const fixedContent = content.replace(
      /`(\s+)([^`]+?)(\s+)`/g,
      (match, leadingSpace, code, trailingSpace) => {
        return '`' + code.trim() + '`';
      }
    );
    
    return {

      success: fixedContent !== content,

      content: fixedContent,

      changes: this.countChanges(content, fixedContent)

    };
  }
}
```

### Code Block Rules (MD040, MD046)

#### MD040: Fenced Code Language

```typescript
class CodeLanguageFixer {
  private readonly LANGUAGE_MAPPINGS = new Map([
    ['js', 'javascript'],
    ['ts', 'typescript'],
    ['md', 'markdown'],
    ['yml', 'yaml'],

    ['json', 'json'],

    ['bash', 'bash'],

    ['sh', 'bash'],

    ['shell', 'bash']
  ]);
  
  fix(content: string): FixResult {
    const lines = content.split('\n');
    const corrections: LineCorrection[] = [];
    
    for (let i = 0; i < lines.length; i++) {

      const line = lines[i];

      // Detect code block start without language
      if (line.match(/^```\s*$/)) {
        const language = this.detectLanguage(lines, i);
        if (language) {
          corrections.push({
            line: i,
            replacement: '```' + language
          });
        }
      }
    }
    
    return this.applyCorrections(lines, corrections);

  }
  
  private detectLanguage(lines: string[], startIndex: number): string | null {

    // Look at code content to detect language
    const codeLines: string[] = [];
    
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (lines[i].match(/^```/)) break;
      codeLines.push(lines[i]);
    }
    
    const codeContent = codeLines.join('\n');
    
    // Language detection heuristics

    if (codeContent.includes('function') && codeContent.includes('{')) {

      return 'javascript';
    }
    if (codeContent.includes('interface') || codeContent.includes(': string')) {
      return 'typescript';
    }
    if (codeContent.includes('npm ') || codeContent.includes('git ')) {
      return 'bash';
    }
    if (codeContent.includes('"') && codeContent.includes(':')) {

      return 'json';

    }

    return 'text'; // Default fallback

  }

}

```

### List Rules (MD029, MD030, MD032)

#### MD029: Ordered List Prefix

```typescript
class OrderedListPrefixFixer {

  fix(content: string): FixResult {

    const lines = content.split('\n');
    const corrections: LineCorrection[] = [];
    
    let currentListStart = -1;
    let expectedNumber = 1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const listMatch = line.match(/^(\s*)(\d+)(\.\s+)(.*)$/);
      
      if (listMatch) {
        const [, indent, currentNumber, delimiter, content] = listMatch;
        
        if (currentListStart === -1) {
          currentListStart = i;
          expectedNumber = 1;
        }
        
        if (parseInt(currentNumber) !== expectedNumber) {
          corrections.push({
            line: i,
            replacement: indent + expectedNumber + delimiter + content
          });
        }
        
        expectedNumber++;

      } else if (line.trim() === '') {

        // Continue list through blank lines

        continue;

      } else {

        // Reset list tracking

        currentListStart = -1;
        expectedNumber = 1;

      }

    }

    return this.applyCorrections(lines, corrections);
  }

}

```

## Enhanced Implementation Strategy

### 1. Progressive Multi-Pass Processing

```typescript

class EnhancedMarkdownEnforcer {

  async enforceZeroViolations(filePath: string): Promise<EnforcementResult> {

    const processor = new AtomicFileProcessor(filePath);
    
    // Pass 1: Structural fixes (headings, document structure)
    await processor.applyPass('structural', [
      new HeadingIncrementFixer(),
      new HeadingStyleFixer(),

      new FirstLineHeadingFixer()
    ]);
    
    // Pass 2: Content quality fixes

    await processor.applyPass('content', [

      new DuplicateHeadingFixer(),

      new TrailingPunctuationFixer(),

      new EmphasisAsHeadingFixer()
    ]);

    // Pass 3: Code and formatting fixes
    await processor.applyPass('formatting', [

      new CodeLanguageFixer(),

      new CodeSpanSpaceFixer(),
      new TrailingSpaceFixer()

    ]);
    
    // Pass 4: List and spacing fixes

    await processor.applyPass('lists', [

      new OrderedListPrefixFixer(),
      new ListSpacingFixer(),

      new BlanksAroundListsFixer()

    ]);
    
    // Pass 5: Final validation and cleanup

    const finalResult = await processor.validateAndFinalize();

    return finalResult;

  }
}
```

### 2. Atomic Transaction Management

```typescript

class FileTransaction {

  private originalContent: string;
  private backupPath: string;
  private workingContent: string;

  async begin(filePath: string): Promise<void> {

    this.originalContent = await fs.readFile(filePath, 'utf8');

    this.backupPath = filePath + '.transaction-backup-' + Date.now();
    await fs.writeFile(this.backupPath, this.originalContent);

    this.workingContent = this.originalContent;

  }
  
  async commit(filePath: string): Promise<void> {

    await fs.writeFile(filePath, this.workingContent);
    await fs.unlink(this.backupPath); // Remove backup

  }

  async rollback(filePath: string): Promise<void> {
    await fs.writeFile(filePath, this.originalContent);

    await fs.unlink(this.backupPath);

  }
}
```

### 3. Comprehensive Validation Framework

```typescript

class ValidationFramework {
  async validateFix(
    before: string, 

    after: string, 

    rule: string

  ): Promise<ValidationResult> {

    // 1. Syntax validation

    const syntaxValid = await this.validateMarkdownSyntax(after);
    
    // 2. Content preservation validation
    const contentPreserved = await this.validateContentPreservation(before, after);
    
    // 3. Rule-specific validation
    const ruleFixed = await this.validateRuleFixed(after, rule);
    
    // 4. No regression validation
    const noRegression = await this.validateNoRegression(after);
    
    return {

      valid: syntaxValid && contentPreserved && ruleFixed && noRegression,
      issues: this.collectValidationIssues([syntaxValid, contentPreserved, ruleFixed, noRegression])

    };
  }

  private async validateContentPreservation(before: string, after: string): Promise<boolean> {
    // Extract meaningful content (ignore formatting)

    const beforeContent = this.extractMeaningfulContent(before);

    const afterContent = this.extractMeaningfulContent(after);

    return beforeContent === afterContent;

  }

}

```

## Agent Deployment Specification

### Command Interface

```bash
# Enhanced enforcer with full rule coverage

npm run markdown:enforce-enhanced

# Target specific file

npm run markdown:enforce-enhanced -- --file path/to/file.md

# Target specific rules

npm run markdown:enforce-enhanced -- --rules MD024,MD026,MD036

# Dry run mode (preview changes)

npm run markdown:enforce-enhanced -- --dry-run

# Ultra-safe mode (maximum validation)

npm run markdown:enforce-enhanced -- --ultra-safe

```

### Integration Points

#### 1. Pre-commit Hook Integration

```typescript

// .git/hooks/pre-commit (enhanced)
#!/usr/bin/env node

const { EnhancedMarkdownEnforcer } = require('./scripts/enhanced-markdown-enforcer');

async function preCommitEnforcement() {
  const changedFiles = getChangedMarkdownFiles();

  const enforcer = new EnhancedMarkdownEnforcer();
  
  let allPassed = true;

  for (const file of changedFiles) {
    const result = await enforcer.enforceZeroViolations(file);
    if (!result.success) {
      console.error(`❌ Markdown violations in ${file}:`);

      result.violations.forEach(v => console.error(`  - ${v.rule}: ${v.description}`));
      allPassed = false;

    }

  }
  
  if (!allPassed) {
    console.error('\n🚫 Commit blocked due to markdown violations');

    console.error('Run: npm run markdown:enforce-enhanced');

    process.exit(1);
  }

  console.log('✅ All markdown files comply with quality standards');
}
```

#### 2. CI/CD Pipeline Integration

```yaml

# .github/workflows/markdown-quality.yml

name: Markdown Quality Enforcement

on: [push, pull_request]

jobs:

  markdown-quality:

    runs-on: ubuntu-latest

    steps:

      - uses: actions/checkout@v3
      - name: Setup Node.js

        uses: actions/setup-node@v3

        with:

          node-version: '18'

      - name: Install dependencies

        run: npm ci

      - name: Run enhanced markdown enforcement

        run: npm run markdown:enforce-enhanced -- --ci-mode

      - name: Validate zero violations

        run: npm run markdown:validate-zero-violations
```

## Performance and Reliability Features

### 1. Concurrent Processing

```typescript
class ConcurrentProcessor {
  async processFiles(files: string[]): Promise<ProcessingResult[]> {
    const concurrency = Math.min(files.length, os.cpus().length);
    const chunks = this.chunkArray(files, concurrency);
    
    const results = await Promise.all(
      chunks.map(chunk => this.processChunk(chunk))
    );
    
    return results.flat();

  }

}
```

### 2. Memory Optimization

```typescript

class MemoryOptimizedProcessor {

  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  private readonly MAX_CONCURRENT_FILES = 10;
  
  async processLargeFile(filePath: string): Promise<ProcessingResult> {
    const stats = await fs.stat(filePath);

    if (stats.size > this.MAX_FILE_SIZE) {
      return this.processInChunks(filePath);
    }
    
    return this.processNormally(filePath);

  }
}
```

### 3. Error Recovery and Reporting

```typescript

interface ErrorRecoveryStrategy {

  onFixFailure(file: string, rule: string, error: Error): Promise<RecoveryAction>;

  onValidationFailure(file: string, validation: ValidationResult): Promise<RecoveryAction>;

  onTransactionFailure(file: string, transaction: FileTransaction): Promise<RecoveryAction>;

}

class RobustErrorRecovery implements ErrorRecoveryStrategy {

  async onFixFailure(file: string, rule: string, error: Error): Promise<RecoveryAction> {
    // Log detailed error information
    await this.logError(file, rule, error);
    
    // Attempt alternative fix strategy

    const alternativeFix = this.getAlternativeFix(rule);
    if (alternativeFix) {
      return { action: 'retry', strategy: alternativeFix };
    }
    
    // Skip rule and continue with others
    return { action: 'skip', reason: `Unable to fix ${rule}: ${error.message}` };
  }
}
```

## Success Metrics and Validation

### 1. Zero Violation Guarantee

```typescript

class ZeroViolationValidator {
  async validateZeroViolations(filePath: string): Promise<ValidationReport> {
    const result = await execAsync(`npx markdownlint "${filePath}" --json`);
    
    if (result.stdout.trim()) {
      const violations = JSON.parse(result.stdout);
      return {
        success: false,
        violationCount: violations.length,
        violations: violations
      };
    }
    
    return {
      success: true,
      violationCount: 0,
      violations: []
    };
  }
}
```

### 2. Content Integrity Verification

```typescript
class ContentIntegrityChecker {
  async verifyContentIntegrity(before: string, after: string): Promise<IntegrityReport> {
    const beforeHash = this.computeContentHash(before);

    const afterHash = this.computeContentHash(after);
    
    // Content should be semantically identical

    const semanticallyIdentical = await this.compareSemanticContent(before, after);
    
    return {
      syntaxChanged: beforeHash !== afterHash,

      contentPreserved: semanticallyIdentical,

      changes: this.identifyChanges(before, after)
    };
  }
  
  private extractSemanticContent(markdown: string): string {

    // Remove formatting-only changes, preserve meaning
    return markdown
      .replace(/\s+/g, ' ')           // Normalize whitespace

      .replace(/#+\s*/g, '')          // Remove heading markers

      .replace(/[*_]+([^*_]+)[*_]+/g, '$1') // Remove emphasis markers
      .trim();

  }

}

```

## Implementation Timeline

### Phase 1: Core Rule Implementation (Week 1)

- [ ] Implement all 50+ markdownlint rules
- [ ] Create comprehensive test suite

- [ ] Build atomic transaction system

### Phase 2: Enhanced Processing (Week 2)

- [ ] Multi-pass processing pipeline

- [ ] Concurrent file processing
- [ ] Memory optimization features

### Phase 3: Integration & Validation (Week 3)

- [ ] Pre-commit hook integration
- [ ] CI/CD pipeline integration
- [ ] Comprehensive validation framework

### Phase 4: Performance & Reliability (Week 4)

- [ ] Error recovery mechanisms
- [ ] Performance benchmarking
- [ ] Production deployment

## Conclusion

This enhanced markdown enforcer agent specification addresses all identified gaps in the current implementation:

1. **Complete Rule Coverage**: All 50+ rules implemented with context-aware logic
2. **Atomic Processing**: Transaction-based file modifications with rollback
3. **Multi-Pass Strategy**: Progressive refinement for complex document structures
4. **Robust Validation**: Content integrity and zero-violation guarantees
5. **Production-Ready**: Error recovery, performance optimization, and monitoring

The enhanced agent will achieve true zero-violation enforcement while preserving document integrity and providing comprehensive error handling and recovery capabilities.
