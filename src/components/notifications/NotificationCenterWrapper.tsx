// src/components/notifications/NotificationCenterWrapper.tsx
'use client'

import { useNotifications } from './NotificationProvider'
import { NotificationCenter } from './NotificationCenter'

export function NotificationCenterWrapper() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
    deleteNotifications,
    refreshNotifications
  } = useNotifications()

  return (
    <NotificationCenter
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkAsRead={markAsRead}
      onClearAll={clearAll}
      onDelete={deleteNotifications}
      onRefresh={refreshNotifications}
    />
  )
}