// src/middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/integrations/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Update Supabase session
  const response = await updateSession(request)

  // Add comprehensive security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy (CSP) for navigation security
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for Next.js
    "style-src 'self' 'unsafe-inline'", // Allow inline styles for Tailwind
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.supabase.io https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "media-src 'self'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', cspDirectives)
  
  // Additional security headers for navigation
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

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
