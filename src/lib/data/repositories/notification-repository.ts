// src/lib/repositories/notification-repository.ts
import { createClient } from '@/lib/integrations/supabase/server'
import { cache } from 'react'

export interface Notification {
  id: string
  user_id: string
  type: 'automation_failed' | 'automation_success' | 'automation_started' | 'system_alert' | 'maintenance' | 'update'
  title: string
  message: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  read: boolean
  metadata: Record<string, unknown>
  created_at: string
  read_at: string | null
}

export interface NotificationPreferences {
  user_id: string
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  notification_types: Record<string, boolean>
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  created_at: string
  updated_at: string
}

export class NotificationRepository {
  // Get notifications for the current user
  static getNotifications = cache(async (options?: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
    type?: string
    priority?: string
  }) => {
    const supabase = await createClient()
    
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (options?.unreadOnly) {
      query = query.eq('read', false)
    }
    
    if (options?.type) {
      query = query.eq('type', options.type)
    }
    
    if (options?.priority) {
      query = query.eq('priority', options.priority)
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
    
    return data as Notification[]
  })

  // Get unread notification count
  static getUnreadCount = cache(async () => {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0
    
    const { data, error } = await supabase
      .rpc('get_unread_notification_count', { p_user_id: user.id })
    
    if (error) {
      console.error('Error fetching unread count:', error)
      return 0
    }
    
    return data as number
  })

  // Mark notifications as read
  static async markAsRead(notificationIds?: string[]) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0
    
    const { data, error } = await supabase
      .rpc('mark_notifications_as_read', {
        p_user_id: user.id,
        p_notification_ids: notificationIds || null
      })
    
    if (error) {
      console.error('Error marking notifications as read:', error)
      return 0
    }
    
    return data as number
  }

  // Get notification preferences
  static getPreferences = cache(async () => {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .single()
    
    if (error) {
      console.error('Error fetching notification preferences:', error)
      return null
    }
    
    return data as NotificationPreferences
  })

  // Update notification preferences
  static async updatePreferences(preferences: Partial<NotificationPreferences>) {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('notification_preferences')
      .update(preferences)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating notification preferences:', error)
      throw error
    }
    
    return data as NotificationPreferences
  }

  // Create a notification (mainly for system use)
  static async createNotification(notification: {
    user_id: string
    type: Notification['type']
    title: string
    message: string
    priority?: Notification['priority']
    metadata?: Record<string, unknown>
  }) {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .rpc('create_notification', {
        p_user_id: notification.user_id,
        p_type: notification.type,
        p_title: notification.title,
        p_message: notification.message,
        p_priority: notification.priority || 'normal',
        p_metadata: notification.metadata || {}
      })
    
    if (error) {
      console.error('Error creating notification:', error)
      throw error
    }
    
    return data as string
  }

  // Delete notifications
  static async deleteNotifications(notificationIds: string[]) {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds)
    
    if (error) {
      console.error('Error deleting notifications:', error)
      throw error
    }
    
    return true
  }

  // Clear all notifications
  static async clearAllNotifications() {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .neq('id', '') // Delete all for current user (RLS will handle filtering)
    
    if (error) {
      console.error('Error clearing notifications:', error)
      throw error
    }
    
    return true
  }
}