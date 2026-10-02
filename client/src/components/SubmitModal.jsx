import React from 'react';

export default function SubmitModal({ isOpen, onClose, onConfirm, totalQuestions, answeredCount, isSubmitting }) {
  if (!isOpen) return null;

  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">Confirm Final Submission</h3>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <div>
          <p style={{ marginBottom: '1rem', fontSize: '0.95rem', color: '#334155' }}>
            Are you sure you want to finalize and submit your test?
          </p>

          <div style={{
            background: '#f8fafc',
            border: '1.5px solid var(--border)',
            borderRadius: '6px',
            padding: '1rem',
            marginBottom: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 600 }}>TOTAL</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{totalQuestions}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>ANSWERED</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success)' }}>{answeredCount}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>UNANSWERED</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--danger)' }}>{unansweredCount}</div>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600 }}>
            ⚠️ Once submitted, you cannot change your answers. Evaluation will be processed immediately.
          </p>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel & Return
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Evaluating...' : 'Yes, Submit Test'}
          </button>
        </div>
      </div>
    </div>
  );
}
