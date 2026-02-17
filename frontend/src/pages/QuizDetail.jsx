import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import Sidebar from '../components/Sidebar';
import './QuizDetail.css';

const QuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quizzes, startQuizAttempt } = useQuiz();

  const quiz = quizzes.find((q) => q.id === id);

  if (!quiz) {
    return (
      <div className='quiz-detail-container'>
        <Sidebar />
        <div className='quiz-detail-content'>
          <div className='error-state'>
            <h2>Quiz not found</h2>
            <p>The quiz you're looking for doesn't exist.</p>
            <button onClick={() => navigate('/home')} className='back-btn'>
              Go Back Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleStartQuiz = () => {
    startQuizAttempt(quiz);
    navigate(`/quiz/${id}/0`);
  };

  return (
    <div className='quiz-detail-container'>
      <Sidebar />

      <div className='quiz-detail-content'>
        <div className='quiz-detail-card'>
          <div className='quiz-header'>
            <button onClick={() => navigate('/home')} className='back-btn'>
              ← Back to Home
            </button>
          </div>

          <div className='quiz-info'>
            <h1 className='quiz-title'>{quiz.title}</h1>
            <p className='quiz-description'>{quiz.description}</p>

            <div className='quiz-meta'>
              <div className='meta-item'>
                <span className='meta-icon'>👤</span>
                <span>Author: {quiz.author}</span>
              </div>
              <div className='meta-item'>
                <span className='meta-icon'>❓</span>
                <span>{quiz.num_questions} Questions</span>
              </div>
            </div>

            {quiz.categories && quiz.categories.length > 0 && (
              <div className='categories'>
                <h3>Categories</h3>
                <div className='category-tags'>
                  {quiz.categories.map((category, index) => (
                    <span key={index} className='category-tag'>
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className='sample-questions'>
            <h3>Sample Questions</h3>
            <div className='questions-preview'>
              {quiz.questions.slice(0, 3).map((question, index) => (
                <div key={question.id} className='sample-question'>
                  <h4>
                    Q{index + 1}: {question.question}
                  </h4>
                  <ul className='sample-options'>
                    {question.options.map((option, optIndex) => (
                      <li key={optIndex}>{option}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {quiz.questions.length > 3 && (
                <p className='more-questions'>
                  +{quiz.questions.length - 3} more questions...
                </p>
              )}
            </div>
          </div>

          <div className='quiz-actions'>
            <button onClick={handleStartQuiz} className='start-btn'>
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizDetail;
