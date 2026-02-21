import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import Sidebar from '../components/Sidebar';
import './History.css';

const History = () => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/v1/attempts');

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setAttempts(data.attempts || []);
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
      <div className='history-container'>
        <Sidebar />
        <div className='history-content'>
          <div className='loading-state'>
            <div className='spinner'></div>
            <p>Loading your quiz history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='history-container'>
        <Sidebar />
        <div className='history-content'>
          <div className='error-state'>
            <div className='error-icon'>⚠️</div>
            <h2>Error Loading History</h2>
            <p>{error}</p>
            <button onClick={fetchHistory} className='retry-btn'>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='history-container'>
      <Sidebar />

      <div className='history-content'>
        <div className='history-header'>
          <h1>Quiz History</h1>
          <p>Review your past quiz attempts and track your progress</p>
        </div>

        {attempts.length === 0 ? (
          <div className='empty-history'>
            <div className='empty-icon'>📚</div>
            <h3>No Quiz History</h3>
            <p>
              You haven't taken any quizzes yet. Start by taking a quiz to see
              your history here!
            </p>
          </div>
        ) : (
          <div className='history-grid'>
            {attempts.map((attempt) => {
              const wrongCount = attempt.total - attempt.correct_count;

              return (
                <div key={attempt.attempt_id} className='history-item'>
                  <div className='history-card'>
                    <h3>{attempt.quiz_title || 'Untitled Quiz'}</h3>
                    {attempt.created_at && (
                      <p className='attempt-date'>
                        {new Date(attempt.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className='attempt-details'>
                    <div className='attempt-stats'>
                      <div className='stat-item'>
                        <span className='stat-label'>Correct:</span>
                        <span className='stat-value correct'>
                          {attempt.correct_count}
                        </span>
                      </div>
                      <div className='stat-item'>
                        <span className='stat-label'>Wrong:</span>
                        <span className='stat-value wrong'>
                          {wrongCount}
                        </span>
                      </div>
                      <div className='stat-item'>
                        <span className='stat-label'>Total:</span>
                        <span className='stat-value'>{attempt.total}</span>
                      </div>
                    </div>

                    <div className='score-display'>
                      <div
                        className='score-badge'
                        style={{
                          background: getScoreColor(attempt.score),
                          color: 'white',
                        }}>
                        {attempt.score}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {attempts.length > 0 && (
          <div className='history-summary'>
            <h3>Overall Statistics</h3>
            <div className='summary-stats'>
              <div className='summary-item'>
                <div className='summary-number'>{attempts.length}</div>
                <div className='summary-label'>Quizzes Taken</div>
              </div>
              <div className='summary-item'>
                <div className='summary-number'>
                  {Math.round(
                    attempts.reduce((acc, a) => acc + a.score, 0) /
                      attempts.length
                  )}
                  %
                </div>
                <div className='summary-label'>Average Score</div>
              </div>
              <div className='summary-item'>
                <div className='summary-number'>
                  {Math.max(...attempts.map((a) => a.score))}%
                </div>
                <div className='summary-label'>Best Score</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
