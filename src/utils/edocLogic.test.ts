import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SIDEBAR_NAV_ITEMS,
  isEduEmail,
  validateAuthInput,
  createCleanUserProfile,
  calculateLevelFromXp,
  executeSqlQuery,
  executeTerminalCommand,
  DSA_PROBLEMS,
  runDsaTestSuite,
} from './edocLogic';

test('SIDEBAR_NAV_ITEMS defines exact 6 navigation items requested', () => {
  assert.equal(SIDEBAR_NAV_ITEMS.length, 6);
  const labels = SIDEBAR_NAV_ITEMS.map((item) => item.label);
  assert.deepEqual(labels, [
    'Programming Languages',
    'Web Development',
    'SQL',
    'Terminal',
    'Quiz & Practice',
    'DSA Problems',
  ]);
});

test('validateAuthInput validates sign-up and sign-in fields accurately', () => {
  const emptyResult = validateAuthInput('signup', '', '', '');
  assert.equal(emptyResult.valid, false);
  assert.ok(emptyResult.error);

  const validEdu = validateAuthInput(
    'signup',
    'Maya Lin',
    'maya@stanford.edu',
    'edoc2026'
  );
  assert.equal(validEdu.valid, true);
  assert.equal(validEdu.isEduVerified, true);

  const signInNoName = validateAuthInput('signin', '', 'dev@github.com', 'secret123');
  assert.equal(signInNoName.valid, true);
  assert.equal(signInNoName.isEduVerified, false);
  assert.equal(isEduEmail('student@ox.ac.uk'), true);
});

test('createCleanUserProfile initializes new users with a clean slate (Level 1, 0 XP, empty solvedDsaIds, empty completedTopics)', () => {
  const cleanUser = createCleanUserProfile('Maya Lin', 'maya@stanford.edu');
  assert.equal(cleanUser.name, 'Maya Lin');
  assert.equal(cleanUser.email, 'maya@stanford.edu');
  assert.equal(cleanUser.isEduVerified, true);
  assert.equal(cleanUser.level, 1);
  assert.equal(cleanUser.xp, 0);
  assert.deepEqual(cleanUser.solvedDsaIds, []);
  assert.deepEqual(cleanUser.completedTopics, []);

  const zeroLevel = calculateLevelFromXp(0);
  assert.equal(zeroLevel.level, 1);
  assert.equal(zeroLevel.currentXp, 0);
  assert.equal(zeroLevel.progressPercent, 0);

  const leveledUp = calculateLevelFromXp(120);
  assert.equal(leveledUp.level, 3);
});

test('executeSqlQuery handles SELECT, WHERE, JOIN, and rejects destructive queries', () => {
  const resAll = executeSqlQuery('SELECT * FROM students ORDER BY xp DESC LIMIT 3;');
  assert.equal(resAll.error, undefined);
  assert.equal(resAll.rowCount, 3);
  assert.equal(resAll.rows[0].name, 'Priya Nair');

  const resJoin = executeSqlQuery(
    "SELECT * FROM students JOIN submissions ON students.id = submissions.student_id WHERE status = 'Accepted';"
  );
  assert.equal(resJoin.error, undefined);
  assert.ok(resJoin.rowCount >= 4);

  const resDrop = executeSqlQuery('DROP TABLE students;');
  assert.ok(resDrop.error?.includes('Only SELECT queries'));
});

test('executeTerminalCommand executes help, ls, cat, and clear', () => {
  const helpOut = executeTerminalCommand('help');
  assert.ok(helpOut.lines.length > 3);

  const catOut = executeTerminalCommand('cat solution.py');
  assert.ok(catOut.lines.some((l) => l.text.includes('def two_sum')));

  const clearOut = executeTerminalCommand('clear');
  assert.equal(clearOut.clearScreen, true);
});

test('runDsaTestSuite passes starter solution and fails empty code', () => {
  const twoSum = DSA_PROBLEMS[0];
  const passResult = runDsaTestSuite(twoSum, twoSum.starterCode.python);
  assert.equal(passResult.allPassed, true);
  assert.equal(passResult.passedCount, twoSum.testCases.length);

  const failResult = runDsaTestSuite(twoSum, 'pass');
  assert.equal(failResult.allPassed, false);
  assert.ok(failResult.error);
});

import {
  PROGRAMMING_LANGUAGE_TRACKS,
  WEB_DEVELOPMENT_TRACKS,
  SQL_THEORY_CHAPTERS,
} from './theoryData';

