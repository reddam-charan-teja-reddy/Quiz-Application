import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import Toast from '../../components/Toast';

describe('Toast', () => {
  it('renders message', () => {
    render(<Toast message="Something happened" />);
    expect(screen.getByText('Something happened')).toBeInTheDocument();
  });

  it('returns null when message is falsy', () => {
    const { container } = render(<Toast message="" />);
    expect(container.innerHTML).toBe('');
  });

  it('has role="alert" and aria-live="assertive"', () => {
    render(<Toast message="Alert!" />);
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'assertive');
  });

  it('close button calls onClose', async () => {
    const onClose = vi.fn();
    render(<Toast message="Closeable" onClose={onClose} duration={0} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Close notification' }));
    // The component sets visible=false then calls onClose after a 300ms setTimeout
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('shows correct icon for success type', () => {
    render(<Toast message="Success" type="success" />);
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('shows correct icon for error type', () => {
    render(<Toast message="Error" type="error" />);
    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  it('shows correct icon for info type (default)', () => {
    render(<Toast message="Info" />);
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  it('shows correct icon for warning type', () => {
    render(<Toast message="Warn" type="warning" />);
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('applies toast-type class', () => {
    render(<Toast message="Styled" type="error" />);
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('toast-error');
  });
});
