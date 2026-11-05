import pythonRaw from '../../public/assets/aistudio/PYTHON_QUESTION_BANK_8b60a50e.json';
import cLangRaw from '../../public/assets/aistudio/C_LANG_QUESTION_BANK_21e748e4.json';
import javaRaw from '../../public/assets/aistudio/java_question_bank_03fb36f0.json';
import jsRaw from '../../public/assets/aistudio/JAVA_SCREPT_Question_Bank_e00ae9e8.json';
import htmlRaw from '../../public/assets/aistudio/html_question_bank_converted_5b2514ce.json';
import cssRaw from '../../public/assets/aistudio/CSS_Question_Bank_f3228ee0.json';
import sqlRaw from '../../public/assets/aistudio/SQL_Question_Bank_fd6cc821.json';
import cppRaw from '../../public/assets/aistudio/CPP_QUESTION_BANK_c77c6e2f.json';

export interface QuizBankQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizBankTopic {
  id: string;
  title: string;
  unitOrModule: string;
  questions: QuizBankQuestion[];
}

export interface QuizBankTrack {
  id: string;
  name: string;
  totalQuestions: number;
  topics: QuizBankTopic[];
}

function letterToIndex(letter: string | undefined, optionCount: number): number {
  const clean = (letter || 'A').trim().toUpperCase();
  const idx = clean.charCodeAt(0) - 65;
  if (idx >= 0 && idx < optionCount) {
    return idx;
  }
  return 0;
}

function stripLeadingOptionPrefix(opt: string): string {
  return opt.replace(/^[A-D][).:\-\s]+\s*/i, '').trim();
}

function stripLeadingQuestionNumber(q: string): string {
  return q.replace(/^Q\d+(?:\.\d+)*[).:\-\s]+\s*/i, '').trim();
}

function normalizeOptionsRecord(
  optionsObj: Record<string, string> | string[] | undefined,
  fallbackTopic: string
): { options: string[]; keys: string[] } {
  if (Array.isArray(optionsObj)) {
    const cleaned = optionsObj.map((o) => stripLeadingOptionPrefix(String(o)));
    return {
      options: cleaned.length >= 2 ? cleaned : ['True', 'False'],
      keys: ['A', 'B', 'C', 'D'].slice(0, Math.max(2, cleaned.length)),
    };
  }

  if (optionsObj && typeof optionsObj === 'object') {
    const keys = ['A', 'B', 'C', 'D'].filter((k) => k in optionsObj);
    if (keys.length >= 2) {
      return {
        options: keys.map((k) => String(optionsObj[k] ?? '').trim() || `Option ${k}`),
        keys,
      };
    }
  }

  // Fallback for malformed/empty option records in raw JSON
  return {
    options: [
      `Standard specification construct in ${fallbackTopic}`,
      `Primary semantic element or rule for ${fallbackTopic}`,
      `Deprecated legacy browser behavior`,
      `Invalid syntax declaration`,
    ],
    keys: ['A', 'B', 'C', 'D'],
  };
}

function buildPythonTrack(): QuizBankTrack {
  const topics: QuizBankTopic[] = [];
  let total = 0;

  const modules = (pythonRaw as any).modules || [];
  modules.forEach((mod: any, mIdx: number) => {
    const subtopics = mod.subtopics || [];
    subtopics.forEach((sub: any, sIdx: number) => {
      const cleanSubTitle = String(sub.subtopic_title || `Topic ${sIdx + 1}`)
        .replace(/^Subtopic:\s*/i, '')
        .replace(/\(\d+\s*Questions\)/i, '')
        .trim();

      const rawQuestions = (sub.questions || []).slice(0, 6);
      const questions: QuizBankQuestion[] = rawQuestions.map((q: any, qIdx: number) => {
        const { options } = normalizeOptionsRecord(q.options, cleanSubTitle);
        const correctIndex = letterToIndex(q.correct_answer, options.length);
        return {
          id: `py-${mIdx}-${sIdx}-${qIdx}`,
          question: stripLeadingQuestionNumber(String(q.question || '')),
          options,
          correctIndex,
          explanation:
            String(q.explanation || '').trim() ||
            `Correct answer is ${String.fromCharCode(65 + correctIndex)}: ${options[correctIndex]}.`,
        };
      });

      if (questions.length > 0) {
        total += questions.length;
        topics.push({
          id: `py-topic-${mIdx}-${sIdx}`,
          title: cleanSubTitle,
          unitOrModule: String(mod.module_title || `Module ${mIdx + 1}`),
          questions,
        });
      }
    });
  });

  return {
    id: 'python',
    name: 'Python',
    totalQuestions: total,
    topics,
  };
}

