import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            textAlign: 'center',
            background: '#f9fafb',
            color: '#1f2937',
          }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem', maxWidth: 480 }}>
            An unexpected error occurred. You can try refreshing the page or
            going back to the home screen.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: 8,
                border: 'none',
                background: '#667eea',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
              }}>
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = '/home')}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: '#fff',
                color: '#374151',
                cursor: 'pointer',
                fontWeight: 600,
              }}>
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
