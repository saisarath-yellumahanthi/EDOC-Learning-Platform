import { supabase } from './supabase';
import {
  SavedCodeRecord,
  normalizeSavedLanguage,
  validateSavedCodeInput,
} from '../utils/savedCodesHelpers';

export interface SavedCodeResult<T> {
  data: T | null;
  error: string | null;
  requiresAuth?: boolean;
}

async function resolveVerifiedSessionUserId(
  expectedUserId?: string
): Promise<{ userId: string | null; error: string | null; requiresAuth: boolean }> {
  if (!supabase) {
    return {
      userId: null,
      error: 'Supabase is not configured in this environment.',
      requiresAuth: false,
    };
  }

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.id) {
      return {
        userId: null,
        error: 'Please sign in to save and manage your code snippets.',
        requiresAuth: true,
      };
    }

    if (expectedUserId && data.user.id !== expectedUserId) {
      return {
        userId: null,
        error: 'Session mismatch detected. Please refresh or sign in again.',
        requiresAuth: true,
      };
    }

    return { userId: data.user.id, error: null, requiresAuth: false };
  } catch {
    return {
      userId: null,
      error: 'Unable to verify your active session. Please sign in again.',
      requiresAuth: true,
    };
  }
}

function sanitizeRow(row: Record<string, unknown>): SavedCodeRecord {
  return {
    id: String(row.id ?? ''),
    user_id: String(row.user_id ?? ''),
    title: typeof row.title === 'string' ? row.title : 'Untitled Snippet',
    language:
      typeof row.language === 'string'
        ? normalizeSavedLanguage(row.language)
        : 'python',
    code: typeof row.code === 'string' ? row.code : '',
    updated_at:
      typeof row.updated_at === 'string'
        ? row.updated_at
        : new Date().toISOString(),
  };
}

export async function fetchUserSavedCodes(
  expectedUserId?: string
): Promise<SavedCodeResult<SavedCodeRecord[]>> {
  const authCheck = await resolveVerifiedSessionUserId(expectedUserId);
  if (!authCheck.userId || !supabase) {
    return {
      data: [],
      error: authCheck.error,
      requiresAuth: authCheck.requiresAuth,
    };
  }

  try {
    const { data, error } = await supabase
      .from('saved_codes')
      .select('id, user_id, title, language, code, updated_at')
      .eq('user_id', authCheck.userId)
      .order('updated_at', { ascending: false });

    if (error) {
      return {
        data: [],
        error: error.message || 'Failed to load saved code snippets.',
      };
    }

    const rows = Array.isArray(data)
      ? data.map((row) => sanitizeRow(row as Record<string, unknown>))
      : [];

    return { data: rows, error: null };
  } catch (err: unknown) {
    return {
      data: [],
      error:
        err instanceof Error
          ? err.message
          : 'Unexpected error while loading saved code snippets.',
    };
  }
}

export async function createSavedCode(params: {
  userId?: string;
  title: string;
  language: string;
  code: string;
}): Promise<SavedCodeResult<SavedCodeRecord>> {
  const validation = validateSavedCodeInput(params);
  if (!validation.valid) {
    return { data: null, error: validation.error || 'Invalid snippet input.' };
  }

  const authCheck = await resolveVerifiedSessionUserId(params.userId);
  if (!authCheck.userId || !supabase) {
    return {
      data: null,
      error: authCheck.error,
      requiresAuth: authCheck.requiresAuth,
    };
  }

  const nowIso = new Date().toISOString();
  const normalizedLang = normalizeSavedLanguage(params.language);

  try {
    const { data, error } = await supabase
      .from('saved_codes')
      .insert({
        user_id: authCheck.userId,
        title: validation.normalizedTitle,
        language: normalizedLang,
        code: params.code,
        updated_at: nowIso,
      })
      .select('id, user_id, title, language, code, updated_at')
      .single();

    if (error || !data) {
      return {
        data: null,
        error: error?.message || 'Unable to save code snippet to your account.',
      };
    }

    return {
      data: sanitizeRow(data as Record<string, unknown>),
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : 'Unexpected error while saving code snippet.',
    };
  }
}

export async function updateExistingSavedCode(params: {
  id: string;
  userId?: string;
  title: string;
  language: string;
  code: string;
}): Promise<SavedCodeResult<SavedCodeRecord>> {
  if (!params.id) {
    return { data: null, error: 'Missing saved snippet identifier.' };
  }

  const validation = validateSavedCodeInput(params);
  if (!validation.valid) {
    return { data: null, error: validation.error || 'Invalid snippet input.' };
  }

  const authCheck = await resolveVerifiedSessionUserId(params.userId);
  if (!authCheck.userId || !supabase) {
    return {
      data: null,
      error: authCheck.error,
      requiresAuth: authCheck.requiresAuth,
    };
  }

  const nowIso = new Date().toISOString();
  const normalizedLang = normalizeSavedLanguage(params.language);

  try {
    const { data, error } = await supabase
      .from('saved_codes')
      .update({
        title: validation.normalizedTitle,
        language: normalizedLang,
        code: params.code,
        updated_at: nowIso,
      })
      .eq('id', params.id)
      .eq('user_id', authCheck.userId)
      .select('id, user_id, title, language, code, updated_at')
      .single();

    if (error || !data) {
      return {
        data: null,
        error:
          error?.message ||
          'Unable to update this saved snippet. You can try "Save as New".',
      };
    }

    return {
      data: sanitizeRow(data as Record<string, unknown>),
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : 'Unexpected error while updating saved snippet.',
    };
  }
}

export async function deleteSavedCode(params: {
  id: string;
  userId?: string;
}): Promise<SavedCodeResult<boolean>> {
  if (!params.id) {
    return { data: false, error: 'Missing saved snippet identifier.' };
  }

  const authCheck = await resolveVerifiedSessionUserId(params.userId);
  if (!authCheck.userId || !supabase) {
    return {
      data: false,
      error: authCheck.error,
      requiresAuth: authCheck.requiresAuth,
    };
  }

  try {
    const { error } = await supabase
      .from('saved_codes')
      .delete()
      .eq('id', params.id)
      .eq('user_id', authCheck.userId);

    if (error) {
      return {
        data: false,
        error: error.message || 'Unable to delete saved code snippet.',
      };
    }

    return { data: true, error: null };
  } catch (err: unknown) {
    return {
      data: false,
      error:
        err instanceof Error
          ? err.message
          : 'Unexpected error while deleting saved snippet.',
    };
  }
}
