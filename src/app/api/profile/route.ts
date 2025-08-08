// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/integrations/supabase/server'

export async function GET() {
  try {
    console.log('[PROFILE API] ===== GET PROFILE START =====')
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('[PROFILE API] Auth result:', {
      user: user ? `${user.id} (${user.email})` : 'null',
      authError: authError ? authError.message : 'none'
    })

    if (authError || !user) {
      console.log('[PROFILE API] ❌ Unauthorized')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[PROFILE API] Querying user_profiles table...')
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    console.log('[PROFILE API] Database query result:', {
      profile: profile ? 'found' : 'null',
      error: error ? error.message : 'none'
    })

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile not found, create default profile
        console.log('[PROFILE API] Profile not found, creating default...')
        
        const defaultProfile = {
          user_id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          bio: '',
          avatar_url: user.user_metadata?.avatar_url || null,
          timezone: 'UTC',
          language: 'en',
          country: null,
          phone_number: null,
          team_mode: 'lite' as const
        }

        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .upsert(defaultProfile, { onConflict: 'user_id' })
          .select()
          .single()

        if (createError) {
          console.error('[PROFILE API] Error creating default profile:', createError)
          return NextResponse.json(
            { error: 'Failed to create profile' },
            { status: 500 }
          )
        }

        console.log('[PROFILE API] ✅ Default profile created:', newProfile)
        return NextResponse.json(newProfile)
      } else {
        console.error('[PROFILE API] Database error:', error)
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        )
      }
    }

    console.log('[PROFILE API] ✅ Profile retrieved successfully')
    return NextResponse.json(profile)
  } catch (error) {
    console.error('[PROFILE API] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('[PROFILE API] ===== PUT PROFILE START =====')
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('[PROFILE API] ❌ Unauthorized PUT request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const profileData = await request.json()
    console.log('[PROFILE API] Profile data to save:', profileData)

    // Prepare the data for upsert
    const upsertData = {
      user_id: user.id,
      email: user.email || profileData.email || '',
      display_name: profileData.display_name,
      bio: profileData.bio,
      avatar_url: profileData.avatar_url,
      timezone: profileData.timezone || 'UTC',
      language: profileData.language || 'en',
      country: profileData.country,
      phone_number: profileData.phone_number,
      team_mode: profileData.team_mode || 'lite'
    }

    console.log('[PROFILE API] Upsert data:', upsertData)

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(upsertData, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('[PROFILE API] ❌ Upsert error:', error)
      return NextResponse.json(
        { error: 'Failed to save profile' },
        { status: 500 }
      )
    }

    console.log('[PROFILE API] ✅ Profile saved successfully:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[PROFILE API] Exception in PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}