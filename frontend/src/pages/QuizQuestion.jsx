import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { recordAnswer } from '../store/slices/attemptSlice';
import Sidebar from '../components/Sidebar';
import QuizTimer from '../components/QuizTimer';
import './QuizQuestion.css';

const QuizQuestion = () => {
  const { id, q_id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentQuiz, attemptId, answers, startTime } = useAppSelector((state) => state.attempt);

  useEffect(() => { document.title = 'Quiz — QuizApp'; }, []);

  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const questionIndex = parseInt(q_id);

  // Calculate remaining seconds for total quiz timer (persists across questions)
  const totalTimerSeconds = useMemo(() => {
    if (!currentQuiz?.time_limit_minutes || currentQuiz?.time_per_question_seconds) return null;
    const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
    const total = currentQuiz.time_limit_minutes * 60;
    return Math.max(0, total - elapsed);
    // Only recalculate when quiz config or startTime changes, not on question navigation
  }, [currentQuiz?.time_limit_minutes, currentQuiz?.time_per_question_seconds, startTime]);

  // Redirect if no active attempt — done in useEffect, not during render (#15)
  useEffect(() => {
    if (!currentQuiz || !attemptId) {
      navigate(`/quiz/${id}`, { replace: true });
    }
  }, [currentQuiz, attemptId, id, navigate]);

  // Redirect when question index overflows — also in useEffect
  useEffect(() => {
    if (currentQuiz && questionIndex >= currentQuiz.questions.length) {
      navigate(`/quiz/${id}/leaderboard`, { replace: true });
    }
  }, [currentQuiz, questionIndex, id, navigate]);

  // Reset answer state when navigating between questions
  useEffect(() => {
    setSelectedAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
  }, [questionIndex]);

  // Keyboard navigation: press 1-4 to select answer options
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showFeedback) return;
      if (!currentQuiz) return;
      const question = currentQuiz.questions[questionIndex];
      if (!question) return;
      const keyNum = parseInt(e.key);
      if (keyNum >= 1 && keyNum <= 4 && keyNum <= question.options.length) {
        setSelectedAnswer(question.options[keyNum - 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFeedback, currentQuiz, questionIndex]);

  const handleNextQuestion = useCallback(() => {
    const nextIndex = questionIndex + 1;
    if (currentQuiz && nextIndex < currentQuiz.questions.length) {
      navigate(`/quiz/${id}/${nextIndex}`);
    } else {
      navigate(`/quiz/${id}/leaderboard`);
    }
  }, [questionIndex, currentQuiz, id, navigate]);

  // Auto-submit on per-question timeout
  const handleTimeUp = useCallback(() => {
    if (showFeedback) return;
    // Auto-submit with no answer (wrong)
    if (currentQuiz) {
      const question = currentQuiz.questions[questionIndex];
      if (question) {
        dispatch(
          recordAnswer({
            questionId: question.id,
            selectedAnswer: '',
            isCorrect: false,
            question,
          })
        );
        setIsCorrect(false);
        setShowFeedback(true);
      }
    }
  }, [showFeedback, currentQuiz, questionIndex, dispatch]);

  // Auto-submit entire quiz when total time limit expires
  const handleTotalTimeUp = useCallback(async () => {
    if (!currentQuiz || !attemptId) return;
    // Record current question as unanswered if not already answered
    const question = currentQuiz.questions[questionIndex];
    const alreadyAnswered = answers.some((a) => a.question_id === question?.id);
    if (question && !alreadyAnswered && !showFeedback) {
      dispatch(
        recordAnswer({
          questionId: question.id,
          selectedAnswer: '',
          isCorrect: false,
          question,
        })
      );
    }
    // Navigate to leaderboard — answers will be submitted there
    navigate(`/quiz/${id}/leaderboard`, { replace: true });
  }, [currentQuiz, attemptId, questionIndex, answers, showFeedback, dispatch, navigate, id]);

  if (!currentQuiz || !attemptId) {
    return (
      <div className='quiz-question-container'>
        <Sidebar />
        <div className='quiz-question-content'>
          <div className='loading-state'>Loading...</div>
        </div>
      </div>
    );
  }

  const question = currentQuiz.questions[questionIndex];

  if (!question) {
    return null;
  }

  const handleAnswerSubmit = () => {
    if (!selectedAnswer) return;

    const correct = question.answer === selectedAnswer;
    dispatch(
      recordAnswer({
        questionId: question.id,
        selectedAnswer,
        isCorrect: correct,
        question,
      })
    );
    setIsCorrect(correct);
    setShowFeedback(true);
  };

  const progress = ((questionIndex + 1) / currentQuiz.questions.length) * 100;

  // Timer: per-question timer takes priority over total quiz timer
  const timerSeconds = currentQuiz.time_per_question_seconds || null;
  const showTotalTimer = totalTimerSeconds !== null && !timerSeconds;

  return (
    <div className='quiz-question-container'>
      <Sidebar />

      <div className='quiz-question-content'>
        <div className='quiz-question-card'>
          <div className='question-header'>
            <div className='progress-container'>
              <div className='progress-bar'>
                <div
                  className='progress-fill'
                  style={{ width: `${progress}%` }}></div>
              </div>
              <span className='progress-text'>
                {questionIndex + 1} of {currentQuiz.questions.length}
              </span>
            </div>
            {timerSeconds && !showFeedback && (
              <QuizTimer
                key={questionIndex}
                totalSeconds={timerSeconds}
                onTimeUp={handleTimeUp}
                paused={showFeedback}
              />
            )}
            {showTotalTimer && (
              <QuizTimer
                key="total-timer"
                totalSeconds={totalTimerSeconds}
                onTimeUp={handleTotalTimeUp}
                paused={false}
              />
            )}
          </div>

          <div className='question-content'>
            <h2 className='question-text'>
              Q{questionIndex + 1}: {question.question}
            </h2>

            <div className='options-container'>
              {question.options.map((option, index) => (
                <button
                  key={index}
                  className={`option-btn ${
                    selectedAnswer === option ? 'selected' : ''
                  } ${
                    showFeedback
                      ? option === question.answer
                        ? 'correct'
                        : selectedAnswer === option
                        ? 'incorrect'
                        : ''
                      : ''
                  }`}
                  onClick={() => !showFeedback && setSelectedAnswer(option)}
                  disabled={showFeedback}>
                  <span className='option-letter'>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className='option-text'>{option}</span>
                </button>
              ))}
            </div>

            {showFeedback && (
              <div
                className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                <div className='feedback-icon'>{isCorrect ? '✅' : '❌'}</div>
                <div className='feedback-text'>
                  {isCorrect
                    ? 'Correct!'
                    : `Incorrect. The correct answer is: ${question.answer}`}
                </div>
              </div>
            )}

            {showFeedback && question.explanation && (
              <div className='explanation-box'>
                <div className='explanation-icon'>💡</div>
                <div className='explanation-text'>
                  <strong>Explanation:</strong> {question.explanation}
                </div>
              </div>
            )}

            <div className='question-actions'>
              {!showFeedback ? (
                <button
                  onClick={handleAnswerSubmit}
                  className='submit-btn'
                  disabled={!selectedAnswer}>
                  Submit Answer
                </button>
              ) : (
                <button onClick={handleNextQuestion} className='next-btn'>
                  {questionIndex + 1 < currentQuiz.questions.length
                    ? 'Next Question'
                    : 'View Results'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizQuestion;
