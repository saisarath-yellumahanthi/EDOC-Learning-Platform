export type TutorMode = 'quick' | 'guided';

export interface TutorSubjectOption {
  id: string;
  label: string;
  shortLabel: string;
  syllabusFocus: string;
}

export interface TutorQuickAction {
  id: 'analogy' | 'dry-run' | 'find-bug' | 'practice-question';
  label: string;
  placeholderHint: string;
}

export interface TutorChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mode: TutorMode;
  subjectLabel: string;
  model?: string;
}

export interface CodeToken {
  type: 'plain' | 'keyword' | 'string' | 'comment' | 'number' | 'function';
  text: string;
}

export const TUTOR_SUBJECT_OPTIONS: TutorSubjectOption[] = [
  {
    id: 'python',
    label: 'Python',
    shortLabel: 'Python',
    syllabusFocus:
      'Python 3 fundamentals, data structures (lists, dicts, sets, tuples), OOP, generators, decorators, and idiomatic standard library usage.',
  },
  {
    id: 'c-cpp',
    label: 'C / C++',
    shortLabel: 'C / C++',
    syllabusFocus:
      'C pointers, memory allocation, structs, C++ STL containers (vector, map, queue, stack), references, templates, and overflow-safe arithmetic.',
  },
  {
    id: 'java',
    label: 'Java',
    shortLabel: 'Java',
    syllabusFocus:
      'Java OOP, Collections Framework, generics, interfaces, exception handling, and JVM memory model.',
  },
  {
    id: 'dsa-trees',
    label: 'DSA — Trees & BSTs',
    shortLabel: 'DSA: Trees',
    syllabusFocus:
      'Binary Trees, Binary Search Trees (BST), Inorder/Preorder/Postorder traversals, Level Order BFS vs DFS, Height/Depth, and Balanced vs Skewed trees.',
  },
  {
    id: 'dsa-binary-search',
    label: 'DSA — Binary Search',
    shortLabel: 'DSA: Binary Search',
    syllabusFocus:
      'Standard Binary Search, Lower Bound / Upper Bound, Search in Rotated Sorted Array, Binary Search on Answer Space, loop invariants, and overflow-safe mid calculation.',
  },
  {
    id: 'dsa-general',
    label: 'DSA — Algorithms & Patterns',
    shortLabel: 'DSA: General',
    syllabusFocus:
      'Arrays, Hashing, Two Pointers, Sliding Window, Linked Lists, Stacks/Queues, Heaps, Graphs, Dynamic Programming, and Big-O complexity analysis.',
  },
  {
    id: 'sql',
    label: 'SQL & Relational Databases',
    shortLabel: 'SQL',
    syllabusFocus:
      'SELECT, WHERE, JOINs (INNER, LEFT, RIGHT), GROUP BY, HAVING, subqueries, CTEs, window functions, indexing, and schema normalization.',
  },
  {
    id: 'web-dev',
    label: 'Web Dev (HTML / CSS / JS)',
    shortLabel: 'Web Dev',
    syllabusFocus:
      'Semantic HTML5, CSS Flexbox/Grid, responsive design, modern ES6+ JavaScript, DOM events, async/await, and browser fundamentals.',
  },
];

export const QUICK_ACTION_CHIPS: TutorQuickAction[] = [
  {
    id: 'analogy',
    label: 'Explain with an analogy',
    placeholderHint: 'Use a real-world mental model',
  },
  {
    id: 'dry-run',
    label: 'Dry-run this code',
    placeholderHint: 'Trace variables step-by-step',
  },
  {
    id: 'find-bug',
    label: 'Find the bug in my code',
    placeholderHint: 'Spot edge cases & logic errors',
  },
  {
    id: 'practice-question',
    label: 'Give me a practice question',
    placeholderHint: 'Test understanding with a mini drill',
  },
];

export function getTutorSubjectById(subjectId: string): TutorSubjectOption {
  return (
    TUTOR_SUBJECT_OPTIONS.find((s) => s.id === subjectId) ||
    TUTOR_SUBJECT_OPTIONS[0]
  );
}

