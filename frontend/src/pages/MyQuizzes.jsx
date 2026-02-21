import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetMyQuizzesQuery,
  useDeleteQuizMutation,
  useDuplicateQuizMutation,
  useLazyExportQuizQuery,
} from '../store/api/apiSlice';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import './MyQuizzes.css';

const PAGE_SIZE = 12;

const MyQuizzes = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetMyQuizzesQuery({ page, page_size: PAGE_SIZE });
  const [deleteQuiz, { isLoading: deleting }] = useDeleteQuizMutation();
  const [duplicateQuiz] = useDuplicateQuizMutation();
  const [triggerExport] = useLazyExportQuizQuery();

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const quizzes = data?.quizzes ?? [];

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteQuiz(confirmDelete).unwrap();
      setToast({ message: 'Quiz deleted successfully', type: 'success' });
    } catch {
      setToast({ message: 'Failed to delete quiz', type: 'error' });
    }
    setConfirmDelete(null);
  };

  const handleDuplicate = async (id) => {
    try {
      const result = await duplicateQuiz(id).unwrap();
      setToast({ message: 'Quiz duplicated! Opening editor...', type: 'success' });
      setTimeout(() => navigate(`/edit/${result.id}`), 500);
    } catch {
      setToast({ message: 'Failed to duplicate quiz', type: 'error' });
    }
  };

  const handleExport = async (id) => {
    try {
      const { data: exportData } = await triggerExport(id);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ message: 'Quiz exported', type: 'success' });
    } catch {
      setToast({ message: 'Failed to export quiz', type: 'error' });
    }
  };

  const getDifficultyColor = (d) => {
    if (d === 'easy') return '#10b981';
    if (d === 'medium') return '#f59e0b';
    if (d === 'hard') return '#ef4444';
    return '#6b7280';
  };

  return (
    <div className="myquizzes-container">
      <Sidebar />
      <div className="myquizzes-content">
        <div className="myquizzes-header">
          <h1>My Quizzes</h1>
          <button className="create-btn" onClick={() => navigate('/plus')}>
            + Create New
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner text="Loading your quizzes..." />
        ) : quizzes.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No quizzes yet"
            message="Create your first quiz to get started!"
            action={() => navigate('/plus')}
            actionText="Create Quiz"
          />
        ) : (
          <div className="myquizzes-grid">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="myquiz-card">
                <div className="myquiz-card-header">
                  <h3>{quiz.title}</h3>
                  <div className="myquiz-badges">
                    {quiz.is_published === false && (
                      <span className="badge draft">Draft</span>
                    )}
                    {quiz.difficulty && (
                      <span
                        className="badge difficulty"
                        style={{ color: getDifficultyColor(quiz.difficulty) }}
                      >
                        {quiz.difficulty}
                      </span>
                    )}
                  </div>
                </div>
                <p className="myquiz-desc">{quiz.description}</p>
                <div className="myquiz-meta">
                  <span>{quiz.num_questions} questions</span>
                  {quiz.categories?.length > 0 && (
                    <span>{quiz.categories.join(', ')}</span>
                  )}
                </div>
                <div className="myquiz-actions">
                  <button onClick={() => navigate(`/quiz/${quiz.id}`)} className="action-btn view">
                    View
                  </button>
                  <button onClick={() => navigate(`/edit/${quiz.id}`)} className="action-btn edit">
                    Edit
                  </button>
                  <button onClick={() => handleDuplicate(quiz.id)} className="action-btn dup">
                    Duplicate
                  </button>
                  <button onClick={() => handleExport(quiz.id)} className="action-btn export">
                    Export
                  </button>
                  <button onClick={() => setConfirmDelete(quiz.id)} className="action-btn delete">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {data && data.total > PAGE_SIZE && (
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(data.total / PAGE_SIZE)}
            onPageChange={setPage}
          />
        )}

        <ConfirmDialog
          open={!!confirmDelete}
          title="Delete Quiz"
          message="Are you sure you want to delete this quiz? This action cannot be undone."
          confirmText="Delete"
          variant="danger"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default MyQuizzes;
