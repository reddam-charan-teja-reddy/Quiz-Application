import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers';
import MyQuizzes from '../../pages/MyQuizzes';

// Mock RTK Query hooks
vi.mock('../../store/api/apiSlice', () => ({
  useGetMyQuizzesQuery: vi.fn(),
  useDeleteQuizMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useDuplicateQuizMutation: vi.fn(() => [vi.fn(), {}]),
  useLazyExportQuizQuery: vi.fn(() => [vi.fn(), {}]),
  apiSlice: {
    reducerPath: 'api',
    reducer: (state = {}) => state,
    middleware: () => (next) => (action) => next(action),
  },
}));

import { useGetMyQuizzesQuery } from '../../store/api/apiSlice';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const authedState = {
  auth: { user: { username: 'alice', id: 1 }, loading: false, error: null },
};

const sampleQuizzes = [
  { id: 1, title: 'My Quiz 1', description: 'Desc 1', num_questions: 5, difficulty: 'easy', categories: ['Science'], is_published: true },
  { id: 2, title: 'My Quiz 2', description: 'Desc 2', num_questions: 8, difficulty: 'medium', categories: ['Math'], is_published: false },
];

beforeEach(() => mockNavigate.mockClear());

describe('MyQuizzes', () => {
  it('renders user quiz list', () => {
    useGetMyQuizzesQuery.mockReturnValue({ data: { quizzes: sampleQuizzes, total: 2 }, isLoading: false });
    renderWithProviders(<MyQuizzes />, { preloadedState: authedState });
    expect(screen.getByText('My Quiz 1')).toBeInTheDocument();
    expect(screen.getByText('My Quiz 2')).toBeInTheDocument();
  });

  it('shows empty state when no quizzes', () => {
    useGetMyQuizzesQuery.mockReturnValue({ data: { quizzes: [], total: 0 }, isLoading: false });
    renderWithProviders(<MyQuizzes />, { preloadedState: authedState });
    expect(screen.getByText('No quizzes yet')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useGetMyQuizzesQuery.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<MyQuizzes />, { preloadedState: authedState });
    expect(screen.getByText('Loading your quizzes...')).toBeInTheDocument();
  });

  it('renders delete buttons for each quiz', () => {
    useGetMyQuizzesQuery.mockReturnValue({ data: { quizzes: sampleQuizzes, total: 2 }, isLoading: false });
    renderWithProviders(<MyQuizzes />, { preloadedState: authedState });
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    expect(deleteButtons).toHaveLength(2);
  });

  it('shows draft badge for unpublished quiz', () => {
    useGetMyQuizzesQuery.mockReturnValue({ data: { quizzes: sampleQuizzes, total: 2 }, isLoading: false });
    renderWithProviders(<MyQuizzes />, { preloadedState: authedState });
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders duplicate and export buttons', () => {
    useGetMyQuizzesQuery.mockReturnValue({ data: { quizzes: sampleQuizzes, total: 2 }, isLoading: false });
    renderWithProviders(<MyQuizzes />, { preloadedState: authedState });
    expect(screen.getAllByRole('button', { name: 'Duplicate' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Export' })).toHaveLength(2);
  });
});
