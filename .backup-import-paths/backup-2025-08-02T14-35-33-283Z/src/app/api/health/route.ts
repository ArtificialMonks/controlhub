// src/app/api/health/route.ts
/**
 * Health Check API Endpoint - Quest 4.4
 * Implements expert council deployment validation requirements
 * Comprehensive health monitoring for CI/CD pipeline validation
 */

import { NextResponse } from 'next/server'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface HealthCheckResult {
  service: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime: number
  details?: string
  lastChecked: string
}

interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  version: string
  environment: string
  uptime: number
  checks: HealthCheckResult[]
  summary: {
    total: number
    healthy: number
    unhealthy: number
    degraded: number
  }
}

// ============================================================================
// HEALTH CHECK FUNCTIONS
// ============================================================================

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheckResult> {
  const startTime = Date.now()
  
  try {
    // Simple database connectivity check
    // In a real implementation, this would check Supabase connection
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    })
    
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      return {
        service: 'database',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        details: `Database connection successful (${responseTime}ms)`,
        lastChecked: new Date().toISOString()
      }
    } else {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime,
        details: `Database connection failed: ${response.status}`,
        lastChecked: new Date().toISOString()
      }
    }
    
  } catch (error) {
    return {
      service: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      details: `Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date().toISOString()
    }
  }
}

/**
 * Check external API dependencies
 */
async function checkExternalAPIs(): Promise<HealthCheckResult> {
  const startTime = Date.now()
  
  try {
    // Check if external APIs are accessible
    const checks = []
    
    // Example: Check N8N API if configured
    if (process.env.N8N_BASE_URL) {
      try {
        const n8nResponse = await fetch(`${process.env.N8N_BASE_URL}/healthz`, {
          method: 'GET'
        })
        checks.push({ service: 'n8n', healthy: n8nResponse.ok })
      } catch {
        checks.push({ service: 'n8n', healthy: false })
      }
    }
    
    const responseTime = Date.now() - startTime
    const allHealthy = checks.every(check => check.healthy)
    const anyHealthy = checks.some(check => check.healthy)
    
    return {
      service: 'external-apis',
      status: allHealthy ? 'healthy' : anyHealthy ? 'degraded' : 'unhealthy',
      responseTime,
      details: `External APIs checked: ${checks.length}, healthy: ${checks.filter(c => c.healthy).length}`,
      lastChecked: new Date().toISOString()
    }
    
  } catch (error) {
    return {
      service: 'external-apis',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      details: `External API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date().toISOString()
    }
  }
}

/**
 * Check system resources
 */
async function checkSystemResources(): Promise<HealthCheckResult> {
  const startTime = Date.now()
  
  try {
    // Check memory usage
    const memoryUsage = process.memoryUsage()
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)
    const memoryUsagePercent = (memoryUsedMB / memoryTotalMB) * 100
    
    // Check uptime
    const uptimeSeconds = process.uptime()
    
    const responseTime = Date.now() - startTime
    
    // Determine status based on resource usage
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (memoryUsagePercent > 90) {
      status = 'unhealthy'
    } else if (memoryUsagePercent > 75) {
      status = 'degraded'
    }
    
    return {
      service: 'system-resources',
      status,
      responseTime,
      details: `Memory: ${memoryUsedMB}MB/${memoryTotalMB}MB (${memoryUsagePercent.toFixed(1)}%), Uptime: ${Math.round(uptimeSeconds)}s`,
      lastChecked: new Date().toISOString()
    }
    
  } catch (error) {
    return {
      service: 'system-resources',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      details: `System resource check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date().toISOString()
    }
  }
}

/**
 * Check application functionality
 */
async function checkApplicationHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now()
  
  try {
    // Basic application health checks
    const checks = {
      environment: !!process.env.NODE_ENV,
      supabaseConfig: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      buildInfo: true // In production, check if build info is available
    }
    
    const responseTime = Date.now() - startTime
    const allHealthy = Object.values(checks).every(check => check)
    
    return {
      service: 'application',
      status: allHealthy ? 'healthy' : 'unhealthy',
      responseTime,
      details: `Environment: ${checks.environment}, Supabase: ${checks.supabaseConfig}, Build: ${checks.buildInfo}`,
      lastChecked: new Date().toISOString()
    }
    
  } catch (error) {
    return {
      service: 'application',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      details: `Application health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date().toISOString()
    }
  }
}

// ============================================================================
// MAIN HEALTH CHECK FUNCTION
// ============================================================================

/**
 * Perform comprehensive system health check
 */
async function performHealthCheck(): Promise<SystemHealth> {
  const startTime = Date.now()
  
  // Run all health checks in parallel
  const [
    databaseCheck,
    externalAPIsCheck,
    systemResourcesCheck,
    applicationCheck
  ] = await Promise.all([
    checkDatabase(),
    checkExternalAPIs(),
    checkSystemResources(),
    checkApplicationHealth()
  ])
  
  const checks = [databaseCheck, externalAPIsCheck, systemResourcesCheck, applicationCheck]
  
  // Calculate summary
  const summary = {
    total: checks.length,
    healthy: checks.filter(c => c.status === 'healthy').length,
    unhealthy: checks.filter(c => c.status === 'unhealthy').length,
    degraded: checks.filter(c => c.status === 'degraded').length
  }
  
  // Determine overall status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  if (summary.unhealthy > 0) {
    overallStatus = 'unhealthy'
  } else if (summary.degraded > 0) {
    overallStatus = 'degraded'
  }
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.BUILD_VERSION || 'unknown',
    environment: process.env.NODE_ENV || 'unknown',
    uptime: Date.now() - startTime,
    checks,
    summary
  }
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/health
 * Comprehensive health check endpoint for CI/CD validation
 */
export async function GET() {
  try {
    const healthCheck = await performHealthCheck()
    
    // Determine HTTP status code based on health
    let statusCode = 200
    if (healthCheck.status === 'degraded') {
      statusCode = 200 // Still OK, but with warnings
    } else if (healthCheck.status === 'unhealthy') {
      statusCode = 503 // Service Unavailable
    }
    
    return NextResponse.json(healthCheck, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.BUILD_VERSION || 'unknown',
        environment: process.env.NODE_ENV || 'unknown',
        uptime: 0,
        checks: [],
        summary: { total: 0, healthy: 0, unhealthy: 1, degraded: 0 },
        error: 'Health check system failure'
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  }
}

/**
 * HEAD /api/health
 * Simple health check for basic connectivity testing
 */
export async function HEAD() {
  try {
    // Quick health check without detailed response
    const isHealthy = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NODE_ENV)
    
    return new NextResponse(null, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
    
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}
