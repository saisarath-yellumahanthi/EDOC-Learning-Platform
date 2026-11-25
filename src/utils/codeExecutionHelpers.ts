/**
 * Pure, runtime-agnostic helpers for real code execution via Pyodide & Wandbox.
 * Shared across frontend code runners, Vercel serverless proxy, and unit tests.
 */

export type CompiledExecutionLanguage = 'c' | 'cpp' | 'java';

export const ALLOWED_COMPILED_LANGUAGES: readonly CompiledExecutionLanguage[] = [
  'c',
  'cpp',
  'java',
] as const;

export const MAX_CODE_BYTES = 20 * 1024; // 20 KB
export const MAX_STDIN_BYTES = 5 * 1024; // 5 KB
export const WANDBOX_TIMEOUT_MS = 8000; // 8 seconds
export const RUN_COOLDOWN_MS = 2500; // 2.5 seconds

export const WANDBOX_API_URL = 'https://wandbox.org/api/compile.json';
export const WANDBOX_BUSY_MESSAGE =
  'Compiler server is busy or timed out. Please try again in a few seconds.';
export const WANDBOX_ENGINE_LABEL = 'Wandbox (Real Compiler)';

export const WANDBOX_PRIMARY_COMPILER: Record<CompiledExecutionLanguage, string> = {
  c: 'gcc-head-c',
  cpp: 'gcc-head',
  java: 'openjdk-head',
};

/**
 * Fallback OpenJDK compiler identifiers if Wandbox's `openjdk-head` alias
 * returns "Unknown compiler" on their server.
 */
export const WANDBOX_FALLBACK_COMPILERS: Record<
  CompiledExecutionLanguage,
  readonly string[]
> = {
  c: [],
  cpp: [],
  java: ['openjdk-jdk-22+36', 'openjdk-jdk-21+35'],
};

export interface ExecutePayloadValidationResult {
  ok: boolean;
  status: number;
  error?: string;
  data?: {
    language: CompiledExecutionLanguage;
    code: string;
    stdin: string;
  };
}

export interface NormalizedExecutionOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface WandboxRawResponse {
  status?: string | number;
  signal?: string;
  compiler_output?: string;
  compiler_error?: string;
  compiler_message?: string;
  program_output?: string;
  program_error?: string;
  program_message?: string;
}

export function getUtf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/**
 * Validates Origin or Referer against the strict production/preview/localhost allowlist.
 */
export function isAllowedExecuteOrigin(
  originHeader?: string | null,
  refererHeader?: string | null,
  vercelEnvHosts: string[] = []
): { allowed: boolean; matchedOrigin: string | null } {
  const candidates = [originHeader, refererHeader].filter(
    (val): val is string => typeof val === 'string' && val.trim().length > 0
  );

  if (candidates.length === 0) {
    return { allowed: false, matchedOrigin: null };
  }

  const normalizedEnvHosts = new Set(
    vercelEnvHosts
      .map((h) => h.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0])
      .filter(Boolean)
  );

  for (const raw of candidates) {
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      continue;
    }

    const protocol = parsed.protocol.toLowerCase();
    const hostname = parsed.hostname.toLowerCase();

    // Production domain
    if (protocol === 'https:' && hostname === 'edoc-learning-platform.vercel.app') {
      return { allowed: true, matchedOrigin: parsed.origin };
    }

    // This project's Vercel preview URLs
    if (
      protocol === 'https:' &&
      hostname.endsWith('.vercel.app') &&
      (/^edoc-learning-platform-[a-z0-9-]+\.vercel\.app$/i.test(hostname) ||
        normalizedEnvHosts.has(hostname))
    ) {
      return { allowed: true, matchedOrigin: parsed.origin };
    }

    // Local development (localhost / 127.0.0.1 on any port)
    if (
      (protocol === 'http:' || protocol === 'https:') &&
      (hostname === 'localhost' || hostname === '127.0.0.1')
    ) {
      return { allowed: true, matchedOrigin: parsed.origin };
    }
  }

  return { allowed: false, matchedOrigin: null };
}

/**
 * Validates POST /api/execute body:
 * - Only `c`, `cpp`, and `java` allowed (400 otherwise)
 * - `code` <= 20 KB UTF-8, `stdin` <= 5 KB UTF-8 (413 otherwise)
 */
