import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { recordAnswer } from '../store/slices/attemptSlice';
import Sidebar from '../components/Sidebar';
import './QuizQuestion.css';

const QuizQuestion = () => {
  const { id, q_id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentQuiz, attemptId } = useAppSelector((state) => state.attempt);

  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const questionIndex = parseInt(q_id);

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

  const handleNextQuestion = () => {
    const nextIndex = questionIndex + 1;
    if (nextIndex < currentQuiz.questions.length) {
      navigate(`/quiz/${id}/${nextIndex}`);
    } else {
      navigate(`/quiz/${id}/leaderboard`);
    }
  };

  const progress = ((questionIndex + 1) / currentQuiz.questions.length) * 100;

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
