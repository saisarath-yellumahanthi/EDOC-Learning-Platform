import React, { useState, useEffect } from 'react';
import {
  Play,
  Terminal as TerminalIcon,
  Code2,
  Globe,
  Database,
  HelpCircle,
  Cpu,
  Home,
  Trophy,
  LogOut,
  Search,
  Command,
  CornerDownLeft,
  Keyboard,
  X,
  Menu,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { EdocLogo } from './EdocLogo';
import { AuthenticatedUser } from './AuthScreen';
import {
  NavSectionId,
  SIDEBAR_NAV_ITEMS,
  calculateLevelFromXp,
} from '../utils/edocLogic';
import {
  ProgrammingLanguagesView,
  WebDevView,
  SqlWorkbenchView,
  TerminalSandboxView,
  QuizPracticeView,
  DsaProblemsView,
  LeaderboardView,
  TerminalCodePayload,
} from './WorkspaceViews';

interface DashboardShellProps {
  user: AuthenticatedUser;
  onSignOut: () => void;
  onAddXp: (delta: number) => void;
  onMarkDsaProblemSolved: (problemId: number, xpReward: number) => void;
  onMarkTopicCompleted: (topicKey: string) => void;
}

const MODULE_ICONS: Record<NavSectionId, React.ReactNode> = {
  home: <Home className="w-4 h-4" />,
  languages: <Code2 className="w-4 h-4" />,
  webdev: <Globe className="w-4 h-4" />,
  sql: <Database className="w-4 h-4" />,
  terminal: <TerminalIcon className="w-4 h-4" />,
  quiz: <HelpCircle className="w-4 h-4" />,
  dsa: <Cpu className="w-4 h-4" />,
  leaderboard: <Trophy className="w-4 h-4" />,
};

const HOME_STAR_POSITIONS = [
  { top: '9%', left: '24%', size: 2, opacity: 0.65 },
  { top: '14%', left: '82%', size: 2.5, opacity: 0.7 },
  { top: '22%', left: '38%', size: 1.5, opacity: 0.45 },
  { top: '27%', left: '91%', size: 2.5, opacity: 0.75 },
  { top: '36%', left: '21%', size: 2, opacity: 0.55 },
  { top: '44%', left: '87%', size: 1.5, opacity: 0.45 },
  { top: '56%', left: '25%', size: 2.5, opacity: 0.75 },
  { top: '63%', left: '79%', size: 2, opacity: 0.6 },
  { top: '74%', left: '31%', size: 2, opacity: 0.65 },
  { top: '81%', left: '88%', size: 2, opacity: 0.5 },
  { top: '88%', left: '46%', size: 1.5, opacity: 0.45 },
];

export const DashboardShell: React.FC<DashboardShellProps> = ({
  user,
  onSignOut,
  onAddXp,
  onMarkDsaProblemSolved,
  onMarkTopicCompleted,
}) => {
  const [activeSection, setActiveSection] = useState<NavSectionId>('home');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isKeymapsOpen, setIsKeymapsOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [xpBanner, setXpBanner] = useState<string | null>(null);
  const [terminalPayload, setTerminalPayload] =
    useState<TerminalCodePayload | null>(null);

  const levelInfo = calculateLevelFromXp(user.xp);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsKeymapsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAwardXp = (amount: number, reason: string) => {
    onAddXp(amount);
    setXpBanner(`+${amount} XP · ${reason}`);
    setTimeout(() => {
      setXpBanner(null);
    }, 3500);
  };

  const handleSolveDsaProblem = (
    problemId: number,
    xpReward: number,
    title: string
  ) => {
    onMarkDsaProblemSolved(problemId, xpReward);
    setXpBanner(`+${xpReward} XP · Solved DSA #${problemId}: ${title}`);
    setTimeout(() => {
      setXpBanner(null);
    }, 3500);
  };

  const navigateTo = (section: NavSectionId) => {
    setActiveSection(section);
    setMobileSidebarOpen(false);
    setIsCommandPaletteOpen(false);
  };

  const handleOpenInTerminal = (payload: TerminalCodePayload) => {
    onMarkTopicCompleted(payload.chapterTitle);
    setTerminalPayload(payload);
    navigateTo('terminal');
  };

  const filteredCommands = [
    {
      id: 'home' as NavSectionId,
      title: 'Go to Workspace Home',
      category: 'Navigation',
    },
    ...SIDEBAR_NAV_ITEMS.map((item) => ({
      id: item.id,
      title: `${item.index}. ${item.label} — ${item.shortDesc}`,
      category: 'Module',
    })),
    {
      id: 'leaderboard' as NavSectionId,
      title: 'View Student Leaderboard',
      category: 'Cohort',
    },
  ].filter((cmd) =>
    cmd.title.toLowerCase().includes(commandSearch.trim().toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-[#060911] text-slate-100 flex relative overflow-hidden">
      {/* Cosmic Starfield & Diagonal Meteors (Top-Right to Bottom-Left) on Home/Dashboard */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        {HOME_STAR_POSITIONS.map((star, idx) => (
          <span
            key={idx}
            className="absolute rounded-full bg-white edoc-star-twinkle"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: `${(idx % 5) * 0.65}s`,
              boxShadow: '0 0 6px rgba(255,255,255,0.8)',
            }}
          />
        ))}
        {/* Meteors gracing diagonally downward from top-right corner to bottom-left corner */}
        <div
          className="edoc-shooting-star-bg absolute top-[8%] right-[3%] w-40 h-[2px] rounded-full bg-gradient-to-r from-white via-blue-400 to-transparent shadow-[0_0_14px_#2563eb]"
        />
        <div
          className="edoc-shooting-star-bg absolute top-[22%] right-[-4%] w-36 h-[2px] rounded-full bg-gradient-to-r from-white via-cyan-300 to-transparent shadow-[0_0_12px_#3b82f6]"
          style={{ animationDelay: '1.9s' }}
        />
        <div
          className="edoc-shooting-star-bg absolute top-[-2%] right-[24%] w-32 h-[1.5px] rounded-full bg-gradient-to-r from-white via-blue-500 to-transparent shadow-[0_0_12px_#2563eb]"
          style={{ animationDelay: '3.8s' }}
        />
      </div>

      {/* =================================================================== */}
      {/* FIXED LEFT VERTICAL SIDEBAR (6 Navigation Items + Home & Sign Out) */}
      {/* =================================================================== */}
      <aside
        aria-label="Workspace Sidebar Navigation"
        className={`fixed inset-y-0 left-0 z-40 w-[264px] bg-[#080c17] border-r border-slate-800/85 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Sidebar Brand Header */}
          <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              aria-label="EDOC Workspace Home"
              className="flex items-center gap-2.5 text-left cursor-pointer"
            >
              <EdocLogo variant="horizontal" size="sm" />
            </button>

            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close sidebar menu"
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Workspace Home Link */}
          <div className="px-3 pt-4 pb-2">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'home'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 shadow-[0_0_20px_rgba(34,211,238,0.12)]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Home className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Workspace Home</span>
              </span>
              <span className="font-mono text-[10px] text-slate-500">⌘H</span>
            </button>
          </div>

          {/* The 6 Core Navigation Items */}
          <div className="px-3 py-2">
            <div className="px-3 pb-2 text-[11px] font-mono font-semibold text-slate-500 tracking-wider">
              CURRICULUM & TOOLS (6)
            </div>
            <nav aria-label="Core Learning Modules" className="space-y-1">
              {SIDEBAR_NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group whitespace-nowrap ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.28)]'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <span
                        className={
                          isActive
                            ? 'text-slate-950'
                            : 'text-cyan-400 group-hover:text-cyan-300'
                        }
                      >
                        {MODULE_ICONS[item.id]}
                      </span>
                      <span className="truncate">
                        {item.index}. {item.label}
                      </span>
                    </span>
                    <span
                      className={`font-mono text-[10px] tabular-nums shrink-0 ${
                        isActive ? 'text-slate-900 font-bold' : 'text-slate-500'
                      }`}
                    >
                      0{item.index}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Bottom User Progress & Sign Out */}
        <div className="p-4 border-t border-slate-800/80 space-y-3 bg-[#060911]/60">
          <div className="space-y-2 px-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 truncate">
                {user.name}
              </span>
              <span className="font-mono text-cyan-400 tabular-nums">
                Lvl {levelInfo.level}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 tabular-nums">
              <span>{levelInfo.currentXp.toLocaleString()} XP</span>
              <span>Next: {levelInfo.nextLevelXp} XP</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full py-2 px-3 rounded-xl bg-[#0b101d] hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Workspace</span>
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* =================================================================== */}
      {/* MAIN VIEWPORT COLUMN (Offset by 264px Sidebar on Desktop)           */}
      {/* =================================================================== */}
      <div className="relative z-10 flex-1 lg:pl-[264px] flex flex-col min-h-screen min-w-0">
        {/* TOP HEADER BAR (Matching Dashboard_418ae0e6.jpeg) */}
        <header className="sticky top-0 z-20 h-16 bg-[#080c17]/95 backdrop-blur-md border-b border-slate-800/85 px-4 sm:px-8 flex items-center justify-between gap-6">
          {/* Left: Mobile Menu Button + Primary Top Links */}
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation sidebar"
              className="lg:hidden p-2 rounded-lg bg-[#0b101d] border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            <nav
              aria-label="Top Workspace Navigation"
              className="flex items-center gap-1 sm:gap-2 overflow-x-auto"
            >
              <button
                type="button"
                onClick={() => navigateTo('home')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeSection === 'home'
                    ? 'bg-slate-800/85 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                HOME
              </button>
              <button
                type="button"
                onClick={() => navigateTo('quiz')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeSection === 'quiz'
                    ? 'bg-slate-800/85 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                QUIZ & PRACTICE
              </button>
              <button
                type="button"
                onClick={() => navigateTo('dsa')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeSection === 'dsa'
                    ? 'bg-slate-800/85 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                DSA PROBLEMS & IDE
              </button>
              <button
                type="button"
                onClick={() => navigateTo('leaderboard')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeSection === 'leaderboard'
                    ? 'bg-slate-800/85 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                LEADERBOARD
              </button>
            </nav>
          </div>

          {/* Right: Command Palette Trigger + Student Profile */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              aria-label="Open Quick Commands"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0c1222] hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Quick Commands</span>
              <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-slate-900 border border-slate-700 text-slate-400">
                ⌘K
              </kbd>
            </button>

            <div className="flex items-center gap-3 pl-2 border-l border-slate-800/80">
              <div className="text-right leading-tight">
                <div className="text-xs sm:text-sm font-display font-bold text-white whitespace-nowrap">
                  {user.name}
                </div>
                <div className="text-[11px] font-mono text-cyan-400 tabular-nums whitespace-nowrap">
                  Level {levelInfo.level} • {levelInfo.currentXp.toLocaleString()} XP
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('leaderboard')}
                aria-label="View student profile and leaderboard rank"
                className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 text-slate-950 font-display font-bold text-xs flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.35)] cursor-pointer shrink-0"
              >
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </button>
            </div>
          </div>
        </header>

        {/* ================================================================= */}
        {/* MAIN CONTENT STAGE                                                */}
        {/* ================================================================= */}
        <main className="flex-1 px-4 sm:px-8 py-8 max-w-[1260px] w-full mx-auto flex flex-col justify-between">
          {activeSection === 'home' ? (
            <div className="space-y-10 my-auto py-4">
              {/* CENTERPIECE HERO CARD (Matching Dashboard_418ae0e6.jpeg) */}
              <section
                aria-label="Welcome to Workspace Sandbox"
                className="relative mx-auto max-w-[820px] rounded-2xl bg-[#090e1a]/95 border border-cyan-500/25 shadow-[0_0_70px_rgba(6,182,212,0.13)] px-6 sm:px-14 py-12 sm:py-14 text-center overflow-hidden"
              >
                {/* Subtle radial top highlight */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 0%, rgba(34, 211, 238, 0.12) 0%, rgba(9, 14, 26, 0) 65%)',
                  }}
                  aria-hidden="true"
                />

                <div className="relative z-10 space-y-5">
                  <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-slate-400">
                    <span className="text-emerald-400">KERNEL READY</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-cyan-400">SANDBOX ACTIVE</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-purple-300">REPL V4.8.2</span>
                  </div>

                  <p className="text-xs font-mono tracking-[0.2em] text-cyan-400">
                    INTERACTIVE SANDBOX ENVIRONMENT
                  </p>

                  <h1
                    className="text-4xl sm:text-5xl lg:text-[54px] font-display font-extrabold text-white tracking-tight leading-[1.08]"
                    style={{ textWrap: 'balance' }}
                  >
                    Welcome to Workspace
                  </h1>

                  <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-300/90 leading-relaxed">
                    A minimalist terminal and competitive coding studio.
                    Streamlined for deliberate practice, algorithmic mastery,
                    and zero distraction.
                  </p>

                  {/* Primary & Secondary Action Buttons */}
                  <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => navigateTo('quiz')}
                      className="px-7 py-3.5 rounded-xl bg-[#38bdf8] hover:bg-cyan-300 text-slate-950 font-display font-bold text-sm inline-flex items-center gap-2.5 shadow-[0_0_28px_rgba(56,189,248,0.4)] transition-all cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Practice</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTo('dsa')}
                      className="px-7 py-3.5 rounded-xl bg-[#161e2e] hover:bg-slate-800 text-slate-100 border border-slate-700/80 font-display font-bold text-sm inline-flex items-center gap-2.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <TerminalIcon className="w-4 h-4 text-cyan-400" />
                      <span>Jump to IDE</span>
                    </button>
                  </div>

                  {/* Bottom Interactive Keyboard Bar inside Hero Card */}
                  <div className="pt-7 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
                    <button
                      type="button"
                      onClick={() => setIsCommandPaletteOpen(true)}
                      className="inline-flex items-center gap-2 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-slate-300">
                        ⌘ K
                      </kbd>
                      <span>Quick Commands</span>
                    </button>

                    <span className="hidden sm:inline text-slate-700" aria-hidden="true">
                      |
                    </span>

                    <button
                      type="button"
                      onClick={() => navigateTo('dsa')}
                      className="inline-flex items-center gap-2 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-slate-300 inline-flex items-center gap-1">
                        <CornerDownLeft className="w-3 h-3" />
                      </kbd>
                      <span>Execute Suite</span>
                    </button>

                    <span className="hidden sm:inline text-slate-700" aria-hidden="true">
                      |
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsKeymapsOpen(true)}
                      className="inline-flex items-center gap-2 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-slate-300">
                        ?
                      </kbd>
                      <span>Keymaps</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* 6-ITEM MODULE DIRECTORY GRID */}
              <section aria-label="Workspace Modules Directory" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-mono font-semibold tracking-wider text-slate-400">
                    WORKSPACE TRACKS & SANDBOX MODULES (01 — 06)
                  </h2>
                  <span className="text-xs font-mono text-slate-500">
                    Select any module from the sidebar or cards below
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {SIDEBAR_NAV_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateTo(item.id)}
                      className="group text-left rounded-xl bg-[#090e1a] hover:bg-[#0d1526] border border-slate-800/90 hover:border-cyan-500/40 p-5 transition-all flex flex-col justify-between gap-4 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="p-2 rounded-lg bg-[#060911] border border-slate-800 text-cyan-400 group-hover:border-cyan-500/40">
                            {MODULE_ICONS[item.id]}
                          </span>
                          <div>
                            <div className="text-xs font-mono text-slate-500">
                              0{item.index} · {item.badgeText}
                            </div>
                            <h3 className="text-base font-display font-bold text-white group-hover:text-cyan-300 transition-colors">
                              {item.label}
                            </h3>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0" />
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        {item.shortDesc}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          ) : activeSection === 'languages' ? (
            <ProgrammingLanguagesView
              onAwardXp={handleAwardXp}
              onOpenInTerminal={handleOpenInTerminal}
            />
          ) : activeSection === 'webdev' ? (
            <WebDevView
              onAwardXp={handleAwardXp}
              onOpenInTerminal={handleOpenInTerminal}
            />
          ) : activeSection === 'sql' ? (
            <SqlWorkbenchView
              onAwardXp={handleAwardXp}
              onOpenInTerminal={handleOpenInTerminal}
            />
          ) : activeSection === 'terminal' ? (
            <TerminalSandboxView
              userName={user.name}
              incomingPayload={terminalPayload}
            />
          ) : activeSection === 'quiz' ? (
            <QuizPracticeView
              onAwardXp={handleAwardXp}
              completedTopics={user.completedTopics}
              onCompleteTopic={onMarkTopicCompleted}
            />
          ) : activeSection === 'dsa' ? (
            <DsaProblemsView
              solvedDsaIds={user.solvedDsaIds}
              onSolveProblem={handleSolveDsaProblem}
            />
          ) : (
            <LeaderboardView
              currentUser={user}
              currentUserXp={levelInfo.currentXp}
              currentUserLevel={levelInfo.level}
            />
          )}
        </main>

        {/* ================================================================= */}
        {/* FOOTER (Matching Dashboard_418ae0e6.jpeg)                          */}
        {/* ================================================================= */}
        <footer className="mt-auto border-t border-slate-800/80 bg-[#050810] px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div>— Next-Generation Developer Learning & Competitive Engine</div>
          <div className="font-mono text-[11px] text-slate-500">
            © 2026 edoc platform. Engineered for deep work.
          </div>
        </footer>
      </div>

      {/* Floating XP Reward Notification Toast */}
      {xpBanner && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0b1528] border border-emerald-500/50 shadow-[0_8px_30px_rgba(16,185,129,0.25)] text-xs font-mono text-emerald-300"
        >
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{xpBanner}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* QUICK COMMAND PALETTE MODAL (⌘K)                                    */}
      {/* =================================================================== */}
      {isCommandPaletteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quick Command Palette"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#0b101d] border border-cyan-500/40 shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
              <Command className="w-4 h-4 text-cyan-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={commandSearch}
                onChange={(e) => setCommandSearch(e.target.value)}
                placeholder="Jump to module (Programming Languages, SQL, Terminal, DSA...)"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(false)}
                aria-label="Close Quick Commands"
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 max-h-72 overflow-y-auto divide-y divide-slate-800/50">
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => navigateTo(cmd.id)}
                  className="w-full px-3.5 py-2.5 rounded-lg hover:bg-slate-800/70 text-left flex items-center justify-between text-xs transition-colors cursor-pointer"
                >
                  <span className="text-slate-200 font-medium">{cmd.title}</span>
                  <span className="font-mono text-[10px] text-cyan-400">
                    {cmd.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* KEYMAPS MODAL (?)                                                   */}
      {/* =================================================================== */}
      {isKeymapsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Workspace Keyboard Shortcuts"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#0b101d] border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-display font-bold text-white">
                <Keyboard className="w-4 h-4 text-cyan-400" />
                <span>Workspace Keymaps</span>
              </div>
              <button
                type="button"
                onClick={() => setIsKeymapsOpen(false)}
                aria-label="Close Keymaps Modal"
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-300">Open Quick Commands</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                  ⌘ K / Ctrl+K
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-300">Execute DSA Test Suite</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                  ↵ Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-300">Close Active Dialog</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                  Esc
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