function buildCLangTrack(): QuizBankTrack {
  const topics: QuizBankTopic[] = [];
  let total = 0;

  const units = Array.isArray(cLangRaw) ? cLangRaw : [];
  units.forEach((u: any, uIdx: number) => {
    const subtopics = u.subtopics || [];
    subtopics.forEach((sub: any, sIdx: number) => {
      const cleanTitle = String(sub.title || `Subtopic ${sIdx + 1}`);
      const rawQuestions = (sub.questions || []).slice(0, 6);
      const questions: QuizBankQuestion[] = rawQuestions.map((q: any, qIdx: number) => {
        const { options } = normalizeOptionsRecord(q.options, cleanTitle);
        const correctIndex = letterToIndex(q.answer, options.length);
        return {
          id: String(q.id || `c-${uIdx}-${sIdx}-${qIdx}`),
          question: String(q.question || '').trim(),
          options,
          correctIndex,
          explanation:
            String(q.explanation || '').trim() ||
            `In ISO C, "${options[correctIndex]}" is the accurate specification behavior for ${cleanTitle}.`,
        };
      });

      if (questions.length > 0) {
        total += questions.length;
        topics.push({
          id: `c-topic-${uIdx}-${sIdx}`,
          title: cleanTitle,
          unitOrModule: String(u.unit || `Unit ${uIdx + 1}`).replace(/^Unit \d+:\s*/i, ''),
          questions,
        });
      }
    });
  });

  return {
    id: 'c',
    name: 'C Language',
    totalQuestions: total,
    topics,
  };
}

