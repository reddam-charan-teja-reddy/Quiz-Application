import { useState, useEffect, useCallback } from 'react';
import './QuizTimer.css';

const QuizTimer = ({ totalSeconds, onTimeUp, paused = false }) => {
  const [remaining, setRemaining] = useState(totalSeconds);

  const handleTimeUp = useCallback(() => {
    onTimeUp?.();
  }, [onTimeUp]);

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (paused || remaining <= 0) {
      if (remaining <= 0) handleTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paused, remaining, handleTimeUp]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0;
  const isLow = remaining <= 30;
  const isCritical = remaining <= 10;

  return (
    <div className={`quiz-timer ${isLow ? 'low' : ''} ${isCritical ? 'critical' : ''}`}>
      <div className="timer-display">
        <span className="timer-icon">⏱️</span>
        <span className="timer-text">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
      <div className="timer-bar">
        <div className="timer-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

export default QuizTimer;
