import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, clearAuthError } from '../store/slices/authSlice';
import { sanitizeText } from '../lib/sanitize';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();
  const authError = useAppSelector((state) => state.auth.error);
  const navigate = useNavigate();

  useEffect(() => { document.title = 'Login — QuizApp'; }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    if (!password) {
      setError('Please enter a password');
      return;
    }

    setLoading(true);
    setError('');
    dispatch(clearAuthError());

    try {
      const result = await dispatch(login({ username: username.trim(), password })).unwrap();
      if (result) navigate('/home');
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-container'>
      <div className='login-card'>
        <div className='login-header'>
          <h1>QuizApp</h1>
          <p className='app-description'>
            Welcome to QuizApp! Test your knowledge, create quizzes, and
            challenge yourself with interactive learning experiences.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='login-form'>
          <div className='form-group'>
            <label htmlFor='username'>Username</label>
            <input
              id='username'
              type='text'
              value={username}
              onChange={(e) => setUsername(sanitizeText(e.target.value, 50))}
              placeholder='Enter your username'
              disabled={loading}
              aria-invalid={!!error}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>

          <div className='form-group'>
            <label htmlFor='password'>Password</label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter your password'
              disabled={loading}
              aria-invalid={!!error}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>

          {error && <div id='login-error' className='error-message' role='alert'>{error}</div>}

          <button type='submit' className='login-btn' disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className='login-footer'>
          <p>
            Don't have an account?{' '}
            <Link to='/register' className='register-link'>
              Register here
            </Link>
          </p>
        </div>

        <div className='login-features'>
          <h3>Features</h3>
          <ul>
            <li>📝 Create custom quizzes</li>
            <li>🤖 AI-powered quiz generation</li>
            <li>📊 Track your progress</li>
            <li>🎯 Challenge yourself with various topics</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
