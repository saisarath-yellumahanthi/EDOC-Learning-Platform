import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Activity,
  RefreshCw,
  Download,
  Search,
  X,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Clock,
  Calendar,
} from 'lucide-react';
import { fetchAllProfilesForAdmin } from '../lib/supabase';
import {
  AdminProfileRecord,
  UserRole,
  isAdminRole,
  isActiveWithin24Hours,
  computeAdminStats,
  filterAdminProfiles,
  formatLocalDate,
  formatLocalTimestamp,
  buildAdminUsersCsv,
} from '../utils/adminLogic';

interface AdminPanelViewProps {
  userRole: UserRole;
  onReturnHome: () => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  userRole,
  onReturnHome,
}) => {
  const isAuthorizedAdmin = isAdminRole(userRole);

  const [profiles, setProfiles] = useState<AdminProfileRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(isAuthorizedAdmin);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    if (!isAuthorizedAdmin) return;
    setIsLoading(true);
    setErrorMsg(null);
    const result = await fetchAllProfilesForAdmin();
    if (result.error) {
      setErrorMsg(result.error);
    } else {
      setProfiles(result.data);
      setLastRefreshedAt(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }
    setIsLoading(false);
  }, [isAuthorizedAdmin]);

  useEffect(() => {
    if (!isAuthorizedAdmin) return;
    void loadProfiles();
  }, [isAuthorizedAdmin, loadProfiles]);

  const stats = useMemo(() => computeAdminStats(profiles), [profiles]);
  const filteredProfiles = useMemo(
    () => filterAdminProfiles(profiles, searchQuery),
    [profiles, searchQuery]
  );

  const handleExportCsv = () => {
    const csvContent = buildAdminUsersCsv(filteredProfiles);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `edoc-users-${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Strict Role Protection: Show Access Denied card for non-admin users
  if (!isAuthorizedAdmin) {
    return (
      <section
        aria-label="Admin Access Denied"
        className="my-auto py-10 flex items-center justify-center"
      >
        <div className="w-full max-w-lg rounded-2xl bg-[#0b101d] border border-rose-500/40 shadow-[0_0_45px_rgba(244,63,94,0.12)] p-8 text-center space-y-5">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-mono tracking-widest uppercase text-rose-400">
              403 · RESTRICTED AREA
            </p>
            <h2 className="text-2xl font-display font-bold text-white">
              Access Denied
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              This panel is reserved exclusively for EDOC administrators. Your
              current account role is{' '}
              <span className="font-mono text-cyan-300 font-semibold">
                Student
              </span>
              , which does not have permission to view administrator records.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onReturnHome}
              className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.28)] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Workspace Home</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/35 text-amber-300 font-semibold uppercase tracking-wider">
              ADMINISTRATION
            </span>
            {lastRefreshedAt && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400 tabular-nums">
                  Synced {lastRefreshedAt}
                </span>
              </>
            )}
          </div>
          <h2 className="text-2xl font-display font-bold text-white mt-1.5">
            EDOC Admin Panel
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Monitor registered student accounts, recent login activity, and
            administrator roles from <code className="font-mono text-cyan-300 text-xs">public.profiles</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => void loadProfiles()}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-[#0b101d] hover:bg-slate-800/85 border border-slate-700/90 hover:border-cyan-400/50 text-slate-200 hover:text-cyan-200 font-mono text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer disabled:opacity-55"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-cyan-400 ${
                isLoading ? 'animate-spin' : ''
              }`}
            />
            <span>Refresh Data</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isLoading || filteredProfiles.length === 0}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs inline-flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top Summary Stat Cards */}
      <section
        aria-label="Administrator Summary Metrics"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="rounded-2xl bg-[#0b101d] border border-slate-800/90 p-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Total Registered Users
            </p>
            <p className="text-3xl font-display font-extrabold text-white tabular-nums">
              {stats.totalUsers.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">
              All accounts in public.profiles
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/35 flex items-center justify-center text-cyan-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#0b101d] border border-slate-800/90 p-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Active Today
            </p>
            <p className="text-3xl font-display font-extrabold text-emerald-400 tabular-nums">
              {stats.activeToday.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">
              Logged in within the last 24 hours
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/35 flex items-center justify-center text-emerald-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#0b101d] border border-slate-800/90 p-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Total Admins
            </p>
            <p className="text-3xl font-display font-extrabold text-amber-400 tabular-nums">
              {stats.totalAdmins.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">
              Verified administrator role accounts
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/35 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* Error Banner */}
      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl bg-rose-950/40 border border-rose-500/45 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-200"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-mono font-semibold text-amber-300">
                Unable to load user directory
              </p>
              <p className="text-rose-100/90 mt-0.5">{errorMsg}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadProfiles()}
            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-bold text-xs cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Searchable User Directory Table */}
      <section
        aria-label="Registered Users Directory"
        className="rounded-2xl bg-[#0b101d] border border-slate-800/90 overflow-hidden"
      >
        {/* Table Filter Toolbar */}
        <div className="p-4 border-b border-slate-800/90 bg-[#080c17] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <label htmlFor="admin-user-search" className="sr-only">
              Search users by full name, email, or role
            </label>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="admin-user-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by full name, email, or role..."
              className="w-full rounded-xl bg-[#060911] border border-slate-800 focus:border-cyan-400 pl-10 pr-9 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs font-mono text-slate-400 tabular-nums shrink-0">
            Showing{' '}
            <span className="text-cyan-300 font-semibold">
              {filteredProfiles.length}
            </span>{' '}
            of{' '}
            <span className="text-slate-200 font-semibold">
              {profiles.length}
            </span>{' '}
            users · Sorted by Last Login
          </div>
        </div>

        {/* Table Content */}
        {isLoading && profiles.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-xs font-mono text-cyan-300">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            <span>Loading user profiles from Supabase...</span>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-2">
            <p className="text-sm font-display font-semibold text-white">
              No matching users found
            </p>
            <p className="text-xs text-slate-400">
              {searchQuery
                ? `No profiles matched "${searchQuery}". Try adjusting your search filter.`
                : 'No user rows were returned from public.profiles.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-[#070a12] font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Full Name</th>
                  <th className="py-3.5 px-5">Email</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">Account Created</th>
                  <th className="py-3.5 px-5">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredProfiles.map((profile) => {
                  const rowIsAdmin = isAdminRole(profile.role);
                  const activeRecently = isActiveWithin24Hours(
                    profile.last_login
                  );
                  const displayName =
                    (profile.full_name ?? '').trim() || 'Unnamed User';
                  const initials = displayName
                    .split(/\s+/)
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={profile.id || profile.email || displayName}
                      className="hover:bg-slate-800/35 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-lg font-display font-bold text-xs flex items-center justify-center shrink-0 ${
                              rowIsAdmin
                                ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                                : 'bg-cyan-500/15 border border-cyan-400/30 text-cyan-300'
                            }`}
                          >
                            {initials || 'U'}
                          </span>
                          <span className="font-semibold text-white">
                            {displayName}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 font-mono text-xs text-slate-300">
                        {profile.email || '—'}
                      </td>

                      <td className="py-3.5 px-5">
                        {rowIsAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/40 text-amber-300 font-mono text-[11px] font-semibold">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Admin</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-semibold">
                            <span>Student</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 font-mono text-xs text-slate-300 tabular-nums whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatLocalDate(profile.created_at)}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-5 font-mono text-xs tabular-nums whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-2 ${
                            activeRecently
                              ? 'text-emerald-300'
                              : 'text-slate-400'
                          }`}
                        >
                          <Clock
                            className={`w-3.5 h-3.5 ${
                              activeRecently
                                ? 'text-emerald-400'
                                : 'text-slate-500'
                            }`}
                          />
                          <span>{formatLocalTimestamp(profile.last_login)}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
