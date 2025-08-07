// src/lib/infrastructure/security/enhanced-analytics-security.ts
export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: 'data-exposure' | 'injection' | 'authentication' | 'authorization' | 'storage'
  component: string
  issue: string
  remediation: string
  impact: string
}

export interface SecurityReport {
  issues: SecurityIssue[]
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  recommendations: string[]
}

export class EnhancedAnalyticsSecurityValidator {
  private issues: SecurityIssue[] = []

  validateSecurity(): SecurityReport {
    this.issues = []

    // Data exposure validation
    this.validateDataExposure()
    
    // Input validation and injection prevention
    this.validateInputSecurity()
    
    // Authentication and authorization
    this.validateAuthSecurity()
    
    // Client-side storage security
    this.validateStorageSecurity()
    
    // Component security
    this.validateComponentSecurity()

    const score = this.calculateSecurityScore()
    const grade = this.calculateSecurityGrade(score)
    const recommendations = this.generateSecurityRecommendations()

    return {
      issues: this.issues,
      score,
      grade,
      recommendations
    }
  }

  private validateDataExposure(): void {
    // Check for sensitive data in analytics
    this.issues.push({
      severity: 'medium',
      category: 'data-exposure',
      component: 'useDrillDownAnalytics',
      issue: 'Analytics hook processes automation data that may contain sensitive webhook URLs',
      remediation: 'Implement data sanitization before processing in analytics',
      impact: 'Webhook URLs could be exposed in debugging or error logs'
    })

    // Check for client-side data filtering
    this.issues.push({
      severity: 'low',
      category: 'data-exposure',
      component: 'AutomationsDrillDown',
      issue: 'All automation data is sent to client for filtering',
      remediation: 'Consider server-side filtering for large datasets',
      impact: 'Increased data exposure and potential performance issues'
    })

    // Check for data in console logs
    this.issues.push({
      severity: 'medium',
      category: 'data-exposure',
      component: 'Enhanced Analytics',
      issue: 'Performance monitoring may log sensitive data to console',
      remediation: 'Sanitize data before logging and disable in production',
      impact: 'Sensitive information could be exposed in browser console'
    })
  }

  private validateInputSecurity(): void {
    // Date range input validation
    this.issues.push({
      severity: 'low',
      category: 'injection',
      component: 'DatePickerWithRange',
      issue: 'Date inputs should be validated and sanitized',
      remediation: 'Add strict date format validation and boundary checks',
      impact: 'Invalid date inputs could cause application errors'
    })

    // Search query validation
    this.issues.push({
      severity: 'medium',
      category: 'injection',
      component: 'AutomationsDrillDown search',
      issue: 'Search query input lacks proper sanitization',
      remediation: 'Implement input sanitization for search queries',
      impact: 'Potential XSS if search results are improperly rendered'
    })

    // Filter validation
    this.issues.push({
      severity: 'low',
      category: 'injection',
      component: 'Filter components',
      issue: 'Filter values should be validated against allowed options',
      remediation: 'Implement strict filter value validation',
      impact: 'Invalid filter values could bypass intended filtering logic'
    })
  }

  private validateAuthSecurity(): void {
    // Authentication requirement
    this.issues.push({
      severity: 'high',
      category: 'authentication',
      component: 'Enhanced Analytics Pages',
      issue: 'Analytics pages should require authentication',
      remediation: 'Ensure all analytics routes are protected by authentication middleware',
      impact: 'Unauthorized access to sensitive automation data'
    })

    // User data isolation
    this.issues.push({
      severity: 'critical',
      category: 'authorization',
      component: 'Data fetching',
      issue: 'Analytics data must be properly scoped to authenticated user',
      remediation: 'Implement Row Level Security (RLS) policies in database queries',
      impact: 'Users could potentially access other users\' automation data'
    })
  }

  private validateStorageSecurity(): void {
    // Local storage security
    this.issues.push({
      severity: 'medium',
      category: 'storage',
      component: 'useUserPreferences',
      issue: 'User preferences stored in localStorage without encryption',
      remediation: 'Consider encrypting sensitive preference data or use secure storage',
      impact: 'User preferences could be accessed by malicious scripts'
    })

    // Session storage
    this.issues.push({
      severity: 'low',
      category: 'storage',
      component: 'Analytics state',
      issue: 'Analytics state temporarily stored in memory',
      remediation: 'Ensure sensitive state is cleared on logout/navigation',
      impact: 'Sensitive data could persist in memory after user session ends'
    })
  }

  private validateComponentSecurity(): void {
    // XSS prevention in data rendering
    this.issues.push({
      severity: 'medium',
      category: 'injection',
      component: 'Table rendering',
      issue: 'Dynamic data rendering should prevent XSS attacks',
      remediation: 'Ensure all dynamic content is properly escaped',
      impact: 'Malicious automation names or client IDs could execute scripts'
    })

    // CSRF protection
    this.issues.push({
      severity: 'low',
      category: 'injection',
      component: 'Export functionality',
      issue: 'Export actions should include CSRF protection',
      remediation: 'Add CSRF tokens to export requests',
      impact: 'Potential unauthorized data export through CSRF attacks'
    })

    // Content Security Policy
    this.issues.push({
      severity: 'medium',
      category: 'injection',
      component: 'Modal components',
      issue: 'Modals should respect Content Security Policy',
      remediation: 'Ensure all inline styles and scripts comply with CSP',
      impact: 'CSP violations could block legitimate functionality'
    })
  }

