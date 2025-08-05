// src/lib/performance/webhook-performance-monitor.ts
// Implements Expert Council P1 recommendation for API response tracking
// Performance Expert consensus: API response time optimization and monitoring

import { createClient } from '@/lib/integrations/supabase/server';

/**
 * Performance monitoring interface for webhook endpoints
 * Implements Expert Council recommendation for comprehensive performance tracking
 */
export interface WebhookPerformanceMetrics {
  requestId: string;
  endpointPath: string;
  responseTimeMs: number;
  authenticationTimeMs?: number;
  validationTimeMs?: number;
  databaseTimeMs?: number;
  httpMethod: string;
  statusCode: number;
  payloadSizeBytes?: number;
  errorType?: string;
  errorMessage?: string;
  userId?: string;
  automationId?: string;
}

/**
 * Performance monitoring utility for webhook endpoints
 * Based on Expert Council Performance Expert recommendations
 */
export class WebhookPerformanceMonitor {
  private startTime: number;
  private metrics: Partial<WebhookPerformanceMetrics>;
  private authenticationStartTime?: number;
  private validationStartTime?: number;
  private databaseStartTime?: number;

  constructor(requestId: string, endpointPath: string, httpMethod: string = 'POST') {
    this.startTime = performance.now();
    this.metrics = {
      requestId,
      endpointPath,
      httpMethod,
    };
  }

  /**
   * Mark the start of authentication phase
   * Tracks authentication performance as recommended by Expert Council
   */
  startAuthentication(): void {
    this.authenticationStartTime = performance.now();
  }

  /**
   * Mark the end of authentication phase
   * Calculates authentication duration for performance analysis
   */
  endAuthentication(): void {
    if (this.authenticationStartTime) {
      this.metrics.authenticationTimeMs = Math.round(
        performance.now() - this.authenticationStartTime
      );
    }
  }

  /**
   * Mark the start of validation phase
   * Tracks input validation performance
   */
  startValidation(): void {
    this.validationStartTime = performance.now();
  }

  /**
   * Mark the end of validation phase
   * Calculates validation duration for performance analysis
   */
  endValidation(): void {
    if (this.validationStartTime) {
      this.metrics.validationTimeMs = Math.round(
        performance.now() - this.validationStartTime
      );
    }
  }

  /**
   * Mark the start of database operations
   * Tracks database performance as recommended by Performance Expert
   */
  startDatabase(): void {
    this.databaseStartTime = performance.now();
  }

  /**
   * Mark the end of database operations
   * Calculates database operation duration for RLS performance analysis
   */
  endDatabase(): void {
    if (this.databaseStartTime) {
      this.metrics.databaseTimeMs = Math.round(
        performance.now() - this.databaseStartTime
      );
    }
  }

  /**
   * Set user context for performance tracking
   * Links performance metrics to specific users for analysis
   */
  setUserContext(userId: string): void {
    this.metrics.userId = userId;
  }

  /**
   * Set automation context for performance tracking
   * Links performance metrics to specific automations for analysis
   */
  setAutomationContext(automationId: string): void {
    this.metrics.automationId = automationId;
  }

  /**
   * Set payload size for bandwidth analysis
   * Tracks payload size impact on performance
   */
  setPayloadSize(sizeBytes: number): void {
    this.metrics.payloadSizeBytes = sizeBytes;
  }

  /**
   * Record error information for performance analysis
   * Tracks error impact on response times
   */
  recordError(errorType: string, errorMessage: string): void {
    this.metrics.errorType = errorType;
    this.metrics.errorMessage = errorMessage;
  }

  /**
   * Complete performance monitoring and store metrics
   * Implements Expert Council recommendation for comprehensive performance tracking
   */
  async complete(statusCode: number): Promise<void> {
    const totalResponseTime = Math.round(performance.now() - this.startTime);
    
    const finalMetrics: WebhookPerformanceMetrics = {
      requestId: this.metrics.requestId!,
      endpointPath: this.metrics.endpointPath!,
      responseTimeMs: totalResponseTime,
      authenticationTimeMs: this.metrics.authenticationTimeMs,
      validationTimeMs: this.metrics.validationTimeMs,
      databaseTimeMs: this.metrics.databaseTimeMs,
      httpMethod: this.metrics.httpMethod!,
      statusCode,
      payloadSizeBytes: this.metrics.payloadSizeBytes,
      errorType: this.metrics.errorType,
      errorMessage: this.metrics.errorMessage,
      userId: this.metrics.userId,
      automationId: this.metrics.automationId,
    };

    // Store metrics in database for analysis
    await this.storeMetrics(finalMetrics);

    // Log performance metrics for immediate monitoring
    this.logPerformanceMetrics(finalMetrics);
  }

