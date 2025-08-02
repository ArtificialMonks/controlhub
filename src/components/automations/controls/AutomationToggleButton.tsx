'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Square, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

interface AutomationToggleButtonProps {
  automationId: string
  automationName: string
  isRunning: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  onStateChange?: (id: string, newState: boolean) => void
  className?: string
}

export function AutomationToggleButton({
  automationId,
  automationName,
  isRunning,
  disabled = false,
  size = 'md',
  onStateChange,
  className
}: AutomationToggleButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-9 h-9',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    md: {
      container: 'w-11 h-11',
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    lg: {
      container: 'w-14 h-14',
      icon: 'w-5 h-5',
      text: 'text-base'
    }
  }

  const currentSize = sizeConfig[size]

  const handleToggle = async () => {
    if (disabled || isLoading) return

    setIsLoading(true)
    const newState = !isRunning
    const action = newState ? 'run' : 'stop'

    try {
      const endpoint = `/api/automations/${automationId}/${action}`
      console.log(`Making ${action} request to:`, endpoint)
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`API Error (${response.status}):`, errorData)
        throw new Error(errorData.error || `Failed to ${action} automation (${response.status})`)
      }

      // Call the state change handler
      onStateChange?.(automationId, newState)

      // Show success toast
      toast({
        title: `Automation ${newState ? 'started' : 'stopped'}`,
        description: `${automationName} is now ${newState ? 'running' : 'stopped'}.`,
        duration: 3000,
      })
    } catch (error) {
      console.error(`Failed to ${action} automation:`, error)
      toast({
        title: `Failed to ${action} automation`,
        description: 'Please try again or check your connection.',
        variant: 'destructive',
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const Icon = isLoading ? Loader2 : isRunning ? Square : Play

  return (
    <motion.button
      onClick={handleToggle}
      disabled={disabled || isLoading}
      className={cn(
        // Base styles
        'relative rounded-full border-0 transition-all duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        
        // Metallic gradient background
        'bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300',
        'dark:from-slate-600 dark:via-slate-500 dark:to-slate-700',
        
        // Shine effect overlay
        'before:absolute before:inset-0 before:rounded-full',
        'before:bg-gradient-to-br before:from-white/40 before:via-transparent before:to-transparent',
        'before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200',
        
        // Shadow and depth
        'shadow-md hover:shadow-lg',
        'border border-slate-300/50 dark:border-slate-500/50',
        
        // Size
        currentSize.container,
        
        // Custom className
        className
      )}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.05 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.95 }}
      aria-label={
        isLoading 
          ? `${isRunning ? 'Stopping' : 'Starting'} ${automationName}...`
          : `${isRunning ? 'Stop' : 'Start'} ${automationName}`
      }
      role="button"
    >
      {/* Metallic border ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-400/20 to-slate-600/20 dark:from-slate-300/20 dark:to-slate-500/20" />
      
      {/* Icon container */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <Icon
          className={cn(
            currentSize.icon,
            'transition-all duration-200',
            // Color based on state
            isRunning 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-green-600 dark:text-green-400',
            // Loading animation
            isLoading && 'animate-spin'
          )}
        />
      </div>

      {/* Pulse effect for running state */}
      {isRunning && !isLoading && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-red-400/50"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 0, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Success pulse effect */}
      <motion.div
        key={`${automationId}-${isRunning}`}
        className={cn(
          'absolute inset-0 rounded-full border-2',
          isRunning 
            ? 'border-green-400/60' 
            : 'border-red-400/60'
        )}
        initial={{ scale: 1, opacity: 0 }}
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0, 0.8, 0],
        }}
        transition={{
          duration: 0.6,
          ease: 'easeOut',
        }}
      />
    </motion.button>
  )
}

// Bulk variant for master controls
export function BulkAutomationToggleButton({
  action,
  count,
  disabled = false,
  isLoading = false,
  onAction,
  className
}: {
  action: 'run' | 'stop'
  count: number
  disabled?: boolean
  isLoading?: boolean
  onAction: (action: 'run' | 'stop') => void
  className?: string
}) {
  const Icon = isLoading ? Loader2 : action === 'run' ? Play : Square

  const handleClick = () => {
    if (disabled || isLoading) return
    onAction(action)
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        // Base styles
        'relative flex items-center gap-2 px-4 py-2 rounded-lg border-0',
        'transition-all duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        
        // Metallic gradient background
        'bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300',
        'dark:from-slate-600 dark:via-slate-500 dark:to-slate-700',
        
        // Shine effect overlay
        'before:absolute before:inset-0 before:rounded-lg',
        'before:bg-gradient-to-br before:from-white/40 before:via-transparent before:to-transparent',
        'before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200',
        
        // Shadow and depth
        'shadow-md hover:shadow-lg',
        'border border-slate-300/50 dark:border-slate-500/50',
        
        className
      )}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      aria-label={`${action === 'run' ? 'Start' : 'Stop'} ${count} selected automations`}
    >
      {/* Icon */}
      <Icon
        className={cn(
          'w-4 h-4 transition-colors duration-200',
          action === 'run' 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400',
          isLoading && 'animate-spin'
        )}
      />
      
      {/* Text */}
      <span className="relative z-10 font-medium text-sm text-slate-700 dark:text-slate-200">
        {action === 'run' ? 'Run' : 'Stop'} {count} Selected
      </span>
    </motion.button>
  )
}