import { useState, useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import { useGetProfileQuery } from '../store/api/apiSlice';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import './Profile.css';

const Profile = () => {
  const { user } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: profileData, isLoading, error: fetchError, refetch } = useGetProfileQuery();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [location.state, navigate]);

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (isLoading) {
    return (
      <div className='profile-container'>
        <Sidebar />
        <div className='profile-content'>
          <LoadingSpinner text='Loading your profile...' />
        </div>
      </div>
    );
  }

  if (fetchError) {
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
            <p>{fetchError?.data?.detail || 'Failed to fetch profile'}</p>
            <button onClick={refetch} className='retry-btn'>
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

  const displayName = profileData.display_name || user.username;
  const averageScore = Math.round(profileData.average_score ?? 0);
  const bestScore = Math.round(profileData.best_score ?? 0);
  const totalQuizzesTaken = profileData.total_attempts ?? 0;
  const totalQuizzesCreated = profileData.created_quizzes?.length ?? 0;
  const memberSince = profileData.created_at
    ? new Date(profileData.created_at).toLocaleDateString()
    : 'N/A';

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
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className='profile-info'>
            <h1>{displayName}</h1>
            {profileData.display_name && profileData.display_name !== user.username && (
              <p className='username-sub'>@{user.username}</p>
            )}
            {profileData.email && (
              <p className='user-email'>{profileData.email}</p>
            )}
            <p className='member-since'>Member since {memberSince}</p>
          </div>
          <div className='profile-header-actions'>
            <button onClick={() => navigate('/settings')} className='settings-link-btn'>
              ⚙️ Settings
            </button>
            <button onClick={() => navigate('/stats')} className='stats-link-btn'>
              📊 Statistics
            </button>
          </div>
        </div>

        <div className='profile-stats'>
          <div className='stats-grid'>
            <div className='stat-card'>
              <div className='stat-icon'>🎯</div>
              <div
                className='stat-number'
                style={{ color: totalQuizzesTaken > 0 ? getScoreColor(averageScore) : undefined }}>
                {averageScore}%
              </div>
              <div className='stat-label'>Average Score</div>
            </div>

            <div className='stat-card'>
              <div className='stat-icon'>🏆</div>
              <div
                className='stat-number'
                style={{ color: totalQuizzesTaken > 0 ? '#10b981' : undefined }}>
                {bestScore}%
              </div>
              <div className='stat-label'>Best Score</div>
            </div>

            <div className='stat-card'>
              <div className='stat-icon'>📚</div>
              <div className='stat-number'>{totalQuizzesTaken}</div>
              <div className='stat-label'>Quizzes Taken</div>
            </div>

            <div className='stat-card'>
              <div className='stat-icon'>📝</div>
              <div className='stat-number'>{totalQuizzesCreated}</div>
              <div className='stat-label'>Quizzes Created</div>
            </div>
          </div>
        </div>

        <div className='profile-sections'>
          <div className='section'>
            <h2>Created Quizzes</h2>
            {totalQuizzesCreated === 0 ? (
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
                      <p>
                        {quiz.num_questions} questions
                        {quiz.difficulty && ` · ${quiz.difficulty}`}
                      </p>
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

          {totalQuizzesTaken > 0 && (
            <div className='section'>
              <h2>Quiz Performance</h2>
              <div className='performance-summary'>
                <div className='performance-grid'>
                  <div className='performance-item'>
                    <div className='performance-label'>Total Attempts</div>
                    <div className='performance-value'>{totalQuizzesTaken}</div>
                  </div>

                  <div className='performance-item'>
                    <div className='performance-label'>Average Score</div>
                    <div
                      className='performance-value'
                      style={{ color: getScoreColor(averageScore) }}>
                      {averageScore}%
                    </div>
                  </div>
                </div>

                <div className='view-all'>
                  <button
                    onClick={() => navigate('/history')}
                    className='view-history-btn'>
                    View Full History
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
