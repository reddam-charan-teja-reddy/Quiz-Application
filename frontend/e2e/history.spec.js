/**
 * E2E tests — History page.
 */
import { test, expect } from '@playwright/test';
import { loginSharedUser } from './shared-user.js';

test.describe('History', () => {
  test.beforeEach(async ({ page }) => {
    await loginSharedUser(page);
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
  });

  test('should navigate to history page', async ({ page }) => {
    await page.click('text=History');
    await expect(page).toHaveURL(/\/history/);
    await expect(page.locator('h1, h2, .page-title').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show empty state for new user', async ({ page }) => {
    await page.goto('/history');
    const emptyState = page.locator('.empty-state-component, .no-attempts').first();
    const noAttemptsText = page.getByText(/No attempts/i).first();
    await expect(emptyState.or(noAttemptsText)).toBeVisible({ timeout: 10000 });
  });
});
