import {
  GoogleGenAI,
  ThinkingLevel,
  type ContentListUnion,
} from '@google/genai';

export const PRIMARY_SERVER_GEMINI_MODEL = 'gemini-4-hydrogen';
export const FALLBACK_SERVER_GEMINI_MODEL = 'gemini-3.1-flash-lite';

const MAX_STRING_CONTENT_CHARS = 32_000;
const MAX_TURN_COUNT = 30;
const MAX_TOTAL_TURNS_CHARS = 48_000;
const MAX_SYSTEM_INSTRUCTION_CHARS = 6_000;
const REQUEST_TIMEOUT_MS = 25_000;

export interface ServerGeminiContentPart {
  text: string;
}

export interface ServerGeminiTurn {
  role: 'user' | 'model';
  parts: ServerGeminiContentPart[];
}

export interface ValidatedGeminiRequest {
  contents: string | ServerGeminiTurn[];
  systemInstruction?: string;
  responseMimeType?: 'application/json' | 'text/plain';
}

export type ValidationResult =
  | { ok: true; data: ValidatedGeminiRequest }
  | { ok: false; error: string };

export class ServerGeminiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ServerGeminiError';
    this.status = status;
    this.code = code;
  }
}

let cachedDefaultClient: GoogleGenAI | null = null;
let cachedDefaultKey = '';
const unavailableModels = new Set<string>();

function getServerEnvApiKey(): string {
  return (process.env.GEMINI_API_KEY || '').trim();
}

export function isServerGeminiConfigured(): boolean {
  return getServerEnvApiKey().length > 0;
}

/**
 * Shared server-side Gemini client initializer.
 * Sets User-Agent: 'aistudio-build' in httpOptions as required.
 */
