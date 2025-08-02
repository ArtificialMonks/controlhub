// src/app/api/automations/route.ts
/**
 * API Route for Automations Data
 * Implements Quest 1.5 requirement for real-time data display
 * Expert consensus validated implementation with authentication and caching
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/dal'
import { AutomationRepository } from '@/lib/repositories/automation-repository'

/**
 * GET /api/automations
 * Retrieves all automations for the authenticated user
 * 
 * @param request - Next.js request object
 * @returns JSON response with automations array or error
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication validation using established DAL pattern
    const session = await verifySession()
    if (!session?.id) {
      return NextResponse.json(
        { 
          error: 'Unauthorized', 
          message: 'Valid session required to access automations' 
        }, 
        { status: 401 }
      )
    }

    // 2. Initialize repository (Supabase client handled internally)
    const automationRepository = new AutomationRepository()

    // 3. Data access via repository layer (Expert consensus pattern)
    const automations = await automationRepository.getAllAutomations(session.id)

    // 4. Response with proper caching headers (Performance Expert recommendation)
    return NextResponse.json(automations, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60, must-revalidate',
        'Content-Type': 'application/json',
        'X-Total-Count': automations.length.toString()
      }
    })

  } catch (error) {
    // Comprehensive error handling (Quality Expert requirement)
    console.error('API Error - /api/automations:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    // Security Expert requirement: Don't expose internal error details
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Failed to fetch automations. Please try again later.' 
      }, 
      { status: 500 }
    )
  }
}

// POST method removed - automations are managed externally
// This system only provides read and control operations for existing automations

/**
 * OPTIONS /api/automations
 * CORS preflight handler
 */
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}
