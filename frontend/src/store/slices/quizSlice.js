import { createSlice } from '@reduxjs/toolkit';

/**
 * quizSlice — holds client-side filter/sort/pagination state for the quizzes list.
 * Actual quiz data is fetched & cached by RTK Query (apiSlice).
 */
const quizSlice = createSlice({
  name: 'quiz',
  initialState: {
    searchTerm: '',
    selectedCategory: '',
    selectedDifficulty: '',
    sortBy: 'date',
    sortOrder: 'desc',
    currentPage: 1,
    pageSize: 12,
  },
  reducers: {
    setSearchTerm(state, action) { state.searchTerm = action.payload; state.currentPage = 1; },
    setSelectedCategory(state, action) { state.selectedCategory = action.payload; state.currentPage = 1; },
    setSelectedDifficulty(state, action) { state.selectedDifficulty = action.payload; state.currentPage = 1; },
    setSortBy(state, action) { state.sortBy = action.payload; },
    setSortOrder(state, action) { state.sortOrder = action.payload; },
    setCurrentPage(state, action) { state.currentPage = action.payload; },
    setPageSize(state, action) { state.pageSize = action.payload; state.currentPage = 1; },
    resetFilters(state) {
      state.searchTerm = '';
      state.selectedCategory = '';
      state.selectedDifficulty = '';
      state.sortBy = 'date';
      state.sortOrder = 'desc';
      state.currentPage = 1;
    },
  },
});

export const {
  setSearchTerm,
  setSelectedCategory,
  setSelectedDifficulty,
  setSortBy,
  setSortOrder,
  setCurrentPage,
  setPageSize,
  resetFilters,
} = quizSlice.actions;
export default quizSlice.reducer;
