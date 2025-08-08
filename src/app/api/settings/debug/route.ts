// src/app/api/settings/debug/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/integrations/supabase/server'
import { settingsService } from '@/lib/services/settings'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated',
        details: authError?.message
      })
    }

    // Test 1: Check if user_settings_v2 table exists and user has access
    const { data: tableData, error: tableError } = await supabase
      .from('user_settings_v2')
      .select('*')
      .eq('user_id', user.id)

    // Test 2: Try to save a simple test setting
    const testSettings = { test: 'debug_value', timestamp: new Date().toISOString() }
    const saveResult = await settingsService.saveUserSettings('profile', testSettings)

    // Test 3: Try to retrieve the setting we just saved
    const retrieveResult = await settingsService.getUserSettings('profile')

    // Test 4: Check table structure and verify table exists
    const { data: tableInfo, error: infoError } = await supabase
      .from('user_settings_v2')
      .select('*')
      .limit(1)

    // Test 5: Check RLS policies by attempting a direct query
    const { data: rlsTestData, error: rlsError } = await supabase
      .from('user_settings_v2')
      .select('id, category, created_at')
      .eq('user_id', user.id)

    // Test 6: Check if we can perform an upsert operation
    const testUpsertData = {
      user_id: user.id,
      category: 'profile',
      settings: { test: 'debug_upsert', timestamp: new Date().toISOString() }
    }
    
    const { data: upsertTestData, error: upsertTestError } = await supabase
      .from('user_settings_v2')
      .upsert(testUpsertData, { onConflict: 'user_id,category' })
      .select()

    return NextResponse.json({
      success: true,
      userId: user.id,
      userEmail: user.email,
      tests: {
        tableAccess: {
          success: !tableError,
          error: tableError?.message,
          rowCount: tableData?.length || 0,
          data: tableData
        },
        saveTest: {
          success: saveResult,
          input: testSettings
        },
        retrieveTest: {
          success: !!retrieveResult,
          output: retrieveResult
        },
        tableStructure: {
          success: !infoError,
          error: infoError?.message,
          sampleData: tableInfo
        },
        rlsTest: {
          success: !rlsError,
          error: rlsError?.message,
          rowCount: rlsTestData?.length || 0,
          data: rlsTestData
        },
        upsertTest: {
          success: !upsertTestError,
          error: upsertTestError?.message,
          data: upsertTestData
        }
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}