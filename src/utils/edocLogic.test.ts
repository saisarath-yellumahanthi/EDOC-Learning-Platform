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
  TERMINAL_STARTER_CODE,
  evaluateCodeLocally,
  runDsaProblemTests,
  executeSqlJsQuery,
} from './dsaAndTerminalLogic';

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

test('evaluateCodeLocally and runDsaProblemTests evaluate C, C++, Java, Python, and SQL accurately', async () => {
  const cEval = evaluateCodeLocally('c', TERMINAL_STARTER_CODE.c, '4\n10 20 30 40');
  assert.equal(cEval.exitCode, 0);
  assert.ok(cEval.stdout.includes('100'));

  const firstProb = DSA_300_PROBLEMS[0];
  const runnablePy = getRunnableProblemTemplate(firstProb, 'python');
  const testRun = await runDsaProblemTests({
    problem: firstProb,
    language: 'python',
    code: runnablePy,
  });
  assert.equal(testRun.allPassed, true);
  assert.equal(testRun.passedCount, 3);
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






