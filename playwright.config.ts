import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Sequential for faster execution
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries for speed
  workers: 1, // Single worker for speed
  reporter: 'list',
  timeout: 10000, // 10 second timeout
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off', // No tracing for speed
    screenshot: 'only-on-failure',
    video: 'off', // No video for speed
    actionTimeout: 5000, // Fast action timeout
    navigationTimeout: 8000, // Fast navigation timeout
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
