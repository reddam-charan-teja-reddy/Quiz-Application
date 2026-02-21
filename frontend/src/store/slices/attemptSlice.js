import { createSlice } from '@reduxjs/toolkit';

/**
 * attemptSlice — tracks the in-progress quiz attempt.
 * This slice is persisted via redux-persist so that a page refresh
 * does not lose the user's current quiz progress (#13).
 */
const attemptSlice = createSlice({
  name: 'attempt',
  initialState: {
    currentQuiz: null,      // full quiz object
    attemptId: null,        // server-side attempt _id
    answers: [],            // [{ question_id, selected_answer }]
    answersMap: {},         // { [question_id]: selected_answer }
    correct: [],            // question objects answered correctly
    wrong: [],              // question objects answered incorrectly
    startTime: null,
  },
  reducers: {
    startAttempt(state, action) {
      const { quiz, attemptId } = action.payload;
      state.currentQuiz = quiz;
      state.attemptId = attemptId;
      state.answers = [];
      state.answersMap = {};
      state.correct = [];
      state.wrong = [];
      state.startTime = new Date().toISOString();
    },
    recordAnswer(state, action) {
      const { questionId, selectedAnswer, isCorrect, question } =
        action.payload;
      state.answers.push({
        question_id: questionId,
        selected_answer: selectedAnswer,
      });
      state.answersMap[questionId] = selectedAnswer;
      if (isCorrect) {
        state.correct.push(question);
      } else {
        state.wrong.push(question);
      }
    },
    clearAttempt(state) {
      state.currentQuiz = null;
      state.attemptId = null;
      state.answers = [];
      state.answersMap = {};
      state.correct = [];
      state.wrong = [];
      state.startTime = null;
    },
  },
});

export const { startAttempt, recordAnswer, clearAttempt } =
  attemptSlice.actions;
export default attemptSlice.reducer;
