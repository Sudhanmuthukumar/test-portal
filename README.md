# Test Portal - College Online Examination System

A modern, standalone, zero-backend **Online Examination Portal** built for college computer laboratories, campus networks, and classrooms.

- **Website Name**: Test portal
- **Architecture**: Lightweight React 18 + Vite application with built-in local backend endpoints. No external server, database setup, or separate Node process required!
- **Admin Portal**: Dedicated **Admin Login** (`admin` / `welcome`) to upload questions in Excel (`.xlsx` / `.xls`), view question stats, and monitor/export student test results (`res.xlsx`).
- **Student Privacy**: Students see **only their own scorecard** (their individual marks, score, and detailed question review). They **cannot** view or download other candidates' results.
- **Local Host Storage (No External Server)**: All student exam submissions from all lab PCs are centrally saved on the **local host computer running the portal** into `client/public/results.json` and `client/public/res.xlsx`. No data is ever sent to any remote or external college server!
- **Interactive Question Formats**:
  - **MCQ** (Multiple Choice Questions)
  - **MSQ** (Multiple Select Questions)
  - **FILL** (Fill in the Blank)
  - **DRAG_DROP / CODE ORDER** (Drag and drop shuffled lines of code into the correct executable order!)

---

## 1. Admin Portal & Excel Question Management

### A. Accessing the Admin Dashboard
1. Click **"🛡️ Admin Login"** in the top-right corner of the navigation bar.
2. Enter the admin credentials:
   - **Username**: `admin`
   - **Password**: `welcome`
3. Click **"Login to Admin Dashboard"**.

### B. Uploading Questions in Excel (.xlsx / .xls)
Inside the Admin Dashboard under **"📂 Manage Questions (Excel)"**:
- Click **"📁 Browse & Upload Excel File"** to upload any question spreadsheet.
- The system automatically parses the questions, sets them as the **active examination** for all students on this portal, and displays a complete preview with question type breakdown.
- Click **"📥 Download Question Template (.xlsx)"** to get a pre-formatted template.

### C. Required Excel Columns:
| Column Name | Description | Example |
| :--- | :--- | :--- |
| **`question no`** | Sequential question number | `1`, `2`, `3`... |
| **`type`** | Question format: `MCQ`, `MSQ`, `FILL`, or `DRAG_DROP` | `DRAG_DROP` |
| **`question`** | The question text or prompt | `Arrange the shuffled Python lines to calculate factorial:` |
| **`options`** | Choices for MCQ/MSQ, or code lines for DRAG_DROP (separated by newline `\n` or `\|`) | Lines of code or choices |
| **`answer`** | Correct answer (for DRAG_DROP: lines in correct order; for MCQ: option text; for MSQ: correct options; for FILL: accepted text) | Correct code sequence |
| **`mark`** | Points / Marks awarded for the question | `1`, `2` |

### D. Viewing & Exporting Student Results
Under **"📊 Candidate Results"** in the Admin Dashboard:
- View all student submissions from all lab computers recorded in the local backend on the host machine.
- Search and filter by candidate name or batch number.
- Click **"🔄 Refresh"** to fetch newly submitted student tests without reloading the page.
- Click **"📥 Export All Results (res.xlsx)"** to download the comprehensive results spreadsheet.
- The results are saved on the admin's local host disk at `client/public/res.xlsx` and `client/public/results.json`.

### E. Alterable Examination Duration (Time Allotted)
Under **"📂 Manage Questions (Excel)"** in the Admin Dashboard:
- Admin can adjust the examination duration (e.g., 15, 30, 45, 60 minutes) directly from the dashboard.
- The altered time is saved to `public/exam_settings.json` on the host machine and immediately applies to all candidates across all computers.

> **Note on Student Privacy**: Students see **only their own scorecard** when they submit their test. They cannot see other candidates' scores or download the class results. Only the admin has access to all results.

---

## 2. Dynamic Instructions & Anti-Cheating Shuffling

1. **Dynamic Instruction Page**:
   - Total Questions, Time Allotted, and Maximum Marks are dynamically loaded from the backend spreadsheet and settings, not hardcoded.
2. **Randomized Question Order per Candidate**:
   - Each student receives examination questions in an independently randomized sequence.
3. **Randomized MCQ & MSQ Option Order**:
   - Choices for Multiple Choice (MCQ) and Multiple Select (MSQ) questions are shuffled uniquely for each student.
   - Fill-in-the-blank (FILL) and Drag & Drop code ordering (DRAG_DROP) options are preserved without altering their structure.

---

## 3. Drag & Drop Code Line Ordering (`DRAG_DROP`)

For code questions, lines are written in the `options` or `answer` column separated by newlines:
- When a candidate enters the exam, the system **automatically shuffles the code lines**.
- The candidate can drag and drop code blocks or click the **▲ Up** and **▼ Down** arrow buttons to arrange them in the proper sequence.
- When submitted, the system checks whether the student's arranged order exactly matches the correct executable order in the `answer` column.
- The scorecard shows a side-by-side comparison of the candidate's arranged code vs. the expected code sequence.

---

## 4. Strict Proctoring & Exam Integrity

1. **Automatic Full Screen Activation & Exit**:
   - The exam automatically locks into **Full Screen** mode when the candidate starts the test.
   - Upon final submission, the portal automatically exits Full Screen mode.
