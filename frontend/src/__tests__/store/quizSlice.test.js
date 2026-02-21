import reducer, {
  setSearchTerm,
  setSortBy,
  resetFilters,
} from '../../store/slices/quizSlice';

const initialState = {
  searchTerm: '',
  selectedCategory: '',
  selectedDifficulty: '',
  sortBy: 'date',
  sortOrder: 'desc',
  currentPage: 1,
  pageSize: 12,
};

describe('quizSlice', () => {
  describe('setSearchTerm', () => {
    it('updates searchTerm and resets page to 1', () => {
      const prev = { ...initialState, currentPage: 3 };
      const state = reducer(prev, setSearchTerm('react'));
      expect(state.searchTerm).toBe('react');
      expect(state.currentPage).toBe(1);
    });
  });

  describe('setSortBy', () => {
    it('updates sortBy without resetting page', () => {
      const prev = { ...initialState, currentPage: 4 };
      const state = reducer(prev, setSortBy('title'));
      expect(state.sortBy).toBe('title');
      expect(state.currentPage).toBe(4);
    });
  });

  describe('resetFilters', () => {
    it('resets all filters to initial values but keeps pageSize', () => {
      const modified = {
        searchTerm: 'python',
        selectedCategory: 'Math',
        selectedDifficulty: 'easy',
        sortBy: 'title',
        sortOrder: 'asc',
        currentPage: 5,
        pageSize: 24,
      };
      const state = reducer(modified, resetFilters());

      expect(state.searchTerm).toBe('');
      expect(state.selectedCategory).toBe('');
      expect(state.selectedDifficulty).toBe('');
      expect(state.sortBy).toBe('date');
      expect(state.sortOrder).toBe('desc');
      expect(state.currentPage).toBe(1);
      expect(state.pageSize).toBe(24);
    });
  });
});
