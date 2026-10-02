import React from 'react';

export default function Navbar({
  studentName,
  batchNo,
  onNavigate,
  isAdminLoggedIn,
  currentView,
  onOpenAdminLogin,
  onAdminLogout
}) {
  const isInTest = currentView === 'test';

  return (
    <header className="app-navbar">
      <div
        className="brand"
        onClick={() => !isInTest && onNavigate && onNavigate('home')}
        style={{ cursor: isInTest ? 'default' : 'pointer' }}
      >
        <div className="brand-icon">TP</div>
        <div>
          <div className="brand-title">Test portal</div>
          <div className="brand-subtitle">Department of Computer Science & Engineering</div>
        </div>
      </div>

      <div className="nav-actions">
        {studentName && isInTest && (
          <div className="candidate-badge">
            Candidate: <strong>{studentName}</strong>
            {batchNo && <span style={{ marginLeft: '0.45rem', opacity: 0.9 }}>({batchNo})</span>}
          </div>
        )}

        {!isInTest && (
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            {isAdminLoggedIn ? (
              <>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.1)' }}
                  onClick={() => onNavigate && onNavigate('adminDashboard')}
                >
                  ⚙️ Admin Dashboard
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ color: '#fca5a5', borderColor: '#fca5a5', background: 'transparent' }}
                  onClick={onAdminLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              currentView !== 'adminLogin' && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.1)' }}
                  onClick={onOpenAdminLogin}
                  title="Admin login to upload Excel questions and view results"
                >
                  🛡️ Admin Login
                </button>
              )
            )}
          </div>
        )}
      </div>
    </header>
  );
}
