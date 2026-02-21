import { useEffect } from 'react';
import { useGetStatsQuery } from '../store/api/apiSlice';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './StatsPage.css';

const COLORS = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#667eea'];

const StatsPage = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useGetStatsQuery();

  useEffect(() => { document.title = 'Statistics — QuizApp'; }, []);

  if (isLoading) {
    return (
      <div className="stats-container">
        <Sidebar />
        <div className="stats-content"><LoadingSpinner text="Loading statistics..." /></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="stats-container">
        <Sidebar />
        <div className="stats-content">
          <EmptyState icon="📊" title="No statistics" message="Take some quizzes to see your stats!" action={() => navigate('/home')} actionText="Browse Quizzes" />
        </div>
      </div>
    );
  }

  const getScoreColor = (s) => (s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444');

  // Transform score distribution for chart
  const scoreDistData = (stats.score_distribution ?? []).map((d) => ({
    range: d.range,
    count: d.count,
  }));

  const categoryData = (stats.category_breakdown ?? []).map((c) => ({
    name: c.category || 'Uncategorized',
    attempts: c.attempts,
    avg: Math.round(c.average_score),
  }));

  return (
    <div className="stats-container">
      <Sidebar />
      <div className="stats-content">
        <div className="stats-header">
          <h1>📊 Your Statistics</h1>
          <p>Track your quiz performance over time</p>
        </div>

        {/* Summary cards */}
        <div className="stats-cards">
          <div className="stat-card-lg">
            <div className="stat-value-lg" style={{ color: getScoreColor(stats.average_score ?? 0) }}>
              {Math.round(stats.average_score ?? 0)}%
            </div>
            <div className="stat-label-lg">Average Score</div>
          </div>
          <div className="stat-card-lg">
            <div className="stat-value-lg">{stats.total_attempts ?? 0}</div>
            <div className="stat-label-lg">Total Attempts</div>
          </div>
          <div className="stat-card-lg">
            <div className="stat-value-lg" style={{ color: '#10b981' }}>
              {Math.round(stats.best_score ?? 0)}%
            </div>
            <div className="stat-label-lg">Best Score</div>
          </div>
        </div>

        {/* Score Distribution Chart */}
        {scoreDistData.length > 0 && (
          <div className="chart-section">
            <h2>Score Distribution</h2>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreDistData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="range" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Attempts" radius={[4, 4, 0, 0]}>
                    {scoreDistData.map((_entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <div className="chart-section">
            <h2>Performance by Category</h2>
            <div className="charts-row">
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="avg" name="Avg Score %" fill="#667eea" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="attempts"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {categoryData.map((_entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Recent Attempts */}
        {(stats.recent_attempts ?? []).length > 0 && (
          <div className="recent-section">
            <h2>Recent Attempts</h2>
            <div className="recent-list">
              {stats.recent_attempts.map((a) => (
                <div key={a.attempt_id} className="recent-item">
                  <div className="recent-info">
                    <h4>{a.quiz_title || 'Untitled Quiz'}</h4>
                    <span className="recent-date">
                      {a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <div className="recent-score" style={{ color: getScoreColor(a.score) }}>
                    {a.score}%
                  </div>
                  <div className="recent-detail">
                    {a.correct_count}/{a.total}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPage;
