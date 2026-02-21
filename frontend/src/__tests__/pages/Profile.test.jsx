import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers';
import Profile from '../../pages/Profile';

// Mock RTK Query hooks
vi.mock('../../store/api/apiSlice', () => ({
  useGetProfileQuery: vi.fn(),
  apiSlice: {
    reducerPath: 'api',
    reducer: (state = {}) => state,
    middleware: () => (next) => (action) => next(action),
  },
}));

import { useGetProfileQuery } from '../../store/api/apiSlice';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/profile', state: null }),
  };
});

const authedState = {
  auth: { user: { username: 'alice', id: 1 }, loading: false, error: null },
};

const sampleProfile = {
  display_name: 'Alice',
  email: 'alice@example.com',
  average_score: 85,
  best_score: 100,
  total_attempts: 10,
  created_at: '2024-01-01T00:00:00Z',
  created_quizzes: [
    { id: 1, title: 'Quiz One', num_questions: 5, difficulty: 'easy' },
    { id: 2, title: 'Quiz Two', num_questions: 10, difficulty: 'hard' },
  ],
};

beforeEach(() => mockNavigate.mockClear());

describe('Profile', () => {
  it('renders user profile data', () => {
    useGetProfileQuery.mockReturnValue({ data: sampleProfile, isLoading: false, error: null, refetch: vi.fn() });
    renderWithProviders(<Profile />, { preloadedState: authedState });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('renders stats cards', () => {
    useGetProfileQuery.mockReturnValue({ data: sampleProfile, isLoading: false, error: null, refetch: vi.fn() });
    renderWithProviders(<Profile />, { preloadedState: authedState });
    // Labels and values may appear more than once (stats cards + performance section)
    const avgScoreLabels = screen.getAllByText('Average Score');
    expect(avgScoreLabels.length).toBeGreaterThanOrEqual(1);
    const bestScoreLabels = screen.getAllByText('Best Score');
    expect(bestScoreLabels.length).toBeGreaterThanOrEqual(1);
    const scores85 = screen.getAllByText('85%');
    expect(scores85.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows created quizzes list', () => {
    useGetProfileQuery.mockReturnValue({ data: sampleProfile, isLoading: false, error: null, refetch: vi.fn() });
    renderWithProviders(<Profile />, { preloadedState: authedState });
    expect(screen.getByText('Quiz One')).toBeInTheDocument();
    expect(screen.getByText('Quiz Two')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useGetProfileQuery.mockReturnValue({ data: undefined, isLoading: true, error: null, refetch: vi.fn() });
    renderWithProviders(<Profile />, { preloadedState: authedState });
    expect(screen.getByText('Loading your profile...')).toBeInTheDocument();
  });

  it('shows empty state for created quizzes', () => {
    useGetProfileQuery.mockReturnValue({
      data: { ...sampleProfile, created_quizzes: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderWithProviders(<Profile />, { preloadedState: authedState });
    expect(screen.getByText("You haven't created any quizzes yet.")).toBeInTheDocument();
  });

  it('shows error state', () => {
    useGetProfileQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { data: { detail: 'Failed to load' } },
      refetch: vi.fn(),
    });
    renderWithProviders(<Profile />, { preloadedState: authedState });
    expect(screen.getByText('Error Loading Profile')).toBeInTheDocument();
  });

});
