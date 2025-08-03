// src/components/notifications/NotificationCenter.tsx
'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Info,
  XCircle,
  Zap,
  Wrench,
  RefreshCw,
  Settings,
  Trash2,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import type { Notification } from '@/lib/repositories/notification-repository'

interface NotificationCenterProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (notificationIds?: string[]) => Promise<void>
  onClearAll: () => Promise<void>
  onDelete: (notificationIds: string[]) => Promise<void>
  onRefresh: () => Promise<void>
}

export function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onClearAll,
  onDelete,
  onRefresh
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.read) return false
    if (typeFilter.length > 0 && !typeFilter.includes(notification.type)) return false
    return true
  })

  // Get icon for notification type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
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
      case 'update':
        return <RefreshCw className="h-5 w-5 text-purple-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  // Get priority color
  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'high':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      case 'normal':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'low':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
      default:
        return ''
    }
  }

  // Format time ago
  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diff = now.getTime() - then.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await onMarkAsRead()
      toast({
        title: "All notifications marked as read",
        description: "Your notification inbox is now clear."
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read.",
        variant: "destructive"
      })
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <TooltipProvider>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-primary/10"
            aria-label={`Notifications (${unreadCount} unread)`}
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          align="end" 
          className="w-[90vw] sm:w-96 max-w-[400px] p-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-white/20"
          sideOffset={5}
        >
          {/* Header */}
          <div className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-border/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      aria-label="Refresh notifications"
                    >
                      <RefreshCw className={cn(
                        "h-4 w-4",
                        isRefreshing && "animate-spin"
                      )} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleMarkAllAsRead}
                      disabled={unreadCount === 0}
                      aria-label="Mark all notifications as read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Mark all as read</TooltipContent>
                </Tooltip>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Filter notifications"
                      aria-expanded={false}
                      aria-haspopup="true"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFilter('all')}>
                      All notifications
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('unread')}>
                      Unread only
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Type</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                      checked={typeFilter.includes('automation_failed')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTypeFilter([...typeFilter, 'automation_failed'])
                        } else {
                          setTypeFilter(typeFilter.filter(t => t !== 'automation_failed'))
                        }
                      }}
                    >
                      Failed automations
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={typeFilter.includes('system_alert')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTypeFilter([...typeFilter, 'system_alert'])
                        } else {
                          setTypeFilter(typeFilter.filter(t => t !== 'system_alert'))
                        }
                      }}
                    >
                      System alerts
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                {unreadCount} unread
              </span>
              <span className="text-muted-foreground">
                {filteredNotifications.length} total
              </span>
            </div>
          </div>

          {/* Notifications list */}
          <ScrollArea className="h-[50vh] sm:h-[400px] max-h-[500px]">
            <AnimatePresence>
              {filteredNotifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 text-center"
                >
                  <Bell className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No notifications to display
                  </p>
                </motion.div>
              ) : (
                <div className="divide-y divide-border/30">
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "p-4 hover:bg-white/5 dark:hover:bg-black/20 transition-colors cursor-pointer group",
                        !notification.read && "bg-primary/5"
                      )}
                      onClick={() => onMarkAsRead([notification.id])}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className={cn(
                                "text-sm font-medium",
                                !notification.read && "font-semibold"
                              )}>
                                {notification.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatTimeAgo(notification.created_at)}
                                </span>
                                {notification.priority !== 'normal' && (
                                  <Badge 
                                    variant="secondary"
                                    className={cn(
                                      "text-xs",
                                      getPriorityColor(notification.priority)
                                    )}
                                  >
                                    <span className="hidden sm:inline">{notification.priority}</span>
                                    <span className="sm:hidden">!</span>
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDelete([notification.id])
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-border/30 p-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false)
                  window.location.href = '/settings'
                }}
                className="text-xs sm:text-sm"
              >
                <Settings className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Notification Settings</span>
                <span className="sm:hidden">Settings</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                disabled={notifications.length === 0}
                className="text-destructive hover:text-destructive text-xs sm:text-sm"
              >
                <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Clear All</span>
                <span className="sm:hidden">Clear</span>
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}