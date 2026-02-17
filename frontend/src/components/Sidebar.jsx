import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
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
          to='/history'
          className={`nav-item ${isActive('/history') ? 'active' : ''}`}>
          <span className='nav-icon'>📚</span>
          History
        </Link>

        <Link
          to='/profile'
          className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>
          <span className='nav-icon'>👤</span>
          My Profile
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
