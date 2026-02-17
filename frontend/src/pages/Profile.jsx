import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [user]);

  useEffect(() => {
    // Show success message from navigation state
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from history state
      navigate(location.pathname, { replace: true, state: {} });
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [location.state, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          token: user.token,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfileData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className='profile-container'>
        <Sidebar />
        <div className='profile-content'>
          <div className='loading-state'>
            <div className='spinner'></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='profile-container'>
        <Sidebar />
        <div className='profile-content'>
          {successMessage && (
            <div className='success-banner'>
              <span>✅ {successMessage}</span>
              <button
                onClick={() => setSuccessMessage('')}
                className='close-success'>
                ✕
              </button>
            </div>
          )}
          <div className='error-state'>
            <div className='error-icon'>⚠️</div>
            <h2>Error Loading Profile</h2>
            <p>{error}</p>
            <button onClick={fetchProfile} className='retry-btn'>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className='profile-container'>
        <Sidebar />
        <div className='profile-content'>
          <div className='error-state'>
            <h2>Profile Not Found</h2>
            <p>Unable to load profile data.</p>
          </div>
        </div>
      </div>
    );
  }

  const averageScore =
    profileData.history.length > 0
      ? Math.round(
          profileData.history.reduce((acc, attempt) => acc + attempt.score, 0) /
            profileData.history.length
        )
      : 0;

  const totalQuizzesTaken = profileData.history.length;
  const totalQuestionsAnswered = profileData.history.reduce(
    (acc, attempt) => acc + attempt.total,
    0
  );
  const totalCorrectAnswers = profileData.history.reduce(
    (acc, attempt) => acc + attempt.correct.length,
    0
  );

  return (
    <div className='profile-container'>
      <Sidebar />

      <div className='profile-content'>
        {successMessage && (
          <div className='success-banner'>
            <span>✅ {successMessage}</span>
            <button
              onClick={() => setSuccessMessage('')}
              className='close-success'>
              ✕
            </button>
          </div>
        )}

        <div className='profile-header'>
          <div className='profile-avatar'>
            <div className='avatar-circle'>
              {user.username.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className='profile-info'>
            <h1>{user.username}</h1>
            <p className='user-status'>{user.status}</p>
          </div>
        </div>

        <div className='profile-stats'>
          <div className='stats-grid'>
            <div className='stat-card'>
              <div className='stat-icon'>🎯</div>
              <div className='stat-number'>{averageScore}%</div>
              <div className='stat-label'>Average Score</div>
            </div>

            <div className='stat-card'>
              <div className='stat-icon'>📚</div>
              <div className='stat-number'>{totalQuizzesTaken}</div>
              <div className='stat-label'>Quizzes Taken</div>
            </div>

            <div className='stat-card'>
              <div className='stat-icon'>✅</div>
              <div className='stat-number'>{totalCorrectAnswers}</div>
              <div className='stat-label'>Correct Answers</div>
            </div>

            <div className='stat-card'>
              <div className='stat-icon'>❓</div>
              <div className='stat-number'>{totalQuestionsAnswered}</div>
              <div className='stat-label'>Total Questions</div>
            </div>
          </div>
        </div>

        <div className='profile-sections'>
          <div className='section'>
            <h2>Created Quizzes</h2>
            {profileData.created_quizzes.length === 0 ? (
              <div className='empty-section'>
                <div className='empty-icon'>📝</div>
                <p>You haven't created any quizzes yet.</p>
              </div>
            ) : (
              <div className='created-quizzes'>
                {profileData.created_quizzes.map((quiz) => (
                  <div key={quiz.id} className='created-quiz-item'>
                    <div className='quiz-icon'>📋</div>
                    <div className='quiz-details'>
                      <h3>{quiz.title}</h3>
                      <p>Quiz ID: {quiz.id}</p>
                    </div>
                    <div className='quiz-actions'>
                      <button
                        onClick={() => navigate(`/quiz/${quiz.id}`)}
                        className='view-quiz-btn'>
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/edit/${quiz.id}`)}
                        className='edit-quiz-btn'>
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className='section'>
            <h2>Recent Quiz History</h2>
            {profileData.history.length === 0 ? (
              <div className='empty-section'>
                <div className='empty-icon'>📊</div>
                <p>No quiz attempts yet.</p>
              </div>
            ) : (
              <div className='recent-history'>
                {profileData.history
                  .slice(-5)
                  .reverse()
                  .map((attempt, index) => (
                    <div key={index} className='history-item'>
                      <div className='history-icon'>🎯</div>
                      <div className='history-details'>
                        <div className='history-text'>
                          <span className='quiz-id'>
                            Quiz: {attempt.quiz_id}
                          </span>
                          <span className='attempt-info'>
                            {attempt.correct.length}/{attempt.total} correct
                          </span>
                        </div>
                        <div
                          className='history-score'
                          style={{ color: getScoreColor(attempt.score) }}>
                          {attempt.score}%
                        </div>
                      </div>
                    </div>
                  ))}

                {profileData.history.length > 5 && (
                  <div className='view-all'>
                    <p>
                      View all {profileData.history.length} attempts in History
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {profileData.history.length > 0 && (
          <div className='performance-summary'>
            <h2>Performance Summary</h2>
            <div className='performance-grid'>
              <div className='performance-item'>
                <div className='performance-label'>Best Score</div>
                <div
                  className='performance-value'
                  style={{
                    color: getScoreColor(
                      Math.max(...profileData.history.map((h) => h.score))
                    ),
                  }}>
                  {Math.max(...profileData.history.map((h) => h.score))}%
                </div>
              </div>

              <div className='performance-item'>
                <div className='performance-label'>Total Correct</div>
                <div className='performance-value correct'>
                  {totalCorrectAnswers}
                </div>
              </div>

              <div className='performance-item'>
                <div className='performance-label'>Accuracy Rate</div>
                <div className='performance-value'>
                  {totalQuestionsAnswered > 0
                    ? Math.round(
                        (totalCorrectAnswers / totalQuestionsAnswered) * 100
                      )
                    : 0}
                  %
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
