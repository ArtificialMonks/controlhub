// src/lib/services/audit-logger.ts
/**
 * Audit Logger Service
 * Quest 2.3: Create Backend for Individual Actions
 * 
 * Security Expert Requirement:
 * - Comprehensive audit logging for all automation actions
 * - Security compliance and unauthorized access tracking
 * - Structured logging for monitoring and analysis
 */

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  id?: string
  timestamp: string
  userId: string
  clientId?: string
  action: string
  resource: string
  resourceId: string
  result: boolean
  executionTime?: number
  ipAddress?: string
  userAgent?: string
  details?: Record<string, unknown>
  error?: string
}

/**
 * Automation action audit log interface
 */
export interface AutomationActionAudit {
  action: 'run' | 'stop'
  automationId: string
  userId: string
  clientId?: string
  result: boolean
  executionTime?: number
  webhookResponse?: Record<string, unknown>
  error?: string
}

/**
 * Unauthorized access audit log interface
 */
export interface UnauthorizedAccessAudit {
  userId: string
  automationId: string
  action: string
  reason: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Audit Logger Service Class
 * Handles all audit logging for security and compliance
 */
export class AuditLogger {
  /**
   * Log automation action (run/stop)
   */
  async logAutomationAction(audit: AutomationActionAudit): Promise<void> {
    const logEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      userId: audit.userId,
      clientId: audit.clientId,
      action: `automation_${audit.action}`,
      resource: 'automation',
      resourceId: audit.automationId,
      result: audit.result,
      executionTime: audit.executionTime,
      details: {
        webhookResponse: audit.webhookResponse,
        actionType: audit.action
      },
      error: audit.error
    }

    await this.writeAuditLog(logEntry)
  }

  /**
   * Log unauthorized access attempt
   */
  async logUnauthorizedAccess(audit: UnauthorizedAccessAudit): Promise<void> {
    const logEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      userId: audit.userId,
      action: 'unauthorized_access',
      resource: 'automation',
      resourceId: audit.automationId,
      result: false,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      details: {
        attemptedAction: audit.action,
        reason: audit.reason
      }
    }

    await this.writeAuditLog(logEntry)
    
    // Also log to console for immediate security monitoring
    console.warn('SECURITY ALERT - Unauthorized access attempt:', {
      userId: audit.userId,
      automationId: audit.automationId,
      action: audit.action,
      reason: audit.reason,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log general system action
   */
  async logSystemAction(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    result: boolean,
    details?: Record<string, unknown>
  ): Promise<void> {
    const logEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      resource,
      resourceId,
      result,
      details
    }

    await this.writeAuditLog(logEntry)
  }

  /**
   * Write audit log entry to storage
   * In production, this would write to a secure audit database
   * For now, we'll use structured console logging
   */
  private async writeAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      // Structure the log entry for JSON logging
      const structuredLog = {
        level: 'audit',
        timestamp: entry.timestamp,
        audit: {
          userId: entry.userId,
          clientId: entry.clientId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          result: entry.result,
          executionTime: entry.executionTime,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          details: entry.details,
          error: entry.error
        }
      }

      // Log to console with structured format
      console.log('AUDIT_LOG:', JSON.stringify(structuredLog))

      // In production, also write to:
      // 1. Secure audit database table
      // 2. External logging service (e.g., CloudWatch, Datadog)
      // 3. SIEM system for security monitoring
      
      // Example production implementation:
      // await this.writeToAuditDatabase(entry)
      // await this.sendToExternalLogger(entry)

    } catch (error) {
      // Critical: Audit logging must not fail silently
      console.error('CRITICAL: Audit logging failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        entry,
        timestamp: new Date().toISOString()
      })
      
      // In production, this should trigger alerts
      // await this.triggerAuditFailureAlert(error, entry)
    }
  }

  /**
   * Query audit logs (for compliance and investigation)
   * In production, this would query the audit database
   */
  async queryAuditLogs(filters: {
    userId?: string
    action?: string
    resource?: string
    startDate?: string
    endDate?: string
    limit?: number
  }): Promise<AuditLogEntry[]> {
    // This is a placeholder implementation
    // In production, this would query the audit database with proper filtering
    console.log('Audit log query requested:', filters)
    
    return []
  }

  /**
   * Generate audit report for compliance
   */
  async generateAuditReport(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<{
    totalActions: number
    successfulActions: number
    failedActions: number
    unauthorizedAttempts: number
    topActions: Array<{ action: string; count: number }>
  }> {
    // This is a placeholder implementation
    // In production, this would generate comprehensive audit reports
    console.log('Audit report requested:', { startDate, endDate, userId })
    
    return {
      totalActions: 0,
      successfulActions: 0,
      failedActions: 0,
      unauthorizedAttempts: 0,
      topActions: []
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  async detectSuspiciousActivity(userId: string): Promise<{
    suspiciousPatterns: string[]
    riskScore: number
    recommendations: string[]
  }> {
    // This is a placeholder implementation
    // In production, this would analyze audit logs for suspicious patterns
    console.log('Suspicious activity check requested for user:', userId)
    
    return {
      suspiciousPatterns: [],
      riskScore: 0,
      recommendations: []
    }
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger()
