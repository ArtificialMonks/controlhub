// src/app/api/users/profile/route.ts
import { createClient } from '@/lib/integrations/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * User profile management API
 * GET: Retrieve user profile
 * PUT: Update user profile
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile from profiles table (optional)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // If profile doesn't exist, that's okay - we still have the user
    if (profileError) {
      console.warn('Profile fetch error (table may not exist):', profileError)
    }

    return NextResponse.json({
      email: user.email,
      profile: profile || null,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      }
    })
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { full_name, avatar_url, website } = body

    // Update user profile
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name,
        avatar_url,
        website,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Profile update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
