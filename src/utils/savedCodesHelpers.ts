import type { TerminalLanguageKey } from './dsaAndTerminalLogic';

export interface SavedCodeRecord {
  id: string;
  user_id: string;
  title: string;
  language: string;
  code: string;
  updated_at: string;
}

export const SAVED_CODE_MAX_TITLE_LENGTH = 120;
export const SAVED_CODE_MAX_CODE_LENGTH = 100_000;

export const ALLOWED_SAVED_LANGUAGES: readonly TerminalLanguageKey[] = [
  'python',
  'c',
  'cpp',
  'java',
  'sql',
  'web',
];

export function normalizeSavedLanguage(raw: string): TerminalLanguageKey {
  const clean = (raw || '').trim().toLowerCase();
  if (clean === 'c') return 'c';
  if (clean === 'cpp' || clean === 'c++') return 'cpp';
  if (clean === 'java') return 'java';
  if (clean === 'python' || clean === 'py') return 'python';
  if (clean === 'sql') return 'sql';
  if (
    clean === 'web' ||
    clean === 'html' ||
    clean === 'css' ||
    clean === 'javascript' ||
    clean === 'js'
  ) {
    return 'web';
  }
  return 'python';
}

export function getSavedLanguageLabel(raw: string): string {
  const lang = normalizeSavedLanguage(raw);
  switch (lang) {
    case 'c':
      return 'C';
    case 'cpp':
      return 'C++';
    case 'java':
      return 'Java';
    case 'python':
      return 'Python';
    case 'sql':
      return 'SQL';
    case 'web':
      return 'Web (HTML/CSS/JS)';
  }
}

export function getSavedLanguageFilename(raw: string): string {
  const lang = normalizeSavedLanguage(raw);
  switch (lang) {
    case 'c':
      return 'main.c';
    case 'cpp':
      return 'main.cpp';
    case 'java':
      return 'Main.java';
    case 'python':
      return 'main.py';
    case 'sql':
      return 'query.sql';
    case 'web':
      return 'index.html';
  }
}

export function validateSavedCodeInput(params: {
  title: string;
  language: string;
  code: string;
}): { valid: boolean; normalizedTitle: string; error?: string } {
  const trimmedTitle = (params.title || '').trim();
  if (!trimmedTitle) {
    return {
      valid: false,
      normalizedTitle: '',
      error: 'Please enter a title for your code snippet.',
    };
  }
  if (trimmedTitle.length > SAVED_CODE_MAX_TITLE_LENGTH) {
    return {
      valid: false,
      normalizedTitle: trimmedTitle,
      error: `Title must be ${SAVED_CODE_MAX_TITLE_LENGTH} characters or fewer.`,
    };
  }
  if (typeof params.code !== 'string' || params.code.trim().length === 0) {
    return {
      valid: false,
      normalizedTitle: trimmedTitle,
      error: 'Cannot save an empty code buffer.',
    };
  }
  if (params.code.length > SAVED_CODE_MAX_CODE_LENGTH) {
    return {
      valid: false,
      normalizedTitle: trimmedTitle,
      error: 'Code snippet exceeds the maximum allowed size (100 KB).',
    };
  }
  return { valid: true, normalizedTitle: trimmedTitle };
}

export function buildCodePreview(code: string, maxLines = 4): string {
  const normalized = (code || '').replace(/\r\n/g, '\n').trim();
  if (!normalized) return '// Empty snippet';
  const lines = normalized.split('\n');
  const sliced = lines.slice(0, maxLines).map((line) =>
    line.length > 96 ? `${line.slice(0, 93)}...` : line
  );
  if (lines.length > maxLines) {
    sliced.push(`... (+${lines.length - maxLines} more lines)`);
  }
  return sliced.join('\n');
}

export function filterSavedCodes(
  items: SavedCodeRecord[],
  searchQuery: string,
  languageFilter: string
): SavedCodeRecord[] {
  const q = (searchQuery || '').trim().toLowerCase();
  const langFilter = (languageFilter || 'all').trim().toLowerCase();

  return items.filter((item) => {
    const normalizedLang = normalizeSavedLanguage(item.language);
    if (langFilter !== 'all' && normalizedLang !== langFilter) {
      return false;
    }
    if (q.length > 0) {
      const titleHit = item.title.toLowerCase().includes(q);
      const codeHit = item.code.toLowerCase().includes(q);
      const langHit = getSavedLanguageLabel(item.language)
        .toLowerCase()
        .includes(q);
      return titleHit || codeHit || langHit;
    }
    return true;
  });
}

export function formatSavedCodeTimestamp(
  isoString: string | null | undefined
): string {
  if (!isoString) return 'Just now';
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(parsed);
  } catch {
    return parsed.toLocaleString();
  }
}
