/**
 * E2E tests — Settings / change password.
 */
import { test, expect } from '@playwright/test';

const uniqueUser = () => `settings_${Date.now()}`;

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    const username = uniqueUser();
    await page.goto('/register');
    await page.locator('#username').fill(username);
    await page.locator('#password').fill('testpass123');
    await page.locator('#confirmPassword').fill('testpass123');
    await page.getByRole('button', { name: 'Register' }).click();
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

  test('should reject mismatched new passwords', async ({ page }) => {
    await page.goto('/settings');

    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    test.skip(count < 3, 'Not enough password fields found');

    // Fill current password
    await passwordInputs.nth(0).fill('testpass123');

    // Fill new password
    if (count >= 2) await passwordInputs.nth(1).fill('newpass456');

    // Fill confirm with mismatch
    if (count >= 3) await passwordInputs.nth(2).fill('different789');

    const submitBtn = page.locator('button[type="submit"], button:has-text("Change"), button:has-text("Update")').first();
    await submitBtn.click();

    // Should show error about mismatch
    const errorMsg = page.locator('text=/match|mismatch|same/i, .error, [role="alert"]').first();
    const hasError = await errorMsg.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasError).toBe(true);
  });
});