2. **Tab Switch & Window Exit Limit (Max 2 Allowed)**:
   - Exiting full screen, minimizing the window, or switching browser tabs is continuously tracked.
   - **Violation 1**: Prominent warning alert ("Warning 1 of 2: 1 warning remaining").
   - **Violation 2**: Final warning alert ("Warning 2 of 2: FINAL WARNING").
   - **More than 2 Violations (Violation 3)**: The examination is **automatically terminated and submitted** immediately!
3. **Anti-Copy & Anti-Paste Protections**:
   - `copy`, `cut`, and `paste` events are blocked across the entire exam interface.
   - Right-click context menu is strictly disabled.
   - Keyboard shortcuts (`Ctrl+C`, `Ctrl+V`, `Ctrl+X`, `Ctrl+A`, `Ctrl+U`, `Ctrl+P`, `F12`) are blocked.

---

## 5. Project File Directory & Descriptions

```text
c:\cse\
├── README.md                                    # Documentation, Excel question format, and instructions
│
└── client/                                      # Standalone React 18 + Vite Application
    ├── index.html                               # HTML title: "Test portal"
    ├── package.json                             # Dependencies: react, react-dom, xlsx, vite
    ├── vite.config.js                           # Server config & local backend handlers (/api/results, /api/settings, /api/upload-questions)
    │
    ├── public/
    │   ├── questions.xlsx                       # Default Excel questions file
    │   ├── active_exam.xlsx                     # Active exam spreadsheet (when uploaded by admin)
    │   ├── exam_settings.json                   # Configurable exam duration in minutes (alterable by admin)
    │   ├── res.xlsx                             # Consolidated Excel results file (generated on local host machine)
    │   └── results.json                         # Central JSON storage for all student submissions
    │
    └── src/
        ├── main.jsx                             # Application bootstrap with ErrorBoundary
        ├── App.jsx                              # State coordinator (home, instructions, test, result, adminLogin, adminDashboard)
        ├── index.css                            # Styling, dark-themed code blocks, anti-cheating rules
        │
        ├── components/
        │   ├── DragDropCodeCard.jsx             # Interactive code line drag & drop + Up/Down buttons
        │   ├── ErrorBoundary.jsx                # Runtime safety wrapper preventing blank screens
        │   ├── Navbar.jsx                       # Top header with "Test portal" branding and Admin Login button
        │   ├── QuestionCard.jsx                 # Question card router for MCQ, MSQ, FILL, and DRAG_DROP
        │   ├── QuestionPalette.jsx              # Question status grid (visited, answered, current)
        │   ├── SubmitModal.jsx                  # Final submission confirmation dialog
        │   └── Timer.jsx                        # Countdown timer with 5-minute warning & auto-submit
        │
        ├── pages/
        │   ├── AdminLoginPage.jsx               # Admin login screen (admin / welcome)
        │   ├── AdminDashboardPage.jsx           # Admin dashboard: Excel question upload, exam duration settings & results table
        │   ├── HomePage.jsx                     # Candidate login (Student Full Name: Peter / Batch No: 251001)
        │   ├── InstructionsPage.jsx             # Dynamic exam rules & fullscreen trigger
        │   ├── TestPage.jsx                     # Examination interface with proctoring & tab-switch tracker
        │   └── ResultPage.jsx                   # Student-only scorecard (individual score & review, no class export)
        │
        └── services/
            ├── evaluator.js                     # Client evaluation engine for MCQ, MSQ, FILL & DRAG_DROP
            ├── questionLoader.js                # Parses Excel, dynamic settings, & shuffles questions/options per candidate
            ├── storage.js                       # Syncs student results and settings to local backend & browser storage
            └── proctoring.js                    # Fullscreen control and tab-switch detection
```

---

## 6. College Lab & Admin Setup (How to Connect)

### Step 1: Start the Server on the Admin / Host PC
Open PowerShell on the host PC running the test portal:
```powershell
cd c:\cse\client
npm run dev -- --host
```

Vite will display the network address, for example:
- **Local**: `http://localhost:5173`
- **Network**: `http://192.168.1.50:5173` (your host machine's LAN IP)

### Step 2: Student Computers Connect via Lab Network
On each student's lab PC, open any modern browser (Chrome, Edge, Firefox) and navigate to:
```text
http://<host-ip>:5173
```
(e.g., `http://192.168.1.50:5173`)

### Step 3: Exam Process & Local Results Storage
1. Students enter their **Student Full Name** (e.g. Peter) and **Batch No** (e.g. 251001), read instructions, enter fullscreen, and answer questions.
2. When students submit:
   - The student sees **only their own scorecard** (score, marks, pass/fail, and review of their own answers).
   - The student has **no option** to see or download other students' results.
3. Centrally on the **Host/Admin Computer**:
   - The submission is saved directly to `c:\cse\client\public\results.json` and `c:\cse\client\public\res.xlsx`.
   - The admin opens `http://localhost:5173` -> clicks **"🛡️ Admin Login"** (`admin` / `welcome`) -> clicks **"📊 Candidate Results"** to see all students' results in real time or export `res.xlsx`.
   - **No external college server** is involved or needed. Everything resides safely on the local host machine.
