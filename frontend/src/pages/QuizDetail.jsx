import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetQuizQuery,
  useStartAttemptMutation,
  useDeleteQuizMutation,
  useDuplicateQuizMutation,
} from '../store/api/apiSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { startAttempt } from '../store/slices/attemptSlice';
import Sidebar from '../components/Sidebar';
import ShareButton from '../components/ShareButton';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import './QuizDetail.css';

const QuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { data: quiz, isLoading, error } = useGetQuizQuery(id);
  const [startAttemptApi] = useStartAttemptMutation();
  const [deleteQuiz, { isLoading: deleting }] = useDeleteQuizMutation();
  const [duplicateQuiz] = useDuplicateQuizMutation();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { document.title = `${quiz?.title || 'Quiz'} — QuizApp`; }, [quiz]);

  const isAuthor = quiz && user && quiz.author === user.username;

  const getDifficultyColor = (d) => {
    if (d === 'easy') return '#10b981';
    if (d === 'medium') return '#f59e0b';
    if (d === 'hard') return '#ef4444';
    return '#6b7280';
  };

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
      // Use shuffled questions from the server instead of original quiz order
      const quizWithShuffled = { ...quiz, questions: result.questions };
      dispatch(startAttempt({ quiz: quizWithShuffled, attemptId: result.attempt_id }));
      navigate(`/quiz/${id}/0`);
    } catch {
      // Error handled by RTK Query
    }
  };

  const handleDelete = async () => {
    try {
      await deleteQuiz(id).unwrap();
      setToast({ message: 'Quiz deleted', type: 'success' });
      setTimeout(() => navigate('/home'), 500);
    } catch {
      setToast({ message: 'Failed to delete quiz', type: 'error' });
    }
    setConfirmDelete(false);
  };

  const handleDuplicate = async () => {
    try {
      const result = await duplicateQuiz(id).unwrap();
      setToast({ message: 'Quiz duplicated!', type: 'success' });
      setTimeout(() => navigate(`/edit/${result.id}`), 500);
    } catch {
      setToast({ message: 'Failed to duplicate quiz', type: 'error' });
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
            <div className='quiz-header-actions'>
              <ShareButton title={quiz.title} url={window.location.href} />
              {isAuthor && (
                <>
                  <button onClick={() => navigate(`/edit/${id}`)} className='edit-action-btn'>
                    ✏️ Edit
                  </button>
                  <button onClick={handleDuplicate} className='dup-action-btn'>
                    📋 Duplicate
                  </button>
                  <button onClick={() => setConfirmDelete(true)} className='delete-action-btn'>
                    🗑️ Delete
                  </button>
                </>
              )}
            </div>
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
              {quiz.difficulty && (
                <div className='meta-item'>
                  <span
                    className='difficulty-badge'
                    style={{
                      background: getDifficultyColor(quiz.difficulty) + '20',
                      color: getDifficultyColor(quiz.difficulty),
                    }}
                  >
                    {quiz.difficulty}
                  </span>
                </div>
              )}
              {quiz.time_limit_minutes && (
                <div className='meta-item'>
                  <span className='meta-icon'>⏱️</span>
                  <span>{quiz.time_limit_minutes} min total</span>
                </div>
              )}
              {quiz.time_per_question_seconds && (
                <div className='meta-item'>
                  <span className='meta-icon'>⏱️</span>
                  <span>{quiz.time_per_question_seconds}s per question</span>
                </div>
              )}
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
            <button
              onClick={() => navigate(`/quiz/${id}/rankings`)}
              className='leaderboard-link-btn'
            >
              🏆 View Leaderboard
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title='Delete Quiz'
        message='Are you sure you want to delete this quiz? This action cannot be undone.'
        confirmText='Delete'
        variant='danger'
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default QuizDetail;
