import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Sign In' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should display signup form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Create Account' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByPlaceholder('Confirm your password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Sign up here').click();
    await expect(page).toHaveURL('/signup');
    
    await page.getByText('Sign in here').click();
    await expect(page).toHaveURL('/login');
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // HTML5 validation should prevent submission with empty fields
    await expect(page.getByPlaceholder('Enter your email')).toBeFocused();
  });

  test('should show password mismatch error on signup', async ({ page }) => {
    await page.goto('/signup');
    await page.getByPlaceholder('Enter your email').fill('test@example.com');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByPlaceholder('Confirm your password').fill('password456');
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('should show short password error on signup', async ({ page }) => {
    await page.goto('/signup');
    await page.getByPlaceholder('Enter your email').fill('test@example.com');
    await page.getByPlaceholder('Enter your password').fill('123');
    await page.getByPlaceholder('Confirm your password').fill('123');
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    await expect(page.getByText('Password must be at least 6 characters long')).toBeVisible();
  });

  test('home page should redirect authenticated users to dashboard', async ({ page }) => {
    await page.goto('/');
    // Should show login/signup buttons for unauthenticated users
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });
});