test('theoryData defines 4 Programming Language tracks (C, C++, Java, Python), 3 Web Dev tracks (HTML, CSS, JS), and SQL chapters', () => {
  assert.equal(PROGRAMMING_LANGUAGE_TRACKS.length, 4);
  assert.deepEqual(
    PROGRAMMING_LANGUAGE_TRACKS.map((t) => t.name),
    ['C', 'C++', 'Java', 'Python']
  );

  assert.equal(WEB_DEVELOPMENT_TRACKS.length, 3);
  assert.deepEqual(
    WEB_DEVELOPMENT_TRACKS.map((t) => t.id),
    ['html', 'css', 'javascript']
  );

  assert.ok(SQL_THEORY_CHAPTERS.length >= 5);
});

import {
  QUIZ_BANK_TRACKS,
  getQuizQuestionsForTopic,
  calculateQuizScoreBreakdown,
} from './quizBank';

test('quizBank loads all 8 uploaded question bank tracks with 6 MCQ questions per topic and calculates score breakdown', () => {
  assert.equal(QUIZ_BANK_TRACKS.length, 8);
  assert.deepEqual(
    QUIZ_BANK_TRACKS.map((t) => t.id),
    ['python', 'c', 'cpp', 'java', 'html', 'css', 'javascript', 'sql']
  );

  for (const track of QUIZ_BANK_TRACKS) {
    assert.ok(track.topics.length > 0, `Track ${track.id} should have topics`);
    const sample = getQuizQuestionsForTopic(track.id, track.topics[0].id);
    assert.equal(
      sample.questions.length,
      6,
      `Track ${track.id} topic ${sample.topic.title} should load 6 questions`
    );
    for (const q of sample.questions) {
      assert.ok(q.question.length > 0);
      assert.ok(q.options.length >= 2);
      assert.ok(q.explanation.length > 0);
    }
  }

  const pySample = getQuizQuestionsForTopic('python', QUIZ_BANK_TRACKS[0].topics[0].id);
  const pySecondSet = getQuizQuestionsForTopic('python', QUIZ_BANK_TRACKS[0].topics[1].id);
  assert.notEqual(pySample.topic.id, pySecondSet.topic.id);
  assert.notEqual(pySample.questions[0].id, pySecondSet.questions[0].id);
  assert.notEqual(pySample.questions[0].question, pySecondSet.questions[0].question);

  const userAnswers: Record<number, number> = {
    0: pySample.questions[0].correctIndex,
    1: pySample.questions[1].correctIndex,
    2: (pySample.questions[2].correctIndex + 1) % pySample.questions[2].options.length,
  };
  const breakdown = calculateQuizScoreBreakdown(pySample.questions, userAnswers);
  assert.equal(breakdown.totalQuestions, 6);
  assert.equal(breakdown.answeredCount, 3);
  assert.equal(breakdown.correctCount, 2);
  assert.equal(breakdown.incorrectCount, 1);
  assert.equal(breakdown.unansweredCount, 3);
  assert.equal(breakdown.xpEarned, 100);
});

import {
  DSA_300_PROBLEMS,
  DSA_CATEGORIES,
  filterDsa300Problems,
  getRunnableProblemTemplate,
  runDsaProblemTests,
  executeSqlJsQuery,
} from './dsaAndTerminalLogic';
import {
  isAllowedExecuteOrigin,
  validateExecutePayload,
  prepareJavaSourceForWandbox,
  normalizeWandboxResponse,
  MAX_CODE_BYTES,
  MAX_STDIN_BYTES,
} from './codeExecutionHelpers';
import executeApiHandler from '../../api/execute';

test('DSA_300_PROBLEMS loads 300 problems from dsa_400_problems.json across Easy, Medium, and Hard with filtering', () => {
  assert.equal(DSA_300_PROBLEMS.length, 300);
  assert.ok(DSA_CATEGORIES.length >= 15);

  const easyProblems = filterDsa300Problems(DSA_300_PROBLEMS, {
    searchQuery: '',
    difficulty: 'Easy',
    category: 'All',
    statusFilter: 'All',
    solvedIds: [1],
  });
  assert.equal(easyProblems.length, 120);

  const mediumProblems = filterDsa300Problems(DSA_300_PROBLEMS, {
    searchQuery: '',
    difficulty: 'Medium',
    category: 'All',
    statusFilter: 'All',
    solvedIds: [1],
  });
  assert.equal(mediumProblems.length, 120);

  const hardProblems = filterDsa300Problems(DSA_300_PROBLEMS, {
    searchQuery: '',
    difficulty: 'Hard',
    category: 'All',
    statusFilter: 'All',
    solvedIds: [1],
  });
  assert.equal(hardProblems.length, 60);

  const solvedOnly = filterDsa300Problems(DSA_300_PROBLEMS, {
    searchQuery: '',
    difficulty: 'All',
    category: 'All',
    statusFilter: 'Solved',
    solvedIds: [1, 2],
  });
  assert.equal(solvedOnly.length, 2);
});

