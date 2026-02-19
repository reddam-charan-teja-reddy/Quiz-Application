const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let accessToken = null;
let onAuthFailure = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setOnAuthFailure(callback) {
  onAuthFailure = callback;
}

/**
 * Fetch wrapper that attaches the JWT access token and handles 401 auto-refresh.
 */
export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // On 401, try refreshing the token (skip for auth routes to avoid loops)
  if (response.status === 401 && !path.includes('/api/auth/')) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    } else if (onAuthFailure) {
      onAuthFailure();
    }
  }

  return response;
}

async function refreshAccessToken() {
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      accessToken = data.access_token;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export { API_URL };
