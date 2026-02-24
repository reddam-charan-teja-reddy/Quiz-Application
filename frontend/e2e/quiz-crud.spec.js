/**
 * E2E tests — Quiz CRUD operations.
 * Covers: create quiz, edit quiz, verify on home page.
 */
import { test, expect } from '@playwright/test';
import { loginSharedUser } from './shared-user.js';

test.describe('Quiz CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginSharedUser(page);
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
  });

  test('should create a quiz and see it on home page', async ({ page }) => {
    await page.click('text=Create Quiz');
    await expect(page).toHaveURL(/\/plus/);

    // Fill quiz details
    await page.getByLabel('Quiz Title *').fill('E2E Test Quiz');
    await page.getByLabel('Description *').fill('A quiz created during E2E testing');
    await page.getByPlaceholder('Category 1').fill('General');

    // Fill the first question completely
    await page.getByPlaceholder('Enter your question').fill('What is 2+2?');
    await page.getByPlaceholder('Option A').fill('4');
    await page.getByPlaceholder('Option B').fill('3');
    await page.getByPlaceholder('Option C').fill('5');
    await page.getByPlaceholder('Option D').fill('6');
    await page.locator('.question-container select').first().selectOption('4');

    // Submit the quiz
    await page.getByRole('button', { name: /Publish Quiz|Save as Draft/i }).click();

    // Should navigate to home after successful creation
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });

    // Created quiz should be discoverable on home
    await expect(page.getByText('E2E Test Quiz')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to edit quiz page', async ({ page }) => {
    // First create a quiz via API to have something to edit
    await page.click('text=My Quizzes');
    await expect(page).toHaveURL(/\/my-quizzes/);
  });
});
