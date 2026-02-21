import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage

import { apiSlice } from './api/apiSlice';
import authReducer from './slices/authSlice';
import quizReducer from './slices/quizSlice';
import attemptReducer from './slices/attemptSlice';
import historyReducer from './slices/historySlice';
import uiReducer from './slices/uiSlice';

// ─── Persist only the attempt slice (survives page refresh, #13) ─
const attemptPersistConfig = {
  key: 'attempt',
  storage,
  // Persist everything in attemptSlice
};

const rootReducer = combineReducers({
  auth: authReducer,
  quiz: quizReducer,
  attempt: persistReducer(attemptPersistConfig, attemptReducer),
  history: historyReducer,
  ui: uiReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // redux-persist actions contain non-serializable values
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(apiSlice.middleware),
  devTools: import.meta.env.DEV,
});

export const persistor = persistStore(store);
