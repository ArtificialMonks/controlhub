// src/app/api/appearance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/integrations/supabase/server'

export async function GET() {
  try {
    console.log('[APPEARANCE API] ===== GET APPEARANCE START =====')
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('[APPEARANCE API] Auth result:', {
      user: user ? `${user.id} (${user.email})` : 'null',
      authError: authError ? authError.message : 'none'
    })

    if (authError || !user) {
      console.log('[APPEARANCE API] ❌ Unauthorized')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[APPEARANCE API] Querying user_appearance_settings table...')
    const { data: appearanceSettings, error } = await supabase
      .from('user_appearance_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    console.log('[APPEARANCE API] Database query result:', {
      appearanceSettings: appearanceSettings ? 'found' : 'null',
      error: error ? error.message : 'none'
    })

    if (error) {
      if (error.code === 'PGRST116') {
        // Appearance settings not found, create default settings
        console.log('[APPEARANCE API] Appearance settings not found, creating default...')
        
        const defaultSettings = {
          user_id: user.id,
          theme: 'light',
          high_contrast: false,
          reduced_motion: false,
          font_size: 'medium',
          font_family: 'default'
        }

        const { data: newSettings, error: createError } = await supabase
          .from('user_appearance_settings')
          .upsert(defaultSettings, { onConflict: 'user_id' })
          .select()
          .single()

        if (createError) {
          console.error('[APPEARANCE API] Error creating default settings:', createError)
          return NextResponse.json(
            { error: 'Failed to create appearance settings' },
            { status: 500 }
          )
        }

        console.log('[APPEARANCE API] ✅ Default appearance settings created:', newSettings)
        return NextResponse.json(newSettings)
      } else {
        console.error('[APPEARANCE API] Database error:', error)
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        )
      }
    }

    console.log('[APPEARANCE API] ✅ Appearance settings retrieved successfully')
    return NextResponse.json(appearanceSettings)
  } catch (error) {
    console.error('[APPEARANCE API] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('[APPEARANCE API] ===== PUT APPEARANCE START =====')
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('[APPEARANCE API] ❌ Unauthorized PUT request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const appearanceData = await request.json()
    console.log('[APPEARANCE API] Appearance data to save:', appearanceData)

    // Prepare the data for upsert
    const upsertData = {
      user_id: user.id,
      theme: appearanceData.theme || 'light',
      high_contrast: appearanceData.high_contrast || false,
      reduced_motion: appearanceData.reduced_motion || false,
      font_size: appearanceData.font_size || 'medium',
      font_family: appearanceData.font_family || 'default'
    }

    console.log('[APPEARANCE API] Upsert data:', upsertData)

    const { data, error } = await supabase
      .from('user_appearance_settings')
      .upsert(upsertData, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('[APPEARANCE API] ❌ Upsert error:', error)
      return NextResponse.json(
        { error: 'Failed to save appearance settings' },
        { status: 500 }
      )
    }

    console.log('[APPEARANCE API] ✅ Appearance settings saved successfully:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[APPEARANCE API] Exception in PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}