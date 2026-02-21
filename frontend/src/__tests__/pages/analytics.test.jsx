import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers';
import StatsPage from '../../pages/StatsPage';
import GlobalLeaderboard from '../../pages/GlobalLeaderboard';
import QuizRankings from '../../pages/QuizRankings';

// Mock RTK Query hooks
vi.mock('../../store/api/apiSlice', () => ({
  useGetStatsQuery: vi.fn(),
  useGetGlobalLeaderboardQuery: vi.fn(),
  useGetQuizLeaderboardQuery: vi.fn(),
  apiSlice: {
    reducerPath: 'api',
    reducer: (state = {}) => state,
    middleware: () => (next) => (action) => next(action),
  },
}));

import {
  useGetStatsQuery,
  useGetGlobalLeaderboardQuery,
  useGetQuizLeaderboardQuery,
} from '../../store/api/apiSlice';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '42' }),
  };
});

// Mock recharts to avoid rendering SVG in jsdom
vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Legend: () => null,
}));

const authedState = {
  auth: { user: { username: 'alice', id: 1 }, loading: false, error: null },
};

beforeEach(() => mockNavigate.mockClear());

// ---------------------------------------------------------------------------
// StatsPage
// ---------------------------------------------------------------------------
describe('StatsPage', () => {
  const sampleStats = {
    average_score: 75,
    total_attempts: 20,
    best_score: 100,
    score_distribution: [
      { range: '0-20', count: 1 },
      { range: '80-100', count: 5 },
    ],
    category_breakdown: [
      { category: 'Science', attempts: 10, average_score: 80 },
    ],
    recent_attempts: [
      { attempt_id: 'a1', quiz_title: 'Quiz A', score: 90, correct_count: 9, total: 10, created_at: '2025-01-01T00:00:00Z' },
    ],
  };

  it('renders stats data', () => {
    useGetStatsQuery.mockReturnValue({ data: sampleStats, isLoading: false, error: null });
    renderWithProviders(<StatsPage />, { preloadedState: authedState });
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useGetStatsQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderWithProviders(<StatsPage />, { preloadedState: authedState });
    expect(screen.getByText('Loading statistics...')).toBeInTheDocument();
  });

  it('shows empty state on error', () => {
    useGetStatsQuery.mockReturnValue({ data: undefined, isLoading: false, error: { status: 500 } });
    renderWithProviders(<StatsPage />, { preloadedState: authedState });
    expect(screen.getByText('No statistics')).toBeInTheDocument();
  });

  it('renders recent attempts section', () => {
    useGetStatsQuery.mockReturnValue({ data: sampleStats, isLoading: false, error: null });
    renderWithProviders(<StatsPage />, { preloadedState: authedState });
    expect(screen.getByText('Recent Attempts')).toBeInTheDocument();
    expect(screen.getByText('Quiz A')).toBeInTheDocument();
  });

});

// ---------------------------------------------------------------------------
// GlobalLeaderboard
// ---------------------------------------------------------------------------
describe('GlobalLeaderboard', () => {
  const sampleEntries = [
    { username: 'alice', average_score: 95, total_attempts: 20 },
    { username: 'bob', average_score: 80, total_attempts: 15 },
    { username: 'carol', average_score: 70, total_attempts: 10 },
  ];

  it('renders leaderboard entries', () => {
    useGetGlobalLeaderboardQuery.mockReturnValue({ data: { entries: sampleEntries }, isLoading: false, error: null });
    renderWithProviders(<GlobalLeaderboard />, { preloadedState: authedState });
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('carol')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useGetGlobalLeaderboardQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderWithProviders(<GlobalLeaderboard />, { preloadedState: authedState });
    expect(screen.getByText('Loading leaderboard...')).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    useGetGlobalLeaderboardQuery.mockReturnValue({ data: { entries: [] }, isLoading: false, error: null });
    renderWithProviders(<GlobalLeaderboard />, { preloadedState: authedState });
    expect(screen.getByText('No rankings yet')).toBeInTheDocument();
  });

  it('shows error state', () => {
    useGetGlobalLeaderboardQuery.mockReturnValue({ data: undefined, isLoading: false, error: { status: 500 } });
    renderWithProviders(<GlobalLeaderboard />, { preloadedState: authedState });
    expect(screen.getByText('Failed to load leaderboard.')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// QuizRankings
// ---------------------------------------------------------------------------
describe('QuizRankings', () => {
  const sampleRankings = {
    quiz_title: 'JavaScript Basics',
    entries: [
      { username: 'alice', score: 100, correct_count: 10, total: 10, created_at: '2025-01-01T00:00:00Z' },
      { username: 'bob', score: 80, correct_count: 8, total: 10, created_at: '2025-01-02T00:00:00Z' },
    ],
  };

  it('renders rankings entries', () => {
    useGetQuizLeaderboardQuery.mockReturnValue({ data: sampleRankings, isLoading: false, error: null });
    renderWithProviders(<QuizRankings />, { preloadedState: authedState });
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('shows quiz title', () => {
    useGetQuizLeaderboardQuery.mockReturnValue({ data: sampleRankings, isLoading: false, error: null });
    renderWithProviders(<QuizRankings />, { preloadedState: authedState });
    expect(screen.getByText('JavaScript Basics')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useGetQuizLeaderboardQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderWithProviders(<QuizRankings />, { preloadedState: authedState });
    expect(screen.getByText('Loading leaderboard...')).toBeInTheDocument();
  });

  it('shows empty state when no rankings', () => {
    useGetQuizLeaderboardQuery.mockReturnValue({ data: { entries: [] }, isLoading: false, error: null });
    renderWithProviders(<QuizRankings />, { preloadedState: authedState });
    expect(screen.getByText('No Rankings Yet')).toBeInTheDocument();
  });

  it('shows error state', () => {
    useGetQuizLeaderboardQuery.mockReturnValue({ data: undefined, isLoading: false, error: { data: { detail: 'Not found' } } });
    renderWithProviders(<QuizRankings />, { preloadedState: authedState });
    expect(screen.getByText('Error Loading Leaderboard')).toBeInTheDocument();
  });

});
