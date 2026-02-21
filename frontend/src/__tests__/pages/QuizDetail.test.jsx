import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers';
import QuizDetail from '../../pages/QuizDetail';

// Mock RTK Query hooks
vi.mock('../../store/api/apiSlice', () => ({
  useGetQuizQuery: vi.fn(),
  useStartAttemptMutation: vi.fn(() => [vi.fn(), {}]),
  useDeleteQuizMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useDuplicateQuizMutation: vi.fn(() => [vi.fn(), {}]),
  apiSlice: {
    reducerPath: 'api',
    reducer: (state = {}) => state,
    middleware: () => (next) => (action) => next(action),
  },
}));

import { useGetQuizQuery } from '../../store/api/apiSlice';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '42' }),
  };
});

const authedState = {
  auth: { user: { username: 'alice', id: 1 }, loading: false, error: null },
};

const sampleQuiz = {
  id: 42,
  title: 'JavaScript Basics',
  description: 'Learn the fundamentals of JS',
  author: 'alice',
  num_questions: 5,
  difficulty: 'medium',
  time_limit_minutes: null,
  time_per_question_seconds: null,
  categories: ['Programming'],
  questions: [
    { id: 'q1', question: 'What is JS?', options: ['A', 'B', 'C', 'D'], answer: 'A' },
    { id: 'q2', question: 'What is a closure?', options: ['A', 'B', 'C', 'D'], answer: 'B' },
  ],
};

beforeEach(() => mockNavigate.mockClear());

describe('QuizDetail', () => {
  it('renders quiz title and description', () => {
    useGetQuizQuery.mockReturnValue({ data: sampleQuiz, isLoading: false, error: null });
    renderWithProviders(<QuizDetail />, { preloadedState: authedState });
    expect(screen.getByText('JavaScript Basics')).toBeInTheDocument();
    expect(screen.getByText('Learn the fundamentals of JS')).toBeInTheDocument();
  });

  it('shows Start Quiz button', () => {
    useGetQuizQuery.mockReturnValue({ data: sampleQuiz, isLoading: false, error: null });
    renderWithProviders(<QuizDetail />, { preloadedState: authedState });
    expect(screen.getByRole('button', { name: 'Start Quiz' })).toBeInTheDocument();
  });

  it('shows edit and delete buttons when user is the author', () => {
    useGetQuizQuery.mockReturnValue({ data: sampleQuiz, isLoading: false, error: null });
    renderWithProviders(<QuizDetail />, { preloadedState: authedState });
    expect(screen.getByText(/Edit/)).toBeInTheDocument();
    expect(screen.getByText(/Delete/)).toBeInTheDocument();
  });

  it('hides edit and delete buttons when user is not the author', () => {
    useGetQuizQuery.mockReturnValue({ data: { ...sampleQuiz, author: 'other' }, isLoading: false, error: null });
    renderWithProviders(<QuizDetail />, { preloadedState: authedState });
    expect(screen.queryByText('✏️ Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('🗑️ Delete')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    useGetQuizQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderWithProviders(<QuizDetail />, { preloadedState: authedState });
    expect(screen.getByText('Loading quiz...')).toBeInTheDocument();
  });

  it('shows not found state on error', () => {
    useGetQuizQuery.mockReturnValue({ data: undefined, isLoading: false, error: { status: 404 } });
    renderWithProviders(<QuizDetail />, { preloadedState: authedState });
    expect(screen.getByText('Quiz not found')).toBeInTheDocument();
  });

});
