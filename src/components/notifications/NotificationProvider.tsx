// src/components/notifications/NotificationProvider.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NotificationToast } from './NotificationToast'
import { useToast } from '@/components/ui/use-toast'
import type { Notification } from '@/lib/repositories/notification-repository'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (notificationIds?: string[]) => Promise<void>
  clearAll: () => Promise<void>
  deleteNotifications: (notificationIds: string[]) => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
  initialNotifications?: Notification[]
  userId?: string
}

export function NotificationProvider({ 
  children, 
  initialNotifications = [],
  userId
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [activeToast, setActiveToast] = useState<Notification | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Calculate unread count
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length
    setUnreadCount(count)
  }, [notifications])

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        // Handle case where notifications table doesn't exist
        if (error.code === '42P01') {
          console.warn('Notifications table does not exist, skipping notification fetch')
          setNotifications([])
          return
        }
        throw error
      }
      setNotifications(data || [])
    } catch (error) {
      // Only log and show toast for unexpected errors (not missing table)
      if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
        // This is the missing table error, already handled above
        console.warn('Notifications table does not exist, skipping notification fetch')
        setNotifications([])
      } else {
        console.error('Error fetching notifications:', error)
        toast({
          title: "Error",
          description: "Failed to load notifications",
          variant: "destructive"
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [userId, supabase, toast])

  // Mark as read
  const markAsRead = useCallback(async (notificationIds?: string[]) => {
    if (!userId) return
    
    try {
      if (notificationIds) {
        // Mark specific notifications
        const { error } = await supabase
          .from('notifications')
          .update({ read: true, read_at: new Date().toISOString() })
          .eq('user_id', userId)
          .in('id', notificationIds)
        
        if (error) throw error
        
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) 
              ? { ...n, read: true, read_at: new Date().toISOString() }
              : n
          )
        )
      } else {
        // Mark all as read
        const { error } = await supabase
          .from('notifications')
          .update({ read: true, read_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('read', false)
        
        if (error) throw error
        
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
        )
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      toast({
        title: "Error",
        description: "Failed to update notifications",
        variant: "destructive"
      })
    }
  }, [userId, supabase, toast])

  // Clear all notifications
  const clearAll = useCallback(async () => {
    if (!userId) return
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
      
      if (error) throw error
      
      setNotifications([])
      toast({
        title: "Success",
        description: "All notifications cleared"
      })
    } catch (error) {
      console.error('Error clearing notifications:', error)
      toast({
        title: "Error",
        description: "Failed to clear notifications",
        variant: "destructive"
      })
    }
  }, [userId, supabase, toast])

  // Delete specific notifications
  const deleteNotifications = useCallback(async (notificationIds: string[]) => {
    if (!userId) return
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .in('id', notificationIds)
      
      if (error) throw error
      
      setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)))
    } catch (error) {
      console.error('Error deleting notifications:', error)
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive"
      })
    }
  }, [userId, supabase, toast])

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications()
  }, [fetchNotifications])

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = payload.new as Notification
          
          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev])
          
          // Show toast for high priority notifications
          if (newNotification.priority === 'high' || newNotification.priority === 'urgent') {
            setActiveToast(newNotification)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const deletedId = payload.old.id
          setNotifications(prev => prev.filter(n => n.id !== deletedId))
        }
      )
      .subscribe()

    // Fetch initial notifications
    fetchNotifications()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, fetchNotifications])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        clearAll,
        deleteNotifications,
        refreshNotifications
      }}
    >
      {children}
      
      {/* Notification Toast */}
      <NotificationToast
        notification={activeToast}
        onClose={() => setActiveToast(null)}
        onAction={() => {
          // Handle action based on notification type
          if (activeToast?.metadata?.automation_id) {
            // Navigate to automation
            window.location.href = `/automations/${activeToast.metadata.automation_id}`
          }
          setActiveToast(null)
        }}
        actionLabel="View Details"
      />
    </NotificationContext.Provider>
  )
}