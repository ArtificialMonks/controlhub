// src/lib/testing/touch-target-validation.ts
/**
 * Automated Touch Target Validation
 * WCAG 2.1 AAA Compliance Testing
 * 
 * Provides automated testing utilities for touch target size compliance
 * across all components in the application
 */

import { TOUCH_TARGET_SIZES } from "@/lib/responsive/touch-target-utils"

// Touch target validation result interface
export interface TouchTargetValidationResult {
  element: Element
  selector: string
  width: number
  height: number
  isCompliant: boolean
  level: 'non-compliant' | 'minimum' | 'recommended' | 'optimal'
  recommendations: string[]
  position: {
    top: number
    left: number
    right: number
    bottom: number
  }
}

// Touch target validation options
export interface TouchTargetValidationOptions {
  minimumSize?: number
  recommendedSize?: number
  excludeSelectors?: string[]
  includeHidden?: boolean
  checkSpacing?: boolean
  minimumSpacing?: number
}

// Default validation options
const DEFAULT_OPTIONS: Required<TouchTargetValidationOptions> = {
  minimumSize: TOUCH_TARGET_SIZES.MINIMUM,
  recommendedSize: TOUCH_TARGET_SIZES.RECOMMENDED,
  excludeSelectors: [
    '[data-touch-target="false"]',
    '.sr-only',
    '[aria-hidden="true"]',
    '[hidden]'
  ],
  includeHidden: false,
  checkSpacing: true,
  minimumSpacing: 24 // 24px minimum spacing between undersized targets
}

/**
 * Get computed dimensions of an element
 */
function getElementDimensions(element: Element): { width: number; height: number } {
  const rect = element.getBoundingClientRect()
  const computedStyle = window.getComputedStyle(element)
  
  // Use computed style for more accurate dimensions
  const width = Math.max(
    rect.width,
    parseFloat(computedStyle.minWidth) || 0,
    parseFloat(computedStyle.width) || 0
  )
  
  const height = Math.max(
    rect.height,
    parseFloat(computedStyle.minHeight) || 0,
    parseFloat(computedStyle.height) || 0
  )
  
  return { width, height }
}

/**
 * Check if element is interactive
 */
function isInteractiveElement(element: Element): boolean {
  const interactiveTags = ['button', 'a', 'input', 'select', 'textarea', 'label']
  const interactiveRoles = ['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio', 'slider']
  
  // Check tag name
  if (interactiveTags.includes(element.tagName.toLowerCase())) {
    return true
  }
  
  // Check role attribute
  const role = element.getAttribute('role')
  if (role && interactiveRoles.includes(role)) {
    return true
  }
  
  // Check for click handlers or tabindex
  if (element.hasAttribute('onclick') || element.hasAttribute('tabindex')) {
    return true
  }
  
  // Check for data-touch-target attribute
  if (element.hasAttribute('data-touch-target')) {
    return element.getAttribute('data-touch-target') !== 'false'
  }
  
  return false
}

/**
 * Validate touch target size compliance
 */
function validateTouchTargetSize(
  width: number,
  height: number,
  options: Required<TouchTargetValidationOptions>
): {
  isCompliant: boolean
  level: 'non-compliant' | 'minimum' | 'recommended' | 'optimal'
  recommendations: string[]
} {
  const recommendations: string[] = []
  
  if (width < options.minimumSize || height < options.minimumSize) {
    return {
      isCompliant: false,
      level: 'non-compliant',
      recommendations: [
        `Increase size to minimum ${options.minimumSize}x${options.minimumSize}px`,
        'Use touch-target utility classes (min-h-touch, min-w-touch)',
        'Ensure adequate spacing between touch targets'
      ]
    }
  }
  
  if (width === options.minimumSize && height === options.minimumSize) {
    recommendations.push(`Consider using recommended size (${options.recommendedSize}x${options.recommendedSize}px) for better UX`)
    return {
      isCompliant: true,
      level: 'minimum',
      recommendations
    }
  }
  
  if (width >= options.recommendedSize && height >= options.recommendedSize) {
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
  
  recommendations.push(`Consider increasing to recommended size (${options.recommendedSize}x${options.recommendedSize}px)`)
  return {
    isCompliant: true,
    level: 'minimum',
    recommendations
  }
}

/**
 * Check spacing between touch targets
 */
function checkTouchTargetSpacing(
  elements: Element[],
  minimumSpacing: number
): { element: Element; conflicts: Element[] }[] {
  const conflicts: { element: Element; conflicts: Element[] }[] = []
  
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]
    const rect = element.getBoundingClientRect()
    const elementConflicts: Element[] = []
    
    for (let j = i + 1; j < elements.length; j++) {
      const otherElement = elements[j]
      const otherRect = otherElement.getBoundingClientRect()
      
      // Calculate distance between elements
      const horizontalDistance = Math.max(0, 
        Math.max(rect.left, otherRect.left) - Math.min(rect.right, otherRect.right)
      )
      const verticalDistance = Math.max(0,
        Math.max(rect.top, otherRect.top) - Math.min(rect.bottom, otherRect.bottom)
      )
      
      // Check if elements are too close
      if (horizontalDistance < minimumSpacing && verticalDistance < minimumSpacing) {
        elementConflicts.push(otherElement)
      }
    }
    
    if (elementConflicts.length > 0) {
      conflicts.push({ element, conflicts: elementConflicts })
    }
  }
  
  return conflicts
}

