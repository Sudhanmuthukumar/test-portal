import React from 'react';
import DragDropCodeCard from './DragDropCodeCard';

export default function QuestionCard({ question, currentIndex, totalQuestions, answer, onAnswerChange }) {
  if (!question) return null;

  const { id, type, question: text, options = [], marks = 1 } = question;

  // Handle MCQ selection
  const handleMcqSelect = (opt) => {
    onAnswerChange(id, [opt]);
  };

  // Handle MSQ selection (toggle)
  const handleMsqToggle = (opt) => {
    const currentList = Array.isArray(answer) ? [...answer] : [];
    const exists = currentList.includes(opt);
    let updated;
    if (exists) {
      updated = currentList.filter(item => item !== opt);
    } else {
      updated = [...currentList, opt];
    }
    onAnswerChange(id, updated);
  };

  // Handle Fill input
  const handleFillChange = (e) => {
    onAnswerChange(id, [e.target.value]);
  };

  const preventClipboard = (e) => {
    e.preventDefault();
  };

  return (
    <div
      className="card exam-secure-area"
      style={{ minHeight: '380px', display: 'flex', flexDirection: 'column' }}
      onCopy={preventClipboard}
      onCut={preventClipboard}
      onPaste={preventClipboard}
      onContextMenu={preventClipboard}
    >
      <div className="question-meta">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span className="badge badge-primary">{type === 'DRAG_DROP' ? 'CODE ORDER' : type}</span>
        </div>
        <div>
          <span className="badge badge-gray">{marks} {marks === 1 ? 'Mark' : 'Marks'}</span>
        </div>
      </div>

      <div className="question-title">
        {text}
      </div>

      {type === 'DRAG_DROP' && (
        <div className="question-instruction" style={{ color: 'var(--primary)' }}>
          🧩 Drag and Drop Question: Arrange the shuffled lines of code into the correct executable sequence.
        </div>
      )}

      {type === 'MSQ' && (
        <div className="question-instruction">
          ℹ️ Multiple Selection Question: Select all correct answers.
        </div>
      )}

      {type === 'FILL' && (
        <div className="question-instruction" style={{ color: 'var(--gray)' }}>
          ✏️ Fill in the Blank: Type your answer below (no copy-pasting allowed).
        </div>
      )}

      <div style={{ flex: 1, marginTop: '1rem' }}>
        {type === 'MCQ' && (
          <div className="options-container">
            {options.map((opt, idx) => {
              const isSelected = Array.isArray(answer) && answer.includes(opt);
              return (
                <label key={idx} className={`option-box ${isSelected ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`mcq_${id}`}
                    value={opt}
                    checked={isSelected}
                    onChange={() => handleMcqSelect(opt)}
                  />
                  <span style={{ fontWeight: 600, marginRight: '0.6rem', color: 'var(--primary)' }}>
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <span className="option-text">{opt}</span>
                </label>
              );
            })}
          </div>
        )}

        {type === 'MSQ' && (
          <div className="options-container">
            {options.map((opt, idx) => {
              const isSelected = Array.isArray(answer) && answer.includes(opt);
              return (
                <label key={idx} className={`option-box ${isSelected ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    name={`msq_${id}_${idx}`}
                    value={opt}
                    checked={isSelected}
                    onChange={() => handleMsqToggle(opt)}
                  />
                  <span style={{ fontWeight: 600, marginRight: '0.6rem', color: 'var(--primary)' }}>
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <span className="option-text">{opt}</span>
                </label>
              );
            })}
          </div>
        )}

        {type === 'FILL' && (
          <div style={{ maxWidth: '500px', marginTop: '0.5rem' }}>
            <label className="form-label" htmlFor={`fill_${id}`}>Your Answer:</label>
            <input
              id={`fill_${id}`}
              type="text"
              className="form-input"
              style={{ fontSize: '1.05rem', padding: '0.75rem' }}
              placeholder="Type your response here..."
              value={Array.isArray(answer) && answer[0] !== undefined ? answer[0] : ''}
              onChange={handleFillChange}
              onPaste={preventClipboard}
              onCopy={preventClipboard}
              onCut={preventClipboard}
              onContextMenu={preventClipboard}
              autoComplete="off"
            />
          </div>
        )}

        {type === 'DRAG_DROP' && (
          <DragDropCodeCard
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
          />
        )}
      </div>
    </div>
  );
}
