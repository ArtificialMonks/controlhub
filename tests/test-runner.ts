#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Communitee Control Hub
 * Executes all E2E tests and generates detailed reports
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface TestResult {
  testName: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  duration: number;
  error?: string;
  screenshot?: string;
}

interface TestSuite {
  suiteName: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
}

class TestRunner {
  private results: TestSuite[] = [];
  private startTime: number = Date.now();

  constructor() {
    // Ensure test results directory exists
    if (!existsSync('test-results')) {
      mkdirSync('test-results', { recursive: true });
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Comprehensive E2E Test Suite for Communitee Control Hub');
    console.log('=' .repeat(80));
    
    // Run authentication tests
    await this.runTestSuite('Authentication E2E Tests', 'tests/auth-e2e.spec.ts');
    
    // Run UI compliance tests
    await this.runTestSuite('UI/UX Compliance Tests', 'tests/ui-compliance.spec.ts');
    
    // Generate comprehensive report
    this.generateReport();
    
    console.log('🎉 Test execution completed!');
    console.log(`📊 View detailed report: test-results/test-report-${Date.now()}.html`);
  }

  private async runTestSuite(suiteName: string, testFile: string): Promise<void> {
    console.log(`\n🔍 Running ${suiteName}...`);
    console.log('-'.repeat(50));
    
    const suiteStartTime = Date.now();
    const suite: TestSuite = {
      suiteName,
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      totalDuration: 0
    };

    try {
      // Run Playwright tests with detailed output
      const command = `npx playwright test ${testFile} --reporter=json`;
      const output = execSync(command, { 
        encoding: 'utf-8',
        timeout: 300000, // 5 minutes timeout
        stdio: 'pipe'
      });

      // Parse JSON output
      const testResults = JSON.parse(output);
      
      // Process test results
      if (testResults.suites) {
        for (const suite_data of testResults.suites) {
          for (const spec of suite_data.specs) {
            for (const test of spec.tests) {
              const result: TestResult = {
                testName: test.title,
                status: test.outcome === 'expected' ? 'PASSED' : 
                       test.outcome === 'skipped' ? 'SKIPPED' : 'FAILED',
                duration: test.results[0]?.duration || 0,
                error: test.results[0]?.error?.message
              };
              
              suite.results.push(result);
              suite.totalTests++;
              
              if (result.status === 'PASSED') suite.passedTests++;
              else if (result.status === 'FAILED') suite.failedTests++;
              else suite.skippedTests++;
              
              // Log individual test result
              const statusIcon = result.status === 'PASSED' ? '✅' : 
                               result.status === 'FAILED' ? '❌' : '⏭️';
              console.log(`  ${statusIcon} ${result.testName} (${result.duration}ms)`);
              
              if (result.error) {
                console.log(`     Error: ${result.error}`);
              }
            }
          }
        }
      }
      
    } catch (error: any) {
      console.log(`❌ Test suite failed: ${error.message}`);
      
      // Add failed suite result
      suite.results.push({
        testName: 'Suite Execution',
        status: 'FAILED',
        duration: 0,
        error: error.message
      });
      suite.totalTests = 1;
      suite.failedTests = 1;
    }

    suite.totalDuration = Date.now() - suiteStartTime;
    this.results.push(suite);
    
    // Print suite summary
    console.log(`\n📊 ${suiteName} Summary:`);
    console.log(`   Total: ${suite.totalTests} | Passed: ${suite.passedTests} | Failed: ${suite.failedTests} | Skipped: ${suite.skippedTests}`);
    console.log(`   Duration: ${suite.totalDuration}ms`);
  }

  private generateReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const totalTests = this.results.reduce((sum, suite) => sum + suite.totalTests, 0);
    const totalPassed = this.results.reduce((sum, suite) => sum + suite.passedTests, 0);
    const totalFailed = this.results.reduce((sum, suite) => sum + suite.failedTests, 0);
    const totalSkipped = this.results.reduce((sum, suite) => sum + suite.skippedTests, 0);
    
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0';
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(totalTests, totalPassed, totalFailed, totalSkipped, successRate, totalDuration);
    const reportPath = join('test-results', `test-report-${Date.now()}.html`);
    writeFileSync(reportPath, htmlReport);
    
    // Generate JSON report for programmatic access
    const jsonReport = {
      timestamp: new Date().toISOString(),
      totalDuration,
      summary: {
        totalTests,
        totalPassed,
        totalFailed,
        totalSkipped,
        successRate: parseFloat(successRate)
      },
      suites: this.results
    };
    
    const jsonReportPath = join('test-results', `test-report-${Date.now()}.json`);
    writeFileSync(jsonReportPath, JSON.stringify(jsonReport, null, 2));
    
    // Print final summary
    console.log('\n' + '='.repeat(80));
    console.log('🎯 FINAL TEST EXECUTION SUMMARY');
    console.log('='.repeat(80));
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`⏭️ Skipped: ${totalSkipped}`);
    console.log(`🎯 Success Rate: ${successRate}%`);
    console.log(`⏱️ Total Duration: ${totalDuration}ms`);
    console.log('='.repeat(80));
    
