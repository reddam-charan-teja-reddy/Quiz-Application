/**
 * E2E tests — History page.
 */
import { test, expect } from '@playwright/test';

const uniqueUser = () => `history_${Date.now()}`;

test.describe('History', () => {
  test.beforeEach(async ({ page }) => {
    const username = uniqueUser();
    await page.goto('/register');
    await page.locator('#username').fill(username);
    await page.locator('#password').fill('testpass123');
    await page.locator('#confirmPassword').fill('testpass123');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
  });

  test('should navigate to history page', async ({ page }) => {
    await page.click('text=History');
    await expect(page).toHaveURL(/\/history/);
    await expect(page.locator('h1, h2, .page-title').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show empty state for new user', async ({ page }) => {
    await page.goto('/history');
    const emptyState = page.locator('.empty-state-component, .no-attempts, text="No attempts"');
    await expect(emptyState.first()).toBeVisible({ timeout: 10000 });
  });
});
