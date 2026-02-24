/**
 * E2E tests — Quiz browsing: search, filter, sort.
 */
import { test, expect } from '@playwright/test';
import { loginSharedUser } from './shared-user.js';

test.describe('Quiz Browsing', () => {
  test.beforeEach(async ({ page }) => {
    await loginSharedUser(page);
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
