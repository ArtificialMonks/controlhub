// src/lib/security/input-validation.ts
/**
 * Input Validation and Sanitization for Quest 6.1 Enterprise-Grade Settings
 * Provides comprehensive input validation with security-first approach
 */

import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  sanitized?: unknown
  riskScore: number
}

export interface ValidationRule {
  field: string
  required: boolean
  type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'json' | 'array'
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  allowedValues?: unknown[]
  sanitize?: boolean
  customValidator?: (value: unknown) => { valid: boolean; error?: string }
}

export interface SanitizationConfig {
  enableHtmlSanitization: boolean
  enableSqlInjectionProtection: boolean
  enableXssProtection: boolean
  enablePathTraversalProtection: boolean
  maxStringLength: number
  allowedHtmlTags: string[]
  allowedHtmlAttributes: string[]
}

/**
 * Enterprise Input Validator with security-first approach
 */
export class InputValidator {
  private config: SanitizationConfig
  private dangerousPatterns: RegExp[] = []
  private sqlInjectionPatterns: RegExp[] = []
  private xssPatterns: RegExp[] = []
  private pathTraversalPatterns: RegExp[] = []

  constructor(config?: Partial<SanitizationConfig>) {
    this.config = {
      enableHtmlSanitization: true,
      enableSqlInjectionProtection: true,
      enableXssProtection: true,
      enablePathTraversalProtection: true,
      maxStringLength: 10000,
      allowedHtmlTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
      allowedHtmlAttributes: ['class', 'id'],
      ...config
    }

    this.initializeSecurityPatterns()
  }

