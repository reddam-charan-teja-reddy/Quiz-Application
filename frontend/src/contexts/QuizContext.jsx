import { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../lib/api';

const QuizContext = createContext();

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

export const QuizProvider = ({ children }) => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuizAttempt, setCurrentQuizAttempt] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await apiFetch('/api/quizzes');
      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }

      const data = await response.json();
      setQuizzes(data.quizzes || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createQuiz = async (quizData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const response = await apiFetch('/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        throw new Error('Failed to create quiz');
      }

      const result = await response.json();
      await fetchQuizzes();
      return result;
    } catch (error) {
      throw new Error('Failed to create quiz: ' + error.message);
    }
  };

  const generateQuiz = async (prompt) => {
    try {
      const response = await apiFetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }

      const data = await response.json();
      return data.quiz;
    } catch (error) {
      throw new Error('Failed to generate quiz: ' + error.message);
    }
  };

  const startQuizAttempt = (quiz) => {
    setCurrentQuiz(quiz);
    setCurrentQuizAttempt({
      quiz_id: quiz.id,
      answers: {},
      correct: [],
      wrong: [],
      startTime: new Date(),
      currentQuestionIndex: 0,
    });
  };

  const submitAnswer = (questionId, answer) => {
    if (!currentQuizAttempt) return;

    const question = currentQuiz.questions.find((q) => q.id === questionId);
    const isCorrect = question.answer === answer;

    setCurrentQuizAttempt((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answer,
      },
      correct: isCorrect ? [...prev.correct, question] : prev.correct,
      wrong: !isCorrect ? [...prev.wrong, question] : prev.wrong,
    }));

    return isCorrect;
  };

  const finishQuizAttempt = async () => {
    if (!currentQuizAttempt || !user) return;

    const total = currentQuiz.questions.length;
    const correct = currentQuizAttempt.correct.length;
    const score = Math.round((correct / total) * 100);

    try {
      await apiFetch('/api/history', {
        method: 'POST',
        body: JSON.stringify({
          quiz_id: currentQuizAttempt.quiz_id,
          correct: currentQuizAttempt.correct,
          wrong: currentQuizAttempt.wrong,
          total,
          score,
        }),
      });

      const result = {
        ...currentQuizAttempt,
        total,
        score,
        endTime: new Date(),
      };

      setCurrentQuizAttempt(null);
      return result;
    } catch (error) {
      throw new Error('Failed to update history: ' + error.message);
    }
  };

  const value = {
    quizzes,
    currentQuiz,
    currentQuizAttempt,
    loading,
    fetchQuizzes,
    createQuiz,
    generateQuiz,
    startQuizAttempt,
    submitAnswer,
    finishQuizAttempt,
    setCurrentQuiz,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};
