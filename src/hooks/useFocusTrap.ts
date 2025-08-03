// src/hooks/useFocusTrap.ts
'use client'

import { useEffect, useRef } from 'react'

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return
    
    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    
    // Focus first element when trap activates
    firstElement?.focus()
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      // Shift + Tab
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } 
      // Tab
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }
    
    // Handle Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Trigger close callback if provided
        container.dispatchEvent(new CustomEvent('close'))
      }
    }
    
    container.addEventListener('keydown', handleKeyDown)
    container.addEventListener('keydown', handleEscape)
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      container.removeEventListener('keydown', handleEscape)
    }
  }, [isActive])
  
  return containerRef
}