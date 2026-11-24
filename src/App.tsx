import { useState, useEffect, useCallback } from 'react';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';
import { AuthScreen, AuthenticatedUser } from './components/AuthScreen';
import { DashboardShell } from './components/DashboardShell';
import { calculateLevelFromXp, isEduEmail } from './utils/edocLogic';
import {
  supabase,
  isSupabaseConfigured,
  fetchUserProfile,
} from './lib/supabase';
import { resolveProfileDisplayName } from './utils/supabaseAuthHelpers';
import { normalizeUserRole } from './utils/adminLogic';

interface StoredProgressSnapshot {
  xp: number;
  solvedDsaIds: number[];
  completedTopics: string[];
}

function getProgressStorageKey(userId: string): string {
  return `edoc_user_progress_v1_${userId}`;
}

function loadUserProgress(userId: string): StoredProgressSnapshot {
  if (typeof window === 'undefined' || !userId) {
    return { xp: 0, solvedDsaIds: [], completedTopics: [] };
  }
  try {
    const raw = window.localStorage.getItem(getProgressStorageKey(userId));
    if (!raw) return { xp: 0, solvedDsaIds: [], completedTopics: [] };
    const parsed = JSON.parse(raw) as Partial<StoredProgressSnapshot>;
    return {
      xp: typeof parsed.xp === 'number' && parsed.xp >= 0 ? parsed.xp : 0,
      solvedDsaIds: Array.isArray(parsed.solvedDsaIds)
        ? parsed.solvedDsaIds.filter((id): id is number => typeof id === 'number')
        : [],
      completedTopics: Array.isArray(parsed.completedTopics)
        ? parsed.completedTopics.filter((t): t is string => typeof t === 'string')
        : [],
    };
  } catch {
    return { xp: 0, solvedDsaIds: [], completedTopics: [] };
  }
}

function saveUserProgress(userId: string, progress: StoredProgressSnapshot): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    window.localStorage.setItem(
      getProgressStorageKey(userId),
      JSON.stringify(progress)
    );
  } catch {
    // Ignore storage quota errors
  }
}

export default function App() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isAuthInitializing, setIsAuthInitializing] = useState<boolean>(
    isSupabaseConfigured
  );

  const hydrateAuthenticatedUser = useCallback(
    async (authUser: SupabaseAuthUser): Promise<AuthenticatedUser> => {
      const email = (authUser.email || '').trim().toLowerCase();
      const metadataFullName =
        typeof authUser.user_metadata?.full_name === 'string'
          ? authUser.user_metadata.full_name
          : null;

      // Read full_name and role from public.profiles for the sidebar footer and role-gated Admin Panel
      const profileRow = await fetchUserProfile(authUser.id);
      const displayName = resolveProfileDisplayName(
        profileRow?.full_name,
        metadataFullName,
        email
      );
      const resolvedRole = normalizeUserRole(profileRow?.role);

      const savedProgress = loadUserProgress(authUser.id);
      const levelInfo = calculateLevelFromXp(savedProgress.xp);

      return {
        uid: authUser.id,
        name: displayName,
        email,
        role: resolvedRole,
        isEduVerified: isEduEmail(email),
        level: levelInfo.level,
        xp: savedProgress.xp,
        solvedDsaIds: savedProgress.solvedDsaIds,
        completedTopics: savedProgress.completedTopics,
        createdAt: authUser.created_at || new Date().toISOString(),
      };
    },
    []
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsAuthInitializing(false);
      setUser(null);
      return;
    }

    let isMounted = true;

    const syncSessionUser = async (authUser: SupabaseAuthUser | null) => {
      if (!authUser) {
        if (isMounted) {
          setUser(null);
          setIsAuthInitializing(false);
        }
        return;
      }

      const hydrated = await hydrateAuthenticatedUser(authUser);
      if (isMounted) {
        setUser(hydrated);
        setIsAuthInitializing(false);
      }
    };

    // Hydrate existing persisted Supabase session on load
    supabase.auth
      .getSession()
      .then(({ data }) => syncSessionUser(data.session?.user ?? null))
      .catch(() => {
        if (isMounted) {
          setUser(null);
          setIsAuthInitializing(false);
        }
      });

    // Subscribe to Supabase Auth state changes cleanly
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSessionUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateAuthenticatedUser]);

  // Persist non-auth learning progress scoped per authenticated Supabase user ID
  useEffect(() => {
    if (!user?.uid) return;
    saveUserProgress(user.uid, {
      xp: user.xp,
      solvedDsaIds: user.solvedDsaIds,
      completedTopics: user.completedTopics,
    });
  }, [user]);

  const handleSignOut = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[EDOC Auth] Error signing out:', err);
      }
    }
    setUser(null);
  };

  const handleAddXp = (delta: number) => {
    setUser((prev) => {
      if (!prev) return null;
      const nextXp = Math.max(0, prev.xp + delta);
      const nextLevel = calculateLevelFromXp(nextXp).level;
      return {
        ...prev,
        xp: nextXp,
        level: nextLevel,
      };
    });
  };

  const handleMarkDsaProblemSolved = (problemId: number, xpReward: number) => {
    setUser((prev) => {
      if (!prev) return null;
      const alreadySolved = prev.solvedDsaIds.includes(problemId);
      const nextSolvedIds = alreadySolved
        ? prev.solvedDsaIds
        : [...prev.solvedDsaIds, problemId];
      const nextXp = alreadySolved ? prev.xp : prev.xp + xpReward;
      const nextLevel = calculateLevelFromXp(nextXp).level;
      return {
        ...prev,
        xp: nextXp,
        level: nextLevel,
        solvedDsaIds: nextSolvedIds,
      };
    });
  };

  const handleMarkTopicCompleted = (topicKey: string) => {
    setUser((prev) => {
      if (!prev) return null;
      if (prev.completedTopics.includes(topicKey)) return prev;
      return {
        ...prev,
        completedTopics: [...prev.completedTopics, topicKey],
      };
    });
  };

  if (isAuthInitializing) {
    return (
      <main className="min-h-screen w-full bg-[#060911] text-slate-100 flex items-center justify-center px-4">
        <div
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-3 rounded-xl bg-[#0b101d] border border-cyan-500/30 px-5 py-3.5 text-xs font-mono text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.12)]"
        >
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Verifying EDOC Workspace session...</span>
        </div>
      </main>
    );
  }

  // Strict authentication enforcement: Unauthenticated users are always locked to Sign-In / Sign-Up
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <DashboardShell
      user={user}
      onSignOut={handleSignOut}
      onAddXp={handleAddXp}
      onMarkDsaProblemSolved={handleMarkDsaProblemSolved}
      onMarkTopicCompleted={handleMarkTopicCompleted}
    />
  );
}
