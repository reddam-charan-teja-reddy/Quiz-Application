import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers';
import Sidebar from '../../components/Sidebar';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => mockNavigate.mockClear());

describe('Sidebar', () => {
  it('renders navigation links', () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create Quiz' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My Quizzes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'History' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leaderboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Statistics' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My Profile' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });

  it('shows active state for current route', () => {
    renderWithProviders(<Sidebar />, { initialEntries: ['/home'] });
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveClass('active');
  });

  it('does not show active state for non-matching route', () => {
    renderWithProviders(<Sidebar />, { initialEntries: ['/history'] });
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).not.toHaveClass('active');
    const historyLink = screen.getByRole('link', { name: 'History' });
    expect(historyLink).toHaveClass('active');
  });

  it('renders the QuizApp header', () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getByText('QuizApp')).toBeInTheDocument();
  });

  it('logout button dispatches logout and navigates to /login', async () => {
    const user = userEvent.setup();
    // Mock fetch so the logout thunk does not make real requests
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

    renderWithProviders(<Sidebar />, {
      preloadedState: {
        auth: { user: { username: 'bob' }, loading: false, error: null },
      },
    });

    await user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
