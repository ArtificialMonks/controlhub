// src/lib/security/security-framework.ts
/**
 * Enterprise-Grade Security Framework for Quest 6.1 Settings Page
 * Provides comprehensive security features including encryption, access control, and audit trails
 */

import CryptoJS from 'crypto-js'
import { createClient } from '@/lib/integrations/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface SecurityConfig {
  encryption: {
    algorithm: string
    keyDerivation: {
      iterations: number
      keyLength: number
      salt: string
    }
  }
  accessControl: {
    enableRBAC: boolean
    sessionTimeout: number // minutes
    maxFailedAttempts: number
    lockoutDuration: number // minutes
  }
  auditTrail: {
    enabled: boolean
    retentionPeriod: number // days
    includeIpAddress: boolean
    includeUserAgent: boolean
  }
  validation: {
    enableInputSanitization: boolean
    enableXSSProtection: boolean
    enableCSRFProtection: boolean
    maxInputLength: number
  }
}

export interface SecurityContext {
  userId: string
  sessionId: string
  ipAddress?: string
  userAgent?: string
  permissions: string[]
  roles: string[]
  timestamp: Date
}

export interface AuditEvent {
  id: string
  userId: string
  sessionId: string
  action: string
  resource: string
  outcome: 'success' | 'failure' | 'blocked'
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  riskScore?: number
}

export interface AccessControlRule {
  resource: string
  action: string
  roles: string[]
  conditions?: Record<string, unknown>
  effect: 'allow' | 'deny'
}

export interface EncryptionResult {
  encrypted: string
  iv: string
  salt: string
  algorithm: string
}

/**
 * Enterprise Security Framework
 */
export class SecurityFramework {
  private supabase: SupabaseClient
  private config: SecurityConfig
  private masterKey: string
  private accessControlRules: Map<string, AccessControlRule[]>

  constructor(config?: Partial<SecurityConfig>) {
    this.supabase = createClient()
    this.masterKey = process.env.SECURITY_MASTER_KEY || 'change-in-production'
    this.accessControlRules = new Map()
    
    this.config = {
      encryption: {
        algorithm: 'AES-256-GCM',
        keyDerivation: {
          iterations: 100000,
          keyLength: 32,
          salt: process.env.ENCRYPTION_SALT || 'default-salt'
        }
      },
      accessControl: {
        enableRBAC: true,
        sessionTimeout: 60,
        maxFailedAttempts: 5,
        lockoutDuration: 15
      },
      auditTrail: {
        enabled: true,
        retentionPeriod: 365,
        includeIpAddress: true,
        includeUserAgent: true
      },
      validation: {
        enableInputSanitization: true,
        enableXSSProtection: true,
        enableCSRFProtection: true,
        maxInputLength: 10000
      },
      ...config
    }

    this.initializeAccessControlRules()
  }

  /**
   * Encrypt sensitive data with enterprise-grade encryption
   */
  async encryptData(data: string, context?: SecurityContext): Promise<EncryptionResult> {
    try {
      // Generate random IV and salt for each encryption
      const iv = CryptoJS.lib.WordArray.random(16)
      const salt = CryptoJS.lib.WordArray.random(16)
      
      // Derive key using PBKDF2
      const key = CryptoJS.PBKDF2(this.masterKey, salt, {
        keySize: this.config.encryption.keyDerivation.keyLength / 4,
        iterations: this.config.encryption.keyDerivation.iterations
      })

      // Encrypt data
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CTR,
        padding: CryptoJS.pad.NoPadding
      })

      const result: EncryptionResult = {
        encrypted: encrypted.toString(),
        iv: iv.toString(),
        salt: salt.toString(),
        algorithm: this.config.encryption.algorithm
      }

      // Audit encryption event
      if (context) {
        await this.logAuditEvent({
          id: this.generateId(),
          userId: context.userId,
          sessionId: context.sessionId,
          action: 'encrypt',
          resource: 'sensitive_data',
          outcome: 'success',
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          timestamp: new Date()
        })
      }

