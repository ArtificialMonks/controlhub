// src/lib/middleware/error-handler.ts
import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/core/config'

/**
 * Standard error response interface
 */
export interface ErrorResponse {
  error: string
  message: string
  statusCode: number
  timestamp: string
  path: string
  requestId?: string
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, unknown>

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context
    
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Common error types
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, true, context)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: Record<string, unknown>) {
    super(message, 401, true, context)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, unknown>) {
    super(message, 403, true, context)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', context?: Record<string, unknown>) {
    super(message, 404, true, context)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 409, true, context)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: Record<string, unknown>) {
    super(message, 429, true, context)
  }
}

/**
 * Error logging utility
 */
function logError(error: Error, request: NextRequest, context?: Record<string, unknown>) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString(),
    context,
  }

  if (config.monitoring.logLevel === 'debug' || config.app.isDevelopment) {
    console.error('🚨 API Error:', errorInfo)
  } else {
    console.error('🚨 API Error:', {
      message: error.message,
      url: request.url,
      method: request.method,
      timestamp: errorInfo.timestamp,
    })
  }

  // In production, you would send this to your error tracking service
  if (config.monitoring.enableErrorTracking && config.app.isProduction) {
    // TODO: Integrate with error tracking service (e.g., Sentry, LogRocket)
    // errorTrackingService.captureException(error, errorInfo)
  }
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  error: Error,
  request: NextRequest,
  statusCode: number = 500
): NextResponse<ErrorResponse> {
  const requestId = crypto.randomUUID()
  
  const errorResponse: ErrorResponse = {
    error: error.constructor.name,
    message: config.app.isDevelopment ? error.message : 'An error occurred',
    statusCode,
    timestamp: new Date().toISOString(),
    path: new URL(request.url).pathname,
    requestId,
  }

  // Log the error
  logError(error, request, { requestId })

  return NextResponse.json(errorResponse, { 
    status: statusCode,
    headers: {
      'X-Request-ID': requestId,
      'Content-Type': 'application/json',
    }
  })
}

/**
 * Global error handler middleware for API routes
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      return await handler(request, ...args)
    } catch (error) {
      // Handle known application errors
      if (error instanceof AppError) {
        return createErrorResponse(error, request, error.statusCode)
      }

      // Handle validation errors
      if (error instanceof Error && error.name === 'ValidationError') {
        return createErrorResponse(error, request, 400)
      }

      // Handle unknown errors
      const unknownError = error instanceof Error ? error : new Error('Unknown error occurred')
      return createErrorResponse(unknownError, request, 500)
    }
  }
}

/**
 * Async error handler for server actions
 */
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`🚨 Async Error${context ? ` in ${context}` : ''}:`, errorMessage)
    
    if (config.monitoring.enableErrorTracking) {
      // TODO: Send to error tracking service
    }
    
    return null
  }
}

/**
 * Rate limiting helper
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const windowMs = config.security.rateLimitWindow
  const maxRequests = config.security.rateLimitMax

  const current = rateLimitMap.get(identifier)
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= maxRequests) {
    return false
  }
  
  current.count++
  return true
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  identifier?: (request: NextRequest) => string
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const id = identifier ? identifier(request) :
                request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'anonymous'
    
    if (!checkRateLimit(id)) {
      throw new RateLimitError('Too many requests, please try again later')
    }
    
    return handler(request)
  }
}
