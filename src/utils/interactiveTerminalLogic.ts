import type { TerminalLanguageKey } from './dsaAndTerminalLogic';

export interface ParsedCodeError {
  errorType: string;
  lineNumber: number | null;
  columnNumber: number | null;
  message: string;
  rawStderr: string;
}

export type TerminalEntryType =
  | 'system'
  | 'prompt-echo'
  | 'input'
  | 'stdout'
  | 'stderr'
  | 'error-report';

export interface TerminalEntry {
  id: string;
  type: TerminalEntryType;
  text: string;
  timestamp?: string;
  prefix?: string;
  /** Used when echoing an inline interactive prompt + user input on the same line */
  promptLabel?: string;
  /** Structured error payload for formatted Error Type | Line | Details block */
  parsedError?: ParsedCodeError;
}

export interface ProgramInputAnalysis {
  needsInput: boolean;
  prompts: string[];
  usesBulkStdin: boolean;
  inputKind: 'interactive-prompts' | 'stdin-stream' | 'none';
}

export interface InteractiveInputStep {
  kind: 'single' | 'loop-fixed' | 'loop-var' | 'stream';
  promptTemplate: string;
  varName?: string;
  countVar?: string;
  fixedCount?: number;
  loopIndexVar?: string;
  /** True for C/C++/Java/sys.stdin where space-separated tokens can satisfy multiple iterations */
  tokenBased?: boolean;
}

export interface InteractiveRunState {
  steps: InteractiveInputStep[];
  stepIndex: number;
  loopIteration: number;
  loopTotalIterations: number;
  capturedVars: Record<string, string>;
  collectedInputs: string[];
  renderedPrompts: string[];
  activePrompt: string;
  done: boolean;
  codeSnapshot: string;
  languageSnapshot: TerminalLanguageKey;
}

export interface ErrorLineSegment {
  text: string;
  isLineRef: boolean;
  lineNumber?: number;
}

export interface HistoryNavigationResult {
  nextIndex: number;
  nextValue: string;
  nextDraft: string;
}

export const TERMINAL_MIN_FONT_SIZE = 11;
export const TERMINAL_MAX_FONT_SIZE = 20;
export const TERMINAL_DEFAULT_FONT_SIZE = 13;

export const TERMINAL_MIN_HEIGHT = 220;
export const TERMINAL_MAX_HEIGHT = 680;
export const TERMINAL_DEFAULT_HEIGHT = 320;
export const TERMINAL_EXPANDED_HEIGHT = 540;

export function clampTerminalFontSize(size: number): number {
  if (!Number.isFinite(size)) return TERMINAL_DEFAULT_FONT_SIZE;
  return Math.min(
    TERMINAL_MAX_FONT_SIZE,
    Math.max(TERMINAL_MIN_FONT_SIZE, Math.round(size))
  );
}

export function clampTerminalHeight(height: number): number {
  if (!Number.isFinite(height)) return TERMINAL_DEFAULT_HEIGHT;
  return Math.min(
    TERMINAL_MAX_HEIGHT,
    Math.max(TERMINAL_MIN_HEIGHT, Math.round(height))
  );
}

