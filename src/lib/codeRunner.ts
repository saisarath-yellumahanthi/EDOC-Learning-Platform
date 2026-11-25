/**
 * Real frontend code execution client (zero fake simulators, zero mock parsers).
 * - Python -> Pyodide in-browser WebAssembly Python 3 runtime
 * - C, C++, Java -> Protected POST /api/execute proxy (with 404-only fallback to Wandbox
 *   direct for static preview environments where Vercel serverless functions do not run)
 */

import {
  CompiledExecutionLanguage,
  MAX_CODE_BYTES,
  MAX_STDIN_BYTES,
  WANDBOX_API_URL,
  WANDBOX_BUSY_MESSAGE,
  WANDBOX_ENGINE_LABEL,
  WANDBOX_FALLBACK_COMPILERS,
  WANDBOX_PRIMARY_COMPILER,
  WANDBOX_TIMEOUT_MS,
  WandboxRawResponse,
  getUtf8ByteLength,
  normalizeWandboxResponse,
  prepareJavaSourceForWandbox,
} from '../utils/codeExecutionHelpers';
import {
  PYODIDE_ENGINE_LABEL,
  PyodideRunResult,
  runPythonWithPyodide,
} from './pyodideRunner';

export interface CompiledRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  engineLabel: string;
}

let cachedDirectJavaCompiler: string | null = null;

