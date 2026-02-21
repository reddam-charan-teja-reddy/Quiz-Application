import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers';
import History from '../../pages/History';

// Mock RTK Query hooks
vi.mock('../../store/api/apiSlice', () => ({
  useGetHistoryQuery: vi.fn(),
  useDeleteAttemptMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  apiSlice: {
    reducerPath: 'api',
    reducer: (state = {}) => state,
    middleware: () => (next) => (action) => next(action),
  },
}));

import { useGetHistoryQuery } from '../../store/api/apiSlice';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const authedState = {
  auth: { user: { username: 'alice', id: 1 }, loading: false, error: null },
};

const sampleAttempts = [
  { attempt_id: 'a1', quiz_id: 1, quiz_title: 'Quiz One', score: 80, correct_count: 4, total: 5, created_at: '2025-01-01T00:00:00Z' },
  { attempt_id: 'a2', quiz_id: 2, quiz_title: 'Quiz Two', score: 60, correct_count: 3, total: 5, created_at: '2025-01-02T00:00:00Z' },
];

beforeEach(() => mockNavigate.mockClear());

describe('History', () => {
  it('renders attempt list', () => {
    useGetHistoryQuery.mockReturnValue({ data: sampleAttempts, isLoading: false, error: null, refetch: vi.fn() });
    renderWithProviders(<History />, { preloadedState: authedState });
    expect(screen.getByText('Quiz One')).toBeInTheDocument();
    expect(screen.getByText('Quiz Two')).toBeInTheDocument();
  });

  it('shows scores', () => {
    useGetHistoryQuery.mockReturnValue({ data: sampleAttempts, isLoading: false, error: null, refetch: vi.fn() });
    renderWithProviders(<History />, { preloadedState: authedState });
    // Scores may appear both in individual cards and in summary stats
    const scores80 = screen.getAllByText('80%');
    expect(scores80.length).toBeGreaterThanOrEqual(1);
    const scores60 = screen.getAllByText('60%');
    expect(scores60.length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no attempts', () => {
    useGetHistoryQuery.mockReturnValue({ data: [], isLoading: false, error: null, refetch: vi.fn() });
    renderWithProviders(<History />, { preloadedState: authedState });
    expect(screen.getByText('No Quiz History')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useGetHistoryQuery.mockReturnValue({ data: [], isLoading: true, error: null, refetch: vi.fn() });
    renderWithProviders(<History />, { preloadedState: authedState });
    expect(screen.getByText('Loading your quiz history...')).toBeInTheDocument();
  });

  it('renders delete buttons for each attempt', () => {
    useGetHistoryQuery.mockReturnValue({ data: sampleAttempts, isLoading: false, error: null, refetch: vi.fn() });
    renderWithProviders(<History />, { preloadedState: authedState });
    const deleteButtons = screen.getAllByText('🗑️');
    expect(deleteButtons).toHaveLength(2);
  });

  it('shows overall statistics when attempts exist', () => {
    useGetHistoryQuery.mockReturnValue({ data: sampleAttempts, isLoading: false, error: null, refetch: vi.fn() });
    renderWithProviders(<History />, { preloadedState: authedState });
    expect(screen.getByText('Overall Statistics')).toBeInTheDocument();
    expect(screen.getByText('Quizzes Taken')).toBeInTheDocument();
  });

  it('shows error state', () => {
    useGetHistoryQuery.mockReturnValue({ data: [], isLoading: false, error: { data: { detail: 'Server error' } }, refetch: vi.fn() });
    renderWithProviders(<History />, { preloadedState: authedState });
    expect(screen.getByText('Error Loading History')).toBeInTheDocument();
  });
});
