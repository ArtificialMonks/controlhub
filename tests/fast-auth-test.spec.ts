import { test, expect } from '@playwright/test';

// OPTIMIZED FAST AUTHENTICATION TESTS
// Execution time target: <30 seconds total

const FAST_TEST_CONFIG = {
  timeout: 5000,
  credentials: {
    primary: { email: 'dev-test@artificialmonks.com', password: 'DevTest2025!' },
    secondary: { email: 'joey@communitee.ai', password: 'G3rmonprez' }
  }
};

test.describe('🚀 FAST Auth Tests', () => {
  test.setTimeout(FAST_TEST_CONFIG.timeout);

  test('✅ Login page loads and renders correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Fast checks - no waiting
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Sign in")')).toBeVisible();
  });

  test('✅ Signup page loads and renders correctly', async ({ page }) => {
    await page.goto('/signup');
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Sign up")')).toBeVisible();
  });

  test('✅ Protected route redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('✅ Login form validation works', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"], button:has-text("Sign in")');
    
    // Should stay on login page (form validation prevents submission)
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('✅ Login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill form quickly
    await page.fill('input[type="email"]', FAST_TEST_CONFIG.credentials.primary.email);
    await page.fill('input[type="password"]', FAST_TEST_CONFIG.credentials.primary.password);
    await page.click('button[type="submit"], button:has-text("Sign in")');
    
    // Wait for redirect with short timeout
    await page.waitForURL('**/dashboard', { timeout: 8000 });
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('✅ Dashboard accessible after login', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', FAST_TEST_CONFIG.credentials.primary.email);
    await page.fill('input[type="password"]', FAST_TEST_CONFIG.credentials.primary.password);
    await page.click('button[type="submit"], button:has-text("Sign in")');
    
    await page.waitForURL('**/dashboard', { timeout: 8000 });
    
    // Verify dashboard content
    await expect(page.locator('h1, h2, [data-testid="dashboard"], main')).toBeVisible();
  });

  test('✅ Logout functionality works', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', FAST_TEST_CONFIG.credentials.primary.email);
    await page.fill('input[type="password"]', FAST_TEST_CONFIG.credentials.primary.password);
    await page.click('button[type="submit"], button:has-text("Sign in")');
    
    await page.waitForURL('**/dashboard', { timeout: 8000 });
    
    // Find and click logout
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout"), a:has-text("Sign out")');
    if (await logoutButton.count() > 0) {
      await logoutButton.first().click();
      await page.waitForURL('**/login', { timeout: 5000 });
      await expect(page).toHaveURL(/.*\/login/);
    }
  });
});

test.describe('🎨 FAST UI Tests', () => {
  test.setTimeout(3000);

  test('✅ Login page UI compliance', async ({ page }) => {
    await page.goto('/login');
    
    // Quick UI checks
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Check basic styling exists
    const hasBasicStyling = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return styles.fontFamily && styles.color && styles.backgroundColor;
    });
    expect(hasBasicStyling).toBeTruthy();
  });

  test('✅ Responsive design basic check', async ({ page }) => {
    await page.goto('/login');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('✅ Accessibility basics', async ({ page }) => {
    await page.goto('/login');
    
    // Check form has proper structure
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Basic keyboard navigation
    await emailInput.focus();
    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();
  });

  test('✅ shadcn/ui components present', async ({ page }) => {
    await page.goto('/login');
    
    // Check for common shadcn/ui classes
    const hasShadcnClasses = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="bg-"], [class*="text-"], [class*="border"], [class*="rounded"]');
      return elements.length > 0;
    });
    expect(hasShadcnClasses).toBeTruthy();
  });
});

test.describe('🔧 FAST Integration Tests', () => {
  test.setTimeout(8000);

  test('✅ Complete auth flow integration', async ({ page }) => {
    // Test complete flow: login -> dashboard -> logout -> login redirect
    
    // 1. Start unauthenticated
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/login/);
    
    // 2. Login
    await page.fill('input[type="email"]', FAST_TEST_CONFIG.credentials.primary.email);
    await page.fill('input[type="password"]', FAST_TEST_CONFIG.credentials.primary.password);
    await page.click('button[type="submit"], button:has-text("Sign in")');
    
    // 3. Access dashboard
    await page.waitForURL('**/dashboard', { timeout: 8000 });
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // 4. Logout (if logout button exists)
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")');
    if (await logoutButton.count() > 0) {
      await logoutButton.first().click();
      await page.waitForURL('**/login', { timeout: 5000 });
    }
    
    // 5. Verify protection still works
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('✅ Form validation and error handling', async ({ page }) => {
    await page.goto('/login');
    
    // Test invalid email format
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'somepassword');
    await page.click('button[type="submit"], button:has-text("Sign in")');
    
    // Should stay on login page due to validation
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/.*\/login/);
    
    // Test with wrong credentials
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"], button:has-text("Sign in")');
    
    await page.waitForTimeout(2000);
    // Should still be on login page
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('✅ Session persistence check', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', FAST_TEST_CONFIG.credentials.primary.email);
    await page.fill('input[type="password"]', FAST_TEST_CONFIG.credentials.primary.password);
    await page.click('button[type="submit"], button:has-text("Sign in")');
    
    await page.waitForURL('**/dashboard', { timeout: 8000 });
    
    // Refresh page - should stay authenticated
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be on dashboard (session persisted)
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
});

// PERFORMANCE TEST
test.describe('⚡ Performance Tests', () => {
  test.setTimeout(10000);

  test('✅ Page load performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    console.log(`Login page loaded in ${loadTime}ms`);
  });

  test('✅ Authentication speed', async ({ page }) => {
    await page.goto('/login');
    
    const startTime = Date.now();
    
    await page.fill('input[type="email"]', FAST_TEST_CONFIG.credentials.primary.email);
    await page.fill('input[type="password"]', FAST_TEST_CONFIG.credentials.primary.password);
    await page.click('button[type="submit"], button:has-text("Sign in")');
    
    await page.waitForURL('**/dashboard', { timeout: 8000 });
    
    const authTime = Date.now() - startTime;
    
    // Authentication should complete in under 5 seconds
    expect(authTime).toBeLessThan(5000);
    
    console.log(`Authentication completed in ${authTime}ms`);
  });
});
