import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers';
import ProtectedRoute from '../../components/ProtectedRoute';

describe('ProtectedRoute', () => {
  it('renders children when user is authenticated', () => {
    renderWithProviders(
      <ProtectedRoute><div>Secret Content</div></ProtectedRoute>,
      {
        preloadedState: {
          auth: { user: { username: 'alice' }, loading: false, error: null },
        },
      }
    );
    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });

  it('redirects to /login when user is null and loading is false', () => {
    renderWithProviders(
      <ProtectedRoute><div>Secret Content</div></ProtectedRoute>,
      {
        preloadedState: {
          auth: { user: null, loading: false, error: null },
        },
        initialEntries: ['/protected'],
      }
    );
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('shows loading state when loading is true', () => {
    renderWithProviders(
      <ProtectedRoute><div>Secret Content</div></ProtectedRoute>,
      {
        preloadedState: {
          auth: { user: null, loading: true, error: null },
        },
      }
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });
});
