import { useState, useCallback, useEffect, useDeferredValue } from 'react';
import { useGetQuizzesQuery, useGetCategoriesQuery } from '../store/api/apiSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  setSearchTerm,
  setSelectedCategory,
  setSelectedDifficulty,
  setSortBy,
  setSortOrder,
  setCurrentPage,
} from '../store/slices/quizSlice';
import Sidebar from '../components/Sidebar';
import QuizCard from '../components/QuizCard';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './Home.css';

const Home = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const {
    searchTerm,
    selectedCategory,
    selectedDifficulty,
    sortBy,
    sortOrder,
    currentPage,
    pageSize,
  } = useAppSelector((state) => state.quiz);

  useEffect(() => { document.title = 'Home — QuizApp'; }, []);

  // Local search input with debounce
  const [localSearch, setLocalSearch] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setSearchTerm(localSearch));
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, dispatch]);

  // Build query params for server-side filtering
  const queryParams = {};
  if (searchTerm) queryParams.search = searchTerm;
  if (selectedCategory) queryParams.category = selectedCategory;
  if (selectedDifficulty) queryParams.difficulty = selectedDifficulty;
  if (sortBy) queryParams.sort = sortBy;
  if (sortOrder) queryParams.order = sortOrder;
  queryParams.page = currentPage;
  queryParams.page_size = pageSize;

  // Defer query params so the UI stays responsive during rapid filter changes
  const deferredQueryParams = useDeferredValue(queryParams);

  const { data, isLoading } = useGetQuizzesQuery(deferredQueryParams, {
    skip: !user,
  });

  const quizzes = data?.quizzes ?? [];
  const totalQuizzes = data?.total ?? 0;
  const totalPages = Math.ceil(totalQuizzes / pageSize);

  // Get categories from dedicated endpoint
  const { data: categories = [] } = useGetCategoriesQuery(undefined, { skip: !user });

  const handlePageChange = useCallback(
    (page) => dispatch(setCurrentPage(page)),
    [dispatch]
  );

  return (
    <div className='home-container'>
      <Sidebar />

      <div className='home-content'>
        <div className='home-header'>
          <h1>Available Quizzes</h1>
          <p>Discover and take quizzes on various topics</p>
        </div>

        <div className='home-filters'>
          <div className='search-container'>
            <input
              type='text'
              placeholder='Search quizzes...'
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className='search-input'
            />
          </div>

          <div className='filter-group'>
            <select
              value={selectedCategory}
              onChange={(e) => dispatch(setSelectedCategory(e.target.value))}
              className='category-select'>
              <option value=''>All Categories</option>
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name} ({cat.count})
                </option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => dispatch(setSelectedDifficulty(e.target.value))}
              className='category-select'>
              <option value=''>All Difficulties</option>
              <option value='easy'>Easy</option>
              <option value='medium'>Medium</option>
              <option value='hard'>Hard</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [s, o] = e.target.value.split('-');
                dispatch(setSortBy(s));
                dispatch(setSortOrder(o));
              }}
              className='category-select'>
              <option value='date-desc'>Newest First</option>
              <option value='date-asc'>Oldest First</option>
              <option value='title-asc'>Title A–Z</option>
              <option value='title-desc'>Title Z–A</option>
            </select>
          </div>
        </div>

        <div className='quizzes-grid'>
          {isLoading ? (
            <div className='loading-state'>
              <LoadingSpinner text='Loading quizzes...' />
            </div>
          ) : quizzes.length === 0 ? (
            <div className='loading-state'>
              <EmptyState
                icon='📚'
                title='No quizzes found'
                message={
                  searchTerm || selectedCategory || selectedDifficulty
                    ? 'Try adjusting your search or filters.'
                    : 'No quizzes available yet. Create your first quiz!'
                }
              />
            </div>
          ) : (
            quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))
          )}
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};

export default Home;
