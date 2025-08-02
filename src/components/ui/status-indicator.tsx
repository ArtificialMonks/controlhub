'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StatusIndicatorProps {
  isConnected: boolean
  className?: string
}

export function StatusIndicator({ isConnected, className }: StatusIndicatorProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 px-3 text-xs font-medium",
        className
      )}
      disabled
    >
      <motion.div
        className={cn(
          "w-2 h-2 rounded-full mr-2",
          isConnected ? "bg-green-500" : "bg-red-500"
        )}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <span className={isConnected ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
        {isConnected ? "Connected" : "Disconnected"}
      </span>
    </Button>
  )
}