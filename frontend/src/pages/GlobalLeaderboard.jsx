import { useGetGlobalLeaderboardQuery } from '../store/api/apiSlice';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './GlobalLeaderboard.css';

const GlobalLeaderboard = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetGlobalLeaderboardQuery();

  const entries = data?.entries ?? [];

  const getMedalEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="gl-container">
      <Sidebar />
      <div className="gl-content">
        <div className="gl-header">
          <h1>🏆 Global Leaderboard</h1>
          <p>Top performers ranked by average score</p>
        </div>

        {isLoading ? (
          <LoadingSpinner text="Loading leaderboard..." />
        ) : error ? (
          <div className="gl-error">
            <p>Failed to load leaderboard.</p>
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="No rankings yet"
            message="Complete quizzes to appear on the leaderboard!"
            action={() => navigate('/home')}
            actionText="Browse Quizzes"
          />
        ) : (
          <div className="gl-table-wrapper">
            <table className="gl-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>Avg Score</th>
                  <th>Attempts</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr
                    key={entry.username}
                    className={index < 3 ? `top-${index + 1}` : ''}
                    onClick={() => navigate(`/user/${entry.username}`)}
                  >
                    <td className="rank-cell">{getMedalEmoji(index)}</td>
                    <td className="user-cell">
                      <span className="user-avatar">
                        {entry.username.charAt(0).toUpperCase()}
                      </span>
                      {entry.username}
                    </td>
                    <td
                      className="score-cell"
                      style={{ color: getScoreColor(entry.average_score) }}
                    >
                      {Math.round(entry.average_score)}%
                    </td>
                    <td className="attempts-cell">{entry.total_attempts}</td>
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

export default GlobalLeaderboard;
