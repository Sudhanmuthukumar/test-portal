import React, { useState } from 'react';

export default function AdminLoginPage({ onLoginSuccess, onBackToStudentPortal }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    // Default admin credentials: admin / welcome
    if (username.trim() === 'admin' && password === 'welcome') {
      setError('');
      onLoginSuccess();
    } else {
      setError('Invalid admin credentials. (Hint: admin / welcome)');
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3.5rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ borderTop: '4px solid var(--primary)', padding: '2rem' }}>
        <div style={{
          width: '56px',
          height: '56px',
          backgroundColor: '#eff6ff',
          color: 'var(--primary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
          fontSize: '1.75rem',
          fontWeight: 800
        }}>
          🛡️
        </div>

        <h2 style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: '0.35rem', fontSize: '1.4rem' }}>
          Admin Login
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--gray)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
          Manage examination questions & view candidate results
        </p>

        {error && (
          <div style={{
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            padding: '0.65rem 1rem',
            borderRadius: '6px',
            fontSize: '0.88rem',
            marginBottom: '1.25rem',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="adminUsername">
              Admin Username
            </label>
            <input
              id="adminUsername"
              type="text"
              className="form-input"
              placeholder="Username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="adminPassword">
              Admin Password
            </label>
            <input
              id="adminPassword"
              type="password"
              className="form-input"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginTop: '0.5rem' }}
          >
            Login to Admin Dashboard →
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onBackToStudentPortal}
          >
            ← Return to Student Test Portal
          </button>
        </div>
      </div>
    </div>
  );
}