  /**
   * Store performance metrics in database
   * Implements database storage for performance analysis
   */
  private async storeMetrics(metrics: WebhookPerformanceMetrics): Promise<void> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from('webhook_performance_logs')
        .insert({
          endpoint_path: metrics.endpointPath,
          request_id: metrics.requestId,
          user_id: metrics.userId || null,
          automation_id: metrics.automationId || null,
          response_time_ms: metrics.responseTimeMs,
          authentication_time_ms: metrics.authenticationTimeMs || null,
          validation_time_ms: metrics.validationTimeMs || null,
          database_time_ms: metrics.databaseTimeMs || null,
          http_method: metrics.httpMethod,
          status_code: metrics.statusCode,
          payload_size_bytes: metrics.payloadSizeBytes || null,
          error_type: metrics.errorType || null,
          error_message: metrics.errorMessage || null,
          request_timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to store performance metrics:', error);
      }
    } catch (error) {
      console.error('Error storing performance metrics:', error);
    }
  }

  /**
   * Log performance metrics for immediate monitoring
   * Provides real-time performance visibility
   */
  private logPerformanceMetrics(metrics: WebhookPerformanceMetrics): void {
    const logData = {
      requestId: metrics.requestId,
      endpoint: metrics.endpointPath,
      totalTime: `${metrics.responseTimeMs}ms`,
      authTime: metrics.authenticationTimeMs ? `${metrics.authenticationTimeMs}ms` : 'N/A',
      validationTime: metrics.validationTimeMs ? `${metrics.validationTimeMs}ms` : 'N/A',
      dbTime: metrics.databaseTimeMs ? `${metrics.databaseTimeMs}ms` : 'N/A',
      statusCode: metrics.statusCode,
      payloadSize: metrics.payloadSizeBytes ? `${metrics.payloadSizeBytes} bytes` : 'N/A',
    };

    // Performance threshold warnings (Expert Council recommendation: < 200ms)
    if (metrics.responseTimeMs > 200) {
      console.warn('🐌 Slow webhook response detected:', logData);
    } else if (metrics.responseTimeMs > 100) {
      console.info('⚠️ Webhook response above optimal:', logData);
    } else {
      console.info('✅ Webhook performance optimal:', logData);
    }

    // Database performance warnings (RLS optimization validation)
    if (metrics.databaseTimeMs && metrics.databaseTimeMs > 50) {
      console.warn('🗄️ Slow database operation detected:', {
        requestId: metrics.requestId,
        dbTime: `${metrics.databaseTimeMs}ms`,
        suggestion: 'Check RLS policy optimization and indexing',
      });
    }

    // Authentication performance warnings
    if (metrics.authenticationTimeMs && metrics.authenticationTimeMs > 20) {
      console.warn('🔐 Slow authentication detected:', {
        requestId: metrics.requestId,
        authTime: `${metrics.authenticationTimeMs}ms`,
        suggestion: 'Consider authentication optimization',
      });
    }
  }
}

/**
 * Performance analysis utilities
 * Implements Expert Council recommendation for performance monitoring
 */
export class WebhookPerformanceAnalyzer {
  /**
   * Get performance summary for a specific endpoint
   * Provides performance insights for optimization
   */
  static async getEndpointPerformanceSummary(
    endpointPath: string = '/api/webhooks/n8n',
    hours: number = 24
  ): Promise<{
    totalRequests: number;
    avgResponseTimeMs: number;
    p95ResponseTimeMs: number;
    successRate: number;
    errorCount: number;
  } | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .rpc('get_webhook_performance_metrics', {
          p_endpoint_path: endpointPath,
          p_hours: hours,
        });

      if (error) {
        console.error('Failed to get performance summary:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error getting performance summary:', error);
      return null;
    }
  }

  /**
   * Get automation performance summary for a user
   * Provides user-specific performance insights
   */
  static async getAutomationPerformanceSummary(
    userId: string,
    days: number = 30
  ): Promise<{
    totalAutomations: number;
    activeAutomations: number;
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    avgSuccessRate: number;
    avgResponseTimeMs: number;
  } | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .rpc('get_automation_performance_summary', {
          p_user_id: userId,
          p_days: days,
        });

      if (error) {
        console.error('Failed to get automation performance summary:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error getting automation performance summary:', error);
      return null;
    }
  }

  /**
   * Check if performance meets Expert Council thresholds
   * Validates performance against established benchmarks
   */
  static validatePerformanceThresholds(metrics: WebhookPerformanceMetrics): {
    isOptimal: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Expert Council threshold: API response < 200ms
    if (metrics.responseTimeMs > 200) {
      warnings.push(`Response time ${metrics.responseTimeMs}ms exceeds 200ms threshold`);
      recommendations.push('Investigate database query optimization and RLS policy performance');
    }

    // Database performance threshold: < 50ms
    if (metrics.databaseTimeMs && metrics.databaseTimeMs > 50) {
      warnings.push(`Database time ${metrics.databaseTimeMs}ms exceeds 50ms threshold`);
      recommendations.push('Verify RLS policy optimization and index usage');
    }

    // Authentication performance threshold: < 20ms
    if (metrics.authenticationTimeMs && metrics.authenticationTimeMs > 20) {
      warnings.push(`Authentication time ${metrics.authenticationTimeMs}ms exceeds 20ms threshold`);
      recommendations.push('Consider authentication mechanism optimization');
    }

    // Validation performance threshold: < 10ms
    if (metrics.validationTimeMs && metrics.validationTimeMs > 10) {
      warnings.push(`Validation time ${metrics.validationTimeMs}ms exceeds 10ms threshold`);
      recommendations.push('Optimize input validation logic');
    }

    return {
      isOptimal: warnings.length === 0,
      warnings,
      recommendations,
    };
  }
}

/**
 * Performance monitoring middleware for webhook endpoints
 * Easy integration with existing webhook implementations
 */
export function createPerformanceMonitor(
  requestId: string,
  endpointPath: string,
  httpMethod: string = 'POST'
): WebhookPerformanceMonitor {
  return new WebhookPerformanceMonitor(requestId, endpointPath, httpMethod);
}
