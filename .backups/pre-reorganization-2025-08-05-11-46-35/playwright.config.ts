import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Sequential for faster execution
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // Retries in CI for stability
  workers: process.env.CI ? 2 : 1, // More workers in CI
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  timeout: 30000, // Increased timeout for performance tests
  use: {
    baseURL: 'http://localhost:3000',
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    actionTimeout: 10000, // Increased for performance tests
    navigationTimeout: 15000, // Increased for performance tests
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        }
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});
