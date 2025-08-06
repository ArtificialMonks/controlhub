// src/lib/responsive/breakpoint-utils.ts
/**
 * Breakpoint Detection Utilities
 * Expert Council Approved Enhancement
 * 
 * Provides JavaScript utilities for responsive breakpoint detection
 * and state management with mobile-first approach
 */

"use client"

import { useEffect, useState, useCallback } from "react"

// Breakpoint definitions (matches Tailwind config)
export const BREAKPOINTS = {
  sm: 640,   // Mobile landscape, small tablets
  md: 768,   // Tablets portrait  
  lg: 1024,  // Tablets landscape, small desktops
  xl: 1280,  // Desktops
  '2xl': 1536, // Large desktops
} as const

export type BreakpointKey = keyof typeof BREAKPOINTS
export type BreakpointValue = typeof BREAKPOINTS[BreakpointKey]

// Device type detection
export type DeviceType = 'mobile' | 'tablet' | 'desktop'
export type Orientation = 'portrait' | 'landscape'

// Breakpoint state interface
export interface BreakpointState {
  width: number
  height: number
  deviceType: DeviceType
  orientation: Orientation
  breakpoint: BreakpointKey | 'xs'
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  // Specific breakpoint checks
  isXs: boolean
  isSm: boolean
  isMd: boolean
  isLg: boolean
  isXl: boolean
  is2xl: boolean
  // Range checks
  isSmAndUp: boolean
  isMdAndUp: boolean
  isLgAndUp: boolean
  isXlAndUp: boolean
  // Touch device detection
  isTouchDevice: boolean
}

/**
 * Get current breakpoint based on window width
 */
export function getCurrentBreakpoint(width: number): BreakpointKey | 'xs' {
  if (width >= BREAKPOINTS['2xl']) return '2xl'
  if (width >= BREAKPOINTS.xl) return 'xl'
  if (width >= BREAKPOINTS.lg) return 'lg'
  if (width >= BREAKPOINTS.md) return 'md'
  if (width >= BREAKPOINTS.sm) return 'sm'
  return 'xs'
}

/**
 * Get device type based on window dimensions
 */
export function getDeviceType(width: number): DeviceType {
  // Mobile: width < 768px
  if (width < BREAKPOINTS.md) return 'mobile'

  // Tablet: 768px <= width < 1024px
  if (width < BREAKPOINTS.lg) return 'tablet'

  // Desktop: width >= 1024px
  return 'desktop'
}

/**
 * Get orientation based on window dimensions
 */
export function getOrientation(width: number, height: number): Orientation {
  return width > height ? 'landscape' : 'portrait'
}

/**
 * Detect if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - legacy support for IE
    navigator.msMaxTouchPoints > 0
  )
}

/**
 * Create breakpoint state from window dimensions
 */
export function createBreakpointState(width: number, height: number): BreakpointState {
  const breakpoint = getCurrentBreakpoint(width)
  const deviceType = getDeviceType(width)
  const orientation = getOrientation(width, height)
  const touchDevice = isTouchDevice()
  
  return {
    width,
    height,
    deviceType,
    orientation,
    breakpoint,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    // Specific breakpoint checks
    isXs: breakpoint === 'xs',
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    is2xl: breakpoint === '2xl',
    // Range checks (mobile-first)
    isSmAndUp: width >= BREAKPOINTS.sm,
    isMdAndUp: width >= BREAKPOINTS.md,
    isLgAndUp: width >= BREAKPOINTS.lg,
    isXlAndUp: width >= BREAKPOINTS.xl,
    // Touch device detection
    isTouchDevice: touchDevice,
  }
}

/**
 * Hook for responsive breakpoint detection
 */
export function useBreakpoint(): BreakpointState {
  const [breakpointState, setBreakpointState] = useState<BreakpointState>(() => {
    // SSR-safe initial state
    if (typeof window === 'undefined') {
      return createBreakpointState(1024, 768) // Default to desktop
    }
    return createBreakpointState(window.innerWidth, window.innerHeight)
  })
  
  const updateBreakpoint = useCallback(() => {
    if (typeof window === 'undefined') return
    
    const newState = createBreakpointState(window.innerWidth, window.innerHeight)
    setBreakpointState(newState)
  }, [])
  
  useEffect(() => {
    // Update on mount to get actual window size
    updateBreakpoint()
    
    // Add resize listener with debouncing
    let timeoutId: NodeJS.Timeout
    const debouncedUpdate = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateBreakpoint, 100)
    }
    
    window.addEventListener('resize', debouncedUpdate)
    window.addEventListener('orientationchange', updateBreakpoint)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', debouncedUpdate)
      window.removeEventListener('orientationchange', updateBreakpoint)
    }
  }, [updateBreakpoint])
  
  return breakpointState
}

/**
 * Hook for specific breakpoint detection
 */
export function useBreakpointValue<T>(
  values: Partial<Record<BreakpointKey | 'xs', T>>,
  defaultValue: T
): T {
  const { breakpoint } = useBreakpoint()
  
  // Return value for current breakpoint or fall back to smaller breakpoints
  if (values[breakpoint] !== undefined) {
    return values[breakpoint]!
  }
  
  // Fallback logic (mobile-first)
  const fallbackOrder: (BreakpointKey | 'xs')[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
  const currentIndex = fallbackOrder.indexOf(breakpoint)
  
  for (let i = currentIndex - 1; i >= 0; i--) {
    const fallbackKey = fallbackOrder[i]
    if (values[fallbackKey] !== undefined) {
      return values[fallbackKey]!
    }
  }
  
  return defaultValue
}

/**
 * Hook for media query matching
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)
    
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }
    
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])
  
  return matches
}

/**
 * Predefined media query hooks
 */
export const useIsMobile = () => useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`)
export const useIsTablet = () => useMediaQuery(`(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`)
export const useIsDesktop = () => useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`)
export const useIsSmAndUp = () => useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`)
export const useIsMdAndUp = () => useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`)
export const useIsLgAndUp = () => useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`)

/**
 * Utility functions for server-side rendering
 */
export function getBreakpointFromUserAgent(userAgent: string): BreakpointKey | 'xs' {
  // Simple mobile detection for SSR
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  return mobileRegex.test(userAgent) ? 'xs' : 'lg'
}

/**
 * CSS-in-JS breakpoint utilities
 */
export function createMediaQuery(breakpoint: BreakpointKey): string {
  return `@media (min-width: ${BREAKPOINTS[breakpoint]}px)`
}

export function createMaxWidthMediaQuery(breakpoint: BreakpointKey): string {
  return `@media (max-width: ${BREAKPOINTS[breakpoint] - 1}px)`
}

/**
 * Breakpoint range utilities
 */
export function createRangeMediaQuery(
  minBreakpoint: BreakpointKey | 'xs',
  maxBreakpoint: BreakpointKey
): string {
  const minWidth = minBreakpoint === 'xs' ? 0 : BREAKPOINTS[minBreakpoint]
  const maxWidth = BREAKPOINTS[maxBreakpoint] - 1
  return `@media (min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`
}

// All utilities are exported inline above
