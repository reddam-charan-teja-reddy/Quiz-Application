import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { setAccessToken, API_URL } from '../../lib/api';

// ─── Async Thunks ───────────────────────────────────────────────

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return rejectWithValue('No valid session');
    const data = await res.json();
    setAccessToken(data.access_token);
    return { username: data.username, status: data.status };
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    const res = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      return rejectWithValue(err.detail || 'Login failed');
    }
    const data = await res.json();
    setAccessToken(data.access_token);
    return { username: data.username, status: data.status };
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ username, password }, { rejectWithValue }) => {
    const res = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ detail: 'Registration failed' }));
      return rejectWithValue(err.detail || 'Registration failed');
    }
    const data = await res.json();
    setAccessToken(data.access_token);
    return { username: data.username, status: data.status };
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Ignore network errors during logout
  }
  setAccessToken(null);
});

// ─── Slice ──────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,       // { username, status }
    loading: true,    // true during initial session restore
    error: null,
  },
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    /** Called by the api.js onAuthFailure callback */
    forceLogout(state) {
      state.user = null;
      state.error = null;
      setAccessToken(null);
    },
  },
  extraReducers: (builder) => {
    // ── restoreSession ──
    builder
      .addCase(restoreSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null;
        state.loading = false;
      });

    // ── login ──
    builder
      .addCase(login.pending, (state) => {
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.error = action.payload;
      });

    // ── register ──
    builder
      .addCase(register.pending, (state) => {
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.error = action.payload;
      });

    // ── logout ──
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.error = null;
    });
  },
});

export const { clearAuthError, forceLogout } = authSlice.actions;
export default authSlice.reducer;
