// src/lib/accessibility/accessibilityFixes.ts
/**
 * Accessibility Fixes and Enhancements
 * Quest 4.3 - Expert Council Validated Implementation
 * 
 * Stage 5.1: WCAG 2.1 AA Accessibility Audit
 * Expert Consensus: 100% (6/6 experts)
 * Priority: HIGH
 */

// ============================================================================
// ACCESSIBILITY ENHANCEMENT UTILITIES
// ============================================================================

/**
 * Generate unique IDs for accessibility relationships
 */
export function generateAccessibilityId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Create ARIA live region for announcements
 */
export function createLiveRegion(politeness: 'polite' | 'assertive' = 'polite'): HTMLElement {
  const liveRegion = document.createElement('div')
  liveRegion.setAttribute('aria-live', politeness)
  liveRegion.setAttribute('aria-atomic', 'true')
  liveRegion.className = 'sr-only'
  liveRegion.style.cssText = `
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  `
  
  if (!document.getElementById('accessibility-live-region')) {
    liveRegion.id = 'accessibility-live-region'
    document.body.appendChild(liveRegion)
  }
  
  return liveRegion
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
  const liveRegion = document.getElementById('accessibility-live-region') || createLiveRegion(politeness)
  
  // Clear previous message
  liveRegion.textContent = ''
  
  // Add new message after a brief delay to ensure it's announced
  setTimeout(() => {
    liveRegion.textContent = message
  }, 100)
  
  // Clear message after announcement
  setTimeout(() => {
    liveRegion.textContent = ''
  }, 1000)
}

/**
 * Enhanced focus management
 */
export class FocusManager {
  private focusStack: HTMLElement[] = []
  private trapContainer: HTMLElement | null = null

  /**
   * Save current focus and move to new element
   */
  saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && activeElement !== document.body) {
      this.focusStack.push(activeElement)
    }
  }

  /**
   * Restore previously saved focus
   */
  restoreFocus(): void {
    const previousFocus = this.focusStack.pop()
    if (previousFocus && document.contains(previousFocus)) {
      previousFocus.focus()
    }
  }

  /**
   * Set up focus trap within container
   */
  trapFocus(container: HTMLElement): void {
    this.trapContainer = container
    container.addEventListener('keydown', this.handleFocusTrap.bind(this))
  }

  /**
   * Remove focus trap
   */
  removeFocusTrap(): void {
    if (this.trapContainer) {
      this.trapContainer.removeEventListener('keydown', this.handleFocusTrap.bind(this))
      this.trapContainer = null
    }
  }

  /**
   * Handle focus trap keyboard navigation
   */
  private handleFocusTrap(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.trapContainer) return

    const focusableElements = this.getFocusableElements(this.trapContainer)
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  /**
   * Get all focusable elements within container
   */
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(element => {
        const htmlElement = element as HTMLElement
        return htmlElement.offsetWidth > 0 && 
               htmlElement.offsetHeight > 0 && 
               !htmlElement.hidden &&
               window.getComputedStyle(htmlElement).visibility !== 'hidden'
      }) as HTMLElement[]
  }
}

/**
 * Color contrast utilities
 */
export class ColorContrastChecker {
  /**
   * Calculate relative luminance of a color
   */
  private getRelativeLuminance(color: string): number {
    const rgb = this.hexToRgb(color)
    if (!rgb) return 0

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getRelativeLuminance(color1)
    const lum2 = this.getRelativeLuminance(color2)
    
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    
    return (brightest + 0.05) / (darkest + 0.05)
  }

  /**
   * Check if contrast ratio meets WCAG standards
   */
  meetsWCAGStandards(
    color1: string, 
    color2: string, 
    level: 'AA' | 'AAA' = 'AA',
    isLargeText: boolean = false
  ): { passes: boolean; ratio: number; required: number } {
    const ratio = this.getContrastRatio(color1, color2)
    
    let required: number
    if (level === 'AAA') {
      required = isLargeText ? 4.5 : 7
    } else {
      required = isLargeText ? 3 : 4.5
    }
    
    return {
      passes: ratio >= required,
      ratio: Math.round(ratio * 100) / 100,
      required
    }
  }

  /**
   * Suggest accessible color alternatives
   */
  suggestAccessibleColors(
    foreground: string,
    background: string,
    level: 'AA' | 'AAA' = 'AA'
  ): { foreground: string; background: string; ratio: number }[] {
    const suggestions: { foreground: string; background: string; ratio: number }[] = []
    
    // Common accessible color combinations
    const accessibleCombinations = [
      { fg: '#000000', bg: '#ffffff' }, // Black on white
      { fg: '#ffffff', bg: '#000000' }, // White on black
      { fg: '#003366', bg: '#ffffff' }, // Dark blue on white
      { fg: '#ffffff', bg: '#003366' }, // White on dark blue
      { fg: '#2d3748', bg: '#f7fafc' }, // Dark gray on light gray
      { fg: '#1a202c', bg: '#edf2f7' }, // Very dark gray on very light gray
    ]
    
    for (const combo of accessibleCombinations) {
      const check = this.meetsWCAGStandards(combo.fg, combo.bg, level)
      if (check.passes) {
        suggestions.push({
          foreground: combo.fg,
          background: combo.bg,
          ratio: check.ratio
        })
      }
    }
    
    return suggestions.sort((a, b) => b.ratio - a.ratio)
  }
}

/**
 * Keyboard navigation utilities
 */
