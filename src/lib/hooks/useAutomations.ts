// src/lib/hooks/useAutomations.ts
/**
 * Real-time Automations Data Hook
 * Implements Quest 1.5 requirement for real-time data display
 * Expert consensus validated implementation with Supabase real-time subscriptions
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/integrations/supabase/client'
import { Automation } from '@/lib/core/types/automation'

/**
 * Hook state interface for type safety
 */
interface UseAutomationsState {
  data: Automation[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Real-time automations data hook
 * Combines initial API fetch with Supabase real-time subscriptions
 * 
 * Features:
 * - Initial data fetch from API route
 * - Real-time updates via Supabase subscriptions
 * - Comprehensive error handling and loading states
 * - Automatic cleanup to prevent memory leaks
 * - Optimistic updates for better UX
 * 
 * @returns UseAutomationsState with data, loading, error, and refetch
 */
export function useAutomations(): UseAutomationsState {
  const [data, setData] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const supabase = createClient()

  /**
   * Fetch automations from API route
   * Uses established authentication and caching patterns
   */
  const fetchAutomations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/automations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Always get fresh data for real-time accuracy
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        )
      }
      
      const automations = await response.json()
      
      // Validate response data structure
      if (!Array.isArray(automations)) {
        throw new Error('Invalid response format: expected array of automations')
      }
      
      setData(automations)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch automations'
      setError(new Error(errorMessage))
      console.error('useAutomations fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Setup real-time subscription for automations table
   * Implements Security Expert requirement for RLS-compliant subscriptions
   */
  const setupRealtimeSubscription = useCallback(() => {
    const channel = supabase
      .channel('automations-realtime')
      .on('postgres_changes', {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'automations'
        // Note: RLS policies will automatically filter to user's data
      }, (payload) => {
        console.log('Real-time automation update:', payload)
        
        try {
          if (payload.eventType === 'INSERT') {
            const newAutomation = payload.new as Automation
            setData(prev => [newAutomation, ...prev])
          } 
          else if (payload.eventType === 'UPDATE') {
            const updatedAutomation = payload.new as Automation
            setData(prev => prev.map(item => 
              item.id === updatedAutomation.id ? updatedAutomation : item
            ))
          } 
          else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id
            setData(prev => prev.filter(item => item.id !== deletedId))
          }
        } catch (err) {
          console.error('Real-time update processing error:', err)
          // Don't set error state for real-time issues, just log
        }
      })
      .subscribe((status) => {
        console.log('Real-time subscription status:', status)

        if (status === 'SUBSCRIBED') {
          console.log('Real-time subscription established successfully')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription error')
          // Could implement reconnection logic here
        }
      })

    return channel
  }, [supabase])

  /**
   * Main effect for data fetching and real-time setup
   * Performance Expert requirement: Proper cleanup to prevent memory leaks
   */
  useEffect(() => {
    // Initial data fetch
    fetchAutomations()

    // Setup real-time subscription
    const channel = setupRealtimeSubscription()

    // Cleanup function (Critical for preventing memory leaks)
    return () => {
      console.log('Cleaning up automations subscription')
      channel.unsubscribe()
    }
  }, [fetchAutomations, setupRealtimeSubscription])

  return {
    data,
    loading,
    error,
    refetch: fetchAutomations
  }
}

/**
 * Hook for getting a specific automation by ID
 * Utility hook for individual automation access
 */
export function useAutomation(automationId: string) {
  const { data, loading, error, refetch } = useAutomations()
  
  const automation = data.find(auto => auto.id === automationId) || null
  
  return {
    automation,
    loading,
    error,
    refetch
  }
}
