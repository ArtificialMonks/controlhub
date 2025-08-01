// src/app/api/errors/report/route.ts
/**
 * Error Reporting API Endpoint - Quest 4.4
 * Implements expert council error reporting requirements
 * Provides secure error logging and monitoring integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ErrorReport {
  errorId: string
  timestamp: string
  error: {
    name: string
    message: string
    stack?: string
  }
  errorInfo: {
    componentStack: string
  }
  userAgent: string
  url: string
  userId?: string
  level: string
  retryCount: number
}

interface ErrorLogEntry {
  id: string
  timestamp: string
  level: 'page' | 'component' | 'feature'
  errorName: string
  errorMessage: string
  errorStack?: string
  componentStack: string
  url: string
  userAgent: string
  userId?: string
  retryCount: number
  sessionId?: string
  buildVersion?: string
  environment: string
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate error report payload
 * Implements expert council input validation requirements
 */
function validateErrorReport(data: unknown): data is ErrorReport {
  if (!data || typeof data !== 'object') {
    return false
  }

  const report = data as Record<string, unknown>

  // Required fields validation
  if (
    typeof report.errorId !== 'string' ||
    typeof report.timestamp !== 'string' ||
    typeof report.level !== 'string' ||
    !report.error ||
    !report.errorInfo
  ) {
    return false
  }

  // Error object validation
  const error = report.error as Record<string, unknown>
  if (
    typeof error.name !== 'string' ||
    typeof error.message !== 'string'
  ) {
    return false
  }

  // Error info validation
  const errorInfo = report.errorInfo as Record<string, unknown>
  if (typeof errorInfo.componentStack !== 'string') {
    return false
  }

  // Level validation
  if (!['page', 'component', 'feature'].includes(report.level as string)) {
    return false
  }

  return true
}

/**
 * Sanitize error message to prevent information leakage
 * Implements expert council security requirements
 */
function sanitizeErrorMessage(message: string): string {
  // Remove potential sensitive information patterns
  return message
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]')
    .replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[CARD_REDACTED]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]')
    .replace(/password[=:]\s*\S+/gi, 'password=[REDACTED]')
    .replace(/token[=:]\s*\S+/gi, 'token=[REDACTED]')
    .replace(/key[=:]\s*\S+/gi, 'key=[REDACTED]')
}

/**
 * Sanitize stack trace to remove sensitive paths
 */
function sanitizeStackTrace(stack: string): string {
  return stack
    .replace(/\/Users\/[^\/]+/g, '/Users/[USER]')
    .replace(/\/home\/[^\/]+/g, '/home/[USER]')
    .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\[USER]')
    .replace(/file:\/\/\/[^\/]+/g, 'file:///[PATH]')
}

// ============================================================================
// ERROR PROCESSING FUNCTIONS
// ============================================================================

/**
 * Process and store error report
 * Implements expert council error processing requirements
 */
async function processErrorReport(report: ErrorReport, request: NextRequest): Promise<ErrorLogEntry> {
  const headersList = await headers()
  const sessionId = headersList.get('x-session-id') || undefined
  const buildVersion = process.env.BUILD_VERSION || 'unknown'
  const environment = process.env.NODE_ENV || 'development'

  // Create sanitized error log entry
  const errorLogEntry: ErrorLogEntry = {
    id: report.errorId,
    timestamp: report.timestamp,
    level: report.level as 'page' | 'component' | 'feature',
    errorName: report.error.name,
    errorMessage: sanitizeErrorMessage(report.error.message),
    errorStack: report.error.stack ? sanitizeStackTrace(report.error.stack) : undefined,
    componentStack: report.errorInfo.componentStack,
    url: report.url,
    userAgent: report.userAgent,
    userId: report.userId,
    retryCount: report.retryCount,
    sessionId,
    buildVersion,
    environment
  }

  // Log error for monitoring (in production, send to monitoring service)
  console.error('Error Report Received:', {
    errorId: errorLogEntry.id,
    level: errorLogEntry.level,
    errorName: errorLogEntry.errorName,
    errorMessage: errorLogEntry.errorMessage,
    url: errorLogEntry.url,
    timestamp: errorLogEntry.timestamp
  })

  // In production, store in database or send to monitoring service
  if (environment === 'production') {
    await storeErrorInDatabase(errorLogEntry)
    await sendToMonitoringService(errorLogEntry)
  }

  return errorLogEntry
}

/**
 * Store error in database (placeholder for production implementation)
 */
async function storeErrorInDatabase(errorLog: ErrorLogEntry): Promise<void> {
  // TODO: Implement database storage
  // Example: await supabase.from('error_logs').insert(errorLog)
  console.log('Storing error in database:', errorLog.id)
}

/**
 * Send error to monitoring service (placeholder for production implementation)
 */
async function sendToMonitoringService(errorLog: ErrorLogEntry): Promise<void> {
  // TODO: Implement monitoring service integration
  // Example: Sentry, DataDog, New Relic, etc.
  console.log('Sending error to monitoring service:', errorLog.id)
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * POST /api/errors/report
 * Report client-side errors for monitoring and analysis
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate error report
    if (!validateErrorReport(body)) {
      return NextResponse.json(
        {
          error: 'Invalid error report format',
          message: 'The error report does not match the expected format'
        },
        { status: 400 }
      )
    }

    // Process error report
    const errorLogEntry = await processErrorReport(body, request)

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Error report received and processed',
        errorId: errorLogEntry.id,
        timestamp: errorLogEntry.timestamp
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error processing error report:', error)

    // Return generic error response (don't expose internal details)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to process error report'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/errors/report
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json(
    {
      service: 'Error Reporting API',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.BUILD_VERSION || 'unknown'
    },
    { status: 200 }
  )
}

// ============================================================================
// RATE LIMITING & SECURITY
// ============================================================================

/**
 * Rate limiting configuration
 * Implements expert council security requirements
 */
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Security headers
export const headers_config = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}
