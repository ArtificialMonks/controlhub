import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
}

interface AppState {
  // UI State
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  notifications: Notification[]
  
  // Global loading states
  globalLoading: boolean
  
  // Actions
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
  setGlobalLoading: (loading: boolean) => void
  
  // Computed getters
  getUnreadNotifications: () => Notification[]
  getNotificationCount: () => number
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // UI State
      sidebarOpen: true,
      theme: 'system',
      notifications: [],
      globalLoading: false,

      // Actions
      setSidebarOpen: (sidebarOpen) => {
        set({ sidebarOpen })
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }))
      },

      setTheme: (theme) => {
        set({ theme })
      },

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          read: false,
        }
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications.slice(0, 99)] // Keep last 100
        }))
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id
              ? { ...notification, read: true }
              : notification
          )
        }))
      },

      clearNotifications: () => {
        set({ notifications: [] })
      },

      setGlobalLoading: (globalLoading) => {
        set({ globalLoading })
      },

      // Computed getters
      getUnreadNotifications: () => {
        return get().notifications.filter((notification) => !notification.read)
      },

      getNotificationCount: () => {
        return get().notifications.filter((notification) => !notification.read).length
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
        notifications: state.notifications,
      }),
    }
  )
)
