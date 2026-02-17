import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QuizProvider } from './contexts/QuizContext';
import Login from './pages/Login';
import Home from './pages/Home';
import QuizDetail from './pages/QuizDetail';
import QuizQuestion from './pages/QuizQuestion';
import QuizLeaderboard from './pages/QuizLeaderboard';
import History from './pages/History';
import Profile from './pages/Profile';
import CreateQuiz from './pages/CreateQuiz';
import EditQuiz from './pages/EditQuiz';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <QuizProvider>
          <Routes>
            <Route path='/login' element={<Login />} />
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
          </Routes>
        </QuizProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
