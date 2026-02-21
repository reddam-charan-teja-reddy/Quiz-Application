import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAppSelector((state) => state.auth);

  if (loading) {
    return <div className='loading'>Loading...</div>;
  }

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  return children;
};

export default ProtectedRoute;
