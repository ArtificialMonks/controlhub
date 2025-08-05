// src/lib/security/filterSecurity.ts
/**
 * Comprehensive Security Validation for Filtering
 * Quest 4.3 - Expert Council Validated Implementation
 * 
 * Critical Enhancement: Comprehensive Security Validation
 * Expert Consensus: 100% (6/6 experts)
 * Priority: HIGH
 */

import DOMPurify from 'dompurify'
import {
  SanitizationConfig,
  SanitizedInput,
  SecurityValidation,
  DEFAULT_SANITIZATION_CONFIG,
  FilterError
} from '@/lib/types/filtering'
import { AutomationStatus } from '@/lib/types/automation'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a validation error
 */
function createValidationError(
  message: string,
  field?: string,
  value?: unknown
): FilterError {
  return {
    type: 'validation',
    message,
    details: { field, value },
    timestamp: new Date(),
    correlationId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    recovery: [
      'Check your input format',
      'Try a different search term',
      'Clear the field and try again'
    ]
  }
}

// ============================================================================
// SECURITY CONSTANTS
// ============================================================================

/**
 * Malicious patterns to detect and block
 * Security Expert: Comprehensive pattern detection
 */
const MALICIOUS_PATTERNS = [
  // XSS patterns
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:text\/html/gi,
  
  // SQL injection patterns
  /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\s+(INTO|FROM|TABLE|DATABASE)/gi,
  /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b/gi,
  /\b(OR|AND)\s+\d+\s*=\s*\d+/gi,
  /(';|'--|--)/gi,
  
  // Command injection patterns
  /(\||&|;|\$\(|\`)/gi,
  /(rm\s|del\s|format\s|shutdown\s)/gi,
  
  // Path traversal patterns
  /(\.\.\/|\.\.\\)/gi,
  /(\.\.\%2f|\.\.\%5c)/gi,
  
  // LDAP injection patterns
  /(\*|\(|\)|\\|\/|\+|=|<|>|;|,|")/gi
]

/**
 * Suspicious character sequences
 */
const SUSPICIOUS_SEQUENCES = [
  'eval(',
  'Function(',
  'setTimeout(',
  'setInterval(',
  'document.',
  'window.',
  'location.',
  'alert(',
  'confirm(',
  'prompt('
]

/**
 * Maximum allowed lengths for different input types
 */
const MAX_LENGTHS = {
  search: 100,
  clientId: 50,
  statusArray: 10
}

// ============================================================================
// ADVANCED INPUT SANITIZATION
// ============================================================================

/**
 * Advanced Input Sanitization Class
 * Security Expert: Comprehensive sanitization with edge case handling
 */
export class AdvancedInputSanitizer {
  private config: SanitizationConfig

  constructor(config: Partial<SanitizationConfig> = {}) {
    this.config = { ...DEFAULT_SANITIZATION_CONFIG, ...config }
  }

  /**
   * Sanitize search input with comprehensive validation
   */
  sanitizeSearchInput(input: string): SanitizedInput {
    const original = input
    let sanitized = input
    const warnings: string[] = []
    let wasSanitized = false

    try {
      // Step 1: Basic validation
      if (typeof input !== 'string') {
        throw createValidationError('Input must be a string', 'search', input)
      }

      // Step 1.5: Handle empty strings early
      if (input.length === 0) {
        return {
          original,
          sanitized: '',
          wasSanitized: false,
          warnings: []
        }
      }

      // Step 2: Length validation
      if (input.length > this.config.maxLength) {
        sanitized = input.substring(0, this.config.maxLength)
        warnings.push(`Input truncated to ${this.config.maxLength} characters`)
        wasSanitized = true
      }

      // Step 3: Malicious pattern detection
      if (this.checkMaliciousPatterns(sanitized)) {
        throw createValidationError(
          'Input contains potentially malicious patterns',
          'search',
          { input: sanitized, patterns: 'detected' }
        )
      }

      // Step 4: Suspicious sequence detection
      const suspiciousFound = this.checkSuspiciousSequences(sanitized)
      if (suspiciousFound.length > 0) {
        warnings.push(`Suspicious sequences detected: ${suspiciousFound.join(', ')}`)
        // Remove suspicious sequences
        suspiciousFound.forEach(seq => {
          sanitized = sanitized.replace(new RegExp(seq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '')
        })
        wasSanitized = true
      }

      // Step 5: Character pattern validation
      if (this.config.allowedPattern && !this.config.allowedPattern.test(sanitized)) {
        // Remove disallowed characters
        sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_.@]/g, '')
        warnings.push('Disallowed characters removed')
        wasSanitized = true
      }

      // Step 6: Blocked pattern removal
      if (this.config.blockedPattern) {
        const beforeBlocked = sanitized
        sanitized = sanitized.replace(this.config.blockedPattern, '')
        if (beforeBlocked !== sanitized) {
          warnings.push('Blocked characters removed')
          wasSanitized = true
        }
      }

      // Step 7: HTML sanitization
      if (this.config.htmlSanitization) {
        const beforeHtml = sanitized
        sanitized = DOMPurify.sanitize(sanitized, {
          ALLOWED_TAGS: this.config.htmlSanitization.allowedTags,
          ALLOWED_ATTR: this.config.htmlSanitization.allowedAttributes
        })
        if (beforeHtml !== sanitized) {
          warnings.push('HTML content sanitized')
          wasSanitized = true
        }
      }

      // Step 8: Final cleanup
      const beforeTrim = sanitized
      sanitized = sanitized.trim()
      if (beforeTrim !== sanitized) {
        wasSanitized = true
      }

      // Handle whitespace-only strings
      if (original.trim().length === 0 && original.length > 0) {
        wasSanitized = true
      }

      return {
        original,
        sanitized,
        wasSanitized,
        warnings
      }

    } catch (error) {
      // Security violation - return empty sanitized input
      return {
        original,
        sanitized: '',
        wasSanitized: true,
        warnings: [`Security violation: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  /**
   * Check for malicious patterns
   */
  private checkMaliciousPatterns(input: string): boolean {
    return MALICIOUS_PATTERNS.some(pattern => pattern.test(input))
  }

  /**
   * Check for suspicious sequences
   */
  private checkSuspiciousSequences(input: string): string[] {
    return SUSPICIOUS_SEQUENCES.filter(seq => 
      input.toLowerCase().includes(seq.toLowerCase())
    )
  }

  /**
   * Validate client ID
   */
  validateClientId(clientId: string | null): boolean {
    if (clientId === null) return true
    
    if (typeof clientId !== 'string') return false
    if (clientId.length === 0) return false
    if (clientId.length > MAX_LENGTHS.clientId) return false
    
    // Client ID should be alphanumeric with hyphens/underscores
    const clientIdPattern = /^[a-zA-Z0-9\-_]+$/
    return clientIdPattern.test(clientId)
  }

  /**
   * Validate status array
   */
  validateStatusArray(statuses: AutomationStatus[]): boolean {
    if (!Array.isArray(statuses)) return false
    if (statuses.length > MAX_LENGTHS.statusArray) return false
    
    const validStatuses: AutomationStatus[] = ['Running', 'Stopped', 'Error', 'Stalled']
    return statuses.every(status => validStatuses.includes(status))
  }
}

// ============================================================================
// SECURITY VALIDATION IMPLEMENTATION
// ============================================================================

/**
 * Security Validation Implementation
 * Implements the SecurityValidation interface with comprehensive validation
 */
export class FilterSecurityValidator implements SecurityValidation {
  private sanitizer: AdvancedInputSanitizer

  constructor(config: Partial<SanitizationConfig> = {}) {
    this.sanitizer = new AdvancedInputSanitizer(config)
  }

  /**
   * Sanitize search input
   */
  sanitizeSearchInput(input: string): SanitizedInput {
    return this.sanitizer.sanitizeSearchInput(input)
  }

  /**
   * Validate client ID
   */
  validateClientId(clientId: string | null): boolean {
    return this.sanitizer.validateClientId(clientId)
  }

  /**
   * Validate status array
   */
  validateStatusArray(statuses: AutomationStatus[]): boolean {
    return this.sanitizer.validateStatusArray(statuses)
  }

  /**
   * Check for malicious patterns
   */
  checkMaliciousPatterns(input: string): boolean {
    return MALICIOUS_PATTERNS.some(pattern => pattern.test(input))
  }
}

// ============================================================================
// SECURITY TESTING UTILITIES
// ============================================================================

/**
 * Security test cases for edge case validation
 * Security Expert: Comprehensive edge case testing
 */
export const SECURITY_TEST_CASES = {
  xss: [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    '<img src="x" onerror="alert(1)">',
    '<svg onload="alert(1)">',
    'data:text/html,<script>alert(1)</script>'
  ],
  
  sqlInjection: [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "admin'--",
    "1; DELETE FROM users",
    "UNION SELECT * FROM passwords"
  ],
  
  commandInjection: [
    "; rm -rf /",
    "| cat /etc/passwd",
    "$(whoami)",
    "`id`",
    "&& shutdown -h now"
  ],
  
  pathTraversal: [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2f",
    "....//....//....//etc/passwd"
  ],
  
  ldapInjection: [
    "*)(uid=*",
    "admin)(|(password=*))",
    "*)(&(objectClass=user))",
    "*))%00"
  ]
}

/**
 * Run security validation tests
 */
export function runSecurityTests(validator: FilterSecurityValidator): {
  passed: number
  failed: number
  results: Array<{ test: string; input: string; passed: boolean; details?: string }>
} {
  const results: Array<{ test: string; input: string; passed: boolean; details?: string }> = []
  let passed = 0
  let failed = 0

  // Test all security test cases
  Object.entries(SECURITY_TEST_CASES).forEach(([testType, testCases]) => {
    testCases.forEach(testInput => {
      try {
        const sanitized = validator.sanitizeSearchInput(testInput)
        
        // Test should pass if input was sanitized or blocked
        const testPassed = sanitized.wasSanitized || sanitized.sanitized === ''
        
        results.push({
          test: testType,
          input: testInput,
          passed: testPassed,
          details: testPassed ? 'Input properly sanitized' : 'Input not sanitized'
        })
        
        if (testPassed) {
          passed++
        } else {
          failed++
        }
      } catch (error) {
        // Exceptions are considered passed (input was rejected)
        results.push({
          test: testType,
          input: testInput,
          passed: true,
          details: `Input rejected: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
        passed++
      }
    })
  })

  return { passed, failed, results }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FilterSecurityValidator
