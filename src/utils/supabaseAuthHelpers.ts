export interface SupabaseConfigStatus {
  configured: boolean;
  missingVars: string[];
  reason?: string;
}

const PLACEHOLDER_PATTERNS = [
  'your-project-ref',
  'your_supabase',
  'my_supabase',
  'placeholder',
  'example.supabase.co',
  'changeme',
];

function isPlaceholderValue(value: string): boolean {
  const lower = value.trim().toLowerCase();
  if (!lower) return true;
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p));
}

export function checkSupabaseConfig(
  url?: string,
  publishableKey?: string
): SupabaseConfigStatus {
  const cleanUrl = (url ?? '').trim();
  const cleanKey = (publishableKey ?? '').trim();
  const missingVars: string[] = [];

  if (!cleanUrl || isPlaceholderValue(cleanUrl)) {
    missingVars.push('VITE_SUPABASE_URL');
  }
  if (!cleanKey || isPlaceholderValue(cleanKey)) {
    missingVars.push('VITE_SUPABASE_PUBLISHABLE_KEY');
  }

  if (missingVars.length > 0) {
    return {
      configured: false,
      missingVars,
      reason: `Missing required Supabase environment variable${
        missingVars.length > 1 ? 's' : ''
      }: ${missingVars.join(' and ')}.`,
    };
  }

  try {
    const parsed = new URL(cleanUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return {
        configured: false,
        missingVars: ['VITE_SUPABASE_URL'],
        reason: 'VITE_SUPABASE_URL must be a valid https:// Supabase project URL.',
      };
    }
  } catch {
    return {
      configured: false,
      missingVars: ['VITE_SUPABASE_URL'],
      reason: 'VITE_SUPABASE_URL is not a valid URL.',
    };
  }

  return {
    configured: true,
    missingVars: [],
  };
}

export function formatSupabaseAuthError(
  rawMessage: string | null | undefined,
  mode: 'signin' | 'signup'
): string {
  const msg = (rawMessage || '').trim();
  const lower = msg.toLowerCase();

  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid_credentials') ||
    lower.includes('invalid email or password')
  ) {
    return 'Incorrect email or password. Please check your credentials and try again.';
  }

  if (
    lower.includes('user already registered') ||
    lower.includes('already been registered') ||
    lower.includes('already exists') ||
    lower.includes('duplicate key') ||
    lower.includes('email_exists')
  ) {
    return 'An account with this email address already exists. Please sign in instead.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Your email address is not confirmed yet. Please check your inbox for the verification link before signing in.';
  }

  if (lower.includes('password should be at least') || lower.includes('weak_password')) {
    return msg || 'Password must be at least 6 characters long.';
  }

  if (
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('over_email_send_rate_limit')
  ) {
    return 'Too many authentication attempts. Please wait a moment and try again.';
  }

  if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
    return 'Unable to reach Supabase Auth. Check your internet connection and VITE_SUPABASE_URL.';
  }

  if (msg) {
    return msg;
  }

  return mode === 'signup'
    ? 'Unable to create your account right now. Please try again.'
    : 'Unable to sign in right now. Please try again.';
}

export function resolveProfileDisplayName(
  profileFullName?: string | null,
  metadataFullName?: string | null,
  email?: string | null
): string {
  const fromProfile = (profileFullName ?? '').trim();
  if (fromProfile) return fromProfile;

  const fromMetadata = (metadataFullName ?? '').trim();
  if (fromMetadata) return fromMetadata;

  const cleanEmail = (email ?? '').trim().toLowerCase();
  if (cleanEmail.includes('@')) {
    const derived = cleanEmail
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
    if (derived) return derived;
  }

  return 'EDOC Student';
}