export class KeyboardNavigationHelper {
  /**
   * Handle arrow key navigation in a list
   */
  static handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    options: {
      wrap?: boolean
      orientation?: 'horizontal' | 'vertical' | 'both'
      onSelect?: (index: number) => void
    } = {}
  ): number {
    const { wrap = true, orientation = 'vertical', onSelect } = options
    let newIndex = currentIndex

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault()
          newIndex = currentIndex + 1
          if (newIndex >= items.length) {
            newIndex = wrap ? 0 : items.length - 1
          }
        }
        break

      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault()
          newIndex = currentIndex - 1
          if (newIndex < 0) {
            newIndex = wrap ? items.length - 1 : 0
          }
        }
        break

      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault()
          newIndex = currentIndex + 1
          if (newIndex >= items.length) {
            newIndex = wrap ? 0 : items.length - 1
          }
        }
        break

      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault()
          newIndex = currentIndex - 1
          if (newIndex < 0) {
            newIndex = wrap ? items.length - 1 : 0
          }
        }
        break

      case 'Home':
        event.preventDefault()
        newIndex = 0
        break

      case 'End':
        event.preventDefault()
        newIndex = items.length - 1
        break

      case 'Enter':
      case ' ':
        event.preventDefault()
        if (onSelect) {
          onSelect(currentIndex)
        }
        return currentIndex
    }

    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus()
    }

    return newIndex
  }

  /**
   * Set up roving tabindex for a group of elements
   */
  static setupRovingTabindex(items: HTMLElement[], initialIndex: number = 0): void {
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === initialIndex ? '0' : '-1')
    })
  }

  /**
   * Update roving tabindex when focus changes
   */
  static updateRovingTabindex(items: HTMLElement[], activeIndex: number): void {
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === activeIndex ? '0' : '-1')
    })
  }
}

/**
 * ARIA utilities
 */
export class ARIAHelper {
  /**
   * Set up combobox ARIA attributes
   */
  static setupCombobox(
    input: HTMLElement,
    listbox: HTMLElement,
    options: {
      expanded?: boolean
      activeDescendant?: string
      autocomplete?: 'none' | 'inline' | 'list' | 'both'
    } = {}
  ): void {
    const { expanded = false, activeDescendant, autocomplete = 'list' } = options

    input.setAttribute('role', 'combobox')
    input.setAttribute('aria-expanded', expanded.toString())
    input.setAttribute('aria-autocomplete', autocomplete)
    input.setAttribute('aria-haspopup', 'listbox')
    
    if (activeDescendant) {
      input.setAttribute('aria-activedescendant', activeDescendant)
    }

    const listboxId = listbox.id || generateAccessibilityId('listbox')
    listbox.id = listboxId
    input.setAttribute('aria-controls', listboxId)

    listbox.setAttribute('role', 'listbox')
  }

  /**
   * Set up option ARIA attributes
   */
  static setupOption(
    option: HTMLElement,
    options: {
      selected?: boolean
      disabled?: boolean
      value?: string
    } = {}
  ): void {
    const { selected = false, disabled = false, value } = options

    option.setAttribute('role', 'option')
    option.setAttribute('aria-selected', selected.toString())
    
    if (disabled) {
      option.setAttribute('aria-disabled', 'true')
    }
    
    if (value !== undefined) {
      option.setAttribute('data-value', value)
    }

    if (!option.id) {
      option.id = generateAccessibilityId('option')
    }
  }

  /**
   * Set up button ARIA attributes
   */
  static setupButton(
    button: HTMLElement,
    options: {
      pressed?: boolean
      expanded?: boolean
      controls?: string
      describedBy?: string
      label?: string
    } = {}
  ): void {
    const { pressed, expanded, controls, describedBy, label } = options

    if (button.tagName.toLowerCase() !== 'button') {
      button.setAttribute('role', 'button')
      button.setAttribute('tabindex', '0')
    }

    if (pressed !== undefined) {
      button.setAttribute('aria-pressed', pressed.toString())
    }

    if (expanded !== undefined) {
      button.setAttribute('aria-expanded', expanded.toString())
    }

    if (controls) {
      button.setAttribute('aria-controls', controls)
    }

    if (describedBy) {
      button.setAttribute('aria-describedby', describedBy)
    }

    if (label) {
      button.setAttribute('aria-label', label)
    }
  }

  /**
   * Set up live region for status updates
   */
  static setupLiveRegion(
    element: HTMLElement,
    options: {
      politeness?: 'polite' | 'assertive' | 'off'
      atomic?: boolean
      relevant?: string
    } = {}
  ): void {
    const { politeness = 'polite', atomic = true, relevant = 'additions text' } = options

    element.setAttribute('aria-live', politeness)
    element.setAttribute('aria-atomic', atomic.toString())
    element.setAttribute('aria-relevant', relevant)
  }
}

/**
 * Screen reader utilities
 */
export class ScreenReaderHelper {
  /**
   * Create screen reader only text
   */
  static createSROnlyText(text: string): HTMLElement {
    const span = document.createElement('span')
    span.textContent = text
    span.className = 'sr-only'
    span.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `
    return span
  }

  /**
   * Add screen reader description to element
   */
  static addDescription(element: HTMLElement, description: string): string {
    const descriptionId = generateAccessibilityId('description')
    const descriptionElement = this.createSROnlyText(description)
    descriptionElement.id = descriptionId
    
    element.parentNode?.insertBefore(descriptionElement, element.nextSibling)
    element.setAttribute('aria-describedby', descriptionId)
    
    return descriptionId
  }

  /**
   * Add screen reader label to element
   */
  static addLabel(element: HTMLElement, label: string): string {
    const labelId = generateAccessibilityId('label')
    const labelElement = this.createSROnlyText(label)
    labelElement.id = labelId
    
    element.parentNode?.insertBefore(labelElement, element)
    element.setAttribute('aria-labelledby', labelId)
    
    return labelId
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Classes are already exported above with export class declarations
