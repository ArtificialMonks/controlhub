// src/lib/config.ts
/**
 * Centralized configuration module for Communitee Control Hub
 * Manages all environment variables and application settings
 */

// Environment validation helper
function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function getOptionalEnvVar(name: string, defaultValue: string = ''): string {
  return process.env[name] || defaultValue
}

// Supabase Configuration
export const supabaseConfig = {
  url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  accessToken: getOptionalEnvVar('SUPABASE_ACCESS_TOKEN'),
} as const

// Authentication Configuration
export const authConfig = {
  nextAuthSecret: getEnvVar('NEXTAUTH_SECRET'),
  sessionMaxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  sessionUpdateAge: 24 * 60 * 60, // 24 hours in seconds
} as const

// n8n Integration Configuration
export const n8nConfig = {
  webhookSecret: getEnvVar('N8N_WEBHOOK_SECRET'),
  baseUrl: getOptionalEnvVar('N8N_BASE_URL', 'https://n8n.example.com'),
  apiKey: getOptionalEnvVar('N8N_API_KEY'),
} as const

// Application Configuration
export const appConfig = {
  name: 'Communitee Control Hub',
  version: '1.0.0',
  environment: getOptionalEnvVar('NODE_ENV', 'development'),
  siteUrl: getOptionalEnvVar('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000'),
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const

// Database Configuration
export const databaseConfig = {
  maxConnections: parseInt(getOptionalEnvVar('DB_MAX_CONNECTIONS', '10')),
  connectionTimeout: parseInt(getOptionalEnvVar('DB_CONNECTION_TIMEOUT', '30000')),
  queryTimeout: parseInt(getOptionalEnvVar('DB_QUERY_TIMEOUT', '60000')),
} as const

// Security Configuration
export const securityConfig = {
  corsOrigins: getOptionalEnvVar('CORS_ORIGINS', appConfig.siteUrl).split(','),
  rateLimitMax: parseInt(getOptionalEnvVar('RATE_LIMIT_MAX', '100')),
  rateLimitWindow: parseInt(getOptionalEnvVar('RATE_LIMIT_WINDOW', '900000')), // 15 minutes
  encryptionKey: getEnvVar('ENCRYPTION_KEY', 'default-dev-key-change-in-production'),
} as const

// Monitoring Configuration
export const monitoringConfig = {
  enableAnalytics: getOptionalEnvVar('ENABLE_ANALYTICS', 'true') === 'true',
  enableErrorTracking: getOptionalEnvVar('ENABLE_ERROR_TRACKING', 'true') === 'true',
  logLevel: getOptionalEnvVar('LOG_LEVEL', appConfig.isDevelopment ? 'debug' : 'info'),
  metricsEndpoint: getOptionalEnvVar('METRICS_ENDPOINT'),
} as const

// Feature Flags
export const featureFlags = {
  enableTelemetry: getOptionalEnvVar('FEATURE_TELEMETRY', 'true') === 'true',
  enableAdvancedAnalytics: getOptionalEnvVar('FEATURE_ADVANCED_ANALYTICS', 'false') === 'true',
  enableBetaFeatures: getOptionalEnvVar('FEATURE_BETA', 'false') === 'true',
  enableDebugMode: getOptionalEnvVar('FEATURE_DEBUG', appConfig.isDevelopment.toString()) === 'true',
} as const

// Export all configurations
export const config = {
  supabase: supabaseConfig,
  auth: authConfig,
  n8n: n8nConfig,
  app: appConfig,
  database: databaseConfig,
  security: securityConfig,
  monitoring: monitoringConfig,
  features: featureFlags,
} as const

// Configuration validation
export function validateConfig(): void {
  try {
    // Validate required configurations
    if (!supabaseConfig.url.startsWith('https://')) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL')
    }
    
    if (supabaseConfig.anonKey.length < 32) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid')
    }
    
    if (authConfig.nextAuthSecret.length < 32) {
      throw new Error('NEXTAUTH_SECRET must be at least 32 characters long')
    }
    
    if (n8nConfig.webhookSecret.length < 16) {
      throw new Error('N8N_WEBHOOK_SECRET must be at least 16 characters long')
    }
    
    console.log('✅ Configuration validation passed')
  } catch (error) {
    console.error('❌ Configuration validation failed:', error)
    if (appConfig.isProduction) {
      throw error
    }
  }
}

// Auto-validate configuration on import in production
if (appConfig.isProduction) {
  validateConfig()
}
