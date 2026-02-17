import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

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
      const response = await fetch('http://localhost:8000/api/getquizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          token: user.token,
        }),
      });

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
      const response = await fetch('http://localhost:8000/api/plus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: {
            username: user.username,
            token: user.token,
          },
          quiz: quizData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create quiz');
      }

      const result = await response.json();
      // Refresh quizzes after creating
      await fetchQuizzes();
      return result;
    } catch (error) {
      throw new Error('Failed to create quiz: ' + error.message);
    }
  };

  const generateQuiz = async (prompt) => {
    try {
      const response = await fetch('http://localhost:8000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      await fetch('http://localhost:8000/api/updateHistory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          token: user.token,
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
