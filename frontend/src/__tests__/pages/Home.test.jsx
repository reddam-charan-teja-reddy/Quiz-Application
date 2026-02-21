import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers';
import Home from '../../pages/Home';

// Mock RTK Query hooks
vi.mock('../../store/api/apiSlice', () => ({
  useGetQuizzesQuery: vi.fn(),
  useGetCategoriesQuery: vi.fn(),
  apiSlice: {
    reducerPath: 'api',
    reducer: (state = {}) => state,
    middleware: () => (next) => (action) => next(action),
  },
}));

import { useGetQuizzesQuery, useGetCategoriesQuery } from '../../store/api/apiSlice';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const authedState = {
  auth: { user: { username: 'alice', id: 1 }, loading: false, error: null },
  quiz: {
    searchTerm: '',
    selectedCategory: '',
    selectedDifficulty: '',
    sortBy: 'date',
    sortOrder: 'desc',
    currentPage: 1,
    pageSize: 12,
  },
};

const sampleQuizzes = [
  { id: 1, title: 'Quiz One', description: 'Desc 1', author: 'bob', num_questions: 5, difficulty: 'easy', categories: ['Science'] },
  { id: 2, title: 'Quiz Two', description: 'Desc 2', author: 'carol', num_questions: 10, difficulty: 'hard', categories: ['Math'] },
];

beforeEach(() => {
  mockNavigate.mockClear();
  useGetCategoriesQuery.mockReturnValue({ data: [] });
});

describe('Home', () => {
  it('renders quiz list from mocked data', () => {
    useGetQuizzesQuery.mockReturnValue({ data: { quizzes: sampleQuizzes, total: 2 }, isLoading: false });
    renderWithProviders(<Home />, { preloadedState: authedState });
    expect(screen.getByText('Quiz One')).toBeInTheDocument();
    expect(screen.getByText('Quiz Two')).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading', () => {
    useGetQuizzesQuery.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<Home />, { preloadedState: authedState });
    expect(screen.getByText('Loading quizzes...')).toBeInTheDocument();
  });

  it('shows empty state when no quizzes', () => {
    useGetQuizzesQuery.mockReturnValue({ data: { quizzes: [], total: 0 }, isLoading: false });
    renderWithProviders(<Home />, { preloadedState: authedState });
    expect(screen.getByText('No quizzes found')).toBeInTheDocument();
  });

  it('renders search input', () => {
    useGetQuizzesQuery.mockReturnValue({ data: { quizzes: [], total: 0 }, isLoading: false });
    renderWithProviders(<Home />, { preloadedState: authedState });
    expect(screen.getByPlaceholderText('Search quizzes...')).toBeInTheDocument();
  });

  it('renders category and difficulty filter dropdowns', () => {
    useGetQuizzesQuery.mockReturnValue({ data: { quizzes: [], total: 0 }, isLoading: false });
    renderWithProviders(<Home />, { preloadedState: authedState });
    expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Difficulties')).toBeInTheDocument();
  });

  it('renders pagination when multiple pages exist', () => {
    useGetQuizzesQuery.mockReturnValue({ data: { quizzes: sampleQuizzes, total: 50 }, isLoading: false });
    renderWithProviders(<Home />, { preloadedState: authedState });
    // Pagination component should be present — look for page buttons
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('does not render pagination when only one page', () => {
    useGetQuizzesQuery.mockReturnValue({ data: { quizzes: sampleQuizzes, total: 2 }, isLoading: false });
    renderWithProviders(<Home />, { preloadedState: authedState });
    // With pageSize 12 and total 2, totalPages = 1 so Pagination should not render
    // Check there are no page number buttons (2, 3, etc) beyond content
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

});
