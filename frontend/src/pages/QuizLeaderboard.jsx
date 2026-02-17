import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import Sidebar from '../components/Sidebar';
import './QuizLeaderboard.css';

const QuizLeaderboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentQuiz,
    currentQuizAttempt,
    finishQuizAttempt,
    startQuizAttempt,
  } = useQuiz();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saveResults = async () => {
      if (!currentQuiz || !currentQuizAttempt) {
        navigate(`/quiz/${id}`);
        return;
      }

      try {
        const finalResults = await finishQuizAttempt();
        setResults(finalResults);
      } catch (error) {
        console.error('Error saving quiz results:', error);
        // Still show results even if save failed
        const total = currentQuiz.questions.length;
        const correct = currentQuizAttempt.correct.length;
        const score = Math.round((correct / total) * 100);

        setResults({
          ...currentQuizAttempt,
          total,
          score,
          endTime: new Date(),
        });
      } finally {
        setLoading(false);
      }
    };

    saveResults();
  }, []);

  const handleRetakeQuiz = () => {
    startQuizAttempt(currentQuiz);
    navigate(`/quiz/${id}/0`);
  };

  const handleBackHome = () => {
    navigate('/home');
  };

  if (loading) {
    return (
      <div className='quiz-leaderboard-container'>
        <Sidebar />
        <div className='quiz-leaderboard-content'>
          <div className='loading-state'>
            <div className='spinner'></div>
            <p>Saving your results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!results || !currentQuiz) {
    return (
      <div className='quiz-leaderboard-container'>
        <Sidebar />
        <div className='quiz-leaderboard-content'>
          <div className='error-state'>
            <h2>No results found</h2>
            <button onClick={handleBackHome} className='home-btn'>
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreGrade = (score) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  return (
    <div className='quiz-leaderboard-container'>
      <Sidebar />

      <div className='quiz-leaderboard-content'>
        <div className='leaderboard-card'>
          <div className='results-header'>
            <div className='quiz-completed-icon'>🎉</div>
            <h1>Quiz Completed!</h1>
            <h2>{currentQuiz.title}</h2>
          </div>

          <div className='score-summary'>
            <div
              className='score-circle'
              style={{ borderColor: getScoreColor(results.score) }}>
              <div
                className='score-value'
                style={{ color: getScoreColor(results.score) }}>
                {results.score}%
              </div>
              <div
                className='score-grade'
                style={{ color: getScoreColor(results.score) }}>
                {getScoreGrade(results.score)}
              </div>
            </div>

            <div className='score-breakdown'>
              <div className='breakdown-item correct'>
                <div className='breakdown-icon'>✅</div>
                <div className='breakdown-text'>
                  <span className='breakdown-number'>
                    {results.correct.length}
                  </span>
                  <span className='breakdown-label'>Correct</span>
                </div>
              </div>

              <div className='breakdown-item wrong'>
                <div className='breakdown-icon'>❌</div>
                <div className='breakdown-text'>
                  <span className='breakdown-number'>
                    {results.wrong.length}
                  </span>
                  <span className='breakdown-label'>Wrong</span>
                </div>
              </div>

              <div className='breakdown-item total'>
                <div className='breakdown-icon'>📊</div>
                <div className='breakdown-text'>
                  <span className='breakdown-number'>{results.total}</span>
                  <span className='breakdown-label'>Total</span>
                </div>
              </div>
            </div>
          </div>

          <div className='answers-review'>
            <h3>Review Your Answers</h3>

            {results.correct.length > 0 && (
              <div className='answers-section correct-answers'>
                <h4>✅ Correct Answers ({results.correct.length})</h4>
                <div className='answers-list'>
                  {results.correct.map((question, index) => (
                    <div key={question.id} className='answer-item correct'>
                      <div className='question-text'>
                        <strong>Q:</strong> {question.question}
                      </div>
                      <div className='answer-text'>
                        <strong>Your Answer:</strong> {question.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.wrong.length > 0 && (
              <div className='answers-section wrong-answers'>
                <h4>❌ Incorrect Answers ({results.wrong.length})</h4>
                <div className='answers-list'>
                  {results.wrong.map((question, index) => (
                    <div key={question.id} className='answer-item wrong'>
                      <div className='question-text'>
                        <strong>Q:</strong> {question.question}
                      </div>
                      <div className='answer-text'>
                        <strong>Your Answer:</strong>{' '}
                        {results.answers[question.id]}
                      </div>
                      <div className='correct-answer-text'>
                        <strong>Correct Answer:</strong> {question.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className='leaderboard-actions'>
            <button onClick={handleRetakeQuiz} className='retake-btn'>
              🔄 Retake Quiz
            </button>
            <button onClick={handleBackHome} className='home-btn'>
              🏠 Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizLeaderboard;
