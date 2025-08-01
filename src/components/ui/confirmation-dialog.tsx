// src/components/ui/confirmation-dialog.tsx
/**
 * Confirmation Dialog Component
 * Quest 2.4: Wire Up Individual Action Buttons
 * 
 * UX Expert Validated Implementation:
 * - Mission control interface patterns
 * - Clear action consequences
 * - Accessible keyboard navigation
 * - shadcn/ui Dialog integration
 */

"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Play, Square, Loader2 } from "lucide-react"

/**
 * Confirmation dialog props interface
 */
export interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
  disabled?: boolean
  showWarningIcon?: boolean
  consequence?: string
  automationName?: string
  action?: 'run' | 'stop'
}

/**
 * Confirmation Dialog Component
 * 
 * Provides consistent confirmation dialogs for automation actions
 * with clear visual hierarchy and accessibility features
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'default',
  onConfirm,
  onCancel,
  loading = false,
  disabled = false,
  showWarningIcon = false,
  consequence,
  automationName,
  action
}: ConfirmationDialogProps) {
  
  /**
   * Handle confirm action with loading state
   */
  const handleConfirm = async () => {
    try {
      await onConfirm()
    } catch (error) {
      console.error('Confirmation action failed:', error)
      // Error handling is managed by the parent component
    }
  }

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }

  /**
   * Get action icon based on action type
   */
  const getActionIcon = () => {
    if (loading) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    
    switch (action) {
      case 'run':
        return <Play className="h-4 w-4" />
      case 'stop':
        return <Square className="h-4 w-4" />
      default:
        return null
    }
  }

  /**
   * Get dialog variant styling based on action
   */
  const getDialogStyling = () => {
    if (action === 'stop' || confirmVariant === 'destructive') {
      return {
        headerClass: "text-destructive",
        iconColor: "text-destructive"
      }
    }
    return {
      headerClass: "",
      iconColor: "text-primary"
    }
  }

  const styling = getDialogStyling()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${styling.headerClass}`}>
            {showWarningIcon && (
              <AlertTriangle className={`h-5 w-5 ${styling.iconColor}`} aria-hidden="true" />
            )}
            {getActionIcon()}
            {title}
          </DialogTitle>
          <DialogDescription className="text-left space-y-2">
            <div>{description}</div>
            
            {automationName && (
              <div className="font-medium text-foreground">
                Automation: &ldquo;{automationName}&rdquo;
              </div>
            )}
            
            {consequence && (
              <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
                <strong>Note:</strong> {consequence}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="mt-2 sm:mt-0"
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={disabled || loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              getActionIcon()
            )}
            {loading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Automation Action Confirmation Dialog
 * Specialized confirmation dialog for automation actions
 */
export interface AutomationActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: 'run' | 'stop'
  automationName: string
  onConfirm: () => void | Promise<void>
  loading?: boolean
}

export function AutomationActionDialog({
  open,
  onOpenChange,
  action,
  automationName,
  onConfirm,
  loading = false
}: AutomationActionDialogProps) {
  const isStop = action === 'stop'
  
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Confirm ${action === 'run' ? 'Run' : 'Stop'}`}
      description={`Are you sure you want to ${action} this automation?`}
      confirmText={action === 'run' ? 'Run' : 'Stop'}
      confirmVariant={isStop ? 'destructive' : 'default'}
      onConfirm={onConfirm}
      loading={loading}
      showWarningIcon={isStop}
      consequence="This action will take effect immediately."
      automationName={automationName}
      action={action}
    />
  )
}

/**
 * Bulk Action Confirmation Dialog
 * Specialized confirmation dialog for bulk automation actions
 */
export interface BulkActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: 'run' | 'stop'
  automationCount: number
  onConfirm: () => void | Promise<void>
  loading?: boolean
}

export function BulkActionDialog({
  open,
  onOpenChange,
  action,
  automationCount,
  onConfirm,
  loading = false
}: BulkActionDialogProps) {
  const isStop = action === 'stop'
  
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Confirm Bulk ${action === 'run' ? 'Run' : 'Stop'}`}
      description={`Are you sure you want to ${action} ${automationCount} automation${automationCount !== 1 ? 's' : ''}?`}
      confirmText={`${action === 'run' ? 'Run' : 'Stop'} ${automationCount} Automation${automationCount !== 1 ? 's' : ''}`}
      confirmVariant={isStop ? 'destructive' : 'default'}
      onConfirm={onConfirm}
      loading={loading}
      showWarningIcon={isStop}
      consequence={`This will ${action} multiple automations simultaneously. The process may take several minutes to complete.`}
      action={action}
    />
  )
}
