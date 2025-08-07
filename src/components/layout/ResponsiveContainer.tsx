// src/components/layout/ResponsiveContainer.tsx
/**
 * ResponsiveContainer Component
 * Expert Council Approved Enhancement
 * 
 * Provides breakpoint-aware layout with mobile-first responsive behavior
 * Implements progressive enhancement from mobile to desktop
 */

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Responsive container variants
export type ResponsiveVariant = 
  | "fluid"        // Full width at all breakpoints
  | "contained"    // Max width with centered content
  | "constrained"  // Narrower max width for reading
  | "sidebar"      // Accounts for sidebar layout
  | "mobile-first" // Mobile-optimized with progressive enhancement

// Responsive spacing variants
export type ResponsiveSpacing = 
  | "none"    // No padding
  | "sm"      // Small padding (mobile: 16px, desktop: 24px)
  | "md"      // Medium padding (mobile: 24px, desktop: 32px)
  | "lg"      // Large padding (mobile: 32px, desktop: 48px)
  | "xl"      // Extra large padding (mobile: 48px, desktop: 64px)

// Responsive grid variants
export type ResponsiveGridType =
  | "none"     // No grid
  | "auto"     // Auto-fit columns
  | "1-2-3"    // 1 col mobile, 2 tablet, 3 desktop
  | "1-2-4"    // 1 col mobile, 2 tablet, 4 desktop
  | "2-3-4"    // 2 col mobile, 3 tablet, 4 desktop

interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ResponsiveVariant
  spacing?: ResponsiveSpacing
  grid?: ResponsiveGridType
  children: React.ReactNode
  className?: string
  // Mobile-first responsive props
  mobileFirst?: boolean
  // Touch-friendly spacing
  touchOptimized?: boolean
}

// Variant class mappings
const VARIANT_CLASSES = {
  fluid: "w-full",
  contained: "w-full max-w-7xl mx-auto",
  constrained: "w-full max-w-4xl mx-auto",
  sidebar: "w-full max-w-none", // Handled by layout
  "mobile-first": "w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto"
} as const

// Spacing class mappings (mobile-first approach)
const SPACING_CLASSES = {
  none: "",
  sm: "px-4 py-4 sm:px-6 sm:py-6",
  md: "px-6 py-6 sm:px-8 sm:py-8",
  lg: "px-8 py-8 sm:px-12 sm:py-12",
  xl: "px-12 py-12 sm:px-16 sm:py-16"
} as const

// Touch-optimized spacing (larger touch targets and spacing)
const TOUCH_SPACING_CLASSES = {
  none: "",
  sm: "px-6 py-6 sm:px-8 sm:py-8",
  md: "px-8 py-8 sm:px-12 sm:py-12",
  lg: "px-12 py-12 sm:px-16 sm:py-16",
  xl: "px-16 py-16 sm:px-20 sm:py-20"
} as const

// Grid class mappings (mobile-first responsive grid)
const GRID_CLASSES = {
  none: "",
  auto: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-auto gap-4 sm:gap-6",
  "1-2-3": "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6",
  "1-2-4": "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6",
  "2-3-4": "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
} as const

/**
 * ResponsiveContainer Component
 * 
 * Provides consistent responsive behavior across the application
 * with mobile-first design principles and touch optimization
 */
export function ResponsiveContainer({
  variant = "contained",
  spacing = "md",
  grid = "none",
  children,
  className,
  mobileFirst = true,
  touchOptimized = true,
  ...props
}: ResponsiveContainerProps) {
  
  // Select appropriate spacing classes based on touch optimization
  const spacingClasses = touchOptimized 
    ? TOUCH_SPACING_CLASSES[spacing]
    : SPACING_CLASSES[spacing]
  
  return (
    <div
      className={cn(
        // Base responsive container styles
        "relative",
        
        // Variant-specific width and positioning
        VARIANT_CLASSES[variant],
        
        // Responsive spacing
        spacingClasses,
        
        // Grid layout if specified
        GRID_CLASSES[grid],
        
        // Mobile-first optimizations
        mobileFirst && [
          "min-h-0", // Prevent flex item overflow
          "overflow-hidden sm:overflow-visible", // Handle mobile overflow
        ],
        
        // Touch optimization classes
        touchOptimized && [
          "touch-pan-y", // Enable vertical panning
          "select-none sm:select-auto", // Prevent accidental selection on mobile
        ],
        
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * ResponsiveSection Component
 * 
 * A section wrapper with responsive spacing and optional background
 */
interface ResponsiveSectionProps extends ResponsiveContainerProps {
  background?: "none" | "muted" | "card" | "accent"
  border?: boolean
  rounded?: boolean
}

const BACKGROUND_CLASSES = {
  none: "",
  muted: "bg-muted/50",
  card: "bg-card",
  accent: "bg-accent/10"
} as const

export function ResponsiveSection({
  background = "none",
  border = false,
  rounded = false,
  className,
  ...props
}: ResponsiveSectionProps) {
  return (
    <ResponsiveContainer
      className={cn(
        // Background styling
        BACKGROUND_CLASSES[background],
        
        // Border styling
        border && "border border-border",
        
        // Rounded corners
        rounded && "rounded-lg sm:rounded-xl",
        
        className
      )}
      {...props}
    />
  )
}

/**
 * ResponsiveGrid Component
 * 
 * A specialized grid container with responsive column management
 */
interface ResponsiveGridProps extends Omit<ResponsiveContainerProps, 'grid'> {
  columns?: {
    mobile: number
    tablet?: number
    desktop?: number
  }
  gap?: "sm" | "md" | "lg" | "xl"
  equalHeight?: boolean
}

const GAP_CLASSES = {
  sm: "gap-2 sm:gap-3",
  md: "gap-4 sm:gap-6",
  lg: "gap-6 sm:gap-8",
  xl: "gap-8 sm:gap-12"
} as const

export function ResponsiveGrid({
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = "md",
  equalHeight = false,
  className,
  ...props
}: ResponsiveGridProps) {
  const gridCols = `grid-cols-${columns.mobile} ${
    columns.tablet ? `sm:grid-cols-${columns.tablet}` : ''
  } ${
    columns.desktop ? `lg:grid-cols-${columns.desktop}` : ''
  }`.trim()
  
  return (
    <ResponsiveContainer
      className={cn(
        "grid",
        gridCols,
        GAP_CLASSES[gap],
        equalHeight && "items-stretch",
        className
      )}
      grid="none" // Override default grid to use custom
      {...props}
    />
  )
}

/**
 * ResponsiveStack Component
 * 
 * A vertical stack with responsive spacing
 */
interface ResponsiveStackProps extends Omit<ResponsiveContainerProps, 'grid'> {
  gap?: "sm" | "md" | "lg" | "xl"
  align?: "start" | "center" | "end" | "stretch"
  justify?: "start" | "center" | "end" | "between" | "around"
}

const ALIGN_CLASSES = {
  start: "items-start",
  center: "items-center", 
  end: "items-end",
  stretch: "items-stretch"
} as const

const JUSTIFY_CLASSES = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around"
} as const

export function ResponsiveStack({
  gap = "md",
  align = "stretch",
  justify = "start",
  className,
  ...props
}: ResponsiveStackProps) {
  return (
    <ResponsiveContainer
      className={cn(
        "flex flex-col",
        GAP_CLASSES[gap],
        ALIGN_CLASSES[align],
        JUSTIFY_CLASSES[justify],
        className
      )}
      grid="none"
      {...props}
    />
  )
}

// All components and types are exported inline above
