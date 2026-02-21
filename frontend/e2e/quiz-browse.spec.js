/**
 * E2E tests — Quiz browsing: search, filter, sort.
 */
import { test, expect } from '@playwright/test';

const uniqueUser = () => `browse_${Date.now()}`;

test.describe('Quiz Browsing', () => {
  test.beforeEach(async ({ page }) => {
    const username = uniqueUser();
    await page.goto('/register');
    await page.locator('#username').fill(username);
    await page.locator('#password').fill('testpass123');
    await page.locator('#confirmPassword').fill('testpass123');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
  });

  test('should display the home page with quiz list or empty state', async ({ page }) => {
    // Either quizzes are shown or an empty state message
    const content = page.locator('.quiz-card, .empty-state-component, .no-quizzes');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have a search input', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[name="search"]');
    await expect(searchInput.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have filter controls', async ({ page }) => {
    // Category or difficulty filter should exist
    const filters = page.locator('select, .filter-controls, .filters');
    await expect(filters.first()).toBeVisible({ timeout: 5000 });
  });
});
