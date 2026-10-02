/**
 * Client-Side Evaluator for Student Online Examination Portal
 * Evaluates MCQ, MSQ, FILL, and DRAG_DROP (Code Line Reordering) questions
 */

/**
 * Normalizes a line of code or text for whitespace-tolerant matching
 */
function normalizeLine(str) {
  return String(str || '').trimEnd();
}

/**
 * Normalizes text for fill-in-the-blank questions
 */
function normalizeFill(str) {
  return String(str || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Evaluates student answers against master questions.
 * @param {Object} studentAnswers - Map of questionId -> student response
 * @param {Array} masterQuestions - Master question list loaded from Excel
 * @returns {Object} Evaluation summary with score, percentage, counts, and detailed breakdown
 */
export function evaluateAnswers(studentAnswers = {}, masterQuestions = []) {
  let score = 0;
  let totalMarks = 0;
  let correct = 0;
  let wrong = 0;
  let unattempted = 0;

  const evaluatedAnswers = masterQuestions.map((q) => {
    const qId = q.id;
    const marks = Number(q.marks || 1);
    totalMarks += marks;

    const rawStudentAnswer = studentAnswers[qId] !== undefined ? studentAnswers[qId] : null;
    let isCorrect = false;
    let isUnattempted = false;

    // Normalize student answer representation
    let cleanStudentAnswer = [];
    if (rawStudentAnswer === null || rawStudentAnswer === undefined) {
      isUnattempted = true;
    } else if (typeof rawStudentAnswer === 'string') {
      const trimmed = rawStudentAnswer.trim();
      if (trimmed === '') {
        isUnattempted = true;
      } else {
        cleanStudentAnswer = [trimmed];
      }
    } else if (Array.isArray(rawStudentAnswer)) {
      const filtered = rawStudentAnswer.map(item => String(item)).filter(item => item.trim() !== '');
      if (filtered.length === 0) {
        isUnattempted = true;
      } else {
        cleanStudentAnswer = filtered;
      }
    } else {
      isUnattempted = true;
    }

    const masterAnswers = Array.isArray(q.answer) ? q.answer : [q.answer];

    if (isUnattempted) {
      unattempted++;
      return {
        questionId: qId,
        type: q.type,
        question: q.question,
        options: q.options || [],
        studentAnswer: [],
        correctAnswer: masterAnswers,
        isCorrect: false,
        isUnattempted: true,
        marksObtained: 0,
        marks
      };
    }

    if (q.type === 'MCQ') {
      // Exactly one answer required
      const studOption = (cleanStudentAnswer[0] || '').trim();
      const targetOption = String(masterAnswers[0] || '').trim();
      isCorrect = (studOption.toLowerCase() === targetOption.toLowerCase());

    } else if (q.type === 'MSQ') {
      // Multiple answers allowed. Exact set matching required.
      const studSet = Array.from(new Set(cleanStudentAnswer.map(s => String(s).trim().toLowerCase()))).sort();
      const targetSet = Array.from(new Set(masterAnswers.map(s => String(s).trim().toLowerCase()))).sort();

      isCorrect = (
        studSet.length === targetSet.length &&
        studSet.every((val, index) => val === targetSet[index])
      );

    } else if (q.type === 'FILL') {
      // Case-insensitive, whitespace collapsed
      const studNormalized = normalizeFill(cleanStudentAnswer[0] || '');
      const acceptedNormalized = masterAnswers.map(ans => normalizeFill(ans));

      isCorrect = studNormalized !== '' && acceptedNormalized.includes(studNormalized);

    } else if (q.type === 'DRAG_DROP' || q.type === 'CODE_ORDER') {
      // Drag and drop code line reordering:
      const studLines = cleanStudentAnswer.map(normalizeLine);
      const targetLines = masterAnswers.map(normalizeLine);

      // Check exact match (preserving indentation)
      const exactMatch = (
        studLines.length === targetLines.length &&
        studLines.every((line, idx) => line === targetLines[idx])
      );

      // Also check trimmed match in case indentation whitespace varied in Excel cells
      const trimmedMatch = (
        studLines.length === targetLines.length &&
        studLines.every((line, idx) => line.trim() === targetLines[idx].trim())
      );

      isCorrect = exactMatch || trimmedMatch;
    }

    let marksObtained = 0;
    if (isCorrect) {
      marksObtained = marks;
      score += marks;
      correct++;
    } else {
      wrong++;
    }

    return {
      questionId: qId,
      type: q.type,
      question: q.question,
      options: q.options || [],
      studentAnswer: cleanStudentAnswer,
      correctAnswer: masterAnswers,
      isCorrect,
      isUnattempted: false,
      marksObtained,
      marks
    };
  });

  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  return {
    score,
    totalMarks,
    percentage,
    correct,
    wrong,
    unattempted,
    answers: evaluatedAnswers
  };
}
