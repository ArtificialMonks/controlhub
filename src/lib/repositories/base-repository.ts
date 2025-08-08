// src/lib/repositories/base-repository.ts
/**
 * Base Repository Pattern Implementation for Quest 6.1 Enterprise-Grade Settings
 * Provides data access abstraction with caching, error handling, and type safety
 */

import { createClient } from '@/lib/integrations/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface CacheConfig {
  ttl: number // Time to live in seconds
  maxSize: number // Maximum cache entries
  enabled: boolean
}

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number // Base delay in milliseconds
  maxDelay: number // Maximum delay in milliseconds
  backoffFactor: number
}

export interface RepositoryConfig {
  cache: CacheConfig
  retry: RetryConfig
  enableAuditTrail: boolean
  encryptSensitiveData: boolean
}

export interface AuditTrailEntry {
  userId: string
  action: 'create' | 'read' | 'update' | 'delete'
  tableName: string
  recordId: string
  timestamp: Date
  ipAddress?: string
  userAgent?: string
  changes?: Record<string, { old: unknown; new: unknown }>
}

export interface RepositoryResult<T> {
  success: boolean
  data?: T
  error?: string
  cached?: boolean
  timestamp: Date
}

export interface QueryOptions {
  useCache?: boolean
  skipAudit?: boolean
  retryOnFailure?: boolean
  timeout?: number
}

/**
 * Base Repository class providing common data access patterns
 */
export abstract class BaseRepository<T extends Record<string, unknown>> {
  protected supabase: SupabaseClient
  protected cache: Map<string, { data: T; timestamp: number; ttl: number }>
  protected config: RepositoryConfig
  protected tableName: string

