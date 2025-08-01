import { test, expect, Page } from '@playwright/test';

// Test credentials
const TEST_ACCOUNTS = {
  primary: {
    email: 'dev-test@artificialmonks.com',
    password: 'DevTest2025!'
  },
  secondary: {
    email: 'joey@communitee.ai',
    password: 'G3rmonprez'
  }
};

// Helper functions for common authentication actions
class AuthHelpers {
  constructor(private page: Page) {}

  async navigateToSignup() {
    await this.page.goto('/signup');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToLogin() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToDashboard() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async fillSignupForm(email: string, password: string) {
    await this.page.fill('input[type="email"]', email);

    // Handle multiple password fields correctly
    const passwordFields = this.page.locator('input[type="password"]');
    const passwordFieldCount = await passwordFields.count();

    if (passwordFieldCount >= 2) {
      // Fill first password field (Password)
      await passwordFields.first().fill(password);
      // Fill second password field (Confirm Password)
      await passwordFields.last().fill(password);
    } else {
      // Single password field
      await passwordFields.fill(password);
    }
  }

  async fillLoginForm(email: string, password: string) {
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
  }

  async submitForm() {
    // Look for submit button with various possible texts
    const submitButton = this.page.locator('button[type="submit"], button:has-text("Sign up"), button:has-text("Sign in"), button:has-text("Login"), button:has-text("Create account")');
    await submitButton.click();
  }

  async logout() {
    // Look for logout button/link
    const logoutButton = this.page.locator('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout"), a:has-text("Sign out")');
    await logoutButton.click();
  }

  async waitForRedirect(expectedPath: string, timeout = 10000) {
    await this.page.waitForURL(`**${expectedPath}`, { timeout });
  }

  async takeScreenshotOnFailure(testName: string) {
    await this.page.screenshot({ 
      path: `test-results/failure-${testName}-${Date.now()}.png`,
      fullPage: true 
    });
  }
}

test.describe('Communitee Control Hub - Authentication E2E Tests', () => {
  let authHelpers: AuthHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
  });

  test.describe('1. Account Creation Testing', () => {
    test('should successfully create account with primary test credentials', async ({ page }) => {
      try {
        await authHelpers.navigateToSignup();
        
        // Verify signup page loads correctly
        await expect(page).toHaveTitle(/sign up|create account/i);
        await expect(page.locator('h1, h2')).toContainText(/sign up|create account/i);

        // Fill and submit signup form
        await authHelpers.fillSignupForm(TEST_ACCOUNTS.primary.email, TEST_ACCOUNTS.primary.password);
        await authHelpers.submitForm();

        // Handle potential email confirmation or direct login
        await page.waitForTimeout(2000); // Wait for form submission
        
        // Check if redirected to dashboard or confirmation page
        const currentUrl = page.url();
        if (currentUrl.includes('/dashboard')) {
          await expect(page).toHaveURL(/.*\/dashboard/);
        } else if (currentUrl.includes('/login')) {
          // If redirected to login, account was created successfully
          await expect(page.locator('text=account created|check your email|sign in')).toBeVisible();
        }
      } catch (error) {
        await authHelpers.takeScreenshotOnFailure('signup-primary');
        throw error;
      }
    });

    test('should validate signup form fields', async ({ page }) => {
      try {
        await authHelpers.navigateToSignup();

        // Test email validation
        await page.fill('input[type="email"]', 'invalid-email');
        await authHelpers.submitForm();
        await expect(page.locator('text=valid email|invalid email')).toBeVisible();

        // Test password minimum length
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', '123');
        await authHelpers.submitForm();
        await expect(page.locator('text=password|6 characters|too short')).toBeVisible();

        // Test password confirmation mismatch (if field exists)
        const confirmPasswordField = page.locator('input[placeholder*="confirm" i], input[name*="confirm" i]');
        if (await confirmPasswordField.count() > 0) {
          await page.fill('input[type="password"]', 'ValidPassword123!');
          await confirmPasswordField.fill('DifferentPassword123!');
          await authHelpers.submitForm();
          await expect(page.locator('text=passwords match|passwords must match')).toBeVisible();
        }
      } catch (error) {
        await authHelpers.takeScreenshotOnFailure('signup-validation');
        throw error;
      }
    });

    test('should create account with secondary test credentials', async ({ page }) => {
      try {
        await authHelpers.navigateToSignup();
        await authHelpers.fillSignupForm(TEST_ACCOUNTS.secondary.email, TEST_ACCOUNTS.secondary.password);
        await authHelpers.submitForm();

        await page.waitForTimeout(2000);
        
        // Verify account creation success
        const currentUrl = page.url();
        expect(currentUrl.includes('/dashboard') || currentUrl.includes('/login')).toBeTruthy();
      } catch (error) {
        await authHelpers.takeScreenshotOnFailure('signup-secondary');
        throw error;
      }
    });
  });

