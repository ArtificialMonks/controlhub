// src/app/api/webhooks/n8n/telemetry/route.ts
import { createClient } from '@/lib/integrations/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

/**
 * n8n Telemetry Webhook Handler
 * Receives telemetry data and metrics from n8n workflows
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const headersList = await headers()
    const webhookSecret = headersList.get('x-webhook-secret')
    
    if (webhookSecret !== process.env.N8N_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized webhook' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      user_id,
      automation_id,
      execution_id,
      metrics,
      performance_data,
      timestamp 
    } = body

    // Validate required fields
    if (!user_id || !metrics) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, metrics' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Store telemetry data
    const { data: telemetryRecord, error: insertError } = await supabase
      .from('automation_telemetry')
      .insert({
        user_id,
        automation_id,
        execution_id,
        metrics,
        performance_data,
        timestamp: timestamp || new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Telemetry insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to store telemetry data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      telemetry_id: telemetryRecord.id,
    })
  } catch (error) {
    console.error('n8n telemetry webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