export function validateExecutePayload(
  rawBody: unknown
): ExecutePayloadValidationResult {
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    return {
      ok: false,
      status: 400,
      error: 'Invalid JSON request body. Expected { language, code, stdin }.',
    };
  }

  const body = rawBody as Record<string, unknown>;
  const rawLang =
    typeof body.language === 'string' ? body.language.trim().toLowerCase() : '';

  if (
    !ALLOWED_COMPILED_LANGUAGES.includes(rawLang as CompiledExecutionLanguage)
  ) {
    return {
      ok: false,
      status: 400,
      error: `Unsupported language "${rawLang || 'unknown'}". Allowed languages: c, cpp, java.`,
    };
  }

  if (typeof body.code !== 'string' || body.code.trim().length === 0) {
    return {
      ok: false,
      status: 400,
      error: 'Source code cannot be empty.',
    };
  }

  const codeBytes = getUtf8ByteLength(body.code);
  if (codeBytes > MAX_CODE_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `Code payload exceeds the 20 KB limit (${Math.ceil(codeBytes / 1024)} KB submitted). Please shorten your source code.`,
    };
  }

  const stdinValue =
    body.stdin === undefined || body.stdin === null ? '' : body.stdin;
  if (typeof stdinValue !== 'string') {
    return {
      ok: false,
      status: 400,
      error: 'Invalid stdin format. Expected a string.',
    };
  }

  const stdinBytes = getUtf8ByteLength(stdinValue);
  if (stdinBytes > MAX_STDIN_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `Standard input (stdin) exceeds the 5 KB limit (${Math.ceil(stdinBytes / 1024)} KB submitted).`,
    };
  }

  return {
    ok: true,
    status: 200,
    data: {
      language: rawLang as CompiledExecutionLanguage,
      code: body.code,
      stdin: stdinValue,
    },
  };
}

/**
 * Wandbox saves Java source as `prog.java`.
 * Declaring `public class Main` (or any top-level `public class <Name>` other than `prog`)
 * causes `javac` to reject the file with a filename mismatch error.
 * Removing the `public` modifier on top-level non-`prog` classes preserves every exact line
 * number while allowing `class Main` (or any class containing `main`) to compile and run cleanly.
 */
export function prepareJavaSourceForWandbox(code: string): string {
  return code.replace(
    /^([ \t]*)public[ \t]+((?:(?:final|abstract)[ \t]+)*class[ \t]+(?!prog\b)[A-Za-z_]\w*)/gm,
    '$1$2'
  );
}

/**
 * Normalizes a Wandbox JSON response into `{ stdout, stderr, exitCode }`.
 */
export function normalizeWandboxResponse(
  raw: WandboxRawResponse | null | undefined
): NormalizedExecutionOutput {
  if (!raw || typeof raw !== 'object') {
    return {
      stdout: '',
      stderr: WANDBOX_BUSY_MESSAGE,
      exitCode: 1,
    };
  }

  const stdout = typeof raw.program_output === 'string' ? raw.program_output : '';
  const compilerError =
    typeof raw.compiler_error === 'string' ? raw.compiler_error.trim() : '';
  const compilerMessage =
    typeof raw.compiler_message === 'string' ? raw.compiler_message.trim() : '';
  const programError =
    typeof raw.program_error === 'string' ? raw.program_error.trim() : '';
  const signal = typeof raw.signal === 'string' ? raw.signal.trim() : '';

  const parsedStatus =
    raw.status !== undefined && raw.status !== ''
      ? Number.parseInt(String(raw.status), 10)
      : NaN;

  const stderrParts: string[] = [];
  if (compilerError) {
    stderrParts.push(compilerError);
  } else if (compilerMessage) {
    // Only include compiler_message if it wasn't already covered by compiler_error
    // and either compilation failed or it contains actual diagnostics.
    const failedStatus = !Number.isNaN(parsedStatus) && parsedStatus !== 0;
    if (failedStatus || /\berror\b/i.test(compilerMessage)) {
      stderrParts.push(compilerMessage);
    }
  }

  if (programError && !stderrParts.includes(programError)) {
    stderrParts.push(programError);
  }

  if (signal) {
    const signalMsg = `Process terminated by signal: ${signal}`;
    if (!stderrParts.some((part) => part.includes(signal))) {
      stderrParts.push(signalMsg);
    }
  }

  const stderr = stderrParts.join('\n');
  let exitCode = Number.isNaN(parsedStatus) ? (stderr ? 1 : 0) : parsedStatus;
  if (signal && exitCode === 0) {
    exitCode = 1;
  }

  return {
    stdout,
    stderr,
    exitCode,
  };
}
