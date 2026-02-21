import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers';
import QuizLeaderboard from '../../pages/QuizLeaderboard';

const finishAttemptMock = vi.fn();
const startAttemptMock = vi.fn();

vi.mock('../../store/api/apiSlice', () => ({
  useFinishAttemptMutation: vi.fn(() => [finishAttemptMock, {}]),
  useStartAttemptMutation: vi.fn(() => [startAttemptMock, {}]),
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
    useParams: () => ({ id: 'quiz-42' }),
  };
});

const preloadedState = {
  auth: { user: { username: 'alice', id: 1 }, loading: false, error: null },
  attempt: {
    currentQuiz: {
      id: 'quiz-42',
      title: 'Sample Leaderboard Quiz',
      questions: [
        { id: 'q1', question: '2+2?', options: ['4', '3', '5', '6'], answer: '4', explanation: '' },
      ],
    },
    attemptId: 'attempt-42',
    answers: [{ question_id: 'q1', selected_answer: '4' }],
    answersMap: { q1: '4' },
    correct: [{ id: 'q1', question: '2+2?', answer: '4', explanation: '' }],
    wrong: [],
    startTime: new Date().toISOString(),
  },
};

describe('QuizLeaderboard', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    finishAttemptMock.mockReset();
    startAttemptMock.mockReset();
  });

  it('renders summary after save even when attempt store is cleared', async () => {
    finishAttemptMock.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ score: 100 }),
    });

    renderWithProviders(<QuizLeaderboard />, { preloadedState, initialEntries: ['/quiz/quiz-42/leaderboard'] });

    await waitFor(() => expect(finishAttemptMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Quiz Completed!')).toBeInTheDocument();
    expect(screen.getByText('Sample Leaderboard Quiz')).toBeInTheDocument();
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();
  });

  it('retake uses quiz snapshot from saved results', async () => {
    const user = userEvent.setup();

    finishAttemptMock.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ score: 100 }),
    });
    startAttemptMock.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        attempt_id: 'attempt-43',
        questions: [{ id: 'q1', question: '2+2?', options: ['4', '3', '5', '6'], answer: '4', explanation: '' }],
      }),
    });

    renderWithProviders(<QuizLeaderboard />, { preloadedState, initialEntries: ['/quiz/quiz-42/leaderboard'] });

    await screen.findByText('Quiz Completed!');
    await user.click(screen.getByRole('button', { name: /Retake Quiz/i }));

    await waitFor(() => expect(startAttemptMock).toHaveBeenCalledWith('quiz-42'));
    expect(mockNavigate).toHaveBeenCalledWith('/quiz/quiz-42/0');
  });
});
