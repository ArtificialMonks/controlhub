"use client"

import * as React from "react"
import { cn } from "@/lib/core/utils"

interface TooltipProviderProps {
  children: React.ReactNode
}

const TooltipProvider = ({ children }: TooltipProviderProps) => {
  return <>{children}</>
}

interface TooltipProps {
  children: React.ReactNode
}

const Tooltip = ({ children }: TooltipProps) => {
  return <>{children}</>
}

interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  TooltipTriggerProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, asChild, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, props as Record<string, unknown>)
  }
  
  return (
    <button ref={ref} {...props}>
      {children}
    </button>
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

interface TooltipContentProps {
  children: React.ReactNode
  className?: string
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
}

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  TooltipContentProps & React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }