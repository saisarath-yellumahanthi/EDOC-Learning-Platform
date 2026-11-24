import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  checkSupabaseConfig,
  SupabaseConfigStatus,
} from '../utils/supabaseAuthHelpers';

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
  last_login: string | null;
}

export async function fetchUserProfile(
  userId: string
): Promise<SupabaseProfileRow | null> {
  if (!supabase || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, last_login')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[EDOC Auth] Could not fetch public.profiles row:', error.message);
      return null;
    }

    return {
      full_name: typeof data?.full_name === 'string' ? data.full_name : null,
      last_login: typeof data?.last_login === 'string' ? data.last_login : null,
    };
  } catch (err) {
    console.warn('[EDOC Auth] Unexpected error reading public.profiles:', err);
    return null;
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
