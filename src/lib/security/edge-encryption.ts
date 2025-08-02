// src/lib/security/edge-encryption.ts
/**
 * Edge Runtime compatible encryption utilities using Web Crypto API
 * This module can be safely imported in middleware and Edge Runtime environments
 */

/**
 * Edge-compatible encryption service using Web Crypto API
 */
export class EdgeEncryptionService {
  private static readonly ALGORITHM = 'AES-GCM'
  private static readonly KEY_LENGTH = 256
  private static readonly IV_LENGTH = 12 // GCM standard IV length

  /**
   * Generate a random array of bytes
   */
  private static getRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length))
  }

  /**
   * Convert string to Uint8Array
   */
  private static stringToBytes(str: string): Uint8Array {
    return new TextEncoder().encode(str)
  }

  /**
   * Convert Uint8Array to string
   */
  private static bytesToString(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes)
  }

  /**
   * Convert Uint8Array to base64
   */
  private static bytesToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes))
  }

  /**
   * Convert base64 to Uint8Array
   */
  private static base64ToBytes(base64: string): Uint8Array {
    const binaryString = atob(base64)
    return new Uint8Array(binaryString.length).map((_, i) => binaryString.charCodeAt(i))
  }

  /**
   * Derive key from password using PBKDF2
   */
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      this.stringToBytes(password),
      'PBKDF2',
      false,
      ['deriveKey']
    )

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * Encrypt data using AES-GCM
   */
  static async encrypt(plaintext: string, password: string): Promise<string> {
    try {
      const salt = this.getRandomBytes(16)
      const iv = this.getRandomBytes(this.IV_LENGTH)
      const key = await this.deriveKey(password, salt)

      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv
        },
        key,
        this.stringToBytes(plaintext)
      )

      // Combine salt + iv + encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
      combined.set(salt, 0)
      combined.set(iv, salt.length)
      combined.set(new Uint8Array(encrypted), salt.length + iv.length)

      return this.bytesToBase64(combined)
    } catch (error) {
      throw new Error(`Edge encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Decrypt data using AES-GCM
   */
  static async decrypt(encryptedData: string, password: string): Promise<string> {
    try {
      const combined = this.base64ToBytes(encryptedData)
      
      // Extract components
      const salt = combined.slice(0, 16)
      const iv = combined.slice(16, 16 + this.IV_LENGTH)
      const encrypted = combined.slice(16 + this.IV_LENGTH)

      const key = await this.deriveKey(password, salt)

      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv
        },
        key,
        encrypted
      )

      return this.bytesToString(new Uint8Array(decrypted))
    } catch (error) {
      throw new Error(`Edge decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Hash data using SHA-256
   */
  static async hash(data: string, salt?: string): Promise<string> {
    const saltBytes = salt ? this.stringToBytes(salt) : this.getRandomBytes(16)
    const dataBytes = this.stringToBytes(data)
    
    // Combine salt and data
    const combined = new Uint8Array(saltBytes.length + dataBytes.length)
    combined.set(saltBytes, 0)
    combined.set(dataBytes, saltBytes.length)

    const hashBuffer = await crypto.subtle.digest('SHA-256', combined)
    const hashBytes = new Uint8Array(hashBuffer)
    
    // Combine salt + hash for output
    const result = new Uint8Array(saltBytes.length + hashBytes.length)
    result.set(saltBytes, 0)
    result.set(hashBytes, saltBytes.length)
    
    return this.bytesToBase64(result)
  }

  /**
   * Verify hashed data
   */
  static async verifyHash(data: string, hashedData: string): Promise<boolean> {
    try {
      const combined = this.base64ToBytes(hashedData)
      const salt = combined.slice(0, 16)
      const originalHash = combined.slice(16)
      
      const dataBytes = this.stringToBytes(data)
      const newCombined = new Uint8Array(salt.length + dataBytes.length)
      newCombined.set(salt, 0)
      newCombined.set(dataBytes, salt.length)
      
      const newHashBuffer = await crypto.subtle.digest('SHA-256', newCombined)
      const newHash = new Uint8Array(newHashBuffer)
      
      // Compare hashes
      return originalHash.length === newHash.length && 
             originalHash.every((byte, i) => byte === newHash[i])
    } catch {
      return false
    }
  }

  /**
   * Generate secure random token
   */
  static generateToken(length: number = 32): string {
    const bytes = this.getRandomBytes(length)
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Generate secure API key
   */
  static generateApiKey(): string {
    const prefix = 'chub_'
    const randomPart = this.generateToken(24)
    return `${prefix}${randomPart}`
  }

  /**
   * Generate UUID v4
   */
  static generateUUID(): string {
    const bytes = this.getRandomBytes(16)
    bytes[6] = (bytes[6] & 0x0f) | 0x40 // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80 // Variant bits
    
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32)
    ].join('-')
  }
}

/**
 * Edge-compatible sanitization service
 */
export class EdgeSanitizationService {
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
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production' && parsedUrl.protocol !== 'https:') {
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
 * Edge-compatible security headers utility
 */
export function getEdgeSecurityHeaders(): Record<string, string> {
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