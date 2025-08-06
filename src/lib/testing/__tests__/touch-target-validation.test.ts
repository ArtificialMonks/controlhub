// src/lib/testing/__tests__/touch-target-validation.test.ts
/**
 * Touch Target Validation Tests
 * WCAG 2.1 AAA Compliance Testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  validateTouchTargets,
  generateTouchTargetReport,
  expectTouchTargetCompliance,
  getElementDimensions,
  isInteractiveElement,
  validateTouchTargetSize,
  TOUCH_TARGET_VALIDATION_OPTIONS
} from '../touch-target-validation'
import { TOUCH_TARGET_SIZES } from '@/lib/responsive/touch-target-utils'

// Mock DOM environment
const mockElement = (
  tagName: string,
  styles: Partial<CSSStyleDeclaration> = {},
  attributes: Record<string, string> = {}
) => {
  const element = document.createElement(tagName)
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value)
  })
  
  // Mock getBoundingClientRect
  const rect = {
    width: parseFloat(styles.width as string) || 0,
    height: parseFloat(styles.height as string) || 0,
    top: 0,
    left: 0,
    right: parseFloat(styles.width as string) || 0,
    bottom: parseFloat(styles.height as string) || 0,
    x: 0,
    y: 0,
    toJSON: () => ({})
  }
  
  element.getBoundingClientRect = vi.fn(() => rect)

  // Mock getComputedStyle
  Object.defineProperty(window, 'getComputedStyle', {
    value: vi.fn(() => ({
      width: '0px',
      height: '0px',
      minWidth: '0px',
      minHeight: '0px',
      display: 'block',
      visibility: 'visible',
      opacity: '1',
      ...styles
    }))
  })
  
  return element
}

describe('Touch Target Validation', () => {
  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = ''
  })
  
  afterEach(() => {
    vi.clearAllMocks()
  })
  
  describe('getElementDimensions', () => {
    it('should return correct dimensions for element', () => {
      const element = mockElement('button', {
        width: '48px',
        height: '48px'
      })
      
      const dimensions = getElementDimensions(element)
      expect(dimensions.width).toBe(48)
      expect(dimensions.height).toBe(48)
    })
    
    it('should use minimum dimensions when larger', () => {
      const element = mockElement('button', {
        width: '20px',
        height: '20px',
        minWidth: '44px',
        minHeight: '44px'
      })
      
      const dimensions = getElementDimensions(element)
      expect(dimensions.width).toBe(44)
      expect(dimensions.height).toBe(44)
    })
  })
  
  describe('isInteractiveElement', () => {
    it('should identify button elements as interactive', () => {
      const button = mockElement('button')
      expect(isInteractiveElement(button)).toBe(true)
    })
    
    it('should identify link elements as interactive', () => {
      const link = mockElement('a', {}, { href: '#' })
      expect(isInteractiveElement(link)).toBe(true)
    })
    
    it('should identify elements with button role as interactive', () => {
      const div = mockElement('div', {}, { role: 'button' })
      expect(isInteractiveElement(div)).toBe(true)
    })
    
    it('should identify elements with tabindex as interactive', () => {
      const div = mockElement('div', {}, { tabindex: '0' })
      expect(isInteractiveElement(div)).toBe(true)
    })
    
    it('should not identify non-interactive elements', () => {
      const div = mockElement('div')
      expect(isInteractiveElement(div)).toBe(false)
    })
    
    it('should respect data-touch-target attribute', () => {
      const div = mockElement('div', {}, { 'data-touch-target': 'true' })
      expect(isInteractiveElement(div)).toBe(true)
      
      const button = mockElement('button', {}, { 'data-touch-target': 'false' })
      expect(isInteractiveElement(button)).toBe(false)
    })
  })
  
  describe('validateTouchTargetSize', () => {
    const options = TOUCH_TARGET_VALIDATION_OPTIONS
    
    it('should mark undersized targets as non-compliant', () => {
      const result = validateTouchTargetSize(30, 30, options)
      expect(result.isCompliant).toBe(false)
      expect(result.level).toBe('non-compliant')
      expect(result.recommendations).toContain('Increase size to minimum 44x44px')
    })
    
    it('should mark minimum size targets as compliant but minimum level', () => {
      const result = validateTouchTargetSize(44, 44, options)
      expect(result.isCompliant).toBe(true)
      expect(result.level).toBe('minimum')
    })
    
    it('should mark recommended size targets as recommended level', () => {
      const result = validateTouchTargetSize(48, 48, options)
      expect(result.isCompliant).toBe(true)
      expect(result.level).toBe('recommended')
    })
    
    it('should mark large targets as optimal level', () => {
      const result = validateTouchTargetSize(56, 56, options)
      expect(result.isCompliant).toBe(true)
      expect(result.level).toBe('optimal')
    })
  })
  
  describe('validateTouchTargets', () => {
    it('should validate all interactive elements on page', () => {
      // Create test elements
      const compliantButton = mockElement('button', {
        width: '48px',
        height: '48px'
      })
      const nonCompliantButton = mockElement('button', {
        width: '30px',
        height: '30px'
      })
      const nonInteractiveDiv = mockElement('div', {
        width: '20px',
        height: '20px'
      })
      
      document.body.appendChild(compliantButton)
      document.body.appendChild(nonCompliantButton)
      document.body.appendChild(nonInteractiveDiv)
      
      const results = validateTouchTargets()
      
      // Should only validate interactive elements
      expect(results).toHaveLength(2)
      
      // Check compliance
      const compliantResult = results.find(r => r.width === 48)
      const nonCompliantResult = results.find(r => r.width === 30)
      
      expect(compliantResult?.isCompliant).toBe(true)
      expect(nonCompliantResult?.isCompliant).toBe(false)
    })
    
    it('should exclude elements with excluded selectors', () => {
      const button = mockElement('button', {
        width: '30px',
        height: '30px'
      }, { 'data-touch-target': 'false' })
      
      document.body.appendChild(button)
      
      const results = validateTouchTargets()
      expect(results).toHaveLength(0)
    })
    
    it('should skip hidden elements by default', () => {
      const button = mockElement('button', {
        width: '48px',
        height: '48px',
        display: 'none'
      })
      
      document.body.appendChild(button)
      
      const results = validateTouchTargets()
      expect(results).toHaveLength(0)
    })
    
    it('should include hidden elements when includeHidden is true', () => {
      const button = mockElement('button', {
        width: '48px',
        height: '48px',
        display: 'none'
      })
      
      document.body.appendChild(button)
      
      const results = validateTouchTargets({ includeHidden: true })
      expect(results).toHaveLength(1)
    })
  })
  
  describe('generateTouchTargetReport', () => {
    it('should generate correct summary statistics', () => {
      const results = [
        {
          element: mockElement('button'),
          selector: 'button',
          width: 48,
          height: 48,
          isCompliant: true,
          level: 'recommended' as const,
          recommendations: [],
          position: { top: 0, left: 0, right: 48, bottom: 48 }
        },
        {
          element: mockElement('button'),
          selector: 'button',
          width: 30,
          height: 30,
          isCompliant: false,
          level: 'non-compliant' as const,
          recommendations: ['Increase size'],
          position: { top: 0, left: 0, right: 30, bottom: 30 }
        }
      ]
      
      const report = generateTouchTargetReport(results)
      
      expect(report.summary.total).toBe(2)
      expect(report.summary.compliant).toBe(1)
      expect(report.summary.nonCompliant).toBe(1)
      expect(report.summary.complianceRate).toBe(50)
      expect(report.violations).toHaveLength(1)
      expect(report.byLevel.recommended).toBe(1)
      expect(report.byLevel['non-compliant']).toBe(1)
    })
  })
  
  describe('expectTouchTargetCompliance', () => {
    it('should pass for compliant elements', () => {
      const element = mockElement('button', {
        width: '48px',
        height: '48px'
      })
      
      expect(() => {
        expectTouchTargetCompliance(element)
      }).not.toThrow()
    })
    
    it('should throw for non-compliant elements', () => {
      const element = mockElement('button', {
        width: '30px',
        height: '30px'
      })
      
      expect(() => {
        expectTouchTargetCompliance(element)
      }).toThrow('Touch target too small: 30x30px (minimum: 44x44px)')
    })
    
    it('should use custom minimum size', () => {
      const element = mockElement('button', {
        width: '40px',
        height: '40px'
      })
      
      expect(() => {
        expectTouchTargetCompliance(element, 48)
      }).toThrow('Touch target too small: 40x40px (minimum: 48x48px)')
    })
  })
  
  describe('WCAG 2.1 AAA Compliance', () => {
    it('should enforce 44px minimum as per WCAG 2.1 AAA', () => {
      expect(TOUCH_TARGET_VALIDATION_OPTIONS.minimumSize).toBe(TOUCH_TARGET_SIZES.MINIMUM)
      expect(TOUCH_TARGET_SIZES.MINIMUM).toBe(44)
    })
    
    it('should recommend 48px for better UX', () => {
      expect(TOUCH_TARGET_VALIDATION_OPTIONS.recommendedSize).toBe(TOUCH_TARGET_SIZES.RECOMMENDED)
      expect(TOUCH_TARGET_SIZES.RECOMMENDED).toBe(48)
    })
    
    it('should enforce minimum spacing between targets', () => {
      expect(TOUCH_TARGET_VALIDATION_OPTIONS.minimumSpacing).toBe(24)
    })
  })
})
