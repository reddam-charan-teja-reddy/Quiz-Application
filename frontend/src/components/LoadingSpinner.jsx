import './LoadingSpinner.css';

const LoadingSpinner = ({ text = 'Loading...', size = 'medium' }) => (
  <div className={`loading-spinner-container ${size}`}>
    <div className="spinner" />
    {text && <p className="loading-text">{text}</p>}
  </div>
);

export default LoadingSpinner;
