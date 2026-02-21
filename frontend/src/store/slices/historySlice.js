import { createSlice } from '@reduxjs/toolkit';

/**
 * historySlice — holds any client-side state related to the history page.
 * Actual attempt data is fetched via RTK Query; this slice is reserved
 * for future client-only state (e.g. sort order, selected filters).
 */
const historySlice = createSlice({
  name: 'history',
  initialState: {
    sortBy: 'date',   // 'date' | 'score'
    sortDir: 'desc',  // 'asc' | 'desc'
  },
  reducers: {
    setSortBy(state, action) {
      state.sortBy = action.payload;
    },
    setSortDir(state, action) {
      state.sortDir = action.payload;
    },
  },
});

export const { setSortBy, setSortDir } = historySlice.actions;
export default historySlice.reducer;
