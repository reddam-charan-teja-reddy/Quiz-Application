import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers';
import QuizCard from '../../components/QuizCard';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const baseQuiz = {
  id: 42,
  title: 'Test Quiz',
  description: 'A quiz about testing',
  author: 'alice',
  num_questions: 10,
  difficulty: 'medium',
  categories: ['Science', 'Math'],
};

beforeEach(() => mockNavigate.mockClear());

describe('QuizCard', () => {
  it('renders quiz title, description, author and question count', () => {
    renderWithProviders(<QuizCard quiz={baseQuiz} />);
    expect(screen.getByText('Test Quiz')).toBeInTheDocument();
    expect(screen.getByText('A quiz about testing')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('10 questions')).toBeInTheDocument();
  });

  it('shows difficulty badge with correct colour', () => {
    renderWithProviders(<QuizCard quiz={baseQuiz} />);
    const badge = screen.getByText('medium');
    expect(badge).toHaveClass('difficulty-badge');
    expect(badge).toHaveStyle({ background: '#f59e0b' });
  });

  it('shows score when showScore=true and score is provided', () => {
    renderWithProviders(<QuizCard quiz={baseQuiz} showScore score={85} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('does not show score when showScore=false', () => {
    renderWithProviders(<QuizCard quiz={baseQuiz} score={85} />);
    expect(screen.queryByText('85%')).not.toBeInTheDocument();
  });

  it('navigates to /quiz/{id} on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuizCard quiz={baseQuiz} />);
    await user.click(screen.getByRole('button', { name: 'Test Quiz' }));
    expect(mockNavigate).toHaveBeenCalledWith('/quiz/42');
  });

  it('renders category tags', () => {
    renderWithProviders(<QuizCard quiz={baseQuiz} />);
    expect(screen.getByText('Science')).toHaveClass('category-tag');
    expect(screen.getByText('Math')).toHaveClass('category-tag');
  });

  it('does not render categories section when categories is empty', () => {
    renderWithProviders(<QuizCard quiz={{ ...baseQuiz, categories: [] }} />);
    expect(screen.queryByText('Science')).not.toBeInTheDocument();
  });

  it('navigates on Enter keypress', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuizCard quiz={baseQuiz} />);
    const card = screen.getByRole('button', { name: 'Test Quiz' });
    card.focus();
    await user.keyboard('{Enter}');
    expect(mockNavigate).toHaveBeenCalledWith('/quiz/42');
  });

  it('navigates on Space keypress', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuizCard quiz={baseQuiz} />);
    const card = screen.getByRole('button', { name: 'Test Quiz' });
    card.focus();
    await user.keyboard(' ');
    expect(mockNavigate).toHaveBeenCalledWith('/quiz/42');
  });
});
