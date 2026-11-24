export type UserRole = 'admin' | 'student';

export interface AdminProfileRecord {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at: string | null;
  last_login: string | null;
}

export interface AdminSummaryStats {
  totalUsers: number;
  activeToday: number;
  totalAdmins: number;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function normalizeUserRole(role?: string | null): UserRole {
  return (role ?? '').trim().toLowerCase() === 'admin' ? 'admin' : 'student';
}

export function isAdminRole(role?: string | null): boolean {
  return normalizeUserRole(role) === 'admin';
}

export function isActiveWithin24Hours(
  lastLoginIso?: string | null,
  now: Date = new Date()
): boolean {
  if (!lastLoginIso) return false;
  const parsedMs = Date.parse(lastLoginIso);
  if (Number.isNaN(parsedMs)) return false;
  const diffMs = now.getTime() - parsedMs;
  // Allow slight clock skew (up to 5 minutes ahead), require within past 24 hours
  return diffMs <= TWENTY_FOUR_HOURS_MS && diffMs >= -5 * 60 * 1000;
}

export function computeAdminStats(
  profiles: AdminProfileRecord[],
  now: Date = new Date()
): AdminSummaryStats {
  let activeToday = 0;
  let totalAdmins = 0;

  for (const profile of profiles) {
    if (isAdminRole(profile.role)) {
      totalAdmins += 1;
    }
    if (isActiveWithin24Hours(profile.last_login, now)) {
      activeToday += 1;
    }
  }

  return {
    totalUsers: profiles.length,
    activeToday,
    totalAdmins,
  };
}

export function filterAdminProfiles(
  profiles: AdminProfileRecord[],
  searchQuery: string
): AdminProfileRecord[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return profiles;

  return profiles.filter((profile) => {
    const fullName = (profile.full_name ?? '').toLowerCase();
    const email = (profile.email ?? '').toLowerCase();
    const roleLabel = normalizeUserRole(profile.role);
    return (
      fullName.includes(query) ||
      email.includes(query) ||
      roleLabel.includes(query)
    );
  });
}

export function formatLocalDate(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatLocalTimestamp(iso?: string | null): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Never';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeCsvCell(rawValue: string): string {
  // Neutralize spreadsheet formula injection characters (=, +, -, @, tab, CR)
  const neutralized = /^[=+\-@\t\r]/.test(rawValue) ? `'${rawValue}` : rawValue;
  const escaped = neutralized.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function buildAdminUsersCsv(profiles: AdminProfileRecord[]): string {
  const headers = [
    'Full Name',
    'Email',
    'Role',
    'Account Created Date',
    'Last Login Timestamp',
  ];

  const rows = profiles.map((profile) => {
    const displayName = (profile.full_name ?? '').trim() || 'Unnamed User';
    const email = (profile.email ?? '').trim() || '—';
    const roleLabel = isAdminRole(profile.role) ? 'Admin' : 'Student';
    const createdStr = formatLocalDate(profile.created_at);
    const lastLoginStr = formatLocalTimestamp(profile.last_login);

    return [displayName, email, roleLabel, createdStr, lastLoginStr]
      .map(escapeCsvCell)
      .join(',');
  });

  return [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
}