  /**
   * Validate and sanitize input data according to rules
   */
  validateInput(data: unknown, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = []
    let riskScore = 0
    const sanitized: Record<string, unknown> = {}

    if (typeof data !== 'object' || data === null) {
      return {
        valid: false,
        errors: ['Input must be an object'],
        riskScore: 5
      }
    }

    const inputData = data as Record<string, unknown>

    for (const rule of rules) {
      const value = inputData[rule.field]
      const fieldResult = this.validateField(value, rule)
      
      if (!fieldResult.valid) {
        errors.push(...fieldResult.errors.map(err => `${rule.field}: ${err}`))
      }

      riskScore += fieldResult.riskScore
      
      if (fieldResult.sanitized !== undefined) {
        sanitized[rule.field] = fieldResult.sanitized
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : undefined,
      riskScore: Math.min(riskScore, 10)
    }
  }

  /**
   * Validate individual field
   */
  private validateField(value: unknown, rule: ValidationRule): ValidationResult {
    const errors: string[] = []
    let riskScore = 0
    let sanitized = value

    // Required field validation
    if (rule.required && (value === undefined || value === null || value === '')) {
      return {
        valid: false,
        errors: ['Field is required'],
        riskScore: 1
      }
    }

    // Skip validation for optional empty fields
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return {
        valid: true,
        errors: [],
        sanitized: value,
        riskScore: 0
      }
    }

    // Type validation and sanitization
    switch (rule.type) {
      case 'string':
        const stringResult = this.validateString(value, rule)
        errors.push(...stringResult.errors)
        riskScore += stringResult.riskScore
        sanitized = stringResult.sanitized
        break

      case 'number':
        const numberResult = this.validateNumber(value)
        errors.push(...numberResult.errors)
        riskScore += numberResult.riskScore
        sanitized = numberResult.sanitized
        break

      case 'boolean':
        const booleanResult = this.validateBoolean(value)
        errors.push(...booleanResult.errors)
        sanitized = booleanResult.sanitized
        break

      case 'email':
        const emailResult = this.validateEmail(value)
        errors.push(...emailResult.errors)
        riskScore += emailResult.riskScore
        sanitized = emailResult.sanitized
        break

      case 'url':
        const urlResult = this.validateUrl(value)
        errors.push(...urlResult.errors)
        riskScore += urlResult.riskScore
        sanitized = urlResult.sanitized
        break

      case 'json':
        const jsonResult = this.validateJson(value)
        errors.push(...jsonResult.errors)
        riskScore += jsonResult.riskScore
        sanitized = jsonResult.sanitized
        break

      case 'array':
        const arrayResult = this.validateArray(value, rule)
        errors.push(...arrayResult.errors)
        riskScore += arrayResult.riskScore
        sanitized = arrayResult.sanitized
        break
    }

    // Custom validation
    if (rule.customValidator && errors.length === 0) {
      const customResult = rule.customValidator(sanitized)
      if (!customResult.valid) {
        errors.push(customResult.error || 'Custom validation failed')
        riskScore += 1
      }
    }

    // Allowed values validation
    if (rule.allowedValues && errors.length === 0) {
      if (!rule.allowedValues.includes(sanitized)) {
        errors.push(`Value must be one of: ${rule.allowedValues.join(', ')}`)
        riskScore += 2
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized,
      riskScore
    }
  }

  /**
   * Validate and sanitize string input
   */
  private validateString(value: unknown, rule: ValidationRule): ValidationResult {
    const errors: string[] = []
    let riskScore = 0

    if (typeof value !== 'string') {
      return {
        valid: false,
        errors: ['Must be a string'],
        riskScore: 1
      }
    }

    let sanitized = value

    // Length validation
    if (rule.minLength && sanitized.length < rule.minLength) {
      errors.push(`Must be at least ${rule.minLength} characters`)
    }

    if (rule.maxLength && sanitized.length > rule.maxLength) {
      errors.push(`Must be no more than ${rule.maxLength} characters`)
    }

    // Global length limit
    if (sanitized.length > this.config.maxStringLength) {
      sanitized = sanitized.substring(0, this.config.maxStringLength)
      riskScore += 1
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(sanitized)) {
      errors.push('Invalid format')
      riskScore += 1
    }

    // Security sanitization
    if (rule.sanitize !== false) {
      const securityResult = this.applySecurity(sanitized)
      sanitized = securityResult.sanitized
      riskScore += securityResult.riskScore
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized,
      riskScore
    }
  }

  /**
   * Validate number input
   */
  private validateNumber(value: unknown): ValidationResult {
    if (typeof value === 'number' && !isNaN(value)) {
      return {
        valid: true,
        errors: [],
        sanitized: value,
        riskScore: 0
      }
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      if (!isNaN(parsed)) {
        return {
          valid: true,
          errors: [],
          sanitized: parsed,
          riskScore: 0
        }
      }
    }

    return {
      valid: false,
      errors: ['Must be a valid number'],
      riskScore: 1
    }
  }

  /**
   * Validate boolean input
   */
  private validateBoolean(value: unknown): ValidationResult {
    if (typeof value === 'boolean') {
      return {
        valid: true,
        errors: [],
        sanitized: value,
        riskScore: 0
      }
    }

    if (typeof value === 'string') {
      const lower = value.toLowerCase()
      if (lower === 'true' || lower === '1') {
        return {
          valid: true,
          errors: [],
          sanitized: true,
          riskScore: 0
        }
      }
      if (lower === 'false' || lower === '0') {
        return {
          valid: true,
          errors: [],
          sanitized: false,
          riskScore: 0
        }
      }
    }

    return {
      valid: false,
      errors: ['Must be a boolean value'],
      riskScore: 1
    }
  }

  /**
   * Validate email input
   */
  private validateEmail(value: unknown): ValidationResult {
    if (typeof value !== 'string') {
      return {
        valid: false,
        errors: ['Must be a string'],
        riskScore: 1
      }
    }

    const emailSchema = z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    const result = emailSchema.safeParse(value)

    if (!result.success) {
      return {
        valid: false,
        errors: ['Must be a valid email address'],
        riskScore: 1
      }
    }

    // Additional security checks
    const securityResult = this.applySecurity(value)
    
    return {
      valid: true,
      errors: [],
      sanitized: securityResult.sanitized,
      riskScore: securityResult.riskScore
    }
  }

  /**
   * Validate URL input
   */
  private validateUrl(value: unknown): ValidationResult {
    if (typeof value !== 'string') {
      return {
        valid: false,
        errors: ['Must be a string'],
        riskScore: 1
      }
    }

    try {
      new URL(value)
    } catch {
      return {
        valid: false,
        errors: ['Must be a valid URL'],
        riskScore: 2
      }
    }

    // Security checks for URLs
    const securityResult = this.applySecurity(value)
    let riskScore = securityResult.riskScore

    // Check for suspicious protocols
    const suspiciousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
    if (suspiciousProtocols.some(protocol => value.toLowerCase().startsWith(protocol))) {
      riskScore += 5
    }

    return {
      valid: true,
      errors: [],
      sanitized: securityResult.sanitized,
      riskScore
    }
  }

  /**
   * Validate JSON input
   */
  private validateJson(value: unknown): ValidationResult {
    if (typeof value === 'object') {
      return {
        valid: true,
        errors: [],
        sanitized: value,
        riskScore: 0
      }
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return {
          valid: true,
          errors: [],
          sanitized: parsed,
          riskScore: 0
        }
      } catch {
        return {
          valid: false,
          errors: ['Must be valid JSON'],
          riskScore: 1
        }
      }
    }

    return {
      valid: false,
      errors: ['Must be a JSON object or string'],
      riskScore: 1
    }
  }

