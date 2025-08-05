# Security Module Documentation

## Overview

This module provides comprehensive security utilities for the Communitee Control Hub application, including both Node.js
and Edge Runtime compatible implementations.

## Files

### `encryption.ts` - Node.js Encryption Service

- Uses Node.js `crypto` module
- Full encryption capabilities with AES-256-GCM
- **Cannot be used in Edge Runtime/middleware**
- Use for server-side API routes and server actions

### `edge-encryption.ts` - Edge Runtime Encryption Service

- Uses Web Crypto API
- Edge Runtime compatible
- **Safe to use in middleware and Edge Runtime**
- Use for middleware, Edge functions, and client-side encryption

### `filterSecurity.ts` - Input Sanitization

- Comprehensive input validation and sanitization
- XSS, SQL injection, and other attack prevention
- Uses DOMPurify (may need polyfill for Edge Runtime)

## Usage Examples

### Node.js Environment (API Routes, Server Actions)

```typescript
import { EncryptionService } from '@/lib/security/encryption'

// Encrypt sensitive data
const encrypted = await EncryptionService.encrypt('sensitive data', 'password')

// Decrypt data
const decrypted = await EncryptionService.decrypt(encrypted, 'password')

// Generate secure tokens
const token = EncryptionService.generateToken(32)
const apiKey = EncryptionService.generateApiKey()
```

### Edge Runtime Environment (Middleware, Edge Functions)

```typescript
import { EdgeEncryptionService } from '@/lib/security/edge-encryption'

// Encrypt sensitive data
const encrypted = await EdgeEncryptionService.encrypt('sensitive data', 'password')

// Decrypt data
const decrypted = await EdgeEncryptionService.decrypt(encrypted, 'password')

// Generate secure tokens
const token = EdgeEncryptionService.generateToken(32)
const apiKey = EdgeEncryptionService.generateApiKey()
const uuid = EdgeEncryptionService.generateUUID()
```

### Input Sanitization

```typescript
import { FilterSecurityValidator } from '@/lib/security/filterSecurity'

const validator = new FilterSecurityValidator()

// Sanitize search input
const result = validator.sanitizeSearchInput('<script>alert("xss")</script>')
console.log(result.sanitized) // Empty string (blocked)
console.log(result.wasSanitized) // true
console.log(result.warnings) // ['Security violation: ...']

// Validate client ID
const isValid = validator.validateClientId('client-123')

// Validate status array
const validStatuses = validator.validateStatusArray(['Running', 'Stopped'])
```

## Edge Runtime Compatibility

### ✅ Edge Runtime Safe

- `EdgeEncryptionService` - Uses Web Crypto API
- `EdgeSanitizationService` - No Node.js dependencies
- `getEdgeSecurityHeaders()` - Static security headers

### ❌ Edge Runtime Incompatible

- `EncryptionService` - Uses Node.js crypto module
- Any imports from `encryption.ts` in middleware
- DOMPurify (requires polyfill or alternative)

## Migration Guide

### From Node.js to Edge Runtime

Replace:

```typescript
import { EncryptionService } from '@/lib/security/encryption'
```

With:

```typescript
import { EdgeEncryptionService } from '@/lib/security/edge-encryption'
```

The API is largely compatible, but some methods may have slight differences in behavior due to Web Crypto API limitations.

## Security Best Practices

1. **Never import Node.js crypto modules in middleware**
2. **Use environment variables for encryption keys**
3. **Always validate and sanitize user input**
4. **Use HTTPS in production**
5. **Implement proper rate limiting**
6. **Log security events for monitoring**

## Performance Considerations

- Edge Runtime encryption is generally faster for small payloads
- Node.js encryption may be better for large data processing
- Web Crypto API is optimized for browser environments
- Consider caching for frequently used operations

## Troubleshooting

### "Edge runtime does not support Node.js 'crypto' module"

- Remove imports of `encryption.ts` from middleware
- Use `edge-encryption.ts` instead
- Check all imported modules for Node.js dependencies

### DOMPurify not available in Edge Runtime

- Consider using `EdgeSanitizationService.sanitizeHtml()` instead
- Or implement custom HTML sanitization for Edge Runtime
- Use feature detection to conditionally import DOMPurify