  constructor(tableName: string, config?: Partial<RepositoryConfig>) {
    this.supabase = createClient()
    this.cache = new Map()
    this.tableName = tableName
    this.config = {
      cache: {
        ttl: 300, // 5 minutes default
        maxSize: 1000,
        enabled: true,
        ...config?.cache
      },
      retry: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
        ...config?.retry
      },
      enableAuditTrail: true,
      encryptSensitiveData: true,
      ...config
    }
  }

  /**
   * Get record by ID with caching and error handling
   */
  async findById(id: string, options: QueryOptions = {}): Promise<RepositoryResult<T>> {
    const cacheKey = `${this.tableName}:${id}`
    
    try {
      // Check cache first
      if (options.useCache !== false && this.config.cache.enabled) {
        const cached = this.getFromCache(cacheKey)
        if (cached) {
          return {
            success: true,
            data: cached,
            cached: true,
            timestamp: new Date()
          }
        }
      }

      // Execute query with retry logic
      const result = await this.executeWithRetry(async () => {
        const { data, error } = await this.supabase
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        return data as T
      }, options.retryOnFailure !== false)

      // Cache the result
      if (this.config.cache.enabled && result) {
        this.setCache(cacheKey, result)
      }

      // Audit trail
      if (this.config.enableAuditTrail && !options.skipAudit) {
        await this.createAuditEntry({
          userId: await this.getCurrentUserId(),
          action: 'read',
          tableName: this.tableName,
          recordId: id,
          timestamp: new Date()
        })
      }

      return {
        success: true,
        data: result,
        cached: false,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    }
  }

  /**
   * Create new record with validation and audit trail
   */
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>, options: QueryOptions = {}): Promise<RepositoryResult<T>> {
    try {
      // Validate data
      const validationResult = await this.validateData(data as Partial<T>, 'create')
      if (!validationResult.valid) {
        return {
          success: false,
          error: `Validation failed: ${validationResult.errors.join(', ')}`,
          timestamp: new Date()
        }
      }

      // Encrypt sensitive data if configured
      const processedData = this.config.encryptSensitiveData
        ? await this.encryptSensitiveFields(data as Partial<T>)
        : data

      // Execute create with retry logic
      const result = await this.executeWithRetry(async () => {
        const { data: created, error } = await this.supabase
          .from(this.tableName)
          .insert(processedData as Partial<T>)
          .select()
          .single()

        if (error) throw error
        return created as T
      }, options.retryOnFailure !== false)

      // Invalidate related cache entries
      this.invalidateCache(`${this.tableName}:*`)

      // Audit trail
      if (this.config.enableAuditTrail && !options.skipAudit) {
        await this.createAuditEntry({
          userId: await this.getCurrentUserId(),
          action: 'create',
          tableName: this.tableName,
          recordId: result.id as string,
          timestamp: new Date()
        })
      }

      return {
        success: true,
        data: result,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    }
  }

  /**
   * Update record with optimistic locking and audit trail
   */
  async update(id: string, data: Partial<T>, options: QueryOptions = {}): Promise<RepositoryResult<T>> {
    try {
      // Get current record for audit trail
      const currentResult = await this.findById(id, { skipAudit: true })
      if (!currentResult.success || !currentResult.data) {
        return {
          success: false,
          error: 'Record not found',
          timestamp: new Date()
        }
      }

      // Validate data
      const validationResult = await this.validateData(data, 'update')
      if (!validationResult.valid) {
        return {
          success: false,
          error: `Validation failed: ${validationResult.errors.join(', ')}`,
          timestamp: new Date()
        }
      }

      // Encrypt sensitive data if configured
      const processedData = this.config.encryptSensitiveData 
        ? await this.encryptSensitiveFields(data)
        : data

      // Execute update with retry logic
      const result = await this.executeWithRetry(async () => {
        const { data: updated, error } = await this.supabase
          .from(this.tableName)
          .update({ ...processedData, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return updated as T
      }, options.retryOnFailure !== false)

      // Invalidate cache
      this.invalidateCache(`${this.tableName}:${id}`)

      // Audit trail with changes
      if (this.config.enableAuditTrail && !options.skipAudit) {
        const changes = this.calculateChanges(currentResult.data, result)
        await this.createAuditEntry({
          userId: await this.getCurrentUserId(),
          action: 'update',
          tableName: this.tableName,
          recordId: id,
          timestamp: new Date(),
          changes
        })
      }

      return {
        success: true,
        data: result,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    }
  }

  /**
   * Delete record with audit trail
   */
  async delete(id: string, options: QueryOptions = {}): Promise<RepositoryResult<boolean>> {
    try {
      // Get current record for audit trail
      const currentResult = await this.findById(id, { skipAudit: true })
      
      if (!currentResult.success) {
        return { success: false, error: 'Record not found for deletion', timestamp: new Date() }
      }
      
      // Execute delete with retry logic
      await this.executeWithRetry(async () => {
        const { error } = await this.supabase
          .from(this.tableName)
          .delete()
          .eq('id', id)

        if (error) throw error
      }, options.retryOnFailure !== false)

      // Invalidate cache
      this.invalidateCache(`${this.tableName}:${id}`)

      // Audit trail
      if (this.config.enableAuditTrail && !options.skipAudit) {
        await this.createAuditEntry({
          userId: await this.getCurrentUserId(),
          action: 'delete',
          tableName: this.tableName,
          recordId: id,
          timestamp: new Date()
        })
      }

      return {
        success: true,
        data: true,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    }
  }

  // Abstract methods to be implemented by concrete repositories
  protected abstract validateData(data: Partial<T>, operation: 'create' | 'update'): Promise<{ valid: boolean; errors: string[] }>
  protected abstract encryptSensitiveFields(data: Partial<T>): Promise<Partial<T>>
  protected abstract getSensitiveFields(): string[]

  // Cache management methods
  private getFromCache(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now > entry.timestamp + entry.ttl * 1000) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  private setCache(key: string, data: T): void {
    if (this.cache.size >= this.config.cache.maxSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.config.cache.ttl
    })
  }

  protected invalidateCache(pattern: string): void {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1)
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.delete(pattern)
    }
  }

  // Retry logic implementation
  private async executeWithRetry<R>(
    operation: () => Promise<R>,
    enableRetry: boolean = true
  ): Promise<R> {
    if (!enableRetry) {
      return await operation()
    }

    let lastError: Error
    let delay = this.config.retry.baseDelay

    for (let attempt = 1; attempt <= this.config.retry.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt === this.config.retry.maxAttempts) {
          throw lastError
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay))
        delay = Math.min(delay * this.config.retry.backoffFactor, this.config.retry.maxDelay)
      }
    }

    // This should never be reached due to the throw in the loop
    throw new Error('Operation failed after retries')
  }

  // Utility methods
  private calculateChanges(oldData: T, newData: T): Record<string, { old: unknown; new: unknown }> {
    const changes: Record<string, { old: unknown; new: unknown }> = {}
    
    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          old: oldData[key],
          new: newData[key]
        }
      }
    }

    return changes
  }

  private async getCurrentUserId(): Promise<string> {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user?.id || 'system'
  }

  private async createAuditEntry(entry: AuditTrailEntry): Promise<void> {
    try {
      await this.supabase
        .from('audit_trail')
        .insert(entry)
    } catch (error) {
      // Log audit trail errors but don't fail the main operation
      console.warn('Failed to create audit trail entry:', error)
    }
  }
}
