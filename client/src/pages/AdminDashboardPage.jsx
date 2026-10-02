import React, { useState, useEffect, useRef } from 'react';
import { parseWorkbook, loadDefaultQuestions } from '../services/questionLoader';
import {
  saveUploadedQuestions,
  getUploadedQuestions,
  getStoredResults,
  exportResultsToExcel,
  clearAllStoredResults,
  downloadQuestionTemplate
} from '../services/storage';

export default function AdminDashboardPage({ onGoToStudentPortal, onLogout }) {
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'results'
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef(null);

  // Load questions and results on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Check if admin uploaded custom questions
      const adminQuestions = getUploadedQuestions();
      if (adminQuestions && adminQuestions.length > 0) {
        setQuestions(adminQuestions);
      } else {
        // Fallback to default questions.xlsx
        const defaultData = await loadDefaultQuestions();
        setQuestions(defaultData.questions || []);
      }

      // 2. Load stored results from local backend
      const stored = await getStoredResults();
      setResults(stored);
    } catch (err) {
      console.error('Error loading admin data:', err);
      setStatusMessage({ type: 'error', text: `Failed to load data: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle uploading an Excel file
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseWorkbook(buffer);

      if (!parsed || parsed.length === 0) {
        throw new Error('No questions found in the uploaded Excel file.');
      }

      // 1. Alter questions.xlsx on backend disk
      let backendNotice = '';
      try {
        const uploadRes = await fetch('/api/upload-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: buffer
        });
        const uploadData = await uploadRes.json().catch(() => ({}));
        if (uploadRes.ok && uploadData.success) {
          backendNotice = '✓ questions.xlsx altered on backend disk. ';
        } else if (uploadData.isLocked) {
          backendNotice = '⚠️ Note: questions.xlsx is open in Excel on your system (close Excel to allow overwriting the file on disk). ';
        }
      } catch (backendErr) {
        console.warn('Backend file update notice:', backendErr.message);
      }

      // 2. Save to storage and activate
      saveUploadedQuestions(parsed);
      setQuestions(parsed);
      setStatusMessage({
        type: 'success',
        text: `Successfully imported ${parsed.length} questions from "${file.name}"! ${backendNotice}Active for all students.`
      });
    } catch (err) {
      console.error('Error importing Excel:', err);
      setStatusMessage({ type: 'error', text: `Error importing file: ${err.message}` });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Clear student results
  const handleClearResults = async () => {
    if (!window.confirm('Are you sure you want to permanently clear all stored student exam results? This action cannot be undone.')) {
      return;
    }
    await clearAllStoredResults();
    setResults([]);
    setStatusMessage({ type: 'success', text: 'All stored examination results have been cleared.' });
  };

  // Stats calculation
  const totalQuestions = questions.length;
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  const typeCounts = questions.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {});

  const filteredResults = results.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.studentName && r.studentName.toLowerCase().includes(q)) ||
      (r.batchNo && r.batchNo.toLowerCase().includes(q))
    );
  });

  return (
    <div className="main-wrapper" style={{ maxWidth: '1100px', margin: '1.5rem auto' }}>
      {/* Top Admin Header */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '1rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--primary)',
            color: 'white',
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem'
          }}>
            ⚙️
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>
              Admin Dashboard
            </h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--gray)' }}>
              Add & manage questions via Excel and download student results
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onGoToStudentPortal}
          >
            ← Open Student Portal
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage.text && (
        <div style={{
          background: statusMessage.type === 'error' ? 'var(--danger-light)' : 'var(--success-light)',
          color: statusMessage.type === 'error' ? 'var(--danger)' : 'var(--success)',
          padding: '0.75rem 1.25rem',
          borderRadius: '6px',
          marginBottom: '1.25rem',
          border: `1px solid ${statusMessage.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage({ type: '', text: '' })}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 800, color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'questions' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('questions')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span>📂 Manage Questions (Excel)</span>
          <span className="badge" style={{ background: activeTab === 'questions' ? 'rgba(255,255,255,0.25)' : 'var(--primary)', color: 'white' }}>
            {totalQuestions}
          </span>
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'results' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('results')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span>📊 Candidate Results</span>
          <span className="badge" style={{ background: activeTab === 'results' ? 'rgba(255,255,255,0.25)' : 'var(--primary)', color: 'white' }}>
            {results.length}
          </span>
        </button>
      </div>

      {/* TAB 1: QUESTION MANAGEMENT (EXCEL) */}
      {activeTab === 'questions' && (
        <div>
          {/* Upload Banner Card */}
          <div className="card" style={{ borderTop: '4px solid var(--primary)', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
              Add / Update Questions via Excel Spreadsheet
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--gray)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Upload your question bank spreadsheet in <strong>.xlsx</strong> or <strong>.xls</strong> format.
              Expected columns: <code>question no</code>, <code>type</code> (MCQ, MSQ, FILL, DRAG_DROP), <code>question</code>, <code>options</code>, <code>answer</code>, <code>mark</code>.
            </p>

            <div style={{
              background: '#f8fafc',
              border: '2px dashed var(--border)',
              borderRadius: '8px',
              padding: '1.5rem',
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
              <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.35rem' }}>
                Select Questions Excel File (.xlsx / .xls)
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: '1rem' }}>
                Supports standard MCQs, MSQs, Fill-in-the-blanks, and Drag & Drop code ordering questions!
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📁 Browse & Upload Excel File
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={downloadQuestionTemplate}
                  title="Download an empty/sample Excel template"
                >
                  📥 Download Question Template (.xlsx)
                </button>
              </div>
            </div>

            {/* Active Bank Stats Pills */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              background: '#f1f5f9',
              padding: '0.85rem 1.25rem',
              borderRadius: '6px',
              alignItems: 'center',
              fontSize: '0.88rem'
            }}>
              <div><strong>Active Bank:</strong> {totalQuestions} Questions ({totalMarks} Total Marks)</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-primary">MCQ: {typeCounts['MCQ'] || 0}</span>
                <span className="badge badge-success">DRAG & DROP: {typeCounts['DRAG_DROP'] || 0}</span>
                <span className="badge badge-primary">MSQ: {typeCounts['MSQ'] || 0}</span>
                <span className="badge badge-gray">FILL: {typeCounts['FILL'] || 0}</span>
              </div>
            </div>
          </div>

          {/* Question List Preview */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '1rem' }}>
              Preview of Loaded Questions ({questions.length})
            </h3>

            {questions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray)' }}>
                No questions loaded. Please upload a questions Excel file above.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '0.85rem 1rem',
                      background: '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary)' }}>Q{idx + 1}</span>
                        <span className="badge badge-primary">
                          {q.type === 'DRAG_DROP' ? 'CODE ORDER' : q.type}
                        </span>
                      </div>
                      <span className="badge badge-gray">{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}</span>
                    </div>

                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--dark)', marginBottom: '0.5rem' }}>
                      {q.question}
                    </div>

                    {q.type === 'DRAG_DROP' ? (
                      <div style={{ background: '#0f172a', padding: '0.65rem', borderRadius: '4px', border: '1px solid #334155' }}>
                        <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.25rem' }}>
                          CORRECT CODE SEQUENCE:
                        </div>
                        <pre style={{ margin: 0, color: '#f1f5f9', fontFamily: 'Consolas, monospace', fontSize: '0.85rem', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                          <code>{Array.isArray(q.answer) ? q.answer.join('\n') : q.answer}</code>
                        </pre>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
                        {q.options && q.options.length > 0 && (
                          <div style={{ marginBottom: '0.25rem' }}>
                            <strong>Options:</strong> {q.options.join(' | ')}
                          </div>
                        )}
                        <div>
                          <strong style={{ color: 'var(--success)' }}>Answer:</strong> {Array.isArray(q.answer) ? q.answer.join(', ') : q.answer}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CANDIDATE RESULTS */}
      {activeTab === 'results' && (
        <div>
          <div className="card" style={{ borderTop: '4px solid var(--success)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)', margin: 0 }}>
                  Candidate Examination Submissions
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
                  Total {results.length} student submission(s) recorded in local database (host disk)
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={async () => {
                    const fresh = await getStoredResults();
                    setResults(fresh);
                  }}
                  title="Reload latest submissions from local host database"
                >
                  🔄 Refresh
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => exportResultsToExcel(results, 'res.xlsx')}
                  disabled={results.length === 0}
                  title="Export all results as an Excel sheet (res.xlsx)"
                >
                  📥 Export All Results (res.xlsx)
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleClearResults}
                  disabled={results.length === 0}
                  style={{ color: 'var(--danger)' }}
                >
                  🗑️ Clear Results
                </button>
              </div>
            </div>

            {/* Filter Search */}
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="🔍 Search candidate by name or batch number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Results Table */}
            {filteredResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray)' }}>
                {results.length === 0
                  ? 'No exam submissions recorded yet. Submissions will automatically appear here as students complete tests.'
                  : 'No submissions matched your search query.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', fontSize: '0.88rem' }}>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Candidate Name</th>
                      <th>Batch No</th>
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Status</th>
                      <th>Correct / Wrong</th>
                      <th>Submission Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((r, idx) => {
                      const isPassed = (r.percentage ?? 0) >= 50;
                      return (
                        <tr key={r.id || idx}>
                          <td style={{ fontWeight: 700 }}>{r.sNo || idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{r.studentName}</td>
                          <td>{r.batchNo || 'N/A'}</td>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            {r.score} / {r.totalMarks}
                          </td>
                          <td style={{ fontWeight: 700, color: isPassed ? 'var(--success)' : 'var(--danger)' }}>
                            {r.percentage}%
                          </td>
                          <td>
                            <span className={`badge ${isPassed ? 'badge-success' : 'badge-danger'}`}>
                              {isPassed ? 'PASS' : 'FAIL'}
                            </span>
                            {r.isTerminated && (
                              <span className="badge badge-danger" style={{ marginLeft: '0.3rem' }} title="Exceeded tab switch limit">
                                Terminated
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{ color: 'var(--success)', fontWeight: 600 }}>{r.correct}</span> / <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{r.wrong}</span>
                          </td>
                          <td style={{ color: 'var(--gray)', fontSize: '0.82rem' }}>
                            {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