test('runDsaProblemTests evaluates real SQL via sql.js and rejects empty or unimplemented stubs', async () => {
  const firstProb = DSA_300_PROBLEMS[0];
  const emptyRes = await runDsaProblemTests({
    problem: firstProb,
    language: 'python',
    code: '   ',
  });
  assert.equal(emptyRes.allPassed, false);

  const sqlRes = await runDsaProblemTests({
    problem: firstProb,
    language: 'sql',
    code: getRunnableProblemTemplate(firstProb, 'sql'),
  });
  assert.equal(sqlRes.allPassed, true);
  assert.equal(sqlRes.passedCount, 3);
});

test('executeSqlJsQuery runs SELECT, JOIN, and CREATE TABLE queries in SQLite WebAssembly', async () => {
  const selectRes = await executeSqlJsQuery(
    'SELECT id, name, xp FROM students ORDER BY xp DESC LIMIT 3;'
  );
  assert.equal(selectRes.error, undefined);
  assert.equal(selectRes.rowCount, 3);
  assert.equal(selectRes.rows[0].name, 'Priya Nair');

  const joinRes = await executeSqlJsQuery(
    "SELECT s.name, sub.problem_title, sub.status FROM students s JOIN submissions sub ON s.id = sub.student_id WHERE sub.status = 'Accepted';"
  );
  assert.equal(joinRes.error, undefined);
  assert.ok(joinRes.rowCount >= 4);

  const createAndInsertRes = await executeSqlJsQuery(
    "CREATE TABLE IF NOT EXISTS hackathons (id INTEGER PRIMARY KEY, title TEXT, prize INTEGER); INSERT INTO hackathons VALUES (1, 'EDOC Global Cup', 5000); SELECT * FROM hackathons;"
  );
  assert.equal(createAndInsertRes.error, undefined);
  assert.equal(createAndInsertRes.rowCount, 1);
  assert.equal(createAndInsertRes.rows[0].title, 'EDOC Global Cup');
});

import {
  DSA_CONCEPT_MODULES,
  computeTreeTraversalOrder,
  computeStandardBinarySearchTrace,
  computeLowerBoundTrace,
  computeRotatedSearchTrace,
  computeAnswerSpaceTrace,
} from './dsaConceptsData';

test('DSA_CONCEPT_MODULES includes complete Trees and Binary Search Strategies modules with visual steps, complexity tables, and Python/C++/C templates', () => {
  assert.equal(DSA_CONCEPT_MODULES.length, 2);
  assert.deepEqual(
    DSA_CONCEPT_MODULES.map((m) => m.id),
    ['trees', 'binary-search']
  );

  for (const mod of DSA_CONCEPT_MODULES) {
    assert.equal(mod.topics.length, 4);
    for (const topic of mod.topics) {
      assert.ok(topic.visual.steps.length >= 2);
      assert.ok(topic.whenToUse.length >= 3);
      assert.ok(topic.commonPitfalls.length >= 3);
      assert.ok(topic.complexityTable.length >= 2);
      assert.ok(topic.codeTemplates.python.includes('#'));
      assert.ok(topic.codeTemplates.cpp.includes('//'));
      assert.ok(topic.codeTemplates.c.includes('//'));
    }
  }
});

