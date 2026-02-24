import fs from 'node:fs';
import { URL } from 'node:url';

import { getSharedUser, sharedUserFilePath } from './shared-user.js';

const apiBase = process.env.E2E_API_URL || 'http://127.0.0.1:8000/api/v1';

const isLocalApiBase = () => {
  try {
    const parsed = new URL(apiBase);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

export default async function globalTeardown() {
  if (!fs.existsSync(sharedUserFilePath)) {
    return;
  }

  try {
    const shouldDeleteSharedUser = process.env.E2E_DELETE_SHARED_USER === 'true';
    if (!shouldDeleteSharedUser || !isLocalApiBase()) {
      return;
    }

    const { username, password } = getSharedUser();

    const loginRes = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!loginRes.ok) {
      return;
    }

    const loginData = await loginRes.json();
    const token = loginData.access_token;
    if (!token) {
      return;
    }

    await fetch(`${apiBase}/profile`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ keep_quizzes: false, password }),
    });
  } finally {
    fs.rmSync(sharedUserFilePath, { force: true });
  }
}
