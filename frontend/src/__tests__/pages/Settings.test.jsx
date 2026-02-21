import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers';
import Settings from '../../pages/Settings';

const changePasswordMock = vi.fn();

vi.mock('../../store/api/apiSlice', () => ({
  useGetProfileQuery: vi.fn(() => ({ data: { display_name: 'Alice', email: 'alice@example.com' }, isLoading: false })),
  useEditProfileMutation: vi.fn(() => [vi.fn(), {}]),
  useChangePasswordMutation: vi.fn(() => [changePasswordMock, {}]),
  useDeleteAccountMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useImportQuizMutation: vi.fn(() => [vi.fn(), {}]),
  apiSlice: {
    reducerPath: 'api',
    reducer: (state = {}) => state,
    middleware: () => (next) => (action) => next(action),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('Settings', () => {
  beforeEach(() => {
    changePasswordMock.mockReset();
    mockNavigate.mockClear();
  });

  it('shows warning toast when new passwords do not match', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Settings />, {
      preloadedState: {
        auth: { user: { username: 'alice', id: 1 }, loading: false, error: null },
      },
    });

    const [currentInput, newInput, confirmInput] = document.querySelectorAll('input[type="password"]');
    await user.type(currentInput, 'oldpass123');
    await user.type(newInput, 'newpass123');
    await user.type(confirmInput, 'different123');
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match');
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it('calls changePassword mutation with expected payload on valid submit', async () => {
    const user = userEvent.setup();
    changePasswordMock.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ message: 'ok' }),
    });

    renderWithProviders(<Settings />, {
      preloadedState: {
        auth: { user: { username: 'alice', id: 1 }, loading: false, error: null },
      },
    });

    const [currentInput, newInput, confirmInput] = document.querySelectorAll('input[type="password"]');
    await user.type(currentInput, 'oldpass123');
    await user.type(newInput, 'newpass123');
    await user.type(confirmInput, 'newpass123');
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    expect(changePasswordMock).toHaveBeenCalledWith({
      current_password: 'oldpass123',
      new_password: 'newpass123',
    });
  });
});
