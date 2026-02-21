/**
 * E2E tests — Quiz attempt flow.
 */
import { test, expect } from '@playwright/test';

const uniqueUser = () => `attempt_${Date.now()}`;

test.describe('Quiz Attempt Flow', () => {
  test.beforeEach(async ({ page }) => {
    const username = uniqueUser();
    await page.goto('/register');
    await page.locator('#username').fill(username);
    await page.locator('#password').fill('testpass123');
    await page.locator('#confirmPassword').fill('testpass123');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
  });

  test('should start a quiz attempt from quiz detail page', async ({ page }) => {
    // Navigate to home and find a quiz
    await page.goto('/home');
    const quizCard = page.locator('.quiz-card, [role="button"]').first();
    const quizExists = await quizCard.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!quizExists, 'No quizzes available to attempt');

    await quizCard.click();
    await expect(page).toHaveURL(/\/quiz\//);

    // Look for start/attempt button
    const startBtn = page.locator('button:has-text("Start"), button:has-text("Take"), button:has-text("Attempt")').first();
    await expect(startBtn).toBeVisible({ timeout: 5000 });
  });

  test('should display question content during attempt', async ({ page }) => {
    await page.goto('/home');
    const quizCard = page.locator('.quiz-card, [role="button"]').first();
    const quizExists = await quizCard.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!quizExists, 'No quizzes available to attempt');

    await quizCard.click();
    const startBtn = page.locator('button:has-text("Start"), button:has-text("Take"), button:has-text("Attempt")').first();
    const canStart = await startBtn.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!canStart, 'Cannot start quiz');

    await startBtn.click();

    // Should show question content
    const questionEl = page.locator('.question-text, .question, h2, h3').first();
    await expect(questionEl).toBeVisible({ timeout: 10000 });

    // Should show answer options
    const options = page.locator('.option, .answer-option, input[type="radio"], button[class*="option"]');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should show results after submitting all answers', async ({ page }) => {
    await page.goto('/home');
    const quizCard = page.locator('.quiz-card, [role="button"]').first();
    const quizExists = await quizCard.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!quizExists, 'No quizzes available to attempt');

    await quizCard.click();
    const startBtn = page.locator('button:has-text("Start"), button:has-text("Take"), button:has-text("Attempt")').first();
    const canStart = await startBtn.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!canStart, 'Cannot start quiz');

    await startBtn.click();
    await page.waitForTimeout(1000);

    // Answer questions until done
    for (let i = 0; i < 20; i++) {
      const option = page.locator('.option-btn').first();
      const optionVisible = await option.isVisible({ timeout: 3000 }).catch(() => false);
      if (!optionVisible) break;

      await option.click();

      const submitBtn = page.getByRole('button', { name: 'Submit Answer' });
      const canSubmit = await submitBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (canSubmit) {
        await submitBtn.click();
      }

      const nextBtn = page.locator('button:has-text("Next Question"), button:has-text("View Results")').first();
      const canGoNext = await nextBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (canGoNext) {
        await nextBtn.click();
      }

      const completed = await page.getByText('Quiz Completed!').isVisible({ timeout: 1000 }).catch(() => false);
      if (completed) break;

      await page.waitForTimeout(500);
    }

    // Must render the summary page (regression: "No results found")
    await expect(page.getByText('Quiz Completed!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('No results found')).toHaveCount(0);
  });
});
