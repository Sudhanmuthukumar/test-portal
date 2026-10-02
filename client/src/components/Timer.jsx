import React, { useEffect, useState } from 'react';

export default function Timer({ initialSeconds = 1800, onTimeUp, isRunning = true }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [hasWarned, setHasWarned] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    if (secondsLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const intervalId = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          if (onTimeUp) onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning, onTimeUp, secondsLeft]);

  // Warning when 5 minutes (300 seconds) remain
  useEffect(() => {
    if (secondsLeft <= 300 && secondsLeft > 295 && !hasWarned) {
      setHasWarned(true);
    }
  }, [secondsLeft, hasWarned]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isCritical = secondsLeft <= 300; // <= 5 minutes

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
      <div className={`timer-container ${isCritical ? 'timer-warning' : ''}`}>
        <span>⏳ Time Remaining:</span>
        <span style={{ fontSize: '1.15rem' }}>{formattedTime}</span>
      </div>
      {isCritical && secondsLeft > 0 && (
        <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 'bold' }}>
          ⚠️ Less than 5 minutes remaining!
        </span>
      )}
    </div>
  );
}
