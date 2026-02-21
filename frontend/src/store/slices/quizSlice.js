import { createSlice } from '@reduxjs/toolkit';

/**
 * quizSlice — holds client-side filter/sort state for the quizzes list.
 * Actual quiz data is fetched & cached by RTK Query (apiSlice).
 */
const quizSlice = createSlice({
  name: 'quiz',
  initialState: {
    searchTerm: '',
    selectedCategory: '',
  },
  reducers: {
    setSearchTerm(state, action) {
      state.searchTerm = action.payload;
    },
    setSelectedCategory(state, action) {
      state.selectedCategory = action.payload;
    },
    resetFilters(state) {
      state.searchTerm = '';
      state.selectedCategory = '';
    },
  },
});

export const { setSearchTerm, setSelectedCategory, resetFilters } =
  quizSlice.actions;
export default quizSlice.reducer;