async function callWandboxDirectly(params: {
  language: CompiledExecutionLanguage;
  code: string;
  stdin: string;
  startTime: number;
}): Promise<CompiledRunResult> {
  const preparedCode =
    params.language === 'java'
      ? prepareJavaSourceForWandbox(params.code)
      : params.code;

  const compilerCandidates: string[] =
    params.language === 'java' && cachedDirectJavaCompiler
      ? [
          cachedDirectJavaCompiler,
          WANDBOX_PRIMARY_COMPILER.java,
          ...WANDBOX_FALLBACK_COMPILERS.java.filter(
            (c) => c !== cachedDirectJavaCompiler
          ),
        ]
      : [
          WANDBOX_PRIMARY_COMPILER[params.language],
          ...WANDBOX_FALLBACK_COMPILERS[params.language],
        ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WANDBOX_TIMEOUT_MS);

  try {
    for (let i = 0; i < compilerCandidates.length; i++) {
      const compiler = compilerCandidates[i];
      const response = await fetch(WANDBOX_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          compiler,
          code: preparedCode,
          stdin: params.stdin,
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        const rawData = (await response.json()) as WandboxRawResponse;
        if (params.language === 'java') {
          cachedDirectJavaCompiler = compiler;
        }
        const normalized = normalizeWandboxResponse(rawData);
        return {
          ...normalized,
          executionTimeMs: Math.max(1, Math.round(performance.now() - params.startTime)),
          engineLabel: WANDBOX_ENGINE_LABEL,
        };
      }

      const errText = await response.text().catch(() => '');
      const isUnknownCompiler =
        response.status >= 400 && /unknown compiler/i.test(errText);
      if (isUnknownCompiler && i < compilerCandidates.length - 1) {
        continue;
      }

      return {
        stdout: '',
        stderr: WANDBOX_BUSY_MESSAGE,
        exitCode: 1,
        executionTimeMs: Math.max(1, Math.round(performance.now() - params.startTime)),
        engineLabel: WANDBOX_ENGINE_LABEL,
      };
    }

    return {
      stdout: '',
      stderr: WANDBOX_BUSY_MESSAGE,
      exitCode: 1,
      executionTimeMs: Math.max(1, Math.round(performance.now() - params.startTime)),
      engineLabel: WANDBOX_ENGINE_LABEL,
    };
  } catch {
    return {
      stdout: '',
      stderr: WANDBOX_BUSY_MESSAGE,
      exitCode: 1,
      executionTimeMs: Math.max(1, Math.round(performance.now() - params.startTime)),
      engineLabel: WANDBOX_ENGINE_LABEL,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Executes C, C++, or Java via POST /api/execute (Vercel serverless proxy).
 * Falls back to calling Wandbox directly ONLY when /api/execute returns HTTP 404
 * (e.g., static preview environments where serverless functions are not deployed).
 * Never falls back to any simulated/mock output.
 */
export async function executeCompiledCode(params: {
  language: CompiledExecutionLanguage;
  code: string;
  stdin?: string;
}): Promise<CompiledRunResult> {
  const startTime = performance.now();
  const stdin = params.stdin ?? '';

  if (!params.code.trim()) {
    return {
      stdout: '',
      stderr: 'Compilation Error: Source code buffer is empty.',
      exitCode: 1,
      executionTimeMs: 1,
      engineLabel: WANDBOX_ENGINE_LABEL,
    };
  }

  const codeBytes = getUtf8ByteLength(params.code);
  if (codeBytes > MAX_CODE_BYTES) {
    return {
      stdout: '',
      stderr: `Payload Too Large: Code exceeds the 20 KB limit (${Math.ceil(codeBytes / 1024)} KB).`,
      exitCode: 1,
      executionTimeMs: 1,
      engineLabel: WANDBOX_ENGINE_LABEL,
    };
  }

  const stdinBytes = getUtf8ByteLength(stdin);
  if (stdinBytes > MAX_STDIN_BYTES) {
    return {
      stdout: '',
      stderr: `Payload Too Large: Standard input exceeds the 5 KB limit (${Math.ceil(stdinBytes / 1024)} KB).`,
      exitCode: 1,
      executionTimeMs: 1,
      engineLabel: WANDBOX_ENGINE_LABEL,
    };
  }

  // In non-browser environments (e.g., server/test), call Wandbox directly
  if (typeof window === 'undefined') {
    return callWandboxDirectly({
      language: params.language,
      code: params.code,
      stdin,
      startTime,
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WANDBOX_TIMEOUT_MS + 1000);

  try {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        language: params.language,
        code: params.code,
        stdin,
      }),
      signal: controller.signal,
    });

    // Fallback to direct Wandbox ONLY if /api/execute does not exist (404 in static preview)
    if (response.status === 404) {
      clearTimeout(timeoutId);
      return callWandboxDirectly({
        language: params.language,
        code: params.code,
        stdin,
        startTime,
      });
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.toLowerCase().includes('application/json');

    // Some static hosts serve index.html (200 HTML) for missing /api routes
    if (!isJson && response.status === 200) {
      clearTimeout(timeoutId);
      return callWandboxDirectly({
        language: params.language,
        code: params.code,
        stdin,
        startTime,
      });
    }

    const data = isJson ? ((await response.json()) as Record<string, unknown>) : null;

    if (!response.ok) {
      const serverErr =
        data && typeof data.error === 'string'
          ? data.error
          : WANDBOX_BUSY_MESSAGE;
      return {
        stdout: '',
        stderr: serverErr,
        exitCode: 1,
        executionTimeMs: Math.max(1, Math.round(performance.now() - startTime)),
        engineLabel: WANDBOX_ENGINE_LABEL,
      };
    }

    return {
      stdout: typeof data?.stdout === 'string' ? data.stdout : '',
      stderr: typeof data?.stderr === 'string' ? data.stderr : '',
      exitCode: typeof data?.exitCode === 'number' ? data.exitCode : 0,
      executionTimeMs: Math.max(1, Math.round(performance.now() - startTime)),
      engineLabel: WANDBOX_ENGINE_LABEL,
    };
  } catch (err: unknown) {
    const isAbort =
      err instanceof Error &&
      (err.name === 'AbortError' || /aborted|timeout/i.test(err.message));

    return {
      stdout: '',
      stderr: isAbort
        ? WANDBOX_BUSY_MESSAGE
        : err instanceof Error
        ? err.message
        : WANDBOX_BUSY_MESSAGE,
      exitCode: 1,
      executionTimeMs: Math.max(1, Math.round(performance.now() - startTime)),
      engineLabel: WANDBOX_ENGINE_LABEL,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Convenience helper for non-interactive real execution (e.g. DSA Problem Test Runner).
 * Never uses any fake/mock simulator.
 */
export async function executeRealCodeNonInteractive(params: {
  language: string;
  code: string;
  stdin?: string;
  onLoadingPython?: () => void;
}): Promise<CompiledRunResult> {
  const lang = params.language.trim().toLowerCase();
  const stdin = params.stdin ?? '';

  if (lang === 'python' || lang === 'py') {
    const inputQueue = stdin
      ? stdin.replace(/\r\n/g, '\n').split('\n')
      : [];
    const pyRes: PyodideRunResult = await runPythonWithPyodide({
      code: params.code,
      inputQueue,
      onLoadingRuntime: params.onLoadingPython,
    });
    return {
      stdout: pyRes.fullStdout,
      stderr:
        pyRes.status === 'awaiting_input'
          ? 'EOFError: EOF when reading a line (program expected more input).'
          : pyRes.stderr,
      exitCode: pyRes.status === 'awaiting_input' ? 1 : pyRes.exitCode,
      executionTimeMs: pyRes.executionTimeMs,
      engineLabel: PYODIDE_ENGINE_LABEL,
    };
  }

  if (lang === 'c' || lang === 'cpp' || lang === 'c++' || lang === 'java') {
    const normalizedLang: CompiledExecutionLanguage =
      lang === 'c++' ? 'cpp' : (lang as CompiledExecutionLanguage);
    return executeCompiledCode({
      language: normalizedLang,
      code: params.code,
      stdin,
    });
  }

  if (lang === 'javascript' || lang === 'js') {
    // Real Node.js execution via Wandbox nodejs-20.17.0 (no fake regex parser)
    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WANDBOX_TIMEOUT_MS);
    try {
      const response = await fetch(WANDBOX_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          compiler: 'nodejs-20.17.0',
          code: params.code,
          stdin,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        return {
          stdout: '',
          stderr: WANDBOX_BUSY_MESSAGE,
          exitCode: 1,
          executionTimeMs: Math.max(1, Math.round(performance.now() - startTime)),
          engineLabel: WANDBOX_ENGINE_LABEL,
        };
      }
      const rawData = (await response.json()) as WandboxRawResponse;
      const normalized = normalizeWandboxResponse(rawData);
      return {
        ...normalized,
        executionTimeMs: Math.max(1, Math.round(performance.now() - startTime)),
        engineLabel: WANDBOX_ENGINE_LABEL,
      };
    } catch {
      return {
        stdout: '',
        stderr: WANDBOX_BUSY_MESSAGE,
        exitCode: 1,
        executionTimeMs: Math.max(1, Math.round(performance.now() - startTime)),
        engineLabel: WANDBOX_ENGINE_LABEL,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    stdout: '',
    stderr: `Unsupported execution language: ${params.language}`,
    exitCode: 1,
    executionTimeMs: 1,
    engineLabel: WANDBOX_ENGINE_LABEL,
  };
}
