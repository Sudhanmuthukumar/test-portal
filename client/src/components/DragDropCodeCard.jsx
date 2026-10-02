import React, { useState, useEffect } from 'react';

/**
 * Drag and Drop Code Reordering Component
 * Allows students to drag & drop or use tactile Up/Down arrow buttons to arrange
 * shuffled code lines into the correct executable sequence.
 */
export default function DragDropCodeCard({ question, answer, onAnswerChange }) {
  const initialLines = question?.options || [];

  // Local state initialized with current answer, or falling back to question options (shuffled)
  const [lines, setLines] = useState(() => {
    if (Array.isArray(answer) && answer.length > 0) {
      return answer;
    }
    return initialLines;
  });

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Sync state if question or answer changes
  useEffect(() => {
    if (Array.isArray(answer) && answer.length > 0) {
      setLines(answer);
    } else {
      setLines(initialLines);
      if (initialLines.length > 0) {
        onAnswerChange(question.id, initialLines);
      }
    }
  }, [question?.id]);

  const updateOrder = (newLines) => {
    setLines(newLines);
    onAnswerChange(question.id, newLines);
  };

  // Move line up by 1 position
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updated = [...lines];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    updateOrder(updated);
  };

  // Move line down by 1 position
  const handleMoveDown = (index) => {
    if (index === lines.length - 1) return;
    const updated = [...lines];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    updateOrder(updated);
  };

  // Reset to original shuffled order
  const handleReset = () => {
    updateOrder(initialLines);
  };

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch (err) {}
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const updated = [...lines];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setDraggedIndex(null);
    updateOrder(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="drag-code-container">
      <div className="drag-code-toolbar">
        <span style={{ fontSize: '0.85rem', color: 'var(--gray)', fontWeight: 600 }}>
          💡 Drag lines into place or use the <strong>↑</strong> and <strong>↓</strong> buttons
        </span>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleReset}
          style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
          title="Reset to initial shuffled order"
        >
          ↺ Reset Order
        </button>
      </div>

      <div className="drag-code-list">
        {lines.map((codeLine, index) => {
          const isDragging = draggedIndex === index;
          const isOver = dragOverIndex === index;

          return (
            <div
              key={`${index}_${codeLine}`}
              className={`drag-code-row ${isDragging ? 'is-dragging' : ''} ${isOver ? 'is-drag-over' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="drag-handle" title="Drag to reorder">
                <span className="drag-icon">⠿</span>
                <span className="drag-line-number">{index + 1}</span>
              </div>

              <div className="drag-code-text">
                <pre><code>{codeLine}</code></pre>
              </div>

              <div className="drag-row-actions">
                <button
                  type="button"
                  className="drag-move-btn"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  title="Move Up"
                  aria-label="Move Up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="drag-move-btn"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === lines.length - 1}
                  title="Move Down"
                  aria-label="Move Down"
                >
                  ▼
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
