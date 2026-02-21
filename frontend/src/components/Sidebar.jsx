import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import './Sidebar.css';

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className='sidebar'>
      <div className='sidebar-header'>
        <h2>QuizApp</h2>
      </div>

      <nav className='sidebar-nav' aria-label="Main navigation">
        <Link
          to='/home'
          className={`nav-item ${isActive('/home') ? 'active' : ''}`}
          aria-label='Home'>
          <span className='nav-icon' aria-hidden='true'>🏠</span>
          Home
        </Link>

        <Link
          to='/plus'
          className={`nav-item ${isActive('/plus') ? 'active' : ''}`}
          aria-label='Create Quiz'>
          <span className='nav-icon' aria-hidden='true'>➕</span>
          Create Quiz
        </Link>

        <Link
          to='/my-quizzes'
          className={`nav-item ${isActive('/my-quizzes') ? 'active' : ''}`}
          aria-label='My Quizzes'>
          <span className='nav-icon' aria-hidden='true'>📝</span>
          My Quizzes
        </Link>

        <Link
          to='/history'
          className={`nav-item ${isActive('/history') ? 'active' : ''}`}
          aria-label='History'>
          <span className='nav-icon' aria-hidden='true'>📚</span>
          History
        </Link>

        <Link
          to='/leaderboard'
          className={`nav-item ${isActive('/leaderboard') ? 'active' : ''}`}
          aria-label='Leaderboard'>
          <span className='nav-icon' aria-hidden='true'>🏆</span>
          Leaderboard
        </Link>

        <Link
          to='/stats'
          className={`nav-item ${isActive('/stats') ? 'active' : ''}`}
          aria-label='Statistics'>
          <span className='nav-icon' aria-hidden='true'>📊</span>
          Statistics
        </Link>

        <Link
          to='/profile'
          className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
          aria-label='My Profile'>
          <span className='nav-icon' aria-hidden='true'>👤</span>
          My Profile
        </Link>

        <Link
          to='/settings'
          className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
          aria-label='Settings'>
          <span className='nav-icon' aria-hidden='true'>⚙️</span>
          Settings
        </Link>

        <Link
          to='/about'
          className={`nav-item ${isActive('/about') ? 'active' : ''}`}
          aria-label='About'>
          <span className='nav-icon' aria-hidden='true'>ℹ️</span>
          About
        </Link>
      </nav>

      <div className='sidebar-footer'>
        <button onClick={handleLogout} className='logout-btn' aria-label='Logout'>
          <span className='nav-icon' aria-hidden='true'>🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
