// src/hooks/useAutomationState.ts
/**
 * Custom hook for managing automation state updates
 * Provides optimistic updates and state synchronization
 */

"use client"

import { useState, useCallback } from 'react'
import type { Automation, AutomationStatus } from '@/lib/types/automation'

export interface UseAutomationStateReturn {
  automations: Automation[]
  updateAutomationStatus: (id: string, status: AutomationStatus) => void
  setAutomations: (automations: Automation[]) => void
}

export function useAutomationState(initialAutomations: Automation[] = []): UseAutomationStateReturn {
  const [automations, setAutomationsState] = useState<Automation[]>(initialAutomations)

  const updateAutomationStatus = useCallback((id: string, status: AutomationStatus) => {
    setAutomationsState(prev => 
      prev.map(automation => 
        automation.id === id 
          ? { ...automation, status }
          : automation
      )
    )
  }, [])

  const setAutomations = useCallback((newAutomations: Automation[]) => {
    setAutomationsState(newAutomations)
  }, [])

  return {
    automations,
    updateAutomationStatus,
    setAutomations
  }
}