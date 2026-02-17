import { useState, useEffect } from 'react';
import { useQuiz } from '../contexts/QuizContext';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import QuizCard from '../components/QuizCard';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const { quizzes, fetchQuizzes, loading } = useQuiz();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    if (user) {
      fetchQuizzes();
    }
  }, [user, fetchQuizzes]);

  // Get unique categories
  const categories = [
    ...new Set(quizzes.flatMap((quiz) => quiz.categories || [])),
  ];

  // Filter quizzes based on search and category
  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory ||
      (quiz.categories && quiz.categories.includes(selectedCategory));

    return matchesSearch && matchesCategory;
  });

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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='search-input'
            />
          </div>

          <div className='category-filter'>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className='category-select'>
              <option value=''>All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className='quizzes-grid'>
          {loading ? (
            <div className='loading-state'>
              <div className='spinner'></div>
              <p>Loading quizzes...</p>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className='empty-state'>
              <div className='empty-icon'>📚</div>
              <h3>No quizzes found</h3>
              <p>
                {searchTerm || selectedCategory
                  ? 'Try adjusting your search or category filter.'
                  : 'No quizzes available yet. Create your first quiz!'}
              </p>
            </div>
          ) : (
            filteredQuizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
