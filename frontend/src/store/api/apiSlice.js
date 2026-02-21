import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getAccessToken, API_URL } from '../../lib/api';

/**
 * RTK Query API slice.
 *
 * Centralises all data-fetching with automatic caching, invalidation,
 * and loading/error state.  Auth endpoints live in authSlice (thunks)
 * because they manage side-effects (tokens, cookies) that don't fit
 * the RTK Query pattern cleanly.
 */
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return headers;
    },
  }),
  tagTypes: ['Quiz', 'History', 'Profile'],
  endpoints: (builder) => ({
    // ─── Quizzes ─────────────────────────────────────────────────
    getQuizzes: builder.query({
      query: () => '/api/v1/quizzes',
      transformResponse: (res) => res.quizzes ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Quiz', id })),
              { type: 'Quiz', id: 'LIST' },
            ]
          : [{ type: 'Quiz', id: 'LIST' }],
    }),

    getQuiz: builder.query({
      query: (id) => `/api/v1/quizzes/${id}`,
      transformResponse: (res) => res.quiz,
      providesTags: (_result, _err, id) => [{ type: 'Quiz', id }],
    }),

    createQuiz: builder.mutation({
      query: (body) => ({
        url: '/api/v1/quizzes',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Quiz', id: 'LIST' }, 'Profile'],
    }),

    updateQuiz: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/quizzes/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Quiz', id },
        { type: 'Quiz', id: 'LIST' },
        'Profile',
      ],
    }),

    generateQuiz: builder.mutation({
      query: (prompt) => ({
        url: '/api/v1/generate',
        method: 'POST',
        body: { prompt },
      }),
      transformResponse: (res) => res.quiz,
    }),

    // ─── Attempts ────────────────────────────────────────────────
    startAttempt: builder.mutation({
      query: (quizId) => ({
        url: `/api/v1/attempts/start/${quizId}`,
        method: 'POST',
      }),
    }),

    finishAttempt: builder.mutation({
      query: ({ attemptId, answers }) => ({
        url: `/api/v1/attempts/${attemptId}/finish`,
        method: 'POST',
        body: { answers },
      }),
      invalidatesTags: ['History', 'Profile'],
    }),

    // ─── History ─────────────────────────────────────────────────
    getHistory: builder.query({
      query: () => '/api/v1/attempts',
      transformResponse: (res) => res.attempts ?? [],
      providesTags: ['History'],
    }),

    // ─── Profile ─────────────────────────────────────────────────
    getProfile: builder.query({
      query: () => '/api/v1/profile',
      providesTags: ['Profile'],
    }),
  }),
});

export const {
  useGetQuizzesQuery,
  useGetQuizQuery,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useGenerateQuizMutation,
  useStartAttemptMutation,
  useFinishAttemptMutation,
  useGetHistoryQuery,
  useGetProfileQuery,
} = apiSlice;
