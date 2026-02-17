import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import Sidebar from '../components/Sidebar';
import './CreateQuiz.css';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const { createQuiz, generateQuiz } = useQuiz();

  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    author: '',
    categories: [''],
    questions: [
      {
        id: '1',
        question: '',
        options: ['', '', '', ''],
        answer: '',
      },
    ],
  });

  const [aiPrompt, setAiPrompt] = useState('');

  const handleInputChange = (field, value) => {
    setQuizData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (index, value) => {
    const newCategories = [...quizData.categories];
    newCategories[index] = value;
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
    const newQuestions = [...quizData.questions];
    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      [field]: value,
    };
    setQuizData((prev) => ({ ...prev, questions: newQuestions }));
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const newQuestions = [...quizData.questions];
    const newOptions = [...newQuestions[questionIndex].options];
    newOptions[optionIndex] = value;
    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      options: newOptions,
    };
    setQuizData((prev) => ({ ...prev, questions: newQuestions }));
  };

  const addQuestion = () => {
    const newQuestion = {
      id: (quizData.questions.length + 1).toString(),
      question: '',
      options: ['', '', '', ''],
      answer: '',
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
      const generatedQuiz = await generateQuiz(aiPrompt);
      setQuizData({
        ...generatedQuiz,
        questions: generatedQuiz.questions.map((q, index) => ({
          ...q,
          id: (index + 1).toString(),
        })),
      });
      setAiPrompt('');
    } catch (err) {
      setError('Failed to generate quiz: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const validateQuiz = () => {
    if (!quizData.title.trim()) return 'Title is required';
    if (!quizData.description.trim()) return 'Description is required';
    if (!quizData.author.trim()) return 'Author is required';
    if (quizData.categories.every((cat) => !cat.trim()))
      return 'At least one category is required';

    for (let i = 0; i < quizData.questions.length; i++) {
      const question = quizData.questions[i];
      if (!question.question.trim()) return `Question ${i + 1} is required`;
      if (question.options.some((opt) => !opt.trim()))
        return `All options for Question ${i + 1} are required`;
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
        ...quizData,
        num_questions: quizData.questions.length,
        categories: quizData.categories.filter((cat) => cat.trim()),
      };

      await createQuiz(quizToSubmit);
      navigate('/home');
    } catch (err) {
      setError('Failed to create quiz: ' + err.message);
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

          {/* Manual Creation Form */}
          <form onSubmit={handleSubmit} className='quiz-form'>
            <h2>📝 Create Manually</h2>

            {error && <div className='error-message'>{error}</div>}

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
                />
              </div>

              <div className='form-group'>
                <label htmlFor='author'>Author *</label>
                <input
                  id='author'
                  type='text'
                  value={quizData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  placeholder='Your name'
                  required
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
                {loading ? 'Creating...' : 'Create Quiz'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateQuiz;
