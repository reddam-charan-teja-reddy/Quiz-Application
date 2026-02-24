import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';

const SHARED_USER_FILE = path.join(process.cwd(), 'e2e', '.shared-user.json');
const apiBase = process.env.E2E_API_URL || 'http://127.0.0.1:8000/api/v1';
let userEnsured = false;

const assertSafeE2EApiBase = () => {
  if (process.env.E2E_ALLOW_REMOTE === 'true') {
    return;
  }

  const parsed = new URL(apiBase);
  const allowedHosts = new Set(['localhost', '127.0.0.1']);
  if (!allowedHosts.has(parsed.hostname)) {
    throw new Error(
      `Unsafe E2E_API_URL host: ${parsed.hostname}. ` +
      'Use localhost/127.0.0.1 for E2E or set E2E_ALLOW_REMOTE=true explicitly.'
    );
  }
};

export const getSharedUser = () => {
  if (!fs.existsSync(SHARED_USER_FILE)) {
    throw new Error(`Missing shared E2E user file at ${SHARED_USER_FILE}. Run via Playwright with globalSetup enabled.`);
  }
  return JSON.parse(fs.readFileSync(SHARED_USER_FILE, 'utf8'));
};

export const loginSharedUser = async (page) => {
  assertSafeE2EApiBase();

  const { username, password } = getSharedUser();

  if (!userEnsured) {
    const registerRes = await page.request.post(`${apiBase}/auth/register`, {
      data: { username, password },
      headers: { 'Content-Type': 'application/json' },
    });
    if (registerRes.status() !== 201 && registerRes.status() !== 409) {
      const body = await registerRes.text();
      throw new Error(`Failed to ensure shared E2E user (${registerRes.status()}): ${body}`);
    }
    userEnsured = true;
  }

  await page.goto('/login');
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
};

export const sharedUserFilePath = SHARED_USER_FILE;
