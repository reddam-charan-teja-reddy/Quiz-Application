import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useGetHistoryQuery, useDeleteAttemptMutation } from '../store/api/apiSlice';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './History.css';

const History = () => {
  const navigate = useNavigate();
  const { data: attempts = [], isLoading, error, refetch } = useGetHistoryQuery();
  const [deleteAttempt, { isLoading: deleting }] = useDeleteAttemptMutation();

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { document.title = 'History — QuizApp'; }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteAttempt(confirmDelete).unwrap();
      setToast({ message: 'Attempt deleted', type: 'success' });
    } catch {
      setToast({ message: 'Failed to delete attempt', type: 'error' });
    }
    setConfirmDelete(null);
  };

  if (isLoading) {
    return (
      <div className='history-container'>
        <Sidebar />
        <div className='history-content'>
          <LoadingSpinner text='Loading your quiz history...' />
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
            <p>{error?.data?.detail || 'Failed to fetch history'}</p>
            <button onClick={refetch} className='retry-btn'>
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
          <EmptyState
            icon='📚'
            title='No Quiz History'
            message="You haven't taken any quizzes yet. Start by taking a quiz!"
            action={() => navigate('/home')}
            actionText='Browse Quizzes'
          />
        ) : (
          <div className='history-grid'>
            {attempts.map((attempt) => {
              const wrongCount = attempt.total - attempt.correct_count;

              return (
                <div key={attempt.attempt_id} className='history-item'>
                  <div className='history-card'>
                    <h3>{attempt.quiz_title || 'Untitled Quiz'}</h3>
                    <div className='history-card-actions'>
                      <button
                          className='history-review-btn'
                          onClick={() => navigate(`/attempt/${attempt.attempt_id}`)}
                        >
                          Review
                        </button>
                      {attempt.quiz_id && (
                        <button
                          className='history-view-btn'
                          onClick={() => navigate(`/quiz/${attempt.quiz_id}`)}
                        >
                          View Quiz
                        </button>
                      )}
                      <button
                        className='history-delete-btn'
                        onClick={() => setConfirmDelete(attempt.attempt_id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  {attempt.created_at && (
                    <p className='attempt-date'>
                      {new Date(attempt.created_at).toLocaleDateString()}
                    </p>
                  )}
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

        <ConfirmDialog
          open={!!confirmDelete}
          title='Delete Attempt'
          message='Are you sure you want to delete this attempt from your history?'
          confirmText='Delete'
          variant='danger'
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    </div>
  );
};

export default History;
