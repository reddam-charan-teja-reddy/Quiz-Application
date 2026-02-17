import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(username.trim());
      navigate('/home');
    } catch (err) {
      setError(err.message);
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
              onChange={(e) => setUsername(e.target.value)}
              placeholder='Enter your username'
              disabled={loading}
            />
          </div>

          {error && <div className='error-message'>{error}</div>}

          <button type='submit' className='login-btn' disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

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
