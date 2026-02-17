import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import Sidebar from '../components/Sidebar';
import './QuizQuestion.css';

const QuizQuestion = () => {
  const { id, q_id } = useParams();
  const navigate = useNavigate();
  const { currentQuiz, currentQuizAttempt, submitAnswer } = useQuiz();

  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const questionIndex = parseInt(q_id);

  useEffect(() => {
    if (!currentQuiz || !currentQuizAttempt) {
      navigate(`/quiz/${id}`);
      return;
    }
  }, [currentQuiz, currentQuizAttempt, id, navigate]);

  if (!currentQuiz || !currentQuizAttempt) {
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
    navigate(`/quiz/${id}/leaderboard`);
    return null;
  }

  const handleAnswerSubmit = () => {
    if (!selectedAnswer) return;

    const correct = submitAnswer(question.id, selectedAnswer);
    setIsCorrect(correct);
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    const nextIndex = questionIndex + 1;
    if (nextIndex < currentQuiz.questions.length) {
      navigate(`/quiz/${id}/${nextIndex}`);
      // Reset state for next question
      setSelectedAnswer('');
      setShowFeedback(false);
      setIsCorrect(false);
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
