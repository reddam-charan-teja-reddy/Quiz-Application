import { createSlice } from '@reduxjs/toolkit';

/**
 * uiSlice — global UI state such as toast notifications and
 * sidebar visibility.
 */
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    globalError: null,
    sidebarOpen: true,
  },
  reducers: {
    setGlobalError(state, action) {
      state.globalError = action.payload;
    },
    clearGlobalError(state) {
      state.globalError = null;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action) {
      state.sidebarOpen = action.payload;
    },
  },
});

export const { setGlobalError, clearGlobalError, toggleSidebar, setSidebarOpen } =
  uiSlice.actions;
export default uiSlice.reducer;
