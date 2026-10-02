import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';

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

function buildResultsWorkbook(allResults) {
  const wb = xlsx.utils.book_new();
  const rows = [EXCEL_HEADERS];

  // Chronological order (S.No 1, 2, 3...)
  const chronological = [...allResults].reverse();

  chronological.forEach((r, idx) => {
    const sNo = idx + 1;
    const status = (r.percentage >= 50) ? 'PASS' : 'FAIL';
    const submittedDateStr = r.submittedAt
      ? new Date(r.submittedAt).toLocaleString()
      : 'N/A';

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
  return wb;
}

// Sequential FIFO write queue to prevent concurrent file locking clashes
let writeQueue = Promise.resolve();

function appendResultToLocalBackend(resultRecord) {
  return new Promise((resolve, reject) => {
    writeQueue = writeQueue.then(async () => {
      try {
        const resultsJsonPath = path.resolve(__dirname, 'public', 'results.json');
        const resXlsxPath = path.resolve(__dirname, 'public', 'res.xlsx');
        const resLatestPath = path.resolve(__dirname, 'public', 'res_latest.xlsx');

        let allResults = [];
        if (fs.existsSync(resultsJsonPath)) {
          try {
            allResults = JSON.parse(fs.readFileSync(resultsJsonPath, 'utf8'));
          } catch (e) {
            allResults = [];
          }
        }

        const sNo = allResults.length + 1;
        const recordWithMeta = {
          sNo,
          ...resultRecord
        };

        allResults.unshift(recordWithMeta); // Newest first in JSON
        fs.writeFileSync(resultsJsonPath, JSON.stringify(allResults, null, 2), 'utf8');

        // Build Excel workbook
        const wb = buildResultsWorkbook(allResults);

        try {
          xlsx.writeFile(wb, resXlsxPath);
          console.log(`[LOCAL BACKEND] Logged student "${recordWithMeta.studentName}" (Batch: ${recordWithMeta.batchNo}) Score: ${recordWithMeta.score}/${recordWithMeta.totalMarks} into res.xlsx`);
        } catch (excelErr) {
          if (excelErr.code === 'EBUSY') {
            console.warn('[LOCAL BACKEND NOTICE] res.xlsx is currently open in Excel. Synced to res_latest.xlsx.');
            try { xlsx.writeFile(wb, resLatestPath); } catch (e2) {}
          } else {
            console.error('[LOCAL BACKEND ERROR] Failed to write res.xlsx:', excelErr);
          }
        }

        resolve(recordWithMeta);
      } catch (err) {
        console.error('[LOCAL BACKEND ERROR] appendResultToLocalBackend:', err);
        reject(err);
      }
    });
  });
}

function localBackendPlugin() {
  const handleUploadQuestions = (req, res) => {
    if (req.method === 'POST') {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          const activeExamDest = path.resolve(__dirname, 'public', 'active_exam.xlsx');
          const defaultDest = path.resolve(__dirname, 'public', 'questions.xlsx');

          // Always write to active_exam.xlsx
          fs.writeFileSync(activeExamDest, buffer);
          console.log('[BACKEND] active_exam.xlsx successfully altered on disk at:', activeExamDest);

          // Also try to update questions.xlsx if not locked
          try {
            fs.writeFileSync(defaultDest, buffer);
            console.log('[BACKEND] questions.xlsx also successfully altered on disk at:', defaultDest);
          } catch (e) {}

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            file: 'active_exam.xlsx',
            message: 'Active examination spreadsheet successfully altered on local backend disk.'
          }));
        } catch (err) {
          console.error('[BACKEND ERROR] Failed to alter exam spreadsheet:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    } else {
      res.statusCode = 405;
      res.end('Method Not Allowed');
    }
  };

  const handleResults = (req, res) => {
    const resultsJsonPath = path.resolve(__dirname, 'public', 'results.json');

    if (req.method === 'GET') {
      let allResults = [];
      if (fs.existsSync(resultsJsonPath)) {
        try {
          allResults = JSON.parse(fs.readFileSync(resultsJsonPath, 'utf8'));
        } catch (e) {
          allResults = [];
        }
      }
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(allResults));

    } else if (req.method === 'POST') {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', async () => {
        try {
          const bodyStr = Buffer.concat(chunks).toString('utf8');
          const resultData = JSON.parse(bodyStr);
          const savedRecord = await appendResultToLocalBackend(resultData);

          res.statusCode = 201;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, record: savedRecord }));
        } catch (err) {
          console.error('[BACKEND ERROR] Failed to record result:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });

    } else if (req.method === 'DELETE') {
      try {
        if (fs.existsSync(resultsJsonPath)) {
          fs.writeFileSync(resultsJsonPath, '[]', 'utf8');
        }
        const resXlsxPath = path.resolve(__dirname, 'public', 'res.xlsx');
        if (fs.existsSync(resXlsxPath)) {
          try { fs.unlinkSync(resXlsxPath); } catch (e) {}
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, message: 'Local results cleared' }));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    } else {
      res.statusCode = 405;
      res.end('Method Not Allowed');
    }
  };

  const handleStaticGuard = (req, res, next) => {
    const rawPath = (req.url || '').split('?')[0];
    if (rawPath.endsWith('.xlsx') || rawPath.endsWith('.xls') || rawPath.endsWith('.json')) {
      const filePath = path.resolve(__dirname, 'public', rawPath.replace(/^\//, ''));
      if (!fs.existsSync(filePath)) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Not Found');
        return;
      }
    }
    next();
  };

  return {
    name: 'local-backend-plugin',
    configureServer(server) {
      server.middlewares.use(handleStaticGuard);
      server.middlewares.use('/api/upload-questions', handleUploadQuestions);
      server.middlewares.use('/api/results', handleResults);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleStaticGuard);
      server.middlewares.use('/api/upload-questions', handleUploadQuestions);
      server.middlewares.use('/api/results', handleResults);
    }
  };
}

export default defineConfig({
  plugins: [react(), localBackendPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
