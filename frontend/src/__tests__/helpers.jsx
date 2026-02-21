/**
 * Test utility — renders components with Redux Provider and Router.
 * Use this instead of raw render() for any component that uses Redux or Router.
 */
import { render } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import { apiSlice } from '../store/api/apiSlice';
import authReducer from '../store/slices/authSlice';
import quizReducer from '../store/slices/quizSlice';
import attemptReducer from '../store/slices/attemptSlice';
import historyReducer from '../store/slices/historySlice';
import uiReducer from '../store/slices/uiSlice';

/**
 * Create a fresh test store with optional preloaded state.
 */
export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      auth: authReducer,
      quiz: quizReducer,
      attempt: attemptReducer,
      history: historyReducer,
      ui: uiReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState,
  });
}

/**
 * Render with Redux Provider and MemoryRouter.
 *
 * @param {JSX.Element} ui - Component to render
 * @param {object} options
 * @param {object} options.preloadedState - Initial Redux state
 * @param {object} options.store - Custom store (overrides preloadedState)
 * @param {string[]} options.initialEntries - Router initial entries
 * @param {object} options.renderOptions - Additional RTL render options
 */
export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    initialEntries = ['/'],
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
