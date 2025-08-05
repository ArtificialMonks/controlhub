// src/lib/monitoring/logger.ts
import { config } from '@/lib/core/config'

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Log entry interface
 */
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
  error?: Error
  userId?: string
  requestId?: string
  component?: string
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  enableRemote: boolean
  component?: string
}

/**
 * Enhanced logging service
 */
export class Logger {
  private config: LoggerConfig
  private logBuffer: LogEntry[] = []
  private readonly MAX_BUFFER_SIZE = 1000

  constructor(component?: string) {
    this.config = {
      level: this.getLogLevelFromString(config.monitoring.logLevel),
      enableConsole: true,
      enableFile: false, // TODO: Implement file logging
      enableRemote: config.monitoring.enableErrorTracking,
      component,
    }
  }

  private getLogLevelFromString(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG
      case 'info': return LogLevel.INFO
      case 'warn': return LogLevel.WARN
      case 'error': return LogLevel.ERROR
      default: return LogLevel.INFO
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level
  }

  private formatLogEntry(entry: LogEntry): string {
    const levelName = LogLevel[entry.level]
    const component = entry.component ? `[${entry.component}]` : ''
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
    
    return `${entry.timestamp} ${levelName}${component}: ${entry.message}${context}`
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
      component: this.config.component,
      requestId: typeof context?.requestId === 'string' ? context.requestId : undefined,
      userId: typeof context?.userId === 'string' ? context.userId : undefined,
    }
  }

  private writeLog(entry: LogEntry): void {
    // Add to buffer
    this.logBuffer.push(entry)
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer.shift()
    }

    // Console logging
    if (this.config.enableConsole) {
      const formatted = this.formatLogEntry(entry)
      
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formatted)
          break
        case LogLevel.INFO:
          console.info(formatted)
          break
        case LogLevel.WARN:
          console.warn(formatted)
          break
        case LogLevel.ERROR:
          console.error(formatted, entry.error)
          break
      }
    }

    // Remote logging (in production)
    if (this.config.enableRemote && config.app.isProduction) {
      this.sendToRemoteLogger(entry)
    }
  }

  private async sendToRemoteLogger(entry: LogEntry): Promise<void> {
    try {
      // TODO: Implement remote logging service integration
      // This could be Datadog, New Relic, CloudWatch, etc.
      if (config.monitoring.metricsEndpoint) {
        await fetch(config.monitoring.metricsEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        })
      }
    } catch (error) {
      // Fail silently to avoid logging loops
      console.error('Failed to send log to remote service:', error)
    }
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.writeLog(this.createLogEntry(LogLevel.DEBUG, message, context))
    }
  }

  /**
   * Info level logging
   */
  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.writeLog(this.createLogEntry(LogLevel.INFO, message, context))
    }
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.writeLog(this.createLogEntry(LogLevel.WARN, message, context))
    }
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.writeLog(this.createLogEntry(LogLevel.ERROR, message, context, error))
    }
  }

  /**
   * Get recent log entries
   */
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logBuffer.slice(-count)
  }

  /**
   * Clear log buffer
   */
  clearLogs(): void {
    this.logBuffer = []
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static timers = new Map<string, number>()

  /**
   * Start timing an operation
   */
  static startTimer(name: string): void {
    this.timers.set(name, performance.now())
  }

  /**
   * End timing and log duration
   */
  static endTimer(name: string, logger?: Logger): number {
    const startTime = this.timers.get(name)
    if (!startTime) {
      throw new Error(`Timer '${name}' was not started`)
    }

    const duration = performance.now() - startTime
    this.timers.delete(name)

    if (logger) {
      logger.debug(`Performance: ${name} took ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  /**
   * Measure async operation performance
   */
  static async measure<T>(
    name: string,
    operation: () => Promise<T>,
    logger?: Logger
  ): Promise<{ result: T; duration: number }> {
    this.startTimer(name)
    try {
      const result = await operation()
      const duration = this.endTimer(name, logger)
      return { result, duration }
    } catch (error) {
      this.endTimer(name, logger)
      throw error
    }
  }
}

/**
 * Application metrics collector
 */
export class MetricsCollector {
  private static metrics = new Map<string, number>()
  private static counters = new Map<string, number>()

  /**
   * Record a metric value
   */
  static recordMetric(name: string, value: number): void {
    this.metrics.set(name, value)
  }

  /**
   * Increment a counter
   */
  static incrementCounter(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0
    this.counters.set(name, current + value)
  }

  /**
   * Get all metrics
   */
  static getMetrics(): Record<string, number> {
    return Object.fromEntries([...this.metrics, ...this.counters])
  }

  /**
   * Reset all metrics
   */
  static reset(): void {
    this.metrics.clear()
    this.counters.clear()
  }
}

// Create default logger instances
export const logger = new Logger('app')
export const apiLogger = new Logger('api')
export const authLogger = new Logger('auth')
export const dbLogger = new Logger('database')
