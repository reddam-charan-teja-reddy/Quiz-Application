import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import QuizTimer from '../../components/QuizTimer';

describe('QuizTimer', () => {
  it('renders formatted time remaining (mm:ss)', () => {
    render(<QuizTimer totalSeconds={125} onTimeUp={vi.fn()} />);
    expect(screen.getByText('02:05')).toBeInTheDocument();
  });

  it('pads single-digit values with leading zeros', () => {
    render(<QuizTimer totalSeconds={61} onTimeUp={vi.fn()} />);
    expect(screen.getByText('01:01')).toBeInTheDocument();
  });

  it('renders 00:00 when totalSeconds is 0', () => {
    render(<QuizTimer totalSeconds={0} onTimeUp={vi.fn()} />);
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('has aria-live="polite"', () => {
    render(<QuizTimer totalSeconds={60} onTimeUp={vi.fn()} />);
    const timer = screen.getByLabelText(/time remaining/i);
    expect(timer).toHaveAttribute('aria-live', 'polite');
  });

  it('has an accessible label with time info', () => {
    render(<QuizTimer totalSeconds={90} onTimeUp={vi.fn()} />);
    expect(screen.getByLabelText('Time remaining: 1 minutes and 30 seconds')).toBeInTheDocument();
  });

  it('applies low class when remaining <= 30', () => {
    render(<QuizTimer totalSeconds={25} onTimeUp={vi.fn()} />);
    const timer = screen.getByLabelText(/time remaining/i);
    expect(timer).toHaveClass('low');
  });

  it('applies critical class when remaining <= 10', () => {
    render(<QuizTimer totalSeconds={5} onTimeUp={vi.fn()} />);
    const timer = screen.getByLabelText(/time remaining/i);
    expect(timer).toHaveClass('critical');
  });

  it('renders timer bar', () => {
    const { container } = render(<QuizTimer totalSeconds={100} onTimeUp={vi.fn()} />);
    expect(container.querySelector('.timer-bar')).toBeInTheDocument();
    expect(container.querySelector('.timer-fill')).toBeInTheDocument();
  });
});