test('Tree traversal and Binary Search trace generators produce mathematically exact sequences', () => {
  assert.deepEqual(computeTreeTraversalOrder('inorder'), [
    '20', '30', '40', '50', '60', '70', '80',
  ]);
  assert.deepEqual(computeTreeTraversalOrder('preorder'), [
    '50', '30', '20', '40', '70', '60', '80',
  ]);
  assert.deepEqual(computeTreeTraversalOrder('postorder'), [
    '20', '40', '30', '60', '80', '70', '50',
  ]);
  assert.deepEqual(computeTreeTraversalOrder('levelorder'), [
    '50', '30', '70', '20', '40', '60', '80',
  ]);

  const stdSteps = computeStandardBinarySearchTrace([4, 9, 15, 22, 31, 42, 57, 68, 84], 57);
  assert.equal(stdSteps[stdSteps.length - 1].foundIndex, 6);

  const lbSteps = computeLowerBoundTrace([2, 5, 8, 8, 8, 12, 16, 20], 8);
  assert.equal(lbSteps[lbSteps.length - 1].foundIndex, 2);

  const rotSteps = computeRotatedSearchTrace([4, 5, 6, 7, 0, 1, 2], 0);
  assert.equal(rotSteps[rotSteps.length - 1].foundIndex, 4);

  const ansSteps = computeAnswerSpaceTrace([1, 2, 3, 4, 5, 6, 7, 8], 4);
  assert.equal(ansSteps[ansSteps.length - 1].foundIndex, 3);
});

import {
  TUTOR_SUBJECT_OPTIONS,
  QUICK_ACTION_CHIPS,
  buildQuickActionPrompt,
  buildTutorSystemInstruction,
  parseStoredTutorMessages,
  tokenizeCodeLine,
} from './aiTutorLogic';

test('aiTutorLogic configures syllabus contexts, 4 quick action chips, Socratic vs Quick system prompts, and syntax tokenization', () => {
  assert.ok(TUTOR_SUBJECT_OPTIONS.length >= 6);
  assert.deepEqual(
    QUICK_ACTION_CHIPS.map((c) => c.label),
    [
      'Explain with an analogy',
      'Dry-run this code',
      'Find the bug in my code',
      'Give me a practice question',
    ]
  );

  const quickSys = buildTutorSystemInstruction('quick', 'dsa-trees');
  assert.ok(quickSys.includes('Quick Doubt Solver'));
  assert.ok(quickSys.includes('Trees'));

  const guidedSys = buildTutorSystemInstruction('guided', 'dsa-binary-search');
  assert.ok(guidedSys.includes('Socratic Mentor'));
  assert.ok(guidedSys.includes('Check-In Question'));
  assert.ok(guidedSys.includes('Binary Search'));

  const dryRunWrapped = buildQuickActionPrompt('dry-run', 'Python', 'x = 5\nprint(x)');
  assert.ok(dryRunWrapped.includes('dry-run'));
  assert.ok(dryRunWrapped.includes('x = 5'));

  const tokens = tokenizeCodeLine('def solve(n): # compute 42', 'python');
  assert.equal(tokens.map((t) => t.text).join(''), 'def solve(n): # compute 42');
  assert.ok(tokens.some((t) => t.type === 'keyword' && t.text === 'def'));
  assert.ok(tokens.some((t) => t.type === 'comment' && t.text.includes('# compute 42')));

  const parsed = parseStoredTutorMessages(
    JSON.stringify([
      { id: '1', role: 'user', content: 'Hello', timestamp: '10:00', mode: 'quick', subjectLabel: 'Python' },
      { invalid: true },
    ])
  );
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].content, 'Hello');
});

import {
  checkSupabaseConfig,
  formatSupabaseAuthError,
  resolveProfileDisplayName,
} from './supabaseAuthHelpers';

test('supabaseAuthHelpers validates config fallback, maps wrong password & duplicate email errors, and resolves public.profiles full_name', () => {
  const missingBoth = checkSupabaseConfig('', '');
  assert.equal(missingBoth.configured, false);
  assert.deepEqual(missingBoth.missingVars, [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
  ]);

  const placeholderCfg = checkSupabaseConfig(
    'https://your-project-ref.supabase.co',
    'your_supabase_publishable_key'
  );
  assert.equal(placeholderCfg.configured, false);
  assert.equal(placeholderCfg.missingVars.length, 2);

  const validCfg = checkSupabaseConfig(
    'https://abcdefghijkl.supabase.co',
    'sb_publishable_live_abc123456789'
  );
  assert.equal(validCfg.configured, true);
  assert.deepEqual(validCfg.missingVars, []);

  const wrongPwMsg = formatSupabaseAuthError('Invalid login credentials', 'signin');
  assert.ok(wrongPwMsg.toLowerCase().includes('incorrect email or password'));

  const dupEmailMsg = formatSupabaseAuthError('User already registered', 'signup');
  assert.ok(dupEmailMsg.toLowerCase().includes('already exists'));

  assert.equal(
    resolveProfileDisplayName('Ananya Rao', 'Metadata Name', 'ananya@mit.edu'),
    'Ananya Rao'
  );
  assert.equal(
    resolveProfileDisplayName(null, 'Metadata Name', 'ananya@mit.edu'),
    'Metadata Name'
  );
  assert.equal(
    resolveProfileDisplayName('', '', 'arjun.verma@university.edu'),
    'Arjun Verma'
  );
});