export function getServerGeminiClient(overrideApiKey?: string): {
  ai: GoogleGenAI;
  usingUserKey: boolean;
} {
  const customKey = (overrideApiKey || '').trim();
  if (customKey) {
    return {
      ai: new GoogleGenAI({
        apiKey: customKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      }),
      usingUserKey: true,
    };
  }

  const envKey = getServerEnvApiKey();
  if (!envKey) {
    throw new ServerGeminiError(
      503,
      'NO_API_KEY',
      'Server Gemini API key is not configured yet. Add GEMINI_API_KEY in Settings > Secrets, or configure an optional personal key in API Key Settings.'
    );
  }

  if (!cachedDefaultClient || cachedDefaultKey !== envKey) {
    cachedDefaultKey = envKey;
    cachedDefaultClient = new GoogleGenAI({
      apiKey: envKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return { ai: cachedDefaultClient, usingUserKey: false };
}

/**
 * Strictly validates and sanitizes untrusted client payloads before forwarding to @google/genai.
 */
export function validateGeminiGeneratePayload(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }

  const record = body as Record<string, unknown>;
  const rawContents = record.contents;

  let validatedContents: string | ServerGeminiTurn[];

  if (typeof rawContents === 'string') {
    const trimmed = rawContents.trim();
    if (!trimmed) {
      return { ok: false, error: 'Prompt contents cannot be empty.' };
    }
    if (trimmed.length > MAX_STRING_CONTENT_CHARS) {
      return {
        ok: false,
        error: `Prompt exceeds maximum length of ${MAX_STRING_CONTENT_CHARS} characters.`,
      };
    }
    validatedContents = trimmed;
  } else if (Array.isArray(rawContents)) {
    if (rawContents.length === 0) {
      return { ok: false, error: 'Conversation contents array cannot be empty.' };
    }
    if (rawContents.length > MAX_TURN_COUNT) {
      return {
        ok: false,
        error: `Conversation history exceeds maximum of ${MAX_TURN_COUNT} turns.`,
      };
    }

    const turns: ServerGeminiTurn[] = [];
    let totalChars = 0;

    for (const item of rawContents) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return { ok: false, error: 'Each conversation turn must be an object.' };
      }
      const turnObj = item as Record<string, unknown>;
      const role = turnObj.role === 'model' || turnObj.role === 'assistant'
        ? 'model'
        : turnObj.role === 'user'
        ? 'user'
        : null;

      if (!role) {
        return {
          ok: false,
          error: 'Each conversation turn must specify role "user" or "model".',
        };
      }

      const rawParts = turnObj.parts;
      if (!Array.isArray(rawParts) || rawParts.length === 0) {
        return {
          ok: false,
          error: 'Each conversation turn must include a non-empty parts array.',
        };
      }

      const cleanParts: ServerGeminiContentPart[] = [];
      for (const part of rawParts) {
        if (
          !part ||
          typeof part !== 'object' ||
          typeof (part as Record<string, unknown>).text !== 'string'
        ) {
          return {
            ok: false,
            error: 'Each message part must contain a string text property.',
          };
        }
        const text = ((part as Record<string, unknown>).text as string).trim();
        if (text) {
          totalChars += text.length;
          if (totalChars > MAX_TOTAL_TURNS_CHARS) {
            return {
              ok: false,
              error: `Total conversation size exceeds ${MAX_TOTAL_TURNS_CHARS} characters.`,
            };
          }
          cleanParts.push({ text });
        }
      }

      if (cleanParts.length > 0) {
        turns.push({ role, parts: cleanParts });
      }
    }

    if (turns.length === 0) {
      return { ok: false, error: 'Conversation contains no non-empty messages.' };
    }
    validatedContents = turns;
  } else {
    return {
      ok: false,
      error: 'Field "contents" must be a non-empty string or array of conversation turns.',
    };
  }

  let systemInstruction: string | undefined;
  if (record.systemInstruction !== undefined && record.systemInstruction !== null) {
    if (typeof record.systemInstruction !== 'string') {
      return { ok: false, error: 'Field "systemInstruction" must be a string.' };
    }
    const trimmedSys = record.systemInstruction.trim();
    if (trimmedSys.length > MAX_SYSTEM_INSTRUCTION_CHARS) {
      return {
        ok: false,
        error: `Field "systemInstruction" exceeds ${MAX_SYSTEM_INSTRUCTION_CHARS} characters.`,
      };
    }
    if (trimmedSys.length > 0) {
      systemInstruction = trimmedSys;
    }
  }

  let responseMimeType: 'application/json' | 'text/plain' | undefined;
  if (record.responseMimeType !== undefined && record.responseMimeType !== null) {
    if (
      record.responseMimeType !== 'application/json' &&
      record.responseMimeType !== 'text/plain'
    ) {
      return {
        ok: false,
        error: 'Field "responseMimeType" must be "application/json" or "text/plain".',
      };
    }
    responseMimeType = record.responseMimeType;
  }

  return {
    ok: true,
    data: {
      contents: validatedContents,
      systemInstruction,
      responseMimeType,
    },
  };
}

