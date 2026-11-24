export const EDOC_GEMINI_KEY_STORAGE = 'edoc_user_gemini_key';
export const GEMINI_BYOK_MODEL = 'gemini-3.5-flash-lite';
export const AI_STUDIO_API_KEYS_URL = 'https://aistudio.google.com/api-keys';

export type ByokErrorCode =
  | 'NO_API_KEY'
  | 'INVALID_KEY'
  | 'RATE_LIMITED'
  | 'EMPTY_RESPONSE'
  | 'API_ERROR';

export interface ByokErrorInfo {
  code: ByokErrorCode;
  title: string;
  message: string;
}

export function validateByokKeyInput(rawKey: string): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  const normalized = (rawKey ?? '').trim();
  if (!normalized) {
    return {
      valid: false,
      normalized: '',
      error: 'Please paste a non-empty Gemini API key before saving.',
    };
  }
  // Accept any non-empty key string (do NOT reject based on an "AIza" prefix)
  return {
    valid: true,
    normalized,
  };
}

export function maskApiKeyPreview(key: string): string {
  const trimmed = (key ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.length <= 8) {
    return '•'.repeat(trimmed.length);
  }
  return `${trimmed.slice(0, 4)}••••••${trimmed.slice(-4)}`;
}

export function extractRawGeminiErrorMessage(err: unknown): string {
  const raw =
    err instanceof Error ? err.message : String(err ?? 'Unknown Gemini API error');
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) {
      const statusLabel = parsed.error.status ? ` (${parsed.error.status})` : '';
      return `${parsed.error.message}${statusLabel}`;
    }
  } catch {
    // Already plain text
  }
  return raw;
}

export function classifyByokError(err: unknown): ByokErrorInfo {
  const status =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: number }).status)
      : 0;

  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'NO_API_KEY'
  ) {
    return {
      code: 'NO_API_KEY',
      title: 'Personal Gemini API Key Required',
      message:
        'Connect your personal Gemini API key in API Key Settings to run AI features using your own Google AI Studio quota.',
    };
  }

  const exactMessage = extractRawGeminiErrorMessage(err);
  const upper = exactMessage.toUpperCase();

  if (
    status === 401 ||
    status === 403 ||
    upper.includes('401') ||
    upper.includes('403') ||
    upper.includes('API_KEY_INVALID') ||
    upper.includes('API KEY NOT VALID') ||
    upper.includes('PERMISSION_DENIED') ||
    upper.includes('UNAUTHENTICATED') ||
    upper.includes('RESTRICTED')
  ) {
    return {
      code: 'INVALID_KEY',
      title: 'Invalid or Restricted API Key (401 / 403)',
      message: `Your personal Gemini API key was rejected or restricted by Google AI Studio. Open API Key Settings to check or replace it. (${exactMessage})`,
    };
  }

  if (
    status === 429 ||
    upper.includes('429') ||
    upper.includes('RESOURCE_EXHAUSTED') ||
    upper.includes('RATE LIMIT') ||
    upper.includes('QUOTA')
  ) {
    return {
      code: 'RATE_LIMITED',
      title: 'Personal Free-Tier Rate Limit Reached (429)',
      message: `Your personal Gemini API key hit its rate limit or quota. Please wait a minute before retrying, or inspect your quota in Google AI Studio. (${exactMessage})`,
    };
  }

  return {
    code: 'API_ERROR',
    title: 'Gemini AI Request Failed',
    message: exactMessage || 'The Gemini request failed. Please try again.',
  };
}