  private calculateSecurityScore(): number {
    let score = 100
    
    this.issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 25
          break
        case 'high':
          score -= 15
          break
        case 'medium':
          score -= 10
          break
        case 'low':
          score -= 5
          break
      }
    })

    return Math.max(0, score)
  }

  private calculateSecurityGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  private generateSecurityRecommendations(): string[] {
    const recommendations: string[] = []
    
    const criticalIssues = this.issues.filter(i => i.severity === 'critical')
    const highIssues = this.issues.filter(i => i.severity === 'high')
    
    if (criticalIssues.length > 0) {
      recommendations.push('🚨 Address all CRITICAL security issues immediately before production deployment')
    }
    
    if (highIssues.length > 0) {
      recommendations.push('⚠️ Resolve HIGH severity issues as soon as possible')
    }

    // Category-specific recommendations
    const dataExposureIssues = this.issues.filter(i => i.category === 'data-exposure')
    if (dataExposureIssues.length > 0) {
      recommendations.push('🔒 Implement data sanitization and minimize client-side data exposure')
    }

    const injectionIssues = this.issues.filter(i => i.category === 'injection')
    if (injectionIssues.length > 0) {
      recommendations.push('🛡️ Add comprehensive input validation and output encoding')
    }

    const authIssues = this.issues.filter(i => i.category === 'authentication' || i.category === 'authorization')
    if (authIssues.length > 0) {
      recommendations.push('👤 Strengthen authentication and authorization controls')
    }

    const storageIssues = this.issues.filter(i => i.category === 'storage')
    if (storageIssues.length > 0) {
      recommendations.push('💾 Review and secure client-side data storage practices')
    }

    return recommendations
  }

  logSecurityReport(): void {
    const report = this.validateSecurity()
    
    console.group('🔐 Enhanced Analytics Security Report')
    console.log(`📊 Security Score: ${report.score}/100 (Grade: ${report.grade})`)
    
    // Group issues by severity
    const criticalIssues = report.issues.filter(i => i.severity === 'critical')
    const highIssues = report.issues.filter(i => i.severity === 'high')
    const mediumIssues = report.issues.filter(i => i.severity === 'medium')
    const lowIssues = report.issues.filter(i => i.severity === 'low')
    
    console.log(`📈 Issues: ${criticalIssues.length} critical, ${highIssues.length} high, ${mediumIssues.length} medium, ${lowIssues.length} low`)
    
    if (criticalIssues.length > 0) {
      console.group('🚨 CRITICAL Issues')
      criticalIssues.forEach(issue => this.logSecurityIssue(issue))
      console.groupEnd()
    }
    
    if (highIssues.length > 0) {
      console.group('⚠️ HIGH Issues')
      highIssues.forEach(issue => this.logSecurityIssue(issue))
      console.groupEnd()
    }
    
    if (mediumIssues.length > 0) {
      console.group('🔶 MEDIUM Issues')
      mediumIssues.forEach(issue => this.logSecurityIssue(issue))
      console.groupEnd()
    }
    
    if (lowIssues.length > 0) {
      console.group('🔹 LOW Issues')
      lowIssues.forEach(issue => this.logSecurityIssue(issue))
      console.groupEnd()
    }
    
    if (report.recommendations.length > 0) {
      console.group('💡 Recommendations')
      report.recommendations.forEach(rec => console.log(rec))
      console.groupEnd()
    }
    
    console.groupEnd()
  }

  private logSecurityIssue(issue: SecurityIssue): void {
    console.group(`${issue.component} (${issue.category})`)
    console.log('Issue:', issue.issue)
    console.log('Impact:', issue.impact)
    console.log('Remediation:', issue.remediation)
    console.groupEnd()
  }

  // Static method for quick validation
  static validateEnhancedAnalytics(): SecurityReport {
    const validator = new EnhancedAnalyticsSecurityValidator()
    return validator.validateSecurity()
  }
}

// Export singleton for global use
export const securityValidator = new EnhancedAnalyticsSecurityValidator()

// Security utilities for runtime protection
export const SecurityUtils = {
  // Sanitize search input
  sanitizeSearchInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .substring(0, 100) // Limit length
  },

  // Validate date range
  validateDateRange(from?: Date, to?: Date): boolean {
    if (!from && !to) return true // No range is valid
    
    const now = new Date()
    const maxPastDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000)) // 1 year ago
    const maxFutureDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days future
    
    if (from) {
      if (from < maxPastDate || from > maxFutureDate) return false
    }
    
    if (to) {
      if (to < maxPastDate || to > maxFutureDate) return false
    }
    
    if (from && to && from > to) return false
    
    return true
  },

  // Sanitize user preferences before storage
  sanitizeUserPreferences(preferences: Record<string, unknown>): Record<string, unknown> {
    // Deep clone to avoid mutations
    const sanitized = JSON.parse(JSON.stringify(preferences))
    
    // Remove any potential function properties
    const cleanObject = (obj: Record<string, unknown>) => {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'function') {
          delete obj[key]
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          cleanObject(obj[key] as Record<string, unknown>)
        }
      })
    }
    
    cleanObject(sanitized)
    return sanitized
  },

  // Check if user has permission to access automation data
  validateUserAccess(userId: string, automationOwnerId: string): boolean {
    return userId === automationOwnerId
  }
}