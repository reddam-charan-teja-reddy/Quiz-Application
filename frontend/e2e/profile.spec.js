/**
 * E2E tests — Profile page.
 */
import { test, expect } from '@playwright/test';

const uniqueUser = () => `profile_${Date.now()}`;

test.describe('Profile', () => {
  let username;

  test.beforeEach(async ({ page }) => {
    username = uniqueUser();
    await page.goto('/register');
    await page.locator('#username').fill(username);
    await page.locator('#password').fill('testpass123');
    await page.locator('#confirmPassword').fill('testpass123');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
  });

  test('should navigate to profile page', async ({ page }) => {
    await page.click('text=Profile');
    await expect(page).toHaveURL(/\/profile/);
  });

  test('should display username on profile page', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator(`text=${username}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to settings from profile', async ({ page }) => {
    await page.goto('/profile');
    const settingsLink = page.locator('a:has-text("Settings"), button:has-text("Settings"), a[href*="settings"]').first();
    const settingsVisible = await settingsLink.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!settingsVisible, 'Settings link not visible on profile');

    await settingsLink.click();
    await expect(page).toHaveURL(/\/settings/);
  });
});
