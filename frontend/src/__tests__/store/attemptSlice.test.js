import reducer, {
  startAttempt,
  recordAnswer,
  clearAttempt,
} from '../../store/slices/attemptSlice';

const initialState = {
  currentQuiz: null,
  attemptId: null,
  answers: [],
  answersMap: {},
  correct: [],
  wrong: [],
  startTime: null,
};

describe('attemptSlice', () => {
  it('has the correct initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialState);
  });

  describe('startAttempt', () => {
    it('sets quiz data, attemptId and resets answers', () => {
      const quiz = { _id: 'q1', title: 'Test Quiz' };
      const state = reducer(initialState, startAttempt({ quiz, attemptId: 'a1' }));

      expect(state.currentQuiz).toEqual(quiz);
      expect(state.attemptId).toBe('a1');
      expect(state.answers).toEqual([]);
      expect(state.answersMap).toEqual({});
      expect(state.correct).toEqual([]);
      expect(state.wrong).toEqual([]);
      expect(state.startTime).toBeTruthy();
    });

    it('resets previous attempt data when starting a new one', () => {
      const prev = {
        ...initialState,
        currentQuiz: { _id: 'old' },
        answers: [{ question_id: 'x', selected_answer: 'A' }],
        answersMap: { x: 'A' },
        correct: [{ _id: 'x' }],
      };
      const quiz = { _id: 'q2', title: 'New Quiz' };
      const state = reducer(prev, startAttempt({ quiz, attemptId: 'a2' }));

      expect(state.currentQuiz).toEqual(quiz);
      expect(state.answers).toEqual([]);
      expect(state.answersMap).toEqual({});
      expect(state.correct).toEqual([]);
      expect(state.wrong).toEqual([]);
    });
  });

  describe('recordAnswer', () => {
    it('stores a correct answer', () => {
      const prev = {
        ...initialState,
        currentQuiz: { _id: 'q1' },
        attemptId: 'a1',
      };
      const question = { _id: 'q1_1', text: 'What is 1+1?' };
      const state = reducer(
        prev,
        recordAnswer({
          questionId: 'q1_1',
          selectedAnswer: '2',
          isCorrect: true,
          question,
        })
      );

      expect(state.answers).toEqual([{ question_id: 'q1_1', selected_answer: '2' }]);
      expect(state.answersMap).toEqual({ q1_1: '2' });
      expect(state.correct).toEqual([question]);
      expect(state.wrong).toEqual([]);
    });

    it('stores an incorrect answer', () => {
      const prev = {
        ...initialState,
        currentQuiz: { _id: 'q1' },
        attemptId: 'a1',
      };
      const question = { _id: 'q1_2', text: 'Capital of France?' };
      const state = reducer(
        prev,
        recordAnswer({
          questionId: 'q1_2',
          selectedAnswer: 'Berlin',
          isCorrect: false,
          question,
        })
      );

      expect(state.answers).toEqual([{ question_id: 'q1_2', selected_answer: 'Berlin' }]);
      expect(state.answersMap).toEqual({ q1_2: 'Berlin' });
      expect(state.correct).toEqual([]);
      expect(state.wrong).toEqual([question]);
    });

    it('appends to existing answers', () => {
      const prev = {
        ...initialState,
        answers: [{ question_id: 'q1', selected_answer: 'A' }],
        answersMap: { q1: 'A' },
        correct: [{ _id: 'q1' }],
      };
      const question = { _id: 'q2' };
      const state = reducer(
        prev,
        recordAnswer({
          questionId: 'q2',
          selectedAnswer: 'B',
          isCorrect: false,
          question,
        })
      );

      expect(state.answers).toHaveLength(2);
      expect(state.answersMap).toEqual({ q1: 'A', q2: 'B' });
      expect(state.wrong).toEqual([question]);
    });
  });

  describe('clearAttempt', () => {
    it('resets all state to initial values', () => {
      const prev = {
        currentQuiz: { _id: 'q1' },
        attemptId: 'a1',
        answers: [{ question_id: 'q1', selected_answer: 'A' }],
        answersMap: { q1: 'A' },
        correct: [{ _id: 'q1' }],
        wrong: [{ _id: 'q2' }],
        startTime: '2026-01-01T00:00:00.000Z',
      };
      const state = reducer(prev, clearAttempt());
      expect(state).toEqual(initialState);
    });
  });
});
