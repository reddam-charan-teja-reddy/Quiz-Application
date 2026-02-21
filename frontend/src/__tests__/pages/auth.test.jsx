import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers';
import Login from '../../pages/Login';
import Register from '../../pages/Register';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => mockNavigate.mockClear());

const authState = { auth: { user: null, loading: false, error: null } };

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
describe('Login', () => {
  it('renders username and password fields', () => {
    renderWithProviders(<Login />, { preloadedState: authState });
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders submit button with "Login" text', () => {
    renderWithProviders(<Login />, { preloadedState: authState });
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('renders link to register page', () => {
    renderWithProviders(<Login />, { preloadedState: authState });
    const link = screen.getByRole('link', { name: /register here/i });
    expect(link).toHaveAttribute('href', '/register');
  });

  it('shows error when submitting empty username', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, { preloadedState: authState });
    await user.click(screen.getByRole('button', { name: 'Login' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a username');
  });

  it('shows error when submitting empty password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, { preloadedState: authState });
    await user.type(screen.getByLabelText('Username'), 'testuser');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a password');
  });

  it('sets aria-invalid on inputs when error is present', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, { preloadedState: authState });
    await user.click(screen.getByRole('button', { name: 'Login' }));
    expect(screen.getByLabelText('Username')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
  });

});

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
describe('Register', () => {
  it('renders username, password, and confirm password fields', () => {
    renderWithProviders(<Register />, { preloadedState: authState });
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('renders submit button with "Register" text', () => {
    renderWithProviders(<Register />, { preloadedState: authState });
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    renderWithProviders(<Register />, { preloadedState: authState });
    const link = screen.getByRole('link', { name: /login here/i });
    expect(link).toHaveAttribute('href', '/login');
  });

  it('shows error when submitting empty username', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />, { preloadedState: authState });
    await user.click(screen.getByRole('button', { name: 'Register' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a username');
  });

  it('shows error when username is too short', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />, { preloadedState: authState });
    await user.type(screen.getByLabelText('Username'), 'ab');
    await user.click(screen.getByRole('button', { name: 'Register' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Username must be at least 3 characters');
  });

  it('shows error when password is too short', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />, { preloadedState: authState });
    await user.type(screen.getByLabelText('Username'), 'testuser');
    await user.type(screen.getByLabelText('Password'), '12345');
    await user.click(screen.getByRole('button', { name: 'Register' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Password must be at least 6 characters');
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />, { preloadedState: authState });
    await user.type(screen.getByLabelText('Username'), 'testuser');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'differentpassword');
    await user.click(screen.getByRole('button', { name: 'Register' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match');
  });

  it('sets aria-invalid on inputs when error is present', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />, { preloadedState: authState });
    await user.click(screen.getByRole('button', { name: 'Register' }));
    expect(screen.getByLabelText('Username')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Confirm Password')).toHaveAttribute('aria-invalid', 'true');
  });
});
