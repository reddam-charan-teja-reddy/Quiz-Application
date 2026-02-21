import { useNavigate } from 'react-router-dom';
import './QuizCard.css';

const difficultyColors = {
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#ef4444',
};

const QuizCard = ({ quiz, showScore = false, score = null }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/quiz/${quiz.id}`);
  };

  return (
    <div className='quiz-card' onClick={handleClick}>
      <div className='quiz-card-header'>
        <h3 className='quiz-title'>{quiz.title}</h3>
        <div className='quiz-card-badges'>
          {quiz.difficulty && (
            <span
              className='difficulty-badge'
              style={{ background: difficultyColors[quiz.difficulty] || '#6b7280' }}>
              {quiz.difficulty}
            </span>
          )}
          {showScore && score !== null && (
            <div className='quiz-score'>{score}%</div>
          )}
        </div>
      </div>

      <p className='quiz-description'>{quiz.description}</p>

      <div className='quiz-meta'>
        <div className='quiz-author'>
          <span className='meta-icon'>👤</span>
          {quiz.author}
        </div>
        <div className='quiz-questions'>
          <span className='meta-icon'>❓</span>
          {quiz.num_questions} questions
        </div>
      </div>

      {quiz.categories && quiz.categories.length > 0 && (
        <div className='quiz-categories'>
          {quiz.categories.map((category) => (
            <span key={category} className='category-tag'>
              {category}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizCard;
