import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import InstructionsPage from './pages/InstructionsPage';
import TestPage from './pages/TestPage';
import ResultPage from './pages/ResultPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { loadDefaultQuestions, formatExamData } from './services/questionLoader';
import { exitFullscreen } from './services/proctoring';

export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'instructions' | 'test' | 'result' | 'adminLogin' | 'adminDashboard'
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const [studentName, setStudentName] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [testData, setTestData] = useState(null);
  const [latestResult, setLatestResult] = useState(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [appError, setAppError] = useState('');

  const handleStartInstructions = (name, batch, customQuestions = null) => {
    setStudentName(name);
    setBatchNo(batch);
    if (customQuestions) {
      setTestData(formatExamData(customQuestions));
    }
    setCurrentView('instructions');
  };

  const handleBeginTest = async () => {
    if (testData && testData.questions && testData.questions.length > 0) {
      setCurrentView('test');
      return;
    }

    setIsLoadingQuestions(true);
    setAppError('');
    try {
      const data = await loadDefaultQuestions();
      setTestData(data);
      setCurrentView('test');
    } catch (err) {
      console.error('Error loading questions:', err);
      setAppError(err.message || 'Unable to load questions from Excel file (questions.xlsx). Make sure questions.xlsx is in the public folder.');
    } finally {
      setIsLoadingQuestions(false);
    }
  };


  const handleTestSubmitted = (result) => {
    exitFullscreen();
    setLatestResult(result);
    setCurrentView('result');
  };

  const handleRetake = () => {
    setStudentName('');
    setBatchNo('');
    setTestData(null);
    setLatestResult(null);
    setCurrentView('home');
  };

  const handleNavigate = (view) => {
    if (currentView === 'test' && view !== 'test') {
      if (!window.confirm('Are you sure you want to leave the active test?')) {
        return;
      }
    }
    setCurrentView(view);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setCurrentView('adminDashboard');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setCurrentView('home');
  };

  return (
    <div>
      <Navbar
        studentName={studentName}
        batchNo={batchNo}
        currentView={currentView}
        isAdminLoggedIn={isAdminLoggedIn}
        onNavigate={handleNavigate}
        onOpenAdminLogin={() => setCurrentView('adminLogin')}
        onAdminLogout={handleAdminLogout}
      />

      {isLoadingQuestions && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--primary)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          <div style={{ fontWeight: 600 }}>Loading examination questions from Excel...</div>
        </div>
      )}

      {appError && (
        <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' }}>
          <div style={{
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            padding: '1rem',
            borderRadius: '6px',
            border: '1px solid #fecaca',
            textAlign: 'center'
          }}>
            <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Question Loading Error</p>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{appError}</p>
            <button className="btn btn-outline btn-sm" onClick={() => setAppError('')}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {!isLoadingQuestions && !appError && (
        <>
          {currentView === 'home' && (
            <HomePage
              onStartInstructions={handleStartInstructions}
            />
          )}

          {currentView === 'instructions' && (
            <InstructionsPage
              studentName={studentName}
              batchNo={batchNo}
              onBeginTest={handleBeginTest}
              onBack={() => setCurrentView('home')}
            />
          )}

          {currentView === 'test' && (
            <TestPage
              studentName={studentName}
              batchNo={batchNo}
              testData={testData}
              onTestSubmitted={handleTestSubmitted}
            />
          )}

          {currentView === 'result' && (
            <ResultPage
              result={latestResult}
              onRetake={handleRetake}
            />
          )}

          {currentView === 'adminLogin' && (
            <AdminLoginPage
              onLoginSuccess={handleAdminLoginSuccess}
              onBackToStudentPortal={() => setCurrentView('home')}
            />
          )}

          {currentView === 'adminDashboard' && (
            <AdminDashboardPage
              onGoToStudentPortal={() => setCurrentView('home')}
              onLogout={handleAdminLogout}
            />
          )}
        </>
      )}
    </div>
  );
}