  test.describe('2. Login Flow Testing', () => {
    test('should successfully login with primary test credentials', async ({ page }) => {
      try {
        await authHelpers.navigateToLogin();
        
        // Verify login page loads correctly
        await expect(page).toHaveTitle(/sign in|login/i);
        await expect(page.locator('h1, h2')).toContainText(/sign in|login/i);

        // Fill and submit login form
        await authHelpers.fillLoginForm(TEST_ACCOUNTS.primary.email, TEST_ACCOUNTS.primary.password);
        await authHelpers.submitForm();

        // Verify successful login redirects to dashboard
        await authHelpers.waitForRedirect('/dashboard');
        await expect(page).toHaveURL(/.*\/dashboard/);
        
        // Verify dashboard content is visible
        await expect(page.locator('h1, h2, [data-testid="dashboard"]')).toBeVisible();
      } catch (error) {
        await authHelpers.takeScreenshotOnFailure('login-primary');
        throw error;
      }
    });

    test('should successfully login with secondary test credentials', async ({ page }) => {
      try {
        await authHelpers.navigateToLogin();
        await authHelpers.fillLoginForm(TEST_ACCOUNTS.secondary.email, TEST_ACCOUNTS.secondary.password);
        await authHelpers.submitForm();

        await authHelpers.waitForRedirect('/dashboard');
        await expect(page).toHaveURL(/.*\/dashboard/);
      } catch (error) {
        await authHelpers.takeScreenshotOnFailure('login-secondary');
        throw error;
      }
    });

    test('should show error for invalid credentials', async ({ page }) => {
      try {
        await authHelpers.navigateToLogin();
        
        // Test with wrong password
        await authHelpers.fillLoginForm(TEST_ACCOUNTS.primary.email, 'WrongPassword123!');
        await authHelpers.submitForm();
        
        await page.waitForTimeout(2000);
        await expect(page.locator('text=invalid|incorrect|wrong|error')).toBeVisible();

        // Test with non-existent email
        await authHelpers.fillLoginForm('nonexistent@example.com', 'AnyPassword123!');
        await authHelpers.submitForm();
        
        await page.waitForTimeout(2000);
        await expect(page.locator('text=invalid|incorrect|not found|error')).toBeVisible();
      } catch (error) {
        await authHelpers.takeScreenshotOnFailure('login-invalid');
        throw error;
      }
    });
  });

  test.describe('3. Protected Route Access Testing', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      try {
        // Try to access dashboard without authentication
        await authHelpers.navigateToDashboard();
        
        // Should be redirected to login
        await authHelpers.waitForRedirect('/login');
        await expect(page).toHaveURL(/.*\/login/);
        
        // Verify login page is displayed
        await expect(page.locator('h1, h2')).toContainText(/sign in|login/i);
      } catch (error) {
        await authHelpers.takeScreenshotOnFailure('protected-route-redirect');
        throw error;
      }
    });

    test('should allow authenticated users to access dashboard', async ({ page }) => {
      try {
        // First login
        await authHelpers.navigateToLogin();
        await authHelpers.fillLoginForm(TEST_ACCOUNTS.primary.email, TEST_ACCOUNTS.primary.password);
        await authHelpers.submitForm();
        await authHelpers.waitForRedirect('/dashboard');

        // Now try to access dashboard directly
        await authHelpers.navigateToDashboard();
        await expect(page).toHaveURL(/.*\/dashboard/);
        
        // Verify dashboard content is accessible
        await expect(page.locator('h1, h2, [data-testid="dashboard"]')).toBeVisible();
      } catch (error) {
        await authHelpers.takeScreenshotOnFailure('authenticated-dashboard-access');
        throw error;
      }
    });
  });

  test.describe('4. Logout Functionality Testing', () => {
    test('should successfully logout and redirect to login', async ({ page }) => {
      try {
        // First login
        await authHelpers.navigateToLogin();
        await authHelpers.fillLoginForm(TEST_ACCOUNTS.primary.email, TEST_ACCOUNTS.primary.password);
        await authHelpers.submitForm();
        await authHelpers.waitForRedirect('/dashboard');

        // Logout
        await authHelpers.logout();
        
        // Verify redirect to login page
        await authHelpers.waitForRedirect('/login');
        await expect(page).toHaveURL(/.*\/login/);

        // Verify that accessing dashboard now redirects to login
        await authHelpers.navigateToDashboard();
        await authHelpers.waitForRedirect('/login');
        await expect(page).toHaveURL(/.*\/login/);
      } catch (error) {
        await authHelpers.takeScreenshotOnFailure('logout-functionality');
        throw error;
      }
    });

    test('should clear session after logout', async ({ page }) => {
      try {
        // Login
        await authHelpers.navigateToLogin();
        await authHelpers.fillLoginForm(TEST_ACCOUNTS.primary.email, TEST_ACCOUNTS.primary.password);
        await authHelpers.submitForm();
        await authHelpers.waitForRedirect('/dashboard');

        // Logout
        await authHelpers.logout();
        await authHelpers.waitForRedirect('/login');

        // Verify session is cleared by checking if dashboard access is blocked
        await authHelpers.navigateToDashboard();
        await expect(page).toHaveURL(/.*\/login/);
        
        // Verify no authentication state persists
        await expect(page.locator('text=dashboard|welcome back')).not.toBeVisible();
      } catch (error) {
        await authHelpers.takeScreenshotOnFailure('session-clearing');
        throw error;
      }
    });
  });
});
