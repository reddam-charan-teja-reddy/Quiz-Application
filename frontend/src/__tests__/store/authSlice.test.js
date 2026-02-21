import reducer, {
  forceLogout,
  login,
  logout,
  restoreSession,
} from '../../store/slices/authSlice';

const initialState = {
  user: null,
  loading: true,
  error: null,
};

describe('authSlice', () => {
  describe('forceLogout', () => {
    it('clears user and error', () => {
      const prev = { user: { username: 'alice' }, loading: false, error: 'oops' };
      const state = reducer(prev, forceLogout());
      expect(state.user).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('login', () => {
    it('pending clears error', () => {
      const prev = { ...initialState, error: 'old error' };
      const state = reducer(prev, login.pending('reqId'));
      expect(state.error).toBeNull();
    });

    it('fulfilled sets user and clears error', () => {
      const payload = { username: 'bob', status: 'active' };
      const state = reducer(initialState, login.fulfilled(payload, 'reqId'));
      expect(state.user).toEqual(payload);
      expect(state.error).toBeNull();
    });

    it('rejected sets error from payload', () => {
      const state = reducer(
        initialState,
        login.rejected(new Error('fail'), 'reqId', undefined, 'Invalid credentials')
      );
      expect(state.error).toBe('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('fulfilled clears user and error', () => {
      const prev = { user: { username: 'dave' }, loading: false, error: null };
      const state = reducer(prev, logout.fulfilled(undefined, 'reqId'));
      expect(state.user).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('restoreSession', () => {
    it('pending sets loading true', () => {
      const prev = { ...initialState, loading: false };
      const state = reducer(prev, restoreSession.pending('reqId'));
      expect(state.loading).toBe(true);
    });

    it('fulfilled sets user and loading false', () => {
      const payload = { username: 'eve', status: 'active' };
      const state = reducer(initialState, restoreSession.fulfilled(payload, 'reqId'));
      expect(state.user).toEqual(payload);
      expect(state.loading).toBe(false);
    });

    it('rejected clears user and sets loading false', () => {
      const prev = { user: { username: 'old' }, loading: true, error: null };
      const state = reducer(prev, restoreSession.rejected(new Error('no session'), 'reqId'));
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
    });
  });
});