export function stripSingleLineComments(
  language: string,
  code: string
): string {
  const lang = language.toLowerCase();
  if (lang === 'python') {
    return code
      .split('\n')
      .map((line) => line.replace(/(^|\s)#.*$/, ''))
      .join('\n');
  }
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');
}

/**
 * Resolves simple f-string/template expressions inside loop prompts,
 * e.g. "Enter item {i+1}: " with i=0 -> "Enter item 1: ".
 */
export function renderInteractivePromptTemplate(
  template: string,
  loopIndexVar: string | undefined,
  iterationIndex: number,
  totalIterations: number,
  capturedVars: Record<string, string>
): string {
  let rendered = template;
  const idxVar = loopIndexVar || 'i';

  rendered = rendered.replace(/\{([^{}]+)\}/g, (full, expr: string) => {
    const clean = expr.trim();
    if (clean === idxVar) return String(iterationIndex);
    if (clean === `${idxVar}+1` || clean === `${idxVar} + 1`) {
      return String(iterationIndex + 1);
    }
    if (clean === 'total' && totalIterations > 0) {
      return String(totalIterations);
    }
    if (clean in capturedVars) {
      return capturedVars[clean];
    }
    return full;
  });

  return rendered;
}

/**
 * Analyzes source code and builds an ordered list of interactive input steps,
 * supporting sequential inputs and loop-driven inputs (Python input()/sys.stdin,
 * C scanf/fgets, C++ cin/getline, Java Scanner).
 */
export function buildInteractiveInputSteps(
  language: string,
  code: string
): InteractiveInputStep[] {
  const lang = language.toLowerCase();
  const clean = stripSingleLineComments(lang, code);
  if (!clean.trim()) return [];

  if (lang === 'python') {
    const lines = clean.split('\n');
    const steps: InteractiveInputStep[] = [];

    let activeLoop: {
      indent: number;
      indexVar: string;
      fixedCount?: number;
      countVar?: string;
    } | null = null;

    for (const rawLine of lines) {
      if (!rawLine.trim()) continue;
      const indent = rawLine.search(/\S/);
      const trimmed = rawLine.trim();

      if (activeLoop && indent <= activeLoop.indent) {
        activeLoop = null;
      }

      // Detect `for i in range(n):` or `for i in range(3):`
      const forRangeMatch = trimmed.match(
        /^for\s+([a-zA-Z_]\w*)\s+in\s+range\s*\(\s*([^,)]+)\s*\)\s*:/
      );
      if (forRangeMatch) {
        const indexVar = forRangeMatch[1];
        const countExpr = forRangeMatch[2].trim();
        const asNum = Number.parseInt(countExpr, 10);
        if (!Number.isNaN(asNum) && String(asNum) === countExpr) {
          activeLoop = {
            indent,
            indexVar,
            fixedCount: Math.max(0, Math.min(25, asNum)),
          };
        } else if (/^[a-zA-Z_]\w*$/.test(countExpr)) {
          activeLoop = {
            indent,
            indexVar,
            countVar: countExpr,
          };
        }
        continue;
      }

      // Detect `input(...)` calls
      const inputMatch = trimmed.match(
        /^(?:([a-zA-Z_]\w*)\s*=\s*)?(?:(?:int|float|str)\s*\(\s*)?input\s*\(\s*(?:f?(["'])(.*?)\2)?\s*\)/
      );
      if (inputMatch) {
        const varName = inputMatch[1];
        const rawPrompt = inputMatch[3] ?? '';
        const defaultLabel = activeLoop
          ? `Input {${activeLoop.indexVar}+1}: `
          : varName
          ? `Enter ${varName}: `
          : `Input #${steps.length + 1}: `;
        const promptText = rawPrompt.length > 0 ? rawPrompt : defaultLabel;

        if (activeLoop) {
          if (activeLoop.fixedCount !== undefined) {
            steps.push({
              kind: 'loop-fixed',
              promptTemplate: promptText,
              varName,
              fixedCount: activeLoop.fixedCount,
              loopIndexVar: activeLoop.indexVar,
            });
          } else if (activeLoop.countVar) {
            steps.push({
              kind: 'loop-var',
              promptTemplate: promptText,
              varName,
              countVar: activeLoop.countVar,
              loopIndexVar: activeLoop.indexVar,
            });
          } else {
            steps.push({
              kind: 'single',
              promptTemplate: promptText,
              varName,
            });
          }
        } else {
          steps.push({
            kind: 'single',
            promptTemplate: promptText,
            varName,
          });
        }
      }
    }

    if (steps.length > 0) return steps;

    // Detect sys.stdin.read() / sys.stdin.readline()
    const usesSysStdin =
      /\bsys\.stdin\.(?:read|readline|readlines)\b/.test(clean) ||
      /\bfor\s+\w+\s+in\s+sys\.stdin\b/.test(clean);
    if (usesSysStdin) {
      if (clean.includes('lines[0]') && clean.includes('lines[1:]')) {
        return [
          {
            kind: 'single',
            promptTemplate: 'Enter count (n): ',
            varName: 'n',
            tokenBased: false,
          },
          {
            kind: 'loop-var',
            promptTemplate: 'Enter value {i+1}/{total} (or space-separated): ',
            countVar: 'n',
            loopIndexVar: 'i',
            tokenBased: true,
          },
        ];
      }
      return [
        {
          kind: 'stream',
          promptTemplate: 'stdin > ',
        },
      ];
    }

    return [];
  }

  // C, C++, Java input detection (supports sequential reads & count-driven for-loops)
  if (lang === 'c' || lang === 'cpp' || lang === 'c++' || lang === 'java') {
    const lines = clean.split('\n');
    const steps: InteractiveInputStep[] = [];
    let lastOutputPrompt: string | null = null;
    let pendingLoop: {
      braceDepthAtStart: number;
      indexVar: string;
      fixedCount?: number;
      countVar?: string;
    } | null = null;
    let braceDepth = 0;

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      const openBraces = (trimmed.match(/\{/g) || []).length;
      const closeBraces = (trimmed.match(/\}/g) || []).length;

      // Capture inline prompt print right before an input call (e.g., printf("Enter n: "); or cout << "Name: ";)
      const printPromptMatch =
        lang === 'c'
          ? trimmed.match(/printf\s*\(\s*"([^"\\]+)"\s*\)/)
          : lang === 'java'
          ? trimmed.match(/System\.out\.print(?:ln)?\s*\(\s*"([^"\\]+)"\s*\)/)
          : trimmed.match(/cout\s*<<\s*"([^"\\]+)"/);
      if (printPromptMatch && !printPromptMatch[1].includes('[')) {
        lastOutputPrompt = printPromptMatch[1];
      }

      // Detect `for (int i = 0; i < n; i++)`
      const forLoopMatch = trimmed.match(
        /for\s*\(\s*(?:int|size_t|long)?\s*([a-zA-Z_]\w*)\s*=\s*0\s*;\s*\1\s*<\s*([a-zA-Z0-9_]+)\s*;/
      );
      if (forLoopMatch) {
        const indexVar = forLoopMatch[1];
        const limitExpr = forLoopMatch[2];
        const asNum = Number.parseInt(limitExpr, 10);
        pendingLoop = {
          braceDepthAtStart: braceDepth,
          indexVar,
          fixedCount:
            !Number.isNaN(asNum) && String(asNum) === limitExpr
              ? Math.max(0, Math.min(25, asNum))
              : undefined,
          countVar:
            Number.isNaN(asNum) && /^[a-zA-Z_]\w*$/.test(limitExpr)
              ? limitExpr
              : undefined,
        };
      }

      // Check for input read on this line
      let matchedVar: string | undefined;
      let isInputCall = false;

      if (lang === 'c') {
        const scanfMatch = trimmed.match(
          /\bscanf\s*\([^,]+,\s*&?([a-zA-Z_]\w*)/
        );
        if (scanfMatch) {
          isInputCall = true;
          matchedVar = scanfMatch[1];
        } else if (/\b(?:fgets|gets|getchar|getline)\s*\(/.test(trimmed)) {
          isInputCall = true;
        }
      } else if (lang === 'cpp' || lang === 'c++') {
        const cinMatch = trimmed.match(/\b(?:std::)?cin\s*>>\s*([a-zA-Z_]\w*)/);
        if (cinMatch) {
          isInputCall = true;
          matchedVar = cinMatch[1];
        } else if (
          /\bgetline\s*\(\s*(?:std::)?cin\s*,\s*([a-zA-Z_]\w*)/.test(trimmed)
        ) {
          isInputCall = true;
          const glMatch = trimmed.match(
            /\bgetline\s*\(\s*(?:std::)?cin\s*,\s*([a-zA-Z_]\w*)/
          );
          matchedVar = glMatch?.[1];
        } else if (/\bscanf\s*\(/.test(trimmed)) {
          isInputCall = true;
        }
      } else if (lang === 'java') {
        const scannerMatch = trimmed.match(
          /(?:(?:int|long|double|float|String)\s+)?([a-zA-Z_]\w*)\s*=[^;]*\.\s*next(?:Int|Line|Double|Long|Float)?\s*\(/
        );
        if (scannerMatch) {
          isInputCall = true;
          matchedVar = scannerMatch[1];
        } else if (
          /\.\s*next(?:Int|Line|Double|Long|Float)?\s*\(/.test(trimmed)
        ) {
          isInputCall = true;
        }
      }

      if (isInputCall) {
        if (pendingLoop) {
          const promptTemplate =
            lastOutputPrompt ||
            `Enter value {${pendingLoop.indexVar}+1}/{total}: `;
          if (pendingLoop.fixedCount !== undefined) {
            steps.push({
              kind: 'loop-fixed',
              promptTemplate,
              varName: matchedVar,
              fixedCount: pendingLoop.fixedCount,
              loopIndexVar: pendingLoop.indexVar,
              tokenBased: true,
            });
          } else if (pendingLoop.countVar) {
            steps.push({
              kind: 'loop-var',
              promptTemplate,
              varName: matchedVar,
              countVar: pendingLoop.countVar,
              loopIndexVar: pendingLoop.indexVar,
              tokenBased: true,
            });
          } else {
            steps.push({
              kind: 'single',
              promptTemplate,
              varName: matchedVar,
              tokenBased: true,
            });
          }
        } else {
          const promptTemplate =
            lastOutputPrompt ||
            (matchedVar ? `Enter ${matchedVar}: ` : `Input #${steps.length + 1}: `);
          steps.push({
            kind: 'single',
            promptTemplate,
            varName: matchedVar,
            tokenBased: true,
          });
        }
        lastOutputPrompt = null;
      }

      braceDepth = Math.max(0, braceDepth + openBraces - closeBraces);
      if (pendingLoop && closeBraces > 0 && braceDepth <= pendingLoop.braceDepthAtStart) {
        pendingLoop = null;
      }
    }

    return steps;
  }

  return [];
}

/**
 * Legacy-compatible helper returning prompt summary for tests and quick checks.
 */
export function detectProgramInputPrompts(
  language: string,
  code: string
): ProgramInputAnalysis {
  const steps = buildInteractiveInputSteps(language, code);
  if (steps.length === 0) {
    return {
      needsInput: false,
      prompts: [],
      usesBulkStdin: false,
      inputKind: 'none',
    };
  }

  const prompts = steps.map((s) => s.promptTemplate.trim());
  const usesBulkStdin = steps.some((s) => s.kind === 'stream' || Boolean(s.tokenBased));
  return {
    needsInput: true,
    prompts,
    usesBulkStdin,
    inputKind: usesBulkStdin ? 'stdin-stream' : 'interactive-prompts',
  };
}

function resolveLoopCount(
  step: InteractiveInputStep,
  capturedVars: Record<string, string>
): number {
  if (step.kind === 'loop-fixed') {
    return Math.max(0, Math.min(25, step.fixedCount ?? 0));
  }
  if (step.kind === 'loop-var' && step.countVar) {
    const raw = capturedVars[step.countVar];
    const parsed = Number.parseInt((raw || '').trim().split(/\s+/)[0] || '', 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return Math.min(25, parsed);
    }
    return 0;
  }
  return 1;
}

function findNextActiveStepState(
  steps: InteractiveInputStep[],
  startStepIndex: number,
  capturedVars: Record<string, string>
): {
  stepIndex: number;
  loopIteration: number;
  loopTotalIterations: number;
  activePrompt: string;
  done: boolean;
} {
  let idx = startStepIndex;
  while (idx < steps.length) {
    const step = steps[idx];
    const total = resolveLoopCount(step, capturedVars);
    if (total <= 0) {
      idx += 1;
      continue;
    }
    const activePrompt = renderInteractivePromptTemplate(
      step.promptTemplate,
      step.loopIndexVar,
      0,
      total,
      capturedVars
    );
    return {
      stepIndex: idx,
      loopIteration: 0,
      loopTotalIterations: total,
      activePrompt,
      done: false,
    };
  }

  return {
    stepIndex: steps.length,
    loopIteration: 0,
    loopTotalIterations: 0,
    activePrompt: '',
    done: true,
  };
}

/**
 * Starts an interactive input session if the code requires user input.
 * Returns null if the code does not read from stdin.
 */
export function createInteractiveRunState(
  language: TerminalLanguageKey,
  code: string
): InteractiveRunState | null {
  const steps = buildInteractiveInputSteps(language, code);
  if (steps.length === 0) return null;

  const initial = findNextActiveStepState(steps, 0, {});
  if (initial.done) return null;

  return {
    steps,
    stepIndex: initial.stepIndex,
    loopIteration: initial.loopIteration,
    loopTotalIterations: initial.loopTotalIterations,
    capturedVars: {},
    collectedInputs: [],
    renderedPrompts: [initial.activePrompt],
    activePrompt: initial.activePrompt,
    done: false,
    codeSnapshot: code,
    languageSnapshot: language,
  };
}

/**
 * Advances the interactive input state machine by one user submission line.
 * Supports multi-prompt sequences, count-driven loops, and space-separated tokens
 * for C/C++/Java/stream inputs.
 */
export function advanceInteractiveRunState(
  state: InteractiveRunState,
  rawSubmission: string
): InteractiveRunState {
  const normalized = rawSubmission.replace(/\r\n/g, '\n');
  const currentStep = state.steps[state.stepIndex];
  const nextCollected = [...state.collectedInputs, normalized];
  const nextVars = { ...state.capturedVars };

  if (currentStep?.varName) {
    nextVars[currentStep.varName] = normalized.trim();
  }

  // If user entered multiple space-separated tokens on a single line for a token-based loop (C/C++/Java)
  const tokenCount = currentStep?.tokenBased
    ? Math.max(1, normalized.trim().split(/\s+/).filter(Boolean).length)
    : 1;

  // Handle single-step where user already typed count AND values on one line (e.g. "3 10 20 30")
  if (
    currentStep?.kind === 'single' &&
    currentStep.tokenBased &&
    currentStep.varName &&
    tokenCount > 1
  ) {
    const tokens = normalized.trim().split(/\s+/).filter(Boolean);
    nextVars[currentStep.varName] = tokens[0];
    const remainingTokens = tokens.length - 1;
    const nextStep = state.steps[state.stepIndex + 1];
    if (
      nextStep &&
      (nextStep.kind === 'loop-var' || nextStep.kind === 'loop-fixed') &&
      nextStep.tokenBased
    ) {
      const nextLoopTotal = resolveLoopCount(nextStep, nextVars);
      if (remainingTokens >= nextLoopTotal) {
        const afterLoop = findNextActiveStepState(
          state.steps,
          state.stepIndex + 2,
          nextVars
        );
        return {
          ...state,
          ...afterLoop,
          capturedVars: nextVars,
          collectedInputs: nextCollected,
          renderedPrompts: afterLoop.done
            ? state.renderedPrompts
            : [...state.renderedPrompts, afterLoop.activePrompt],
        };
      }
      const nextPrompt = renderInteractivePromptTemplate(
        nextStep.promptTemplate,
        nextStep.loopIndexVar,
        remainingTokens,
        nextLoopTotal,
        nextVars
      );
      return {
        ...state,
        stepIndex: state.stepIndex + 1,
        loopIteration: remainingTokens,
        loopTotalIterations: nextLoopTotal,
        capturedVars: nextVars,
        collectedInputs: nextCollected,
        renderedPrompts: [...state.renderedPrompts, nextPrompt],
        activePrompt: nextPrompt,
        done: false,
      };
    }
  }

  // Advance within a loop step if iterations remain
  if (
    currentStep &&
    (currentStep.kind === 'loop-fixed' || currentStep.kind === 'loop-var')
  ) {
    const nextIter = state.loopIteration + tokenCount;
    if (nextIter < state.loopTotalIterations) {
      const nextPrompt = renderInteractivePromptTemplate(
        currentStep.promptTemplate,
        currentStep.loopIndexVar,
        nextIter,
        state.loopTotalIterations,
        nextVars
      );
      return {
        ...state,
        loopIteration: nextIter,
        capturedVars: nextVars,
        collectedInputs: nextCollected,
        renderedPrompts: [...state.renderedPrompts, nextPrompt],
        activePrompt: nextPrompt,
        done: false,
      };
    }
  }

  // Otherwise advance to the next step
  const nextPos = findNextActiveStepState(
    state.steps,
    state.stepIndex + 1,
    nextVars
  );
  return {
    ...state,
    ...nextPos,
    capturedVars: nextVars,
    collectedInputs: nextCollected,
    renderedPrompts: nextPos.done
      ? state.renderedPrompts
      : [...state.renderedPrompts, nextPos.activePrompt],
  };
}

/**
 * Removes duplicated prompt strings printed to stdout when prompts were
 * already echoed interactively in our terminal.
 */
export function stripEchoedPromptsFromStdout(
  stdout: string,
  renderedPrompts: string[]
): string {
  if (!stdout || renderedPrompts.length === 0) return stdout;
  let result = stdout;
  for (const prompt of renderedPrompts) {
    if (!prompt) continue;
    if (result.startsWith(prompt)) {
      result = result.slice(prompt.length);
    } else if (result.startsWith(prompt.trim())) {
      result = result.slice(prompt.trim().length);
    }
  }
  return result.replace(/^\r?\n/, '');
}

/**
 * Parses compiler or runtime stderr output into structured Error Type, exact Line Number,
 * optional Column Number, and clean Error Details for both Editor highlighting and Terminal reporting.
 */
export function parseExecutionError(
  language: string,
  stderr: string
): ParsedCodeError | null {
  const trimmed = (stderr || '').trim();
  if (!trimmed) return null;

  const lang = (language || '').toLowerCase();
  const lines = trimmed.replace(/\r\n/g, '\n').split('\n');

  // 1. Python traceback / syntax errors (Pyodide real Python 3)
  if (lang === 'python' || /File\s+"[^"]+",\s+line\s+\d+/.test(trimmed)) {
    let userFileLine: number | null = null;
    let fallbackLine: number | null = null;
    const fileLineRegex = /File\s+"([^"]+)",\s+line\s+(\d+)/g;
    let m: RegExpExecArray | null;
    // Prefer the deepest frame in the student's code (`main.py` or `<exec>`/`<string>`)
    while ((m = fileLineRegex.exec(trimmed)) !== null) {
      const fileName = m[1];
      const parsed = Number.parseInt(m[2], 10);
      if (!Number.isFinite(parsed)) continue;
      fallbackLine = parsed;
      if (
        fileName === 'main.py' ||
        fileName.endsWith('/main.py') ||
        fileName === '<string>' ||
        fileName === '<exec>'
      ) {
        userFileLine = parsed;
      }
    }
    const lineNumber = userFileLine ?? fallbackLine;

    // Look for standard Python exception line from the bottom up: e.g. `NameError: name 'total' is not defined`
    let errorType = 'RuntimeError';
    let message = lines[lines.length - 1]?.trim() || trimmed;

    for (let i = lines.length - 1; i >= 0; i--) {
      const ln = lines[i].trim();
      const pyExcMatch = ln.match(
        /^([A-Za-z_][A-Za-z0-9_]*(?:Error|Exception|Warning))\s*:\s*(.+)$/
      );
      if (pyExcMatch) {
        errorType = pyExcMatch[1];
        message = pyExcMatch[2].trim();
        break;
      }
      const pyBareExc = ln.match(
        /^([A-Za-z_][A-Za-z0-9_]*(?:Error|Exception))$/
      );
      if (pyBareExc) {
        errorType = pyBareExc[1];
        message = ln;
        break;
      }
    }

    return {
      errorType,
      lineNumber,
      columnNumber: null,
      message,
      rawStderr: trimmed,
    };
  }

  // 2. C / C++ GCC & G++ compiler diagnostics (e.g. `prog.c:8:12: error: expected ';'` or `prog.cc:5:10: error:`)
  if (lang === 'c' || lang === 'cpp' || lang === 'c++') {
    for (const ln of lines) {
      const gccMatch = ln.match(
        /(?:[^\s:]+\/)?[\w.-]+\.(?:c|cpp|cc|cxx|h|hpp):(\d+)(?::(\d+))?:\s*(?:fatal\s+)?error:\s*(.+)$/i
      );
      if (gccMatch) {
        return {
          errorType: 'Compilation Error',
          lineNumber: Number.parseInt(gccMatch[1], 10),
          columnNumber: gccMatch[2] ? Number.parseInt(gccMatch[2], 10) : null,
          message: gccMatch[3].trim(),
          rawStderr: trimmed,
        };
      }
    }

    if (/segmentation fault|sigsegv|sigfpe|floating point|aborted/i.test(trimmed)) {
      return {
        errorType: 'RuntimeError',
        lineNumber: extractFirstLineNumber(trimmed),
        columnNumber: null,
        message: lines[0]?.trim() || trimmed,
        rawStderr: trimmed,
      };
    }

    return {
      errorType: 'Compilation Error',
      lineNumber: extractFirstLineNumber(trimmed),
      columnNumber: null,
      message: lines[0]?.trim() || trimmed,
      rawStderr: trimmed,
    };
  }

  // 3. Java javac compile errors & JVM runtime exceptions
  if (lang === 'java') {
    for (const ln of lines) {
      const javacMatch = ln.match(
        /[\w.-]+\.java:(\d+):\s*error:\s*(.+)$/i
      );
      if (javacMatch) {
        return {
          errorType: 'Compilation Error',
          lineNumber: Number.parseInt(javacMatch[1], 10),
          columnNumber: null,
          message: javacMatch[2].trim(),
          rawStderr: trimmed,
        };
      }
    }

    const jvmExcMatch = trimmed.match(
      /Exception in thread "[^"]+"\s+(?:[\w.]+\.)?([A-Za-z0-9_]+(?:Exception|Error))(?::\s*([^\n]+))?/
    );
    if (jvmExcMatch) {
      const stackLineMatch = trimmed.match(/\(Main\.java:(\d+)\)|\(\w+\.java:(\d+)\)/);
      const lnRaw = stackLineMatch?.[1] || stackLineMatch?.[2];
      return {
        errorType: jvmExcMatch[1],
        lineNumber: lnRaw ? Number.parseInt(lnRaw, 10) : extractFirstLineNumber(trimmed),
        columnNumber: null,
        message: (jvmExcMatch[2] || jvmExcMatch[1]).trim(),
        rawStderr: trimmed,
      };
    }
  }

  // 4. Generic fallback (handles SQLite, JS, or custom errors)
  const genericExc = trimmed.match(
    /\b([A-Za-z_][A-Za-z0-9_]*(?:Error|Exception))\s*:\s*([^\n]+)/
  );
  return {
    errorType: genericExc ? genericExc[1] : 'RuntimeError',
    lineNumber: extractFirstLineNumber(trimmed),
    columnNumber: null,
    message: genericExc ? genericExc[2].trim() : lines[0]?.trim() || trimmed,
    rawStderr: trimmed,
  };
}

function extractFirstLineNumber(text: string): number | null {
  const m =
    text.match(/\bline\s+(\d+)\b/i) ||
    text.match(/[\w.-]+\.(?:c|cpp|cc|java|py|js|ts):(\d+)/i);
  if (!m) return null;
  const parsed = Number.parseInt(m[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Splits a stderr line into safe renderable text segments, highlighting
 * compiler/runtime line references (e.g. `File "main.py", line 12`, `main.c:8:12`,
 * `Main.java:14`, `line 5`) so the UI can emphasize and jump to error lines.
 */
export function parseErrorLineSegments(line: string): ErrorLineSegment[] {
  if (!line) return [{ text: '', isLineRef: false }];

  const lineRefPattern =
    /(File\s+"[^"]+",\s+line\s+(\d+)|\b[\w.-]+\.(?:c|cpp|cc|cxx|h|hpp|java|py|js|ts):(\d+)(?::\d+)?|\bline\s+(\d+)\b)/gi;

  const segments: ErrorLineSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = lineRefPattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: line.slice(lastIndex, match.index),
        isLineRef: false,
      });
    }

    const rawLineNum = match[2] || match[3] || match[4];
    const parsedNum = rawLineNum ? Number.parseInt(rawLineNum, 10) : undefined;

    segments.push({
      text: match[0],
      isLineRef: true,
      lineNumber: Number.isFinite(parsedNum) ? parsedNum : undefined,
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    segments.push({
      text: line.slice(lastIndex),
      isLineRef: false,
    });
  }

  return segments.length > 0 ? segments : [{ text: line, isLineRef: false }];
}

/**
 * Pure Up/Down arrow key history navigator.
 */
export function navigateCommandHistory(
  history: string[],
  currentIndex: number,
  direction: 'up' | 'down',
  currentValue: string,
  savedDraft: string
): HistoryNavigationResult {
  if (history.length === 0) {
    return {
      nextIndex: -1,
      nextValue: currentValue,
      nextDraft: savedDraft,
    };
  }

  if (direction === 'up') {
    if (currentIndex === -1) {
      const idx = history.length - 1;
      return {
        nextIndex: idx,
        nextValue: history[idx],
        nextDraft: currentValue,
      };
    }
    const idx = Math.max(0, currentIndex - 1);
    return {
      nextIndex: idx,
      nextValue: history[idx],
      nextDraft: savedDraft,
    };
  }

  if (currentIndex === -1) {
    return {
      nextIndex: -1,
      nextValue: currentValue,
      nextDraft: savedDraft,
    };
  }

  if (currentIndex >= history.length - 1) {
    return {
      nextIndex: -1,
      nextValue: savedDraft,
      nextDraft: '',
    };
  }

  const idx = currentIndex + 1;
  return {
    nextIndex: idx,
    nextValue: history[idx],
    nextDraft: savedDraft,
  };
}

export function formatTerminalEntriesForCopy(entries: TerminalEntry[]): string {
  return entries
    .map((entry) => {
      if (entry.type === 'error-report' && entry.parsedError) {
        const linePart =
          entry.parsedError.lineNumber !== null
            ? ` | Line ${entry.parsedError.lineNumber}`
            : '';
        return `Error Type: ${entry.parsedError.errorType}${linePart} | ${entry.parsedError.message}`;
      }
      if (entry.type === 'prompt-echo') {
        return `${entry.promptLabel ?? ''}${entry.text}`;
      }
      const prefix = entry.prefix ? `${entry.prefix} ` : '';
      return `${prefix}${entry.text}`;
    })
    .join('\n')
    .trim();
}

export function getTerminalRuntimeLabel(lang: TerminalLanguageKey): string {
  switch (lang) {
    case 'c':
      return 'GCC (C17)';
    case 'cpp':
      return 'G++ (C++20)';
    case 'java':
      return 'OpenJDK';
    case 'python':
      return 'Python 3 (Pyodide)';
    case 'sql':
      return 'SQLite 3 WASM';
    case 'web':
      return 'DOM Sandbox';
  }
}