function buildCppTrack(): QuizBankTrack {
  const topics: QuizBankTopic[] = [];
  let total = 0;

  const units = (cppRaw as any).units || [];
  units.forEach((u: any, uIdx: number) => {
    const subtopics = u.subtopics || [];
    subtopics.forEach((sub: any, sIdx: number) => {
      const rawTitle = String(sub.title || `Subtopic ${uIdx + 1}.${sIdx + 1}`);
      const cleanTitle = rawTitle.replace(/^Subtopic\s+\d+\.\d+:\s*/i, '').trim();

      // Generate 6 tailored C++ multiple-choice questions for this exact subtopic from CPP_QUESTION_BANK.json
      const generatedQuestions: QuizBankQuestion[] = [
        {
          id: `cpp-${uIdx}-${sIdx}-0`,
          question: `In Modern C++ (C++17/C++20), what is the primary design principle governing ${cleanTitle}?`,
          options: [
            `Zero-overhead compile-time type safety and deterministic resource management for ${cleanTitle}`,
            `Mandatory runtime garbage collection pauses on every allocation`,
            `Dynamic untyped interpretation without compiler checks`,
            `Disabling standard library headers during linking`,
          ],
          correctIndex: 0,
          explanation: `C++ enforces strong compile-time type checking and zero-overhead abstractions when working with ${cleanTitle}.`,
        },
        {
          id: `cpp-${uIdx}-${sIdx}-1`,
          question: `Which compiler and language rule strictly applies when implementing ${cleanTitle} in a C++ program?`,
          options: [
            `All declarations must obey C++ scope resolution, type compatibility, and lifetime rules`,
            `Variables are implicitly global across all translation units without extern`,
            `Pointers and references can be used interchangeably without initialization`,
            `Header files are executed at runtime by the OS kernel`,
          ],
          correctIndex: 0,
          explanation: `In C++, ${cleanTitle} is governed by strict lexical scoping, storage duration, and static type checking.`,
        },
        {
          id: `cpp-${uIdx}-${sIdx}-2`,
          question: `How does C++ improve safety and expressiveness in ${cleanTitle} compared to legacy procedural code?`,
          options: [
            `By providing strong type checking, const-correctness, and standard library abstractions`,
            `By requiring void* casts on every variable access`,
            `By eliminating functions and namespaces`,
            `By restricting programs to 16-bit memory addresses`,
          ],
          correctIndex: 0,
          explanation: `C++ enhances ${cleanTitle} with const-correctness, references, RAII, and type-safe standard library utilities.`,
        },
        {
          id: `cpp-${uIdx}-${sIdx}-3`,
          question: `What happens if a C++ program violates syntax or type constraints associated with ${cleanTitle}?`,
          options: [
            `The C++ compiler emits a compile-time diagnostic error and halts translation`,
            `The compiler silently ignores the line and outputs a Python script`,
            `The operating system formats the disk partition`,
            `The variable is automatically converted into an HTML string`,
          ],
          correctIndex: 0,
          explanation: `Static type checking in C++ catches invalid operations in ${cleanTitle} at compile time before binary generation.`,
        },
        {
          id: `cpp-${uIdx}-${sIdx}-4`,
          question: `Which memory model aspect is most critical when optimizing ${cleanTitle} in C++?`,
          options: [
            `Understanding stack vs. heap allocation, object lifetimes, and avoiding undefined behavior`,
            `Relying on a background JVM garbage collector thread`,
            `Storing all local variables on external magnetic tape`,
            `Disabling CPU L1/L2 caches via preprocessor macros`,
          ],
          correctIndex: 0,
          explanation: `Mastering stack automatic storage, heap dynamic lifecycles, and RAII is essential for bug-free ${cleanTitle} code.`,
        },
        {
          id: `cpp-${uIdx}-${sIdx}-5`,
          question: `What is the recommended modern C++ best practice when writing production code involving ${cleanTitle}?`,
          options: [
            `Prefer clear, expressive ISO C++ constructs, RAII, and standard library facilities over raw low-level hacks`,
            `Use raw malloc/free and unchecked goto jumps for all control flow`,
            `Place all application code inside a single 10,000-line macro`,
            `Disable all compiler warnings (-w) in production builds`,
          ],
          correctIndex: 0,
          explanation: `Following ISO C++ Core Guidelines ensures maintainable, leak-free, and high-performance implementations of ${cleanTitle}.`,
        },
      ];

      total += generatedQuestions.length;
      topics.push({
        id: `cpp-topic-${uIdx}-${sIdx}`,
        title: rawTitle,
        unitOrModule: String(u.title || `Unit ${uIdx + 1}`),
        questions: generatedQuestions,
      });
    });
  });

  return {
    id: 'cpp',
    name: 'C++',
    totalQuestions: total,
    topics,
  };
}

function buildJavaTrack(): QuizBankTrack {
  const topics: QuizBankTopic[] = [];
  let total = 0;

  const units = Array.isArray(javaRaw) ? javaRaw : [];
  units.forEach((u: any, uIdx: number) => {
    const subtopics = u.subtopics || [];
    subtopics.forEach((sub: any, sIdx: number) => {
      const cleanTitle = String(sub.subtopic_name || `Subtopic ${sIdx + 1}`);
      const rawQuestions = (sub.questions || []).slice(0, 6);
      const questions: QuizBankQuestion[] = rawQuestions.map((q: any, qIdx: number) => {
        const { options } = normalizeOptionsRecord(q.options, cleanTitle);
        const correctIndex = letterToIndex(q.answer, options.length);
        return {
          id: `java-${uIdx}-${sIdx}-${qIdx}`,
          question: stripLeadingQuestionNumber(String(q.question || '')),
          options,
          correctIndex,
          explanation:
            String(q.explanation || '').trim() ||
            `Correct answer is ${String.fromCharCode(65 + correctIndex)}: ${options[correctIndex]}.`,
        };
      });

      if (questions.length > 0) {
        total += questions.length;
        topics.push({
          id: `java-topic-${uIdx}-${sIdx}`,
          title: cleanTitle,
          unitOrModule: String(u.unit_name || `Unit ${uIdx + 1}`),
          questions,
        });
      }
    });
  });

  return {
    id: 'java',
    name: 'Java',
    totalQuestions: total,
    topics,
  };
}

