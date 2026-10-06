import * as xlsx from 'xlsx';

const RESULTS_STORAGE_KEY = 'exam_results';

/**
 * Retrieves all examination results stored in local storage cache
 * @returns {Array} List of stored student result records
 */
export function getLocalResults() {
  try {
    const raw = localStorage.getItem(RESULTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading results from storage:', err);
    return [];
  }
}

/**
 * Retrieves all examination results from host local backend (/api/results),
 * falling back to browser storage if offline or unavailable.
 * @returns {Promise<Array>} List of stored student result records
 */
export async function getStoredResults() {
  try {
    const res = await fetch('/api/results');
    if (res.ok) {
      const backendResults = await res.json();
      if (Array.isArray(backendResults)) {
        // Cache to local storage
        try {
          localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(backendResults));
        } catch (e) {}
        return backendResults;
      }
    }
  } catch (err) {
    console.warn('Could not fetch results from local backend, using cached storage:', err.message);
  }
  return getLocalResults();
}

/**
 * Saves a student's examination result into host local backend (/api/results)
 * and keeps a local copy in browser storage for immediate scorecard rendering.
 * @param {Object} resultRecord - Student score, answers, and metadata
 * @returns {Promise<Object>} Saved record with sequential S.No
 */
export async function saveResult(resultRecord) {
  let recordWithMeta = {
    ...resultRecord,
    savedAt: new Date().toISOString()
  };

  // 1. Post to host local backend API to append to results.json and res.xlsx
  try {
    const res = await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultRecord)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.record) {
        recordWithMeta = data.record;
      }
    }
  } catch (backendErr) {
    console.warn('Could not sync result to local backend endpoint:', backendErr.message);
  }

  // 2. Also save to browser storage for student's personal view
  try {
    const existing = getLocalResults();
    const sNo = recordWithMeta.sNo || (existing.length + 1);
    recordWithMeta.sNo = sNo;
    const updated = [recordWithMeta, ...existing.filter((r) => r.id !== recordWithMeta.id)];
    localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('my_last_result', JSON.stringify(recordWithMeta));
  } catch (err) {
    console.error('Error saving result to local storage:', err);
  }

  return recordWithMeta;
}

/**
 * Exports results to a downloadable Excel file (res.xlsx)
 * @param {Array} resultsData - Array of student records to export
 * @param {string} filename - Desired filename (defaults to 'res.xlsx')
 */
export function exportResultsToExcel(resultsData = null, filename = 'res.xlsx') {
  const allResults = (Array.isArray(resultsData) && resultsData.length > 0)
    ? resultsData
    : getLocalResults();
  if (!allResults || allResults.length === 0) {
    alert('No results found in storage to export.');
    return;
  }

  const EXCEL_HEADERS = [
    'S.No',
    'Student Name',
    'Batch No',
    'Score',
    'Total Marks',
    'Percentage (%)',
    'Result Status',
    'Correct Answers',
    'Wrong Answers',
    'Unattempted',
    'Submission Timestamp'
  ];

  const rows = [EXCEL_HEADERS];

  // In storage, results are newest-first; reverse to chronological order (1, 2, 3...)
  const chronological = [...allResults].reverse();

  chronological.forEach((r, idx) => {
    const sNo = idx + 1;
    const status = (r.percentage >= 50) ? 'PASS' : 'FAIL';
    const submittedDateStr = r.submittedAt
      ? new Date(r.submittedAt).toLocaleString()
      : (r.savedAt ? new Date(r.savedAt).toLocaleString() : 'N/A');

    rows.push([
      sNo,
      r.studentName || 'Unknown',
      r.batchNo || 'N/A',
      r.score ?? 0,
      r.totalMarks ?? 0,
      `${r.percentage ?? 0}%`,
      status,
      r.correct ?? 0,
      r.wrong ?? 0,
      r.unattempted ?? 0,
      submittedDateStr
    ]);
  });

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 8 },   // S.No
    { wch: 26 },  // Student Name
    { wch: 18 },  // Batch No
    { wch: 10 },  // Score
    { wch: 12 },  // Total Marks
    { wch: 16 },  // Percentage (%)
    { wch: 15 },  // Result Status
    { wch: 16 },  // Correct Answers
    { wch: 16 },  // Wrong Answers
    { wch: 16 },  // Unattempted
    { wch: 25 }   // Submission Timestamp
  ];

  xlsx.utils.book_append_sheet(wb, ws, 'Exam Results');
  xlsx.writeFile(wb, filename);
}

