import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          maxWidth: '600px',
          margin: '4rem auto',
          padding: '2rem',
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #fecaca',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ color: '#b91c1c', marginBottom: '0.75rem' }}>Application Error</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            An unexpected error occurred while rendering the examination portal.
          </p>
          <div style={{
            background: '#fef2f2',
            padding: '0.75rem',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            color: '#991b1b',
            marginBottom: '1.5rem',
            textAlign: 'left',
            overflowX: 'auto'
          }}>
            {this.state.error?.message || String(this.state.error)}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={this.handleReload}
          >
            Reload Examination Portal
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