export function buildQuickActionPrompt(
  chipId: TutorQuickAction['id'],
  subjectLabel: string,
  currentInput: string
): string {
  const trimmed = currentInput.trim();

  switch (chipId) {
    case 'analogy':
      return trimmed
        ? `Explain this ${subjectLabel} concept using a clear real-world analogy:\n\n${trimmed}`
        : `Explain a key concept in ${subjectLabel} using a memorable real-world analogy and a short code example.`;
    case 'dry-run':
      return trimmed
        ? `Please dry-run this ${subjectLabel} code step-by-step with a trace table of variables:\n\n${trimmed}`
        : `Dry-run this ${subjectLabel} code step-by-step (show variable states on each iteration):\n\`\`\`\n// Paste your code here\n\`\`\``;
    case 'find-bug':
      return trimmed
        ? `Find the bug or edge-case failure in my ${subjectLabel} code and explain how to fix it:\n\n${trimmed}`
        : `Find the bug in my ${subjectLabel} code and explain why it fails:\n\`\`\`\n// Paste your buggy code here\n\`\`\``;
    case 'practice-question':
      return trimmed
        ? `Give me a focused ${subjectLabel} practice question based on: ${trimmed}`
        : `Give me an interview-style practice question on ${subjectLabel} with sample input/output (don't reveal the full solution until I try!).`;
  }
}

export function buildTutorSystemInstruction(
  mode: TutorMode,
  subjectId: string
): string {
  const subject = getTutorSubjectById(subjectId);

  const baseContext = [
    `You are the EDOC AI Computer Science Tutor.`,
    `Active Syllabus Context: ${subject.label} (${subject.syllabusFocus})`,
    `Keep your explanations strictly aligned with this syllabus context unless the student explicitly asks to connect another topic.`,
    `Format all responses cleanly in Markdown using concise paragraphs, bullet points, bold key terms, and fenced code blocks with language tags (e.g., \`\`\`python, \`\`\`cpp, \`\`\`sql, \`\`\`javascript) whenever showing code.`,
    `Always highlight time/space complexity and edge cases (such as null checks, integer overflow, or off-by-one bounds) when relevant.`,
  ];

  if (mode === 'quick') {
    return [
      ...baseContext,
      `MODE: Quick Doubt Solver.`,
      `- Give a clear, direct, structured answer right away.`,
      `- Include a concrete worked example or clean, commented code snippet.`,
      `- Keep explanations crisp, accurate, and easy to scan so the student resolves their doubt quickly.`,
    ].join('\n');
  }

  return [
    ...baseContext,
    `MODE: Guided AI Tutor (Socratic Mentor).`,
    `- Do NOT immediately dump the entire finished solution on the first turn if the student is solving a problem or debugging.`,
    `- Explain the underlying intuition step-by-step, give 1–2 focused hints or a small guiding example first, and guide the student to reason through the logic.`,
    `- Always end your message with a short, concrete **Check-In Question** (1–2 sentences) to verify the student understood before advancing to the next step.`,
    `- If the student answers your check-in question, give encouraging, specific feedback on their reasoning and move to the next step.`,
  ].join('\n');
}

export function getTutorStorageKey(userEmail: string): string {
  const safeEmail = (userEmail || 'guest').trim().toLowerCase();
  return `edoc_ai_tutor_history_v1_${safeEmail}`;
}

export function parseStoredTutorMessages(raw: string | null): TutorChatMessage[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (m): m is TutorChatMessage =>
          m &&
          typeof m.id === 'string' &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string'
      )
      .slice(-60);
  } catch {
    return [];
  }
}

