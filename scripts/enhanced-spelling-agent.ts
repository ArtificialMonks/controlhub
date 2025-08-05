#!/usr/bin/env node
/**
 * Enhanced Spelling Agent - Enterprise Grade
 * 
 * Advanced AI-powered spelling analysis and intelligent whitelist management
 * for A.V.A.R.I.C.E. Protocol ecosystem compliance.
 * 
 * Features:
 * - Full-scale codebase spell-checking with context analysis
 * - Intelligent differentiation between whitelist vs spell-fix candidates
 * - Technical term recognition and classification
 * - Enterprise-grade reporting and analytics
 * - A.V.A.R.I.C.E. Protocol integration with quality gates
 * - Comprehensive security validation and input sanitization
 * - Evidence collection and Neo4j storage integration
 * - Autonomous termination criteria with quality assurance
 */

import { exec } from 'child_process';
import { promises as fs, constants as fsConstants, accessSync, statSync, readFileSync } from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Enterprise-grade constants for configuration
const ENTERPRISE_CONFIG = {
  maxBufferSize: 10 * 1024 * 1024, // 10MB buffer limit
  maxExecutionTime: 300000, // 5 minutes timeout
  confidenceThreshold: {
    high: 0.8,
    medium: 0.7,
    low: 0.3
  },
  security: {
    maxPathLength: 1000,
    allowedFileExtensions: ['.ts', '.tsx', '.js', '.jsx', '.md', '.json', '.yaml', '.yml'],
    restrictedCommands: ['rm', 'del', 'format', 'sudo', 'chmod']
  }
} as const;

// Evidence collection interface for A.V.A.R.I.C.E. Protocol
interface AvariceEvidence {
  questId: string;
  phaseNumber: number;
  evidenceType: 'spelling_analysis' | 'quality_gate' | 'validation' | 'termination';
  timestamp: string;
  data: Record<string, unknown>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  qualityGates: QualityGateResult[];
}

// Quality gate validation results
interface QualityGateResult {
  gateName: string;
  status: 'passed' | 'failed' | 'warning';
  metrics: Record<string, number>;
  recommendations: string[];
}

// Structured logging levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

// Enhanced logging interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  metadata?: Record<string, unknown>;
  traceId?: string;
}

interface SpellingIssue {
  readonly word: string;
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly context: string;
  readonly classification: 'whitelist_candidate' | 'spelling_error' | 'uncertain';
  readonly category: 'technical_term' | 'proper_noun' | 'acronym' | 'typo' | 'unknown';
  readonly confidence: number;
  readonly suggestions?: readonly string[];
  readonly riskLevel: 'low' | 'medium' | 'high';
  readonly securityValidated: boolean;
}

interface SpellingAnalysis {
  readonly totalIssues: number;
  readonly whitelistCandidates: readonly SpellingIssue[];
  readonly spellingErrors: readonly SpellingIssue[];
  readonly uncertainCases: readonly SpellingIssue[];
  readonly byCategory: Readonly<Record<string, readonly SpellingIssue[]>>;
  readonly byFile: Readonly<Record<string, readonly SpellingIssue[]>>;
  readonly qualityMetrics: QualityMetrics;
  readonly evidenceCollection: AvariceEvidence;
}

interface QualityMetrics {
  readonly accuracyScore: number;
  readonly processingTime: number;
  readonly filesProcessed: number;
  readonly securityViolations: number;
  readonly performanceScore: number;
}

interface CSpellConfig {
  readonly version: string;
  readonly language: string;
  readonly words: string[];
  readonly ignoreWords: readonly string[];
  readonly import: readonly string[];
  readonly ignoreRegExpList: readonly string[];
  readonly ignorePaths: readonly string[];
  readonly enabledFileTypes?: Readonly<Record<string, boolean>>;
}

class EnhancedSpellingAgent {
  private readonly projectRoot: string;
  private readonly cspellConfig: CSpellConfig;
  private readonly traceId: string;
  private readonly startTime: number;
  private issues: SpellingIssue[] = [];
  private analysis: SpellingAnalysis | null = null;
  private readonly qualityGates: QualityGateResult[] = [];
  private readonly evidenceData: AvariceEvidence;

  // Security validation state
  private readonly securityValidator: SecurityValidator;

  // Technical patterns for intelligent classification
  private readonly technicalPatterns = {
    // Framework/Library patterns
    frameworks: /^(react|next|vue|angular|svelte|tailwind|shadcn|supabase|vercel|github|firebase|aws|azure|gcp)$/i,
    
    // Programming language terms
    jsKeywords: /^(async|await|const|let|var|function|interface|type|class|enum|import|export)$/i,
    webTech: /^(jsx|tsx|css|html|json|yaml|yml|api|graphql|rest|crud)$/i,
    securityTerms: /^(auth|oauth|jwt|cors|csrf|xss|sql|nosql)$/i,
    
    // Technical acronyms
    acronyms: /^[A-Z]{2,8}$/,
    
    // Version numbers and identifiers
    versions: /^v?\d+(\.\d+)*(-[a-z0-9]+)?$/i,
    
    // File extensions
    extensions: /^\.[a-z0-9]+$/i,
    
    // Camel/Pascal case (likely variable names)
    camelCase: /^[a-z]+([A-Z][a-z]*)+$/,
    pascalCase: /^[A-Z][a-z]*([A-Z][a-z]*)*$/,
    
    // Snake case (likely constants/variables)
    snakeCase: /^[a-z]+(_[a-z]+)+$/,
    
    // Kebab case (likely CSS/file names)
    kebabCase: /^[a-z]+(-[a-z]+)+$/,
    
    // Hash/ID patterns
    hashes: /^[a-f0-9]{8,}$/i,
    
    // URLs and domains
    domains: /^[a-z0-9.-]+\.(com|org|net|io|dev|app|ai|co|uk|de|fr)$/i,
    
    // Common technical suffixes
    techSuffixes: /(ability|ible|tion|sion|ment|ness|ity|ism|ics|fy|ize|ise)$/i,
    
    // A.V.A.R.I.C.E. Protocol specific
    avariceTerms: /^(avarice|protocol|agent|scribe|architect|executor|analyzer|joker|quest|phase|evidence|memorization|validation|verification|grounding|contextual|agentic|orchestration)$/i
  };

  // Common typo patterns
  private readonly typoPatterns = {
    // Double letters that should be single
    doubleLetter: /^(.)\1{2,}/, // More than 2 consecutive same letters
    
    // Common letter swaps
    swaps: /^(adn|teh|hte|taht|thier|recieve|seperate|definately|occurance|neccessary)$/i,
    
    // Missing apostrophes
    contractions: /^(dont|cant|wont|isnt|arent|wasnt|werent|hasnt|havent|hadnt|shouldnt|couldnt|wouldnt)$/i,
    
    // Common prefixes/suffixes errors
    prefixErrors: /^(un|in|im|ir|dis|mis|pre|re|over|under|out|up)(.+)$/i
  };

  constructor(projectRoot: string = process.cwd()) {
    this.traceId = this.generateTraceId();
    this.startTime = Date.now();
    this.projectRoot = this.validateAndSanitizeProjectRoot(projectRoot);
    this.cspellConfig = this.loadCSpellConfig();
    this.securityValidator = new SecurityValidator();
    this.evidenceData = this.initializeEvidenceCollection();
    
    // Initialize quality gates
    this.qualityGates = [];
  }

