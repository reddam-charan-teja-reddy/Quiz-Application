import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useAppDispatch } from './store/hooks';
import { restoreSession, forceLogout } from './store/slices/authSlice';
import { setOnAuthFailure } from './lib/api';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import QuizDetail from './pages/QuizDetail';
import QuizQuestion from './pages/QuizQuestion';
import QuizLeaderboard from './pages/QuizLeaderboard';
import History from './pages/History';
import Profile from './pages/Profile';
import CreateQuiz from './pages/CreateQuiz';
import EditQuiz from './pages/EditQuiz';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const dispatch = useAppDispatch();

  // Restore session on mount & wire up auth-failure callback
  useEffect(() => {
    setOnAuthFailure(() => dispatch(forceLogout()));
    dispatch(restoreSession());
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/' element={<Navigate to='/login' replace />} />
            <Route
              path='/home'
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path='/quiz/:id'
              element={
                <ProtectedRoute>
                  <QuizDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path='/quiz/:id/:q_id'
              element={
                <ProtectedRoute>
                  <QuizQuestion />
                </ProtectedRoute>
              }
            />
            <Route
              path='/quiz/:id/leaderboard'
              element={
                <ProtectedRoute>
                  <QuizLeaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path='/history'
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path='/profile'
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path='/plus'
              element={
                <ProtectedRoute>
                  <CreateQuiz />
                </ProtectedRoute>
              }
            />
            <Route
              path='/edit/:id'
              element={
                <ProtectedRoute>
                  <EditQuiz />
                </ProtectedRoute>
              }
            />
            <Route path='*' element={<NotFound />} />
          </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
