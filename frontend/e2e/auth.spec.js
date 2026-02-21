/**
 * E2E tests — Authentication flows.
 * Covers: registration, login, logout, session persistence.
 */
import { test, expect } from '@playwright/test';

const uniqueUser = () => `testuser_${Date.now()}`;

test.describe('Authentication', () => {
  test('should navigate to login page by default', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should register a new user and redirect to home', async ({ page }) => {
    const username = uniqueUser();
    await page.goto('/register');
    await page.locator('#username').fill(username);
    await page.locator('#password').fill('testpass123');
    await page.locator('#confirmPassword').fill('testpass123');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
  });

  test('should login with existing credentials', async ({ page }) => {
    const username = uniqueUser();
    // Register first
    await page.goto('/register');
    await page.locator('#username').fill(username);
    await page.locator('#password').fill('testpass123');
    await page.locator('#confirmPassword').fill('testpass123');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });

    // Logout
    await page.click('text=Logout');
    await expect(page).toHaveURL(/\/login/);

    // Login again
    await page.locator('#username').fill(username);
    await page.locator('#password').fill('testpass123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#username').fill('nonexistentuser');
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.locator('[role="alert"], .error-message, .login-error')).toBeVisible({ timeout: 5000 });
  });

  test('should show error for duplicate registration', async ({ page }) => {
    const username = uniqueUser();
    // Register first
    await page.goto('/register');
    await page.locator('#username').fill(username);
    await page.locator('#password').fill('testpass123');
    await page.locator('#confirmPassword').fill('testpass123');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });

    // Logout and try to register same username
    await page.click('text=Logout');
    await page.goto('/register');
    await page.locator('#username').fill(username);
    await page.locator('#password').fill('testpass123');
    await page.locator('#confirmPassword').fill('testpass123');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.locator('[role="alert"], .error-message, .register-error')).toBeVisible({ timeout: 5000 });
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
  });
});
