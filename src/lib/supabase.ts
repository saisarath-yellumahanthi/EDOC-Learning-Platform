import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  checkSupabaseConfig,
  SupabaseConfigStatus,
} from '../utils/supabaseAuthHelpers';
import type { AdminProfileRecord } from '../utils/adminLogic';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
).trim();

export const supabaseConfigStatus: SupabaseConfigStatus = checkSupabaseConfig(
  supabaseUrl,
  supabasePublishableKey
);

export const isSupabaseConfigured: boolean = supabaseConfigStatus.configured;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export interface SupabaseProfileRow {
  full_name: string | null;
  role: string | null;
  last_login: string | null;
}

export async function fetchUserProfile(
  userId: string
): Promise<SupabaseProfileRow | null> {
  if (!supabase || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, role, last_login')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[EDOC Auth] Could not fetch public.profiles row:', error.message);
      return null;
    }

    return {
      full_name: typeof data?.full_name === 'string' ? data.full_name : null,
      role: typeof data?.role === 'string' ? data.role : null,
      last_login: typeof data?.last_login === 'string' ? data.last_login : null,
    };
  } catch (err) {
    console.warn('[EDOC Auth] Unexpected error reading public.profiles:', err);
    return null;
  }
}

export async function fetchAllProfilesForAdmin(): Promise<{
  data: AdminProfileRecord[];
  error: string | null;
}> {
  if (!supabase) {
    return {
      data: [],
      error: 'Supabase client is not configured.',
    };
  }

  try {
    // Explicitly select only non-sensitive profile columns (never passwords)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at, last_login')
      .order('last_login', { ascending: false, nullsFirst: false });

    if (error) {
      console.warn('[EDOC Admin] Could not query public.profiles:', error.message);
      return {
        data: [],
        error: error.message || 'Unable to load user directory from public.profiles.',
      };
    }

    const sanitized: AdminProfileRecord[] = (Array.isArray(data) ? data : []).map(
      (row) => ({
        id: String(row.id ?? ''),
        full_name: typeof row.full_name === 'string' ? row.full_name : null,
        email: typeof row.email === 'string' ? row.email : null,
        role: typeof row.role === 'string' ? row.role : null,
        created_at: typeof row.created_at === 'string' ? row.created_at : null,
        last_login: typeof row.last_login === 'string' ? row.last_login : null,
      })
    );

    return { data: sanitized, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unexpected error querying public.profiles.';
    console.warn('[EDOC Admin] Unexpected error loading profiles:', err);
    return { data: [], error: message };
  }
}

export async function updateLastLoginTimestamp(userId: string): Promise<void> {
  if (!supabase || !userId) return;
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.warn(
        '[EDOC Auth] Could not update last_login in public.profiles:',
        error.message
      );
    }
  } catch (err) {
    console.warn('[EDOC Auth] Unexpected error updating last_login:', err);
  }
}
