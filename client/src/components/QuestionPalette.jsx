import React from 'react';

export default function QuestionPalette({
  questions = [],
  currentIndex = 0,
  visitedQuestions = new Set(),
  answers = {},
  onSelectQuestion
}) {
  const getQuestionState = (idx, qId) => {
    const isCurrent = idx === currentIndex;
    const ans = answers[qId];
    const isAnswered =
      ans !== undefined &&
      ans !== null &&
      ((Array.isArray(ans) && ans.length > 0 && String(ans[0]).trim() !== '') ||
       (typeof ans === 'string' && ans.trim() !== ''));

    const isVisited = visitedQuestions.has(idx);

    let stateClass = 'not-visited';
    if (isAnswered) {
      stateClass = 'answered';
    } else if (isVisited) {
      stateClass = 'visited';
    }

    if (isCurrent) {
      stateClass += ' current';
    }

    return stateClass;
  };

  return (
    <div className="card palette-card">
      <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.85rem', fontSize: '1rem' }}>
        Question Navigator
      </div>

      <div className="palette-grid">
        {questions.map((q, idx) => {
          const stateClass = getQuestionState(idx, q.id);
          return (
            <button
              key={q.id}
              type="button"
              className={`palette-btn ${stateClass}`}
              onClick={() => onSelectQuestion(idx)}
              title={`Question ${idx + 1}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      <div className="palette-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}></div>
          <span>Answered</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: 'var(--warning-light)', borderColor: 'var(--warning)' }}></div>
          <span>Visited</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#ffffff', borderColor: 'var(--border)' }}></div>
          <span>Not Visited</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ border: '2px solid var(--primary)', backgroundColor: '#fff' }}></div>
          <span>Current</span>
        </div>
      </div>
    </div>
  );
}
