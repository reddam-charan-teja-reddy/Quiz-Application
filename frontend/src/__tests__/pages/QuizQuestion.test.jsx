import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers';
import QuizQuestion from '../../pages/QuizQuestion';

// Mock RTK Query hooks
vi.mock('../../store/api/apiSlice', () => ({
  useFinishAttemptMutation: vi.fn(() => [vi.fn(), {}]),
  apiSlice: {
    reducerPath: 'api',
    reducer: (state = {}) => state,
    middleware: () => (next) => (action) => next(action),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '42', q_id: '0' }),
  };
});

const sampleQuiz = {
  id: 42,
  title: 'JavaScript Basics',
  questions: [
    { id: 'q1', question: 'What is JS?', options: ['Language', 'Database', 'OS', 'Framework'], answer: 'Language' },
    { id: 'q2', question: 'What is a closure?', options: ['A', 'B', 'C', 'D'], answer: 'A' },
  ],
  time_limit_minutes: null,
  time_per_question_seconds: null,
};

const attemptState = {
  auth: { user: { username: 'alice', id: 1 }, loading: false, error: null },
  attempt: {
    currentQuiz: sampleQuiz,
    attemptId: 'attempt-1',
    answers: [],
    answersMap: {},
    correct: [],
    wrong: [],
    startTime: new Date().toISOString(),
  },
};

beforeEach(() => mockNavigate.mockClear());

describe('QuizQuestion', () => {
  it('renders question text', () => {
    renderWithProviders(<QuizQuestion />, { preloadedState: attemptState });
    expect(screen.getByText(/What is JS\?/)).toBeInTheDocument();
  });

  it('renders all answer options', () => {
    renderWithProviders(<QuizQuestion />, { preloadedState: attemptState });
    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('OS')).toBeInTheDocument();
    expect(screen.getByText('Framework')).toBeInTheDocument();
  });

  it('renders progress indicator', () => {
    renderWithProviders(<QuizQuestion />, { preloadedState: attemptState });
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  it('renders Submit Answer button', () => {
    renderWithProviders(<QuizQuestion />, { preloadedState: attemptState });
    expect(screen.getByRole('button', { name: 'Submit Answer' })).toBeInTheDocument();
  });

  it('Submit button is disabled when no answer is selected', () => {
    renderWithProviders(<QuizQuestion />, { preloadedState: attemptState });
    expect(screen.getByRole('button', { name: 'Submit Answer' })).toBeDisabled();
  });

  it('selecting an option enables the Submit button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuizQuestion />, { preloadedState: attemptState });
    await user.click(screen.getByText('Language'));
    expect(screen.getByRole('button', { name: 'Submit Answer' })).toBeEnabled();
  });

  it('shows Next Question button after submitting answer', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuizQuestion />, { preloadedState: attemptState });
    await user.click(screen.getByText('Language'));
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }));
    expect(screen.getByRole('button', { name: 'Next Question' })).toBeInTheDocument();
  });

  it('shows feedback after submitting correct answer', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuizQuestion />, { preloadedState: attemptState });
    await user.click(screen.getByText('Language'));
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
  });

  it('shows feedback after submitting wrong answer', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuizQuestion />, { preloadedState: attemptState });
    await user.click(screen.getByText('Database'));
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }));
    expect(screen.getByText(/Incorrect/)).toBeInTheDocument();
  });

  it('redirects when no active attempt', () => {
    const noAttemptState = {
      auth: { user: { username: 'alice', id: 1 }, loading: false, error: null },
      attempt: { currentQuiz: null, attemptId: null, answers: [], startTime: null },
    };
    renderWithProviders(<QuizQuestion />, { preloadedState: noAttemptState });
    expect(mockNavigate).toHaveBeenCalledWith('/quiz/42', { replace: true });
  });
});
