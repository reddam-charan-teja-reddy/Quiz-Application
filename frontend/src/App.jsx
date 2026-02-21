import { lazy, Suspense, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { useAppDispatch } from './store/hooks';
import { restoreSession, forceLogout } from './store/slices/authSlice';
import { setOnAuthFailure } from './lib/api';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Lazy-loaded pages — each gets its own chunk for code splitting
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Home = lazy(() => import('./pages/Home'));
const QuizDetail = lazy(() => import('./pages/QuizDetail'));
const QuizQuestion = lazy(() => import('./pages/QuizQuestion'));
const QuizLeaderboard = lazy(() => import('./pages/QuizLeaderboard'));
const QuizRankings = lazy(() => import('./pages/QuizRankings'));
const History = lazy(() => import('./pages/History'));
const AttemptDetail = lazy(() => import('./pages/AttemptDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const CreateQuiz = lazy(() => import('./pages/CreateQuiz'));
const EditQuiz = lazy(() => import('./pages/EditQuiz'));
const MyQuizzes = lazy(() => import('./pages/MyQuizzes'));
const Settings = lazy(() => import('./pages/Settings'));
const GlobalLeaderboard = lazy(() => import('./pages/GlobalLeaderboard'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const About = lazy(() => import('./pages/About'));

/** Scroll to top and manage focus on route changes for accessibility. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const main = document.getElementById('main-content');
    if (main) main.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}

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
        <ScrollToTop />
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        <main id="main-content" tabIndex={-1}>
        <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
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
              path='/quiz/:id/rankings'
              element={
                <ProtectedRoute>
                  <QuizRankings />
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
              path='/attempt/:attemptId'
              element={
                <ProtectedRoute>
                  <AttemptDetail />
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
            <Route
              path='/my-quizzes'
              element={
                <ProtectedRoute>
                  <MyQuizzes />
                </ProtectedRoute>
              }
            />
            <Route
              path='/settings'
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path='/leaderboard'
              element={
                <ProtectedRoute>
                  <GlobalLeaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path='/stats'
              element={
                <ProtectedRoute>
                  <StatsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path='/about'
              element={
                <ProtectedRoute>
                  <About />
                </ProtectedRoute>
              }
            />
            <Route path='*' element={<NotFound />} />
          </Routes>
        </Suspense>
        </main>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
