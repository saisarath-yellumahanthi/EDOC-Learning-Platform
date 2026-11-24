import { GoogleGenAI, type ContentListUnion } from '@google/genai';
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
 * Reads the user's personal Gemini API key strictly from browser localStorage.
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
 * Saves any non-empty key string strictly into localStorage under "edoc_user_gemini_key".
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
 * Clears the saved personal Gemini API key from localStorage.
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

/**
 * Initializes @google/genai strictly with the user's saved BYOK key and model "gemini-3.5-flash-lite".
 */
export function createByokGeminiClient(): {
  ai: GoogleGenAI;
  model: string;
} {
  const apiKey = getUserGeminiKey();
  if (!apiKey) {
    throw new ByokGeminiError(classifyByokError({ code: 'NO_API_KEY' }));
  }

  const ai = new GoogleGenAI({ apiKey });
  return {
    ai,
    model: GEMINI_BYOK_MODEL,
  };
}

export interface GenerateByokOptions {
  contents: ContentListUnion;
  systemInstruction?: string;
}

/**
 * Runs a Gemini generation request exclusively using the user's personal saved key
 * and model "gemini-3.5-flash-lite" with structured 401/403/429 error classification.
 */
export async function generateByokContent(
  options: GenerateByokOptions
): Promise<{ text: string; model: string }> {
  const { ai, model } = createByokGeminiClient();

  try {
    const response = await ai.models.generateContent({
      model,
      contents: options.contents,
      config: options.systemInstruction
        ? { systemInstruction: options.systemInstruction }
        : undefined,
    });

    const text =
      response.text?.trim() ||
      response.candidates?.[0]?.content?.parts
        ?.map((p) => (typeof p.text === 'string' ? p.text : ''))
        .join('')
        .trim() ||
      '';

    if (!text) {
      throw new ByokGeminiError({
        code: 'EMPTY_RESPONSE',
        title: 'Empty AI Response',
        message:
          'Gemini returned an empty response for this prompt. Please rephrase or try again.',
      });
    }

    return { text, model };
  } catch (err: unknown) {
    if (err instanceof ByokGeminiError) {
      throw err;
    }
    throw new ByokGeminiError(classifyByokError(err));
  }
}
