// src/app/api/auth/signout/route.ts
import { createClient } from '@/lib/integrations/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Sign out API endpoint
 * Handles user logout and session cleanup
 */
export async function POST() {
  try {
    const supabase = await createClient()
    
    // Sign out the user
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Sign out error:', error)
      return NextResponse.json(
        { error: 'Failed to sign out' },
        { status: 500 }
      )
    }

    // Create response and clear cookies
    const response = NextResponse.json(
      { message: 'Signed out successfully' },
      { status: 200 }
    )

    // Clear auth cookies
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')

    return response
  } catch (error) {
    console.error('Sign out API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
