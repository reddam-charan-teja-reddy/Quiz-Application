import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  useFinishAttemptMutation,
  useStartAttemptMutation,
} from '../store/api/apiSlice';
import { startAttempt, clearAttempt } from '../store/slices/attemptSlice';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import ShareButton from '../components/ShareButton';
import './QuizLeaderboard.css';

const QuizLeaderboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentQuiz, attemptId, answers, correct, wrong } = useAppSelector(
    (state) => state.attempt
  );

  const [finishAttemptApi] = useFinishAttemptMutation();
  const [startAttemptApi] = useStartAttemptMutation();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    // Guard against StrictMode double-invocation (#14)
    if (hasSubmitted.current) return;

    const saveResults = async () => {
      if (!currentQuiz || !attemptId) {
        navigate(`/quiz/${id}`, { replace: true });
        return;
      }

      hasSubmitted.current = true;

      try {
        const res = await finishAttemptApi({ attemptId, answers }).unwrap();
        setResults({
          correct,
          wrong,
          total: currentQuiz.questions.length,
          score: res.score ?? Math.round((correct.length / currentQuiz.questions.length) * 100),
          answersMap: Object.fromEntries(answers.map((a) => [a.question_id, a.selected_answer])),
        });
        dispatch(clearAttempt());
      } catch {
        // Still show results even if save failed
        const total = currentQuiz.questions.length;
        const score = Math.round((correct.length / total) * 100);

        setResults({
          correct,
          wrong,
          total,
          score,
          answersMap: Object.fromEntries(answers.map((a) => [a.question_id, a.selected_answer])),
        });
        dispatch(clearAttempt());
      } finally {
        setLoading(false);
      }
    };

    saveResults();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetakeQuiz = async () => {
    try {
      const res = await startAttemptApi(currentQuiz.id).unwrap();
      // Use shuffled questions from the server for the new attempt
      const quizWithShuffled = { ...currentQuiz, questions: res.questions };
      dispatch(startAttempt({ quiz: quizWithShuffled, attemptId: res.attempt_id }));
      navigate(`/quiz/${id}/0`);
    } catch {
      navigate(`/quiz/${id}`);
    }
  };

  const handleBackHome = () => {
    navigate('/home');
  };

  if (loading) {
    return (
      <div className='quiz-leaderboard-container'>
        <Sidebar />
        <div className='quiz-leaderboard-content'>
          <LoadingSpinner text='Saving your results...' />
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

  const shareText = `I scored ${results.score}% on "${currentQuiz.title}"! Can you beat my score?`;

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
                  {results.correct.map((question) => (
                    <div key={question.id} className='answer-item correct'>
                      <div className='question-text'>
                        <strong>Q:</strong> {question.question}
                      </div>
                      <div className='answer-text'>
                        <strong>Your Answer:</strong> {question.answer}
                      </div>
                      {question.explanation && (
                        <div className='explanation-text'>
                          <strong>💡 Explanation:</strong> {question.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.wrong.length > 0 && (
              <div className='answers-section wrong-answers'>
                <h4>❌ Incorrect Answers ({results.wrong.length})</h4>
                <div className='answers-list'>
                  {results.wrong.map((question) => (
                    <div key={question.id} className='answer-item wrong'>
                      <div className='question-text'>
                        <strong>Q:</strong> {question.question}
                      </div>
                      <div className='answer-text'>
                        <strong>Your Answer:</strong>{' '}
                        {results.answersMap[question.id] || '(no answer)'}
                      </div>
                      <div className='correct-answer-text'>
                        <strong>Correct Answer:</strong> {question.answer}
                      </div>
                      {question.explanation && (
                        <div className='explanation-text'>
                          <strong>💡 Explanation:</strong> {question.explanation}
                        </div>
                      )}
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
            <ShareButton text={shareText} />
            <button
              onClick={() => navigate(`/quiz/${id}/rankings`)}
              className='rankings-btn'>
              🏆 View Leaderboard
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
