import * as xlsx from 'xlsx';
import { getUploadedQuestions } from './storage';

/**
 * Shuffles an array in-place using Fisher-Yates algorithm,
 * ensuring the shuffled array is not already in the solved order (if length > 1).
 */
export function shuffleLines(array) {
  const arr = [...array];
  if (arr.length <= 1) return arr;

  let isIdentical = true;
  let attempts = 0;

  while (isIdentical && attempts < 10) {
    attempts++;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Check if still identical to original
    isIdentical = arr.every((item, idx) => item === array[idx]);
  }

  // If still identical after 10 tries, force a swap
  if (isIdentical && arr.length > 1) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }

  return arr;
}

/**
 * Splits a cell value by line breaks or pipes
 */
function splitLinesOrPipes(val) {
  if (val === null || val === undefined) return [];
  if (Array.isArray(val)) return val;
  const str = String(val).trim();
  if (!str) return [];

  if (str.includes('\n')) {
    return str.split(/\r?\n/).map(s => s.trimEnd()).filter(Boolean);
  }
  if (str.includes(' | ')) {
    return str.split(' | ').map(s => s.trimEnd()).filter(Boolean);
  }
  return [str];
}

/**
 * Normalizes header keys to lowercase with no spaces/underscores
 */
function normalizeHeaderKey(key) {
  return String(key || '').toLowerCase().replace(/[\s_\-.]/g, '');
}

/**
 * Parses raw Excel rows into structured exam questions
 * Expected columns: question no, type, question, options (optional), answer, mark
 * @param {Array} rawRows - Array of row objects from xlsx.utils.sheet_to_json
 * @returns {Array} List of normalized question objects
 */
export function parseQuestionsFromRows(rawRows) {
  if (!rawRows || rawRows.length === 0) {
    throw new Error('The Excel sheet contains no question rows.');
  }

  return rawRows.map((row, index) => {
    // Map normalized keys
    const rowMap = {};
    for (const [k, v] of Object.entries(row)) {
      rowMap[normalizeHeaderKey(k)] = v;
    }

    const qNo = rowMap['questionno'] || rowMap['qno'] || rowMap['sno'] || rowMap['no'] || (index + 1);
    const rawType = String(rowMap['type'] || 'MCQ').trim().toUpperCase();
    const questionText = String(rowMap['question'] || rowMap['questiontext'] || '').trim();
    const rawOptions = rowMap['options'] || rowMap['choices'] || rowMap['codelines'] || rowMap['lines'] || '';
    const rawAnswer = rowMap['answer'] || rowMap['correctanswer'] || '';
    const marks = Number(rowMap['mark'] || rowMap['marks'] || 1);

    // Determine normalized question type
    let type = 'MCQ';
    if (rawType.includes('DRAG') || rawType.includes('ORDER') || rawType.includes('CODE') || rawType === 'SHUFFLE') {
      type = 'DRAG_DROP';
    } else if (rawType.includes('MSQ') || rawType.includes('MULTI')) {
      type = 'MSQ';
    } else if (rawType.includes('FILL') || rawType.includes('BLANK')) {
      type = 'FILL';
    } else {
      type = 'MCQ';
    }

    let options = [];
    let answer = [];

    if (type === 'DRAG_DROP') {
      // For code reordering:
      const correctLines = splitLinesOrPipes(rawAnswer);
      const providedLines = rawOptions ? splitLinesOrPipes(rawOptions) : [];

      const masterLines = correctLines.length > 0 ? correctLines : providedLines;

      // If the teacher manually entered shuffled lines in options, preserve that exact order!
      // Only auto-shuffle if options was left empty.
      if (providedLines.length > 0) {
        options = providedLines;
      } else {
        options = shuffleLines(masterLines);
      }

      // If answer was specified as 1-based index numbers (e.g. 2, 4, 1, 3, 5), map to lines in options
      const isIndexSequence = correctLines.length > 0 &&
        correctLines.every(item => /^\d+$/.test(item.trim()) && Number(item.trim()) >= 1 && Number(item.trim()) <= options.length);

      if (isIndexSequence) {
        answer = correctLines.map(idx => options[Number(idx.trim()) - 1]);
      } else {
        answer = masterLines;
      }

    } else if (type === 'MCQ') {
      options = splitLinesOrPipes(rawOptions);
      answer = [String(rawAnswer).trim()];

    } else if (type === 'MSQ') {
      options = splitLinesOrPipes(rawOptions);
      answer = splitLinesOrPipes(rawAnswer).map(s => s.trim());

    } else if (type === 'FILL') {
      options = [];
      answer = splitLinesOrPipes(rawAnswer).map(s => s.trim());
    }

    return {
      id: Number(qNo) || (index + 1),
      type,
      question: questionText,
      options,
      answer,
      marks: isNaN(marks) || marks <= 0 ? 1 : marks
    };
  });
}

/**
 * Checks if an ArrayBuffer has valid Excel binary magic bytes:
 * - .xlsx is ZIP format: 0x50 0x4B (PK)
 * - .xls is Compound File Binary: 0xD0 0xCF
 */
function isValidExcelBuffer(buffer) {
  if (!buffer || buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer.slice(0, 4));
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4B;
  const isBiff = bytes[0] === 0xD0 && bytes[1] === 0xCF;
  return isZip || isBiff;
}

/**
 * Safely fetches an Excel file, rejecting SPA HTML fallbacks
 */
async function fetchValidExcelBuffer(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('text/html')) {
      return null;
    }
    const buffer = await res.arrayBuffer();
    if (!isValidExcelBuffer(buffer)) {
      return null;
    }
    return buffer;
  } catch (e) {
    return null;
  }
}

/**
 * Loads and parses an Excel workbook (ArrayBuffer or binary)
 * @param {ArrayBuffer} data - Binary content of the .xlsx or .xls file
 * @returns {Array} Parsed questions list
 */
export function parseWorkbook(data) {
  if (!isValidExcelBuffer(data)) {
    throw new Error('The selected file is not a valid Excel document (.xlsx or .xls).');
  }
  const wb = xlsx.read(data, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[firstSheetName];
  const rawRows = xlsx.utils.sheet_to_json(sheet);
  return parseQuestionsFromRows(rawRows);
}

/**
 * Fetches default questions: checks admin-uploaded questions first,
 * then falls back to /questions.xlsx in public directory.
 * @returns {Promise<Object>} Exam data with title, duration, marks, and questions
 */
export async function loadDefaultQuestions() {
  const adminSaved = getUploadedQuestions();
  if (adminSaved && Array.isArray(adminSaved) && adminSaved.length > 0) {
    return formatExamData(adminSaved);
  }

  // 1. Try active_exam.xlsx (if uploaded by admin on host)
  let buffer = await fetchValidExcelBuffer(`/active_exam.xlsx?t=${Date.now()}`);

  // 2. Fall back to default questions.xlsx
  if (!buffer) {
    buffer = await fetchValidExcelBuffer(`/questions.xlsx?t=${Date.now()}`);
  }

  // 3. Fall back to legacy questions.xls
  if (!buffer) {
    buffer = await fetchValidExcelBuffer(`/questions.xls?t=${Date.now()}`);
  }

  if (!buffer) {
    throw new Error('Could not find questions.xlsx in public folder or Admin uploads.');
  }

  const questions = parseWorkbook(buffer);
  return formatExamData(questions);
}

/**
 * Formats question list into exam package
 */
export function formatExamData(questions, durationMinutes = 30) {
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  return {
    title: 'Test portal',
    durationMinutes,
    totalQuestions: questions.length,
    totalMarks,
    questions
  };
}
