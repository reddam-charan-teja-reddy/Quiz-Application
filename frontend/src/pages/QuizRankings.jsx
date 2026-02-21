import { useParams, useNavigate } from 'react-router-dom';
import { useGetQuizLeaderboardQuery } from '../store/api/apiSlice';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './QuizRankings.css';

const QuizRankings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetQuizLeaderboardQuery(id);

  const getMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className='quiz-rankings-container'>
      <Sidebar />

      <div className='quiz-rankings-content'>
        <div className='rankings-header'>
          <button onClick={() => navigate(`/quiz/${id}`)} className='back-btn'>
            ← Back to Quiz
          </button>
          <h1>🏆 Quiz Leaderboard</h1>
          {data?.quiz_title && <p className='quiz-title-sub'>{data.quiz_title}</p>}
        </div>

        {isLoading ? (
          <LoadingSpinner text='Loading leaderboard...' />
        ) : error ? (
          <div className='error-state'>
            <div className='error-icon'>⚠️</div>
            <h2>Error Loading Leaderboard</h2>
            <p>{error?.data?.detail || 'Failed to load leaderboard'}</p>
          </div>
        ) : !data?.entries?.length ? (
          <EmptyState
            icon='🏆'
            title='No Rankings Yet'
            message='Be the first to take this quiz and claim the top spot!'
          />
        ) : (
          <div className='rankings-table-wrapper'>
            <table className='rankings-table'>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>Score</th>
                  <th>Correct</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry, index) => (
                  <tr
                    key={`${entry.username}-${index}`}
                    className={index < 3 ? `top-${index + 1}` : ''}>
                    <td className='rank-cell'>
                      <span className={index < 3 ? 'medal' : 'rank-number'}>
                        {getMedal(index + 1)}
                      </span>
                    </td>
                    <td className='user-cell'>{entry.username}</td>
                    <td
                      className='score-cell'
                      style={{ color: getScoreColor(entry.score) }}>
                      {Math.round(entry.score)}%
                    </td>
                    <td className='correct-cell'>
                      {entry.correct_count}/{entry.total}
                    </td>
                    <td className='date-cell'>
                      {entry.created_at
                        ? new Date(entry.created_at).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizRankings;
