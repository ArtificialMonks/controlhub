#!/usr/bin/env node

/**
 * A.V.A.R.I.C.E. Protocol Phase-Specific Test Runner
 * 
 * This script runs tests specifically for the current A.V.A.R.I.C.E. Protocol phase
 * and excludes all backup files and folders from testing.
 * 
 * Usage:
 * - npm run test:avarice (runs all A.V.A.R.I.C.E. Protocol tests)
 * - npm run test:avarice -- --phase=4 (runs Phase 4 specific tests)
 * - npm run test:avarice -- --quest=4.3 (runs Quest 4.3 specific tests)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const phaseArg = args.find(arg => arg.startsWith('--phase='));
const questArg = args.find(arg => arg.startsWith('--quest='));
const verboseArg = args.includes('--verbose');

const phase = phaseArg ? phaseArg.split('=')[1] : null;
const quest = questArg ? questArg.split('=')[1] : null;

console.log('🚀 A.V.A.R.I.C.E. Protocol Test Runner');
console.log('=====================================');

// Define test patterns based on phase/quest
let testPatterns = [];

if (quest) {
  console.log(`🎯 Running tests for Quest ${quest}`);
  testPatterns = [
    `**/quest-${quest}*.test.ts`,
    `**/quest-${quest}*.test.js`,
    `**/*quest${quest.replace('.', '')}*.test.ts`,
    `**/*quest${quest.replace('.', '')}*.test.js`
  ];
} else if (phase) {
  console.log(`🎯 Running tests for Phase ${phase}`);
  testPatterns = [
    `**/phase-${phase}*.test.ts`,
    `**/phase-${phase}*.test.js`,
    `**/*phase${phase}*.test.ts`,
    `**/*phase${phase}*.test.js`
  ];
} else {
  console.log('🎯 Running all A.V.A.R.I.C.E. Protocol tests');
  // Run all tests but let vitest config handle backup exclusion
  testPatterns = [];
}

// Build the test command with AGGRESSIVE backup exclusion
let testCommand;
if (testPatterns.length > 0) {
  // Use specific patterns
  testCommand = `npm run test:run -- ${testPatterns.join(' ')} ${verboseArg ? '--verbose' : ''}`;
} else {
  // CRITICAL: Use find command to get only legitimate test files, excluding ALL backup directories
  const findCommand = `find src avarice-protocol tests -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" | grep -v ".backups" | grep -v "backup-" | grep -v "/backups/" | tr '\\n' ' '`;
  testCommand = `npm run test:run -- $(${findCommand}) ${verboseArg ? '--verbose' : ''}`;
}

console.log(`📋 Test Command: ${testCommand}`);
console.log('');

try {
  // Run the tests
  execSync(testCommand, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('');
  console.log('✅ A.V.A.R.I.C.E. Protocol tests completed successfully!');
  
} catch (error) {
  console.error('');
  console.error('❌ A.V.A.R.I.C.E. Protocol tests failed!');
  console.error('Error:', error.message);
  process.exit(1);
}
