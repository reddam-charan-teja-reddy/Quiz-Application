import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import Pagination from '../../components/Pagination';

describe('Pagination', () => {
  it('returns null when totalPages <= 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('returns null when totalPages is 0', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={0} onPageChange={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders correct page buttons for small page count', () => {
    render(<Pagination currentPage={1} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to page 3' })).toBeInTheDocument();
  });

  it('Prev button calls onPageChange with currentPage - 1', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Go to previous page' }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('Next button calls onPageChange with currentPage + 1', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('active page has correct class and aria-current', () => {
    render(<Pagination currentPage={2} totalPages={4} onPageChange={vi.fn()} />);
    const activeBtn = screen.getByRole('button', { name: 'Go to page 2' });
    expect(activeBtn).toHaveClass('active');
    expect(activeBtn).toHaveAttribute('aria-current', 'page');
  });

  it('non-active page does not have active class', () => {
    render(<Pagination currentPage={2} totalPages={4} onPageChange={vi.fn()} />);
    const btn = screen.getByRole('button', { name: 'Go to page 1' });
    expect(btn).not.toHaveClass('active');
  });

  it('Prev button is disabled on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled();
  });

  it('Next button is disabled on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
  });

  it('clicking a page button calls onPageChange with that page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Go to page 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('has navigation landmark with aria-label', () => {
    render(<Pagination currentPage={1} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });
});
