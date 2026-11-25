/**
 * Protected Vercel Serverless Execution Proxy for C, C++, and Java via Wandbox.
 *
 * Safeguards:
 * 1. Origin / Referer Lock: Allows only https://edoc-learning-platform.vercel.app,
 *    this project's *.vercel.app preview URLs, and localhost/127.0.0.1 (HTTP 403 otherwise).
 * 2. Strict Language & Payload Limits: Only c, cpp, java; code <= 20 KB; stdin <= 5 KB (HTTP 413).
 * 3. 8-Second AbortController Timeout: Returns HTTP 504/502 with clear busy/timeout message.
 */

const WANDBOX_API_URL = 'https://wandbox.org/api/compile.json';
const WANDBOX_TIMEOUT_MS = 8000;
const MAX_CODE_BYTES = 20 * 1024;
const MAX_STDIN_BYTES = 5 * 1024;
const BUSY_ERROR_MESSAGE =
  'Compiler server is busy or timed out. Please try again in a few seconds.';

type AllowedLanguage = 'c' | 'cpp' | 'java';

const PRIMARY_COMPILER: Record<AllowedLanguage, string> = {
  c: 'gcc-head-c',
  cpp: 'gcc-head',
  java: 'openjdk-head',
};

const FALLBACK_COMPILERS: Record<AllowedLanguage, readonly string[]> = {
  c: [],
  cpp: [],
  java: ['openjdk-jdk-22+36', 'openjdk-jdk-21+35'],
};

// Cache resolved Java compiler if Wandbox aliases shift
let cachedWorkingJavaCompiler: string | null = null;

export interface VercelRequestLike {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface VercelResponseLike {
  status: (code: number) => VercelResponseLike;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
}

function getHeaderValue(
  headers: Record<string, string | string[] | undefined>,
  name: string
): string | null {
  const direct = headers[name] ?? headers[name.toLowerCase()];
  if (typeof direct === 'string') return direct;
  if (Array.isArray(direct) && typeof direct[0] === 'string') return direct[0];
  return null;
}

function checkAllowedOrigin(
  originHeader: string | null,
  refererHeader: string | null
): { allowed: boolean; matchedOrigin: string | null } {
  const candidates = [originHeader, refererHeader].filter(
    (v): v is string => typeof v === 'string' && v.trim().length > 0
  );

  if (candidates.length === 0) {
    return { allowed: false, matchedOrigin: null };
  }

  const envHosts = new Set(
    [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      .map((h) => h.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0])
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

    if (protocol === 'https:' && hostname === 'edoc-learning-platform.vercel.app') {
      return { allowed: true, matchedOrigin: parsed.origin };
    }

    if (
      protocol === 'https:' &&
      hostname.endsWith('.vercel.app') &&
      (/^edoc-learning-platform-[a-z0-9-]+\.vercel\.app$/i.test(hostname) ||
        envHosts.has(hostname))
    ) {
      return { allowed: true, matchedOrigin: parsed.origin };
    }

    if (
      (protocol === 'http:' || protocol === 'https:') &&
      (hostname === 'localhost' || hostname === '127.0.0.1')
    ) {
      return { allowed: true, matchedOrigin: parsed.origin };
    }
  }

  return { allowed: false, matchedOrigin: null };
}

function prepareJavaCode(code: string): string {
  return code.replace(
    /^([ \t]*)public[ \t]+((?:(?:final|abstract)[ \t]+)*class[ \t]+(?!prog\b)[A-Za-z_]\w*)/gm,
    '$1$2'
  );
}

interface WandboxRaw {
  status?: string | number;
  signal?: string;
  compiler_error?: string;
  compiler_message?: string;
  program_output?: string;
  program_error?: string;
}

function normalizeWandbox(raw: WandboxRaw): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
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
    const failedStatus = !Number.isNaN(parsedStatus) && parsedStatus !== 0;
    if (failedStatus || /\berror\b/i.test(compilerMessage)) {
      stderrParts.push(compilerMessage);
    }
  }

  if (programError && !stderrParts.includes(programError)) {
    stderrParts.push(programError);
  }

  if (signal && !stderrParts.some((p) => p.includes(signal))) {
    stderrParts.push(`Process terminated by signal: ${signal}`);
  }

  const stderr = stderrParts.join('\n');
  let exitCode = Number.isNaN(parsedStatus) ? (stderr ? 1 : 0) : parsedStatus;
  if (signal && exitCode === 0) {
    exitCode = 1;
  }

  return { stdout, stderr, exitCode };
}