  /**
   * Generate unique trace ID for operation tracking
   */
  private generateTraceId(): string {
    return `spelling-agent-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Validate and sanitize project root path for security
   */
  private validateAndSanitizeProjectRoot(projectRoot: string): string {
    if (!projectRoot || typeof projectRoot !== 'string') {
      throw new Error('Project root must be a valid string');
    }

    if (projectRoot.length > ENTERPRISE_CONFIG.security.maxPathLength) {
      throw new Error(`Project root path exceeds maximum length of ${ENTERPRISE_CONFIG.security.maxPathLength}`);
    }

    // Sanitize path and resolve to absolute path
    const sanitizedPath = path.resolve(projectRoot);
    
    // Validate path exists and is accessible
    try {
      const stats = statSync(sanitizedPath);
      if (!stats.isDirectory()) {
        throw new Error('Project root must be a directory');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid project root: ${errorMessage}`);
    }

    return sanitizedPath;
  }

  /**
   * Initialize A.V.A.R.I.C.E. Protocol evidence collection
   */
  private initializeEvidenceCollection(): AvariceEvidence {
    return {
      questId: 'spelling-quality-assurance',
      phaseNumber: 5, // Phase 5: Multi-layer Verification
      evidenceType: 'spelling_analysis',
      timestamp: new Date().toISOString(),
      data: {},
      status: 'pending',
      qualityGates: []
    };
  }

  private loadCSpellConfig(): CSpellConfig {
    const configPath = path.join(this.projectRoot, '.cspell.json');
    
    try {
      // Security validation for config file
      this.validateConfigFileSecurity(configPath);
      
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Validate JSON content before parsing
      if (configContent.length > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Configuration file too large');
      }
      
      const config = JSON.parse(configContent) as CSpellConfig;
      
      // Validate configuration structure
      this.validateCSpellConfigStructure(config);
      
      return config;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load .cspell.json: ${errorMessage}`);
    }
  }

  /**
   * Validate configuration file security
   */
  private validateConfigFileSecurity(configPath: string): void {
    try {
      const stats = statSync(configPath);
      
      // Ensure file is not too large
      if (stats.size > 10 * 1024 * 1024) {
        throw new Error('Configuration file exceeds maximum size limit');
      }
      
      // Ensure file is readable
      accessSync(configPath, fsConstants.R_OK);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Configuration file security validation failed: ${errorMessage}`);
    }
  }

  /**
   * Validate CSpell configuration structure
   */
  private validateCSpellConfigStructure(config: unknown): asserts config is CSpellConfig {
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid configuration: must be an object');
    }

    const configObj = config as Record<string, unknown>;

    if (!configObj.words || !Array.isArray(configObj.words)) {
      throw new Error('Invalid configuration: words must be an array');
    }

    // Validate words array contains only strings
    for (const word of configObj.words) {
      if (typeof word !== 'string') {
        throw new Error('Invalid configuration: all words must be strings');
      }
    }
  }

  /**
   * Enterprise-grade structured logging with security validation
   */
  private async log(
    message: string, 
    level: LogLevel = 'info', 
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      // Sanitize message for security
      const sanitizedMessage = this.sanitizeLogMessage(message);
      
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        component: 'enhanced-spelling-agent',
        message: sanitizedMessage,
        metadata: metadata ? this.sanitizeMetadata(metadata) : undefined,
        traceId: this.traceId
      };

      // Console output with structured format
      const consoleMessage = `[${logEntry.timestamp}] [${level.toUpperCase()}] [${this.traceId}] ${sanitizedMessage}`;
      
      switch (level) {
        case 'error':
        case 'critical':
          console.error(consoleMessage);
          break;
        case 'warn':
          console.warn(consoleMessage);
          break;
        case 'debug':
          if (process.env.NODE_ENV === 'development') {
            console.debug(consoleMessage);
          }
          break;
        default:
          console.log(consoleMessage);
      }
      
      // Write to structured log file
      await this.writeToLogFile(logEntry);
      
    } catch (error) {
      // Fallback logging to prevent log failures from breaking the application
      console.error(`Logging failed: ${error}`);
    }
  }

  /**
   * Sanitize log message to prevent log injection
   */
  private sanitizeLogMessage(message: string): string {
    if (typeof message !== 'string') {
      return '[INVALID_MESSAGE_TYPE]';
    }
    
    return message
      .replace(/[\r\n]/g, ' ') // Remove line breaks
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .substring(0, 1000); // Limit message length
  }

  /**
   * Sanitize metadata to prevent sensitive data leakage
   */
  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      // Skip sensitive keys
      if (['password', 'token', 'secret', 'key', 'auth'].some(sensitive => 
        key.toLowerCase().includes(sensitive)
      )) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      
      // Limit string values
      if (typeof value === 'string') {
        sanitized[key] = value.substring(0, 500);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else {
        sanitized[key] = '[COMPLEX_OBJECT]';
      }
    }
    
    return sanitized;
  }

  /**
   * Write log entry to file with error handling
   */
  private async writeToLogFile(logEntry: LogEntry): Promise<void> {
    try {
      const logDir = path.join(this.projectRoot, 'logs');
      await fs.mkdir(logDir, { recursive: true });
      
      const logFilePath = path.join(logDir, 'enhanced-spelling-agent.log');
      const logLine = JSON.stringify(logEntry) + '\n';
      
      await fs.appendFile(logFilePath, logLine);
      
    } catch (error) {
      // Silent fail for log file writing to prevent cascading failures
      console.error(`Failed to write to log file: ${error}`);
    }
  }

  /**
   * Execute comprehensive spell check with security validation
   */
  private async runFullSpellCheck(): Promise<SpellingIssue[]> {
    await this.log('Starting enterprise-grade full-scale codebase spell check', 'info', {
      projectRoot: this.projectRoot,
      traceId: this.traceId
    });
    
    try {
      // Validate command security before execution
      const command = this.buildSecureSpellCheckCommand();
      
      // Execute with timeout and security constraints
      const result = await this.executeSecureCommand(command);
      
      // Parse and validate results
      const issues = await this.parseAndValidateSpellCheckResults(result.stdout);
      
      await this.log(`Spell check complete: ${issues.length} issues found across codebase`, 'info', {
        issueCount: issues.length,
        processingTime: Date.now() - this.startTime
      });
      
      this.issues = issues;
      this.updateEvidenceData('spell_check_completed', { issueCount: issues.length });
      
      return issues;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.log(`Error during spell check: ${errorMessage}`, 'error', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      this.updateEvidenceData('spell_check_failed', { error: errorMessage });
      throw new Error(`Spell check failed: ${errorMessage}`);
    }
  }

  /**
   * Build secure spell check command with validation
   */
  private buildSecureSpellCheckCommand(): string {
    // Validate command components for security
    const baseCommand = 'npx cspell';
    const safePattern = '"**/*"';
    const safeOptions = ['--no-progress', '--relative', '--show-context', '--show-suggestions'];
    
    // Validate no malicious injection in options
    for (const option of safeOptions) {
      if (ENTERPRISE_CONFIG.security.restrictedCommands.some(restricted => 
        option.toLowerCase().includes(restricted)
      )) {
        throw new Error(`Security violation: restricted command detected in option: ${option}`);
      }
    }
    
    return `${baseCommand} ${safePattern} ${safeOptions.join(' ')}`;
  }

  /**
   * Execute command with security constraints and timeout
   */
  private async executeSecureCommand(command: string): Promise<{stdout: string, stderr: string}> {
    return new Promise((resolve, reject) => {
      const childProcess = exec(
        command,
        {
          cwd: this.projectRoot,
          maxBuffer: ENTERPRISE_CONFIG.maxBufferSize,
          timeout: ENTERPRISE_CONFIG.maxExecutionTime,
          killSignal: 'SIGTERM'
        },
        (_error, stdout, stderr) => {
          // cspell returns non-zero when issues are found, which is expected
          resolve({ stdout: stdout || '', stderr: stderr || '' });
        }
      );
      
      // Additional timeout protection
      const timeoutId = setTimeout(() => {
        childProcess.kill('SIGTERM');
        reject(new Error('Command execution timeout'));
      }, ENTERPRISE_CONFIG.maxExecutionTime);
      
      childProcess.on('exit', () => {
        clearTimeout(timeoutId);
      });
    });
  }

  /**
   * Parse and validate spell check results with security checks
   */
  private async parseAndValidateSpellCheckResults(output: string): Promise<SpellingIssue[]> {
    if (!output || typeof output !== 'string') {
      return [];
    }
    
    // Limit output size for security
    if (output.length > ENTERPRISE_CONFIG.maxBufferSize) {
      await this.log('Output size exceeds limits, truncating', 'warn');
      output = output.substring(0, ENTERPRISE_CONFIG.maxBufferSize);
    }
    
    const issues: SpellingIssue[] = [];
    const lines = output.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const issue = this.parseCSpellLine(line);
        if (issue) {
          // Security validation for parsed issue
          const validatedIssue = await this.validateAndEnhanceIssue(issue);
          if (validatedIssue) {
            issues.push(validatedIssue);
          }
        }
      } catch (error) {
        await this.log(`Failed to parse line: ${line}`, 'warn', { error: String(error) });
      }
    }
    
    return issues;
  }

  /**
   * Validate and enhance issue with security checks and classification
   */
  private async validateAndEnhanceIssue(issue: Partial<SpellingIssue>): Promise<SpellingIssue | null> {
    try {
      // Security validation
      const securityValidated = this.securityValidator.validateIssue(issue);
      if (!securityValidated) {
        await this.log(`Security validation failed for issue: ${issue.word}`, 'warn');
        return null;
      }
      
      // Classification and enhancement
      const classification = this.classifySpellingIssue(issue as SpellingIssue);
      const category = this.categorizeIssue(issue as SpellingIssue);
      const confidence = this.calculateConfidence(issue as SpellingIssue);
      const riskLevel = this.calculateRiskLevel(issue as SpellingIssue);
      
      return {
        ...issue,
        classification,
        category,
        confidence,
        riskLevel,
        securityValidated: true
      } as SpellingIssue;
      
    } catch (error) {
      await this.log(`Failed to validate issue: ${issue.word}`, 'error', { error: String(error) });
      return null;
    }
  }

  /**
   * Calculate risk level for security assessment
   */
  private calculateRiskLevel(issue: SpellingIssue): 'low' | 'medium' | 'high' {
    // High risk for potential command injection or system files
    if (issue.file.includes('node_modules') || issue.file.includes('.git')) {
      return 'high';
    }
    
    // Medium risk for configuration files
    if (issue.file.includes('config') || issue.file.includes('.env') || issue.file.includes('package.json')) {
      return 'medium';
    }
    
    // Low risk for documentation and source files
    return 'low';
  }

  /**
   * Update evidence data for A.V.A.R.I.C.E. Protocol compliance
   */
  private updateEvidenceData(event: string, data: Record<string, unknown>): void {
    this.evidenceData.data[event] = {
      timestamp: new Date().toISOString(),
      ...data
    };
    
    this.evidenceData.status = event.includes('failed') ? 'failed' : 'in_progress';
  }

  /**
   * Parse cspell output line with enhanced security validation
   */
  private parseCSpellLine(line: string): Partial<SpellingIssue> | null {
    try {
      // Security validation for input line
      if (!line || typeof line !== 'string' || line.length > 2000) {
        return null;
      }
      
      // Parse cspell output format: file:line:column - word "context" suggestions
      const cspellPattern = /^(.+?):(\d+):(\d+)\s*-\s*(.+?)\s+"([^"]*)"(?:\s+(.+))?/;
      const match = cspellPattern.exec(line);
      if (!match) return null;

      const [, filePath, lineStr, columnStr, word, context, suggestionsStr] = match;
      
      // Validate extracted components
      if (!this.validateParsedComponents(filePath, lineStr, columnStr, word)) {
        return null;
      }
      
      const suggestions = suggestionsStr 
        ? suggestionsStr.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : [];

      return {
        word: word.trim(),
        file: filePath.trim(),
        line: parseInt(lineStr, 10),
        column: parseInt(columnStr, 10),
        context: context.trim(),
        classification: 'uncertain', // Will be set by classifier
        category: 'unknown', // Will be set by categorizer
        confidence: 0, // Will be calculated
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        riskLevel: 'low', // Will be calculated
        securityValidated: false // Will be set by validator
      };
      
    } catch (error) {
      // Log parsing error but don't throw to avoid breaking the entire process
      this.log(`Failed to parse cspell line: ${error}`, 'warn').catch(() => {});
      return null;
    }
  }

  /**
   * Validate parsed components for security and correctness
   */
  private validateParsedComponents(
    filePath: string, 
    lineStr: string, 
    columnStr: string, 
    word: string
  ): boolean {
    // Validate file path
    if (!filePath || filePath.length > ENTERPRISE_CONFIG.security.maxPathLength) {
      return false;
    }
    
    // Check for path traversal attempts
    if (filePath.includes('..') || filePath.includes('~')) {
      return false;
    }
    
    // Validate line and column numbers
    const lineNum = parseInt(lineStr, 10);
    const columnNum = parseInt(columnStr, 10);
    
    if (isNaN(lineNum) || isNaN(columnNum) || lineNum < 1 || columnNum < 1) {
      return false;
    }
    
    // Validate word
    if (!word || word.length === 0 || word.length > 100) {
      return false;
    }
    
    // Check for suspicious characters in word
    if (/[\u0000-\u001F\u007F-\u009F]/.test(word)) {
      return false;
    }
    
    return true;
  }

  private classifySpellingIssue(issue: SpellingIssue): 'whitelist_candidate' | 'spelling_error' | 'uncertain' {
    const word = issue.word.toLowerCase();
    
    // Check if already in whitelist
    if (this.cspellConfig.words.some(w => w.toLowerCase() === word)) {
      return 'whitelist_candidate'; // Should already be whitelisted
    }

    // Technical term indicators
    if (this.isTechnicalTerm(issue.word)) {
      return 'whitelist_candidate';
    }

    // Clear typo indicators
    if (this.isLikelyTypo(issue.word)) {
      return 'spelling_error';
    }

    // Context analysis
    const contextScore = this.analyzeContext(issue);
    if (contextScore > 0.7) {
      return 'whitelist_candidate';
    } else if (contextScore < 0.3) {
      return 'spelling_error';
    }

    return 'uncertain';
  }

  private isTechnicalTerm(word: string): boolean {
    const patterns = this.technicalPatterns;
    
    return !!(
      patterns.frameworks.test(word) ||
      patterns.jsKeywords.test(word) ||
      patterns.webTech.test(word) ||
      patterns.securityTerms.test(word) ||
      patterns.acronyms.test(word) ||
      patterns.versions.test(word) ||
      patterns.extensions.test(word) ||
      patterns.camelCase.test(word) ||
      patterns.pascalCase.test(word) ||
      patterns.snakeCase.test(word) ||
      patterns.kebabCase.test(word) ||
      patterns.hashes.test(word) ||
      patterns.domains.test(word) ||
      patterns.techSuffixes.test(word) ||
      patterns.avariceTerms.test(word)
    );
  }

  private isLikelyTypo(word: string): boolean {
    const patterns = this.typoPatterns;
    
    return !!(
      patterns.doubleLetter.test(word) ||
      patterns.swaps.test(word) ||
      patterns.contractions.test(word) ||
      patterns.prefixErrors.test(word)
    );
  }

  private analyzeContext(issue: SpellingIssue): number {
    const context = issue.context.toLowerCase();
    
    let score = 0.5; // Neutral starting point
    
    // Technical context indicators
    const techIndicators = [
      'function', 'class', 'interface', 'type', 'const', 'let', 'var',
      'import', 'export', 'component', 'hook', 'api', 'endpoint',
      'database', 'query', 'schema', 'model', 'service', 'config',
      'environment', 'deployment', 'ci/cd', 'testing', 'validation'
    ];
    
    for (const indicator of techIndicators) {
      if (context.includes(indicator)) {
        score += 0.2;
      }
    }
    
    // File type context
    if (issue.file.includes('.ts') || issue.file.includes('.js') || 
        issue.file.includes('.md') || issue.file.includes('.json')) {
      score += 0.1;
    }
    
    // A.V.A.R.I.C.E. Protocol context
    const avariceIndicators = [
      'avarice', 'protocol', 'agent', 'quest', 'phase', 'evidence',
      'memorization', 'validation', 'verification', 'grounding'
    ];
    
    for (const indicator of avariceIndicators) {
      if (context.includes(indicator)) {
        score += 0.3;
      }
    }
    
    // Documentation context
    if (issue.file.includes('docs/') || issue.file.includes('README')) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  private categorizeIssue(issue: SpellingIssue): 'technical_term' | 'proper_noun' | 'acronym' | 'typo' | 'unknown' {
    const word = issue.word;
    
    if (this.technicalPatterns.acronyms.test(word)) {
      return 'acronym';
    }
    
    if (this.isTechnicalTerm(word)) {
      return 'technical_term';
    }
    
    if (word.length > 1 && /^[A-Z]/.test(word)) {
      return 'proper_noun';
    }
    
    if (this.isLikelyTypo(word)) {
      return 'typo';
    }
    
    return 'unknown';
  }

  private calculateConfidence(issue: SpellingIssue): number {
    let confidence = 0.5;
    
    // Classification confidence
    if (issue.classification === 'whitelist_candidate') {
      confidence += 0.3;
    } else if (issue.classification === 'spelling_error') {
      confidence += 0.2;
    }
    
    // Category confidence
    if (issue.category === 'technical_term' || issue.category === 'acronym') {
      confidence += 0.2;
    } else if (issue.category === 'typo') {
      confidence += 0.25;
    }
    
    // Context confidence
    const contextScore = this.analyzeContext(issue);
    confidence += (contextScore - 0.5) * 0.2;
    
    // Suggestions confidence (fewer suggestions = more likely technical term)
    if (issue.suggestions && issue.suggestions.length > 0) {
      confidence += 0.1;
    } else {
      confidence += 0.15; // No suggestions often means technical term
    }
    
    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Analyze spelling issues with enhanced intelligence and quality metrics
   */
  private async analyzeSpellingIssues(): Promise<SpellingAnalysis> {
    await this.log('Performing intelligent analysis of spelling issues', 'info', {
      totalIssues: this.issues.length
    });
    
    const startAnalysisTime = Date.now();
    
    try {
      // Filter and categorize issues
      const whitelistCandidates = this.issues.filter(issue => 
        issue.classification === 'whitelist_candidate'
      );
      
      const spellingErrors = this.issues.filter(issue => 
        issue.classification === 'spelling_error'
      );
      
      const uncertainCases = this.issues.filter(issue => 
        issue.classification === 'uncertain'
      );
      
      // Group by category with immutable structure
      const byCategory: Record<string, readonly SpellingIssue[]> = {};
      for (const issue of this.issues) {
        if (!byCategory[issue.category]) {
          byCategory[issue.category] = [];
        }
        (byCategory[issue.category] as SpellingIssue[]).push(issue);
      }
      
      // Group by file with immutable structure
      const byFile: Record<string, readonly SpellingIssue[]> = {};
      for (const issue of this.issues) {
        if (!byFile[issue.file]) {
          byFile[issue.file] = [];
        }
        (byFile[issue.file] as SpellingIssue[]).push(issue);
      }
      
      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(startAnalysisTime);
      
      // Create evidence collection data
      const evidenceCollection = this.createAnalysisEvidenceCollection();
      
      this.analysis = {
        totalIssues: this.issues.length,
        whitelistCandidates: Object.freeze(whitelistCandidates),
        spellingErrors: Object.freeze(spellingErrors),
        uncertainCases: Object.freeze(uncertainCases),
        byCategory: Object.freeze(byCategory),
        byFile: Object.freeze(byFile),
        qualityMetrics,
        evidenceCollection
      };
      
      await this.log('Analysis complete', 'info', {
        whitelistCandidates: whitelistCandidates.length,
        spellingErrors: spellingErrors.length,
        uncertainCases: uncertainCases.length,
        qualityScore: qualityMetrics.accuracyScore,
        processingTime: qualityMetrics.processingTime
      });
      
      this.updateEvidenceData('analysis_completed', {
        totalIssues: this.issues.length,
        classifications: {
          whitelistCandidates: whitelistCandidates.length,
          spellingErrors: spellingErrors.length,
          uncertainCases: uncertainCases.length
        },
        qualityMetrics
      });
      
      return this.analysis;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.log(`Analysis failed: ${errorMessage}`, 'error');
      throw new Error(`Spelling analysis failed: ${errorMessage}`);
    }
  }
  
  /**
   * Calculate quality metrics for analysis
   */
  private calculateQualityMetrics(startTime: number): QualityMetrics {
    const processingTime = Date.now() - startTime;
    const filesProcessed = new Set(this.issues.map(issue => issue.file)).size;
    
    // Calculate accuracy score based on confidence distribution
    const totalConfidence = this.issues.reduce((sum, issue) => sum + issue.confidence, 0);
    const accuracyScore = this.issues.length > 0 ? totalConfidence / this.issues.length : 1.0;
    
    // Count security violations
    const securityViolations = this.issues.filter(issue => !issue.securityValidated).length;
    
    // Calculate performance score based on processing efficiency
    const issuesPerSecond = this.issues.length / (processingTime / 1000);
    const performanceScore = Math.min(issuesPerSecond / 10, 1.0); // Normalize to 0-1
    
    return {
      accuracyScore,
      processingTime,
      filesProcessed,
      securityViolations,
      performanceScore
    };
  }
  
  /**
   * Create evidence collection data for analysis
   */
  private createAnalysisEvidenceCollection(): AvariceEvidence {
    return {
      questId: `${this.evidenceData.questId}-analysis`,
      phaseNumber: 5,
      evidenceType: 'spelling_analysis',
      timestamp: new Date().toISOString(),
      data: {
        analysisMetrics: {
          totalIssues: this.issues.length,
          processingStartTime: this.startTime,
          traceId: this.traceId
        }
      },
      status: 'completed',
      qualityGates: []
    };
  }

  /**
   * Update whitelist with security validation and backup
   */
  private async updateWhitelist(): Promise<void> {
    if (!this.analysis) {
      throw new Error('Analysis must be performed before updating whitelist');
    }
    
    await this.log('Updating .cspell.json whitelist with high-confidence candidates', 'info');
    
    try {
      // Create backup before making changes
      await this.createConfigBackup();
      
      // Get validated words for whitelist
      const wordsToAdd = this.getValidatedWhitelistWords();
      
      if (wordsToAdd.length === 0) {
        await this.log('No new words to add to whitelist', 'info');
        return;
      }
      
      // Validate words for security before adding
      const safeWords = this.validateWhitelistWords(wordsToAdd);
      
      if (safeWords.length === 0) {
        await this.log('No safe words passed security validation', 'warn');
        return;
      }
      
      // Update configuration
      await this.updateConfigurationSafely(safeWords);
      
      await this.log(`Added ${safeWords.length} words to whitelist: ${safeWords.slice(0, 5).join(', ')}${safeWords.length > 5 ? '...' : ''}`, 'info', {
        wordsAdded: safeWords.length,
        totalWords: this.cspellConfig.words.length
      });
      
      // Update evidence
      this.updateEvidenceData('whitelist_updated', {
        wordsAdded: safeWords.length,
        totalWords: this.cspellConfig.words.length
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.log(`Failed to update whitelist: ${errorMessage}`, 'error');
      
      // Attempt to restore from backup
      await this.restoreConfigFromBackup();
      throw new Error(`Whitelist update failed: ${errorMessage}`);
    }
  }

  /**
   * Create backup of current configuration
   */
  private async createConfigBackup(): Promise<void> {
    try {
      const configPath = path.join(this.projectRoot, '.cspell.json');
      const backupPath = path.join(this.projectRoot, '.cspell.json.backup');
      
      const configContent = await fs.readFile(configPath, 'utf-8');
      await fs.writeFile(backupPath, configContent);
      
      await this.log('Configuration backup created', 'debug');
    } catch (error) {
      await this.log(`Failed to create backup: ${error}`, 'warn');
    }
  }

  /**
   * Get validated words for whitelist addition
   */
  private getValidatedWhitelistWords(): string[] {
    if (!this.analysis) return [];
    
    const newWords = new Set<string>();
    const threshold = ENTERPRISE_CONFIG.confidenceThreshold.medium;
    
    for (const issue of this.analysis.whitelistCandidates) {
      if (issue.confidence > threshold && issue.securityValidated) {
        newWords.add(issue.word);
      }
    }
    
    // Filter out words already in whitelist
    const currentWords = new Set(this.cspellConfig.words.map(w => w.toLowerCase()));
    
    return Array.from(newWords).filter(word => 
      !currentWords.has(word.toLowerCase())
    );
  }

  /**
   * Validate words for security before adding to whitelist
   */
  private validateWhitelistWords(words: string[]): string[] {
    const safeWords: string[] = [];
    
    for (const word of words) {
      // Security validation
      if (!this.securityValidator.validateWord(word)) {
        this.log(`Word failed security validation: ${word}`, 'warn').catch(() => {});
        continue;
      }
      
      // Length validation
      if (word.length > 50) {
        this.log(`Word too long: ${word}`, 'warn').catch(() => {});
        continue;
      }
      
      // Character validation
      if (!/^[a-zA-Z0-9._-]+$/.test(word)) {
        this.log(`Word contains invalid characters: ${word}`, 'warn').catch(() => {});
        continue;
      }
      
      safeWords.push(word);
    }
    
    return safeWords;
  }

  /**
   * Update configuration file safely with atomic operations
   */
  private async updateConfigurationSafely(wordsToAdd: string[]): Promise<void> {
    const configPath = path.join(this.projectRoot, '.cspell.json');
    const tempPath = configPath + '.tmp';
    
    try {
      // Create updated configuration
      const updatedConfig = {
        ...this.cspellConfig,
        words: [...this.cspellConfig.words, ...wordsToAdd].sort((a, b) => a.localeCompare(b))
      };
      
      // Write to temporary file first
      await fs.writeFile(tempPath, JSON.stringify(updatedConfig, null, 2));
      
      // Validate the temporary file
      const tempContent = await fs.readFile(tempPath, 'utf-8');
      JSON.parse(tempContent); // Validate JSON
      
      // Atomic replace
      await fs.rename(tempPath, configPath);
      
      // Update in-memory configuration
      (this.cspellConfig as { words: string[] }).words = updatedConfig.words;
      
    } catch (error) {
      // Clean up temporary file
      try {
        await fs.unlink(tempPath);
      } catch (cleanupError) {
        // Log cleanup failure but don't break the main error flow
        this.log(`Failed to cleanup temporary file: ${cleanupError}`, 'warn').catch(() => {});
      }
      throw error;
    }
  }

  /**
   * Restore configuration from backup
   */
  private async restoreConfigFromBackup(): Promise<void> {
    try {
      const configPath = path.join(this.projectRoot, '.cspell.json');
      const backupPath = path.join(this.projectRoot, '.cspell.json.backup');
      
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      await fs.writeFile(configPath, backupContent);
      
      await this.log('Configuration restored from backup', 'info');
    } catch (error) {
      await this.log(`Failed to restore from backup: ${error}`, 'error');
    }
  }

  /**
   * Generate comprehensive reports with enhanced security and evidence collection
   */
  private async generateReport(): Promise<void> {
    if (!this.analysis) {
      throw new Error('Analysis must be performed before generating report');
    }
    
    await this.log('Generating comprehensive spelling analysis report', 'info', {
      totalIssues: this.analysis.totalIssues,
      qualityScore: this.analysis.qualityMetrics.accuracyScore
    });
    
    try {
      // Ensure logs directory exists
      const logsDir = path.join(this.projectRoot, 'logs');
      await fs.mkdir(logsDir, { recursive: true });
      
      // Generate all report formats
      await Promise.all([
        this.generateDetailedJsonReport(logsDir),
        this.generateHumanReadableSummary(logsDir),
        this.generateEvidenceReport(logsDir),
        this.generateQualityGatesReport(logsDir)
      ]);
      
      await this.log('All reports generated successfully', 'info', {
        reportsGenerated: 4,
        outputDirectory: logsDir
      });
      
      this.updateEvidenceData('reports_generated', {
        reportCount: 4,
        outputDirectory: logsDir,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.log(`Report generation failed: ${errorMessage}`, 'error');
      throw new Error(`Report generation failed: ${errorMessage}`);
    }
  }
  
  /**
   * Generate detailed JSON report with security considerations
   */
  private async generateDetailedJsonReport(logsDir: string): Promise<void> {
    const reportPath = path.join(logsDir, 'spelling-analysis-report.json');
    
    // Sanitize analysis data for security
    const sanitizedAnalysis = this.sanitizeAnalysisForReport(this.analysis!);
    
    const detailedReport = {
      metadata: {
        timestamp: new Date().toISOString(),
        projectRoot: this.sanitizePathForReport(this.projectRoot),
        traceId: this.traceId,
        version: '2.0.0',
        protocol: 'A.V.A.R.I.C.E.'
      },
      metrics: {
        totalFiles: Object.keys(this.analysis!.byFile).length,
        totalIssues: this.analysis!.totalIssues,
        processingTime: this.analysis!.qualityMetrics.processingTime,
        accuracyScore: this.analysis!.qualityMetrics.accuracyScore,
        securityViolations: this.analysis!.qualityMetrics.securityViolations
      },
      analysis: sanitizedAnalysis,
      whitelist: {
        currentCount: this.cspellConfig.words.length,
        candidatesFound: this.analysis!.whitelistCandidates.length,
        highConfidenceCount: this.analysis!.whitelistCandidates.filter(i => 
          i.confidence > ENTERPRISE_CONFIG.confidenceThreshold.high
        ).length
      },
      recommendations: {
        highConfidenceWhitelist: this.analysis!.whitelistCandidates.filter(i => 
          i.confidence > ENTERPRISE_CONFIG.confidenceThreshold.high
        ).slice(0, 50), // Limit for performance
        clearSpellingErrors: this.analysis!.spellingErrors.filter(i => 
          i.confidence > ENTERPRISE_CONFIG.confidenceThreshold.medium
        ).slice(0, 50),
        needsReview: this.analysis!.uncertainCases.slice(0, 50)
      },
      qualityGates: this.qualityGates,
      evidence: this.evidenceData
    };
    
    await fs.writeFile(reportPath, JSON.stringify(detailedReport, null, 2));
    await this.log('Detailed JSON report generated', 'debug', { path: reportPath });
  }
  
  /**
   * Generate human-readable markdown summary
   */
  private async generateHumanReadableSummary(logsDir: string): Promise<void> {
    const summaryPath = path.join(logsDir, 'spelling-summary.md');
    
    const qualityGatesSummary = this.qualityGates.map(gate => {
      let statusIcon = '✅';
      if (gate.status === 'failed') {
        statusIcon = '❌';
      } else if (gate.status === 'warning') {
        statusIcon = '⚠️';
      }
      return `- **${gate.gateName}**: ${gate.status.toUpperCase()} ${statusIcon}`;
    }).join('\n');
    
    const summary = `# Enterprise Spelling Analysis Report

**Generated**: ${new Date().toISOString()}  
**Project**: ${path.basename(this.projectRoot)}  
**Trace ID**: ${this.traceId}  
**Protocol**: A.V.A.R.I.C.E. Phase 5 - Multi-layer Verification

## 📊 Executive Summary

- **Total Issues Found**: ${this.analysis!.totalIssues}
- **Files Affected**: ${Object.keys(this.analysis!.byFile).length}
- **Processing Time**: ${(this.analysis!.qualityMetrics.processingTime / 1000).toFixed(2)}s
- **Accuracy Score**: ${(this.analysis!.qualityMetrics.accuracyScore * 100).toFixed(1)}%
- **Security Violations**: ${this.analysis!.qualityMetrics.securityViolations}

## 🎯 Classifications

### Whitelist Candidates (${this.analysis!.whitelistCandidates.length})
${this.analysis!.whitelistCandidates.slice(0, 10).map(issue => 
  `- \`${issue.word}\` (${issue.category}, confidence: ${(issue.confidence * 100).toFixed(0)}%, risk: ${issue.riskLevel})`
).join('\n')}
${this.analysis!.whitelistCandidates.length > 10 ? `\n... and ${this.analysis!.whitelistCandidates.length - 10} more` : ''}

### Spelling Errors (${this.analysis!.spellingErrors.length})
${this.analysis!.spellingErrors.slice(0, 10).map(issue => 
  `- \`${issue.word}\` → ${issue.suggestions?.slice(0, 3).join(', ') || 'no suggestions'} (${path.basename(issue.file)}:${issue.line})`
).join('\n')}
${this.analysis!.spellingErrors.length > 10 ? `\n... and ${this.analysis!.spellingErrors.length - 10} more` : ''}

### By Category
${Object.entries(this.analysis!.byCategory).map(([category, issues]) => 
  `- **${category}**: ${issues.length} issues`
).join('\n')}

## 🚪 Quality Gates Status

${qualityGatesSummary}

## 🔧 Recommendations

### High Priority Actions
1. **Add to Whitelist**: ${this.analysis!.whitelistCandidates.filter(i => 
   i.confidence > ENTERPRISE_CONFIG.confidenceThreshold.high
).length} high-confidence technical terms
2. **Fix Spelling Errors**: ${this.analysis!.spellingErrors.filter(i => 
   i.confidence > ENTERPRISE_CONFIG.confidenceThreshold.medium
).length} clear typos
3. **Manual Review**: ${this.analysis!.uncertainCases.length} uncertain cases

### Files Requiring Attention (Top 10)
${Object.entries(this.analysis!.byFile)
  .sort(([,a], [,b]) => b.length - a.length)
  .slice(0, 10)
  .map(([file, issues]) => `- ${path.basename(file)}: ${issues.length} issues`)
  .join('\n')}

## 🔒 Security Assessment

- **Security Violations**: ${this.analysis!.qualityMetrics.securityViolations}
- **Risk Assessment**: ${this.analysis!.qualityMetrics.securityViolations === 0 ? 'LOW' : 'MEDIUM'}
- **Validation Status**: ${this.securityValidator.isViolationLimitExceeded() ? 'FAILED' : 'PASSED'}

---
*Generated by Enhanced Spelling Agent v2.0.0 - A.V.A.R.I.C.E. Protocol*  
*Trace ID: ${this.traceId}*
`;
    
    await fs.writeFile(summaryPath, summary);
    await this.log('Human-readable summary generated', 'debug', { path: summaryPath });
  }
  
  /**
   * Generate A.V.A.R.I.C.E. Protocol evidence report
   */
  private async generateEvidenceReport(logsDir: string): Promise<void> {
    const evidencePath = path.join(logsDir, 'avarice-evidence-report.json');
    
    const evidenceReport = {
      questId: this.evidenceData.questId,
      phaseNumber: this.evidenceData.phaseNumber,
      evidenceType: this.evidenceData.evidenceType,
      timestamp: this.evidenceData.timestamp,
      status: this.evidenceData.status,
      traceId: this.traceId,
      qualityGates: this.qualityGates,
      metrics: this.analysis!.qualityMetrics,
      data: this.evidenceData.data,
      neo4jCompatible: {
        nodeType: 'SpellingAnalysisEvidence',
        properties: {
          questId: this.evidenceData.questId,
          phaseNumber: this.evidenceData.phaseNumber,
          timestamp: this.evidenceData.timestamp,
          status: this.evidenceData.status,
          traceId: this.traceId,
          totalIssues: this.analysis!.totalIssues,
          accuracyScore: this.analysis!.qualityMetrics.accuracyScore
        },
        relationships: {
          HAS_QUALITY_GATES: this.qualityGates.map(gate => ({
            nodeType: 'QualityGate',
            properties: gate
          }))
        }
      }
    };
    
    await fs.writeFile(evidencePath, JSON.stringify(evidenceReport, null, 2));
    await this.log('A.V.A.R.I.C.E. evidence report generated', 'debug', { path: evidencePath });
  }
  
  /**
   * Generate quality gates detailed report
   */
  private async generateQualityGatesReport(logsDir: string): Promise<void> {
    const qualityGatesPath = path.join(logsDir, 'quality-gates-report.json');
    
    const qualityGatesReport = {
      timestamp: new Date().toISOString(),
      traceId: this.traceId,
      overallStatus: this.evaluateQualityGates(),
      gates: this.qualityGates,
      summary: {
        total: this.qualityGates.length,
        passed: this.qualityGates.filter(g => g.status === 'passed').length,
        failed: this.qualityGates.filter(g => g.status === 'failed').length,
        warnings: this.qualityGates.filter(g => g.status === 'warning').length
      },
      recommendations: this.qualityGates
        .filter(gate => gate.recommendations.length > 0)
        .map(gate => ({
          gateName: gate.gateName,
          status: gate.status,
          recommendations: gate.recommendations
        }))
    };
    
    await fs.writeFile(qualityGatesPath, JSON.stringify(qualityGatesReport, null, 2));
    await this.log('Quality gates report generated', 'debug', { path: qualityGatesPath });
  }
  
  /**
   * Sanitize analysis data for security in reports
   */
  private sanitizeAnalysisForReport(analysis: SpellingAnalysis): Partial<SpellingAnalysis> {
    return {
      totalIssues: analysis.totalIssues,
      whitelistCandidates: analysis.whitelistCandidates.slice(0, 100), // Limit for performance
      spellingErrors: analysis.spellingErrors.slice(0, 100),
      uncertainCases: analysis.uncertainCases.slice(0, 100),
      qualityMetrics: analysis.qualityMetrics
      // Exclude byCategory and byFile for security - they may contain sensitive paths
    };
  }
  
  /**
   * Sanitize file path for security in reports
   */
  private sanitizePathForReport(filePath: string): string {
    // Remove sensitive path components and return basename only
    return path.basename(filePath);
  }

  /**
   * Validate changes with comprehensive quality gates
   */
  private async validateChanges(): Promise<void> {
    await this.log('Validating spelling changes and running verification', 'info');
    
    try {
      // Quality Gate 1: Re-run spell check to validate improvements
      const spellingGate = await this.validateSpellingImprovements();
      this.qualityGates.push(spellingGate);
      
      // Quality Gate 2: Validate configuration integrity
      const configGate = await this.validateConfigurationIntegrity();
      this.qualityGates.push(configGate);
      
      // Quality Gate 3: Security validation
      const securityGate = await this.validateSecurityCompliance();
      this.qualityGates.push(securityGate);
      
      // Quality Gate 4: Performance validation
      const performanceGate = await this.validatePerformanceMetrics();
      this.qualityGates.push(performanceGate);
      
      // Evaluate overall quality gates
      const overallStatus = this.evaluateQualityGates();
      
      if (overallStatus === 'passed') {
        await this.log('All quality gates passed - validation complete', 'info');
        this.updateEvidenceData('validation_passed', { qualityGates: this.qualityGates });
      } else {
        await this.log('Some quality gates failed - manual review required', 'warn');
        this.updateEvidenceData('validation_failed', { qualityGates: this.qualityGates });
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.log(`Validation failed: ${errorMessage}`, 'error');
      
      this.qualityGates.push({
        gateName: 'validation_execution',
        status: 'failed',
        metrics: { errorCount: 1 },
        recommendations: ['Review validation errors and retry']
      });
      
      throw new Error(`Validation failed: ${errorMessage}`);
    }
  }

  /**
   * Validate spelling improvements after changes
   */
  private async validateSpellingImprovements(): Promise<QualityGateResult> {
    try {
      const command = 'npx cspell "**/*" --no-progress --quiet';
      await execAsync(command, {
        cwd: this.projectRoot,
        timeout: ENTERPRISE_CONFIG.maxExecutionTime
      });
      
      return {
        gateName: 'spelling_validation',
        status: 'passed',
        metrics: { errorCount: 0 },
        recommendations: ['No spelling errors detected']
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        gateName: 'spelling_validation',
        status: 'warning',
        metrics: { errorCount: 1 },
        recommendations: [`Some spelling issues remain: ${errorMessage}`, 'Review detailed report']
      };
    }
  }

  /**
   * Validate configuration file integrity
   */
  private async validateConfigurationIntegrity(): Promise<QualityGateResult> {
    try {
      const configPath = path.join(this.projectRoot, '.cspell.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      
      // Validate JSON structure
      const config = JSON.parse(configContent);
      this.validateCSpellConfigStructure(config);
      
      return {
        gateName: 'configuration_integrity',
        status: 'passed',
        metrics: { wordsCount: config.words?.length || 0 },
        recommendations: ['Configuration file is valid and intact']
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        gateName: 'configuration_integrity',
        status: 'failed',
        metrics: { errorCount: 1 },
        recommendations: [`Fix configuration file corruption: ${errorMessage}`, 'Restore from backup if necessary']
      };
    }
  }

  /**
   * Validate security compliance
   */
  private async validateSecurityCompliance(): Promise<QualityGateResult> {
    const violations = this.securityValidator.getViolationCount();
    
    return {
      gateName: 'security_compliance',
      status: violations === 0 ? 'passed' : 'failed',
      metrics: { violationCount: violations },
      recommendations: violations === 0 
        ? ['All security validations passed']
        : ['Review and fix security violations', 'Check logs for detailed security issues']
    };
  }

  /**
   * Validate performance metrics
   */
  private async validatePerformanceMetrics(): Promise<QualityGateResult> {
    const processingTime = Date.now() - this.startTime;
    const maxProcessingTime = 300000; // 5 minutes
    
    const metricsData = {
      processingTime,
      filesProcessed: this.analysis?.qualityMetrics.filesProcessed || 0,
      issuesProcessed: this.issues.length
    };
    
    if (processingTime > maxProcessingTime) {
      return {
        gateName: 'performance_metrics',
        status: 'warning',
        metrics: metricsData,
        recommendations: ['Consider optimizing processing for large codebases', 'Review timeout configurations']
      };
    }
    
    return {
      gateName: 'performance_metrics',
      status: 'passed',
      metrics: metricsData,
      recommendations: ['Performance metrics within acceptable limits']
    };
  }

  /**
   * Evaluate overall quality gates status
   */
  private evaluateQualityGates(): 'passed' | 'warning' | 'failed' {
    const failedGates = this.qualityGates.filter(gate => gate.status === 'failed');
    const warningGates = this.qualityGates.filter(gate => gate.status === 'warning');
    
    if (failedGates.length > 0) {
      return 'failed';
    }
    
    if (warningGates.length > 0) {
      return 'warning';
    }
    
    return 'passed';
  }

  /**
   * Main execution method - deploys enterprise-grade spelling analysis
   * Following A.V.A.R.I.C.E. Protocol Phase 5: Multi-layer Verification
   */
  public async deployEnterpriseSpellingAnalysis(): Promise<AvariceEvidence> {
    await this.log('DEPLOYING ENTERPRISE-GRADE SPELLING AGENT', 'info', {
      traceId: this.traceId,
      phase: 'Phase 5: Multi-layer Verification',
      protocol: 'A.V.A.R.I.C.E.'
    });
    
    this.evidenceData.status = 'in_progress';
    
    try {
      // Phase 1: Security initialization and validation
      await this.initializeSecurityFramework();
      
      // Phase 2: Full-scale codebase spell check with security
      await this.runFullSpellCheck();
      
      // Phase 3: Intelligent analysis and classification
      await this.analyzeSpellingIssues();
      
      // Phase 4: Secure whitelist updates with backup
      await this.updateWhitelist();
      
      // Phase 5: Comprehensive reporting with evidence collection
      await this.generateReport();
      
      // Phase 6: Multi-layer validation with quality gates
      await this.validateChanges();
      
      // Phase 7: A.V.A.R.I.C.E. Protocol evidence finalization
      await this.finalizeEvidenceCollection();
      
      // Phase 8: Autonomous termination criteria evaluation
      const terminationDecision = await this.evaluateTerminationCriteria();
      
      await this.log('ENTERPRISE SPELLING ANALYSIS DEPLOYMENT COMPLETE', 'info', {
        totalIssues: this.analysis?.totalIssues || 0,
        qualityGatesPassed: this.qualityGates.filter(g => g.status === 'passed').length,
        terminationStatus: terminationDecision.shouldTerminate ? 'autonomous' : 'manual_review_required'
      });
      
      if (this.analysis) {
        await this.log('FINAL SUMMARY:', 'info', {
          totalIssues: this.analysis.totalIssues,
          whitelistCandidates: this.analysis.whitelistCandidates.length,
          spellingErrors: this.analysis.spellingErrors.length,
          highConfidenceAdditions: this.analysis.whitelistCandidates.filter(i => 
            i.confidence > ENTERPRISE_CONFIG.confidenceThreshold.medium
          ).length,
          qualityGatesStatus: this.evaluateQualityGates(),
          processingTime: Date.now() - this.startTime
        });
      }
      
      this.evidenceData.status = 'completed';
      return this.evidenceData;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.log(`SPELLING ANALYSIS FAILED: ${errorMessage}`, 'error', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        traceId: this.traceId
      });
      
      this.evidenceData.status = 'failed';
      this.updateEvidenceData('deployment_failed', { error: errorMessage });
      
      throw new Error(`Enterprise spelling analysis failed: ${errorMessage}`);
    }
  }

  /**
   * Initialize security framework for enterprise operation
   */
  private async initializeSecurityFramework(): Promise<void> {
    await this.log('Initializing enterprise security framework', 'info');
    
    // Validate environment security
    this.securityValidator.validateEnvironment(this.projectRoot);
    
    // Initialize secure logging
    await this.log('Security framework initialized', 'debug', {
      maxBufferSize: ENTERPRISE_CONFIG.maxBufferSize,
      maxExecutionTime: ENTERPRISE_CONFIG.maxExecutionTime,
      securityValidation: 'enabled'
    });
    
    this.updateEvidenceData('security_initialized', {
      timestamp: new Date().toISOString(),
      validations: ['environment', 'logging', 'configuration']
    });
  }

  /**
   * Finalize evidence collection for A.V.A.R.I.C.E. Protocol
   */
  private async finalizeEvidenceCollection(): Promise<void> {
    await this.log('Finalizing A.V.A.R.I.C.E. Protocol evidence collection', 'info');
    
    // Update evidence with final quality gates
    this.evidenceData.qualityGates = this.qualityGates;
    
    // Generate evidence summary
    const evidenceSummary = {
      totalIssuesProcessed: this.issues.length,
      whitelistWordsAdded: this.analysis?.whitelistCandidates.filter(i => 
        i.confidence > ENTERPRISE_CONFIG.confidenceThreshold.medium
      ).length || 0,
      qualityGatesPassed: this.qualityGates.filter(g => g.status === 'passed').length,
      qualityGatesFailed: this.qualityGates.filter(g => g.status === 'failed').length,
      securityViolations: this.securityValidator.getViolationCount(),
      processingDuration: Date.now() - this.startTime
    };
    
    this.updateEvidenceData('evidence_finalized', evidenceSummary);
    
    // Store evidence in structured format for Neo4j integration
    await this.storeEvidenceForNeo4j();
    
    await this.log('Evidence collection finalized', 'info', evidenceSummary);
  }

  /**
   * Store evidence in Neo4j-compatible format
   */
  private async storeEvidenceForNeo4j(): Promise<void> {
    try {
      const evidencePath = path.join(this.projectRoot, 'logs', 'avarice-evidence.json');
      
      const neo4jEvidence = {
        nodeType: 'SpellingAnalysisEvidence',
        properties: {
          questId: this.evidenceData.questId,
          phaseNumber: this.evidenceData.phaseNumber,
          timestamp: this.evidenceData.timestamp,
          status: this.evidenceData.status,
          traceId: this.traceId
        },
        relationships: {
          CONTAINS_QUALITY_GATES: this.qualityGates.map(gate => ({
            nodeType: 'QualityGate',
            properties: gate
          })),
          ANALYZED_ISSUES: this.issues.slice(0, 100).map(issue => ({ // Limit for performance
            nodeType: 'SpellingIssue',
            properties: issue
          }))
        },
        metadata: this.evidenceData.data
      };
      
      await fs.writeFile(evidencePath, JSON.stringify(neo4jEvidence, null, 2));
      await this.log('Evidence stored for Neo4j integration', 'debug');
      
    } catch (error) {
      await this.log(`Failed to store Neo4j evidence: ${error}`, 'warn');
    }
  }

  /**
   * Evaluate autonomous termination criteria
   */
  private async evaluateTerminationCriteria(): Promise<{shouldTerminate: boolean, reason: string}> {
    await this.log('Evaluating autonomous termination criteria', 'info');
    
    // Criteria 1: All quality gates must pass or have acceptable warnings
    const failedGates = this.qualityGates.filter(gate => gate.status === 'failed');
    if (failedGates.length > 0) {
      return {
        shouldTerminate: false,
        reason: `${failedGates.length} quality gates failed - manual review required`
      };
    }
    
    // Criteria 2: Security violations must be zero
    const securityViolations = this.securityValidator.getViolationCount();
    if (securityViolations > 0) {
      return {
        shouldTerminate: false,
        reason: `${securityViolations} security violations detected - manual review required`
      };
    }
    
    // Criteria 3: Evidence collection must be complete
    if (this.evidenceData.status !== 'completed') {
      return {
        shouldTerminate: false,
        reason: 'Evidence collection incomplete - manual review required'
      };
    }
    
    // All criteria met - autonomous termination approved
    return {
      shouldTerminate: true,
      reason: 'All quality gates passed, zero security violations, evidence collection complete'
    };
  }

  /**
   * Static method for CLI usage with enhanced error handling
   */
  public static async run(projectRoot?: string): Promise<AvariceEvidence> {
    let agent: EnhancedSpellingAgent;
    
    try {
      agent = new EnhancedSpellingAgent(projectRoot);
      const evidence = await agent.deployEnterpriseSpellingAnalysis();
      
      // Log successful completion
      console.log('✓ Enhanced Spelling Agent completed successfully');
      console.log(`📊 Evidence ID: ${evidence.questId}`);
      console.log(`🔍 Trace ID: ${agent.traceId}`);
      
      return evidence;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error('✗ Enhanced Spelling Agent failed:', errorMessage);
      
      // If agent was created, try to get partial evidence
      if (agent!) {
        try {
          agent.evidenceData.status = 'failed';
          agent.updateEvidenceData('cli_execution_failed', { error: errorMessage });
          return agent.evidenceData;
        } catch {
          // Ignore errors in error handling
        }
      }
      
      throw new Error(`Enhanced Spelling Agent execution failed: ${errorMessage}`);
    }
  }

  /**
   * Get current trace ID for debugging
   */
  public getTraceId(): string {
    return this.traceId;
  }

  /**
   * Get quality gates results
   */
  public getQualityGates(): readonly QualityGateResult[] {
    return [...this.qualityGates];
  }

  /**
   * Get evidence data
   */
  public getEvidenceData(): Readonly<AvariceEvidence> {
    return { ...this.evidenceData };
  }
}

/**
 * Security Validator Class for enterprise-grade security validation
 */
class SecurityValidator {
  private violationCount = 0;
  private readonly maxViolations = 10;

  /**
   * Validate environment security
   */
  validateEnvironment(projectRoot: string): void {
    // Validate project root is not a system directory
    const systemDirectories = ['/etc', '/bin', '/sbin', '/usr/bin', '/usr/sbin', '/var', '/tmp'];
    
    if (systemDirectories.some(sysDir => projectRoot.startsWith(sysDir))) {
      this.violationCount++;
      throw new Error('Security violation: Project root in system directory');
    }
    
    // Validate write permissions
    try {
      accessSync(projectRoot, fsConstants.W_OK);
    } catch (error) {
      this.violationCount++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Security violation: Insufficient write permissions - ${errorMessage}`);
    }
  }

  /**
   * Validate spelling issue for security
   */
  validateIssue(issue: Partial<SpellingIssue>): boolean {
    if (!issue.word || !issue.file) {
      return false;
    }
    
    // Check for suspicious file paths
    if (issue.file.includes('..') || issue.file.includes('~')) {
      this.violationCount++;
      return false;
    }
    
    // Check for suspicious words (potential command injection)
    const suspiciousPatterns = [
      /exec|eval|system|spawn/i,
      /rm\s+|del\s+|format\s+/i,
      /sudo|chmod|chown/i,
      /[<>|&;`$(){}]/
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(issue.word!))) {
      this.violationCount++;
      return false;
    }
    
    return true;
  }

  /**
   * Validate word for whitelist addition
   */
  validateWord(word: string): boolean {
    // Basic security checks
    if (!word || typeof word !== 'string') {
      return false;
    }
    
    // Check for control characters
    if (/[\u0000-\u001F\u007F-\u009F]/.test(word)) {
      this.violationCount++;
      return false;
    }
    
    // Check for script injection patterns
    if (/<script|javascript:|data:/i.test(word)) {
      this.violationCount++;
      return false;
    }
    
    return true;
  }

  /**
   * Get current violation count
   */
  getViolationCount(): number {
    return this.violationCount;
  }

  /**
   * Check if violation limit exceeded
   */
  isViolationLimitExceeded(): boolean {
    return this.violationCount >= this.maxViolations;
  }
}

// CLI execution with enhanced error handling
if (require.main === module) {
  EnhancedSpellingAgent.run().then((evidence) => {
    console.log('\n📋 Final Evidence Summary:');
    console.log(`   Quest ID: ${evidence.questId}`);
    console.log(`   Phase: ${evidence.phaseNumber}`);
    console.log(`   Status: ${evidence.status}`);
    console.log(`   Quality Gates: ${evidence.qualityGates.length}`);
    
    process.exit(0);
  }).catch(error => {
    console.error('\n✗ CRITICAL FAILURE:', error.message);
    console.error('\n• Troubleshooting:');
    console.error('   1. Check project root permissions');
    console.error('   2. Verify .cspell.json exists and is valid');
    console.error('   3. Ensure sufficient disk space for logs');
    console.error('   4. Review security configuration');
    
    process.exit(1);
  });
}

export { EnhancedSpellingAgent, SecurityValidator, type AvariceEvidence, type QualityGateResult };