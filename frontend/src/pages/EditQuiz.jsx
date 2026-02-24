import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { useGetQuizQuery, useUpdateQuizMutation } from '../store/api/apiSlice';
import { sanitizeText, sanitizeTextArea } from '../lib/sanitize';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
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
    difficulty: '',
    time_limit_minutes: '',
    time_per_question_seconds: '',
    is_published: true,
    questions: [],
  });

  useEffect(() => { document.title = 'Edit Quiz — QuizApp'; }, []);

  // Seed local form state when fetched quiz arrives
  useEffect(() => {
    if (fetchedQuiz) {
      setQuiz({
        ...fetchedQuiz,
        difficulty: fetchedQuiz.difficulty || '',
        time_limit_minutes: fetchedQuiz.time_limit_minutes || '',
        time_per_question_seconds: fetchedQuiz.time_per_question_seconds || '',
        is_published: fetchedQuiz.is_published ?? true,
        questions: (fetchedQuiz.questions || []).map((q) => ({
          ...q,
          explanation: q.explanation || '',
        })),
      });
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
    if (field === 'description') {
      setQuiz((prev) => ({ ...prev, [field]: sanitizeTextArea(value) }));
    } else if (field === 'time_limit_minutes' || field === 'time_per_question_seconds') {
      const num = value === '' ? '' : Math.max(0, parseInt(value) || 0);
      setQuiz((prev) => ({ ...prev, [field]: num }));
    } else if (field === 'is_published' || field === 'difficulty') {
      setQuiz((prev) => ({ ...prev, [field]: value }));
    } else {
      setQuiz((prev) => ({ ...prev, [field]: sanitizeText(value, 200) }));
    }
  };

  const handleCategoriesBlur = () => {
    const categories = categoriesText
      .split(',')
      .map((cat) => cat.trim())
      .filter((cat) => cat);
    setQuiz((prev) => ({ ...prev, categories }));
  };

  const handleQuestionChange = (questionIndex, field, value) => {
    const sanitized = field === 'question' || field === 'explanation'
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
      explanation: '',
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

      if (!quiz.title.trim() || !quiz.description.trim()) {
        throw new Error('Title and description are required');
      }

      if (quiz.questions.length === 0) {
        throw new Error('At least one question is required');
      }

      for (let i = 0; i < quiz.questions.length; i++) {
        const q = quiz.questions[i];
        if (!q.question.trim()) throw new Error(`Question ${i + 1} is empty`);
        if (q.options.some((opt) => !opt.trim())) throw new Error(`Question ${i + 1} has empty options`);
        if (!q.answer.trim() || !q.options.includes(q.answer)) throw new Error(`Question ${i + 1} has invalid answer`);
      }

      const payload = {
        id,
        title: quiz.title,
        description: quiz.description,
        categories: quiz.categories,
        is_published: quiz.is_published,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation || undefined,
        })),
      };

      if (quiz.difficulty) payload.difficulty = quiz.difficulty;
      else payload.difficulty = null;
      if (quiz.time_limit_minutes) payload.time_limit_minutes = Number(quiz.time_limit_minutes);
      else payload.time_limit_minutes = null;
      if (quiz.time_per_question_seconds) payload.time_per_question_seconds = Number(quiz.time_per_question_seconds);
      else payload.time_per_question_seconds = null;

      await updateQuizApi(payload).unwrap();

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
          <LoadingSpinner text='Loading quiz data...' />
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
          <div id='edit-quiz-error' className='error-banner' role='alert'>
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
                aria-invalid={!!error}
                aria-describedby={error ? 'edit-quiz-error' : undefined}
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
                aria-invalid={!!error}
                aria-describedby={error ? 'edit-quiz-error' : undefined}
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

          {/* Quiz Settings */}
          <div className='form-section'>
            <h2>Quiz Settings</h2>

            <div className='settings-row'>
              <div className='form-group'>
                <label htmlFor='edit-difficulty'>Difficulty</label>
                <select
                  id='edit-difficulty'
                  value={quiz.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  className='form-select'>
                  <option value=''>No difficulty set</option>
                  <option value='easy'>Easy</option>
                  <option value='medium'>Medium</option>
                  <option value='hard'>Hard</option>
                </select>
              </div>

              <div className='form-group'>
                <label htmlFor='edit-time-limit'>Total Time Limit (minutes)</label>
                <input
                  id='edit-time-limit'
                  type='number'
                  min='0'
                  value={quiz.time_limit_minutes}
                  onChange={(e) => handleInputChange('time_limit_minutes', e.target.value)}
                  placeholder='No limit'
                  className='form-input'
                />
                <small>Leave empty for no overall time limit</small>
              </div>

              <div className='form-group'>
                <label htmlFor='edit-time-per-q'>Time Per Question (seconds)</label>
                <input
                  id='edit-time-per-q'
                  type='number'
                  min='0'
                  value={quiz.time_per_question_seconds}
                  onChange={(e) => handleInputChange('time_per_question_seconds', e.target.value)}
                  placeholder='No limit'
                  className='form-input'
                />
                <small>Leave empty for no per-question timer</small>
              </div>
            </div>

            <div className='form-group publish-toggle'>
              <label className='toggle-label'>
                <input
                  type='checkbox'
                  checked={quiz.is_published}
                  onChange={(e) => handleInputChange('is_published', e.target.checked)}
                />
                <span className='toggle-text'>
                  {quiz.is_published ? '🟢 Published — visible to everyone' : '🟡 Draft — only visible to you'}
                </span>
              </label>
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
                  <label htmlFor={`question-${questionIndex}`}>Question *</label>
                  <textarea
                    id={`question-${questionIndex}`}
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
                      <label htmlFor={`option-${questionIndex}-${optionIndex}`}>
                        Option {String.fromCharCode(65 + optionIndex)} *
                      </label>
                      <input
                        id={`option-${questionIndex}-${optionIndex}`}
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
                  <label htmlFor={`correct-answer-${questionIndex}`}>Correct Answer *</label>
                  <select
                    id={`correct-answer-${questionIndex}`}
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

                <div className='form-group'>
                  <label htmlFor={`explanation-${questionIndex}`}>Explanation (optional)</label>
                  <textarea
                    id={`explanation-${questionIndex}`}
                    value={question.explanation || ''}
                    onChange={(e) =>
                      handleQuestionChange(
                        questionIndex,
                        'explanation',
                        e.target.value
                      )
                    }
                    placeholder='Explain why this answer is correct (shown after answering)'
                    className='form-textarea'
                    rows='2'
                  />
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
              {saving ? 'Saving...' : quiz.is_published ? 'Save & Publish' : 'Save as Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditQuiz;