import {
  normalizeUserRole,
  isAdminRole,
  computeAdminStats,
  filterAdminProfiles,
  buildAdminUsersCsv,
  AdminProfileRecord,
} from './adminLogic';

test('adminLogic enforces strict admin role checks, computes 24h active stats, filters users, and generates safe password-free CSV', () => {
  assert.equal(normalizeUserRole('admin'), 'admin');
  assert.equal(normalizeUserRole('ADMIN'), 'admin');
  assert.equal(normalizeUserRole('student'), 'student');
  assert.equal(normalizeUserRole(null), 'student');
  assert.equal(isAdminRole('admin'), true);
  assert.equal(isAdminRole('student'), false);

  const now = new Date('2026-11-24T12:00:00.000Z');
  const sampleProfiles: AdminProfileRecord[] = [
    {
      id: 'u1',
      full_name: 'Dr. Kavya Rao',
      email: 'kavya@edoc.dev',
      role: 'admin',
      created_at: '2026-10-01T08:00:00.000Z',
      last_login: '2026-11-24T10:30:00.000Z', // 1.5h ago -> active
    },
    {
      id: 'u2',
      full_name: 'Rohan Mehta',
      email: 'rohan@university.edu',
      role: 'student',
      created_at: '2026-11-10T09:00:00.000Z',
      last_login: '2026-11-23T15:00:00.000Z', // 21h ago -> active
    },
    {
      id: 'u3',
      full_name: '=CMD("danger")',
      email: 'old.user@university.edu',
      role: 'student',
      created_at: '2026-09-15T12:00:00.000Z',
      last_login: '2026-11-20T12:00:00.000Z', // 4 days ago -> inactive
    },
    {
      id: 'u4',
      full_name: 'New Signup',
      email: 'new@college.edu',
      role: null,
      created_at: '2026-11-24T01:00:00.000Z',
      last_login: null, // never logged in -> inactive
    },
  ];

  const stats = computeAdminStats(sampleProfiles, now);
  assert.deepEqual(stats, {
    totalUsers: 4,
    activeToday: 2,
    totalAdmins: 1,
  });

  const adminMatches = filterAdminProfiles(sampleProfiles, 'admin');
  assert.equal(adminMatches.length, 1);
  assert.equal(adminMatches[0].id, 'u1');

  const emailMatches = filterAdminProfiles(sampleProfiles, 'rohan@');
  assert.equal(emailMatches.length, 1);
  assert.equal(emailMatches[0].full_name, 'Rohan Mehta');

  const csv = buildAdminUsersCsv(sampleProfiles);
  const lines = csv.split('\n');
  assert.equal(lines.length, 5);
  assert.equal(
    lines[0],
    '"Full Name","Email","Role","Account Created Date","Last Login Timestamp"'
  );
  assert.equal(csv.toLowerCase().includes('password'), false);
  // Formula-injection prefix must be neutralized with leading single quote
  assert.ok(lines[3].startsWith(`"'=CMD(""danger"")"`));
});

import {
  EDOC_GEMINI_KEY_STORAGE,
  GEMINI_BYOK_MODEL,
  AI_STUDIO_API_KEYS_URL,
  validateByokKeyInput,
  classifyByokError,
  maskApiKeyPreview,
} from './geminiByokHelpers';

