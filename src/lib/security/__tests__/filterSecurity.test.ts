// src/lib/security/__tests__/filterSecurity.test.ts
/**
 * Comprehensive Security Validation Tests
 * Quest 4.3 - Expert Council Validated Implementation
 * 
 * Critical Enhancement: Security Edge Case Testing
 * Expert Consensus: 100% (6/6 experts)
 * Priority: HIGH
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { 
  FilterSecurityValidator, 
  AdvancedInputSanitizer,
  SECURITY_TEST_CASES,
  runSecurityTests
} from '../filterSecurity'
import { DEFAULT_SANITIZATION_CONFIG } from '@/lib/types/filtering'

describe('FilterSecurityValidator', () => {
  let validator: FilterSecurityValidator
  let sanitizer: AdvancedInputSanitizer

  beforeEach(() => {
    validator = new FilterSecurityValidator()
    sanitizer = new AdvancedInputSanitizer()
  })

  describe('Search Input Sanitization', () => {
    it('should sanitize basic XSS attempts', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">'
      ]

      maliciousInputs.forEach(input => {
        const result = validator.sanitizeSearchInput(input)
        expect(result.wasSanitized).toBe(true)
        expect(result.sanitized).not.toContain('<script')
        expect(result.sanitized).not.toContain('javascript:')
        expect(result.sanitized).not.toContain('onerror')
        expect(result.sanitized).not.toContain('onload')
        expect(result.warnings.length).toBeGreaterThan(0)
      })
    })

    it('should sanitize SQL injection attempts', () => {
      const sqlInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "UNION SELECT * FROM passwords"
      ]

      sqlInputs.forEach(input => {
        const result = validator.sanitizeSearchInput(input)
        expect(result.wasSanitized).toBe(true)
        expect(result.sanitized).not.toContain('DROP')
        expect(result.sanitized).not.toContain('UNION')
        expect(result.sanitized).not.toContain('SELECT')
        expect(result.warnings.length).toBeGreaterThan(0)
      })
    })

    it('should sanitize command injection attempts', () => {
      const commandInputs = [
        "; rm -rf /",
        "| cat /etc/passwd",
        "$(whoami)",
        "`id`",
        "&& shutdown -h now"
      ]

      commandInputs.forEach(input => {
        const result = validator.sanitizeSearchInput(input)
        expect(result.wasSanitized).toBe(true)
        expect(result.sanitized).not.toContain('rm')
        expect(result.sanitized).not.toContain('cat')
        expect(result.sanitized).not.toContain('$(')
        expect(result.sanitized).not.toContain('`')
        expect(result.warnings.length).toBeGreaterThan(0)
      })
    })

    it('should handle path traversal attempts', () => {
      const pathInputs = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32",
        "%2e%2e%2f%2e%2e%2f%2e%2e%2f"
      ]

      pathInputs.forEach(input => {
        const result = validator.sanitizeSearchInput(input)
        expect(result.wasSanitized).toBe(true)
        expect(result.sanitized).not.toContain('../')
        expect(result.sanitized).not.toContain('..\\')
        expect(result.warnings.length).toBeGreaterThan(0)
      })
    })

    it('should allow safe search terms', () => {
      const safeInputs = [
        'automation name',
        'client-123',
        'test_automation',
        'My Automation 2024',
        'email@domain.com'
      ]

      safeInputs.forEach(input => {
        const result = validator.sanitizeSearchInput(input)
        expect(result.sanitized).toBe(input.trim())
        expect(result.warnings.length).toBe(0)
      })
    })

    it('should handle length limits', () => {
      const longInput = 'a'.repeat(200)
      const result = validator.sanitizeSearchInput(longInput)
      
      expect(result.wasSanitized).toBe(true)
      expect(result.sanitized.length).toBe(DEFAULT_SANITIZATION_CONFIG.maxLength)
      expect(result.warnings).toContain(`Input truncated to ${DEFAULT_SANITIZATION_CONFIG.maxLength} characters`)
    })

    it('should handle non-string inputs', () => {
      const invalidInputs = [
        123,
        null,
        undefined,
        {},
        []
      ]

      invalidInputs.forEach(input => {
        const result = validator.sanitizeSearchInput(input as string)
        expect(result.wasSanitized).toBe(true)
        expect(result.sanitized).toBe('')
        expect(result.warnings.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Client ID Validation', () => {
    it('should validate correct client IDs', () => {
      const validClientIds = [
        'client-123',
        'CLIENT_456',
        'client789',
        'test-client-id',
        'a1b2c3'
      ]

      validClientIds.forEach(clientId => {
        expect(validator.validateClientId(clientId)).toBe(true)
      })
    })

    it('should reject invalid client IDs', () => {
      const invalidClientIds = [
        'client with spaces',
        'client@domain.com',
        'client/123',
        'client<script>',
        'a'.repeat(100), // too long
        ''
      ]

      invalidClientIds.forEach(clientId => {
        expect(validator.validateClientId(clientId)).toBe(false)
      })
    })

    it('should allow null client ID', () => {
      expect(validator.validateClientId(null)).toBe(true)
    })
  })

  describe('Status Array Validation', () => {
    it('should validate correct status arrays', () => {
      const validStatusArrays = [
        [],
        ['Running'],
        ['Running', 'Stopped'],
        ['Running', 'Stopped', 'Error', 'Stalled']
      ]

      validStatusArrays.forEach(statuses => {
        expect(validator.validateStatusArray(statuses as string[])).toBe(true)
      })
    })

    it('should reject invalid status arrays', () => {
      const invalidStatusArrays = [
        ['InvalidStatus'],
        ['Running', 'InvalidStatus'],
        'not-an-array',
        null,
        undefined,
        ['Running', 'Stopped', 'Error', 'Stalled', 'Running', 'Stopped', 'Error', 'Stalled', 'Running', 'Stopped', 'Error'] // too long
      ]

      invalidStatusArrays.forEach(statuses => {
        expect(validator.validateStatusArray(statuses as string[])).toBe(false)
      })
    })
  })

  describe('Malicious Pattern Detection', () => {
    it('should detect XSS patterns', () => {
      const xssPatterns = [
        '<script>alert(1)</script>',
        'javascript:void(0)',
        '<img onerror="alert(1)" src="x">',
        'data:text/html,<script>alert(1)</script>'
      ]

      xssPatterns.forEach(pattern => {
        expect(validator.checkMaliciousPatterns(pattern)).toBe(true)
      })
    })

    it('should detect SQL injection patterns', () => {
      const sqlPatterns = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "UNION SELECT password FROM users",
        "INSERT INTO users VALUES"
      ]

      sqlPatterns.forEach(pattern => {
        const result = validator.checkMaliciousPatterns(pattern)
        if (!result) {
          console.log(`Failed to detect SQL pattern: "${pattern}"`)
        }
        expect(result).toBe(true)
      })
    })

    it('should not flag safe content', () => {
      const safeContent = [
        'normal search term',
        'automation-name-123',
        'client@domain.com',
        'test automation for client'
      ]

      safeContent.forEach(content => {
        expect(validator.checkMaliciousPatterns(content)).toBe(false)
      })
    })
  })

  describe('Comprehensive Security Test Suite', () => {
    it('should pass all security tests', () => {
      const testResults = runSecurityTests(validator)
      
      expect(testResults.passed).toBeGreaterThan(0)
      expect(testResults.failed).toBe(0)
      expect(testResults.results.length).toBeGreaterThan(0)
      
      // All tests should pass (inputs should be sanitized or rejected)
      testResults.results.forEach(result => {
        expect(result.passed).toBe(true)
      })
    })

    it('should provide detailed test results', () => {
      const testResults = runSecurityTests(validator)
      
      testResults.results.forEach(result => {
        expect(result).toHaveProperty('test')
        expect(result).toHaveProperty('input')
        expect(result).toHaveProperty('passed')
        expect(result).toHaveProperty('details')
        expect(typeof result.test).toBe('string')
        expect(typeof result.input).toBe('string')
        expect(typeof result.passed).toBe('boolean')
        expect(typeof result.details).toBe('string')
      })
    })
  })

  describe('Custom Configuration', () => {
    it('should respect custom sanitization config', () => {
      const customValidator = new FilterSecurityValidator({
        maxLength: 50,
        allowedPattern: /^[a-zA-Z0-9\s]+$/,
        blockedPattern: /[<>]/g
      })

      const input = 'test<script>alert(1)</script>'
      const result = customValidator.sanitizeSearchInput(input)
      
      expect(result.wasSanitized).toBe(true)
      expect(result.sanitized).not.toContain('<')
      expect(result.sanitized).not.toContain('>')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      const result = validator.sanitizeSearchInput('')
      expect(result.sanitized).toBe('')
      expect(result.wasSanitized).toBe(false)
      expect(result.warnings.length).toBe(0)
    })

    it('should handle whitespace-only strings', () => {
      const result = validator.sanitizeSearchInput('   \t\n   ')
      expect(result.sanitized).toBe('')
      expect(result.wasSanitized).toBe(true)
    })

    it('should handle unicode characters', () => {
      const unicodeInput = 'test 测试 🚀 automation'
      const result = validator.sanitizeSearchInput(unicodeInput)
      // Should be sanitized due to non-ASCII characters in default config
      expect(result.wasSanitized).toBe(true)
    })

    it('should handle mixed case malicious patterns', () => {
      const mixedCaseInputs = [
        'JaVaScRiPt:alert(1)',
        '<ScRiPt>alert(1)</ScRiPt>',
        'UnIoN sElEcT * fRoM users'
      ]

      mixedCaseInputs.forEach(input => {
        const result = validator.sanitizeSearchInput(input)
        expect(result.wasSanitized).toBe(true)
      })
    })
  })
})

describe('AdvancedInputSanitizer', () => {
  let sanitizer: AdvancedInputSanitizer

  beforeEach(() => {
    sanitizer = new AdvancedInputSanitizer()
  })

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const result = sanitizer.sanitizeSearchInput('test input')
      expect(result.sanitized).toBe('test input')
    })

    it('should use custom configuration', () => {
      const customSanitizer = new AdvancedInputSanitizer({
        maxLength: 10,
        allowedPattern: /^[a-z\s]+$/
      })

      const result = customSanitizer.sanitizeSearchInput('TEST INPUT 123')
      expect(result.wasSanitized).toBe(true)
      expect(result.sanitized.length).toBeLessThanOrEqual(10)
    })
  })
})
