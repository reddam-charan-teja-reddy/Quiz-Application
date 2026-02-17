import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuiz } from '../contexts/QuizContext';
import Sidebar from '../components/Sidebar';
import QuizCard from '../components/QuizCard';
import './History.css';

const History = () => {
  const { user } = useAuth();
  const { quizzes } = useQuiz();
  const [history, setHistory] = useState([]);
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
      const response = await fetch('http://localhost:8000/api/history', {
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
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setHistory(data.history || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getQuizById = (quizId) => {
    return quizzes.find((quiz) => quiz.id === quizId);
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

        {history.length === 0 ? (
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
            {history.map((attempt, index) => {
              const quiz = getQuizById(attempt.quiz_id);

              if (!quiz) {
                return (
                  <div key={index} className='history-card missing-quiz'>
                    <h3>Quiz Not Found</h3>
                    <p>Quiz ID: {attempt.quiz_id}</p>
                    <div
                      className='attempt-score'
                      style={{ color: getScoreColor(attempt.score) }}>
                      {attempt.score}%
                    </div>
                  </div>
                );
              }

              return (
                <div key={index} className='history-item'>
                  <QuizCard
                    quiz={quiz}
                    showScore={true}
                    score={attempt.score}
                  />
                  <div className='attempt-details'>
                    <div className='attempt-stats'>
                      <div className='stat-item'>
                        <span className='stat-label'>Correct:</span>
                        <span className='stat-value correct'>
                          {attempt.correct.length}
                        </span>
                      </div>
                      <div className='stat-item'>
                        <span className='stat-label'>Wrong:</span>
                        <span className='stat-value wrong'>
                          {attempt.wrong.length}
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

        {history.length > 0 && (
          <div className='history-summary'>
            <h3>Overall Statistics</h3>
            <div className='summary-stats'>
              <div className='summary-item'>
                <div className='summary-number'>{history.length}</div>
                <div className='summary-label'>Quizzes Taken</div>
              </div>
              <div className='summary-item'>
                <div className='summary-number'>
                  {Math.round(
                    history.reduce((acc, attempt) => acc + attempt.score, 0) /
                      history.length
                  )}
                  %
                </div>
                <div className='summary-label'>Average Score</div>
              </div>
              <div className='summary-item'>
                <div className='summary-number'>
                  {Math.max(...history.map((attempt) => attempt.score))}%
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
