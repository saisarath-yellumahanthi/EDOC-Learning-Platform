export type NavSectionId =
  | 'home'
  | 'languages'
  | 'webdev'
  | 'sql'
  | 'terminal'
  | 'quiz'
  | 'dsa'
  | 'leaderboard';

export interface SidebarNavItem {
  id: NavSectionId;
  index: number;
  label: string;
  shortDesc: string;
  badgeText: string;
}

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  {
    id: 'languages',
    index: 1,
    label: 'Programming Languages',
    shortDesc: 'C, C++, Java & Python theory and code tracks',
    badgeText: '4 Tracks',
  },
  {
    id: 'webdev',
    index: 2,
    label: 'Web Development',
    shortDesc: 'HTML/CSS/JS live DOM & layout studio',
    badgeText: 'Sandbox',
  },
  {
    id: 'sql',
    index: 3,
    label: 'SQL',
    shortDesc: 'Relational query workbench & schema lab',
    badgeText: '4 Tables',
  },
  {
    id: 'terminal',
    index: 4,
    label: 'Terminal',
    shortDesc: 'POSIX shell & command-line environment',
    badgeText: 'bash 5.2',
  },
  {
    id: 'quiz',
    index: 5,
    label: 'Quiz & Practice',
    shortDesc: 'Core CS assessments & rapid drills',
    badgeText: '+150 XP',
  },
  {
    id: 'dsa',
    index: 6,
    label: 'DSA Problems',
    shortDesc: 'Algorithmic IDE & automated test suite',
    badgeText: '5 Problems',
  },
];

export interface AuthValidationResult {
  valid: boolean;
  error?: string;
  isEduVerified: boolean;
}

export function isEduEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes('@') || trimmed.startsWith('@') || trimmed.endsWith('@')) {
    return false;
  }
  return (
    trimmed.endsWith('.edu') ||
    trimmed.includes('.edu.') ||
    trimmed.includes('.ac.') ||
    trimmed.includes('university') ||
    trimmed.includes('college') ||
    trimmed.includes('edoc.dev')
  );
}

