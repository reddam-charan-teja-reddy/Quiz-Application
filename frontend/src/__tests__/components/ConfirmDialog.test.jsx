import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import ConfirmDialog from '../../components/ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    title: 'Delete Item',
    message: 'Are you sure you want to delete?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    defaultProps.onConfirm.mockClear();
    defaultProps.onCancel.mockClear();
  });

  it('renders nothing when open is false', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} open={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders title and message', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete?')).toBeInTheDocument();
  });

  it('confirm button calls onConfirm', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(defaultProps.onConfirm).toHaveBeenCalledOnce();
  });

  it('cancel button calls onCancel', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });

  it('has role="dialog" and aria-modal="true"', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-labelledby pointing to the title', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-dialog-title');
    expect(screen.getByText('Delete Item')).toHaveAttribute('id', 'confirm-dialog-title');
  });

  it('shows Processing text when loading', () => {
    render(<ConfirmDialog {...defaultProps} loading />);
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('uses custom confirmText and cancelText', () => {
    render(<ConfirmDialog {...defaultProps} confirmText="Yes" cancelText="No" />);
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  });

  it('clicking overlay calls onCancel', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);
    // The overlay is the dialog element itself
    await user.click(screen.getByRole('dialog'));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });
});
