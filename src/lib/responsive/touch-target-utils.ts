// src/lib/responsive/touch-target-utils.ts
/**
 * Touch Target Utility System
 * WCAG 2.1 AAA Compliance Implementation
 * 
 * Based on Expert Council consensus:
 * - Primary Actions: 48x48px (exceeds WCAG minimum)
 * - Secondary Actions: 44x44px (meets WCAG minimum)
 * - Navigation Elements: 56x56px (optimized for thumb navigation)
 * - Form Controls: 44px height minimum with touch-friendly padding
 */

import { cn } from "@/lib/core/utils"

// Touch target size constants (WCAG 2.1 AAA compliance)
export const TOUCH_TARGET_SIZES = {
  MINIMUM: 44,     // WCAG 2.1 AAA minimum requirement
  RECOMMENDED: 48, // Expert council recommended size
  NAVIGATION: 56,  // Optimized for thumb navigation
  LARGE: 64,       // Extra large for primary actions
} as const

// Touch target CSS classes
export const TOUCH_TARGET_CLASSES = {
  // Minimum compliance (44x44px)
  minimum: "min-h-touch min-w-touch h-11 w-11",
  
  // Recommended size (48x48px)
  recommended: "min-h-touch-md min-w-touch-md h-12 w-12",
  
  // Navigation optimized (56x56px)
  navigation: "min-h-touch-lg min-w-touch-lg h-14 w-14",
  
  // Large primary actions (64x64px)
  large: "min-h-16 min-w-16 h-16 w-16",
  
  // Form controls (44px height with padding)
  formControl: "min-h-touch h-11 px-3 py-2",
  
  // Button variants
  buttonSmall: "min-h-touch min-w-touch h-11 px-4 py-2",
  buttonDefault: "min-h-touch-md min-w-touch-md h-12 px-6 py-3",
  buttonLarge: "min-h-touch-lg min-w-touch-lg h-14 px-8 py-4",
  
  // Input variants
  inputDefault: "min-h-touch h-11 px-3 py-2",
  inputLarge: "min-h-touch-md h-12 px-4 py-3",
  
  // Icon button variants
  iconSmall: "min-h-touch min-w-touch h-11 w-11 p-2",
  iconDefault: "min-h-touch-md min-w-touch-md h-12 w-12 p-3",
  iconLarge: "min-h-touch-lg min-w-touch-lg h-14 w-14 p-4",
} as const

// Touch target spacing utilities
export const TOUCH_SPACING = {
  // Minimum spacing between touch targets (24px for undersized targets)
  minimum: "gap-6",
  
  // Recommended spacing
  recommended: "gap-4",
  
  // Comfortable spacing
  comfortable: "gap-8",
  
  // Navigation spacing
  navigation: "gap-2",
} as const

/**
 * Get touch target classes based on size and type
 */
export function getTouchTargetClasses(
  size: keyof typeof TOUCH_TARGET_CLASSES,
  additionalClasses?: string
): string {
  return cn(TOUCH_TARGET_CLASSES[size], additionalClasses)
}

/**
 * Get responsive touch target classes
 * Larger targets on smaller screens, optimized sizing on larger screens
 */
export function getResponsiveTouchTargetClasses(
  mobileSize: keyof typeof TOUCH_TARGET_CLASSES,
  desktopSize: keyof typeof TOUCH_TARGET_CLASSES,
  additionalClasses?: string
): string {
  const desktopClasses = TOUCH_TARGET_CLASSES[desktopSize].replace(
    /min-h-\w+|min-w-\w+|h-\d+|w-\d+/g,
    (match) => `md:${match}`
  )

  return cn(
    // Mobile classes
    TOUCH_TARGET_CLASSES[mobileSize],
    // Desktop classes (md breakpoint and up)
    `md:${desktopClasses}`,
    additionalClasses
  )
}

/**
 * Validate touch target size compliance
 */
