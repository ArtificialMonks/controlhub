// src/middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/integrations/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Update Supabase session
  const response = await updateSession(request)

  // Add security headers (disabled in development for debugging)
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (!isDevelopment) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  } else {
    console.log('[MIDDLEWARE DEBUG] Development mode: Security headers disabled')
  }
  
  // Content Security Policy (CSP) - More permissive for development
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') || 'xxttsckupjbvvhrykprf.supabase.co'
  
  if (isDevelopment) {
    // Development: Disable all restrictive headers
    console.log('[MIDDLEWARE DEBUG] Development mode: All security headers disabled for debugging')
    // Don't set any CSP headers in development
  } else {
    // Production: Stricter CSP
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      `connect-src 'self' https://${supabaseUrl} https://*.supabase.co wss://*.supabase.co https://api.supabase.io`,
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "media-src 'self'"
    ].join('; ')
    
    response.headers.set('Content-Security-Policy', cspDirectives)
  }
  
  // Additional security headers for navigation (disabled in development)
  if (!isDevelopment) {
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    response.headers.set('Access-Control-Allow-Origin', siteUrl)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
