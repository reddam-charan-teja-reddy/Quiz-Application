import reducer, { toggleSidebar } from '../../store/slices/uiSlice';

describe('uiSlice', () => {
  describe('toggleSidebar', () => {
    it('toggles sidebar from open to closed', () => {
      const state = reducer({ globalError: null, sidebarOpen: true }, toggleSidebar());
      expect(state.sidebarOpen).toBe(false);
    });

    it('toggles sidebar from closed to open', () => {
      const state = reducer({ globalError: null, sidebarOpen: false }, toggleSidebar());
      expect(state.sidebarOpen).toBe(true);
    });
  });
});
