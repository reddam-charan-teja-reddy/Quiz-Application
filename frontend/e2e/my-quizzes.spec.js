/**
 * E2E tests — My Quizzes page.
 */
import { test, expect } from '@playwright/test';
import { loginSharedUser } from './shared-user.js';

test.describe('My Quizzes', () => {
  test.beforeEach(async ({ page }) => {
    await loginSharedUser(page);
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
  });

  test('should navigate to My Quizzes page', async ({ page }) => {
    await page.click('text=My Quizzes');
    await expect(page).toHaveURL(/\/my-quizzes/);
  });

  test('should show empty state for new user with no quizzes', async ({ page }) => {
    await page.goto('/my-quizzes');
    await expect
      .poll(
        async () => {
          const emptyStateCount = await page.locator('.empty-state-component').count();
          const noQuizzesTextCount = await page.getByText(/No quizzes/i).count();
          return emptyStateCount + noQuizzesTextCount;
        },
        { timeout: 10000 }
      )
      .toBeGreaterThan(0);
  });

  test('should have create quiz button', async ({ page }) => {
    await page.goto('/my-quizzes');
    const createBtn = page.locator('a:has-text("Create"), button:has-text("Create")').first();
    await expect(createBtn).toBeVisible({ timeout: 5000 });
  });
});
