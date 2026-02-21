import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getAccessToken, API_URL } from '../../lib/api';

/**
 * RTK Query API slice — v0.4
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
  tagTypes: ['Quiz', 'MyQuiz', 'History', 'Profile', 'Stats', 'Leaderboard', 'Categories'],
  endpoints: (builder) => ({
    // ─── Quizzes ─────────────────────────────────────────────────
    getQuizzes: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams();
        if (params.search) qs.set('search', params.search);
        if (params.category) qs.set('category', params.category);
        if (params.difficulty) qs.set('difficulty', params.difficulty);
        if (params.sort) qs.set('sort', params.sort);
        if (params.order) qs.set('order', params.order);
        if (params.page) qs.set('page', params.page);
        if (params.page_size) qs.set('page_size', params.page_size);
        const str = qs.toString();
        return `/api/v1/quizzes${str ? `?${str}` : ''}`;
      },
      providesTags: (result) =>
        result?.quizzes
          ? [
              ...result.quizzes.map(({ id }) => ({ type: 'Quiz', id })),
              { type: 'Quiz', id: 'LIST' },
            ]
          : [{ type: 'Quiz', id: 'LIST' }],
    }),

    getQuiz: builder.query({
      query: (id) => `/api/v1/quizzes/${id}`,
      transformResponse: (res) => res.quiz,
      providesTags: (_result, _err, id) => [{ type: 'Quiz', id }],
    }),

    getMyQuizzes: builder.query({
      query: ({ page = 1, page_size = 20 } = {}) =>
        `/api/v1/quizzes/my?page=${page}&page_size=${page_size}`,
      providesTags: (result) =>
        result?.quizzes
          ? [
              ...result.quizzes.map(({ id }) => ({ type: 'MyQuiz', id })),
              { type: 'MyQuiz', id: 'LIST' },
            ]
          : [{ type: 'MyQuiz', id: 'LIST' }],
    }),

    createQuiz: builder.mutation({
      query: (body) => ({
        url: '/api/v1/quizzes',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Quiz', id: 'LIST' }, { type: 'MyQuiz', id: 'LIST' }, 'Profile', 'Categories'],
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
        { type: 'MyQuiz', id: 'LIST' },
        'Profile',
        'Categories',
      ],
    }),

    deleteQuiz: builder.mutation({
      query: (id) => ({
        url: `/api/v1/quizzes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Quiz', id: 'LIST' }, { type: 'MyQuiz', id: 'LIST' }, 'Profile', 'Categories'],
    }),

    duplicateQuiz: builder.mutation({
      query: (id) => ({
        url: `/api/v1/quizzes/${id}/duplicate`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Quiz', id: 'LIST' }, { type: 'MyQuiz', id: 'LIST' }, 'Profile'],
    }),

    exportQuiz: builder.query({
      query: (id) => `/api/v1/quizzes/${id}/export`,
    }),

    importQuiz: builder.mutation({
      query: (body) => ({
        url: '/api/v1/quizzes/import',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Quiz', id: 'LIST' }, { type: 'MyQuiz', id: 'LIST' }, 'Profile', 'Categories'],
    }),

    getCategories: builder.query({
      query: () => '/api/v1/categories',
      transformResponse: (res) => res.categories ?? [],
      providesTags: ['Categories'],
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
      invalidatesTags: ['History', 'Profile', 'Stats', 'Leaderboard'],
    }),

    getAttempt: builder.query({
      query: (attemptId) => `/api/v1/attempts/${attemptId}`,
      providesTags: (_result, _err, id) => [{ type: 'History', id }],
    }),

    deleteAttempt: builder.mutation({
      query: (attemptId) => ({
        url: `/api/v1/attempts/${attemptId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['History', 'Stats', 'Profile'],
    }),

    // ─── History ─────────────────────────────────────────────────
    getHistory: builder.query({
      query: () => '/api/v1/attempts',
      transformResponse: (res) => res.attempts ?? [],
      providesTags: ['History'],
    }),

    // ─── Leaderboards ────────────────────────────────────────────
    getQuizLeaderboard: builder.query({
      query: (quizId) => `/api/v1/quizzes/${quizId}/leaderboard`,
      providesTags: (_result, _err, id) => [{ type: 'Leaderboard', id }],
    }),

    getGlobalLeaderboard: builder.query({
      query: () => '/api/v1/leaderboard',
      providesTags: [{ type: 'Leaderboard', id: 'GLOBAL' }],
    }),

    // ─── Profile ─────────────────────────────────────────────────
    getProfile: builder.query({
      query: () => '/api/v1/profile',
      providesTags: ['Profile'],
    }),

    editProfile: builder.mutation({
      query: (body) => ({
        url: '/api/v1/profile',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Profile'],
    }),

    deleteAccount: builder.mutation({
      query: (body) => ({
        url: '/api/v1/profile',
        method: 'DELETE',
        body,
      }),
    }),

    changePassword: builder.mutation({
      query: (body) => ({
        url: '/api/v1/auth/password',
        method: 'PUT',
        body,
      }),
    }),

    getStats: builder.query({
      query: () => '/api/v1/stats',
      providesTags: ['Stats'],
    }),

    getPublicProfile: builder.query({
      query: (username) => `/api/v1/user/${username}`,
    }),
  }),
});

export const {
  useGetQuizzesQuery,
  useGetQuizQuery,
  useGetMyQuizzesQuery,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useDeleteQuizMutation,
  useDuplicateQuizMutation,
  useLazyExportQuizQuery,
  useImportQuizMutation,
  useGetCategoriesQuery,
  useGenerateQuizMutation,
  useStartAttemptMutation,
  useFinishAttemptMutation,
  useGetAttemptQuery,
  useDeleteAttemptMutation,
  useGetHistoryQuery,
  useGetQuizLeaderboardQuery,
  useGetGlobalLeaderboardQuery,
  useGetProfileQuery,
  useEditProfileMutation,
  useDeleteAccountMutation,
  useChangePasswordMutation,
  useGetStatsQuery,
  useGetPublicProfileQuery,
} = apiSlice;
