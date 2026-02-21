import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ShareButton from '../../components/ShareButton';
import ErrorBoundary from '../../components/ErrorBoundary';

// ── LoadingSpinner ──────────────────────────────────────────────

describe('LoadingSpinner', () => {
  it('renders default loading text', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders custom text', () => {
    render(<LoadingSpinner text="Please wait" />);
    expect(screen.getByText('Please wait')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('hides text when text is empty string', () => {
    const { container } = render(<LoadingSpinner text="" />);
    expect(container.querySelector('.loading-text')).not.toBeInTheDocument();
  });

  it('applies size variant class', () => {
    const { container } = render(<LoadingSpinner size="large" />);
    expect(container.querySelector('.loading-spinner-container')).toHaveClass('large');
  });

  it('applies default medium size class', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.loading-spinner-container')).toHaveClass('medium');
  });

  it('renders spinner element', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });
});

// ── EmptyState ──────────────────────────────────────────────────

describe('EmptyState', () => {
  it('renders icon, title, and message', () => {
    render(<EmptyState icon="🔍" title="No results" message="Try another search" />);
    expect(screen.getByText('🔍')).toBeInTheDocument();
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('Try another search')).toBeInTheDocument();
  });

  it('renders default icon', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByText('📭')).toBeInTheDocument();
  });

  it('renders action button when action is provided', () => {
    const action = vi.fn();
    render(<EmptyState title="Empty" action={action} actionText="Create One" />);
    expect(screen.getByRole('button', { name: 'Create One' })).toBeInTheDocument();
  });

  it('action button calls the action callback', async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(<EmptyState title="Empty" action={action} actionText="Go" />);
    await user.click(screen.getByRole('button', { name: 'Go' }));
    expect(action).toHaveBeenCalledOnce();
  });

  it('renders default action text when actionText is not provided', () => {
    render(<EmptyState title="Empty" action={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();
  });

  it('does not render button when action is not provided', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not render message when not provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.querySelector('.empty-state-message')).not.toBeInTheDocument();
  });
});

// ── ShareButton ─────────────────────────────────────────────────

describe('ShareButton', () => {
  beforeEach(() => {
    // navigator.share is typically not available in jsdom
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it('renders with aria-label', () => {
    render(<ShareButton title="My Quiz" url="https://example.com" />);
    expect(screen.getByRole('button', { name: 'Share quiz' })).toBeInTheDocument();
  });

  it('copies URL on click (no navigator.share)', async () => {
    const user = userEvent.setup();
    render(<ShareButton title="My Quiz" url="https://example.com/quiz/1" />);
    // Spy after setup so we capture the clipboard user-event may have wired up
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    await user.click(screen.getByRole('button', { name: 'Share quiz' }));
    expect(writeTextSpy).toHaveBeenCalledWith('https://example.com/quiz/1');
    writeTextSpy.mockRestore();
  });

  it('shows copied feedback after click', async () => {
    const user = userEvent.setup();
    render(<ShareButton title="My Quiz" url="https://example.com" />);
    await user.click(screen.getByRole('button', { name: 'Share quiz' }));
    expect(screen.getByText(/copied/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Link copied' })).toBeInTheDocument();
  });

  it('renders share text initially', () => {
    render(<ShareButton title="Quiz" />);
    expect(screen.getByText(/share/i)).toBeInTheDocument();
  });
});

// ── ErrorBoundary ───────────────────────────────────────────────

describe('ErrorBoundary', () => {
  // Suppress console.error for intentional throws
  const originalError = console.error;
  beforeAll(() => { console.error = vi.fn(); });
  afterAll(() => { console.error = originalError; });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Normal Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal Content')).toBeInTheDocument();
  });

  it('shows error UI when a child throws', () => {
    const ThrowingComponent = () => { throw new Error('boom'); };
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
  });

  it('shows Try Again and Go Home buttons on error', () => {
    const ThrowingComponent = () => { throw new Error('boom'); };
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go Home' })).toBeInTheDocument();
  });

  it('Try Again resets the error state', async () => {
    const user = userEvent.setup();
    let shouldThrow = true;
    const MaybeThrow = () => {
      if (shouldThrow) throw new Error('boom');
      return <div>Recovered</div>;
    };
    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});
