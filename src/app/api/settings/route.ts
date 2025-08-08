// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/integrations/supabase/server'
import { settingsService } from '@/lib/services/settings'
import { settingsMigrationService } from '@/lib/services/settings-migration'
import type { SettingsCategory } from '@/lib/services/settings'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const category = url.searchParams.get('category') as SettingsCategory | null
    const action = url.searchParams.get('action')

    // Handle special actions
    if (action === 'health') {
      const health = await settingsMigrationService.getSettingsHealth()
      return NextResponse.json({ health })
    }

    if (action === 'migrate') {
      const migrated = await settingsMigrationService.migrateLegacySettings()
      return NextResponse.json({ migrated })
    }

    if (action === 'initialize') {
      const initialized = await settingsMigrationService.initializeDefaultSettings()
      return NextResponse.json({ initialized })
    }

    // Get specific category or all settings
    if (category) {
      const settings = await settingsService.getUserSettings(category)
      return NextResponse.json({ category, settings })
    } else {
      const allSettings = await settingsService.getAllSettings()
      return NextResponse.json(allSettings)
    }
  } catch (error) {
    console.error('Settings GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API SETTINGS DEBUG] ===== POST REQUEST START =====')
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('[API SETTINGS DEBUG] Auth check:', { 
      user: user ? `${user.id} (${user.email})` : 'null',
      authError: authError || 'none'
    })

    if (authError || !user) {
      console.log('[API SETTINGS DEBUG] ❌ Unauthorized request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { category, settings } = body
    
    console.log('[API SETTINGS DEBUG] Request body:', { category, settings })
    console.log('[API SETTINGS DEBUG] Bio in settings:', settings?.bio)

    if (!category || !settings) {
      console.log('[API SETTINGS DEBUG] ❌ Missing category or settings')
      return NextResponse.json(
        { error: 'Category and settings are required' },
        { status: 400 }
      )
    }

    console.log('[API SETTINGS DEBUG] Calling settingsService.saveUserSettings...')
    const saved = await settingsService.saveUserSettings(category, settings)
    console.log('[API SETTINGS DEBUG] Save result:', saved)
    
    if (!saved) {
      console.log('[API SETTINGS DEBUG] ❌ Save operation returned false')
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      )
    }

    console.log('[API SETTINGS DEBUG] ✅ Save successful, returning success response')
    return NextResponse.json({ 
      success: true, 
      category,
      message: 'Settings saved successfully' 
    })
  } catch (error) {
    console.error('[API SETTINGS DEBUG] ❌ Exception in POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { categories } = body

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'Categories array is required' },
        { status: 400 }
      )
    }

    const results = []
    for (const categoryData of categories) {
      const { category, settings } = categoryData
      if (category && settings) {
        const saved = await settingsService.saveUserSettings(category, settings)
        results.push({ category, saved })
      }
    }

    const allSaved = results.every(r => r.saved)
    
    return NextResponse.json({ 
      success: allSaved,
      results,
      message: allSaved ? 'All settings saved successfully' : 'Some settings failed to save'
    })
  } catch (error) {
    console.error('Settings PUT API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const category = url.searchParams.get('category') as SettingsCategory | null

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('user_settings_v2')
      .delete()
      .eq('user_id', user.id)
      .eq('category', category)

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      success: true,
      category,
      message: 'Settings deleted successfully' 
    })
  } catch (error) {
    console.error('Settings DELETE API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}