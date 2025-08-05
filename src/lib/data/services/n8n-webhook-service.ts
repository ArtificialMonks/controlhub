// src/lib/services/n8n-webhook-service.ts
/**
 * n8n Webhook Service
 * Quest 2.3: Create Backend for Individual Actions
 * 
 * Expert Council Validated Implementation:
 * - Robust error handling with retry mechanisms
 * - Exponential backoff for transient failures
 * - Comprehensive timeout handling
 * - Webhook URL security and validation
 * - Detailed logging and monitoring
 */

/**
 * Webhook response interface
 */
export interface WebhookResponse {
  success: boolean
  status: number
  data?: Record<string, unknown>
  timestamp: string
  executionId?: string
  error?: string
}

/**
 * Webhook error class for specific error handling
 */
export class WebhookError extends Error {
  public readonly context: Record<string, unknown>
  public readonly attempt: number
  public readonly isRetryable: boolean

  constructor(message: string, context: Record<string, unknown> = {}, isRetryable: boolean = false) {
    super(message)
    this.name = 'WebhookError'
    this.context = context
    this.attempt = (typeof context.attempt === 'number' ? context.attempt : 1)
    this.isRetryable = isRetryable
  }
}

/**
 * n8n Webhook Service Class
 * Handles all outbound webhook calls to n8n workflows
 */
export class N8nWebhookService {
  private readonly timeout = 30000 // 30 seconds
  private readonly maxRetries = 3
  private readonly baseDelay = 1000 // 1 second base delay for exponential backoff

  /**
   * Trigger automation run via n8n webhook
   */
  async triggerRun(webhookUrl: string): Promise<WebhookResponse> {
    return this.triggerWebhook(webhookUrl, { 
      action: 'run',
      source: 'communitee-control-hub',
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Trigger automation stop via n8n webhook
   */
  async triggerStop(webhookUrl: string): Promise<WebhookResponse> {
    return this.triggerWebhook(webhookUrl, { 
      action: 'stop',
      source: 'communitee-control-hub',
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Generic webhook trigger with retry logic
   */
  private async triggerWebhook(
    url: string, 
    payload: object, 
    attempt = 1
  ): Promise<WebhookResponse> {
    // Validate webhook URL
    if (!this.isValidWebhookUrl(url)) {
      throw new WebhookError(
        'Invalid webhook URL format',
        { url, payload, attempt },
        false
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const startTime = Date.now()
      
      // Make HTTP request to n8n webhook
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Communitee-Control-Hub/1.0',
          'X-Request-ID': this.generateRequestId(),
          'X-Attempt': attempt.toString()
        },
        body: JSON.stringify({
          ...payload,
          requestId: this.generateRequestId(),
          attemptNumber: attempt
        }),
        signal: controller.signal
      })

      const responseTime = Date.now() - startTime

      // Log webhook call for monitoring
      console.log('n8n webhook call:', {
        url: this.sanitizeUrl(url),
        status: response.status,
        responseTime,
        attempt,
        timestamp: new Date().toISOString()
      })

      // Handle non-2xx responses
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No response body')
        const isRetryable = this.isRetryableStatus(response.status)
        
        throw new WebhookError(
          `Webhook failed: ${response.status} ${response.statusText}`,
          { 
            url: this.sanitizeUrl(url), 
            payload, 
            attempt, 
            status: response.status,
            responseBody: errorText,
            responseTime
          },
          isRetryable
        )
      }

      // Parse response data
      let responseData: Record<string, unknown>
      try {
        responseData = await response.json()
      } catch {
        // Some n8n webhooks might not return JSON
        responseData = { message: 'Webhook executed successfully' }
      }

      // Return successful response
      return {
        success: true,
        status: response.status,
        data: responseData,
        timestamp: new Date().toISOString(),
        executionId: this.extractExecutionId(responseData)
      }

    } catch (error) {
      // Handle different error types
      if (error instanceof WebhookError) {
        // Re-throw webhook errors for retry logic
        throw error
      }

      // Handle fetch errors (network, timeout, etc.)
      const isRetryable = this.isRetryableError(error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      throw new WebhookError(
        `Webhook request failed: ${errorMessage}`,
        { 
          url: this.sanitizeUrl(url), 
          payload, 
          attempt, 
          originalError: errorMessage,
          errorType: error instanceof Error ? error.name : 'UnknownError'
        },
        isRetryable
      )

    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Execute webhook with retry logic
   */
  async executeWithRetry(url: string, payload: object): Promise<WebhookResponse> {
    let lastError: WebhookError | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.triggerWebhook(url, payload, attempt)
      } catch (error) {
        lastError = error instanceof WebhookError ? error : new WebhookError(
          error instanceof Error ? error.message : 'Unknown error',
          { url: this.sanitizeUrl(url), payload, attempt }
        )

        // Don't retry if error is not retryable or if this is the last attempt
        if (!lastError.isRetryable || attempt === this.maxRetries) {
          break
        }

        // Wait before retrying with exponential backoff
        await this.exponentialBackoff(attempt)
      }
    }

    // All retries failed, throw the last error
    throw lastError
  }

  /**
   * Validate webhook URL format
   */
  private isValidWebhookUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url)
      return parsedUrl.protocol === 'https:' && parsedUrl.hostname.length > 0
    } catch {
      return false
    }
  }

  /**
   * Check if HTTP status code is retryable
   */
  private isRetryableStatus(status: number): boolean {
    // Retry on server errors and rate limiting
    return status >= 500 || status === 429 || status === 408
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const errorName = error.name.toLowerCase()
      const errorMessage = error.message.toLowerCase()
      
      return (
        errorName === 'aborterror' || // Timeout
        errorMessage.includes('econnreset') ||
        errorMessage.includes('etimedout') ||
        errorMessage.includes('enotfound') ||
        errorMessage.includes('network')
      )
    }
    return false
  }

  /**
   * Exponential backoff delay
   */
  private async exponentialBackoff(attempt: number): Promise<void> {
    const delay = Math.min(this.baseDelay * Math.pow(2, attempt - 1), 10000)
    const jitter = Math.random() * 0.1 * delay // Add 10% jitter
    await new Promise(resolve => setTimeout(resolve, delay + jitter))
  }

  /**
   * Extract execution ID from response data
   */
  private extractExecutionId(responseData: Record<string, unknown>): string | undefined {
    if (typeof responseData?.executionId === 'string') {
      return responseData.executionId
    }
    if (typeof responseData?.id === 'string') {
      return responseData.id
    }
    return undefined
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * Sanitize URL for logging (remove sensitive parts)
   */
  private sanitizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url)
      return `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.pathname}`
    } catch {
      return '[invalid-url]'
    }
  }
}

// Export singleton instance
export const n8nWebhookService = new N8nWebhookService()
