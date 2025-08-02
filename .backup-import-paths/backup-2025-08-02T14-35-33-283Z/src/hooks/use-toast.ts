// src/hooks/use-toast.ts
/**
 * Toast Hook
 * Simple toast notification system for user feedback
 * Quest 2.4: Wire Up Individual Action Buttons
 */

"use client"

import { useState, useCallback, useEffect } from 'react'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

export interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

// Simple toast state management
let toastId = 0
const toasts: Toast[] = []
const listeners: Array<(toasts: Toast[]) => void> = []

const generateId = () => `toast-${++toastId}`

const addToast = (options: ToastOptions) => {
  const toast: Toast = {
    id: generateId(),
    duration: 5000,
    ...options
  }
  
  toasts.push(toast)
  listeners.forEach(listener => listener([...toasts]))
  
  // Auto-remove toast after duration
  if (toast.duration && toast.duration > 0) {
    setTimeout(() => {
      removeToast(toast.id)
    }, toast.duration)
  }
  
  return toast
}

const removeToast = (id: string) => {
  const index = toasts.findIndex(toast => toast.id === id)
  if (index > -1) {
    toasts.splice(index, 1)
    listeners.forEach(listener => listener([...toasts]))
  }
}

const subscribe = (listener: (toasts: Toast[]) => void) => {
  listeners.push(listener)
  return () => {
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }
}

export function useToast() {
  const [toastList, setToastList] = useState<Toast[]>([])
  
  // Subscribe to toast updates
  useEffect(() => {
    const unsubscribe = subscribe(setToastList)
    return unsubscribe
  }, [])
  
  const toast = useCallback((options: ToastOptions) => {
    return addToast(options)
  }, [])
  
  const dismiss = useCallback((id: string) => {
    removeToast(id)
  }, [])
  
  return {
    toast,
    dismiss,
    toasts: toastList
  }
}

// Simple console-based toast for now (can be enhanced with UI components later)
// This avoids JSX syntax issues in the hook file
