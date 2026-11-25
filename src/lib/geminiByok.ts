import {
  EDOC_GEMINI_KEY_STORAGE,
  GEMINI_BYOK_MODEL,
  AI_STUDIO_API_KEYS_URL,
  validateByokKeyInput,
  classifyByokError,
  maskApiKeyPreview,
  type ByokErrorInfo,
  type ByokErrorCode,
} from '../utils/geminiByokHelpers';

export {
  EDOC_GEMINI_KEY_STORAGE,
  GEMINI_BYOK_MODEL,
  AI_STUDIO_API_KEYS_URL,
  validateByokKeyInput,
  classifyByokError,
  maskApiKeyPreview,
  type ByokErrorInfo,
  type ByokErrorCode,
};

export const GEMINI_KEY_CHANGED_EVENT = 'edoc-gemini-key-changed';

export interface GeminiContentPart {
  text: string;
}

export interface GeminiContentTurn {
  role: 'user' | 'model';
  parts: GeminiContentPart[];
}

export type GeminiContentsPayload = string | GeminiContentTurn[];

export interface ServerGeminiStatus {
  serverConfigured: boolean;
  model: string;
}

export class ByokGeminiError extends Error {
  public readonly info: ByokErrorInfo;
  public readonly code: ByokErrorCode;

  constructor(info: ByokErrorInfo) {
    super(info.message);
    this.name = 'ByokGeminiError';
    this.info = info;
    this.code = info.code;
  }
}

function emitKeyChangedEvent(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(GEMINI_KEY_CHANGED_EVENT));
}

/**
 * Reads an optional user-provided personal Gemini API key from browser localStorage.
 * Never transmitted to Supabase and never logged to console.
 */
export function getUserGeminiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return (window.localStorage.getItem(EDOC_GEMINI_KEY_STORAGE) || '').trim();
  } catch {
    return '';
  }
}

export function hasUserGeminiKey(): boolean {
  return getUserGeminiKey().length > 0;
}

/**
 * Saves an optional personal key string into localStorage under "edoc_user_gemini_key".
 */
export function saveUserGeminiKey(rawKey: string): {
  ok: boolean;
  error?: string;
} {
  const check = validateByokKeyInput(rawKey);
  if (!check.valid) {
    return { ok: false, error: check.error };
  }

  if (typeof window === 'undefined') {
    return { ok: false, error: 'Browser storage is unavailable.' };
  }

  try {
    window.localStorage.setItem(EDOC_GEMINI_KEY_STORAGE, check.normalized);
    emitKeyChangedEvent();
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'Unable to save key to localStorage. Check browser storage permissions.',
    };
  }
}

/**
 * Clears the optional personal Gemini API key from localStorage.
 */
export function clearUserGeminiKey(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(EDOC_GEMINI_KEY_STORAGE);
    emitKeyChangedEvent();
  } catch {
    // Ignore storage errors cleanly
  }
}

let cachedServerStatus: ServerGeminiStatus | null = null;
let inFlightStatusRequest: Promise<ServerGeminiStatus> | null = null;

/**
 * Queries the server for whether the built-in server-side Gemini API key is configured.
 * Never returns or exposes the key itself.
 */
export async function fetchServerGeminiStatus(
  forceRefresh = false
): Promise<ServerGeminiStatus> {
  if (!forceRefresh && cachedServerStatus) {
    return cachedServerStatus;
  }
  if (!forceRefresh && inFlightStatusRequest) {
    return inFlightStatusRequest;
  }

  inFlightStatusRequest = (async () => {
    try {
      const response = await fetch('/api/gemini/status', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        return {
          serverConfigured: false,
          model: GEMINI_BYOK_MODEL,
        };
      }
      const data = (await response.json()) as Partial<ServerGeminiStatus>;
      const status: ServerGeminiStatus = {
        serverConfigured: Boolean(data?.serverConfigured),
        model:
          typeof data?.model === 'string' && data.model.trim()
            ? data.model.trim()
            : GEMINI_BYOK_MODEL,
      };
      cachedServerStatus = status;
      return status;
    } catch {
      return {
        serverConfigured: false,
        model: GEMINI_BYOK_MODEL,
      };
    } finally {
      inFlightStatusRequest = null;
    }
  })();

  return inFlightStatusRequest;
}

export interface GenerateByokOptions {
  contents: GeminiContentsPayload;
  systemInstruction?: string;
  responseMimeType?: 'application/json' | 'text/plain';
}

/**
 * Routes all Gemini generation requests through the Express backend (/api/gemini/generate).
 * Uses the server's GEMINI_API_KEY automatically for every visitor, or an optional
 * user-saved key if configured in API Key Settings.
 */
export async function generateByokContent(
  options: GenerateByokOptions
): Promise<{ text: string; model: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const optionalUserKey = getUserGeminiKey();
  if (optionalUserKey) {
    headers['X-User-Gemini-Key'] = optionalUserKey;
  }

  let response: Response;
  try {
    response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contents: options.contents,
        systemInstruction: options.systemInstruction,
        responseMimeType: options.responseMimeType,
      }),
    });
  } catch (networkErr: unknown) {
    throw new ByokGeminiError(
      classifyByokError(
        networkErr instanceof Error
          ? networkErr
          : new Error('Unable to reach the EDOC AI server. Please try again.')
      )
    );
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const serverCode =
      typeof payload.code === 'string' ? payload.code : undefined;
    const serverErrorMsg =
      typeof payload.error === 'string' && payload.error.trim()
        ? payload.error.trim()
        : `Server returned status ${response.status}`;

    throw new ByokGeminiError(
      classifyByokError({
        status: response.status,
        code: serverCode,
        message: serverErrorMsg,
      })
    );
  }

  const text = typeof payload.text === 'string' ? payload.text.trim() : '';
  const model =
    typeof payload.model === 'string' && payload.model.trim()
      ? payload.model.trim()
      : GEMINI_BYOK_MODEL;

  if (!text) {
    throw new ByokGeminiError({
      code: 'EMPTY_RESPONSE',
      title: 'Empty AI Response',
      message:
        'Gemini returned an empty response for this prompt. Please rephrase or try again.',
    });
  }

  return { text, model };
}
