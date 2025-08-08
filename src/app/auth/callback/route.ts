// src/app/auth/callback/route.ts
import { createClient } from '@/lib/integrations/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('[AUTH CALLBACK DEBUG] Processing auth callback')
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error_param = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  console.log('[AUTH CALLBACK DEBUG] Callback params:', { 
    code: code ? 'present' : 'missing', 
    next, 
    error_param, 
    error_description,
    origin 
  })

  if (error_param) {
    console.error('[AUTH CALLBACK DEBUG] OAuth error:', { error_param, error_description })
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error_param)}&description=${encodeURIComponent(error_description || '')}`)
  }

  if (code) {
    try {
      console.log('[AUTH CALLBACK DEBUG] Exchanging code for session')
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('[AUTH CALLBACK DEBUG] Exchange result:')
      console.log('[AUTH CALLBACK DEBUG] - Session:', data?.session ? 'created' : 'no session')
      console.log('[AUTH CALLBACK DEBUG] - User:', data?.user?.id || 'no user')
      console.log('[AUTH CALLBACK DEBUG] - Error:', error?.message || 'no error')

      if (!error && data?.session) {
        console.log('[AUTH CALLBACK DEBUG] Auth successful, redirecting to:', next)
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`)
        } else {
          return NextResponse.redirect(`${origin}${next}`)
        }
      } else {
        console.error('[AUTH CALLBACK DEBUG] Session exchange failed:', error)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=session_exchange_failed&description=${encodeURIComponent(error?.message || 'Unknown error')}`)
      }
    } catch (error) {
      console.error('[AUTH CALLBACK DEBUG] Exception during callback:', error)
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=callback_exception&description=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`)
    }
  }

  console.error('[AUTH CALLBACK DEBUG] No auth code provided')
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code&description=No authorization code provided`)
}
