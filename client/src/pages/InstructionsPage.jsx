import React from 'react';
import { enterFullscreen } from '../services/proctoring';

export default function InstructionsPage({ studentName, batchNo, testData, onBeginTest, onBack }) {
  const questionCount = testData?.questions?.length ?? testData?.totalQuestions ?? 0;
  const durationMinutes = testData?.durationMinutes ?? 30;
  const totalMarks = testData?.totalMarks ?? 0;

  const handleStart = () => {
    enterFullscreen();
    onBeginTest();
  };

  return (
    <div style={{ maxWidth: '780px', margin: '2rem auto' }}>
      <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Examination Instructions</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginTop: '0.2rem' }}>
              Candidate: <strong>{studentName}</strong>
              {batchNo && <span> | Batch: <strong>{batchNo}</strong></span>}
            </div>
          </div>
          <span className="badge badge-primary">{durationMinutes} Minutes</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 600 }}>DURATION</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{durationMinutes} Mins</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 600 }}>QUESTIONS</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{questionCount} Questions</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 600 }}>MAX MARKS</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{totalMarks} Marks</div>
          </div>
        </div>

        <h3 style={{ fontSize: '1.05rem', color: 'var(--dark)', marginBottom: '0.75rem' }}>
          Question Formats:
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '0.92rem' }}>
          <div style={{ background: '#f1f5f9', padding: '0.75rem 1rem', borderRadius: '6px' }}>
            <strong>1. Multiple Choice Questions (MCQ):</strong> Select exactly one correct option.
          </div>
          <div style={{ background: '#f1f5f9', padding: '0.75rem 1rem', borderRadius: '6px' }}>
            <strong>2. Multiple Select Questions (MSQ):</strong> Select all correct options. The answer is evaluated as correct <em>only if your selection matches the correct answer set exactly</em>.
          </div>
          <div style={{ background: '#f1f5f9', padding: '0.75rem 1rem', borderRadius: '6px' }}>
            <strong>3. Fill in the Blank (FILL):</strong> Type the answer into the box provided. Grading is case-insensitive and trims unnecessary whitespace.
          </div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.75rem 1rem', borderRadius: '6px' }}>
            <strong>4. Drag & Drop Code (CODE ORDER):</strong> Rearrange shuffled code lines into the correct executable sequence using drag-and-drop or the <strong>↑</strong> / <strong>↓</strong> buttons.
          </div>
        </div>

        <h3 style={{ fontSize: '1.05rem', color: 'var(--danger)', marginBottom: '0.75rem' }}>
          🔒 Strict Proctoring & Examination Rules:
        </h3>

        <ul style={{
          paddingLeft: '1.25rem',
          marginBottom: '2rem',
          fontSize: '0.9rem',
          color: '#334155',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          background: '#fef2f2',
          padding: '1rem 1.5rem',
          borderRadius: '6px',
          border: '1px solid #fecaca'
        }}>
          <li><strong>Mandatory Full Screen:</strong> The exam will automatically activate in Full Screen mode when you click Begin Examination.</li>
          <li><strong>Tab Switch & Window Exit Limit:</strong> Switching browser tabs, minimizing the window, or exiting full screen is actively monitored. If you switch tabs or exit <strong>more than 2 times</strong>, your exam will be <strong>automatically terminated and submitted</strong>!</li>
          <li><strong>No Copy-Paste:</strong> Copying, cutting, pasting, and right-clicking are strictly disabled throughout the test.</li>
          <li><strong>Timer Auto-Submit:</strong> When the countdown timer reaches <strong>00:00</strong>, your test is automatically submitted.</li>
        </ul>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <button type="button" className="btn btn-outline" onClick={onBack}>
            ← Change Details
          </button>
          <button type="button" className="btn btn-success" style={{ padding: '0.65rem 1.5rem' }} onClick={handleStart}>
            Enter Full Screen & Begin Test →
          </button>
        </div>
      </div>
    </div>
  );
}
