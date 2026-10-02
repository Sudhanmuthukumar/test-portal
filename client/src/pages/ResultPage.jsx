import React from 'react';

export default function ResultPage({ result, onRetake }) {
  if (!result) return null;

  const {
    studentName,
    score,
    totalMarks,
    percentage,
    correct,
    wrong,
    unattempted,
    submittedAt,
    answers = []
  } = result;

  const isPassed = percentage >= 50;

  return (
    <div style={{ maxWidth: '850px', margin: '2rem auto', padding: '0 1rem' }}>
      {/* Result Card */}
      <div className="card" style={{ borderTop: `5px solid ${isPassed ? 'var(--success)' : 'var(--danger)'}` }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            fontSize: '3rem',
            margin: '0 auto 0.5rem',
            lineHeight: 1
          }}>
            {isPassed ? '🎓' : '📋'}
          </div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
            Test Completed
          </h2>
          <div style={{ fontSize: '1rem', color: 'var(--gray)' }}>
            Student: <strong style={{ color: 'var(--dark)' }}>{studentName}</strong>
            {result.batchNo && result.batchNo !== 'N/A' && (
              <span style={{ marginLeft: '0.75rem' }}>| Batch: <strong style={{ color: 'var(--dark)' }}>{result.batchNo}</strong></span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            Submitted at {submittedAt ? new Date(submittedAt).toLocaleString() : 'N/A'}
          </div>

          {result.isTerminated && (
            <div style={{
              background: '#fef2f2',
              color: '#991b1b',
              border: '1.5px solid #fecaca',
              padding: '0.65rem 1rem',
              borderRadius: '6px',
              fontSize: '0.88rem',
              marginTop: '0.75rem',
              fontWeight: 600
            }}>
              🚨 Exam Auto-Terminated: Tab switching or exiting full-screen occurred more than 2 times. Your current answers were finalized and recorded.
            </div>
          )}
        </div>

        {/* Score Breakdown Grid */}
        <div className="score-summary-grid">
          <div className="summary-stat-box primary">
            <div className="stat-label">FINAL SCORE</div>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>
              {score} / {totalMarks}
            </div>
          </div>
          <div className="summary-stat-box primary">
            <div className="stat-label">PERCENTAGE</div>
            <div className="stat-value" style={{ color: isPassed ? 'var(--success)' : 'var(--danger)' }}>
              {percentage}%
            </div>
          </div>
          <div className="summary-stat-box success">
            <div className="stat-label">CORRECT</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {correct}
            </div>
          </div>
          <div className="summary-stat-box danger">
            <div className="stat-label">WRONG</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>
              {wrong}
            </div>
          </div>
          <div className="summary-stat-box gray">
            <div className="stat-label">UNATTEMPTED</div>
            <div className="stat-value" style={{ color: 'var(--gray)' }}>
              {unattempted}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          <button type="button" className="btn btn-primary" onClick={onRetake}>
            Take Another Test
          </button>
        </div>
      </div>

      {/* Detailed Question Review */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1rem' }}>
          Question-by-Question Review
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {answers.map((item, idx) => {
            let statusText = '';
            let statusClass = '';
            let badgeClass = '';

            if (item.isCorrect) {
              statusText = '✓ Correct';
              statusClass = 'correct';
              badgeClass = 'badge-success';
            } else if (item.isUnattempted) {
              statusText = '— Unattempted';
              statusClass = 'unattempted';
              badgeClass = 'badge-gray';
            } else {
              statusText = '✗ Wrong';
              statusClass = 'wrong';
              badgeClass = 'badge-danger';
            }

            const isCodeType = item.type === 'DRAG_DROP' || item.type === 'CODE_ORDER';

            return (
              <div key={item.questionId || idx} className={`review-item ${statusClass}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--dark)' }}>
                      Q{idx + 1}
                    </span>
                    <span className={`badge ${badgeClass}`}>{statusText}</span>
                    <span className="badge badge-primary">{isCodeType ? 'CODE ORDER' : item.type}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: item.isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                    {item.marksObtained} / {item.marks} {item.marks === 1 ? 'Mark' : 'Marks'}
                  </div>
                </div>

                <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem' }}>
                  {item.question}
                </div>

                {isCodeType ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '0.75rem',
                    fontSize: '0.88rem'
                  }}>
                    <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155' }}>
                      <div style={{ color: item.isCorrect ? '#4ade80' : '#f87171', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.82rem' }}>
                        YOUR ARRANGED CODE:
                      </div>
                      <pre style={{ margin: 0, color: '#f1f5f9', fontFamily: 'Consolas, monospace', fontSize: '0.85rem', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                        <code>{item.studentAnswer && item.studentAnswer.length > 0 ? item.studentAnswer.join('\n') : '(Unattempted)'}</code>
                      </pre>
                    </div>

                    <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155' }}>
                      <div style={{ color: '#4ade80', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.82rem' }}>
                        CORRECT EXECUTABLE SEQUENCE:
                      </div>
                      <pre style={{ margin: 0, color: '#f1f5f9', fontFamily: 'Consolas, monospace', fontSize: '0.85rem', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                        <code>{item.correctAnswer && item.correctAnswer.length > 0 ? item.correctAnswer.join('\n') : 'N/A'}</code>
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '0.75rem',
                    fontSize: '0.88rem',
                    background: '#f8fafc',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)'
                  }}>
                    <div>
                      <span style={{ color: 'var(--gray)', fontWeight: 600 }}>Your Answer: </span>
                      <strong style={{ color: item.isCorrect ? 'var(--success)' : (item.isUnattempted ? '#64748b' : 'var(--danger)') }}>
                        {item.studentAnswer && item.studentAnswer.length > 0 ? item.studentAnswer.join(', ') : 'None (Unattempted)'}
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--gray)', fontWeight: 600 }}>Correct Answer: </span>
                      <strong style={{ color: 'var(--success)' }}>
                        {item.correctAnswer && item.correctAnswer.length > 0 ? item.correctAnswer.join(', ') : 'N/A'}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