/**
 * Validate touch targets on the current page
 */
export function validateTouchTargets(
  options: TouchTargetValidationOptions = {}
): TouchTargetValidationResult[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const results: TouchTargetValidationResult[] = []
  
  // Find all interactive elements
  const allElements = document.querySelectorAll('*')
  const interactiveElements: Element[] = []
  
  for (const element of allElements) {
    // Skip excluded selectors
    if (opts.excludeSelectors.some(selector => element.matches(selector))) {
      continue
    }
    
    // Skip hidden elements unless includeHidden is true
    if (!opts.includeHidden) {
      const style = window.getComputedStyle(element)
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        continue
      }
    }
    
    // Check if element is interactive
    if (isInteractiveElement(element)) {
      interactiveElements.push(element)
    }
  }
  
  // Validate each interactive element
  for (const element of interactiveElements) {
    const { width, height } = getElementDimensions(element)
    const rect = element.getBoundingClientRect()
    const validation = validateTouchTargetSize(width, height, opts)
    
    // Create CSS selector for the element
    let selector = element.tagName.toLowerCase()
    if (element.id) {
      selector += `#${element.id}`
    }
    if (element.className) {
      const classes = element.className.toString().split(' ').filter(Boolean)
      if (classes.length > 0) {
        selector += `.${classes.slice(0, 3).join('.')}`
      }
    }
    
    results.push({
      element,
      selector,
      width,
      height,
      isCompliant: validation.isCompliant,
      level: validation.level,
      recommendations: validation.recommendations,
      position: {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom
      }
    })
  }
  
  return results
}

/**
 * Generate touch target validation report
 */
export function generateTouchTargetReport(
  results: TouchTargetValidationResult[]
): {
  summary: {
    total: number
    compliant: number
    nonCompliant: number
    complianceRate: number
  }
  byLevel: Record<string, number>
  violations: TouchTargetValidationResult[]
  recommendations: string[]
} {
  const violations = results.filter(result => !result.isCompliant)
  const byLevel = results.reduce((acc, result) => {
    acc[result.level] = (acc[result.level] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const recommendations = [
    ...new Set(
      violations.flatMap(violation => violation.recommendations)
    )
  ]
  
  return {
    summary: {
      total: results.length,
      compliant: results.length - violations.length,
      nonCompliant: violations.length,
      complianceRate: results.length > 0 ? ((results.length - violations.length) / results.length) * 100 : 100
    },
    byLevel,
    violations,
    recommendations
  }
}

/**
 * Console logging utilities for touch target validation
 */
export function logTouchTargetReport(results: TouchTargetValidationResult[]): void {
  const report = generateTouchTargetReport(results)
  
  console.group('🎯 Touch Target Validation Report')
  console.log(`Total interactive elements: ${report.summary.total}`)
  console.log(`Compliance rate: ${report.summary.complianceRate.toFixed(1)}%`)
  console.log(`Compliant: ${report.summary.compliant}`)
  console.log(`Non-compliant: ${report.summary.nonCompliant}`)
  
  if (report.violations.length > 0) {
    console.group('❌ Violations')
    report.violations.forEach(violation => {
      console.warn(`${violation.selector}: ${violation.width}x${violation.height}px`, violation.element)
      violation.recommendations.forEach(rec => console.log(`  💡 ${rec}`))
    })
    console.groupEnd()
  }
  
  console.groupEnd()
}

/**
 * Jest test utilities for touch target validation
 */
export function expectTouchTargetCompliance(
  element: Element,
  minimumSize: number = TOUCH_TARGET_SIZES.MINIMUM
): void {
  const { width, height } = getElementDimensions(element)
  
  if (width < minimumSize || height < minimumSize) {
    throw new Error(
      `Touch target too small: ${width}x${height}px (minimum: ${minimumSize}x${minimumSize}px)`
    )
  }
}

/**
 * Playwright test utilities for touch target validation
 */
export function createTouchTargetTest() {
  return `
    const { validateTouchTargets, logTouchTargetReport } = await import('/src/lib/testing/touch-target-validation.ts');
    const results = validateTouchTargets();
    logTouchTargetReport(results);
    return results.filter(r => !r.isCompliant).length === 0;
  `
}

// Export all utilities
export {
  DEFAULT_OPTIONS as TOUCH_TARGET_VALIDATION_OPTIONS,
  getElementDimensions,
  isInteractiveElement,
  validateTouchTargetSize,
  checkTouchTargetSpacing
}
