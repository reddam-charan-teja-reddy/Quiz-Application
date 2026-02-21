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
      const response = await apiFetch('/api/v1/quizzes');
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
      const response = await apiFetch('/api/v1/quizzes', {
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
      const response = await apiFetch('/api/v1/generate', {
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

  const startQuizAttempt = async (quiz) => {
    setCurrentQuiz(quiz);

    // Start server-side attempt
    try {
      const response = await apiFetch(`/api/v1/attempts/start/${quiz.id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start attempt');
      }

      const data = await response.json();

      setCurrentQuizAttempt({
        attempt_id: data.attempt_id,
        quiz_id: quiz.id,
        answers: [],
        answersMap: {},
        correct: [],
        wrong: [],
        startTime: new Date(),
        currentQuestionIndex: 0,
      });

      return data;
    } catch (error) {
      throw new Error('Failed to start quiz attempt: ' + error.message);
    }
  };

  const submitAnswer = (questionId, answer) => {
    if (!currentQuizAttempt) return;

    const question = currentQuiz.questions.find((q) => q.id === questionId);
    const isCorrect = question.answer === answer;

    setCurrentQuizAttempt((prev) => ({
      ...prev,
      answers: [
        ...prev.answers,
        { question_id: questionId, selected_answer: answer },
      ],
      answersMap: {
        ...prev.answersMap,
        [questionId]: answer,
      },
      correct: isCorrect ? [...prev.correct, question] : prev.correct,
      wrong: !isCorrect ? [...prev.wrong, question] : prev.wrong,
    }));

    return isCorrect;
  };

  const finishQuizAttempt = async () => {
    if (!currentQuizAttempt || !user) return;

    try {
      // Submit answers to server for scoring
      const response = await apiFetch(
        `/api/v1/attempts/${currentQuizAttempt.attempt_id}/finish`,
        {
          method: 'POST',
          body: JSON.stringify({
            answers: currentQuizAttempt.answers,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to finish attempt');
      }

      const serverResult = await response.json();

      const result = {
        ...currentQuizAttempt,
        attempt_id: serverResult.attempt_id,
        total: serverResult.total,
        score: serverResult.score,
        correct_count: serverResult.correct_count,
        wrong_count: serverResult.wrong_count,
        details: serverResult.details,
        endTime: new Date(),
      };

      setCurrentQuizAttempt(null);
      return result;
    } catch (error) {
      throw new Error('Failed to finish attempt: ' + error.message);
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