test('geminiByokHelpers accepts any non-empty key string, uses edoc_user_gemini_key and gemini-3.5-flash-lite, and classifies 401/403/429 errors', () => {
  assert.equal(EDOC_GEMINI_KEY_STORAGE, 'edoc_user_gemini_key');
  assert.equal(GEMINI_BYOK_MODEL, 'gemini-3.5-flash-lite');
  assert.equal(AI_STUDIO_API_KEYS_URL, 'https://aistudio.google.com/api-keys');

  // Empty keys rejected
  assert.equal(validateByokKeyInput('   ').valid, false);

  // Any non-empty key accepted (must NOT require "AIza" prefix)
  const nonAiza = validateByokKeyInput('  custom-key-format-998877  ');
  assert.equal(nonAiza.valid, true);
  assert.equal(nonAiza.normalized, 'custom-key-format-998877');

  assert.equal(maskApiKeyPreview('1234567890abcd'), '1234••••••abcd');

  const noKeyErr = classifyByokError({ code: 'NO_API_KEY' });
  assert.equal(noKeyErr.code, 'NO_API_KEY');

  const invalid401 = classifyByokError({ status: 401, message: 'API_KEY_INVALID' });
  assert.equal(invalid401.code, 'INVALID_KEY');
  assert.ok(invalid401.title.includes('401'));

  const restricted403 = classifyByokError({ status: 403, message: 'PERMISSION_DENIED' });
  assert.equal(restricted403.code, 'INVALID_KEY');

  const rateLimit429 = classifyByokError({ status: 429, message: 'RESOURCE_EXHAUSTED' });
  assert.equal(rateLimit429.code, 'RATE_LIMITED');
  assert.ok(rateLimit429.title.includes('429'));
});

import {
  detectProgramInputPrompts,
  createInteractiveRunState,
  advanceInteractiveRunState,
  parseExecutionError,
  parseErrorLineSegments,
  navigateCommandHistory,
  clampTerminalFontSize,
  clampTerminalHeight,
  formatTerminalEntriesForCopy,
} from './interactiveTerminalLogic';
import {
  validateSavedCodeInput,
  buildCodePreview,
  filterSavedCodes,
  normalizeSavedLanguage,
  SavedCodeRecord,
} from './savedCodesHelpers';