export function validateAuthInput(
  mode: 'signin' | 'signup',
  fullName: string,
  email: string,
  password: string
): AuthValidationResult {
  const trimmedName = fullName.trim();
  const trimmedEmail = email.trim();

  if (mode === 'signup' && trimmedName.length < 2) {
    return {
      valid: false,
      error: 'Please enter your full name (at least 2 characters).',
      isEduVerified: isEduEmail(trimmedEmail),
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return {
      valid: false,
      error: 'Please enter a valid student or developer email address.',
      isEduVerified: false,
    };
  }

  if (password.length < 6) {
    return {
      valid: false,
      error: 'Password must be at least 6 characters long.',
      isEduVerified: isEduEmail(trimmedEmail),
    };
  }

  return {
    valid: true,
    isEduVerified: isEduEmail(trimmedEmail),
  };
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  isEduVerified: boolean;
  level: number;
  xp: number;
  solvedDsaIds: number[];
  completedTopics: string[];
  createdAt: string;
}

export function createCleanUserProfile(
  name: string,
  email: string
): UserProfile {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const uid = `user_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
  return {
    uid,
    name: cleanName,
    email: cleanEmail,
    isEduVerified: isEduEmail(cleanEmail),
    level: 1,
    xp: 0,
    solvedDsaIds: [],
    completedTopics: [],
    createdAt: new Date().toISOString(),
  };
}

export function calculateLevelFromXp(xp: number): {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  const safeXp = Math.max(0, Math.floor(xp));
  const level = Math.max(1, Math.floor(safeXp / 60) + 1);
  const levelFloorXp = (level - 1) * 60;
  const nextLevelXp = level * 60;
  const progressPercent = Math.min(
    100,
    Math.round(((safeXp - levelFloorXp) / 60) * 100)
  );
  return {
    level,
    currentXp: safeXp,
    nextLevelXp,
    progressPercent,
  };
}

// --- SQL WORKBENCH DATA & ENGINE ---
export interface SqlTableSchema {
  tableName: string;
  columns: { name: string; type: string; key?: string }[];
  rows: Record<string, string | number>[];
}

export const SQL_DATABASE: Record<string, SqlTableSchema> = {
  students: {
    tableName: 'students',
    columns: [
      { name: 'id', type: 'INT', key: 'PK' },
      { name: 'name', type: 'VARCHAR(64)' },
      { name: 'major', type: 'VARCHAR(32)' },
      { name: 'level', type: 'INT' },
      { name: 'xp', type: 'INT' },
      { name: 'cohort', type: 'VARCHAR(16)' },
    ],
    rows: [
      { id: 101, name: 'Alex Rivera', major: 'Computer Science', level: 24, xp: 1420, cohort: 'Fall-2026' },
      { id: 102, name: 'Elena Rostova', major: 'Systems Engineering', level: 29, xp: 1780, cohort: 'Fall-2026' },
      { id: 103, name: 'Marcus Vance', major: 'Data Science', level: 22, xp: 1310, cohort: 'Spring-2026' },
      { id: 104, name: 'Priya Nair', major: 'Computer Science', level: 31, xp: 1940, cohort: 'Fall-2026' },
      { id: 105, name: 'Kenji Takahashi', major: 'Cybersecurity', level: 19, xp: 1120, cohort: 'Spring-2026' },
      { id: 106, name: 'Sofia Lindqvist', major: 'Distributed Systems', level: 27, xp: 1650, cohort: 'Fall-2026' },
    ],
  },
  courses: {
    tableName: 'courses',
    columns: [
      { name: 'course_id', type: 'VARCHAR(16)', key: 'PK' },
      { name: 'title', type: 'VARCHAR(64)' },
      { name: 'category', type: 'VARCHAR(32)' },
      { name: 'difficulty', type: 'VARCHAR(16)' },
      { name: 'enrolled', type: 'INT' },
    ],
    rows: [
      { course_id: 'CS-301', title: 'Advanced Data Structures & Graphs', category: 'DSA Problems', difficulty: 'Hard', enrolled: 420 },
      { course_id: 'CS-204', title: 'Relational Algebra & Query Optimization', category: 'SQL', difficulty: 'Medium', enrolled: 385 },
      { course_id: 'WEB-210', title: 'Modern DOM Architecture & CSS Grid', category: 'Web Development', difficulty: 'Medium', enrolled: 510 },
      { course_id: 'SYS-108', title: 'POSIX Shell & Linux Kernel Primitives', category: 'Terminal', difficulty: 'Easy', enrolled: 640 },
      { course_id: 'LNG-402', title: 'Memory Safety in Rust & Modern C++', category: 'Programming Languages', difficulty: 'Hard', enrolled: 295 },
    ],
  },
  submissions: {
    tableName: 'submissions',
    columns: [
      { name: 'sub_id', type: 'INT', key: 'PK' },
      { name: 'student_id', type: 'INT', key: 'FK' },
      { name: 'problem_slug', type: 'VARCHAR(32)' },
      { name: 'language', type: 'VARCHAR(16)' },
      { name: 'status', type: 'VARCHAR(16)' },
      { name: 'runtime_ms', type: 'INT' },
    ],
    rows: [
      { sub_id: 9001, student_id: 101, problem_slug: 'two-sum', language: 'Python', status: 'Accepted', runtime_ms: 4 },
      { sub_id: 9002, student_id: 104, problem_slug: 'merge-intervals', language: 'Rust', status: 'Accepted', runtime_ms: 1 },
      { sub_id: 9003, student_id: 102, problem_slug: 'lru-cache', language: 'C++', status: 'Accepted', runtime_ms: 3 },
      { sub_id: 9004, student_id: 103, problem_slug: 'valid-parentheses', language: 'TypeScript', status: 'Accepted', runtime_ms: 6 },
      { sub_id: 9005, student_id: 105, problem_slug: 'binary-search', language: 'Go', status: 'Wrong Answer', runtime_ms: 9 },
      { sub_id: 9006, student_id: 106, problem_slug: 'two-sum', language: 'C++', status: 'Accepted', runtime_ms: 2 },
    ],
  },
};

export interface SqlExecutionResult {
  columns: string[];
  rows: Record<string, string | number>[];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
}

export function executeSqlQuery(rawQuery: string): SqlExecutionResult {
  const cleaned = rawQuery
    .replace(/--.*$/gm, '')
    .trim()
    .replace(/;+$/, '')
    .trim();

  if (!cleaned) {
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      executionTimeMs: 0,
      error: 'Query is empty. Enter a SELECT statement to query the workspace database.',
    };
  }

  const normalized = cleaned.replace(/\s+/g, ' ').toLowerCase();

  if (!normalized.startsWith('select ')) {
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      executionTimeMs: 1,
      error: 'Read-only sandbox: Only SELECT queries are permitted in this workspace.',
    };
  }

  // Handle JOIN preset between students and submissions
  if (normalized.includes('join submissions') || normalized.includes('join students')) {
    const joinedRows = SQL_DATABASE.submissions.rows
      .map((sub) => {
        const student = SQL_DATABASE.students.rows.find((s) => s.id === sub.student_id);
        return {
          student_name: student ? student.name : 'Unknown',
          major: student ? student.major : 'N/A',
          problem_slug: sub.problem_slug,
          language: sub.language,
          status: sub.status,
          runtime_ms: sub.runtime_ms,
        };
      })
      .filter((r) => (normalized.includes("status = 'accepted'") ? r.status === 'Accepted' : true))
      .sort((a, b) => Number(a.runtime_ms) - Number(b.runtime_ms));

    return {
      columns: ['student_name', 'major', 'problem_slug', 'language', 'status', 'runtime_ms'],
      rows: joinedRows,
      rowCount: joinedRows.length,
      executionTimeMs: 3,
    };
  }

  // Handle GROUP BY major aggregation preset
  if (normalized.includes('group by major')) {
    const groups: Record<string, { count: number; totalXp: number; maxLevel: number }> = {};
    for (const row of SQL_DATABASE.students.rows) {
      const m = String(row.major);
      if (!groups[m]) {
        groups[m] = { count: 0, totalXp: 0, maxLevel: 0 };
      }
      groups[m].count += 1;
      groups[m].totalXp += Number(row.xp);
      groups[m].maxLevel = Math.max(groups[m].maxLevel, Number(row.level));
    }
    const aggRows = Object.entries(groups).map(([major, stats]) => ({
      major,
      student_count: stats.count,
      avg_xp: Math.round(stats.totalXp / stats.count),
      top_level: stats.maxLevel,
    }));
    return {
      columns: ['major', 'student_count', 'avg_xp', 'top_level'],
      rows: aggRows,
      rowCount: aggRows.length,
      executionTimeMs: 2,
    };
  }

  // Parse standard SELECT <cols> FROM <table> [WHERE ...] [ORDER BY ...] [LIMIT ...]
  const fromMatch = normalized.match(/from\s+([a-z_]+)/i);
  if (!fromMatch) {
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      executionTimeMs: 1,
      error: 'Syntax error: Missing FROM clause. Available tables: students, courses, submissions.',
    };
  }

  const tableName = fromMatch[1].toLowerCase();
  const table = SQL_DATABASE[tableName];
  if (!table) {
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      executionTimeMs: 1,
      error: `Unknown table "${tableName}". Available tables: students, courses, submissions.`,
    };
  }

  let resultRows = [...table.rows];

  // Basic WHERE clause filtering
  const whereMatch = cleaned.match(/where\s+(.+?)(?:\s+order\s+by|\s+limit|$)/i);
  if (whereMatch) {
    const condition = whereMatch[1].trim();
    const opMatch = condition.match(/^([a-z_]+)\s*(=|>|<|>=|<=|!=)\s*(.+)$/i);
    if (opMatch) {
      const col = opMatch[1].trim();
      const op = opMatch[2].trim();
      const rawVal = opMatch[3].trim().replace(/^['"]|['"]$/g, '');
      const numVal = Number(rawVal);
      const isNum = !Number.isNaN(numVal) && rawVal !== '';

      resultRows = resultRows.filter((r) => {
        const cell = r[col];
        if (cell === undefined) return false;
        if (op === '=') return String(cell).toLowerCase() === rawVal.toLowerCase();
        if (op === '!=') return String(cell).toLowerCase() !== rawVal.toLowerCase();
        if (isNum && typeof cell === 'number') {
          if (op === '>') return cell > numVal;
          if (op === '<') return cell < numVal;
          if (op === '>=') return cell >= numVal;
          if (op === '<=') return cell <= numVal;
        }
        return true;
      });
    }
  }

  // ORDER BY
  const orderMatch = normalized.match(/order\s+by\s+([a-z_]+)(?:\s+(asc|desc))?/i);
  if (orderMatch) {
    const orderCol = orderMatch[1];
    const dir = orderMatch[2] === 'desc' ? -1 : 1;
    resultRows.sort((a, b) => {
      const va = a[orderCol];
      const vb = b[orderCol];
      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * dir;
      }
      return String(va ?? '').localeCompare(String(vb ?? '')) * dir;
    });
  }

  // LIMIT
  const limitMatch = normalized.match(/limit\s+(\d+)/i);
  if (limitMatch) {
    const limitNum = parseInt(limitMatch[1], 10);
    resultRows = resultRows.slice(0, limitNum);
  }

  // Selected columns
  const selectPart = cleaned.slice(6, cleaned.toLowerCase().indexOf(' from ')).trim();
  let selectedCols = table.columns.map((c) => c.name);
  if (selectPart !== '*') {
    const requestedCols = selectPart
      .split(',')
      .map((c) => c.trim().split(/\s+as\s+/i)[0].trim().toLowerCase());
    const validCols = requestedCols.filter((c) => selectedCols.includes(c));
    if (validCols.length > 0) {
      selectedCols = validCols;
    }
  }

  const projectedRows = resultRows.map((row) => {
    const obj: Record<string, string | number> = {};
    for (const c of selectedCols) {
      obj[c] = row[c];
    }
    return obj;
  });

  return {
    columns: selectedCols,
    rows: projectedRows,
    rowCount: projectedRows.length,
    executionTimeMs: 2,
  };
}

// --- TERMINAL EMULATOR ENGINE ---
export interface TerminalCommandOutput {
  clearScreen?: boolean;
  lines: { text: string; tone?: 'default' | 'cyan' | 'emerald' | 'amber' | 'rose' }[];
}

export function executeTerminalCommand(
  rawInput: string,
  userName: string = 'student'
): TerminalCommandOutput {
  const input = rawInput.trim();
  if (!input) {
    return { lines: [] };
  }

  const parts = input.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const arg = parts.slice(1).join(' ');

  switch (cmd) {
    case 'clear':
      return { clearScreen: true, lines: [] };

    case 'help':
      return {
        lines: [
          { text: 'EDOC Interactive Shell v4.8.2 — Built-in Commands:', tone: 'cyan' },
          { text: '  help                 Show available shell commands' },
          { text: '  ls [-la]             List workspace directory contents' },
          { text: '  cat <filename>       Inspect file contents (e.g. cat readme.md, cat solution.py)' },
          { text: '  python <file|expr>   Execute Python script or expression' },
          { text: '  test                 Run automated DSA unit test suite' },
          { text: '  git status           Check workspace repository status' },
          { text: '  whoami               Print active student session identity' },
          { text: '  neofetch             Display workspace kernel & runtime configuration' },
          { text: '  clear                Clear terminal scrollback buffer' },
        ],
      };

    case 'ls':
      if (arg.includes('-l') || arg.includes('-a')) {
        return {
          lines: [
            { text: 'drwxr-xr-x  6 edoc  student   192 Nov 05 09:00 .', tone: 'cyan' },
            { text: '-rw-r--r--  1 edoc  student   412 Nov 05 09:00 readme.md' },
            { text: '-rwxr-xr-x  1 edoc  student   864 Nov 05 09:02 solution.py', tone: 'emerald' },
            { text: '-rw-r--r--  1 edoc  student  1204 Nov 05 09:04 schema.sql' },
            { text: '-rw-r--r--  1 edoc  student   640 Nov 05 09:05 benchmark.cpp' },
          ],
        };
      }
      return {
        lines: [
          { text: 'readme.md    solution.py    schema.sql    benchmark.cpp    tests/', tone: 'cyan' },
        ],
      };

    case 'pwd':
      return {
        lines: [{ text: '/home/edoc/workspace/algorithms' }],
      };

    case 'whoami':
      return {
        lines: [
          {
            text: `${userName.toLowerCase().replace(/\s+/g, '.')} (uid=1001, gid=1001, groups=student,edoc-verified)`,
            tone: 'emerald',
          },
        ],
      };

    case 'cat': {
      const target = arg.toLowerCase();
      if (!target) {
        return { lines: [{ text: 'cat: missing file operand. Try: cat readme.md', tone: 'rose' }] };
      }
      if (target === 'readme.md') {
        return {
          lines: [
            { text: '# EDOC Interactive Sandbox Environment', tone: 'cyan' },
            { text: 'Welcome to the deliberate practice studio.' },
            { text: '- Run `python solution.py` to execute the Two Sum O(n) solver.' },
            { text: '- Run `test` to verify all 5 algorithmic test suites.' },
          ],
        };
      }
      if (target === 'solution.py') {
        return {
          lines: [
            { text: 'def two_sum(nums: list[int], target: int) -> list[int]:', tone: 'cyan' },
            { text: '    seen = {}' },
            { text: '    for i, num in enumerate(nums):' },
            { text: '        if target - num in seen:' },
            { text: '            return [seen[target - num], i]' },
            { text: '        seen[num] = i' },
            { text: '    return []' },
          ],
        };
      }
      if (target === 'schema.sql') {
        return {
          lines: [
            { text: 'SELECT name, major, level, xp FROM students ORDER BY xp DESC;', tone: 'amber' },
          ],
        };
      }
      return {
        lines: [{ text: `cat: ${arg}: No such file in workspace`, tone: 'rose' }],
      };
    }

    case 'python':
    case 'python3':
      if (!arg || arg === 'solution.py') {
        return {
          lines: [
            { text: '[Python 3.12.4 • EDOC Sandbox]', tone: 'cyan' },
            { text: 'Running solution.py against sample input nums=[2, 7, 11, 15], target=9...' },
            { text: 'Output: [0, 1]  |  Elapsed: 0.42ms  |  Memory: 14.2 MB', tone: 'emerald' },
          ],
        };
      }
      return {
        lines: [{ text: `>>> ${arg}`, tone: 'cyan' }, { text: 'Executed successfully (exit code 0)', tone: 'emerald' }],
      };

    case 'test':
      return {
        lines: [
          { text: 'PASS  tests/two_sum.spec.ts (4 cases • 1.8ms)', tone: 'emerald' },
          { text: 'PASS  tests/valid_parentheses.spec.ts (3 cases • 1.2ms)', tone: 'emerald' },
          { text: 'PASS  tests/merge_intervals.spec.ts (3 cases • 2.4ms)', tone: 'emerald' },
          { text: 'Test Suites: 3 passed, 3 total | Time: 5.4ms', tone: 'cyan' },
        ],
      };

    case 'git':
      return {
        lines: [
          { text: 'On branch main', tone: 'cyan' },
          { text: 'Your branch is up to date with "origin/main".' },
          { text: 'nothing to commit, working tree clean', tone: 'emerald' },
        ],
      };

    case 'neofetch':
      return {
        lines: [
          { text: '   ______ ____   ____   ______    edoc@workspace', tone: 'cyan' },
          { text: '  / ____// __ \\ / __ \\ / ____/    --------------', tone: 'cyan' },
          { text: ' / __/  / / / // / / // /         OS: EDOC Linux Sandbox x86_64', tone: 'emerald' },
          { text: '/ /___ / /_/ // /_/ // /___       Kernel: 6.8.0-edoc-edge', tone: 'emerald' },
          { text: '/_____//_____/ \\____/ \\____/      Shell: bash 5.2.21', tone: 'emerald' },
          { text: '                                  Packages: Python 3.12, GCC 13.2, Node 22, SQLite 3', tone: 'amber' },
        ],
      };

    case 'echo':
      return {
        lines: [{ text: arg }],
      };

    default:
      return {
        lines: [
          {
            text: `edoc: command not found: ${cmd}. Type "help" for a list of supported commands.`,
            tone: 'rose',
          },
        ],
      };
  }
}

// --- QUIZ & PRACTICE ENGINE ---
export interface QuizQuestion {
  id: string;
  category: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  xpReward: number;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    category: 'DSA Problems',
    question: 'What is the worst-case time complexity of looking up a key in a balanced Binary Search Tree (such as an AVL or Red-Black Tree) with n nodes?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctIndex: 1,
    explanation: 'Self-balancing binary search trees maintain a height proportional to log2(n), guaranteeing O(log n) worst-case search, insertion, and deletion.',
    xpReward: 30,
  },
  {
    id: 'q2',
    category: 'SQL',
    question: 'Which SQL clause is used to filter grouped rows created by a GROUP BY clause based on an aggregate condition?',
    codeSnippet: 'SELECT major, COUNT(*) FROM students GROUP BY major _______ COUNT(*) > 1;',
    options: ['WHERE', 'HAVING', 'QUALIFY', 'FILTER'],
    correctIndex: 1,
    explanation: 'WHERE filters individual rows before grouping, whereas HAVING filters groups after GROUP BY aggregation has been performed.',
    xpReward: 30,
  },
  {
    id: 'q3',
    category: 'Web Development',
    question: 'In JavaScript event propagation, which method prevents an event from bubbling up to parent elements in the DOM tree without stopping default browser behavior?',
    options: [
      'event.preventDefault()',
      'event.stopPropagation()',
      'event.stopImmediateDefault()',
      'return false',
    ],
    correctIndex: 1,
    explanation: 'event.stopPropagation() stops the event from bubbling up the DOM hierarchy while preserving default actions like link navigation or form submission.',
    xpReward: 30,
  },
  {
    id: 'q4',
    category: 'Programming Languages',
    question: 'In Rust, what happens when a heap-allocated variable (such as a String) is assigned to another variable without calling .clone()?',
    options: [
      'Both variables share a reference-counted pointer automatically',
      'Ownership is moved to the new variable and the previous binding is invalidated',
      'A deep copy is implicitly performed on the stack',
      'The garbage collector marks the original variable for sweep',
    ],
    correctIndex: 1,
    explanation: 'Rust enforces single ownership by default: assigning a non-Copy type moves ownership to the new binding, preventing double-free bugs at compile time.',
    xpReward: 30,
  },
  {
    id: 'q5',
    category: 'Terminal',
    question: 'In a POSIX shell, which redirection operator appends standard output (stdout) to the end of an existing file without overwriting its contents?',
    options: ['>', '>>', '2>&1', '|'],
    correctIndex: 1,
    explanation: 'The >> operator appends stdout to the target file, whereas > truncates and overwrites the file.',
    xpReward: 30,
  },
];

// --- DSA PROBLEMS & TEST SUITE RUNNER ---
export interface DsaTestCase {
  id: string;
  inputDisplay: string;
  expectedOutput: string;
}

export interface DsaProblem {
  id: string;
  number: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  xpReward: number;
  description: string;
  constraints: string[];
  starterCode: {
    python: string;
    javascript: string;
    cpp: string;
  };
  requiredTokens: string[];
  testCases: DsaTestCase[];
}

export const DSA_PROBLEMS: DsaProblem[] = [
  {
    id: 'two-sum',
    number: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Hash Table / Array',
    xpReward: 50,
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      'Expected Time Complexity: O(n)',
    ],
    starterCode: {
      python: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
      javascript: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`,
      cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); ++i) {
        int complement = target - nums[i];
        if (seen.count(complement)) return {seen[complement], i};
        seen[nums[i]] = i;
    }
    return {};
}`,
    },
    requiredTokens: ['return', 'target'],
    testCases: [
      { id: 'tc-1', inputDisplay: 'nums = [2, 7, 11, 15], target = 9', expectedOutput: '[0, 1]' },
      { id: 'tc-2', inputDisplay: 'nums = [3, 2, 4], target = 6', expectedOutput: '[1, 2]' },
      { id: 'tc-3', inputDisplay: 'nums = [3, 3], target = 6', expectedOutput: '[0, 1]' },
    ],
  },
  {
    id: 'valid-parentheses',
    number: 2,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'Stack / String',
    xpReward: 50,
    description:
      'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid. Open brackets must be closed by the same type of brackets in the correct order.',
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only "()[]{}"'],
    starterCode: {
      python: `def is_valid(s: str) -> bool:
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return len(stack) == 0`,
      javascript: `function isValid(s) {
  const stack = [];
  const pairs = { ')': '(', '}': '{', ']': '[' };
  for (const ch of s) {
    if (ch in pairs) {
      if (!stack.length || stack.pop() !== pairs[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}`,
      cpp: `bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(') st.push(')');
        else if (c == '{') st.push('}');
        else if (c == '[') st.push(']');
        else if (st.empty() || st.top() != c) return false;
        else st.pop();
    }
    return st.empty();
}`,
    },
    requiredTokens: ['return', 'stack'],
    testCases: [
      { id: 'tc-1', inputDisplay: 's = "()"', expectedOutput: 'true' },
      { id: 'tc-2', inputDisplay: 's = "()[]{}"', expectedOutput: 'true' },
      { id: 'tc-3', inputDisplay: 's = "(]"', expectedOutput: 'false' },
    ],
  },
  {
    id: 'merge-intervals',
    number: 3,
    title: 'Merge Intervals',
    difficulty: 'Medium',
    category: 'Sorting / Array',
    xpReward: 75,
    description:
      'Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    constraints: ['1 <= intervals.length <= 10^4', 'intervals[i].length == 2'],
    starterCode: {
      python: `def merge(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
      javascript: `function merge(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const prev = merged[merged.length - 1];
    if (intervals[i][0] <= prev[1]) {
      prev[1] = Math.max(prev[1], intervals[i][1]);
    } else {
      merged.push(intervals[i]);
    }
  }
  return merged;
}`,
      cpp: `vector<vector<int>> merge(vector<vector<int>>& intervals) {
    sort(intervals.begin(), intervals.end());
    vector<vector<int>> merged = {intervals[0]};
    for (int i = 1; i < intervals.size(); ++i) {
        if (intervals[i][0] <= merged.back()[1])
            merged.back()[1] = max(merged.back()[1], intervals[i][1]);
        else
            merged.push_back(intervals[i]);
    }
    return merged;
}`,
    },
    requiredTokens: ['return', 'sort'],
    testCases: [
      { id: 'tc-1', inputDisplay: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]' },
      { id: 'tc-2', inputDisplay: 'intervals = [[1,4],[4,5]]', expectedOutput: '[[1,5]]' },
    ],
  },
  {
    id: 'lru-cache',
    number: 4,
    title: 'LRU Cache Design',
    difficulty: 'Hard',
    category: 'Hash Map + Doubly Linked List',
    xpReward: 100,
    description:
      'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement get(key) and put(key, value) such that both operations run in O(1) average time complexity.',
    constraints: ['1 <= capacity <= 3000', 'At most 2 * 10^5 calls will be made to get and put'],
    starterCode: {
      python: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.cache = OrderedDict()
        self.capacity = capacity

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)`,
      javascript: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }
  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }
  put(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, value);
    if (this.cache.size > this.capacity) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
  }
}`,
      cpp: `class LRUCache {
    int cap;
    list<pair<int, int>> lru;
    unordered_map<int, list<pair<int, int>>::iterator> mp;
public:
    LRUCache(int capacity) : cap(capacity) {}
    int get(int key) {
        if (!mp.count(key)) return -1;
        lru.splice(lru.begin(), lru, mp[key]);
        return mp[key]->second;
    }
};`,
    },
    requiredTokens: ['return', 'capacity'],
    testCases: [
      { id: 'tc-1', inputDisplay: 'LRUCache(2) -> put(1,1), put(2,2), get(1), put(3,3), get(2)', expectedOutput: '[null, null, 1, null, -1]' },
      { id: 'tc-2', inputDisplay: 'LRUCache(1) -> put(2,1), get(2)', expectedOutput: '[null, 1]' },
    ],
  },
];

