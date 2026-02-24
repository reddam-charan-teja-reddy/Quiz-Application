/**
 * E2E tests — Profile page.
 */
import { test, expect } from '@playwright/test';
import { getSharedUser, loginSharedUser } from './shared-user.js';

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await loginSharedUser(page);
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
  });

  test('should navigate to profile page', async ({ page }) => {
    await page.click('text=Profile');
    await expect(page).toHaveURL(/\/profile/);
  });

  test('should display username on profile page', async ({ page }) => {
    const { username } = getSharedUser();
    await page.goto('/profile');
    await expect(page.locator(`text=${username}`).first()).toBeVisible({ timeout: 10000 });
  });
});
