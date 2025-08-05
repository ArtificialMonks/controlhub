// src/components/notifications/NotificationToast.tsx
'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, CheckCircle, XCircle, Info, Zap, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Notification } from '@/lib/data/repositories/notification-repository'

interface NotificationToastProps {
  notification: Notification | null
  onClose: () => void
  onAction?: () => void
  actionLabel?: string
}

export function NotificationToast({
  notification,
  onClose,
  onAction,
  actionLabel = 'View'
}: NotificationToastProps) {
  if (!notification) return null

  const getIcon = () => {
    switch (notification.type) {
      case 'automation_failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'automation_success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'automation_started':
        return <Zap className="h-5 w-5 text-blue-500" />
      case 'system_alert':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'maintenance':
        return <Wrench className="h-5 w-5 text-orange-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const getBgColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'bg-red-500/10 border-red-500/30'
      case 'high':
        return 'bg-orange-500/10 border-orange-500/30'
      default:
        return 'bg-white/10 dark:bg-black/20 border-white/20'
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={`
          fixed bottom-4 right-4 left-4 sm:left-auto z-50 
          w-auto sm:w-96 max-w-[calc(100vw-2rem)] p-4 rounded-lg 
          backdrop-blur-xl shadow-2xl
          border ${getBgColor()}
        `}
      >
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold mb-1">
              {notification.title}
            </h4>
            <p className="text-sm text-muted-foreground">
              {notification.message}
            </p>
            
            {onAction && (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={onAction}
                  className="h-7"
                >
                  {actionLabel}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="h-7"
                >
                  Dismiss
                </Button>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8 -mr-2 -mt-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}