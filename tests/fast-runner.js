#!/usr/bin/env node

/**
 * ULTRA-FAST Test Runner - Optimized for Speed
 * Target: Complete test suite in under 60 seconds
 */

const { execSync } = require('child_process');
const { writeFileSync, mkdirSync, existsSync } = require('fs');

class FastTestRunner {
  constructor() {
    this.startTime = Date.now();
    this.results = [];
    
    // Ensure results directory exists
    if (!existsSync('test-results')) {
      mkdirSync('test-results', { recursive: true });
    }
  }

  async runFastTests() {
    console.log('🚀 ULTRA-FAST E2E Test Suite Starting...');
    console.log('Target: Complete in <60 seconds');
    console.log('=' .repeat(60));
    
    try {
      // Run optimized tests with minimal retries and fast timeouts
      const command = `npx playwright test tests/fast-auth-test.spec.ts --workers=1 --retries=0 --timeout=10000 --reporter=json`;
      
      console.log('⚡ Executing fast authentication tests...');
      const startExec = Date.now();
      
      const output = execSync(command, { 
        encoding: 'utf-8',
        timeout: 60000, // 1 minute max
        stdio: 'pipe'
      });

      const execTime = Date.now() - startExec;
      console.log(`✅ Tests completed in ${execTime}ms`);
      
      // Parse results
      const testResults = JSON.parse(output);
      this.processResults(testResults);
      
    } catch (error) {
      console.log(`❌ Test execution failed: ${error.message}`);
      this.results.push({
        suite: 'Test Execution',
        status: 'FAILED',
        error: error.message,
        duration: Date.now() - this.startTime
      });
    }
    
    this.generateFastReport();
  }

  processResults(testResults) {
    if (testResults.suites) {
      for (const suite of testResults.suites) {
        for (const spec of suite.specs) {
          for (const test of spec.tests) {
            const result = {
              suite: suite.title || 'Unknown Suite',
              testName: test.title,
              status: test.outcome === 'expected' ? 'PASSED' : 
                     test.outcome === 'skipped' ? 'SKIPPED' : 'FAILED',
              duration: test.results[0]?.duration || 0,
              error: test.results[0]?.error?.message
            };
            
            this.results.push(result);
            
            // Quick console output
            const icon = result.status === 'PASSED' ? '✅' : 
                        result.status === 'FAILED' ? '❌' : '⏭️';
            console.log(`${icon} ${result.testName} (${result.duration}ms)`);
          }
        }
      }
    }
  }

  generateFastReport() {
    const totalTime = Date.now() - this.startTime;
    const totalTests = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    const skipped = this.results.filter(r => r.status === 'SKIPPED').length;
    const successRate = totalTests > 0 ? ((passed / totalTests) * 100).toFixed(1) : '0';
    
    // Console summary
    console.log('\n' + '=' .repeat(60));
    console.log('⚡ ULTRA-FAST TEST RESULTS');
    console.log('=' .repeat(60));
    console.log(`📊 Total: ${totalTests} | ✅ Passed: ${passed} | ❌ Failed: ${failed} | ⏭️ Skipped: ${skipped}`);
    console.log(`🎯 Success Rate: ${successRate}%`);
    console.log(`⏱️ Total Time: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);
    
    if (totalTime < 60000) {
      console.log('🏆 TARGET ACHIEVED: Completed in under 60 seconds!');
    } else {
      console.log('⚠️ Target missed: Took longer than 60 seconds');
    }
    
    // Failed tests
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.filter(r => r.status === 'FAILED').forEach(result => {
        console.log(`   • ${result.testName}`);
        if (result.error) {
          console.log(`     Error: ${result.error.substring(0, 100)}...`);
        }
      });
    }
    
    // Generate JSON report
    const report = {
      timestamp: new Date().toISOString(),
      totalTime,
      summary: { totalTests, passed, failed, skipped, successRate: parseFloat(successRate) },
      results: this.results
    };
    
    const reportPath = `test-results/fast-report-${Date.now()}.json`;
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Report saved: ${reportPath}`);
    console.log('=' .repeat(60));
  }
}

// Execute if run directly
if (require.main === module) {
  const runner = new FastTestRunner();
  runner.runFastTests().catch(console.error);
}

module.exports = FastTestRunner;