  /**
   * Validate array input
   */
  private validateArray(value: unknown, rule: ValidationRule): ValidationResult {
    if (!Array.isArray(value)) {
      return {
        valid: false,
        errors: ['Must be an array'],
        riskScore: 1
      }
    }

    let riskScore = 0
    const sanitized = value.map(item => {
      if (typeof item === 'string' && rule.sanitize !== false) {
        const securityResult = this.applySecurity(item)
        riskScore += securityResult.riskScore
        return securityResult.sanitized
      }
      return item
    })

    // Length validation
    const errors: string[] = []
    if (rule.minLength && sanitized.length < rule.minLength) {
      errors.push(`Array must have at least ${rule.minLength} items`)
    }

    if (rule.maxLength && sanitized.length > rule.maxLength) {
      errors.push(`Array must have no more than ${rule.maxLength} items`)
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized,
      riskScore
    }
  }

  /**
   * Apply security sanitization
   */
  private applySecurity(input: string): { sanitized: string; riskScore: number } {
    let sanitized = input
    let riskScore = 0

    // Check for dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(sanitized)) {
        riskScore += 3
      }
    }

    // SQL injection protection
    if (this.config.enableSqlInjectionProtection) {
      for (const pattern of this.sqlInjectionPatterns) {
        if (pattern.test(sanitized)) {
          riskScore += 5
          // Remove SQL injection patterns
          sanitized = sanitized.replace(pattern, '')
        }
      }
    }

    // XSS protection
    if (this.config.enableXssProtection) {
      for (const pattern of this.xssPatterns) {
        if (pattern.test(sanitized)) {
          riskScore += 4
        }
      }
      
      // HTML sanitization
      if (this.config.enableHtmlSanitization) {
        sanitized = DOMPurify.sanitize(sanitized, {
          ALLOWED_TAGS: this.config.allowedHtmlTags,
          ALLOWED_ATTR: this.config.allowedHtmlAttributes
        })
      }
    }

    // Path traversal protection
    if (this.config.enablePathTraversalProtection) {
      for (const pattern of this.pathTraversalPatterns) {
        if (pattern.test(sanitized)) {
          riskScore += 3
          sanitized = sanitized.replace(pattern, '')
        }
      }
    }

    return { sanitized, riskScore }
  }

  /**
   * Initialize security patterns
   */
  private initializeSecurityPatterns(): void {
    this.dangerousPatterns = [
      /eval\s*\(/gi,
      /function\s*\(/gi,
      /setTimeout\s*\(/gi,
      /setInterval\s*\(/gi,
      /new\s+Function/gi,
      /document\./gi,
      /window\./gi
    ]

    this.sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /('|(\\')|(;)|(\\;)|(\-\-)|(\#)|(\*)|(\%27)|(\%3B)|(\%23)|(\%2A))/gi,
      /(\b(WAITFOR|DELAY)\b)/gi
    ]

    this.xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi
    ]

    this.pathTraversalPatterns = [
      /\.\.\//g,
      /\.\.\\/g,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi,
      /\.\.%2f/gi,
      /\.\.%5c/gi
    ]
  }
}

// Export singleton instance
export const inputValidator = new InputValidator()

// Predefined validation rules for settings
export const settingsValidationRules = {
  userProfile: [
    { field: 'displayName', required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
    { field: 'email', required: true, type: 'email' as const },
    { field: 'timezone', required: true, type: 'string' as const },
    { field: 'language', required: true, type: 'string' as const, minLength: 2, maxLength: 5 },
    { field: 'dateFormat', required: true, type: 'string' as const, allowedValues: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] },
    { field: 'timeFormat', required: true, type: 'string' as const, allowedValues: ['12h', '24h'] }
  ],
  
  appearance: [
    { field: 'theme.mode', required: true, type: 'string' as const, allowedValues: ['light', 'dark', 'system'] },
    { field: 'theme.highContrast', required: true, type: 'boolean' as const },
    { field: 'theme.reducedMotion', required: true, type: 'boolean' as const },
    { field: 'typography.fontSize', required: true, type: 'string' as const, allowedValues: ['small', 'medium', 'large', 'extra-large'] },
    { field: 'typography.fontFamily', required: true, type: 'string' as const, allowedValues: ['system', 'orbitron', 'inter'] }
  ],

  security: [
    { field: 'authentication.twoFactorEnabled', required: true, type: 'boolean' as const },
    { field: 'authentication.sessionTimeout', required: true, type: 'number' as const },
    { field: 'sessions.maxActiveSessions', required: true, type: 'number' as const },
    { field: 'privacy.allowAnalytics', required: true, type: 'boolean' as const }
  ]
}

// Types are already exported with their interface declarations above