// ============================================================================
// LIGHTWEIGHT SYNTAX TOKENIZER FOR MARKDOWN CODE BLOCKS
// ============================================================================
const KEYWORDS_BY_LANG: Record<string, Set<string>> = {
  python: new Set([
    'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'in',
    'not', 'and', 'or', 'True', 'False', 'None', 'import', 'from', 'as',
    'try', 'except', 'finally', 'with', 'yield', 'lambda', 'pass', 'break',
    'continue', 'is', 'async', 'await',
  ]),
  cpp: new Set([
    'int', 'long', 'double', 'float', 'bool', 'char', 'void', 'const', 'auto',
    'struct', 'class', 'public', 'private', 'return', 'if', 'else', 'for',
    'while', 'break', 'continue', 'nullptr', 'true', 'false', 'using',
    'namespace', 'include', 'vector', 'queue', 'stack', 'string', 'static',
  ]),
  c: new Set([
    'int', 'long', 'double', 'float', 'bool', 'char', 'void', 'const',
    'struct', 'typedef', 'return', 'if', 'else', 'for', 'while', 'break',
    'continue', 'NULL', 'true', 'false', 'sizeof', 'static', 'include',
  ]),
  java: new Set([
    'public', 'private', 'protected', 'class', 'interface', 'static', 'final',
    'void', 'int', 'long', 'boolean', 'double', 'String', 'return', 'if',
    'else', 'for', 'while', 'new', 'null', 'true', 'false', 'try', 'catch',
    'import', 'extends', 'implements',
  ]),
  javascript: new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'class', 'new', 'null', 'undefined', 'true', 'false', 'async', 'await',
    'try', 'catch', 'import', 'export', 'from', 'typeof', 'of', 'in',
  ]),
  sql: new Set([
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'ON',
    'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'INSERT',
    'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'AS',
    'AND', 'OR', 'NOT', 'NULL', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT',
  ]),
};

function resolveLangKey(rawLang: string): string {
  const norm = (rawLang || '').toLowerCase().trim();
  if (norm === 'py' || norm === 'python3' || norm === 'python') return 'python';
  if (norm === 'c++' || norm === 'cpp' || norm === 'cc') return 'cpp';
  if (norm === 'c') return 'c';
  if (norm === 'java') return 'java';
  if (norm === 'js' || norm === 'ts' || norm === 'jsx' || norm === 'tsx' || norm === 'javascript' || norm === 'typescript') {
    return 'javascript';
  }
  if (norm === 'sql' || norm === 'sqlite' || norm === 'postgres') return 'sql';
  return 'python';
}

export function tokenizeCodeLine(line: string, rawLang: string): CodeToken[] {
  const langKey = resolveLangKey(rawLang);
  const keywords = KEYWORDS_BY_LANG[langKey] || KEYWORDS_BY_LANG.python;
  const tokens: CodeToken[] = [];

  let i = 0;
  const n = line.length;

  const pushToken = (type: CodeToken['type'], text: string) => {
    if (!text) return;
    if (tokens.length > 0 && tokens[tokens.length - 1].type === type) {
      tokens[tokens.length - 1].text += text;
    } else {
      tokens.push({ type, text });
    }
  };

  while (i < n) {
    // Line comments
    if (
      (langKey === 'python' && line[i] === '#') ||
      ((langKey === 'cpp' || langKey === 'c' || langKey === 'java' || langKey === 'javascript') &&
        line[i] === '/' &&
        line[i + 1] === '/') ||
      (langKey === 'sql' && line[i] === '-' && line[i + 1] === '-')
    ) {
      pushToken('comment', line.slice(i));
      break;
    }

    // String literals
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const quote = line[i];
      let j = i + 1;
      while (j < n && line[j] !== quote) {
        if (line[j] === '\\' && j + 1 < n) j += 2;
        else j++;
      }
      if (j < n) j++;
      pushToken('string', line.slice(i, j));
      i = j;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(line[i]) && (i === 0 || !/[A-Za-z_]/.test(line[i - 1]))) {
      let j = i;
      while (j < n && /[0-9.]/.test(line[j])) j++;
      pushToken('number', line.slice(i, j));
      i = j;
      continue;
    }

    // Identifiers / Keywords / Function calls
    if (/[A-Za-z_]/.test(line[i])) {
      let j = i;
      while (j < n && /[A-Za-z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);
      const isSqlKeyword = langKey === 'sql' && keywords.has(word.toUpperCase());
      if (keywords.has(word) || isSqlKeyword) {
        pushToken('keyword', word);
      } else if (line[j] === '(') {
        pushToken('function', word);
      } else {
        pushToken('plain', word);
      }
      i = j;
      continue;
    }

    pushToken('plain', line[i]);
    i++;
  }

  return tokens;
}
