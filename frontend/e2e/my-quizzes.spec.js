/**
 * E2E tests — My Quizzes page.
 */
import { test, expect } from '@playwright/test';

const uniqueUser = () => `myquiz_${Date.now()}`;

test.describe('My Quizzes', () => {
  test.beforeEach(async ({ page }) => {
    const username = uniqueUser();
    await page.goto('/register');
    await page.locator('#username').fill(username);
    await page.locator('#password').fill('testpass123');
    await page.locator('#confirmPassword').fill('testpass123');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
  });

  test('should navigate to My Quizzes page', async ({ page }) => {
    await page.click('text=My Quizzes');
    await expect(page).toHaveURL(/\/my-quizzes/);
  });

  test('should show empty state for new user with no quizzes', async ({ page }) => {
    await page.goto('/my-quizzes');
    const emptyState = page.locator('.empty-state-component, text="No quizzes", text="Create"');
    await expect(emptyState.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have create quiz button', async ({ page }) => {
    await page.goto('/my-quizzes');
    const createBtn = page.locator('a:has-text("Create"), button:has-text("Create")').first();
    await expect(createBtn).toBeVisible({ timeout: 5000 });
  });
});
