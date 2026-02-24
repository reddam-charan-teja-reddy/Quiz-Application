import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateQuizMutation, useGenerateQuizMutation } from '../store/api/apiSlice';
import { sanitizeText, sanitizeTextArea } from '../lib/sanitize';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';
import './CreateQuiz.css';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [createQuiz] = useCreateQuizMutation();
  const [generateQuizApi] = useGenerateQuizMutation();
  const fileInputRef = useRef(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => { document.title = 'Create Quiz — QuizApp'; }, []);

  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    categories: [''],
    difficulty: '',
    time_limit_minutes: '',
    time_per_question_seconds: '',
    is_published: true,
    questions: [
      {
        id: crypto.randomUUID(),
        question: '',
        options: ['', '', '', ''],
        answer: '',
        explanation: '',
      },
    ],
  });

  const [aiPrompt, setAiPrompt] = useState('');

  const handleInputChange = (field, value) => {
    if (field === 'description') {
      setQuizData((prev) => ({ ...prev, [field]: sanitizeTextArea(value) }));
    } else if (field === 'time_limit_minutes' || field === 'time_per_question_seconds') {
      const num = value === '' ? '' : Math.max(0, parseInt(value) || 0);
      setQuizData((prev) => ({ ...prev, [field]: num }));
    } else if (field === 'is_published') {
      setQuizData((prev) => ({ ...prev, [field]: value }));
    } else if (field === 'difficulty') {
      setQuizData((prev) => ({ ...prev, [field]: value }));
    } else {
      setQuizData((prev) => ({ ...prev, [field]: sanitizeText(value, 200) }));
    }
  };

  const handleCategoryChange = (index, value) => {
    const newCategories = [...quizData.categories];
    newCategories[index] = sanitizeText(value, 100);
    setQuizData((prev) => ({ ...prev, categories: newCategories }));
  };

  const addCategory = () => {
    setQuizData((prev) => ({
      ...prev,
      categories: [...prev.categories, ''],
    }));
  };

  const removeCategory = (index) => {
    if (quizData.categories.length > 1) {
      const newCategories = quizData.categories.filter((_, i) => i !== index);
      setQuizData((prev) => ({ ...prev, categories: newCategories }));
    }
  };

  const handleQuestionChange = (questionIndex, field, value) => {
    const sanitized = field === 'question' || field === 'explanation'
      ? sanitizeTextArea(value, 1000)
      : sanitizeText(value);
    const newQuestions = [...quizData.questions];
    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      [field]: sanitized,
    };
    setQuizData((prev) => ({ ...prev, questions: newQuestions }));
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const sanitized = sanitizeText(value, 500);
    const newQuestions = [...quizData.questions];
    const newOptions = [...newQuestions[questionIndex].options];
    newOptions[optionIndex] = sanitized;
    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      options: newOptions,
    };
    setQuizData((prev) => ({ ...prev, questions: newQuestions }));
  };

  const addQuestion = () => {
    const newQuestion = {
      id: crypto.randomUUID(),
      question: '',
      options: ['', '', '', ''],
      answer: '',
      explanation: '',
    };
    setQuizData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const removeQuestion = (index) => {
    if (quizData.questions.length > 1) {
      const newQuestions = quizData.questions.filter((_, i) => i !== index);
      setQuizData((prev) => ({ ...prev, questions: newQuestions }));
    }
  };

  const handleGenerateQuiz = async () => {
    if (!aiPrompt.trim()) {
      setError('Please enter a prompt for AI generation');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const generatedQuiz = await generateQuizApi(aiPrompt).unwrap();
      setQuizData((prev) => ({
        ...prev,
        ...generatedQuiz,
        difficulty: generatedQuiz.difficulty || prev.difficulty,
        is_published: prev.is_published,
        time_limit_minutes: prev.time_limit_minutes,
        time_per_question_seconds: prev.time_per_question_seconds,
        questions: generatedQuiz.questions.map((q) => ({
          ...q,
          id: crypto.randomUUID(),
          explanation: q.explanation || '',
        })),
      }));
      setAiPrompt('');
      setToast({ message: 'Quiz generated! Review and edit before saving.', type: 'success' });
    } catch (err) {
      setError('Failed to generate quiz: ' + (err.data?.detail || err.message));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!file.name.endsWith('.json')) {
      setError('Please select a JSON file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('File is too large (max 2 MB)');
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate basic structure
      if (!data.title || !Array.isArray(data.questions) || data.questions.length === 0) {
        setError('Invalid quiz file — must contain "title" and "questions" array');
        return;
      }

      // Populate form with imported data
      setQuizData((prev) => ({
        ...prev,
        title: sanitizeText(data.title || '', 200),
        description: sanitizeTextArea(data.description || ''),
        categories: Array.isArray(data.categories) && data.categories.length > 0
          ? data.categories.map((c) => sanitizeText(c, 100))
          : [''],
        difficulty: data.difficulty || prev.difficulty,
        time_limit_minutes: data.time_limit_minutes || prev.time_limit_minutes,
        time_per_question_seconds: data.time_per_question_seconds || prev.time_per_question_seconds,
        questions: data.questions.map((q) => ({
          id: crypto.randomUUID(),
          question: q.question || '',
          options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
          answer: q.answer || '',
          explanation: q.explanation || '',
        })),
      }));

      setError('');
      setToast({ message: `Imported "${data.title}" with ${data.questions.length} questions. Review and save.`, type: 'success' });
    } catch {
      setError('Failed to parse JSON file. Please check the format.');
    }
  };

  const validateQuiz = () => {
    if (!quizData.title.trim()) return 'Title is required';
    if (quizData.title.trim().length > 200) return 'Title must be under 200 characters';
    if (!quizData.description.trim()) return 'Description is required';
    if (quizData.description.trim().length > 2000) return 'Description must be under 2000 characters';
    if (quizData.categories.every((cat) => !cat.trim()))
      return 'At least one category is required';

    for (let i = 0; i < quizData.questions.length; i++) {
      const question = quizData.questions[i];
      if (!question.question.trim()) return `Question ${i + 1} is required`;
      if (question.question.trim().length > 1000) return `Question ${i + 1} is too long (max 1000 chars)`;
      if (question.options.some((opt) => !opt.trim()))
        return `All options for Question ${i + 1} are required`;
      if (question.options.some((opt) => opt.trim().length > 500))
        return `Options for Question ${i + 1} are too long (max 500 chars each)`;
      if (!question.answer.trim())
        return `Answer for Question ${i + 1} is required`;
      if (!question.options.includes(question.answer))
        return `Answer for Question ${i + 1} must be one of the options`;
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateQuiz();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const quizToSubmit = {
        title: quizData.title,
        description: quizData.description,
        categories: quizData.categories.filter((cat) => cat.trim()),
        is_published: quizData.is_published,
        questions: quizData.questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation || undefined,
        })),
      };

      if (quizData.difficulty) quizToSubmit.difficulty = quizData.difficulty;
      if (quizData.time_limit_minutes) quizToSubmit.time_limit_minutes = Number(quizData.time_limit_minutes);
      if (quizData.time_per_question_seconds) quizToSubmit.time_per_question_seconds = Number(quizData.time_per_question_seconds);

      await createQuiz(quizToSubmit).unwrap();
      navigate('/home');
    } catch (err) {
      setError('Failed to create quiz: ' + (err.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='create-quiz-container'>
      <Sidebar />

      <div className='create-quiz-content'>
        <div className='create-quiz-header'>
          <button onClick={() => navigate('/home')} className='back-btn'>
            ← Back to Home
          </button>
          <h1>Create New Quiz</h1>
        </div>

        <div className='create-quiz-card'>
          {/* AI Generation Section */}
          <div className='ai-generation-section'>
            <h2>🤖 Generate Quiz with AI</h2>
            <p>
              Describe what kind of quiz you'd like to create, and AI will
              generate it for you!
            </p>

            <div className='ai-prompt-container'>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder='e.g., Create a 10-question quiz about JavaScript fundamentals covering variables, functions, and arrays'
                className='ai-prompt-input'
                rows='3'
                disabled={isGenerating}
              />
              <button
                onClick={handleGenerateQuiz}
                className='generate-btn'
                disabled={isGenerating || !aiPrompt.trim()}>
                {isGenerating ? 'Generating...' : '✨ Generate Quiz'}
              </button>
            </div>
          </div>

          <div className='divider'>
            <span>OR</span>
          </div>

          {/* Import from JSON */}
          <div className='import-section'>
            <h2>📁 Import from JSON</h2>
            <p>Import a previously exported quiz JSON file.</p>
            <input
              ref={fileInputRef}
              type='file'
              accept='.json'
              onChange={handleFileImport}
              className='sr-only'
              id='quiz-file-input'
              aria-label='Import quiz JSON file'
            />
            <label htmlFor='quiz-file-input' className='import-btn' role='button' tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}>
              📂 Choose File
            </label>
          </div>

          <div className='divider'>
            <span>OR</span>
          </div>

          {/* Manual Creation Form */}
          <form onSubmit={handleSubmit} className='quiz-form'>
            <h2>📝 Create Manually</h2>

            {error && <div id='create-quiz-error' className='error-message' role='alert'>{error}</div>}

            {/* Basic Info */}
            <div className='form-section'>
              <h3>Basic Information</h3>

              <div className='form-group'>
                <label htmlFor='title'>Quiz Title *</label>
                <input
                  id='title'
                  type='text'
                  value={quizData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder='Enter quiz title'
                  required
                  aria-invalid={!!error}
                  aria-describedby={error ? 'create-quiz-error' : undefined}
                />
              </div>

              <div className='form-group'>
                <label htmlFor='description'>Description *</label>
                <textarea
                  id='description'
                  value={quizData.description}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  placeholder='Describe your quiz'
                  rows='3'
                  required
                  aria-invalid={!!error}
                  aria-describedby={error ? 'create-quiz-error' : undefined}
                />
              </div>

              <div className='form-group'>
                <label>Categories *</label>
                <div className='categories-container'>
                  {quizData.categories.map((category, index) => (
                    <div key={index} className='category-input-group'>
                      <input
                        type='text'
                        value={category}
                        onChange={(e) =>
                          handleCategoryChange(index, e.target.value)
                        }
                        placeholder={`Category ${index + 1}`}
                      />
                      {quizData.categories.length > 1 && (
                        <button
                          type='button'
                          onClick={() => removeCategory(index)}
                          className='remove-btn'>
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type='button'
                    onClick={addCategory}
                    className='add-category-btn'>
                    + Add Category
                  </button>
                </div>
              </div>
            </div>

            {/* Quiz Settings */}
            <div className='form-section'>
              <h3>Quiz Settings</h3>

              <div className='settings-row'>
                <div className='form-group'>
                  <label htmlFor='difficulty'>Difficulty</label>
                  <select
                    id='difficulty'
                    value={quizData.difficulty}
                    onChange={(e) => handleInputChange('difficulty', e.target.value)}>
                    <option value=''>No difficulty set</option>
                    <option value='easy'>Easy</option>
                    <option value='medium'>Medium</option>
                    <option value='hard'>Hard</option>
                  </select>
                </div>

                <div className='form-group'>
                  <label htmlFor='time_limit'>Total Time Limit (minutes)</label>
                  <input
                    id='time_limit'
                    type='number'
                    min='0'
                    value={quizData.time_limit_minutes}
                    onChange={(e) => handleInputChange('time_limit_minutes', e.target.value)}
                    placeholder='No limit'
                  />
                  <small>Leave empty for no overall time limit</small>
                </div>

                <div className='form-group'>
                  <label htmlFor='time_per_q'>Time Per Question (seconds)</label>
                  <input
                    id='time_per_q'
                    type='number'
                    min='0'
                    value={quizData.time_per_question_seconds}
                    onChange={(e) => handleInputChange('time_per_question_seconds', e.target.value)}
                    placeholder='No limit'
                  />
                  <small>Leave empty for no per-question timer</small>
                </div>
              </div>

              <div className='form-group publish-toggle'>
                <label className='toggle-label'>
                  <input
                    type='checkbox'
                    checked={quizData.is_published}
                    onChange={(e) => handleInputChange('is_published', e.target.checked)}
                  />
                  <span className='toggle-text'>
                    {quizData.is_published ? '🟢 Published — visible to everyone' : '🟡 Draft — only visible to you'}
                  </span>
                </label>
              </div>
            </div>

            {/* Questions */}
            <div className='form-section'>
              <div className='questions-header'>
                <h3>Questions ({quizData.questions.length})</h3>
                <button
                  type='button'
                  onClick={addQuestion}
                  className='add-question-btn'>
                  + Add Question
                </button>
              </div>

              {quizData.questions.map((question, questionIndex) => (
                <div key={question.id} className='question-container'>
                  <div className='question-header'>
                    <h4>Question {questionIndex + 1}</h4>
                    {quizData.questions.length > 1 && (
                      <button
                        type='button'
                        onClick={() => removeQuestion(questionIndex)}
                        className='remove-question-btn'>
                        Remove
                      </button>
                    )}
                  </div>

                  <div className='form-group'>
                    <label>Question Text *</label>
                    <textarea
                      value={question.question}
                      onChange={(e) =>
                        handleQuestionChange(
                          questionIndex,
                          'question',
                          e.target.value
                        )
                      }
                      placeholder='Enter your question'
                      rows='2'
                      required
                    />
                  </div>

                  <div className='form-group'>
                    <label>Options *</label>
                    <div className='options-container'>
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className='option-input-group'>
                          <span className='option-label'>
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
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
                            required
                          />
                        </div>
                      ))}
                    </div>
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
                      required>
                      <option value=''>Select correct answer</option>
                      {question.options.map((option, optionIndex) => (
                        <option key={optionIndex} value={option}>
                          {String.fromCharCode(65 + optionIndex)}: {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='form-group'>
                    <label>Explanation (optional)</label>
                    <textarea
                      value={question.explanation}
                      onChange={(e) =>
                        handleQuestionChange(
                          questionIndex,
                          'explanation',
                          e.target.value
                        )
                      }
                      placeholder='Explain why this answer is correct (shown after answering)'
                      rows='2'
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className='form-actions'>
              <button
                type='button'
                onClick={() => navigate('/home')}
                className='cancel-btn'
                disabled={loading}>
                Cancel
              </button>
              <button type='submit' className='submit-btn' disabled={loading}>
                {loading ? 'Creating...' : quizData.is_published ? 'Publish Quiz' : 'Save as Draft'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default CreateQuiz;
