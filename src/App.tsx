import { useState, useEffect } from 'react';
import {
  AuthScreen,
  AuthenticatedUser,
  saveRegisteredUserProfile,
} from './components/AuthScreen';
import { DashboardShell } from './components/DashboardShell';
import { calculateLevelFromXp } from './utils/edocLogic';

const ACTIVE_SESSION_STORAGE_KEY = 'edoc_active_session_v1';

export default function App() {
  const [user, setUser] = useState<AuthenticatedUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved) as AuthenticatedUser;
      if (parsed && parsed.uid && parsed.email && parsed.name) {
        return {
          ...parsed,
          level: calculateLevelFromXp(parsed.xp ?? 0).level,
          xp: parsed.xp ?? 0,
          solvedDsaIds: Array.isArray(parsed.solvedDsaIds)
            ? parsed.solvedDsaIds
            : [],
          completedTopics: Array.isArray(parsed.completedTopics)
            ? parsed.completedTopics
            : [],
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (user) {
        window.localStorage.setItem(
          ACTIVE_SESSION_STORAGE_KEY,
          JSON.stringify(user)
        );
        saveRegisteredUserProfile(user);
      } else {
        window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [user]);

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

  // Strict authentication enforcement: Unauthenticated users are always locked to Sign-In / Sign-Up
  if (!user) {
    return <AuthScreen onSuccess={(authenticated) => setUser(authenticated)} />;
  }

  return (
    <DashboardShell
      user={user}
      onSignOut={() => setUser(null)}
      onAddXp={handleAddXp}
      onMarkDsaProblemSolved={handleMarkDsaProblemSolved}
      onMarkTopicCompleted={handleMarkTopicCompleted}
    />
  );
}
