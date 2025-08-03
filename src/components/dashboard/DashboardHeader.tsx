// src/components/dashboard/DashboardHeader.tsx
'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

interface DashboardHeaderProps {
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function DashboardHeader({ onRefresh, isRefreshing = false }: DashboardHeaderProps) {

  return (
    <div className="relative">
      {/* Enhanced separator line aligned with sidebar */}
      <div className="absolute -top-6 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 pt-6 pointer-events-auto"
      >
        {/* Left side - Title */}
        <div className="space-y-3 pointer-events-none">
          <motion.h1
            className="control-hub-title text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -30 }}
            animate={{
              opacity: 1,
              x: 0,
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              opacity: { delay: 0.2, duration: 0.6 },
              x: { delay: 0.2, duration: 0.6 },
              backgroundPosition: {
                duration: 5,
                ease: "easeInOut",
                repeat: Infinity,
              }
            }}
            whileHover={{
              scale: 1.02,
              textShadow: "0 0 25px rgba(0, 60, 255, 0.4)"
            }}
            style={{
              backgroundSize: "200% 100%",
            }}
          >
            AUTOMATION DASHBOARD
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-lg leading-relaxed"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Real-time insights and performance analytics for your automation ecosystem
          </motion.p>
        </div>

        {/* Right side - Actions */}
        <motion.div
          className="flex items-center gap-4 pointer-events-auto"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Enhanced refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="hover:bg-primary/10 hover:border-primary/30 hover:shadow-md transition-all duration-300 pointer-events-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 transition-transform duration-300 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            Refresh
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
