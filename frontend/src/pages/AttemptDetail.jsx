import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useGetAttemptQuery } from '../store/api/apiSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import './AttemptDetail.css';

const AttemptDetail = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { data: attempt, isLoading, error } = useGetAttemptQuery(attemptId);

  useEffect(() => {
    document.title = attempt
      ? `Review: ${attempt.quiz_title} — QuizApp`
      : 'Attempt Review — QuizApp';
  }, [attempt]);

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (isLoading) {
    return (
      <div className="attempt-detail-container">
        <Sidebar />
        <div className="attempt-detail-content">
          <LoadingSpinner text="Loading attempt details..." />
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="attempt-detail-container">
        <Sidebar />
        <div className="attempt-detail-content">
          <div className="attempt-error">
            <div className="attempt-error-icon">⚠️</div>
            <h2>Could not load attempt</h2>
            <p>{error?.data?.detail || 'Attempt not found or you do not have access.'}</p>
            <button onClick={() => navigate('/history')} className="back-to-history-btn">
              Back to History
            </button>
          </div>
        </div>
      </div>
    );
  }

  const scoreColor = getScoreColor(attempt.score);

  return (
    <div className="attempt-detail-container">
      <Sidebar />

      <div className="attempt-detail-content">
        {/* Header */}
        <div className="attempt-detail-header">
          <Link to="/history" className="back-link" aria-label="Back to history">
            ← Back to History
          </Link>
          <h1>{attempt.quiz_title || 'Untitled Quiz'}</h1>
          {attempt.created_at && (
            <p className="attempt-date-label">
              Taken on {new Date(attempt.created_at).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
        </div>

        {/* Score Summary */}
        <div className="attempt-score-summary">
          <div className="score-circle" style={{ borderColor: scoreColor }}>
            <span className="score-value" style={{ color: scoreColor }}>
              {attempt.score}%
            </span>
          </div>
          <div className="score-breakdown">
            <div className="breakdown-item correct">
              <span className="breakdown-count">{attempt.correct_count}</span>
              <span className="breakdown-label">Correct</span>
            </div>
            <div className="breakdown-item wrong">
              <span className="breakdown-count">{attempt.wrong_count}</span>
              <span className="breakdown-label">Wrong</span>
            </div>
            <div className="breakdown-item total">
              <span className="breakdown-count">{attempt.total}</span>
              <span className="breakdown-label">Total</span>
            </div>
          </div>
        </div>

        {/* Question-by-question review */}
        <div className="attempt-questions-review">
          <h2>Question Review</h2>
          {(attempt.details || []).map((detail, index) => {
            const isCorrect = detail.is_correct;
            return (
              <div
                key={detail.question_id || index}
                className={`review-card ${isCorrect ? 'review-correct' : 'review-wrong'}`}
              >
                <div className="review-card-header">
                  <span className="review-q-number">Q{index + 1}</span>
                  <span className={`review-badge ${isCorrect ? 'badge-correct' : 'badge-wrong'}`}>
                    {isCorrect ? '✓ Correct' : '✗ Wrong'}
                  </span>
                </div>

                <p className="review-question-text">{detail.question}</p>

                <div className="review-answers">
                  <div className={`review-answer ${isCorrect ? 'answer-correct' : 'answer-wrong'}`}>
                    <span className="answer-label">Your answer:</span>
                    <span className="answer-value">{detail.selected_answer || '—'}</span>
                  </div>
                  {!isCorrect && (
                    <div className="review-answer answer-correct">
                      <span className="answer-label">Correct answer:</span>
                      <span className="answer-value">{detail.correct_answer}</span>
                    </div>
                  )}
                </div>

                {detail.explanation && (
                  <div className="review-explanation">
                    <strong>Explanation:</strong> {detail.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="attempt-detail-actions">
          {attempt.quiz_id && (
            <button
              className="retake-btn"
              onClick={() => navigate(`/quiz/${attempt.quiz_id}`)}
            >
              🔄 Retake Quiz
            </button>
          )}
          <button
            className="back-to-history-btn"
            onClick={() => navigate('/history')}
          >
            ← Back to History
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttemptDetail;