/**
 * Clears all stored results from localStorage and local backend
 */
export async function clearAllStoredResults() {
  try {
    await fetch('/api/results', { method: 'DELETE' });
  } catch (err) {
    console.warn('Could not clear backend results:', err.message);
  }
  localStorage.removeItem(RESULTS_STORAGE_KEY);
  localStorage.removeItem('my_last_result');
}

const ADMIN_QUESTIONS_KEY = 'admin_uploaded_questions';

/**
 * Saves questions uploaded by admin into localStorage so all students take this exam
 */
export function saveUploadedQuestions(questions) {
  try {
    localStorage.setItem(ADMIN_QUESTIONS_KEY, JSON.stringify(questions));
  } catch (err) {
    console.error('Error saving admin questions to storage:', err);
  }
}

/**
 * Retrieves questions uploaded by admin from localStorage
 */
export function getUploadedQuestions() {
  try {
    const raw = localStorage.getItem(ADMIN_QUESTIONS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

/**
 * Generates and downloads a pre-formatted Excel template for questions (questions_template.xlsx)
 */
export function downloadQuestionTemplate() {
  const sampleQuestions = [
    {
      'question no': 1,
      'type': 'MCQ',
      'question': 'Which data structure follows the Last In, First Out (LIFO) principle?',
      'options': 'Queue\nStack\nArray\nLinked List',
      'answer': 'Stack',
      'mark': 1
    },
    {
      'question no': 2,
      'type': 'DRAG_DROP',
      'question': 'Arrange the shuffled Python lines in the correct order to implement a recursive factorial function:',
      'options': 'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)',
      'answer': 'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)',
      'mark': 2
    },
    {
      'question no': 3,
      'type': 'MSQ',
      'question': 'Which of the following are valid primitive data types in JavaScript?',
      'options': 'String\nNumber\nBoolean\nArrayList',
      'answer': 'String\nNumber\nBoolean',
      'mark': 2
    },
    {
      'question no': 4,
      'type': 'FILL',
      'question': 'The default port number used by standard HTTP web traffic is ______.',
      'options': '',
      'answer': '80',
      'mark': 1
    }
  ];

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(sampleQuestions, {
    header: ['question no', 'type', 'question', 'options', 'answer', 'mark']
  });

  ws['!cols'] = [
    { wch: 12 },  // question no
    { wch: 14 },  // type
    { wch: 55 },  // question
    { wch: 45 },  // options
    { wch: 45 },  // answer
    { wch: 8 }    // mark
  ];

  xlsx.utils.book_append_sheet(wb, ws, 'Questions');
  xlsx.writeFile(wb, 'questions_template.xlsx');
}

const SETTINGS_KEY = 'exam_settings';

/**
 * Retrieves exam settings (e.g. durationMinutes) from host local backend (/api/settings)
 * with fallback to localStorage and defaults.
 * @returns {Promise<Object>} Exam settings object { durationMinutes }
 */
export async function getExamSettings() {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data && data.durationMinutes) {
        try {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
        } catch (e) {}
        return data;
      }
    }
  } catch (err) {
    console.warn('Could not fetch settings from backend:', err.message);
  }

  try {
    const cached = localStorage.getItem(SETTINGS_KEY);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  return { durationMinutes: 30 };
}

/**
 * Saves exam settings into host local backend (/api/settings) and localStorage
 * @param {Object} settings - Settings object { durationMinutes }
 * @returns {Promise<Object>} Updated settings
 */
export async function saveExamSettings(settings) {
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.settings) {
        settings = data.settings;
      }
    }
  } catch (err) {
    console.warn('Could not persist settings to backend:', err.message);
  }

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}

  return settings;
}