test('interactiveTerminalLogic handles sequential & loop inputs, parses Python/C/Java errors, navigates history, and clamps dimensions', () => {
  // Python sequential prompts detection
  const pyInteractive = detectProgramInputPrompts(
    'python',
    'name = input("Enter your name: ")\nage = int(input("Age: "))\nprint(f"Hi {name}, {age}")'
  );
  assert.equal(pyInteractive.needsInput, true);
  assert.deepEqual(pyInteractive.prompts, ['Enter your name:', 'Age:']);

  // Loop-based interactive input stepping (Python count-driven loop)
  const loopCode =
    'n = int(input("Count: "))\nfor i in range(n):\n    x = int(input(f"Item {i+1}: "))\nprint(x)';
  const s0 = createInteractiveRunState('python', loopCode);
  assert.ok(s0);
  assert.equal(s0?.activePrompt, 'Count: ');
  const s1 = advanceInteractiveRunState(s0!, '2');
  assert.equal(s1.done, false);
  assert.equal(s1.activePrompt, 'Item 1: ');
  const s2 = advanceInteractiveRunState(s1, '10');
  assert.equal(s2.done, false);
  assert.equal(s2.activePrompt, 'Item 2: ');
  const s3 = advanceInteractiveRunState(s2, '20');
  assert.equal(s3.done, true);
  assert.deepEqual(s3.collectedInputs, ['2', '10', '20']);

  // Commented-out input should NOT trigger stdin detection
  const pyCommentOnly = detectProgramInputPrompts(
    'python',
    '# name = input("Ignored")\nprint("Hello")'
  );
  assert.equal(pyCommentOnly.needsInput, false);

  // C scanf / C++ cin / Java Scanner detection
  assert.equal(
    detectProgramInputPrompts('c', 'int main() { int x; scanf("%d", &x); }').needsInput,
    true
  );
  assert.equal(
    detectProgramInputPrompts('cpp', 'int main() { int x; cin >> x; }').needsInput,
    true
  );
  assert.equal(
    detectProgramInputPrompts('java', 'Scanner sc = new Scanner(System.in); int x = sc.nextInt();').needsInput,
    true
  );

  // Structured Error Parsing: Python NameError, GCC Compilation Error, Java Exception
  const pyNameErr = parseExecutionError(
    'python',
    'Traceback (most recent call last):\n  File "main.py", line 7, in <module>\nNameError: name \'total\' is not defined'
  );
  assert.ok(pyNameErr);
  assert.equal(pyNameErr?.errorType, 'NameError');
  assert.equal(pyNameErr?.lineNumber, 7);
  assert.equal(pyNameErr?.message, "name 'total' is not defined");

  const gccErr = parseExecutionError(
    'c',
    "main.c:8:12: error: expected ';' before 'return'"
  );
  assert.ok(gccErr);
  assert.equal(gccErr?.errorType, 'Compilation Error');
  assert.equal(gccErr?.lineNumber, 8);
  assert.equal(gccErr?.columnNumber, 12);

  const javaErr = parseExecutionError(
    'java',
    'Exception in thread "main" java.lang.ArithmeticException: / by zero\n\tat Main.main(Main.java:6)'
  );
  assert.ok(javaErr);
  assert.equal(javaErr?.errorType, 'ArithmeticException');
  assert.equal(javaErr?.lineNumber, 6);

  // Error line-number segments for clickable terminal links
  const pyErrSegs = parseErrorLineSegments('  File "main.py", line 12, in <module>');
  assert.equal(pyErrSegs.find((s) => s.isLineRef)?.lineNumber, 12);

  // Up/Down command history cycling with draft preservation
  const history = ['help', 'ls', 'run'];
  const up1 = navigateCommandHistory(history, -1, 'up', 'my draft', '');
  assert.equal(up1.nextIndex, 2);
  assert.equal(up1.nextValue, 'run');
  const down1 = navigateCommandHistory(history, up1.nextIndex, 'down', up1.nextValue, up1.nextDraft);
  assert.equal(down1.nextIndex, -1);
  assert.equal(down1.nextValue, 'my draft');

  // Clamping & copy formatting
  assert.equal(clampTerminalFontSize(6), 11);
  assert.equal(clampTerminalFontSize(28), 20);
  assert.equal(clampTerminalHeight(100), 220);
  assert.equal(clampTerminalHeight(900), 680);

  const copied = formatTerminalEntriesForCopy([
    { id: '1', type: 'system', prefix: '$', text: 'python3 main.py' },
    { id: '2', type: 'prompt-echo', promptLabel: 'Name: ', text: 'Aarav' },
    { id: '3', type: 'stdout', text: 'Welcome Aarav!' },
  ]);
  assert.equal(copied, '$ python3 main.py\nName: Aarav\nWelcome Aarav!');

  // Real Wandbox prog.cc / prog.java / Pyodide traceback error parsing
  const wandboxCppErr = parseExecutionError(
    'cpp',
    "prog.cc:5:10: error: 'total' was not declared in this scope"
  );
  assert.equal(wandboxCppErr?.errorType, 'Compilation Error');
  assert.equal(wandboxCppErr?.lineNumber, 5);

  const pyStdlibTrace = parseExecutionError(
    'python',
    'Traceback (most recent call last):\n  File "main.py", line 4, in <module>\n  File "/lib/python3.12/json/decoder.py", line 355, in raw_decode\nValueError: invalid literal'
  );
  assert.equal(pyStdlibTrace?.errorType, 'ValueError');
  assert.equal(pyStdlibTrace?.lineNumber, 4);
});

