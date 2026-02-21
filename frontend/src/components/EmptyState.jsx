import './EmptyState.css';

const EmptyState = ({ icon = '📭', title, message, action, actionText }) => (
  <div className="empty-state-component">
    <div className="empty-state-icon">{icon}</div>
    <h3 className="empty-state-title">{title}</h3>
    {message && <p className="empty-state-message">{message}</p>}
    {action && (
      <button className="empty-state-btn" onClick={action}>
        {actionText || 'Get Started'}
      </button>
    )}
  </div>
);

export default EmptyState;
