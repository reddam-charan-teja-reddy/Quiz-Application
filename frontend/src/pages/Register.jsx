import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { register, clearAuthError } from '../store/slices/authSlice';
import { sanitizeText } from '../lib/sanitize';
import './Login.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    dispatch(clearAuthError());

    try {
      await dispatch(register({ username: username.trim(), password })).unwrap();
      navigate('/home');
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'Registration failed');
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
            Create an account to start creating and taking quizzes!
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
              placeholder='Choose a username (min 3 characters)'
              disabled={loading}
            />
          </div>

          <div className='form-group'>
            <label htmlFor='password'>Password</label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Choose a password (min 6 characters)'
              disabled={loading}
            />
          </div>

          <div className='form-group'>
            <label htmlFor='confirmPassword'>Confirm Password</label>
            <input
              id='confirmPassword'
              type='password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder='Confirm your password'
              disabled={loading}
            />
          </div>

          {error && <div className='error-message'>{error}</div>}

          <button type='submit' className='login-btn' disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className='login-footer'>
          <p>
            Already have an account?{' '}
            <Link to='/login' className='register-link'>
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
