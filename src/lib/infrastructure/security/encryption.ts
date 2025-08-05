// src/lib/security/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto'
import { promisify } from 'util'
import { config } from '@/lib/core/config'

const scryptAsync = promisify(scrypt)

/**
 * Encryption utilities for sensitive data
 */
export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm'
  private static readonly KEY_LENGTH = 32
  private static readonly IV_LENGTH = 16
  private static readonly TAG_LENGTH = 16
  private static readonly SALT_LENGTH = 32

  /**
   * Derive encryption key from password and salt
   */
  private static async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(password, salt, this.KEY_LENGTH)) as Buffer
  }

  /**
   * Encrypt sensitive data
   */
  static async encrypt(plaintext: string, password?: string): Promise<string> {
    try {
      const key = password || config.security.encryptionKey
      const salt = randomBytes(this.SALT_LENGTH)
      const iv = randomBytes(this.IV_LENGTH)
      const derivedKey = await this.deriveKey(key, salt)

      const cipher = createCipheriv(this.ALGORITHM, derivedKey, iv)
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const tag = cipher.getAuthTag()

      // Combine salt + iv + tag + encrypted data
      const combined = Buffer.concat([
        salt,
        iv,
        tag,
        Buffer.from(encrypted, 'hex')
      ])

      return combined.toString('base64')
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Decrypt sensitive data
   */
  static async decrypt(encryptedData: string, password?: string): Promise<string> {
    try {
      const key = password || config.security.encryptionKey
      const combined = Buffer.from(encryptedData, 'base64')

      // Extract components
      const salt = combined.subarray(0, this.SALT_LENGTH)
      const iv = combined.subarray(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH)
      const tag = combined.subarray(
        this.SALT_LENGTH + this.IV_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH
      )
      const encrypted = combined.subarray(this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH)

      const derivedKey = await this.deriveKey(key, salt)
      const decipher = createDecipheriv(this.ALGORITHM, derivedKey, iv)
      decipher.setAuthTag(tag)

      let decrypted = decipher.update(encrypted, undefined, 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  static async hash(data: string, salt?: string): Promise<string> {
    const saltBuffer = salt ? Buffer.from(salt, 'hex') : randomBytes(this.SALT_LENGTH)
    const hash = await this.deriveKey(data, saltBuffer)
    
    // Combine salt + hash
    const combined = Buffer.concat([saltBuffer, hash])
    return combined.toString('hex')
  }

  /**
   * Verify hashed data
   */
  static async verifyHash(data: string, hashedData: string): Promise<boolean> {
    try {
      const combined = Buffer.from(hashedData, 'hex')
      const salt = combined.subarray(0, this.SALT_LENGTH)
      const originalHash = combined.subarray(this.SALT_LENGTH)
      
      const newHash = await this.deriveKey(data, salt)
      
      return originalHash.equals(newHash)
    } catch {
      return false
    }
  }

  /**
   * Generate secure random token
   */
  static generateToken(length: number = 32): string {
    return randomBytes(length).toString('hex')
  }

  /**
   * Generate secure API key
   */
  static generateApiKey(): string {
    const prefix = 'chub_'
    const randomPart = this.generateToken(24)
    return `${prefix}${randomPart}`
  }
}

/**
 * Input sanitization utilities
 */
export class SanitizationService {
  /**
   * Sanitize HTML input to prevent XSS
   */
  static sanitizeHtml(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  /**
   * Sanitize SQL input to prevent injection
   */
  static sanitizeSql(input: string): string {
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
  }

  /**
   * Validate and sanitize email
   */
  static sanitizeEmail(email: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const sanitized = email.trim().toLowerCase()
    
    if (!emailRegex.test(sanitized)) {
      return null
    }
    
    return sanitized
  }

  /**
   * Sanitize URL to prevent open redirects
   */
  static sanitizeUrl(url: string, allowedDomains?: string[]): string | null {
    try {
      const parsedUrl = new URL(url)
      
      // Only allow HTTPS in production
      if (config.app.isProduction && parsedUrl.protocol !== 'https:') {
        return null
      }
      
      // Check allowed domains if specified
      if (allowedDomains && !allowedDomains.includes(parsedUrl.hostname)) {
        return null
      }
      
      return parsedUrl.toString()
    } catch {
      return null
    }
  }

  /**
   * Remove potentially dangerous characters from filename
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .substring(0, 255)
  }
}

/**
 * Security headers utility
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.supabase.co wss://realtime.supabase.co",
      "frame-ancestors 'none'",
    ].join('; '),
  }
}