test('codeExecutionHelpers & api/execute.ts enforce Origin lock (403), language allowlist (400), 20KB/5KB payload limits (413), Java class prep, and Wandbox normalization', async () => {
  // Origin allowlist checks
  assert.equal(
    isAllowedExecuteOrigin('https://edoc-learning-platform.vercel.app').allowed,
    true
  );
  assert.equal(
    isAllowedExecuteOrigin('https://edoc-learning-platform-git-main-team.vercel.app')
      .allowed,
    true
  );
  assert.equal(isAllowedExecuteOrigin('http://localhost:3000').allowed, true);
  assert.equal(isAllowedExecuteOrigin('http://127.0.0.1:5173').allowed, true);
  assert.equal(isAllowedExecuteOrigin('https://evil.com').allowed, false);
  assert.equal(
    isAllowedExecuteOrigin('https://attacker-other.vercel.app').allowed,
    false
  );
  assert.equal(
    isAllowedExecuteOrigin('https://evil.com/edoc-learning-platform.vercel.app')
      .allowed,
    false
  );
  assert.equal(isAllowedExecuteOrigin(null, null).allowed, false);

  // Payload & size validation
  assert.equal(
    validateExecutePayload({ language: 'python', code: 'print(1)' }).status,
    400
  );
  assert.equal(
    validateExecutePayload({
      language: 'c',
      code: 'a'.repeat(MAX_CODE_BYTES + 1),
    }).status,
    413
  );
  assert.equal(
    validateExecutePayload({
      language: 'cpp',
      code: 'int main(){}',
      stdin: 'b'.repeat(MAX_STDIN_BYTES + 1),
    }).status,
    413
  );
  assert.equal(
    validateExecutePayload({
      language: 'java',
      code: 'public class Main { public static void main(String[] a) {} }',
      stdin: '42\n',
    }).ok,
    true
  );

  // Java public class Main -> class Main without altering line numbers
  const javaSrc = 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {}\n}';
  const prepped = prepareJavaSourceForWandbox(javaSrc);
  assert.equal(prepped.split('\n').length, javaSrc.split('\n').length);
  assert.ok(prepped.includes('\nclass Main {'));
  assert.equal(prepped.includes('public class Main'), false);

  // Wandbox response normalization
  const normOk = normalizeWandboxResponse({
    status: '0',
    program_output: 'Sum = 30\n',
    compiler_error: '',
    program_error: '',
  });
  assert.deepEqual(normOk, { stdout: 'Sum = 30\n', stderr: '', exitCode: 0 });

  const normErr = normalizeWandboxResponse({
    status: '1',
    compiler_error: "prog.c:4:5: error: expected ';'",
    compiler_message: "prog.c:4:5: error: expected ';'",
    program_output: '',
  });
  assert.equal(normErr.exitCode, 1);
  assert.equal(normErr.stderr, "prog.c:4:5: error: expected ';'");

  // Direct handler test of api/execute.ts safeguards
  const runMockHandler = async (req: {
    method: string;
    headers: Record<string, string>;
    body?: unknown;
  }) => {
    let statusCode = 200;
    let jsonPayload: unknown = null;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(payload: unknown) {
        jsonPayload = payload;
      },
      setHeader() {},
      end() {},
    };
    await executeApiHandler(req, res);
    return { statusCode, jsonPayload };
  };

  const blocked = await runMockHandler({
    method: 'POST',
    headers: { origin: 'https://unauthorized-site.example' },
    body: { language: 'c', code: 'int main(){return 0;}' },
  });
  assert.equal(blocked.statusCode, 403);

  const badLang = await runMockHandler({
    method: 'POST',
    headers: { origin: 'https://edoc-learning-platform.vercel.app' },
    body: { language: 'python', code: 'print(1)' },
  });
  assert.equal(badLang.statusCode, 400);

  const tooBigCode = await runMockHandler({
    method: 'POST',
    headers: { origin: 'http://localhost:3000' },
    body: { language: 'c', code: 'x'.repeat(MAX_CODE_BYTES + 10) },
  });
  assert.equal(tooBigCode.statusCode, 413);

  const tooBigStdin = await runMockHandler({
    method: 'POST',
    headers: { origin: 'http://localhost:3000' },
    body: {
      language: 'cpp',
      code: 'int main(){return 0;}',
      stdin: 'y'.repeat(MAX_STDIN_BYTES + 10),
    },
  });
  assert.equal(tooBigStdin.statusCode, 413);
});

test('savedCodesHelpers validates snippet titles, builds previews, and filters saved_codes cleanly', () => {
  assert.equal(
    validateSavedCodeInput({ title: '   ', language: 'python', code: 'print(1)' }).valid,
    false
  );
  assert.equal(
    validateSavedCodeInput({
      title: '  Binary Search Practice  ',
      language: 'python',
      code: 'print(1)',
    }).normalizedTitle,
    'Binary Search Practice'
  );
  assert.equal(normalizeSavedLanguage('C++'), 'cpp');
  assert.ok(buildCodePreview('a\nb\nc\nd\ne\nf', 4).includes('+2 more lines'));

  const sampleSaved: SavedCodeRecord[] = [
    {
      id: '1',
      user_id: 'u1',
      title: 'Binary Search Practice',
      language: 'python',
      code: 'def bsearch(arr, x): pass',
      updated_at: '2026-11-24T12:00:00.000Z',
    },
    {
      id: '2',
      user_id: 'u1',
      title: 'Pointer Demo',
      language: 'c',
      code: 'int main() { return 0; }',
      updated_at: '2026-11-24T11:00:00.000Z',
    },
  ];

  assert.equal(filterSavedCodes(sampleSaved, 'binary', 'all').length, 1);
  assert.equal(filterSavedCodes(sampleSaved, '', 'c').length, 1);
  assert.equal(filterSavedCodes(sampleSaved, 'binary', 'c').length, 0);
});