    if (totalFailed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.forEach(suite => {
        suite.results.forEach(result => {
          if (result.status === 'FAILED') {
            console.log(`   • ${suite.suiteName}: ${result.testName}`);
            if (result.error) {
              console.log(`     Error: ${result.error}`);
            }
          }
        });
      });
    }
    
    console.log(`\n📄 Reports generated:`);
    console.log(`   HTML: ${reportPath}`);
    console.log(`   JSON: ${jsonReportPath}`);
  }

  private generateHTMLReport(totalTests: number, totalPassed: number, totalFailed: number, _totalSkipped: number, successRate: string, _totalDuration: number): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Communitee Control Hub - E2E Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #003cff, #0066ff); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .metric { text-align: center; padding: 20px; border-radius: 8px; }
        .metric.passed { background: #f0f9ff; border: 2px solid #22c55e; }
        .metric.failed { background: #fef2f2; border: 2px solid #ef4444; }
        .metric.total { background: #f8fafc; border: 2px solid #64748b; }
        .metric h3 { margin: 0; font-size: 2em; }
        .metric p { margin: 5px 0 0 0; color: #64748b; }
        .suites { padding: 0 30px 30px 30px; }
        .suite { margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
        .suite-header { background: #f8fafc; padding: 20px; border-bottom: 1px solid #e2e8f0; }
        .suite-header h2 { margin: 0; color: #1e293b; }
        .test-results { padding: 20px; }
        .test-result { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
        .test-result:last-child { border-bottom: none; }
        .test-name { flex: 1; }
        .test-status { padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; }
        .test-status.passed { background: #dcfce7; color: #166534; }
        .test-status.failed { background: #fee2e2; color: #991b1b; }
        .test-status.skipped { background: #f1f5f9; color: #64748b; }
        .test-duration { color: #64748b; font-size: 0.9em; margin-left: 10px; }
        .error { color: #ef4444; font-size: 0.9em; margin-top: 5px; font-style: italic; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 E2E Test Report</h1>
            <p>Communitee Control Hub - Authentication & UI Compliance Tests</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="metric total">
                <h3>${totalTests}</h3>
                <p>Total Tests</p>
            </div>
            <div class="metric passed">
                <h3>${totalPassed}</h3>
                <p>Passed</p>
            </div>
            <div class="metric failed">
                <h3>${totalFailed}</h3>
                <p>Failed</p>
            </div>
            <div class="metric total">
                <h3>${successRate}%</h3>
                <p>Success Rate</p>
            </div>
        </div>
        
        <div class="suites">
            ${this.results.map(suite => `
                <div class="suite">
                    <div class="suite-header">
                        <h2>${suite.suiteName}</h2>
                        <p>Tests: ${suite.totalTests} | Passed: ${suite.passedTests} | Failed: ${suite.failedTests} | Duration: ${suite.totalDuration}ms</p>
                    </div>
                    <div class="test-results">
                        ${suite.results.map(result => `
                            <div class="test-result">
                                <div class="test-name">
                                    ${result.testName}
                                    ${result.error ? `<div class="error">Error: ${result.error}</div>` : ''}
                                </div>
                                <div>
                                    <span class="test-status ${result.status.toLowerCase()}">${result.status}</span>
                                    <span class="test-duration">${result.duration}ms</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(console.error);
}

export default TestRunner;
