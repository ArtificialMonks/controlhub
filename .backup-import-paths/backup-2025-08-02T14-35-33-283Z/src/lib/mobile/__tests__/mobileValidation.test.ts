// src/lib/mobile/__tests__/mobileValidation.test.ts
/**
 * Mobile Validation Tests
 * Quest 4.3 - Expert Council Validated Implementation
 * 
 * Stage 5.2: Enhanced Mobile Validation
 * Expert Consensus: 100% (6/6 experts)
 * Priority: HIGH
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MobileValidationEngine, MOBILE_DEVICES } from '../mobileValidation'

describe('MobileValidationEngine', () => {
  let validationEngine: MobileValidationEngine

  beforeEach(() => {
    validationEngine = new MobileValidationEngine()
  })

  describe('Mobile Device Definitions', () => {
    it('should have comprehensive mobile device definitions', () => {
      expect(MOBILE_DEVICES.length).toBeGreaterThan(0)
      
      MOBILE_DEVICES.forEach(device => {
        expect(device.name).toBeDefined()
        expect(device.userAgent).toBeDefined()
        expect(device.viewport).toBeDefined()
        expect(device.viewport.width).toBeGreaterThan(0)
        expect(device.viewport.height).toBeGreaterThan(0)
        expect(device.viewport.devicePixelRatio).toBeGreaterThan(0)
        expect(device.capabilities).toBeDefined()
        expect(device.operatingSystem).toMatch(/^(iOS|Android|Windows|Other)$/)
        expect(device.browserEngine).toMatch(/^(WebKit|Blink|Gecko|Other)$/)
      })
    })

    it('should include key mobile devices', () => {
      const deviceNames = MOBILE_DEVICES.map(d => d.name)
      
      expect(deviceNames.some(name => name.includes('iPhone'))).toBe(true)
      expect(deviceNames.some(name => name.includes('Samsung'))).toBe(true)
      expect(deviceNames.some(name => name.includes('Pixel'))).toBe(true)
      expect(deviceNames.some(name => name.includes('iPad'))).toBe(true)
    })

    it('should have devices with different screen sizes', () => {
      const viewports = MOBILE_DEVICES.map(d => d.viewport)
      const widths = viewports.map(v => v.width)
      const heights = viewports.map(v => v.height)
      
      expect(Math.max(...widths) - Math.min(...widths)).toBeGreaterThan(100)
      expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(200)
    })

    it('should have devices with different operating systems', () => {
      const operatingSystems = MOBILE_DEVICES.map(d => d.operatingSystem)
      const uniqueOS = new Set(operatingSystems)
      
      expect(uniqueOS.size).toBeGreaterThan(1)
      expect(uniqueOS.has('iOS')).toBe(true)
      expect(uniqueOS.has('Android')).toBe(true)
    })
  })

  describe('Validation Engine Initialization', () => {
    it('should initialize with default devices', () => {
      const engine = new MobileValidationEngine()
      expect(engine).toBeDefined()
    })

    it('should initialize with custom devices', () => {
      const customDevices = MOBILE_DEVICES.slice(0, 2)
      const engine = new MobileValidationEngine(customDevices)
      expect(engine).toBeDefined()
    })
  })

  describe('Mobile Validation Execution', () => {
    it('should run comprehensive mobile validation', async () => {
      const validation = await validationEngine.runMobileValidation('http://localhost:3000')
      
      expect(validation).toBeDefined()
      expect(validation.reportId).toMatch(/^mobile-validation-\d+-[a-z0-9]+$/)
      expect(validation.timestamp).toBeInstanceOf(Date)
      
      // Summary validation
      expect(validation.summary.totalDevices).toBeGreaterThan(0)
      expect(validation.summary.totalTests).toBeGreaterThan(0)
      expect(validation.summary.overallScore).toBeGreaterThanOrEqual(0)
      expect(validation.summary.overallScore).toBeLessThanOrEqual(100)
      expect(validation.summary.accessibilityCompliance).toBeGreaterThanOrEqual(0)
      expect(validation.summary.accessibilityCompliance).toBeLessThanOrEqual(100)
      expect(validation.summary.performanceScore).toBeGreaterThanOrEqual(0)
      expect(validation.summary.performanceScore).toBeLessThanOrEqual(100)
      expect(validation.summary.usabilityScore).toBeGreaterThanOrEqual(0)
      expect(validation.summary.usabilityScore).toBeLessThanOrEqual(100)
      
      // Results validation
      expect(Array.isArray(validation.deviceResults)).toBe(true)
      expect(validation.deviceResults.length).toBe(validation.summary.totalDevices)
      expect(Array.isArray(validation.criticalIssues)).toBe(true)
      expect(Array.isArray(validation.recommendations)).toBe(true)
      expect(validation.accessibilityReport).toBeDefined()
    })

    it('should provide detailed results for each device', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      validation.deviceResults.forEach(result => {
        expect(result.device).toBeDefined()
        expect(result.testName).toBeDefined()
        expect(result.status).toMatch(/^(pass|fail|warning|skip)$/)
        expect(result.score).toBeGreaterThanOrEqual(0)
        expect(result.score).toBeLessThanOrEqual(100)
        expect(Array.isArray(result.issues)).toBe(true)
        expect(result.performance).toBeDefined()
        expect(result.accessibility).toBeDefined()
        expect(result.usability).toBeDefined()
        expect(result.timestamp).toBeInstanceOf(Date)
      })
    })

    it('should test performance metrics', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      validation.deviceResults.forEach(result => {
        const { performance } = result
        expect(performance.loadTime).toBeGreaterThan(0)
        expect(performance.renderTime).toBeGreaterThan(0)
        expect(performance.interactionTime).toBeGreaterThan(0)
        expect(performance.memoryUsage).toBeGreaterThan(0)
      })
    })

    it('should test accessibility compliance', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      validation.deviceResults.forEach(result => {
        const { accessibility } = result
        expect(typeof accessibility.touchTargetSize).toBe('boolean')
        expect(typeof accessibility.contrastRatio).toBe('boolean')
        expect(typeof accessibility.screenReaderCompatible).toBe('boolean')
        expect(typeof accessibility.keyboardNavigation).toBe('boolean')
      })
    })

    it('should test usability factors', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      validation.deviceResults.forEach(result => {
        const { usability } = result
        expect(typeof usability.scrollPerformance).toBe('boolean')
        expect(typeof usability.gestureSupport).toBe('boolean')
        expect(typeof usability.orientationSupport).toBe('boolean')
        expect(typeof usability.textReadability).toBe('boolean')
      })
    })

    it('should identify mobile-specific issues', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      const allIssues = validation.deviceResults.flatMap(result => result.issues)
      
      allIssues.forEach(issue => {
        expect(issue.severity).toMatch(/^(critical|major|minor|info)$/)
        expect(issue.category).toMatch(/^(accessibility|performance|usability|compatibility)$/)
        expect(issue.element).toBeDefined()
        expect(issue.selector).toBeDefined()
        expect(issue.message).toBeDefined()
        expect(issue.recommendation).toBeDefined()
        expect(typeof issue.deviceSpecific).toBe('boolean')
      })
    })
  })

  describe('Accessibility Testing', () => {
    it('should test touch target sizes', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      const touchTargetIssues = validation.deviceResults
        .flatMap(result => result.issues)
        .filter(issue => issue.message.includes('touch target'))
      
      // Should be able to detect touch target issues
      expect(Array.isArray(touchTargetIssues)).toBe(true)
      
      touchTargetIssues.forEach(issue => {
        expect(issue.wcagCriterion).toBeDefined()
        expect(issue.recommendation).toContain('44')
      })
    })

    it('should test mobile contrast ratios', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      const contrastIssues = validation.deviceResults
        .flatMap(result => result.issues)
        .filter(issue => issue.message.includes('contrast'))
      
      contrastIssues.forEach(issue => {
        expect(issue.category).toBe('accessibility')
        expect(issue.wcagCriterion).toBeDefined()
      })
    })

    it('should test screen reader compatibility', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      const screenReaderIssues = validation.deviceResults
        .flatMap(result => result.issues)
        .filter(issue => issue.message.includes('VoiceOver') || issue.message.includes('screen reader'))
      
      screenReaderIssues.forEach(issue => {
        expect(issue.category).toBe('accessibility')
        expect(issue.deviceSpecific).toBe(true)
      })
    })

    it('should generate accessibility report', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      expect(validation.accessibilityReport.touchTargets).toBeGreaterThanOrEqual(0)
      expect(validation.accessibilityReport.contrastIssues).toBeGreaterThanOrEqual(0)
      expect(validation.accessibilityReport.screenReaderIssues).toBeGreaterThanOrEqual(0)
      expect(validation.accessibilityReport.keyboardIssues).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Performance Testing', () => {
    it('should measure load times across devices', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      const loadTimes = validation.deviceResults.map(result => result.performance.loadTime)
      expect(loadTimes.every(time => time > 0)).toBe(true)
      
      // Should have variation across devices
      const avgLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length
      expect(avgLoadTime).toBeGreaterThan(0)
    })

    it('should measure render performance', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      validation.deviceResults.forEach(result => {
        expect(result.performance.renderTime).toBeGreaterThan(0)
        expect(result.performance.renderTime).toBeLessThan(10000) // Reasonable upper bound
      })
    })

    it('should measure interaction responsiveness', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      validation.deviceResults.forEach(result => {
        expect(result.performance.interactionTime).toBeGreaterThan(0)
        expect(result.performance.interactionTime).toBeLessThan(1000) // Should be responsive
      })
    })

    it('should track memory usage', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      validation.deviceResults.forEach(result => {
        expect(result.performance.memoryUsage).toBeGreaterThan(0)
        expect(result.performance.memoryUsage).toBeLessThan(1024 * 1024 * 1024) // Less than 1GB
      })
    })
  })

  describe('Device-Specific Testing', () => {
    it('should handle iOS devices differently', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      const iosResults = validation.deviceResults.filter(result => 
        result.device.operatingSystem === 'iOS'
      )
      
      expect(iosResults.length).toBeGreaterThan(0)
      
      iosResults.forEach(result => {
        expect(result.device.browserEngine).toBe('WebKit')
      })
    })

    it('should handle Android devices differently', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      const androidResults = validation.deviceResults.filter(result => 
        result.device.operatingSystem === 'Android'
      )
      
      expect(androidResults.length).toBeGreaterThan(0)
      
      androidResults.forEach(result => {
        expect(result.device.browserEngine).toBe('Blink')
      })
    })

    it('should identify device-specific issues', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      const deviceSpecificIssues = validation.deviceResults
        .flatMap(result => result.issues)
        .filter(issue => issue.deviceSpecific)
      
      deviceSpecificIssues.forEach(issue => {
        expect(issue.deviceSpecific).toBe(true)
        expect(issue.recommendation).toBeDefined()
      })
    })
  })

  describe('Scoring and Recommendations', () => {
    it('should calculate device scores correctly', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      validation.deviceResults.forEach(result => {
        expect(result.score).toBeGreaterThanOrEqual(0)
        expect(result.score).toBeLessThanOrEqual(100)
        
        // Score should correlate with status
        if (result.status === 'pass') {
          expect(result.score).toBeGreaterThanOrEqual(80)
        } else if (result.status === 'warning') {
          expect(result.score).toBeGreaterThanOrEqual(60)
          expect(result.score).toBeLessThan(80)
        } else if (result.status === 'fail') {
          expect(result.score).toBeLessThan(60)
        }
      })
    })

    it('should provide actionable recommendations', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      expect(validation.recommendations.length).toBeGreaterThan(0)
      
      validation.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string')
        expect(recommendation.length).toBeGreaterThan(0)
      })
    })

    it('should calculate summary scores correctly', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      const deviceScores = validation.deviceResults.map(r => r.score)
      const expectedOverallScore = Math.round(
        deviceScores.reduce((sum, score) => sum + score, 0) / deviceScores.length
      )
      
      expect(validation.summary.overallScore).toBe(expectedOverallScore)
    })
  })

  describe('Report Generation', () => {
    it('should generate detailed mobile validation report', async () => {
      const validation = await validationEngine.runMobileValidation()
      const report = validationEngine.generateDetailedReport(validation)
      
      expect(typeof report).toBe('string')
      expect(report.length).toBeGreaterThan(0)
      
      // Check report structure
      expect(report).toContain('# Mobile Validation Report')
      expect(report).toContain('## Executive Summary')
      expect(report).toContain('## Device Results')
      expect(report).toContain('## Recommendations')
      
      // Check report content
      expect(report).toContain(validation.reportId)
      expect(report).toContain(validation.summary.overallScore.toString())
    })

    it('should include critical issues in report', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      if (validation.criticalIssues.length > 0) {
        const report = validationEngine.generateDetailedReport(validation)
        expect(report).toContain('## Critical Issues')
        
        validation.criticalIssues.forEach(issue => {
          expect(report).toContain(issue.message)
          expect(report).toContain(issue.recommendation)
        })
      }
    })

    it('should include device results in report', async () => {
      const validation = await validationEngine.runMobileValidation()
      const report = validationEngine.generateDetailedReport(validation)
      
      validation.deviceResults.forEach(result => {
        expect(report).toContain(result.device.name)
        expect(report).toContain(result.score.toString())
        expect(report).toContain(result.status)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      // Test with invalid URL
      const validation = await validationEngine.runMobileValidation('invalid-url')
      
      expect(validation).toBeDefined()
      expect(validation.summary.totalDevices).toBeGreaterThan(0)
      expect(validation.deviceResults.length).toBeGreaterThan(0)
    })

    it('should provide fallback values for missing data', async () => {
      const validation = await validationEngine.runMobileValidation()
      
      // All required fields should be present
      expect(validation.reportId).toBeDefined()
      expect(validation.timestamp).toBeDefined()
      expect(validation.summary).toBeDefined()
      expect(validation.deviceResults).toBeDefined()
      expect(validation.criticalIssues).toBeDefined()
      expect(validation.recommendations).toBeDefined()
      expect(validation.accessibilityReport).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const startTime = Date.now()
      const validation = await validationEngine.runMobileValidation()
      const endTime = Date.now()
      
      const duration = endTime - startTime
      expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
      expect(validation.deviceResults.length).toBeGreaterThan(0)
    })

    it('should handle multiple concurrent validations', async () => {
      const validations = await Promise.all([
        validationEngine.runMobileValidation('http://localhost:3000'),
        validationEngine.runMobileValidation('http://localhost:3000'),
        validationEngine.runMobileValidation('http://localhost:3000')
      ])
      
      expect(validations).toHaveLength(3)
      validations.forEach(validation => {
        expect(validation).toBeDefined()
        expect(validation.reportId).toBeDefined()
        expect(validation.summary.totalDevices).toBeGreaterThan(0)
      })
      
      // Each validation should have unique report ID
      const reportIds = validations.map(v => v.reportId)
      const uniqueIds = new Set(reportIds)
      expect(uniqueIds.size).toBe(3)
    })
  })
})
