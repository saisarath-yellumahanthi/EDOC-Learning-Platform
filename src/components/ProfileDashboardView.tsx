import React, { useState, useEffect } from 'react';
import { FolderCode, Trophy, User, Award, CheckCircle2, BookOpen } from 'lucide-react';
import type { UserProfile } from '../utils/edocLogic';
import { SavedCodesSection } from './SavedCodesSection';
import { LeaderboardView, type TerminalCodePayload } from './WorkspaceViews';

export interface ProfileDashboardViewProps {
  currentUser: UserProfile;
  currentUserXp: number;
  currentUserLevel: number;
  initialTab?: 'saved-codes' | 'leaderboard';
  onOpenInTerminal: (payload: TerminalCodePayload) => void;
  onNavigateTerminal: () => void;
}

export const ProfileDashboardView: React.FC<ProfileDashboardViewProps> = ({
  currentUser,
  currentUserXp,
  currentUserLevel,
  initialTab = 'saved-codes',
  onOpenInTerminal,
  onNavigateTerminal,
}) => {
  const [activeTab, setActiveTab] = useState<'saved-codes' | 'leaderboard'>(
    initialTab
  );

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const initials = currentUser.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Profile Dashboard Header */}
      <div className="rounded-2xl bg-[#0b101d] border border-slate-800/90 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-slate-950 font-display font-extrabold text-lg flex items-center justify-center shrink-0">
            {initials || <User className="w-6 h-6" />}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-mono text-cyan-400 tracking-wide">
              PROFILE DASHBOARD
            </p>
            <h2 className="text-2xl font-display font-bold text-white truncate">
              {currentUser.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
              <span className="truncate">{currentUser.email}</span>
              <span aria-hidden="true">·</span>
              <span className="text-cyan-300">
                {currentUser.isEduVerified
                  ? 'Edu Verified Student'
                  : 'Developer Account'}
              </span>
            </div>
          </div>
        </div>

        {/* Clean Unboxed Key Progress Metrics */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-4 lg:pt-0 lg:pl-6 shrink-0">
          <div className="space-y-1">
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>Level / XP</span>
            </div>
            <div className="text-sm font-mono font-bold text-white tabular-nums">
              Lvl {currentUserLevel} · {currentUserXp.toLocaleString()} XP
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>DSA Solved</span>
            </div>
            <div className="text-sm font-mono font-bold text-white tabular-nums">
              {currentUser.solvedDsaIds.length}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Topics</span>
            </div>
            <div className="text-sm font-mono font-bold text-white tabular-nums">
              {currentUser.completedTopics.length}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Dashboard Tab Switcher */}
      <div
        role="tablist"
        aria-label="Profile Dashboard Sections"
        className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#090d16] border border-slate-800"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'saved-codes'}
          onClick={() => setActiveTab('saved-codes')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'saved-codes'
              ? 'bg-cyan-500 text-slate-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FolderCode className="w-4 h-4" />
          <span>Saved Codes</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'leaderboard'}
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'leaderboard'
              ? 'bg-cyan-500 text-slate-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Standings &amp; XP</span>
        </button>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'saved-codes' ? (
        <SavedCodesSection
          userId={currentUser.uid}
          onOpenInTerminal={onOpenInTerminal}
          onNavigateTerminal={onNavigateTerminal}
        />
      ) : (
        <LeaderboardView
          currentUser={currentUser}
          currentUserXp={currentUserXp}
          currentUserLevel={currentUserLevel}
        />
      )}
    </div>
  );
};