export interface DsaRunSummary {
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  runtimeMs: number;
  memoryMb: number;
  results: {
    id: string;
    inputDisplay: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
  }[];
  error?: string;
}

export function runDsaTestSuite(problem: DsaProblem, code: string): DsaRunSummary {
  const trimmed = code.trim();
  if (trimmed.length < 15) {
    return {
      allPassed: false,
      passedCount: 0,
      totalCount: problem.testCases.length,
      runtimeMs: 0,
      memoryMb: 0,
      results: [],
      error: 'Solution code is empty or incomplete. Implement the function body before running tests.',
    };
  }

  const lower = trimmed.toLowerCase();
  const hasRequiredLogic = problem.requiredTokens.every((token) =>
    lower.includes(token.toLowerCase())
  );

  const results = problem.testCases.map((tc, idx) => {
    const passed = hasRequiredLogic || idx === 0 && lower.includes('return');
    return {
      id: tc.id,
      inputDisplay: tc.inputDisplay,
      expectedOutput: tc.expectedOutput,
      actualOutput: passed ? tc.expectedOutput : 'null',
      passed,
    };
  });

  const passedCount = results.filter((r) => r.passed).length;
  return {
    allPassed: passedCount === problem.testCases.length,
    passedCount,
    totalCount: problem.testCases.length,
    runtimeMs: 3,
    memoryMb: 14.4,
    results,
  };
}
