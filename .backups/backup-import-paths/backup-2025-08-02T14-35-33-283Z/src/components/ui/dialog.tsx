// src/components/ui/dialog.tsx
/**
 * Dialog Component
 * Based on shadcn/ui Dialog component
 * Provides modal dialog functionality with accessibility features
 */

"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Dialog Context
 */
interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

/**
 * Dialog Root Component
 */
interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  const contextValue = React.useMemo(
    () => ({ open, onOpenChange: onOpenChange || (() => {}) }),
    [open, onOpenChange]
  )

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
    </DialogContext.Provider>
  )
}

/**
 * Dialog Trigger Component
 */
interface DialogTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

export function DialogTrigger({ asChild, children }: DialogTriggerProps) {
  const context = React.useContext(DialogContext)
  
  if (!context) {
    throw new Error("DialogTrigger must be used within a Dialog")
  }

  const handleClick = () => {
    context.onOpenChange(true)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onClick: handleClick
    })
  }

  return (
    <button onClick={handleClick}>
      {children}
    </button>
  )
}

/**
 * Dialog Content Component
 */
interface DialogContentProps {
  className?: string
  children: React.ReactNode
}

export function DialogContent({ className, children }: DialogContentProps) {
  const context = React.useContext(DialogContext)
  
  if (!context) {
    throw new Error("DialogContent must be used within a Dialog")
  }

  if (!context.open) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        onClick={() => context.onOpenChange(false)}
      />
      
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            "relative bg-background border rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
          
          {/* Close button */}
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-muted-foreground hover:text-foreground"
            onClick={() => context.onOpenChange(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>
    </>
  )
}

/**
 * Dialog Header Component
 */
interface DialogHeaderProps {
  className?: string
  children: React.ReactNode
}

export function DialogHeader({ className, children }: DialogHeaderProps) {
  return (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left p-6 pb-0", className)}>
      {children}
    </div>
  )
}

/**
 * Dialog Footer Component
 */
interface DialogFooterProps {
  className?: string
  children: React.ReactNode
}

export function DialogFooter({ className, children }: DialogFooterProps) {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0", className)}>
      {children}
    </div>
  )
}

/**
 * Dialog Title Component
 */
interface DialogTitleProps {
  className?: string
  children: React.ReactNode
}

export function DialogTitle({ className, children }: DialogTitleProps) {
  return (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight text-foreground", className)}>
      {children}
    </h2>
  )
}

/**
 * Dialog Description Component
 */
interface DialogDescriptionProps {
  className?: string
  children: React.ReactNode
}

export function DialogDescription({ className, children }: DialogDescriptionProps) {
  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </div>
  )
}
