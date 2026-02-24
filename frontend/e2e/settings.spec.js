/**
 * E2E tests — Settings / change password.
 */
import { test, expect } from '@playwright/test';
import { loginSharedUser } from './shared-user.js';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginSharedUser(page);
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/settings');
    const heading = page.locator('h1, h2, .page-title').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('should have change password form', async ({ page }) => {
    await page.goto('/settings');
    const passwordField = page.locator('input[type="password"]').first();
    await expect(passwordField).toBeVisible({ timeout: 5000 });
  });
});
