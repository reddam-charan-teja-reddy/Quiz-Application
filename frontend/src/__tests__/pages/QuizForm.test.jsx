import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers';
import CreateQuiz from '../../pages/CreateQuiz';
import EditQuiz from '../../pages/EditQuiz';

// Mock RTK Query hooks
vi.mock('../../store/api/apiSlice', () => ({
  useCreateQuizMutation: vi.fn(() => [vi.fn(), {}]),
  useGenerateQuizMutation: vi.fn(() => [vi.fn(), {}]),
  useImportQuizMutation: vi.fn(() => [vi.fn(), {}]),
  useGetQuizQuery: vi.fn(),
  useUpdateQuizMutation: vi.fn(() => [vi.fn(), {}]),
  apiSlice: {
    reducerPath: 'api',
    reducer: (state = {}) => state,
    middleware: () => (next) => (action) => next(action),
  },
}));

import { useCreateQuizMutation, useGetQuizQuery } from '../../store/api/apiSlice';

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

beforeEach(() => mockNavigate.mockClear());

// ---------------------------------------------------------------------------
// CreateQuiz
// ---------------------------------------------------------------------------
describe('CreateQuiz', () => {
  it('renders form with title and description inputs', () => {
    renderWithProviders(<CreateQuiz />, { preloadedState: authedState });
    expect(screen.getByLabelText(/Quiz Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
  });

  it('renders Add Question button', () => {
    renderWithProviders(<CreateQuiz />, { preloadedState: authedState });
    expect(screen.getByRole('button', { name: /Add Question/i })).toBeInTheDocument();
  });

  it('renders AI generation section', () => {
    renderWithProviders(<CreateQuiz />, { preloadedState: authedState });
    expect(screen.getByText(/Generate Quiz with AI/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    renderWithProviders(<CreateQuiz />, { preloadedState: authedState });
    expect(screen.getByRole('button', { name: /Publish Quiz|Save as Draft/i })).toBeInTheDocument();
  });

  it('submits quiz payload with question ids', async () => {
    const user = userEvent.setup();
    const createQuizMock = vi.fn(() => ({
      unwrap: vi.fn().mockResolvedValue({ id: 'quiz-1' }),
    }));
    useCreateQuizMutation.mockReturnValue([createQuizMock, {}]);

    renderWithProviders(<CreateQuiz />, { preloadedState: authedState });

    await user.type(screen.getByLabelText(/Quiz Title/i), 'Payload Test Quiz');
    await user.type(screen.getByLabelText(/Description/i), 'Payload validation test');
    await user.type(screen.getByPlaceholderText(/Category 1/i), 'General');
    await user.type(screen.getByPlaceholderText(/Enter your question/i), 'What is 2+2?');
    await user.type(screen.getByPlaceholderText(/Option A/i), '4');
    await user.type(screen.getByPlaceholderText(/Option B/i), '3');
    await user.type(screen.getByPlaceholderText(/Option C/i), '5');
    await user.type(screen.getByPlaceholderText(/Option D/i), '6');
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[1], '4');

    await user.click(screen.getByRole('button', { name: /Publish Quiz/i }));

    await waitFor(() => expect(createQuizMock).toHaveBeenCalledTimes(1));

    const submitted = createQuizMock.mock.calls[0][0];
    expect(submitted.questions).toHaveLength(1);
    expect(typeof submitted.questions[0].id).toBe('string');
    expect(submitted.questions[0].id.length).toBeGreaterThan(0);
  });

});

// ---------------------------------------------------------------------------
// EditQuiz
// ---------------------------------------------------------------------------
describe('EditQuiz', () => {
  it('shows loading state while fetching quiz', () => {
    useGetQuizQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderWithProviders(<EditQuiz />, { preloadedState: authedState });
    expect(screen.getByText('Loading quiz data...')).toBeInTheDocument();
  });

  it('renders form with quiz data once loaded', () => {
    const quizData = {
      id: 42,
      title: 'Existing Quiz',
      description: 'Edit me',
      author: 'alice',
      categories: ['Science'],
      difficulty: 'easy',
      time_limit_minutes: null,
      time_per_question_seconds: null,
      is_published: true,
      num_questions: 1,
      questions: [
        { id: 'q1', question: 'Q1?', options: ['A', 'B', 'C', 'D'], answer: 'A', explanation: '' },
      ],
    };
    useGetQuizQuery.mockReturnValue({ data: quizData, isLoading: false, error: null });
    renderWithProviders(<EditQuiz />, { preloadedState: authedState });
    expect(screen.getByDisplayValue('Existing Quiz')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Edit me')).toBeInTheDocument();
  });

  it('shows error when quiz fetch fails with 404', () => {
    useGetQuizQuery.mockReturnValue({ data: undefined, isLoading: false, error: { status: 404 } });
    renderWithProviders(<EditQuiz />, { preloadedState: authedState });
    expect(screen.getByText('Quiz not found')).toBeInTheDocument();
  });
});
