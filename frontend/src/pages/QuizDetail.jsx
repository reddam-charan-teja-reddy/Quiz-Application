import { useParams, useNavigate } from 'react-router-dom';
import { useGetQuizQuery, useStartAttemptMutation } from '../store/api/apiSlice';
import { useAppDispatch } from '../store/hooks';
import { startAttempt } from '../store/slices/attemptSlice';
import Sidebar from '../components/Sidebar';
import './QuizDetail.css';

const QuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: quiz, isLoading, error } = useGetQuizQuery(id);
  const [startAttemptApi] = useStartAttemptMutation();

  if (isLoading) {
    return (
      <div className='quiz-detail-container'>
        <Sidebar />
        <div className='quiz-detail-content'>
          <div className='loading-state'>
            <div className='spinner'></div>
            <p>Loading quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
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

  const handleStartQuiz = async () => {
    try {
      const result = await startAttemptApi(quiz.id).unwrap();
      dispatch(startAttempt({ quiz, attemptId: result.attempt_id }));
      navigate(`/quiz/${id}/0`);
    } catch {
      // Error handled by RTK Query
    }
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
                  {quiz.categories.map((category) => (
                    <span key={category} className='category-tag'>
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
