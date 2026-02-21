import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { useGetQuizQuery, useUpdateQuizMutation } from '../store/api/apiSlice';
import { sanitizeText, sanitizeTextArea } from '../lib/sanitize';
import Sidebar from '../components/Sidebar';
import './EditQuiz.css';

const EditQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { data: fetchedQuiz, isLoading, error: fetchError } = useGetQuizQuery(id, { skip: !user || !id });
  const [updateQuizApi] = useUpdateQuizMutation();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categoriesText, setCategoriesText] = useState('');
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    categories: [],
    questions: [],
  });

  // Seed local form state when fetched quiz arrives
  useEffect(() => {
    if (fetchedQuiz) {
      setQuiz(fetchedQuiz);
      setCategoriesText((fetchedQuiz.categories || []).join(', '));
    }
  }, [fetchedQuiz]);

  // Map RTK Query fetch error to local error string
  useEffect(() => {
    if (fetchError) {
      const status = fetchError.status;
      if (status === 403) setError('You can only edit quizzes you created');
      else if (status === 400) setError('Invalid quiz ID format');
      else if (status === 404) setError('Quiz not found');
      else setError(`Failed to fetch quiz data: ${status}`);
    }
  }, [fetchError]);

  const handleInputChange = (field, value) => {
    const sanitized = field === 'description'
      ? sanitizeTextArea(value)
      : sanitizeText(value, 200);
    setQuiz((prev) => ({ ...prev, [field]: sanitized }));
  };

  const handleCategoriesBlur = () => {
    const categories = categoriesText
      .split(',')
      .map((cat) => cat.trim())
      .filter((cat) => cat);
    setQuiz((prev) => ({ ...prev, categories }));
  };

  const handleQuestionChange = (questionIndex, field, value) => {
    const sanitized = field === 'question'
      ? sanitizeTextArea(value, 1000)
      : sanitizeText(value);
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, index) =>
        index === questionIndex ? { ...q, [field]: sanitized } : q
      ),
    }));
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const sanitized = sanitizeText(value, 500);
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, qIndex) =>
        qIndex === questionIndex
          ? {
              ...q,
              options: q.options.map((opt, oIndex) =>
                oIndex === optionIndex ? sanitized : opt
              ),
            }
          : q
      ),
    }));
  };

  const addQuestion = () => {
    const newQuestion = {
      id: `q_${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      answer: '',
    };
    setQuiz((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
      num_questions: prev.questions.length + 1,
    }));
  };

  const removeQuestion = (index) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
      num_questions: prev.questions.length - 1,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Validate quiz data
      if (!quiz.title.trim() || !quiz.description.trim()) {
        throw new Error('Title and description are required');
      }

      if (quiz.questions.length === 0) {
        throw new Error('At least one question is required');
      }

      // Validate each question
      for (let i = 0; i < quiz.questions.length; i++) {
        const q = quiz.questions[i];
        if (!q.question.trim()) {
          throw new Error(`Question ${i + 1} is empty`);
        }
        if (q.options.some((opt) => !opt.trim())) {
          throw new Error(`Question ${i + 1} has empty options`);
        }
        if (!q.answer.trim() || !q.options.includes(q.answer)) {
          throw new Error(`Question ${i + 1} has invalid answer`);
        }
      }

      await updateQuizApi({
        id,
        title: quiz.title,
        description: quiz.description,
        categories: quiz.categories,
        questions: quiz.questions,
      }).unwrap();

      navigate('/profile', {
        state: { message: 'Quiz updated successfully!' },
      });
    } catch (err) {
      setError(err.data?.detail || err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className='edit-quiz-container'>
        <Sidebar />
        <div className='edit-quiz-content'>
          <div className='loading-state'>
            <div className='spinner'></div>
            <p>Loading quiz data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !quiz.title) {
    return (
      <div className='edit-quiz-container'>
        <Sidebar />
        <div className='edit-quiz-content'>
          <div className='error-state'>
            <div className='error-icon'>⚠️</div>
            <h2>Error Loading Quiz</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/profile')} className='back-btn'>
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='edit-quiz-container'>
      <Sidebar />

      <div className='edit-quiz-content'>
        <div className='edit-quiz-header'>
          <button onClick={() => navigate('/profile')} className='back-button'>
            ← Back to Profile
          </button>
          <h1>Edit Quiz</h1>
        </div>

        {error && (
          <div className='error-banner'>
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} className='close-error'>
              ✕
            </button>
          </div>
        )}

        <div className='edit-quiz-form'>
          <div className='form-section'>
            <h2>Quiz Details</h2>

            <div className='form-group'>
              <label htmlFor='title'>Title *</label>
              <input
                type='text'
                id='title'
                value={quiz.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder='Enter quiz title...'
                className='form-input'
              />
            </div>

            <div className='form-group'>
              <label htmlFor='description'>Description *</label>
              <textarea
                id='description'
                value={quiz.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                placeholder='Enter quiz description...'
                className='form-textarea'
                rows='3'
              />
            </div>

            <div className='form-group'>
              <label htmlFor='categories'>Categories</label>
              <input
                type='text'
                id='categories'
                value={categoriesText}
                onChange={(e) => setCategoriesText(e.target.value)}
                onBlur={handleCategoriesBlur}
                placeholder='Enter categories separated by commas...'
                className='form-input'
              />
              <small>Separate multiple categories with commas</small>
            </div>
          </div>

          <div className='form-section'>
            <div className='questions-header'>
              <h2>Questions ({quiz.questions.length})</h2>
              <button onClick={addQuestion} className='add-question-btn'>
                + Add Question
              </button>
            </div>

            {quiz.questions.map((question, questionIndex) => (
              <div key={question.id} className='question-item'>
                <div className='question-header'>
                  <h3>Question {questionIndex + 1}</h3>
                  <button
                    onClick={() => removeQuestion(questionIndex)}
                    className='remove-question-btn'
                    disabled={quiz.questions.length === 1}>
                    Remove
                  </button>
                </div>

                <div className='form-group'>
                  <label>Question *</label>
                  <textarea
                    value={question.question}
                    onChange={(e) =>
                      handleQuestionChange(
                        questionIndex,
                        'question',
                        e.target.value
                      )
                    }
                    placeholder='Enter your question...'
                    className='form-textarea'
                    rows='2'
                  />
                </div>

                <div className='options-grid'>
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className='form-group'>
                      <label>
                        Option {String.fromCharCode(65 + optionIndex)} *
                      </label>
                      <input
                        type='text'
                        value={option}
                        onChange={(e) =>
                          handleOptionChange(
                            questionIndex,
                            optionIndex,
                            e.target.value
                          )
                        }
                        placeholder={`Option ${String.fromCharCode(
                          65 + optionIndex
                        )}`}
                        className='form-input'
                      />
                    </div>
                  ))}
                </div>

                <div className='form-group'>
                  <label>Correct Answer *</label>
                  <select
                    value={question.answer}
                    onChange={(e) =>
                      handleQuestionChange(
                        questionIndex,
                        'answer',
                        e.target.value
                      )
                    }
                    className='form-select'>
                    <option value=''>Select correct answer</option>
                    {question.options.map((option, optionIndex) => (
                      <option key={optionIndex} value={option}>
                        {String.fromCharCode(65 + optionIndex)}: {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className='form-actions'>
            <button
              onClick={() => navigate('/profile')}
              className='cancel-btn'
              disabled={saving}>
              Cancel
            </button>
            <button onClick={handleSave} className='save-btn' disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditQuiz;
