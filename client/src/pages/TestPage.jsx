import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Timer from '../components/Timer';
import QuestionCard from '../components/QuestionCard';
import QuestionPalette from '../components/QuestionPalette';
import SubmitModal from '../components/SubmitModal';
import { evaluateAnswers } from '../services/evaluator';
import { saveResult } from '../services/storage';
import { enterFullscreen, exitFullscreen, isFullscreenActive } from '../services/proctoring';

export default function TestPage({ studentName, batchNo, testData, onTestSubmitted }) {
  const questions = testData?.questions || [];
  const durationMinutes = testData?.durationMinutes || 30;

  const storageKey = `exam_ans_${((studentName || '') + '_' + (batchNo || '')).trim().replace(/\s+/g, '_')}`;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Proctoring & Fullscreen States
  const [isFullscreen, setIsFullscreen] = useState(() => isFullscreenActive());
  const [violationCount, setViolationCount] = useState(0);
  const [warningModal, setWarningModal] = useState({ show: false, count: 0 });

  const violationCountRef = useRef(0);
  const lastViolationTime = useRef(0);
  const isSubmittingRef = useRef(false);

  // Sync ref with state
  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  // Auto-save student progress locally to prevent data loss on browser refresh
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(answers));
    } catch (e) {
      // non-fatal
    }
  }, [answers, storageKey]);

  // Mark current question as visited
  useEffect(() => {
    setVisitedQuestions((prev) => new Set([...prev, currentIndex]));
  }, [currentIndex]);

  const handleAnswerChange = (questionId, newAnswer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: newAnswer
    }));
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSelectQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  };

  // Count answered questions
  const answeredCount = useMemo(() => {
    return questions.filter((q) => {
      const ans = answers[q.id];
      if (!ans) return false;
      if (Array.isArray(ans)) {
        return ans.length > 0 && String(ans[0]).trim() !== '';
      }
      return String(ans).trim() !== '';
    }).length;
  }, [answers, questions]);

  // Central submission executor (exits fullscreen upon completion)
  const executeSubmission = useCallback(async (isAutoTerminated = false) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Exit full screen as test is concluding
      exitFullscreen();

      // Client-side evaluation against loaded master questions
      const evaluation = evaluateAnswers(answers || {}, questions);

      const resultRecord = {
        id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        studentName: (studentName || 'Student').trim(),
        batchNo: (batchNo || 'N/A').trim(),
        score: evaluation.score,
        totalMarks: evaluation.totalMarks,
        percentage: evaluation.percentage,
        correct: evaluation.correct,
        wrong: evaluation.wrong,
        unattempted: evaluation.unattempted,
        submittedAt: new Date().toISOString(),
        answers: evaluation.answers
      };

      if (isAutoTerminated) {
        resultRecord.isTerminated = true;
        resultRecord.terminationReason = 'Exceeded maximum tab switch / window exit limit (more than 2 times).';
      }

      // Persist in local backend and storage
      const savedRecord = await saveResult(resultRecord);

      try {
        localStorage.removeItem(storageKey);
      } catch (e) {}

      setIsModalOpen(false);
      onTestSubmitted(savedRecord);
    } catch (err) {
      console.error('Submission error:', err);
      setSubmitError(err.message || 'Submission failed.');
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [answers, onTestSubmitted, studentName, batchNo, storageKey, questions]);

  const handleTimeUp = useCallback(() => {
    exitFullscreen();
    alert('Time has expired! Submitting your examination answers automatically.');
    executeSubmission();
  }, [executeSubmission]);

  // Trigger violation when tab switch, minimize, or fullscreen exit occurs
  const triggerViolation = useCallback((reason) => {
    if (isSubmittingRef.current) return;

    const now = Date.now();
    // Debounce to prevent multiple events firing from a single Alt-Tab
    if (now - lastViolationTime.current < 2500) {
      return;
    }
    lastViolationTime.current = now;

    const newCount = violationCountRef.current + 1;
    violationCountRef.current = newCount;
    setViolationCount(newCount);

    console.warn(`[PROCTORING VIOLATION ${newCount}] Reason: ${reason}`);

    if (newCount > 2) {
      // Terminate exam immediately on >2 violations
      setWarningModal({ show: false, count: newCount });
      alert('⚠️ EXAM TERMINATED: You switched tabs or exited full-screen more than 2 times. Your test has been submitted automatically.');
      executeSubmission(true);
    } else {
      // Show warning modal 1 or 2
      setWarningModal({ show: true, count: newCount });
    }
  }, [executeSubmission]);

  // Fullscreen and Tab-Switch Detection Listeners
  useEffect(() => {
    // 1. Ensure fullscreen on mount
    enterFullscreen();
    setIsFullscreen(isFullscreenActive());

    const handleFullscreenChange = () => {
      const active = isFullscreenActive();
      setIsFullscreen(active);
      if (!active && !isSubmittingRef.current) {
        triggerViolation('Exited Full Screen Mode');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmittingRef.current) {
        triggerViolation('Tab Switched / Window Minimized');
      }
    };

    const handleWindowBlur = () => {
      if (!isSubmittingRef.current) {
        triggerViolation('Window Focus Lost / Switched Application');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [triggerViolation]);

  // Copy-Paste, Cut, Right-Click, and Key-Shortcut Prevention
  useEffect(() => {
    const preventEvent = (e) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e) => {
      const key = (e.key || '').toLowerCase();
      // Block Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Ctrl+U, Ctrl+P, Ctrl+S
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a', 'u', 'p', 's'].includes(key)) {
        e.preventDefault();
        return false;
      }
      // Block Developer Tools (F12, Ctrl+Shift+I/J/C)
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key))
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('copy', preventEvent);
    document.addEventListener('cut', preventEvent);
    document.addEventListener('paste', preventEvent);
    document.addEventListener('contextmenu', preventEvent);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', preventEvent);
      document.removeEventListener('cut', preventEvent);
      document.removeEventListener('paste', preventEvent);
      document.removeEventListener('contextmenu', preventEvent);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleDismissWarning = () => {
    enterFullscreen();
    setWarningModal({ show: false, count: 0 });
  };

  const currentQuestion = questions[currentIndex];

  return (
    <div className="main-wrapper exam-secure-area">
      {/* Top Proctoring & Fullscreen Notice Banner if not in Fullscreen */}
      {!isFullscreen && (
        <div style={{
          background: '#fef2f2',
          border: '1.5px solid #fecaca',
          color: '#991b1b',
          borderRadius: '8px',
          padding: '0.75rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div>
            <strong>⚠️ Full Screen Warning:</strong> Full Screen mode is mandatory for this examination.
          </div>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={enterFullscreen}
          >
            ⛶ Return to Full Screen
          </button>
        </div>
      )}

      {/* Test Sticky Banner */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '0.85rem 1.25rem',
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', color: 'var(--primary)', margin: 0 }}>
            {testData?.title || 'Test portal'}
          </h2>
          <div style={{ fontSize: '0.82rem', color: 'var(--gray)', marginTop: '0.15rem' }}>
            Candidate: <strong>{studentName}</strong> {batchNo && <span>(Batch: <strong>{batchNo}</strong>)</span>} | Question {currentIndex + 1} of {questions.length}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Proctoring Warning Badge Pill */}
          <div className="warning-badge-pill" title="If tab switches exceed 2 times, the exam will be automatically terminated">
            <span>⚠️ Tab Switches:</span>
            <span style={{ color: violationCount >= 2 ? '#b91c1c' : 'inherit' }}>
              <strong>{violationCount}</strong> / 2 Allowed
            </span>
          </div>

          <Timer
            initialSeconds={durationMinutes * 60}
            onTimeUp={handleTimeUp}
            isRunning={!isSubmitting}
          />
        </div>
      </div>

      {submitError && (
        <div style={{
          background: 'var(--danger-light)',
          color: 'var(--danger)',
          padding: '0.75rem 1rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          border: '1px solid #fecaca',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div>
            <strong>Submission Warning:</strong> {submitError}
          </div>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => executeSubmission(false)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Retrying...' : '↻ Retry Submission'}
          </button>
        </div>
      )}

      {/* Main Examination Grid */}
      <div className="exam-grid">
        <div>
          <QuestionCard
            question={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            answer={currentQuestion ? answers[currentQuestion.id] : []}
            onAnswerChange={handleAnswerChange}
          />

          {/* Bottom Action Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
            padding: '1rem',
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                ← Previous
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
              >
                Next →
              </button>
            </div>

            <button
              type="button"
              className="btn btn-danger"
              style={{ fontWeight: 700 }}
              onClick={() => setIsModalOpen(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>
        </div>

        {/* Right Palette */}
        <div>
          <QuestionPalette
            questions={questions}
            currentIndex={currentIndex}
            visitedQuestions={visitedQuestions}
            answers={answers}
            onSelectQuestion={handleSelectQuestion}
          />
        </div>
      </div>

      {/* Final Submit Confirmation Modal */}
      <SubmitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => executeSubmission(false)}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        isSubmitting={isSubmitting}
      />

      {/* Proctoring Warning Modal (Violation 1 or 2) */}
      {warningModal.show && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ borderTop: '5px solid var(--danger)' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--danger)' }}>
                {warningModal.count === 1 ? '⚠️ Warning 1 of 2: Tab Switch Detected' : '🚨 FINAL WARNING (2 of 2)'}
              </h3>
            </div>

            <div style={{ margin: '1rem 0' }}>
              <p style={{ color: '#334155', fontSize: '0.95rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                {warningModal.count === 1 ? (
                  <>
                    You switched browser tabs, minimized the window, or exited full-screen mode.
                    <br /><br />
                    <strong>Note:</strong> You have <strong>1 warning remaining</strong>. Exiting or switching tabs more than 2 times will <strong>automatically terminate and submit your examination</strong>!
                  </>
                ) : (
                  <>
                    <strong style={{ color: 'var(--danger)' }}>This is your FINAL WARNING.</strong>
                    <br /><br />
                    Any additional tab switch, application switch, or exit from full-screen will <strong>IMMEDIATELY TERMINATE AND SUBMIT</strong> your test with no further chance to answer!
                  </>
                )}
              </p>

              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                color: '#991b1b'
              }}>
                Recorded Violations: <strong>{warningModal.count} / 2</strong>. Next violation will terminate your test.
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-danger"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
                onClick={handleDismissWarning}
              >
                ⛶ I Understand, Return to Full Screen Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
