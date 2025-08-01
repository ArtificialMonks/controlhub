/**
 * Lighthouse CI Configuration - Quest 4.4
 * Implements expert council performance monitoring requirements
 * Comprehensive performance testing and Core Web Vitals validation
 */

module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/automations',
        'http://localhost:3000/dashboard'
      ],
      startServerCommand: 'npm start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 60000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        }
      }
    },
    assert: {
      assertions: {
        // Expert council performance requirements
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Core Web Vitals (expert council requirements)
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // < 2.5s
        'first-input-delay': ['error', { maxNumericValue: 100 }],         // < 100ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],   // < 0.1
        'interaction-to-next-paint': ['error', { maxNumericValue: 200 }], // < 200ms
        
        // Performance metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // Security headers (expert council security requirements)
        'csp-xss': 'error',
        'is-on-https': 'error',
        'uses-http2': 'warn',
        
        // Accessibility requirements (expert council WCAG 2.1 AA)
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'button-name': 'error',
        
        // Best practices
        'uses-https': 'error',
        'no-vulnerable-libraries': 'error',
        'charset': 'error'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci.db'
      }
    }
  }
}
