// src/lib/accessibility/utils.ts

import React from 'react'

// Screen reader only text
export function srOnly(text: string) {
  return React.createElement('span', { className: 'sr-only' }, text)
}

// Announce to screen readers
export function announceToScreenReader(message: string) {
  if (typeof window === 'undefined') return
  
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Get contrast ratio between two colors
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  
  if (!rgb1 || !rgb2) return 1
  
  const l1 = getLuminance(rgb1)
  const l2 = getLuminance(rgb2)
  
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

// Check if contrast meets WCAG AA standards
export function meetsWCAGAA(contrastRatio: number, fontSize: number, isBold: boolean): boolean {
  const isLargeText = fontSize >= 18 || (fontSize >= 14 && isBold)
  const requiredRatio = isLargeText ? 3 : 4.5
  return contrastRatio >= requiredRatio
}

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

// Calculate relative luminance
function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const { r, g, b } = rgb
  const [rs, gs, bs] = [r, g, b].map(val => {
    val = val / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

// Generate unique ID for form elements
export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

// Focus management utilities
export const focusUtils = {
  // Save current focus
  saveFocus(): HTMLElement | null {
    return document.activeElement as HTMLElement
  },
  
  // Restore focus to element
  restoreFocus(element: HTMLElement | null) {
    if (element && typeof element.focus === 'function') {
      element.focus()
    }
  },
  
  // Focus first focusable element in container
  focusFirst(container: HTMLElement) {
    const focusable = container.querySelector(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement
    
    if (focusable) {
      focusable.focus()
    }
  }
}

// Keyboard navigation keys
export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown'
}

// Check if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ARIA live region announcer component
export function AriaLiveRegion() {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement('div', {
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true',
      className: 'sr-only',
      id: 'aria-live-polite'
    }),
    React.createElement('div', {
      role: 'alert',
      'aria-live': 'assertive', 
      'aria-atomic': 'true',
      className: 'sr-only',
      id: 'aria-live-assertive'
    })
  )
}