export default async function handler(
  req: VercelRequestLike,
  res: VercelResponseLike
): Promise<void> {
  const originHeader = getHeaderValue(req.headers, 'origin');
  const refererHeader = getHeaderValue(req.headers, 'referer');
  const originCheck = checkAllowedOrigin(originHeader, refererHeader);

  if (!originCheck.allowed) {
    res.status(403).json({
      error: 'Forbidden: Requests are only allowed from authorized EDOC origins.',
    });
    return;
  }

  if (originHeader && originCheck.matchedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', originCheck.matchedOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    return;
  }

  // Parse body safely if passed as raw JSON string
  let parsedBody: unknown = req.body;
  if (typeof parsedBody === 'string') {
    try {
      parsedBody = JSON.parse(parsedBody);
    } catch {
      res.status(400).json({ error: 'Invalid JSON request payload.' });
      return;
    }
  }

  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    res.status(400).json({
      error: 'Invalid request body. Expected { language, code, stdin }.',
    });
    return;
  }

  const body = parsedBody as Record<string, unknown>;
  const language =
    typeof body.language === 'string' ? body.language.trim().toLowerCase() : '';

  if (language !== 'c' && language !== 'cpp' && language !== 'java') {
    res.status(400).json({
      error: `Unsupported language "${language || 'unknown'}". Allowed languages: c, cpp, java.`,
    });
    return;
  }

  if (typeof body.code !== 'string' || body.code.trim().length === 0) {
    res.status(400).json({ error: 'Source code cannot be empty.' });
    return;
  }

  const codeBytes = Buffer.byteLength(body.code, 'utf8');
  if (codeBytes > MAX_CODE_BYTES) {
    res.status(413).json({
      error: `Code payload exceeds the 20 KB limit (${Math.ceil(codeBytes / 1024)} KB submitted).`,
    });
    return;
  }

  const stdinRaw =
    body.stdin === undefined || body.stdin === null ? '' : body.stdin;
  if (typeof stdinRaw !== 'string') {
    res.status(400).json({ error: 'Invalid stdin value. Expected a string.' });
    return;
  }

  const stdinBytes = Buffer.byteLength(stdinRaw, 'utf8');
  if (stdinBytes > MAX_STDIN_BYTES) {
    res.status(413).json({
      error: `Standard input (stdin) exceeds the 5 KB limit (${Math.ceil(stdinBytes / 1024)} KB submitted).`,
    });
    return;
  }

  const preparedCode =
    language === 'java' ? prepareJavaCode(body.code) : body.code;

  const compilerCandidates: string[] =
    language === 'java' && cachedWorkingJavaCompiler
      ? [
          cachedWorkingJavaCompiler,
          PRIMARY_COMPILER.java,
          ...FALLBACK_COMPILERS.java.filter((c) => c !== cachedWorkingJavaCompiler),
        ]
      : [PRIMARY_COMPILER[language], ...FALLBACK_COMPILERS[language]];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WANDBOX_TIMEOUT_MS);

  try {
    let lastStatus = 502;

    for (let i = 0; i < compilerCandidates.length; i++) {
      const compiler = compilerCandidates[i];
      const upstream = await fetch(WANDBOX_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          compiler,
          code: preparedCode,
          stdin: stdinRaw,
        }),
        signal: controller.signal,
      });

      if (upstream.ok) {
        const rawData = (await upstream.json()) as WandboxRaw;
        if (language === 'java') {
          cachedWorkingJavaCompiler = compiler;
        }
        const normalized = normalizeWandbox(rawData);
        res.status(200).json({
          ...normalized,
          compiler,
          engine: 'Wandbox (Real Compiler)',
        });
        return;
      }

      lastStatus = upstream.status;
      const errText = await upstream.text().catch(() => '');
      const isUnknownCompiler =
        upstream.status >= 400 && /unknown compiler/i.test(errText);

      if (isUnknownCompiler && i < compilerCandidates.length - 1) {
        continue;
      }

      break;
    }

    res.status(lastStatus === 504 ? 504 : 502).json({
      error: BUSY_ERROR_MESSAGE,
    });
  } catch (err: unknown) {
    const isAbort =
      err instanceof Error &&
      (err.name === 'AbortError' || /aborted|timeout/i.test(err.message));

    res.status(isAbort ? 504 : 502).json({
      error: BUSY_ERROR_MESSAGE,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