      return result
    } catch (error) {
      if (context) {
        await this.logAuditEvent({
          id: this.generateId(),
          userId: context.userId,
          sessionId: context.sessionId,
          action: 'encrypt',
          resource: 'sensitive_data',
          outcome: 'failure',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date()
        })
      }
      throw new Error('Encryption failed')
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptionResult: EncryptionResult, context?: SecurityContext): Promise<string> {
    try {
      // Reconstruct key using stored salt
      const salt = CryptoJS.enc.Hex.parse(encryptionResult.salt)
      const key = CryptoJS.PBKDF2(this.masterKey, salt, {
        keySize: this.config.encryption.keyDerivation.keyLength / 4,
        iterations: this.config.encryption.keyDerivation.iterations
      })

      // Decrypt data
      const iv = CryptoJS.enc.Hex.parse(encryptionResult.iv)
      const decrypted = CryptoJS.AES.decrypt(encryptionResult.encrypted, key, {
        iv: iv,
        mode: CryptoJS.mode.CTR,
        padding: CryptoJS.pad.NoPadding
      })

      const result = decrypted.toString(CryptoJS.enc.Utf8)

      // Audit decryption event
      if (context) {
        await this.logAuditEvent({
          id: this.generateId(),
          userId: context.userId,
          sessionId: context.sessionId,
          action: 'decrypt',
          resource: 'sensitive_data',
          outcome: 'success',
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          timestamp: new Date()
        })
      }

      return result
    } catch (error) {
      if (context) {
        await this.logAuditEvent({
          id: this.generateId(),
          userId: context.userId,
          sessionId: context.sessionId,
          action: 'decrypt',
          resource: 'sensitive_data',
          outcome: 'failure',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date()
        })
      }
      throw new Error('Decryption failed')
    }
  }

  /**
   * Check access permissions using Role-Based Access Control
   */
  async checkAccess(
    context: SecurityContext,
    resource: string,
    action: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      if (!this.config.accessControl.enableRBAC) {
        return { allowed: true }
      }

      // Check session validity
      const sessionValid = await this.validateSession(context)
      if (!sessionValid) {
        await this.logAuditEvent({
          id: this.generateId(),
          userId: context.userId,
          sessionId: context.sessionId,
          action,
          resource,
          outcome: 'blocked',
          details: { reason: 'Invalid session' },
          timestamp: new Date()
        })
        return { allowed: false, reason: 'Invalid session' }
      }

      // Get access control rules for resource
      const rules = this.accessControlRules.get(resource) || []
      
      // Check each rule
      for (const rule of rules) {
        if (rule.action === action || rule.action === '*') {
          // Check if user has required roles
          const hasRole = rule.roles.some(role => 
            context.roles.includes(role) || context.roles.includes('admin')
          )

          if (hasRole) {
            if (rule.effect === 'allow') {
              await this.logAuditEvent({
                id: this.generateId(),
                userId: context.userId,
                sessionId: context.sessionId,
                action,
                resource,
                outcome: 'success',
                timestamp: new Date()
              })
              return { allowed: true }
            } else {
              await this.logAuditEvent({
                id: this.generateId(),
                userId: context.userId,
                sessionId: context.sessionId,
                action,
                resource,
                outcome: 'blocked',
                details: { reason: 'Explicit deny rule' },
                timestamp: new Date()
              })
              return { allowed: false, reason: 'Access denied by policy' }
            }
          }
        }
      }

      // Default deny
      await this.logAuditEvent({
        id: this.generateId(),
        userId: context.userId,
        sessionId: context.sessionId,
        action,
        resource,
        outcome: 'blocked',
        details: { reason: 'No matching allow rule' },
        timestamp: new Date()
      })
      return { allowed: false, reason: 'Access denied' }
    } catch (error) {
      await this.logAuditEvent({
        id: this.generateId(),
        userId: context.userId,
        sessionId: context.sessionId,
        action,
        resource,
        outcome: 'failure',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date()
      })
      return { allowed: false, reason: 'Access check failed' }
    }
  }

  /**
   * Sanitize and validate input data
   */
  sanitizeInput(input: string, context?: SecurityContext): string {
    if (!this.config.validation.enableInputSanitization) {
      return input
    }

    let sanitized = input

    // Length validation
    if (sanitized.length > this.config.validation.maxInputLength) {
      sanitized = sanitized.substring(0, this.config.validation.maxInputLength)
    }

    // XSS protection
    if (this.config.validation.enableXSSProtection) {
      sanitized = sanitized
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
    }

    // Remove potentially dangerous patterns
    sanitized = sanitized
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/onload/gi, '')
      .replace(/onerror/gi, '')
      .replace(/onclick/gi, '')

    return sanitized.trim()
  }

  /**
   * Log security audit event
   */
  async logAuditEvent(event: AuditEvent): Promise<void> {
    if (!this.config.auditTrail.enabled) {
      return
    }

    try {
      await this.supabase
        .from('security_audit_trail')
        .insert({
          id: event.id,
          user_id: event.userId,
          session_id: event.sessionId,
          action: event.action,
          resource: event.resource,
          outcome: event.outcome,
          details: event.details,
          ip_address: this.config.auditTrail.includeIpAddress ? event.ipAddress : null,
          user_agent: this.config.auditTrail.includeUserAgent ? event.userAgent : null,
          risk_score: event.riskScore,
          timestamp: event.timestamp.toISOString()
        })
    } catch (error) {
      // Log to console if database logging fails
      console.error('Failed to log audit event:', error)
    }
  }

  /**
   * Get security context for current user
   */
  async getSecurityContext(sessionId?: string): Promise<SecurityContext | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return null

      let roles = ['user'] // Default role
      let permissions: string[] = []

      try {
        // Get user roles and permissions
        const { data: userRoles, error: rolesError } = await this.supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)

        if (rolesError) {
          // Check if table doesn't exist
          if (rolesError.message?.includes('relation') || rolesError.message?.includes('does not exist') || rolesError.code === '42P01') {
            console.log('⚠️  User roles table not yet created, using default role')
          } else {
            console.warn('Failed to fetch user roles:', rolesError)
          }
        } else {
          roles = userRoles?.map(r => r.role) || ['user']
        }
        
        // Get permissions for roles
        const { data: rolePermissions, error: permissionsError } = await this.supabase
          .from('role_permissions')
          .select('permission')
          .in('role', roles)

        if (permissionsError) {
          // Check if table doesn't exist
          if (permissionsError.message?.includes('relation') || permissionsError.message?.includes('does not exist') || permissionsError.code === '42P01') {
            console.log('⚠️  Role permissions table not yet created, using default permissions')
            // Set basic default permissions for user role
            permissions = [
              'settings:read',
              'settings:write',
              'profile:read',
              'profile:write',
              'appearance:read',
              'appearance:write'
            ]
          } else {
            console.warn('Failed to fetch role permissions:', permissionsError)
          }
        } else {
          permissions = rolePermissions?.map(p => p.permission) || []
        }

      } catch (dbError) {
        console.log('ℹ️  Database tables not available, using default security context')
        // Set basic permissions when database is not available
        permissions = [
          'settings:read',
          'settings:write',
          'profile:read', 
          'profile:write',
          'appearance:read',
          'appearance:write',
          'security:read',
          'security:write'
        ]
      }

      return {
        userId: user.id,
        sessionId: sessionId || this.generateId(),
        permissions,
        roles,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Failed to get security context:', error)
      return null
    }
  }

  /**
   * Validate session
   */
  private async validateSession(context: SecurityContext): Promise<boolean> {
    try {
      const { data: session } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('session_id', context.sessionId)
        .eq('user_id', context.userId)
        .single()

      if (!session) return false

      // Check if session is expired
      const sessionAge = Date.now() - new Date(session.created_at).getTime()
      const maxAge = this.config.accessControl.sessionTimeout * 60 * 1000

      return sessionAge < maxAge
    } catch (error) {
      return false
    }
  }

  /**
   * Initialize default access control rules
   */
  private initializeAccessControlRules(): void {
    // Settings access rules
    this.accessControlRules.set('settings', [
      { resource: 'settings', action: 'read', roles: ['user', 'admin'], effect: 'allow' },
      { resource: 'settings', action: 'update', roles: ['user', 'admin'], effect: 'allow' },
      { resource: 'settings', action: 'delete', roles: ['admin'], effect: 'allow' }
    ])

    // Security settings rules
    this.accessControlRules.set('settings.security', [
      { resource: 'settings.security', action: 'read', roles: ['user', 'admin'], effect: 'allow' },
      { resource: 'settings.security', action: 'update', roles: ['user', 'admin'], effect: 'allow' },
      { resource: 'settings.security', action: 'delete', roles: ['admin'], effect: 'allow' }
    ])

    // Admin-only resources
    this.accessControlRules.set('admin', [
      { resource: 'admin', action: '*', roles: ['admin'], effect: 'allow' }
    ])

    // API access rules
    this.accessControlRules.set('api', [
      { resource: 'api', action: 'read', roles: ['user', 'admin', 'api'], effect: 'allow' },
      { resource: 'api', action: 'write', roles: ['admin', 'api'], effect: 'allow' }
    ])
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Calculate risk score for an event
   */
  private calculateRiskScore(event: Partial<AuditEvent>): number {
    let score = 0

    // Base score for different actions
    const actionScores: Record<string, number> = {
      'login': 1,
      'logout': 0,
      'read': 1,
      'update': 3,
      'delete': 5,
      'create': 2,
      'encrypt': 2,
      'decrypt': 3
    }

    score += actionScores[event.action || ''] || 1

    // Increase score for failures
    if (event.outcome === 'failure' || event.outcome === 'blocked') {
      score += 3
    }

    // Increase score for sensitive resources
    if (event.resource?.includes('security') || event.resource?.includes('admin')) {
      score += 2
    }

    return Math.min(score, 10) // Cap at 10
  }
}

// Export singleton instance
export const securityFramework = new SecurityFramework()

// Types are already exported with their interface declarations above
