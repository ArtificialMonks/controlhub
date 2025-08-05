// src/app/api/webhooks/n8n/automation/route.ts
import { createClient } from '@/lib/integrations/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

/**
 * n8n Automation Webhook Handler
 * Receives automation triggers and status updates from n8n workflows
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
      automation_id, 
      status, 
      trigger_data, 
      execution_id,
      user_id,
      workflow_name,
      started_at,
      completed_at,
      error_message 
    } = body

    // Validate required fields
    if (!automation_id || !status || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: automation_id, status, user_id' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Create automation run record
    const { data: automationRun, error: insertError } = await supabase
      .from('automation_runs')
      .insert({
        automation_id,
        user_id,
        execution_id,
        status,
        trigger_data,
        workflow_name,
        started_at: started_at || new Date().toISOString(),
        completed_at,
        error_message,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Automation run insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to record automation run' },
        { status: 500 }
      )
    }

    // Update automation last_run timestamp
    const { error: updateError } = await supabase
      .from('automations')
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: status,
      })
      .eq('id', automation_id)

    if (updateError) {
      console.error('Automation update error:', updateError)
    }

    return NextResponse.json({
      success: true,
      automation_run: automationRun,
    })
  } catch (error) {
    console.error('n8n webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
