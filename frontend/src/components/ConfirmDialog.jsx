import './ConfirmDialog.css';

const ConfirmDialog = ({
  open,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
  children,
}) => {
  if (!open) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel} role='dialog' aria-modal='true' aria-labelledby='confirm-dialog-title'>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-title" id='confirm-dialog-title'>{title}</h3>
        <p className="confirm-message">{message}</p>
        {children}
        <div className="confirm-actions">
          <button className="confirm-cancel-btn" onClick={onCancel} disabled={loading} aria-label={cancelText}>
            {cancelText}
          </button>
          <button
            className={`confirm-btn confirm-${variant}`}
            onClick={onConfirm}
            disabled={loading}
            aria-label={loading ? 'Processing' : confirmText}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