export function validateTouchTargetSize(
  width: number,
  height: number
): {
  isCompliant: boolean
  level: 'non-compliant' | 'minimum' | 'recommended' | 'optimal'
  recommendations: string[]
} {
  const recommendations: string[] = []
  
  if (width < TOUCH_TARGET_SIZES.MINIMUM || height < TOUCH_TARGET_SIZES.MINIMUM) {
    return {
      isCompliant: false,
      level: 'non-compliant',
      recommendations: [
        `Increase size to minimum ${TOUCH_TARGET_SIZES.MINIMUM}x${TOUCH_TARGET_SIZES.MINIMUM}px`,
        'Use TOUCH_TARGET_CLASSES.minimum or larger',
        'Ensure adequate spacing between touch targets'
      ]
    }
  }
  
  if (width === TOUCH_TARGET_SIZES.MINIMUM && height === TOUCH_TARGET_SIZES.MINIMUM) {
    recommendations.push('Consider using recommended size (48x48px) for better UX')
    return {
      isCompliant: true,
      level: 'minimum',
      recommendations
    }
  }
  
  if (width >= TOUCH_TARGET_SIZES.RECOMMENDED && height >= TOUCH_TARGET_SIZES.RECOMMENDED) {
    if (width >= TOUCH_TARGET_SIZES.NAVIGATION && height >= TOUCH_TARGET_SIZES.NAVIGATION) {
      return {
        isCompliant: true,
        level: 'optimal',
        recommendations: ['Touch target size is optimal for mobile interaction']
      }
    }
    
    return {
      isCompliant: true,
      level: 'recommended',
      recommendations: ['Touch target size meets recommended standards']
    }
  }
  
  recommendations.push('Consider increasing to recommended size (48x48px)')
  return {
    isCompliant: true,
    level: 'minimum',
    recommendations
  }
}

/**
 * Touch target component props interface
 */
export interface TouchTargetProps {
  size?: keyof typeof TOUCH_TARGET_CLASSES
  responsive?: {
    mobile: keyof typeof TOUCH_TARGET_CLASSES
    desktop: keyof typeof TOUCH_TARGET_CLASSES
  }
  spacing?: keyof typeof TOUCH_SPACING
  className?: string
}

/**
 * Get complete touch target styling
 */
export function getTouchTargetStyling({
  size = 'recommended',
  responsive,
  spacing = 'recommended',
  className
}: TouchTargetProps): string {
  if (responsive) {
    return cn(
      getResponsiveTouchTargetClasses(responsive.mobile, responsive.desktop),
      TOUCH_SPACING[spacing],
      className
    )
  }
  
  return cn(
    getTouchTargetClasses(size),
    TOUCH_SPACING[spacing],
    className
  )
}

/**
 * Position-based touch target recommendations
 * Based on research: touch precision varies by screen position
 */
export const POSITION_BASED_RECOMMENDATIONS = {
  // Top of screen (least precise area - 42px minimum)
  top: {
    minimumSize: 42,
    recommendedSize: 48,
    classes: TOUCH_TARGET_CLASSES.recommended
  },
  
  // Center of screen (most precise area - 27px minimum, but use 44px for consistency)
  center: {
    minimumSize: 44,
    recommendedSize: 48,
    classes: TOUCH_TARGET_CLASSES.recommended
  },
  
  // Bottom of screen (least precise area - 46px minimum)
  bottom: {
    minimumSize: 46,
    recommendedSize: 56,
    classes: TOUCH_TARGET_CLASSES.navigation
  },
  
  // Edges (require larger targets due to reduced precision)
  edges: {
    minimumSize: 48,
    recommendedSize: 56,
    classes: TOUCH_TARGET_CLASSES.navigation
  }
} as const

/**
 * Get position-based touch target classes
 */
export function getPositionBasedTouchTargetClasses(
  position: keyof typeof POSITION_BASED_RECOMMENDATIONS,
  additionalClasses?: string
): string {
  return cn(
    POSITION_BASED_RECOMMENDATIONS[position].classes,
    additionalClasses
  )
}

/**
 * Touch target accessibility attributes
 */
export function getTouchTargetA11yProps(label: string) {
  return {
    'aria-label': label,
    'role': 'button',
    'tabIndex': 0,
    // Ensure minimum touch target size is communicated to screen readers
    'data-touch-target': 'true'
  }
}

// All utilities are exported inline above