function extractUpstreamErrorDetails(err: unknown): {
  status: number;
  code: string;
  message: string;
} {
  const rawStatus =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: number }).status)
      : 0;
  const rawMessage =
    err instanceof Error ? err.message : String(err ?? 'Unknown Gemini API error');

  let cleanMessage = rawMessage;
  let parsedCode = '';
  let parsedStatus = rawStatus;

  try {
    const parsed = JSON.parse(rawMessage);
    if (parsed?.error) {
      if (typeof parsed.error.message === 'string') {
        cleanMessage = parsed.error.message;
      }
      if (typeof parsed.error.status === 'string') {
        parsedCode = parsed.error.status;
      }
      if (!parsedStatus && typeof parsed.error.code === 'number') {
        parsedStatus = parsed.error.code;
      }
    }
  } catch {
    // Message is already plain text
  }

  const upper = `${parsedCode} ${cleanMessage}`.toUpperCase();

  if (
    parsedStatus === 401 ||
    parsedStatus === 403 ||
    upper.includes('API_KEY_INVALID') ||
    upper.includes('API KEY NOT VALID') ||
    upper.includes('PERMISSION_DENIED') ||
    upper.includes('UNAUTHENTICATED')
  ) {
    return {
      status: parsedStatus === 401 || parsedStatus === 403 ? parsedStatus : 403,
      code: 'INVALID_KEY',
      message: cleanMessage,
    };
  }

  if (
    parsedStatus === 429 ||
    upper.includes('RESOURCE_EXHAUSTED') ||
    upper.includes('QUOTA') ||
    upper.includes('RATE LIMIT')
  ) {
    return {
      status: 429,
      code: 'RATE_LIMITED',
      message: cleanMessage,
    };
  }

  if (parsedStatus === 404 || upper.includes('NOT_FOUND')) {
    return {
      status: 404,
      code: 'MODEL_NOT_FOUND',
      message: cleanMessage,
    };
  }

  if (
    err instanceof Error &&
    (err.name === 'AbortError' || upper.includes('ABORT'))
  ) {
    return {
      status: 504,
      code: 'TIMEOUT',
      message: 'The Gemini request timed out on the server. Please try again.',
    };
  }

  return {
    status: parsedStatus >= 400 && parsedStatus < 600 ? parsedStatus : 502,
    code: parsedCode || 'API_ERROR',
    message: cleanMessage || 'Gemini API request failed.',
  };
}

interface CandidateModelSpec {
  model: string;
  thinkingLevel?: ThinkingLevel;
}

const CANDIDATE_MODELS: CandidateModelSpec[] = [
  { model: PRIMARY_SERVER_GEMINI_MODEL, thinkingLevel: ThinkingLevel.LOW },
  { model: FALLBACK_SERVER_GEMINI_MODEL },
];

export async function generateServerGeminiContent(
  request: ValidatedGeminiRequest,
  overrideApiKey?: string
): Promise<{ text: string; model: string }> {
  const { ai } = getServerGeminiClient(overrideApiKey);

  const modelsToTry = CANDIDATE_MODELS.filter(
    (spec) => !unavailableModels.has(spec.model)
  );
  const candidates = modelsToTry.length > 0 ? modelsToTry : CANDIDATE_MODELS;

  let lastError: ServerGeminiError | null = null;

  for (const spec of candidates) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const config: {
        systemInstruction?: string;
        responseMimeType?: string;
        thinkingConfig?: { thinkingLevel: ThinkingLevel };
        abortSignal: AbortSignal;
      } = {
        abortSignal: controller.signal,
      };

      if (request.systemInstruction) {
        config.systemInstruction = request.systemInstruction;
      }
      if (request.responseMimeType) {
        config.responseMimeType = request.responseMimeType;
      }
      if (spec.thinkingLevel) {
        config.thinkingConfig = { thinkingLevel: spec.thinkingLevel };
      }

      const response = await ai.models.generateContent({
        model: spec.model,
        contents: request.contents as ContentListUnion,
        config,
      });

      const text =
        response.text?.trim() ||
        response.candidates?.[0]?.content?.parts
          ?.map((p) => (typeof p.text === 'string' ? p.text : ''))
          .join('')
          .trim() ||
        '';

      if (!text) {
        throw new ServerGeminiError(
          502,
          'EMPTY_RESPONSE',
          'Gemini returned an empty response for this prompt. Please rephrase or try again.'
        );
      }

      return { text, model: spec.model };
    } catch (err: unknown) {
      if (err instanceof ServerGeminiError) {
        throw err;
      }

      const details = extractUpstreamErrorDetails(err);
      lastError = new ServerGeminiError(
        details.status,
        details.code,
        details.message
      );

      if (details.status === 404) {
        unavailableModels.add(spec.model);
        continue;
      }

      // Immediately propagate auth/quota/client errors instead of retrying another model
      if (
        details.status === 400 ||
        details.status === 401 ||
        details.status === 403 ||
        details.status === 429
      ) {
        throw lastError;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw (
    lastError ||
    new ServerGeminiError(
      502,
      'API_ERROR',
      'Unable to complete the Gemini request. Please try again.'
    )
  );
}
