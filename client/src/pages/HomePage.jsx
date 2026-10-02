import React, { useState } from 'react';

export default function HomePage({ onStartInstructions }) {
  const [name, setName] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name to proceed.');
      return;
    }
    if (!batchNo.trim()) {
      setError('Please enter your batch number / class to proceed.');
      return;
    }
    setError('');
    onStartInstructions(name.trim(), batchNo.trim());
  };

  return (
    <div style={{ maxWidth: '520px', margin: '3rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ borderTop: '4px solid var(--primary)', textAlign: 'center', padding: '2rem' }}>
        <div style={{
          width: '56px',
          height: '56px',
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
          fontSize: '1.75rem',
          fontWeight: 800
        }}>
          📝
        </div>

        <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
          Test portal
        </h2>
        <p style={{ color: 'var(--gray)', fontSize: '0.92rem', marginBottom: '1.75rem' }}>
          Department Internal Assessment Examination Portal
        </p>

        {error && (
          <div style={{
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            padding: '0.65rem 1rem',
            borderRadius: '6px',
            fontSize: '0.88rem',
            marginBottom: '1rem',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="studentNameInput">
              Student Full Name *
            </label>
            <input
              id="studentNameInput"
              type="text"
              className="form-input"
              placeholder="e.g. Peter"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="batchNoInput">
              Batch No *
            </label>
            <input
              id="batchNoInput"
              type="text"
              className="form-input"
              placeholder="e.g. 251001"
              value={batchNo}
              onChange={(e) => {
                setBatchNo(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginTop: '0.5rem' }}
          >
            Start Test →
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--gray)', fontSize: '0.82rem', marginTop: '1rem' }}>
        Supported directly on college LAN & local Wi-Fi. Answers evaluated securely in storage.
      </div>
    </div>
  );
}
