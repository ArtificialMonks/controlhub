// src/components/features/automation-action-buttons.tsx
/**
 * Automation Action Buttons Component
 * Quest 2.4: Wire Up Individual Action Buttons
 * 
 * Expert Council Validated Implementation:
 * - Mission control interface with confirmation dialogs
 * - Loading states and optimistic UI updates
 * - Comprehensive error handling with user feedback
 * - Integration with automation service
 */

"use client"

import React, { useState } from 'react'
import { Play, Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { AutomationActionDialog } from '@/components/ui/confirmation-dialog'
import { automationService, AutomationServiceError } from '@/lib/services/automation-service'
import type { Automation } from '@/lib/types/automation'

/**
 * Automation action buttons props interface
 */
export interface AutomationActionButtonsProps {
  automation: Automation
  onActionComplete?: (automationId: string, action: 'run' | 'stop', result: unknown) => void
  onStatusUpdate?: (automationId: string, status: 'Running' | 'Stopped' | 'Error' | 'Stalled') => void
  disabled?: boolean
  size?: 'sm' | 'default' | 'lg'
}

/**
 * Automation Action Buttons Component
 * 
 * Provides run/stop action buttons for individual automations
 * with confirmation dialogs and comprehensive error handling
 */
export function AutomationActionButtons({
  automation,
  onActionComplete,
  onStatusUpdate,
  disabled = false,
  size = 'sm'
}: AutomationActionButtonsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'run' | 'stop' | null>(null)
  const { toast } = useToast()

  /**
   * Handle automation action execution
   */
  const handleAction = async (action: 'run' | 'stop') => {
    setIsLoading(true)
    
    // Optimistic update - immediately update the status
    const optimisticStatus = action === 'run' ? 'Running' : 'Stopped'
    if (onStatusUpdate) {
      onStatusUpdate(automation.id, optimisticStatus)
    }
    
    try {
      let result
      if (action === 'run') {
        result = await automationService.runAutomation(automation.id)
      } else {
        result = await automationService.stopAutomation(automation.id)
      }

      // Show success toast
      toast({
        title: `Automation ${action} successful`,
        description: result.result?.message || `${automation.name} has been ${action === 'run' ? 'started' : 'stopped'}.`,
        variant: 'default'
      })

      // Notify parent component
      if (onActionComplete) {
        onActionComplete(automation.id, action, result)
      }

    } catch (error) {
      console.error(`Automation ${action} failed:`, error)
      
      // Revert optimistic update on error
      if (onStatusUpdate) {
        onStatusUpdate(automation.id, automation.status)
      }
      
      // Handle specific error types
      let errorMessage = `Failed to ${action} automation`
      let errorDescription = 'An unexpected error occurred. Please try again.'

      if (error instanceof AutomationServiceError) {
        errorMessage = error.message
        
        switch (error.status) {
          case 401:
            errorDescription = 'Please log in again to continue.'
            break
          case 403:
            errorDescription = 'You do not have permission to perform this action.'
            break
          case 404:
            errorDescription = 'The automation could not be found.'
            break
          case 409:
            errorDescription = error.details || 'The automation is in a conflicting state.'
            break
          case 408:
            errorDescription = 'The request timed out. Please try again.'
            break
          case 503:
            errorDescription = 'The service is temporarily unavailable. Please try again later.'
            break
          default:
            errorDescription = error.details || 'Please check your connection and try again.'
        }
      }

      // Show error toast
      toast({
        title: errorMessage,
        description: errorDescription,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setConfirmAction(null)
    }
  }

  /**
   * Get button state based on automation status
   */
  const getButtonState = (action: 'run' | 'stop') => {
    const isRunning = automation.status === 'Running'
    const isStopped = automation.status === 'Stopped'
    const isError = automation.status === 'Error'
    const isStalled = automation.status === 'Stalled'

    if (action === 'run') {
      return {
        disabled: disabled || isLoading || isRunning,
        variant: isRunning ? 'secondary' as const : 'default' as const,
        tooltip: isRunning
          ? 'Automation is currently running'
          : isError
          ? 'Restart automation (currently in error state)'
          : isStalled
          ? 'Resume automation (currently stalled)'
          : 'Start automation',
        label: isRunning ? 'Running...' : 'Run'
      }
    } else {
      return {
        disabled: disabled || isLoading || isStopped,
        variant: isStopped ? 'outline' as const : 'destructive' as const,
        tooltip: isStopped
          ? 'Automation is already stopped'
          : 'Stop automation',
        label: isStopped ? 'Stopped' : 'Stop'
      }
    }
  }

  const runButtonState = getButtonState('run')
  const stopButtonState = getButtonState('stop')

  return (
    <>
      <div className="flex gap-2">
        {/* Run Button */}
        <Button
          variant={runButtonState.variant}
          size={size}
          onClick={() => setConfirmAction('run')}
          disabled={runButtonState.disabled}
          title={runButtonState.tooltip}
          className="flex items-center gap-1"
        >
          {isLoading && confirmAction === 'run' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Play className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="sr-only sm:not-sr-only">{runButtonState.label}</span>
        </Button>
        
        {/* Stop Button */}
        <Button
          variant={stopButtonState.variant}
          size={size}
          onClick={() => setConfirmAction('stop')}
          disabled={stopButtonState.disabled}
          title={stopButtonState.tooltip}
          className="flex items-center gap-1"
        >
          {isLoading && confirmAction === 'stop' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Square className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="sr-only sm:not-sr-only">{stopButtonState.label}</span>
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AutomationActionDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        action={confirmAction || 'run'}
        automationName={automation.name}
        onConfirm={() => {
          if (confirmAction) {
            return handleAction(confirmAction)
          }
        }}
        loading={isLoading}
      />
    </>
  )
}

/**
 * Compact Automation Action Buttons
 * Minimal version for use in dropdown menus or tight spaces
 */
export interface CompactAutomationActionButtonsProps {
  automation: Automation
  onActionComplete?: (automationId: string, action: 'run' | 'stop', result: unknown) => void
  onActionClick?: (action: 'run' | 'stop') => void
}

export function CompactAutomationActionButtons({
  automation,
  onActionComplete,
  onActionClick
}: CompactAutomationActionButtonsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  /**
   * Handle compact action execution
   */
  const handleCompactAction = async (action: 'run' | 'stop') => {
    if (onActionClick) {
      onActionClick(action)
      return
    }

    setIsLoading(true)
    
    try {
      let result
      if (action === 'run') {
        result = await automationService.runAutomation(automation.id)
      } else {
        result = await automationService.stopAutomation(automation.id)
      }

      toast({
        title: `Automation ${action} successful`,
        description: `${automation.name} has been ${action === 'run' ? 'started' : 'stopped'}.`,
        variant: 'default'
      })

      if (onActionComplete) {
        onActionComplete(automation.id, action, result)
      }

    } catch (error) {
      console.error(`Compact automation ${action} failed:`, error)
      
      toast({
        title: `Failed to ${action} automation`,
        description: error instanceof AutomationServiceError 
          ? error.message 
          : 'An unexpected error occurred.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isRunning = automation.status === 'Running'
  const isStopped = automation.status === 'Stopped'

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleCompactAction('run')}
        disabled={isLoading || isRunning}
        className="h-8 w-8 p-0"
        title="Run automation"
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Play className="h-3 w-3" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleCompactAction('stop')}
        disabled={isLoading || isStopped}
        className="h-8 w-8 p-0"
        title="Stop automation"
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Square className="h-3 w-3" />
        )}
      </Button>
    </div>
  )
}
