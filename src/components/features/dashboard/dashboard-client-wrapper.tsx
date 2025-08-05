// src/components/features/dashboard/dashboard-client-wrapper.tsx
/**
 * Client-side wrapper for dashboard with state management
 * Handles optimistic updates for automation status changes
 */

"use client"

import React from 'react'
import { User } from '@supabase/supabase-js'
import { DashboardFilterContainer } from './DashboardFilterContainer'
import { useAutomationState } from '@/hooks/useAutomationState'
import { Automation } from '@/lib/data/repositories/automation-repository'

interface DashboardClientWrapperProps {
  user: User
  profile: Record<string, unknown> | null
  initialAutomations: Automation[]
  initialClients: Array<{ id: string; name: string }>
  initialError?: string | null
}

export function DashboardClientWrapper({ 
  user, 
  profile, 
  initialAutomations, 
  initialClients, 
  initialError 
}: DashboardClientWrapperProps) {
  const { automations, updateAutomationStatus, setAutomations } = useAutomationState(initialAutomations)

  // Update automations when initial data changes
  React.useEffect(() => {
    setAutomations(initialAutomations)
  }, [initialAutomations, setAutomations])

  const handleStatusUpdate = (automationId: string, status: 'Running' | 'Stopped' | 'Error' | 'Stalled') => {
    updateAutomationStatus(automationId, status)
  }

  return (
    <DashboardFilterContainer
      user={user}
      profile={profile}
      initialData={{
        automations,
        clients: initialClients,
        error: initialError
      }}
      onStatusUpdate={handleStatusUpdate}
    />
  )
}