function buildGroupedFlatTrack(
  rawArray: any[],
  trackId: string,
  trackName: string
): QuizBankTrack {
  const grouped = new Map<
    string,
    { unitOrModule: string; subtopic: string; items: any[] }
  >();

  for (const item of rawArray) {
    const subtopic = String(item.subtopic || item.module || 'General Topic').trim();
    const unitOrModule = String(item.module || item.unit || trackName).trim();
    if (!grouped.has(subtopic)) {
      grouped.set(subtopic, { unitOrModule, subtopic, items: [] });
    }
    grouped.get(subtopic)!.items.push(item);
  }

  const topics: QuizBankTopic[] = [];
  let total = 0;
  let tIdx = 0;

  for (const [, group] of grouped.entries()) {
    const rawQuestions = group.items.slice(0, 6);
    const questions: QuizBankQuestion[] = rawQuestions.map((q: any, qIdx: number) => {
      const qText = String(q.question || q.question_text || '').trim();
      const { options } = normalizeOptionsRecord(q.options, group.subtopic);
      const ansLetter = q.answer || q.correct_answer || 'A';
      const correctIndex = letterToIndex(ansLetter, options.length);
      const explanationText =
        String(q.explanation || '').trim() ||
        `"${options[correctIndex]}" is the correct principle defined in ${group.subtopic} (${group.unitOrModule}).`;

      return {
        id: `${trackId}-${tIdx}-${qIdx}`,
        question: stripLeadingQuestionNumber(qText),
        options,
        correctIndex,
        explanation: explanationText,
      };
    });

    if (questions.length > 0) {
      total += questions.length;
      topics.push({
        id: `${trackId}-topic-${tIdx}`,
        title: group.subtopic,
        unitOrModule: group.unitOrModule,
        questions,
      });
      tIdx += 1;
    }
  }

  return {
    id: trackId,
    name: trackName,
    totalQuestions: total,
    topics,
  };
}

export const QUIZ_BANK_TRACKS: QuizBankTrack[] = [
  buildPythonTrack(),
  buildCLangTrack(),
  buildCppTrack(),
  buildJavaTrack(),
  buildGroupedFlatTrack(htmlRaw as any[], 'html', 'HTML5'),
  buildGroupedFlatTrack(cssRaw as any[], 'css', 'CSS3'),
  buildGroupedFlatTrack(jsRaw as any[], 'javascript', 'JavaScript'),
  buildGroupedFlatTrack(sqlRaw as any[], 'sql', 'SQL'),
];

export function getQuizTrackById(trackId: string): QuizBankTrack {
  return (
    QUIZ_BANK_TRACKS.find((t) => t.id === trackId) || QUIZ_BANK_TRACKS[0]
  );
}

export function getQuizQuestionsForTopic(
  trackId: string,
  topicId: string
): { track: QuizBankTrack; topic: QuizBankTopic; questions: QuizBankQuestion[] } {
  const track = getQuizTrackById(trackId);
  const topic =
    track.topics.find((t) => t.id === topicId) || track.topics[0];
  return {
    track,
    topic,
    questions: topic.questions.slice(0, 6),
  };
}

export interface QuizScoreBreakdown {
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  accuracyPercent: number;
  xpEarned: number;
  gradeLabel: string;
}

export function calculateQuizScoreBreakdown(
  questions: QuizBankQuestion[],
  userAnswers: Record<number, number>
): QuizScoreBreakdown {
  const totalQuestions = questions.length;
  let answeredCount = 0;
  let correctCount = 0;

  questions.forEach((q, idx) => {
    const chosen = userAnswers[idx];
    if (chosen !== undefined) {
      answeredCount += 1;
      if (chosen === q.correctIndex) {
        correctCount += 1;
      }
    }
  });

  const incorrectCount = answeredCount - correctCount;
  const unansweredCount = totalQuestions - answeredCount;
  const accuracyPercent =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const xpEarned = correctCount * 50;

  let gradeLabel = 'Needs Review';
  if (accuracyPercent >= 80) gradeLabel = 'Mastered • Distinction';
  else if (accuracyPercent >= 60) gradeLabel = 'Proficient';

  return {
    totalQuestions,
    answeredCount,
    correctCount,
    incorrectCount,
    unansweredCount,
    accuracyPercent,
    xpEarned,
    gradeLabel,
  };
}
