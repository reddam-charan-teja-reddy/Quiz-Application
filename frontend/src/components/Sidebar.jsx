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

      <nav className='sidebar-nav'>
        <Link
          to='/home'
          className={`nav-item ${isActive('/home') ? 'active' : ''}`}>
          <span className='nav-icon'>🏠</span>
          Home
        </Link>

        <Link
          to='/plus'
          className={`nav-item ${isActive('/plus') ? 'active' : ''}`}>
          <span className='nav-icon'>➕</span>
          Create Quiz
        </Link>

        <Link
          to='/my-quizzes'
          className={`nav-item ${isActive('/my-quizzes') ? 'active' : ''}`}>
          <span className='nav-icon'>📝</span>
          My Quizzes
        </Link>

        <Link
          to='/history'
          className={`nav-item ${isActive('/history') ? 'active' : ''}`}>
          <span className='nav-icon'>📚</span>
          History
        </Link>

        <Link
          to='/leaderboard'
          className={`nav-item ${isActive('/leaderboard') ? 'active' : ''}`}>
          <span className='nav-icon'>🏆</span>
          Leaderboard
        </Link>

        <Link
          to='/stats'
          className={`nav-item ${isActive('/stats') ? 'active' : ''}`}>
          <span className='nav-icon'>📊</span>
          Statistics
        </Link>

        <Link
          to='/profile'
          className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>
          <span className='nav-icon'>👤</span>
          My Profile
        </Link>

        <Link
          to='/settings'
          className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
          <span className='nav-icon'>⚙️</span>
          Settings
        </Link>
      </nav>

      <div className='sidebar-footer'>
        <button onClick={handleLogout} className='logout-btn'>
          <span className='nav-icon'>🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
