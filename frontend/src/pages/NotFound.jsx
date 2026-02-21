import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

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
      <h1 style={{ fontSize: '5rem', margin: 0, color: '#667eea' }}>404</h1>
      <h2 style={{ marginBottom: '0.5rem' }}>Page Not Found</h2>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem', maxWidth: 420 }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <button
        onClick={() => navigate('/home')}
        style={{
          padding: '0.625rem 1.25rem',
          borderRadius: 8,
          border: 'none',
          background: '#667eea',
          color: '#fff',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '1rem',
        }}>
        Back to Home
      </button>
    </div>
  );
};

export default NotFound;
