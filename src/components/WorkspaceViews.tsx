import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Editor from '@monaco-editor/react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Terminal as TerminalIcon,
  Database,
  Code2,
  Globe,
  HelpCircle,
  Cpu,
  Trophy,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Layers,
  FileCode2,
  Clock,
  Flame,
  Zap,
  Sparkles,
  Lightbulb,
  BarChart3,
  Search,
  Send,
} from 'lucide-react';
import {
  SQL_DATABASE,
  UserProfile,
  calculateLevelFromXp,
  executeSqlQuery,
} from '../utils/edocLogic';
import { loadRegisteredUsersMap } from './AuthScreen';
import {
  PROGRAMMING_LANGUAGE_TRACKS,
  WEB_DEVELOPMENT_TRACKS,
  SQL_THEORY_CHAPTERS,
  TheoryChapter,
  LanguageTheoryTrack,
} from '../utils/theoryData';
import {
  QUIZ_BANK_TRACKS,
  getQuizTrackById,
  getQuizQuestionsForTopic,
  calculateQuizScoreBreakdown,
} from '../utils/quizBank';
import {
  DSA_300_PROBLEMS,
  DSA_CATEGORIES,
  DsaCatalogProblem,
  DsaLanguageKey,
  TerminalLanguageKey,
  filterDsa300Problems,
  getRunnableProblemTemplate,
  TERMINAL_STARTER_CODE,
  executePistonCode,
  runDsaProblemTests,
  DsaSubmissionResult,
  executeSqlJsQuery,
  SqlJsQueryResult,
  resetSqlJsDatabase,
} from '../utils/dsaAndTerminalLogic';

export interface TerminalCodePayload {
  filename: string;
  language: string;
  code: string;
  command: string;
  output: string[];
  chapterTitle: string;
}

// ============================================================================
// SHARED CHAPTER SUB-SIDEBAR + REACT MARKDOWN THEORY READER
// ============================================================================
interface TheoryChapterReaderProps {
  trackTitle: string;
  trackSubtitle: string;
  chapters: TheoryChapter[];
  selectedChapterId: string;
  onSelectChapter: (id: string) => void;
  onOpenInTerminal: (payload: TerminalCodePayload) => void;
}

const TheoryChapterReader: React.FC<TheoryChapterReaderProps> = ({
  trackTitle,
  trackSubtitle,
  chapters,
  selectedChapterId,
  onSelectChapter,
  onOpenInTerminal,
}) => {
  const activeChapter =
    chapters.find((c) => c.id === selectedChapterId) || chapters[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Chapter Sub-Sidebar */}
      <aside
        aria-label={`${trackTitle} Chapter Sub-Sidebar`}
        className="lg:col-span-4 rounded-xl bg-[#0b101d] border border-slate-800/90 p-4 space-y-3"
      >
        <div className="px-2 pb-2 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono font-semibold text-cyan-400 uppercase tracking-wider">
              CHAPTER SUB-SIDEBAR
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{trackSubtitle}</div>
          </div>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {chapters.length} Chapters
          </span>
        </div>

        <nav aria-label="Curriculum Chapters" className="space-y-1.5">
          {chapters.map((ch) => {
            const isSelected = ch.id === activeChapter.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => onSelectChapter(ch.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all flex items-start justify-between gap-2.5 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-[0_0_16px_rgba(34,211,238,0.28)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="min-w-0">
                  <div
                    className={`font-mono text-[10px] ${
                      isSelected ? 'text-slate-900 font-bold' : 'text-cyan-400'
                    }`}
                  >
                    MODULE 0{ch.moduleNumber}
                  </div>
                  <div className="truncate mt-0.5">{ch.title}</div>
                </div>
                <span
                  className={`font-mono text-[10px] tabular-nums shrink-0 mt-0.5 ${
                    isSelected ? 'text-slate-900 font-bold' : 'text-slate-500'
                  }`}
                >
                  {ch.topics.length} topics
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Detailed Markdown Theory Reader + Code Example Block */}
      <div className="lg:col-span-8 space-y-5">
        <article className="rounded-xl bg-[#0b101d] border border-slate-800/90 p-6 space-y-5">
          {/* Chapter Header */}
          <div className="border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{activeChapter.categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400 tabular-nums">
                {activeChapter.topics.length} Syllabus Topics
              </span>
            </div>
            <h3 className="text-xl font-display font-bold text-white mt-1.5">
              {activeChapter.title}
            </h3>
          </div>

          {/* Syllabus Topics List from Uploaded JSON */}
          <div className="rounded-xl bg-[#060911] border border-slate-800/80 p-4 space-y-2.5">
            <div className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Syllabus Topics Included in This Module</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-300">
              {activeChapter.topics.map((topic, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="font-mono text-cyan-400 shrink-0">
                    {idx + 1}.
                  </span>
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* React Markdown Theory Content */}
          <div className="text-sm text-slate-200 leading-relaxed space-y-3">
            <ReactMarkdown
              components={{
                h3: ({ children }) => (
                  <h4 className="text-base font-display font-bold text-white pt-1">
                    {children}
                  </h4>
                ),
                h4: ({ children }) => (
                  <h5 className="text-sm font-display font-semibold text-cyan-300 pt-2">
                    {children}
                  </h5>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-300">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-300">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-white">{children}</strong>
                ),
                code: ({ children }) => (
                  <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300">
                    {children}
                  </code>
                ),
              }}
            >
              {activeChapter.markdownContent}
            </ReactMarkdown>
          </div>

          {/* Code Example Block + Open in Terminal Button */}
          <div className="rounded-xl bg-[#060911] border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 bg-[#080d19] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <FileCode2 className="w-4 h-4 text-cyan-400" />
                <span>{activeChapter.codeFilename}</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500 uppercase">
                  {activeChapter.codeLanguage}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  onOpenInTerminal({
                    filename: activeChapter.codeFilename,
                    language: activeChapter.codeLanguage,
                    code: activeChapter.codeExample,
                    command: activeChapter.terminalCommand,
                    output: activeChapter.terminalOutput,
                    chapterTitle: activeChapter.title,
                  })
                }
                className="px-4 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 shadow-[0_0_16px_rgba(34,211,238,0.28)] transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <TerminalIcon className="w-3.5 h-3.5" />
                <span>Open in Terminal</span>
              </button>
            </div>

            <pre className="p-4 font-mono text-xs sm:text-sm text-slate-100 overflow-x-auto leading-relaxed">
              <code>{activeChapter.codeExample}</code>
            </pre>
          </div>
        </article>
      </div>
    </div>
  );
};

// ============================================================================
// 1. PROGRAMMING LANGUAGES VIEW (4 Track Cards: C, C++, Java, Python)
// ============================================================================
export const ProgrammingLanguagesView: React.FC<{
  onAwardXp: (amount: number, reason: string) => void;
  onOpenInTerminal: (payload: TerminalCodePayload) => void;
}> = ({ onAwardXp, onOpenInTerminal }) => {
  const [selectedTrackId, setSelectedTrackId] = useState<'c' | 'cpp' | 'java' | 'python'>('c');
  const activeTrack: LanguageTheoryTrack =
    PROGRAMMING_LANGUAGE_TRACKS.find((t) => t.id === selectedTrackId) ||
    PROGRAMMING_LANGUAGE_TRACKS[0];

  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    activeTrack.chapters[0].id
  );

  const handleSelectTrackCard = (track: LanguageTheoryTrack) => {
    setSelectedTrackId(track.id);
    setSelectedChapterId(track.chapters[0].id);
  };

  const handleOpenInTerminalWithXp = (payload: TerminalCodePayload) => {
    onAwardXp(25, `Opened ${payload.filename} in Terminal`);
    onOpenInTerminal(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <p className="text-xs font-mono text-cyan-400 tracking-wide">
            MODULE 01 · SYSTEMS & RUNTIME TRACKS
          </p>
          <h2 className="text-2xl font-display font-bold text-white mt-1">
            Programming Languages Studio
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Select any of the 4 core language tracks (C, C++, Java, Python) to explore chapter theory and execute code in the Terminal.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400 tabular-nums shrink-0">
          Active Track: <span className="text-cyan-400 font-semibold">{activeTrack.name} ({activeTrack.chapters.length} Modules)</span>
        </div>
      </div>

      {/* 4 Interactive Track Cards for C, C++, Java, and Python */}
      <section
        aria-label="Programming Language Tracks"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {PROGRAMMING_LANGUAGE_TRACKS.map((track) => {
          const isSelected = track.id === activeTrack.id;
          return (
            <button
              key={track.id}
              type="button"
              onClick={() => handleSelectTrackCard(track)}
              className={`text-left rounded-xl p-5 border transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                isSelected
                  ? 'bg-[#0d1526] border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.18)]'
                  : 'bg-[#0b101d] border-slate-800/90 hover:border-cyan-500/40 hover:bg-[#0d1424]'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono whitespace-nowrap">
                  <span className="text-cyan-400 shrink-0">{track.badge}</span>
                  <span className="text-slate-500 truncate">{track.compilerTag}</span>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-display font-bold text-white">
                    {track.name}
                  </h3>
                  <Code2
                    className={`w-4 h-4 ${
                      isSelected ? 'text-cyan-400' : 'text-slate-500'
                    }`}
                  />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {track.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className={isSelected ? 'text-cyan-300 font-semibold' : 'text-slate-400'}>
                  {isSelected ? 'Viewing Syllabus' : 'Open Track'}
                </span>
                <ArrowRight
                  className={`w-3.5 h-3.5 ${
                    isSelected ? 'text-cyan-400' : 'text-slate-500'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </section>

      {/* Chapter Sub-Sidebar & Detailed Markdown Theory Reader */}
      <TheoryChapterReader
        trackTitle={activeTrack.name}
        trackSubtitle={activeTrack.compilerTag}
        chapters={activeTrack.chapters}
        selectedChapterId={selectedChapterId}
        onSelectChapter={setSelectedChapterId}
        onOpenInTerminal={handleOpenInTerminalWithXp}
      />
    </div>
  );
};

// ============================================================================
// 2. WEB DEVELOPMENT VIEW (HTML, CSS, JAVASCRIPT SYLLABI + SANDBOX)
// ============================================================================
interface WebPreset {
  id: string;
  title: string;
  topic: string;
  html: string;
  css: string;
}

const WEB_PRESETS: WebPreset[] = [
  {
    id: 'grid-card',
    title: '01. Responsive Telemetry Card',
    topic: 'CSS Grid & Custom Properties',
    html: `<div class="edoc-card">
  <div class="edoc-kicker">EDGE CLUSTER · US-WEST</div>
  <h3>Distributed Cache Node</h3>
  <p>99.98% hit ratio across 12 edge PoPs with sub-millisecond read latency.</p>
  <div class="edoc-metrics">
    <div><strong>1.4ms</strong><span>P99 Latency</span></div>
    <div><strong>42.8K</strong><span>Req / Sec</span></div>
  </div>
</div>`,
    css: `.edoc-card {
  background: #0d1526;
  border: 1px solid rgba(34, 211, 238, 0.35);
  border-radius: 12px;
  padding: 20px;
  color: #f1f5f9;
  font-family: system-ui, sans-serif;
}
.edoc-kicker {
  color: #22d3ee;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.edoc-card h3 {
  margin: 8px 0 6px;
  font-size: 18px;
}
.edoc-card p {
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.5;
}
.edoc-metrics {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #1e293b;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.edoc-metrics strong {
  display: block;
  color: #4ade80;
  font-size: 18px;
}
.edoc-metrics span {
  color: #64748b;
  font-size: 12px;
}`,
  },
  {
    id: 'flex-navbar',
    title: '02. Flexbox Command Bar',
    topic: 'Flexbox Alignment & Spacing',
    html: `<nav class="cmd-nav">
  <span class="brand">edoc.dev</span>
  <div class="links">
    <span>Docs</span>
    <span>Sandbox</span>
    <span>Benchmarks</span>
  </div>
  <button class="cta">Deploy</button>
</nav>`,
    css: `.cmd-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #0b1120;
  border: 1px solid #1e293b;
  padding: 14px 20px;
  border-radius: 10px;
  color: #f8fafc;
}
.brand {
  color: #22d3ee;
  font-weight: 800;
}
.links {
  display: flex;
  gap: 18px;
  font-size: 13px;
  color: #cbd5e1;
}
.cta {
  background: #f59e0b;
  color: #090d16;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
}`,
  },
];

export const WebDevView: React.FC<{
  onAwardXp: (amount: number, reason: string) => void;
  onOpenInTerminal: (payload: TerminalCodePayload) => void;
}> = ({ onAwardXp, onOpenInTerminal }) => {
  const [selectedWebTrackId, setSelectedWebTrackId] = useState<
    'html' | 'css' | 'javascript' | 'sandbox'
  >('html');
  const activeWebTrack =
    WEB_DEVELOPMENT_TRACKS.find((t) => t.id === selectedWebTrackId) ||
    WEB_DEVELOPMENT_TRACKS[0];

  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    WEB_DEVELOPMENT_TRACKS[0].chapters[0].id
  );

  // Live Sandbox states
  const [presetId, setPresetId] = useState<string>(WEB_PRESETS[0].id);
  const currentPreset =
    WEB_PRESETS.find((p) => p.id === presetId) || WEB_PRESETS[0];
  const [htmlCode, setHtmlCode] = useState(currentPreset.html);
  const [cssCode, setCssCode] = useState(currentPreset.css);
  const [activeEditorTab, setActiveEditorTab] = useState<'html' | 'css'>('html');
  const [statusMessage, setStatusMessage] = useState<string>(
    'Live DOM preview synced.'
  );

  const handleSelectWebTrack = (id: 'html' | 'css' | 'javascript' | 'sandbox') => {
    setSelectedWebTrackId(id);
    if (id !== 'sandbox') {
      const found = WEB_DEVELOPMENT_TRACKS.find((t) => t.id === id);
      if (found) {
        setSelectedChapterId(found.chapters[0].id);
      }
    }
  };

  const handleSelectPreset = (preset: WebPreset) => {
    setPresetId(preset.id);
    setHtmlCode(preset.html);
    setCssCode(preset.css);
    setStatusMessage(`Loaded template: ${preset.title}`);
  };

  const handleVerifyLayout = () => {
    setStatusMessage('DOM structure & CSS layout verified (+25 XP).');
    onAwardXp(25, 'Verified Web Development layout');
  };

  const srcDocContent = `<!doctype html>
<html>
<head>
<style>
  body { margin: 0; padding: 20px; background: #060911; color: #f8fafc; font-family: system-ui, sans-serif; }
  ${cssCode}
</style>
</head>
<body>${htmlCode}</body>
</html>`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <p className="text-xs font-mono text-cyan-400 tracking-wide">
            MODULE 02 · FRONTEND ARCHITECTURE & DOM
          </p>
          <h2 className="text-2xl font-display font-bold text-white mt-1">
            Web Development Curriculum & Sandbox
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Explore the complete HTML5, CSS3, and JavaScript theory modules or test live layouts in the DOM Sandbox.
          </p>
        </div>

        {/* Track Switcher: HTML, CSS, JavaScript, Live Sandbox */}
        <div
          role="tablist"
          aria-label="Web Development Tracks"
          className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#090d16] border border-slate-800/90 shrink-0"
        >
          {WEB_DEVELOPMENT_TRACKS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selectedWebTrackId === t.id}
              onClick={() => handleSelectWebTrack(t.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedWebTrackId === t.id
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.28)]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {t.name}
            </button>
          ))}
          <button
            type="button"
            role="tab"
            aria-selected={selectedWebTrackId === 'sandbox'}
            onClick={() => handleSelectWebTrack('sandbox')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              selectedWebTrackId === 'sandbox'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.28)]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            DOM Sandbox
          </button>
        </div>
      </div>

      {selectedWebTrackId !== 'sandbox' ? (
        <TheoryChapterReader
          trackTitle={activeWebTrack.name}
          trackSubtitle={activeWebTrack.title}
          chapters={activeWebTrack.chapters}
          selectedChapterId={selectedChapterId}
          onSelectChapter={setSelectedChapterId}
          onOpenInTerminal={(payload) => {
            onAwardXp(25, `Opened ${payload.filename} in Terminal`);
            onOpenInTerminal(payload);
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-end gap-2">
            {WEB_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  preset.id === presetId
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-[#0b101d] text-slate-300 border border-slate-800 hover:text-white'
                }`}
              >
                {preset.title}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left HTML / CSS Code Editor */}
            <div className="lg:col-span-6 rounded-xl bg-[#0b101d] border border-slate-800/90 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 bg-[#060911] p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveEditorTab('html')}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold cursor-pointer ${
                        activeEditorTab === 'html'
                          ? 'bg-cyan-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      index.html
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveEditorTab('css')}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold cursor-pointer ${
                        activeEditorTab === 'css'
                          ? 'bg-cyan-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      styles.css
                    </button>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {currentPreset.topic}
                  </span>
                </div>

                <label htmlFor="webdev-code-input" className="sr-only">
                  Web Development Code Editor
                </label>
                <textarea
                  id="webdev-code-input"
                  rows={12}
                  value={activeEditorTab === 'html' ? htmlCode : cssCode}
                  onChange={(e) =>
                    activeEditorTab === 'html'
                      ? setHtmlCode(e.target.value)
                      : setCssCode(e.target.value)
                  }
                  className="w-full rounded-xl bg-[#060911] border border-slate-800 focus:border-cyan-500/60 p-4 font-mono text-xs sm:text-sm text-slate-100 leading-relaxed outline-none"
                />
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
                <span className="text-xs text-emerald-400 font-mono">
                  {statusMessage}
                </span>
                <button
                  type="button"
                  onClick={handleVerifyLayout}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verify Layout (+25 XP)
                </button>
              </div>
            </div>

            {/* Right Live Preview Surface */}
            <div className="lg:col-span-6 rounded-xl bg-[#070a12] border border-slate-800/90 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Live Viewport Preview</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    100% Scale
                  </span>
                </div>

                <iframe
                  title="Web Development Live Preview"
                  srcDoc={srcDocContent}
                  className="w-full h-[270px] rounded-xl border border-slate-800/80 bg-[#060911]"
                  sandbox="allow-scripts"
                />
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
                <span>HTML Nodes: {htmlCode.split('<').length - 1}</span>
                <span>CSS Rules: {cssCode.split('{').length - 1}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. SQL WORKBENCH & THEORY VIEW
// ============================================================================
const SQL_PRESETS = [
  {
    label: 'Top Students by XP',
    query: 'SELECT id, name, major, level, xp FROM students ORDER BY xp DESC;',
  },
  {
    label: 'Accepted Submissions (JOIN)',
    query:
      "SELECT * FROM students JOIN submissions ON students.id = submissions.student_id WHERE status = 'Accepted';",
  },
  {
    label: 'Cohort XP by Major (GROUP BY)',
    query:
      'SELECT major, COUNT(*) AS student_count, AVG(xp) AS avg_xp FROM students GROUP BY major;',
  },
  {
    label: 'Courses Catalog',
    query:
      'SELECT course_id, title, category, difficulty, enrolled FROM courses ORDER BY enrolled DESC;',
  },
];

export const SqlWorkbenchView: React.FC<{
  onAwardXp: (amount: number, reason: string) => void;
  onOpenInTerminal: (payload: TerminalCodePayload) => void;
}> = ({ onAwardXp, onOpenInTerminal }) => {
  const [selectedSqlChapterId, setSelectedSqlChapterId] = useState<string>(
    SQL_THEORY_CHAPTERS[0].id
  );
  const [sqlInput, setSqlInput] = useState<string>(SQL_PRESETS[0].query);
  const [result, setResult] = useState(() =>
    executeSqlQuery(SQL_PRESETS[0].query)
  );
  const [activeTableTab, setActiveTableTab] = useState<string>('students');

  const handleRunSql = (queryToRun?: string) => {
    const q = queryToRun ?? sqlInput;
    if (queryToRun) {
      setSqlInput(queryToRun);
    }
    const res = executeSqlQuery(q);
    setResult(res);
    if (!res.error && res.rowCount > 0) {
      onAwardXp(15, 'Executed valid SQL query');
    }
  };

  const activeSchema = SQL_DATABASE[activeTableTab] || SQL_DATABASE.students;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <p className="text-xs font-mono text-cyan-400 tracking-wide">
            MODULE 03 · RELATIONAL DATABASE ENGINE & CURRICULUM
          </p>
          <h2 className="text-2xl font-display font-bold text-white mt-1">
            SQL Theory & Query Workbench
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Study relational algebra, DDL/DML, aggregations, and joins in the theory reader or run live queries below.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {SQL_PRESETS.map((preset, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleRunSql(preset.query)}
              className="px-3 py-1.5 rounded-lg bg-[#0b101d] hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* SQL Chapter Sub-Sidebar + Markdown Theory Reader */}
      <TheoryChapterReader
        trackTitle="SQL"
        trackSubtitle="Relational Algebra, DDL, DML, Joins & ACID"
        chapters={SQL_THEORY_CHAPTERS}
        selectedChapterId={selectedSqlChapterId}
        onSelectChapter={setSelectedSqlChapterId}
        onOpenInTerminal={(payload) => {
          onAwardXp(25, `Opened ${payload.filename} in Terminal`);
          onOpenInTerminal(payload);
        }}
      />

      {/* Interactive SQL Query Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2 border-t border-slate-800/80">
        {/* Schema Explorer Column */}
        <div className="lg:col-span-4 rounded-xl bg-[#0b101d] border border-slate-800/90 p-5">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-3">
            <Database className="w-4 h-4" />
            <span>SCHEMA EXPLORER (3 TABLES)</span>
          </div>

          <div className="flex gap-1.5 mb-4 p-1 rounded-lg bg-[#060911] border border-slate-800">
            {Object.keys(SQL_DATABASE).map((tName) => (
              <button
                key={tName}
                type="button"
                onClick={() => setActiveTableTab(tName)}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-mono font-semibold cursor-pointer ${
                  activeTableTab === tName
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tName}
              </button>
            ))}
          </div>

          <div className="divide-y divide-slate-800/70 text-xs font-mono">
            {activeSchema.columns.map((col) => (
              <div
                key={col.name}
                className="py-2 flex items-center justify-between"
              >
                <span className="text-slate-200 font-medium">
                  {col.name}
                  {col.key && (
                    <span className="ml-2 text-[10px] text-amber-400">
                      [{col.key}]
                    </span>
                  )}
                </span>
                <span className="text-slate-500">{col.type}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 font-mono tabular-nums">
            Total Rows in {activeSchema.tableName}: {activeSchema.rows.length}
          </div>
        </div>

        {/* Query Editor & Results Table */}
        <div className="lg:col-span-8 space-y-5">
          <div className="rounded-xl bg-[#0b101d] border border-slate-800/90 p-5">
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="sql-query-input"
                className="text-xs font-mono text-slate-400"
              >
                SQL Query Buffer (PostgreSQL / SQLite Compatible)
              </label>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                Latency: {result.executionTimeMs}ms
              </span>
            </div>
            <textarea
              id="sql-query-input"
              rows={4}
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              className="w-full rounded-xl bg-[#060911] border border-slate-800 focus:border-cyan-500/60 p-3.5 font-mono text-xs sm:text-sm text-cyan-100 outline-none"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Supports <code className="text-cyan-300">SELECT</code>,{' '}
                <code className="text-cyan-300">WHERE</code>,{' '}
                <code className="text-cyan-300">ORDER BY</code>,{' '}
                <code className="text-cyan-300">JOIN</code>, and{' '}
                <code className="text-cyan-300">GROUP BY</code>.
              </span>
              <button
                type="button"
                onClick={() => handleRunSql()}
                className="px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Execute SQL Query
              </button>
            </div>
          </div>

          {/* Results Grid */}
          <div className="rounded-xl bg-[#070a12] border border-slate-800/90 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">Query Result Set</span>
              <span className="text-emerald-400 tabular-nums">
                {result.error
                  ? 'Query Error'
                  : `${result.rowCount} rows returned`}
              </span>
            </div>

            {result.error ? (
              <div className="p-5 text-xs font-mono text-rose-400 flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{result.error}</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#0b101d]/70 font-mono text-[11px] text-slate-400">
                      {result.columns.map((col) => (
                        <th
                          key={col}
                          className="py-2.5 px-3 font-semibold whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                    {result.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        {result.columns.map((col) => (
                          <td
                            key={col}
                            className="py-2.5 px-3 text-slate-200 whitespace-nowrap"
                          >
                            {String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. TERMINAL VIEW (Monaco vs-dark + Piston API + sql.js WASM + Web Preview)
// ============================================================================
const TERMINAL_LANGUAGES: {
  id: TerminalLanguageKey;
  label: string;
  monacoLang: string;
  filename: string;
  badge: string;
}[] = [
  {
    id: 'c',
    label: 'C',
    monacoLang: 'c',
    filename: 'main.c',
    badge: 'GCC 10.2 · Piston API',
  },
  {
    id: 'cpp',
    label: 'C++',
    monacoLang: 'cpp',
    filename: 'main.cpp',
    badge: 'G++ 10.2 · Piston API',
  },
  {
    id: 'java',
    label: 'Java',
    monacoLang: 'java',
    filename: 'Main.java',
    badge: 'OpenJDK 15 · Piston API',
  },
  {
    id: 'python',
    label: 'Python',
    monacoLang: 'python',
    filename: 'main.py',
    badge: 'Python 3.10 · Piston API',
  },
  {
    id: 'sql',
    label: 'SQL',
    monacoLang: 'sql',
    filename: 'query.sql',
    badge: 'sql.js · SQLite WebAssembly',
  },
  {
    id: 'web',
    label: 'Web',
    monacoLang: 'html',
    filename: 'index.html',
    badge: 'Live HTML / CSS / JS Preview',
  },
];

const TERMINAL_SQL_PRESETS = [
  {
    label: 'SELECT Top Students',
    query:
      'SELECT id, name, major, level, xp FROM students ORDER BY xp DESC;',
  },
  {
    label: 'JOIN Submissions',
    query:
      "SELECT s.name, s.major, sub.problem_title, sub.language, sub.runtime_ms, sub.status FROM students s JOIN submissions sub ON s.id = sub.student_id WHERE sub.status = 'Accepted';",
  },
  {
    label: 'CREATE TABLE + INSERT',
    query: `CREATE TABLE IF NOT EXISTS hackathons (
  id INTEGER PRIMARY KEY,
  event_name TEXT NOT NULL,
  team_size INTEGER NOT NULL,
  prize_pool INTEGER NOT NULL
);
INSERT INTO hackathons (event_name, team_size, prize_pool) VALUES
  ('EDOC Systems Cup', 4, 10000),
  ('Global Algo Sprint', 3, 7500);
SELECT * FROM hackathons;`,
  },
];

function mapPayloadLanguageToTerminal(rawLang: string): TerminalLanguageKey {
  const clean = rawLang.trim().toLowerCase();
  if (clean === 'c') return 'c';
  if (clean === 'cpp' || clean === 'c++') return 'cpp';
  if (clean === 'java') return 'java';
  if (clean === 'python' || clean === 'py') return 'python';
  if (clean === 'sql') return 'sql';
  if (
    clean === 'html' ||
    clean === 'css' ||
    clean === 'javascript' ||
    clean === 'js' ||
    clean === 'web'
  ) {
    return 'web';
  }
  return 'python';
}

export const TerminalSandboxView: React.FC<{
  userName: string;
  incomingPayload?: TerminalCodePayload | null;
}> = ({ incomingPayload }) => {
  const [selectedLang, setSelectedLang] = useState<TerminalLanguageKey>(() =>
    incomingPayload
      ? mapPayloadLanguageToTerminal(incomingPayload.language)
      : 'python'
  );
  const [codeByLang, setCodeByLang] = useState<
    Record<TerminalLanguageKey, string>
  >(() => {
    const initial = { ...TERMINAL_STARTER_CODE };
    if (incomingPayload) {
      const mapped = mapPayloadLanguageToTerminal(incomingPayload.language);
      initial[mapped] = incomingPayload.code;
    }
    return initial;
  });

  const [stdinInput, setStdinInput] = useState<string>('4\n10 20 30 40');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [consoleOutput, setConsoleOutput] = useState<{
    stdout: string;
    stderr: string;
    exitCode: number;
    executionTimeMs: number;
    engineLabel: string;
  }>(() => ({
    stdout: incomingPayload
      ? `[Loaded ${incomingPayload.filename} from ${incomingPayload.chapterTitle}]\n` +
        incomingPayload.output.join('\n')
      : '[Python 3.10 Runtime] Count = 4 | Values = [10, 20, 30, 40] | Sum = 100\n',
    stderr: '',
    exitCode: 0,
    executionTimeMs: 18,
    engineLabel: 'Piston API (https://emkc.org/api/v2/piston/execute)',
  }));

  // SQL.js state for SQL mode
  const [sqlResult, setSqlResult] = useState<SqlJsQueryResult | null>(null);
  const [sqlLoading, setSqlLoading] = useState<boolean>(false);

  // Sync incoming payload from "Open in Terminal" button in Theory Reader
  useEffect(() => {
    if (incomingPayload) {
      const mapped = mapPayloadLanguageToTerminal(incomingPayload.language);
      setSelectedLang(mapped);
      setCodeByLang((prev) => ({
        ...prev,
        [mapped]: incomingPayload.code,
      }));
      setConsoleOutput({
        stdout:
          `[Loaded ${incomingPayload.filename} from ${incomingPayload.chapterTitle}]\n` +
          incomingPayload.output.join('\n'),
        stderr: '',
        exitCode: 0,
        executionTimeMs: 14,
        engineLabel: 'Piston API (https://emkc.org/api/v2/piston/execute)',
      });
    }
  }, [incomingPayload]);

  // Pre-initialize SQLite WebAssembly table result when switching to SQL
  useEffect(() => {
    if (selectedLang === 'sql' && !sqlResult) {
      setSqlLoading(true);
      executeSqlJsQuery(codeByLang.sql)
        .then((res) => {
          setSqlResult(res);
        })
        .finally(() => {
          setSqlLoading(false);
        });
    }
  }, [selectedLang, sqlResult, codeByLang.sql]);

  const currentLangMeta =
    TERMINAL_LANGUAGES.find((l) => l.id === selectedLang) ||
    TERMINAL_LANGUAGES[3];
  const currentCode = codeByLang[selectedLang];

  const handleCodeChange = (newVal: string | undefined) => {
    setCodeByLang((prev) => ({
      ...prev,
      [selectedLang]: newVal ?? '',
    }));
  };

  const handleRunCode = async () => {
    if (selectedLang === 'sql') {
      setSqlLoading(true);
      const res = await executeSqlJsQuery(currentCode);
      setSqlResult(res);
      setSqlLoading(false);
      return;
    }

    if (selectedLang === 'web') {
      // Web preview updates live via srcDoc, but clicking Run Code confirms refresh
      setConsoleOutput({
        stdout: 'Live HTML/CSS/JS DOM preview refreshed.',
        stderr: '',
        exitCode: 0,
        executionTimeMs: 6,
        engineLabel: 'Split-Screen Preview Iframe',
      });
      return;
    }

    setIsRunning(true);
    try {
      const res = await executePistonCode({
        language: selectedLang,
        code: currentCode,
        stdin: stdinInput,
      });
      setConsoleOutput({
        stdout: res.stdout,
        stderr: res.stderr,
        exitCode: res.exitCode,
        executionTimeMs: res.executionTimeMs,
        engineLabel: `Piston API (${res.language} ${res.version})`,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleResetLanguageTemplate = async () => {
    const defaultTemplate = TERMINAL_STARTER_CODE[selectedLang];
    setCodeByLang((prev) => ({
      ...prev,
      [selectedLang]: defaultTemplate,
    }));
    if (selectedLang === 'sql') {
      await resetSqlJsDatabase();
      const res = await executeSqlJsQuery(defaultTemplate);
      setSqlResult(res);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Language Selector Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <p className="text-xs font-mono text-cyan-400 tracking-wide">
            MODULE 04 · MONACO VS-DARK STUDIO &amp; MULTI-RUNTIME SANDBOX
          </p>
          <h2 className="text-2xl font-display font-bold text-white mt-1">
            Terminal &amp; Polyglot Execution Studio
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Compile C, C++, Java, and Python via the Piston API, run SQLite WebAssembly (sql.js) queries, or preview live HTML/CSS/JS.
          </p>
        </div>

        {/* Language Selector Dropdown + Quick Pill Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="terminal-language-selector"
              className="text-xs font-mono text-slate-400 whitespace-nowrap"
            >
              Language Selector:
            </label>
            <select
              id="terminal-language-selector"
              aria-label="Language Selector"
              value={selectedLang}
              onChange={(e) =>
                setSelectedLang(e.target.value as TerminalLanguageKey)
              }
              className="rounded-xl bg-[#090d16] border border-slate-800 focus:border-cyan-400 px-3 py-2 text-xs font-mono font-semibold text-white outline-none cursor-pointer"
            >
              {TERMINAL_LANGUAGES.map((l) => (
                <option key={l.id} value={l.id} className="bg-[#0b101d] text-white">
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div
            role="tablist"
            aria-label="Terminal Languages"
            className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#090d16] border border-slate-800"
          >
            {TERMINAL_LANGUAGES.map((l) => {
              const active = selectedLang === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedLang(l.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_14px_rgba(34,211,238,0.3)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Incoming Payload Notification if passed from Theory Reader */}
      {incomingPayload && (
        <div className="rounded-xl bg-[#0b101d] border border-cyan-500/40 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-white font-semibold">
              Loaded from Theory Reader: {incomingPayload.filename}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-cyan-300">{incomingPayload.chapterTitle}</span>
          </div>
          <span className="text-emerald-400">
            Ready in {currentLangMeta.label} Editor
          </span>
        </div>
      )}

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT PANE (7 Cols for C/C++/Java/Python/SQL, 6 Cols for Web): Monaco Editor (vs-dark) */}
        <div
          className={`${
            selectedLang === 'web' ? 'lg:col-span-6' : 'lg:col-span-7'
          } rounded-2xl bg-[#0b101d] border border-slate-800/90 overflow-hidden flex flex-col justify-between`}
        >
          {/* Editor Top Bar */}
          <div className="px-4 py-3 bg-[#070b14] border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs font-mono">
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              <span className="text-white font-semibold">
                {currentLangMeta.filename}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 text-[11px]">
                {currentLangMeta.badge}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetLanguageTemplate}
                className="px-3 py-1.5 rounded-lg bg-[#0b101d] hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                disabled={isRunning || sqlLoading}
                onClick={handleRunCode}
                className="px-4 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-bold text-xs inline-flex items-center gap-1.5 shadow-[0_0_18px_rgba(34,211,238,0.3)] cursor-pointer whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {isRunning || sqlLoading ? 'Running...' : 'Run Code'}
                </span>
              </button>
            </div>
          </div>

          {/* Monaco Editor Container (vs-dark theme) */}
          <div className="relative bg-[#1e1e1e] min-h-[380px]">
            <Editor
              height="380px"
              theme="vs-dark"
              language={currentLangMeta.monacoLang}
              value={currentCode}
              onChange={handleCodeChange}
              loading={
                <textarea
                  aria-label="Terminal Code Editor"
                  value={currentCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full h-[380px] bg-[#1e1e1e] text-slate-100 font-mono text-xs sm:text-sm p-4 outline-none border-none resize-none"
                />
              }
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 14, bottom: 14 },
              }}
            />
          </div>

          {/* Editor Footer */}
          <div className="px-4 py-2.5 bg-[#070b14] border-t border-slate-800/90 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Theme: vs-dark (@monaco-editor/react)</span>
            <span>
              Lines: {currentCode.split('\n').length} · UTF-8
            </span>
          </div>
        </div>

        {/* RIGHT PANE: Mode-Specific Output / SQL Table / Web Live Iframe */}
        {selectedLang === 'web' ? (
          /* WEB MODE: Live Split-Screen Preview Iframe */
          <div className="lg:col-span-6 rounded-2xl bg-[#0b101d] border border-slate-800/90 overflow-hidden flex flex-col justify-between">
            <div className="px-4 py-3 bg-[#070b14] border-b border-slate-800/90 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-200">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold">
                  Live Split-Screen Web Preview (HTML / CSS / JS)
                </span>
              </div>
              <span className="text-emerald-400">● Live DOM Active</span>
            </div>

            <div className="p-4 flex-1 bg-[#060911] flex flex-col">
              <iframe
                title="Terminal Web Live Preview"
                srcDoc={currentCode}
                sandbox="allow-scripts"
                className="w-full h-[360px] flex-1 rounded-xl border border-slate-800 bg-[#060911]"
              />
            </div>

            <div className="px-4 py-2.5 bg-[#070b14] border-t border-slate-800/90 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Sandboxed iframe (allow-scripts)</span>
              <span>Auto-syncs with Monaco Editor</span>
            </div>
          </div>
        ) : selectedLang === 'sql' ? (
          /* SQL MODE: sql.js (SQLite WebAssembly) Pre-loaded Tables & HTML Results Table */
          <div className="lg:col-span-5 rounded-2xl bg-[#0b101d] border border-slate-800/90 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                  <Database className="w-4 h-4" />
                  <span className="font-semibold">
                    SQL.JS (SQLITE WEBASSEMBLY) RESULTS
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Tables: students, courses, submissions, problems
                </span>
              </div>

              {/* Preset SQL Buttons for SELECT, JOIN, CREATE TABLE */}
              <div className="flex flex-wrap items-center gap-1.5">
                {TERMINAL_SQL_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={async () => {
                      setCodeByLang((prev) => ({
                        ...prev,
                        sql: preset.query,
                      }));
                      setSqlLoading(true);
                      const res = await executeSqlJsQuery(preset.query);
                      setSqlResult(res);
                      setSqlLoading(false);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#060911] hover:bg-slate-800 border border-slate-800 text-xs font-mono text-cyan-300 cursor-pointer transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {sqlResult?.message && (
                <div className="px-3 py-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs font-mono text-emerald-300">
                  {sqlResult.message}
                </div>
              )}

              {/* HTML Results Table */}
              <div className="rounded-xl bg-[#060911] border border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-[#080d19] border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">
                    HTML Query Results Table
                  </span>
                  <span className="text-emerald-400 tabular-nums">
                    {sqlResult?.error
                      ? 'Query Error'
                      : `${sqlResult?.rowCount ?? 0} rows · ${
                          sqlResult?.executionTimeMs ?? 1
                        }ms`}
                  </span>
                </div>

                {sqlResult?.error ? (
                  <div className="p-4 text-xs font-mono text-rose-400 flex items-start gap-2">
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{sqlResult.error}</span>
                  </div>
                ) : sqlResult && sqlResult.columns.length > 0 ? (
                  <div className="overflow-x-auto max-h-[260px]">
                    <table
                      aria-label="SQLite Query Results Table"
                      className="w-full text-left border-collapse text-xs font-mono"
                    >
                      <thead>
                        <tr className="border-b border-slate-800 bg-[#0b101d] text-cyan-300">
                          {sqlResult.columns.map((col) => (
                            <th
                              key={col}
                              className="py-2.5 px-3 font-semibold whitespace-nowrap"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 tabular-nums">
                        {sqlResult.rows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className="hover:bg-slate-800/40 transition-colors"
                          >
                            {sqlResult.columns.map((col) => (
                              <td
                                key={col}
                                className="py-2 px-3 text-slate-200 whitespace-nowrap"
                              >
                                {String(row[col] ?? 'NULL')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 text-xs font-mono text-slate-400">
                    Click &quot;Run Code&quot; to execute your SQLite query and view the HTML results table.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Engine: sql.js (SQLite 3 WebAssembly)</span>
              <span>Supports SELECT, JOIN, CREATE TABLE, INSERT</span>
            </div>
          </div>
        ) : (
          /* C, C++, JAVA, PYTHON MODE: Custom Stdin Input Box + Piston API Output Console */
          <div className="lg:col-span-5 rounded-2xl bg-[#0b101d] border border-slate-800/90 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Custom Stdin Input Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label
                    htmlFor="terminal-stdin-box"
                    className="text-cyan-400 font-semibold"
                  >
                    Custom Stdin Input (Standard Input)
                  </label>
                  <span className="text-slate-500">Passed to Piston API</span>
                </div>
                <textarea
                  id="terminal-stdin-box"
                  aria-label="Custom Stdin Input"
                  rows={3}
                  value={stdinInput}
                  onChange={(e) => setStdinInput(e.target.value)}
                  placeholder="Enter custom stdin lines..."
                  className="w-full rounded-xl bg-[#060911] border border-slate-800 focus:border-cyan-500/60 p-3 font-mono text-xs text-slate-100 outline-none"
                />
              </div>

              {/* Output Console */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                    <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Output Console (stdout / stderr)</span>
                  </span>
                  <span
                    className={`tabular-nums ${
                      consoleOutput.exitCode === 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    Exit: {consoleOutput.exitCode} ·{' '}
                    {consoleOutput.executionTimeMs}ms
                  </span>
                </div>

                <div
                  aria-label="Piston Output Console"
                  className="rounded-xl bg-[#050811] border border-slate-800 p-4 font-mono text-xs sm:text-sm min-h-[210px] max-h-[260px] overflow-y-auto space-y-2"
                >
                  {isRunning ? (
                    <div className="text-cyan-300 animate-pulse">
                      Executing {currentLangMeta.filename} via Piston API (https://emkc.org/api/v2/piston/execute)...
                    </div>
                  ) : (
                    <>
                      {consoleOutput.stdout && (
                        <pre className="whitespace-pre-wrap text-emerald-400 leading-relaxed">
                          {consoleOutput.stdout}
                        </pre>
                      )}
                      {consoleOutput.stderr && (
                        <pre className="whitespace-pre-wrap text-rose-400 leading-relaxed">
                          {consoleOutput.stderr}
                        </pre>
                      )}
                      {!consoleOutput.stdout && !consoleOutput.stderr && (
                        <div className="text-slate-500">
                          Program finished with no output.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="truncate">{consoleOutput.engineLabel}</span>
              <span className="text-cyan-400 shrink-0">emkc.org/api/v2/piston</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 5. QUIZ & PRACTICE VIEW (Curriculum Tool 5: Quiz Session)
// ============================================================================
export const QuizPracticeView: React.FC<{
  onAwardXp: (amount: number, reason: string) => void;
  completedTopics: string[];
  onCompleteTopic: (topicKey: string) => void;
}> = ({ onAwardXp, completedTopics, onCompleteTopic }) => {
  // Active track & topic state (synchronized across dropdowns, catalog cards, and Quiz Navigator)
  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    QUIZ_BANK_TRACKS[0].id
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    QUIZ_BANK_TRACKS[0].topics[0].id
  );
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(
    'Medium'
  );

  const [activeTrackId, setActiveTrackId] = useState<string>(
    QUIZ_BANK_TRACKS[0].id
  );
  const [activeTopicId, setActiveTopicId] = useState<string>(
    QUIZ_BANK_TRACKS[0].topics[0].id
  );
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // Store answers per track+topic set so switching between Q1-Q6 and Q7-Q12 never mixes or locks state
  const [answersByTopicKey, setAnswersByTopicKey] = useState<
    Record<string, Record<number, number>>
  >({});
  const [awardedQuestionIds, setAwardedQuestionIds] = useState<string[]>([]);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Interactive Quiz Timer (180 seconds = 03:00 countdown + elapsed tracking)
  const QUIZ_DURATION_SECONDS = 180;
  const [secondsLeft, setSecondsLeft] = useState<number>(QUIZ_DURATION_SECONDS);
  const [timerRunning, setTimerRunning] = useState<boolean>(true);

  const dropdownTrack = getQuizTrackById(selectedTrackId);
  const {
    track: activeTrack,
    topic: activeTopic,
    questions: activeQuestions,
  } = getQuizQuestionsForTopic(activeTrackId, activeTopicId);

  const currentTopicKey = `${activeTrack.id}:${activeTopic.id}`;
  const userAnswers: Record<number, number> =
    answersByTopicKey[currentTopicKey] || {};

  const safeIdx =
    currentIdx >= 0 && currentIdx < activeQuestions.length ? currentIdx : 0;
  const currentQuestion =
    activeQuestions[safeIdx] || activeQuestions[0];

  // Countdown timer effect
  useEffect(() => {
    if (!timerRunning || showScoreBreakdown) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          setShowScoreBreakdown(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning, showScoreBreakdown]);

  const formatTimer = (totalSec: number): string => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Core helper to load any Track + Topic question set immediately into the active view
  const loadQuestionSet = (
    targetTrackId: string,
    targetTopicId: string,
    resetAnswersForSet: boolean = false,
    initialQuestionIdx: number = 0
  ) => {
    const resolvedTrack = getQuizTrackById(targetTrackId);
    const resolvedTopic =
      resolvedTrack.topics.find((t) => t.id === targetTopicId) ||
      resolvedTrack.topics[0];
    const resolvedTopicId = resolvedTopic?.id || '';

    setSelectedTrackId(resolvedTrack.id);
    setSelectedTopicId(resolvedTopicId);
    setActiveTrackId(resolvedTrack.id);
    setActiveTopicId(resolvedTopicId);
    setCurrentIdx(initialQuestionIdx);
    if (resetAnswersForSet) {
      const key = `${resolvedTrack.id}:${resolvedTopicId}`;
      setAnswersByTopicKey((prev) => ({
        ...prev,
        [key]: {},
      }));
    }
    setShowScoreBreakdown(false);
    setShowHint(false);
    setSecondsLeft(QUIZ_DURATION_SECONDS);
    setTimerRunning(true);
  };

  // Handle Track/Language dropdown change -> immediately loads the first question set of that track
  const handleTrackDropdownChange = (newTrackId: string) => {
    const nextTrack = getQuizTrackById(newTrackId);
    const firstTopicId = nextTrack.topics[0]?.id || '';
    loadQuestionSet(newTrackId, firstTopicId, false, 0);
  };

  // Handle Topic dropdown change -> immediately loads that topic's 6-question set (e.g. Q7-Q12)
  const handleTopicDropdownChange = (newTopicId: string) => {
    loadQuestionSet(selectedTrackId, newTopicId, false, 0);
  };

  // Start / Restart Quiz with selected Track & Topic
  const handleStartQuiz = (overrideTrackId?: string, overrideTopicId?: string) => {
    const targetTrackId = overrideTrackId ?? selectedTrackId;
    const targetTopicId = overrideTopicId ?? selectedTopicId;
    loadQuestionSet(targetTrackId, targetTopicId, true, 0);
  };

  // Instant feedback on option selection
  const handleSelectOption = (optionIndex: number) => {
    if (!currentQuestion) return;
    setAnswersByTopicKey((prev) => ({
      ...prev,
      [currentTopicKey]: {
        ...(prev[currentTopicKey] || {}),
        [safeIdx]: optionIndex,
      },
    }));

    const isCorrect = optionIndex === currentQuestion.correctIndex;
    if (isCorrect && !awardedQuestionIds.includes(currentQuestion.id)) {
      setAwardedQuestionIds((prev) => [...prev, currentQuestion.id]);
      onCompleteTopic(`${activeTrack.name}: ${activeTopic.title}`);
      onAwardXp(
        50,
        `Quiz Correct: ${activeTrack.name} · ${activeTopic.title}`
      );
    }
  };

  const scoreBreakdown = calculateQuizScoreBreakdown(
    activeQuestions,
    userAnswers
  );
  const timeElapsedSeconds = QUIZ_DURATION_SECONDS - secondsLeft;
  const selectedAnswerForCurrent = userAnswers[safeIdx];
  const isCurrentAnswered = selectedAnswerForCurrent !== undefined;

  // Stable 6-topic page window so clicking Set 2 (Q7 - Q12) never shifts or renumbers the cards
  const activeTopicIndexInTrack = Math.max(
    0,
    activeTrack.topics.findIndex((t) => t.id === activeTopic.id)
  );
  const catalogPageStartIndex =
    Math.floor(activeTopicIndexInTrack / 6) * 6;
  const visibleCatalogTopics = activeTrack.topics.slice(
    catalogPageStartIndex,
    catalogPageStartIndex + 6
  );

  // Global question numbering for the active 6-question set (e.g. Set 1 = Q1-Q6, Set 2 = Q7-Q12)
  const activeSetNumber = activeTopicIndexInTrack + 1;
  const activeSetQStart = activeTopicIndexInTrack * 6 + 1;
  const activeSetQEnd = activeSetQStart + activeQuestions.length - 1;
  const activeGlobalQuestionNumber = activeSetQStart + safeIdx;

  // Switch to the next 6-question set in the current track
  const handleSwitchToNextSet = () => {
    if (activeTrack.topics.length <= 1) return;
    const nextTopicIdx =
      (activeTopicIndexInTrack + 1) % activeTrack.topics.length;
    const nextTopic = activeTrack.topics[nextTopicIdx];
    if (nextTopic) {
      loadQuestionSet(activeTrack.id, nextTopic.id, false, 0);
    }
  };

  return (
    <div className="space-y-6">
      {/* ====================================================================
          TOP HERO & QUIZ CONFIGURATION CARD (Matches Quiz interface.jpeg)
         ==================================================================== */}
      <div className="rounded-2xl bg-[#0b101d] border border-blue-500/30 shadow-[0_0_35px_rgba(37,99,235,0.12)] p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-0.5 rounded bg-blue-500/20 border border-blue-400/30 text-cyan-300 font-semibold tracking-wider uppercase">
                INTERACTIVE DRILLS
              </span>
              <span className="text-emerald-400">●</span>
              <span className="text-slate-400">Session v2.4 Live</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mt-2">
              Quiz &amp; Practice Mode
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Test your computer science fundamentals with curated 6-question interactive drills, instant answer verification, and detailed runtime explanations.
            </p>
          </div>

          {/* Right Status Badges (Live User Progress) */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono shrink-0">
            <div className="px-3 py-2 rounded-lg bg-[#060911] border border-slate-800 flex items-center gap-1.5 text-slate-300 tabular-nums">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 font-semibold">
                {completedTopics.length} Topics
              </span>
              <span className="text-slate-500">Completed</span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-[#060911] border border-slate-800 flex items-center gap-1.5 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-400 font-semibold">+50 XP</span>
              <span className="text-slate-500">/ Q</span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-[#060911] border border-slate-800 flex items-center gap-1.5 text-slate-300 tabular-nums">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-white font-semibold">
                {scoreBreakdown.correctCount}/{scoreBreakdown.totalQuestions}
              </span>
              <span className="text-slate-500">Mastered</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Row: Select Track/Language, Select Topic, Difficulty, Start Quiz */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Dropdown 1: Select Track/Language */}
          <div className="md:col-span-3 space-y-1.5">
            <label
              htmlFor="select-track-language"
              className="block text-[11px] font-mono uppercase tracking-wider text-slate-400"
            >
              Select Track/Language
            </label>
            <select
              id="select-track-language"
              aria-label="Select Track/Language"
              value={selectedTrackId}
              onChange={(e) => handleTrackDropdownChange(e.target.value)}
              className="w-full rounded-xl bg-[#060911] border border-slate-800 focus:border-cyan-400 px-3.5 py-2.5 text-xs sm:text-sm text-white font-medium outline-none cursor-pointer"
            >
              {QUIZ_BANK_TRACKS.map((track) => (
                <option key={track.id} value={track.id} className="bg-[#0b101d] text-white">
                  {track.name} ({track.topics.length} Topics)
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 2: Select Topic */}
          <div className="md:col-span-4 space-y-1.5">
            <label
              htmlFor="select-quiz-topic"
              className="block text-[11px] font-mono uppercase tracking-wider text-slate-400"
            >
              Select Topic
            </label>
            <select
              id="select-quiz-topic"
              aria-label="Select Topic"
              value={selectedTopicId}
              onChange={(e) => handleTopicDropdownChange(e.target.value)}
              className="w-full rounded-xl bg-[#060911] border border-slate-800 focus:border-cyan-400 px-3.5 py-2.5 text-xs sm:text-sm text-white font-medium outline-none cursor-pointer"
            >
              {dropdownTrack.topics.map((topic, idx) => {
                const setQStart = idx * 6 + 1;
                const setQEnd = setQStart + 5;
                return (
                  <option key={topic.id} value={topic.id} className="bg-[#0b101d] text-white">
                    {idx + 1}. {topic.title} (Q{setQStart}-Q{setQEnd})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Target Difficulty Selector */}
          <div className="md:col-span-2 space-y-1.5">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Target Difficulty
            </span>
            <div className="grid grid-cols-3 rounded-xl bg-[#060911] border border-slate-800 p-1">
              {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    difficulty === level
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Start Quiz Amber Primary Button */}
          <div className="md:col-span-3">
            <button
              type="button"
              onClick={() => handleStartQuiz()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-display font-bold text-xs sm:text-sm shadow-[0_0_24px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Start Quiz</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-950/20 text-[10px] font-mono">
                6 MCQs
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          PRACTICE CATALOG & TOPIC SWITCHER BAR
         ==================================================================== */}
      <div className="rounded-2xl bg-[#0b101d] border border-blue-500/25 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-white">
                Practice Catalog &amp; Topic Switcher
              </h3>
              <p className="text-xs text-slate-400">
                Select topic module in <span className="text-cyan-300 font-medium">{activeTrack.name}</span> to instantly pivot 6-question drill sets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-cyan-300">
              6 in Set • {activeTrack.totalQuestions} Available
            </span>
            <button
              type="button"
              onClick={handleSwitchToNextSet}
              className="px-3 py-1.5 rounded-lg bg-[#060911] hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Switch Set
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {visibleCatalogTopics.map((topicItem, idx) => {
            const isTopicActive = topicItem.id === activeTopic.id;
            const globalTopicIdx = catalogPageStartIndex + idx;
            const qStart = globalTopicIdx * 6 + 1;
            const qEnd = qStart + 5;
            return (
              <button
                key={topicItem.id}
                type="button"
                onClick={() => {
                  loadQuestionSet(activeTrack.id, topicItem.id, false, 0);
                }}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isTopicActive
                    ? 'bg-blue-950/40 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                    : 'bg-[#060911] border-slate-800/90 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div>
                  <div className="text-xs font-display font-bold line-clamp-1">
                    {topicItem.title}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1 tabular-nums">
                    Q{qStart} - Q{qEnd} • 6 Items
                  </div>
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider">
                  {isTopicActive ? (
                    <span className="text-emerald-400 font-semibold">ACTIVE</span>
                  ) : (
                    <span className="text-slate-500">Load Set</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          MAIN 2-COLUMN SPLIT: QUESTION / SCORE BREAKDOWN + QUIZ NAVIGATOR
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (8 Cols): Active Question Card OR Final Score Breakdown */}
        <div className="lg:col-span-8 rounded-2xl bg-[#0b101d] border border-blue-500/30 p-6 sm:p-7 space-y-6">
          {!showScoreBreakdown ? (
            <>
              {/* Question Meta Bar + Interactive Timer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-400/30 text-cyan-300 font-semibold tabular-nums">
                    Question {safeIdx + 1} of {activeQuestions.length} (Q{activeGlobalQuestionNumber})
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 font-medium">
                    {activeTrack.name}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-cyan-400">{activeTopic.title}</span>
                </div>

                {/* Interactive Timer Control */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTimerRunning((prev) => !prev)}
                    title={timerRunning ? 'Pause Timer' : 'Resume Timer'}
                    className={`px-3 py-1.5 rounded-full border font-mono text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer tabular-nums transition-colors ${
                      secondsLeft <= 30
                        ? 'bg-rose-950/50 border-rose-500/50 text-rose-300'
                        : 'bg-[#060911] border-slate-700 text-slate-200 hover:border-cyan-400'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{formatTimer(secondsLeft)}</span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      {timerRunning ? 'LIVE' : 'PAUSED'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSecondsLeft(QUIZ_DURATION_SECONDS);
                      setTimerRunning(true);
                    }}
                    title="Reset Timer"
                    className="p-1.5 rounded-lg bg-[#060911] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Question Prompt */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                  {activeTopic.unitOrModule} · Set {activeSetNumber} (Q{activeSetQStart}–Q{activeSetQEnd}) · {difficulty} Drill
                </div>
                <h3 className="text-lg sm:text-xl font-display font-bold text-white leading-snug">
                  {currentQuestion.question}
                </h3>
              </div>

              {/* Interactive Option Selector (Instant Feedback on Selection) */}
              <div
                className="space-y-3"
                role="radiogroup"
                aria-label="Quiz Answer Options"
              >
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedAnswerForCurrent === idx;
                  const isCorrect = idx === currentQuestion.correctIndex;

                  let cardStyle =
                    'border-slate-800 bg-[#060911] hover:border-blue-500/50 text-slate-200';
                  let badgeStyle =
                    'bg-slate-900 border-slate-700 text-slate-300';

                  if (isCurrentAnswered) {
                    if (isCorrect) {
                      cardStyle =
                        'border-emerald-500/80 bg-emerald-950/30 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.12)]';
                      badgeStyle =
                        'bg-emerald-500 text-slate-950 border-emerald-400 font-bold';
                    } else if (isSelected && !isCorrect) {
                      cardStyle =
                        'border-rose-500/80 bg-rose-950/30 text-rose-100';
                      badgeStyle =
                        'bg-rose-500 text-white border-rose-400 font-bold';
                    } else {
                      cardStyle =
                        'border-slate-800/60 bg-[#060911]/60 text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${cardStyle}`}
                    >
                      <div className="flex items-center gap-3.5 text-sm">
                        <span
                          className={`w-7 h-7 rounded-lg border font-mono text-xs flex items-center justify-center shrink-0 transition-colors ${badgeStyle}`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="font-medium leading-relaxed">
                          {opt}
                        </span>
                      </div>

                      {isCurrentAnswered && isCorrect && (
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Correct</span>
                        </span>
                      )}
                      {isCurrentAnswered && isSelected && !isCorrect && (
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-rose-400 shrink-0">
                          <XCircle className="w-4 h-4" />
                          <span>Your Choice</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instant Detailed Explanation Box on Answer Selection */}
              {isCurrentAnswered && (
                <div
                  className={`rounded-xl border p-4 text-xs sm:text-sm space-y-2 ${
                    selectedAnswerForCurrent === currentQuestion.correctIndex
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-100'
                      : 'bg-amber-950/20 border-amber-500/40 text-amber-100'
                  }`}
                >
                  <div className="font-semibold flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {selectedAnswerForCurrent ===
                      currentQuestion.correctIndex ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span>
                        {selectedAnswerForCurrent ===
                        currentQuestion.correctIndex
                          ? 'Instant Feedback: Correct Answer! (+50 XP)'
                          : `Instant Feedback: Incorrect — Correct Option is ${String.fromCharCode(
                              65 + currentQuestion.correctIndex
                            )}`}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono uppercase tracking-wider opacity-80">
                      Explanation Verified
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed pl-6">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Bottom Navigation & Finish Quiz Action */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={safeIdx === 0 && activeTopicIndexInTrack === 0}
                  onClick={() => {
                    if (safeIdx > 0) {
                      setCurrentIdx(safeIdx - 1);
                      setShowHint(false);
                    } else if (activeTopicIndexInTrack > 0) {
                      const prevTopic =
                        activeTrack.topics[activeTopicIndexInTrack - 1];
                      if (prevTopic) {
                        loadQuestionSet(
                          activeTrack.id,
                          prevTopic.id,
                          false,
                          prevTopic.questions.length - 1
                        );
                      }
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 border transition-colors ${
                    safeIdx === 0 && activeTopicIndexInTrack === 0
                      ? 'bg-[#060911] border-slate-800/60 text-slate-600 cursor-not-allowed'
                      : 'bg-[#060911] border-slate-800 hover:bg-slate-800 text-slate-200 cursor-pointer'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowScoreBreakdown(true)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Finish &amp; Score Breakdown</span>
                  </button>

                  {safeIdx < activeQuestions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentIdx(safeIdx + 1);
                        setShowHint(false);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowScoreBreakdown(true)}
                      className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trophy className="w-4 h-4" />
                      <span>Submit Quiz</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* ================================================================
               FINAL SCORE BREAKDOWN PANEL
               ================================================================ */
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-semibold uppercase">
                    {scoreBreakdown.gradeLabel}
                  </span>
                  <h3 className="text-2xl font-display font-bold text-white mt-2">
                    Final Score Breakdown
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    {activeTrack.name} · {activeTopic.title} ({activeTopic.unitOrModule})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowScoreBreakdown(false)}
                    className="px-3.5 py-2 rounded-xl bg-[#060911] hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    Back to Questions
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartQuiz(activeTrack.id, activeTopic.id)}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Quiz</span>
                  </button>
                </div>
              </div>

              {/* 4 Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="rounded-xl bg-[#060911] border border-slate-800 p-4">
                  <div className="text-xs font-mono text-slate-400">Final Score</div>
                  <div className="text-2xl font-display font-bold text-white mt-1 tabular-nums">
                    {scoreBreakdown.correctCount} / {scoreBreakdown.totalQuestions}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 mt-1">
                    {scoreBreakdown.answeredCount} Answered
                  </div>
                </div>

                <div className="rounded-xl bg-[#060911] border border-slate-800 p-4">
                  <div className="text-xs font-mono text-slate-400">Accuracy</div>
                  <div className="text-2xl font-display font-bold text-cyan-400 mt-1 tabular-nums">
                    {scoreBreakdown.accuracyPercent}%
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    {scoreBreakdown.incorrectCount} Incorrect · {scoreBreakdown.unansweredCount} Skipped
                  </div>
                </div>

                <div className="rounded-xl bg-[#060911] border border-slate-800 p-4">
                  <div className="text-xs font-mono text-slate-400">XP Earned</div>
                  <div className="text-2xl font-display font-bold text-amber-400 mt-1 tabular-nums">
                    +{scoreBreakdown.xpEarned} XP
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    50 XP per correct MCQ
                  </div>
                </div>

                <div className="rounded-xl bg-[#060911] border border-slate-800 p-4">
                  <div className="text-xs font-mono text-slate-400">Time Elapsed</div>
                  <div className="text-2xl font-display font-bold text-white mt-1 tabular-nums">
                    {formatTimer(timeElapsedSeconds)}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    of 03:00 limit
                  </div>
                </div>
              </div>

              {/* Per-Question Detailed Review */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Question-by-Question Review &amp; Explanations
                </h4>
                {activeQuestions.map((q, qIdx) => {
                  const chosen = userAnswers[qIdx];
                  const isCorrect = chosen === q.correctIndex;
                  return (
                    <div
                      key={q.id}
                      className="rounded-xl bg-[#060911] border border-slate-800/90 p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-xs sm:text-sm font-semibold text-white">
                          <span className="font-mono text-cyan-400 mr-2">
                            Q{activeSetQStart + qIdx}.
                          </span>
                          {q.question}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : chosen !== undefined
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isCorrect
                            ? 'Correct (+50 XP)'
                            : chosen !== undefined
                            ? 'Incorrect'
                            : 'Unanswered'}
                        </span>
                      </div>

                      <div className="text-xs font-mono flex flex-wrap gap-4 pt-1">
                        <span className="text-slate-400">
                          Your Answer:{' '}
                          <strong
                            className={
                              isCorrect ? 'text-emerald-400' : 'text-rose-400'
                            }
                          >
                            {chosen !== undefined
                              ? `${String.fromCharCode(65 + chosen)}. ${
                                  q.options[chosen]
                                }`
                              : 'Not answered'}
                          </strong>
                        </span>
                        <span className="text-slate-400">
                          Correct Answer:{' '}
                          <strong className="text-emerald-400">
                            {String.fromCharCode(65 + q.correctIndex)}.{' '}
                            {q.options[q.correctIndex]}
                          </strong>
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-slate-800/60">
                        {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (4 Cols): Quiz Navigator + Concept Hint Engine */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quiz Navigator Card */}
          <div className="rounded-2xl bg-[#0b101d] border border-blue-500/30 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-display font-bold text-white">
                  Quiz Navigator
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  {activeTopic.title} • Set {activeSetNumber} (Q{activeSetQStart}-Q{activeSetQEnd})
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-xs font-mono text-cyan-300 tabular-nums whitespace-nowrap shrink-0">
                {scoreBreakdown.answeredCount} / {activeQuestions.length} Active
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {activeQuestions.map((q, idx) => {
                const chosen = userAnswers[idx];
                const isAnswered = chosen !== undefined;
                const isCorrect = isAnswered && chosen === q.correctIndex;
                const isCurrent = idx === safeIdx && !showScoreBreakdown;
                const globalQNum = activeSetQStart + idx;

                let btnStyle =
                  'bg-[#060911] border-slate-800 text-slate-400 hover:text-white';
                if (isCurrent) {
                  btnStyle =
                    'bg-cyan-400 border-cyan-300 text-slate-950 font-bold shadow-[0_0_16px_rgba(34,211,238,0.4)]';
                } else if (isAnswered && isCorrect) {
                  btnStyle =
                    'bg-emerald-950/60 border-emerald-500/50 text-emerald-300';
                } else if (isAnswered && !isCorrect) {
                  btnStyle =
                    'bg-rose-950/60 border-rose-500/50 text-rose-300';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    aria-label={`Question ${globalQNum}`}
                    onClick={() => {
                      setShowScoreBreakdown(false);
                      setCurrentIdx(idx);
                      setShowHint(false);
                    }}
                    className={`py-3 rounded-xl border font-mono text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${btnStyle}`}
                  >
                    <span>
                      {globalQNum < 10 ? `0${globalQNum}` : `${globalQNum}`}
                    </span>
                    <span className="text-[10px]">
                      {isAnswered ? (isCorrect ? '✓' : '✗') : '•'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                Mastered
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                In Progress
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                Unattempted
              </span>
            </div>
          </div>

          {/* Concept Hint Engine Card */}
          <div className="rounded-2xl bg-[#0b101d] border border-blue-500/30 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                <h3 className="text-base font-display font-bold text-white truncate">
                  Concept Hint Engine
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-[11px] font-mono text-purple-300 whitespace-nowrap shrink-0">
                Clue Available
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Progressive concept clues help narrow down the correct specification for{' '}
              <span className="text-slate-200 font-medium">{activeTopic.title}</span>.
            </p>

            <div className="rounded-xl bg-[#060911] border border-slate-800 p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <span className="text-cyan-400 font-semibold truncate">
                  Hint 1 • {activeTrack.name} Invariant
                </span>
                <button
                  type="button"
                  onClick={() => setShowHint((prev) => !prev)}
                  className="text-amber-400 hover:text-amber-300 underline cursor-pointer whitespace-nowrap shrink-0"
                >
                  {showHint ? 'Hide Clue' : 'Reveal Clue'}
                </button>
              </div>
              {showHint ? (
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Focus on the core syntax and runtime behavior defined in{' '}
                  {activeTopic.unitOrModule}. Click &quot;Reveal Clue&quot; to inspect the concept invariant.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// ============================================================================
// 6. DSA PROBLEMS & COMPETITIVE IDE VIEW (300 Problems Table + Split Screen)
// ============================================================================
const DSA_LANGUAGES: {
  id: DsaLanguageKey;
  label: string;
  monacoLang: string;
}[] = [
  { id: 'python', label: 'Python', monacoLang: 'python' },
  { id: 'c', label: 'C', monacoLang: 'c' },
  { id: 'cpp', label: 'C++', monacoLang: 'cpp' },
  { id: 'java', label: 'Java', monacoLang: 'java' },
  { id: 'javascript', label: 'JavaScript', monacoLang: 'javascript' },
  { id: 'sql', label: 'SQL', monacoLang: 'sql' },
];

export const DsaProblemsView: React.FC<{
  solvedDsaIds: number[];
  onSolveProblem: (problemId: number, xpReward: number, title: string) => void;
}> = ({ solvedDsaIds, onSolveProblem }) => {
  // View state: 'table' shows the searchable, filterable 300-problem catalog;
  // 'split' opens the LeetCode-style split screen for the clicked problem.
  const [viewMode, setViewMode] = useState<'table' | 'split'>('table');

  // Search & Filter states for the 300 problems table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<
    'All' | 'Easy' | 'Medium' | 'Hard'
  >('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<
    'All' | 'Solved' | 'Unsolved'
  >('All');
  const [showAllRows, setShowAllRows] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 50;

  // Solved problem IDs come directly from the authenticated user's live profile
  const solvedIds = solvedDsaIds;

  // Active Problem & Split-Screen IDE states
  const [selectedProblemId, setSelectedProblemId] = useState<number>(
    DSA_300_PROBLEMS[0].id
  );
  const [dsaLang, setDsaLang] = useState<DsaLanguageKey>('python');

  const problem: DsaCatalogProblem =
    DSA_300_PROBLEMS.find((p) => p.id === selectedProblemId) ||
    DSA_300_PROBLEMS[0];

  const [codeBuffer, setCodeBuffer] = useState<string>(() =>
    getRunnableProblemTemplate(DSA_300_PROBLEMS[0], 'python')
  );
  const [customTestInput, setCustomTestInput] = useState<string>(
    DSA_300_PROBLEMS[0].sampleTestCase.input
  );
  const [testResult, setTestResult] = useState<DsaSubmissionResult | null>(
    null
  );
  const [isRunningCode, setIsRunningCode] = useState<boolean>(false);
  const [submissionBanner, setSubmissionBanner] = useState<string | null>(null);

  // Gemini AI Hint states
  const [geminiHint, setGeminiHint] = useState<string | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState<boolean>(false);

  const filteredProblems = filterDsa300Problems(DSA_300_PROBLEMS, {
    searchQuery,
    difficulty: difficultyFilter,
    category: categoryFilter,
    statusFilter,
    solvedIds,
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProblems.length / PAGE_SIZE)
  );
  const safePage = Math.min(currentPage, totalPages);
  const visibleProblems = showAllRows
    ? filteredProblems
    : filteredProblems.slice(
        (safePage - 1) * PAGE_SIZE,
        safePage * PAGE_SIZE
      );

  const handleOpenProblem = (targetProblem: DsaCatalogProblem) => {
    setSelectedProblemId(targetProblem.id);
    setCodeBuffer(getRunnableProblemTemplate(targetProblem, dsaLang));
    setCustomTestInput(targetProblem.sampleTestCase.input);
    setTestResult(null);
    setSubmissionBanner(null);
    setGeminiHint(null);
    setViewMode('split');
  };

  const handleChangeDsaLanguage = (newLang: DsaLanguageKey) => {
    setDsaLang(newLang);
    setCodeBuffer(getRunnableProblemTemplate(problem, newLang));
    setTestResult(null);
    setSubmissionBanner(null);
  };

  const handleGetGeminiHint = async () => {
    setIsLoadingHint(true);
    try {
      const response = await fetch('/api/gemini/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: problem.title,
          category: problem.category,
          difficulty: problem.difficulty,
          description: problem.description,
          constraints: problem.constraints,
          language: dsaLang,
        }),
      });
      const data = await response.json();
      setGeminiHint(
        data.hint ||
          `Use the core ${problem.category} invariant to achieve optimal time complexity within constraints (${problem.constraints}).`
      );
    } catch {
      setGeminiHint(
        `• Algorithmic Pattern (${problem.category}): Process elements using an auxiliary lookup structure or two-pointer sweep to satisfy ${problem.constraints.replace(
          /\n/g,
          ', '
        )}.`
      );
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleRunCodeOnly = async () => {
    setIsRunningCode(true);
    setSubmissionBanner(null);
    try {
      const result = await runDsaProblemTests({
        problem,
        language: dsaLang,
        code: codeBuffer,
        customInput: customTestInput,
      });
      setTestResult(result);
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleSubmitSolution = async () => {
    setIsRunningCode(true);
    try {
      const result = await runDsaProblemTests({
        problem,
        language: dsaLang,
        code: codeBuffer,
        customInput: customTestInput,
      });
      setTestResult(result);

      if (result.allPassed) {
        const alreadySolved = solvedIds.includes(problem.id);
        if (!alreadySolved) {
          onSolveProblem(problem.id, problem.xpReward, problem.title);
        }
        setSubmissionBanner(
          `ACCEPTED · All ${result.totalCount}/${result.totalCount} test cases passed (${result.runtimeMs}ms). Problem #${problem.id} marked as Solved!`
        );
      } else {
        setSubmissionBanner(null);
      }
    } finally {
      setIsRunningCode(false);
    }
  };

  const isCurrentProblemSolved = solvedIds.includes(problem.id);
  const currentLangMeta =
    DSA_LANGUAGES.find((l) => l.id === dsaLang) || DSA_LANGUAGES[0];

  return (
    <div className="space-y-6">
      {/* Top Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <p className="text-xs font-mono text-cyan-400 tracking-wide">
            MODULE 06 · 300 CURATED DSA PROBLEMS &amp; LEETCODE SPLIT IDE
          </p>
          <h2 className="text-2xl font-display font-bold text-white mt-1">
            DSA Problems &amp; Automated Piston Judge
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Search and filter 300 algorithmic challenges across 18 categories. Click any problem to open the split-screen Monaco IDE with Gemini Hints.
          </p>
        </div>

        {/* Summary Badges & View Toggle */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-[#0b101d] border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-semibold tabular-nums">
              {solvedIds.length} / {DSA_300_PROBLEMS.length}
            </span>
            <span className="text-slate-400">Solved</span>
          </div>

          {viewMode === 'split' && (
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className="px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to 300 Problems</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === 'table' ? (
        /* ====================================================================
           VIEW 1: SEARCHABLE, FILTERABLE TABLE OF THE 300 PROBLEMS
           ==================================================================== */
        <div className="space-y-5">
          {/* Filter & Search Bar */}
          <div className="rounded-2xl bg-[#0b101d] border border-slate-800/90 p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Search Input */}
            <div className="md:col-span-4 space-y-1.5">
              <label
                htmlFor="dsa-problem-search"
                className="block text-[11px] font-mono uppercase tracking-wider text-slate-400"
              >
                Search 300 Problems
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="dsa-problem-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by #, title, or category (e.g. Two Sum)..."
                  className="w-full rounded-xl bg-[#060911] border border-slate-800 focus:border-cyan-400 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none"
                />
              </div>
            </div>

            {/* Difficulty Filter */}
            <div className="md:col-span-3 space-y-1.5">
              <label
                htmlFor="dsa-difficulty-filter"
                className="block text-[11px] font-mono uppercase tracking-wider text-slate-400"
              >
                Difficulty
              </label>
              <select
                id="dsa-difficulty-filter"
                aria-label="Filter by Difficulty"
                value={difficultyFilter}
                onChange={(e) => {
                  setDifficultyFilter(
                    e.target.value as 'All' | 'Easy' | 'Medium' | 'Hard'
                  );
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl bg-[#060911] border border-slate-800 focus:border-cyan-400 px-3.5 py-2.5 text-xs sm:text-sm text-white font-medium outline-none cursor-pointer"
              >
                <option value="All">All Difficulties (300)</option>
                <option value="Easy">Easy (120)</option>
                <option value="Medium">Medium (120)</option>
                <option value="Hard">Hard (60)</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="md:col-span-3 space-y-1.5">
              <label
                htmlFor="dsa-category-filter"
                className="block text-[11px] font-mono uppercase tracking-wider text-slate-400"
              >
                Category
              </label>
              <select
                id="dsa-category-filter"
                aria-label="Filter by Category"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl bg-[#060911] border border-slate-800 focus:border-cyan-400 px-3.5 py-2.5 text-xs sm:text-sm text-white font-medium outline-none cursor-pointer"
              >
                <option value="All">
                  All Categories ({DSA_CATEGORIES.length})
                </option>
                {DSA_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Solved Status Filter */}
            <div className="md:col-span-2 space-y-1.5">
              <label
                htmlFor="dsa-status-filter"
                className="block text-[11px] font-mono uppercase tracking-wider text-slate-400"
              >
                Solved Status
              </label>
              <select
                id="dsa-status-filter"
                aria-label="Filter by Solved Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(
                    e.target.value as 'All' | 'Solved' | 'Unsolved'
                  );
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl bg-[#060911] border border-slate-800 focus:border-cyan-400 px-3.5 py-2.5 text-xs sm:text-sm text-white font-medium outline-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Solved">Solved ({solvedIds.length})</option>
                <option value="Unsolved">
                  Unsolved ({DSA_300_PROBLEMS.length - solvedIds.length})
                </option>
              </select>
            </div>
          </div>

          {/* Table Meta & Pagination Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 px-1">
            <div>
              Showing{' '}
              <span className="text-white font-semibold tabular-nums">
                {visibleProblems.length}
              </span>{' '}
              of{' '}
              <span className="text-cyan-400 font-semibold tabular-nums">
                {filteredProblems.length}
              </span>{' '}
              matching problems (Catalog: 300 Problems)
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAllRows((prev) => !prev)}
                className="px-3 py-1.5 rounded-lg bg-[#0b101d] hover:bg-slate-800 border border-slate-800 text-cyan-300 cursor-pointer"
              >
                {showAllRows ? 'Paginate (50 / page)' : 'Show All 300'}
              </button>

              {!showAllRows && totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1.5 rounded-lg bg-[#0b101d] border border-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
                  >
                    Prev
                  </button>
                  <span className="px-2 text-slate-300 tabular-nums">
                    Page {safePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-[#0b101d] border border-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 300 Problems Table */}
          <div className="rounded-2xl bg-[#0b101d] border border-slate-800/90 overflow-hidden">
            <div className="overflow-x-auto max-h-[620px]">
              <table
                aria-label="300 DSA Problems Table"
                className="w-full text-left border-collapse text-xs sm:text-sm"
              >
                <thead className="sticky top-0 z-10 bg-[#070a12] border-b border-slate-800 font-mono text-xs text-slate-400">
                  <tr>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">#</th>
                    <th className="py-3.5 px-4">Problem Title</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Difficulty</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 tabular-nums">
                  {visibleProblems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 px-4 text-center font-mono text-slate-400"
                      >
                        No problems match your current filters. Try clearing the search or status filter.
                      </td>
                    </tr>
                  ) : (
                    visibleProblems.map((item) => {
                      const isSolved = solvedIds.includes(item.id);
                      return (
                        <tr
                          key={item.id}
                          onClick={() => handleOpenProblem(item)}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                            {isSolved ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Solved</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                                <span>Unsolved</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-400">
                            #{item.id}
                          </td>
                          <td className="py-3 px-4 font-display font-semibold text-white group-hover:text-cyan-300 transition-colors">
                            {item.title}
                          </td>
                          <td className="py-3 px-4 text-xs font-mono text-slate-300">
                            {item.category}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-md font-semibold ${
                                item.difficulty === 'Easy'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : item.difficulty === 'Medium'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {item.difficulty}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenProblem(item);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-cyan-500/15 group-hover:bg-cyan-400 text-cyan-300 group-hover:text-slate-950 font-mono font-semibold text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <span>Solve</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ====================================================================
           VIEW 2: LEETCODE-STYLE SPLIT SCREEN
           Left: Problem Description + Get Gemini Hint
           Right: Monaco Editor (vs-dark) + Piston API Test Runner + Submit
           ==================================================================== */
        <div className="space-y-5">
          {/* Split-Screen Top Navigation Bar */}
          <div className="rounded-xl bg-[#0b101d] border border-slate-800/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className="px-3 py-1.5 rounded-lg bg-[#060911] hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span>Problem List (300)</span>
              </button>

              <span className="text-slate-600">|</span>

              <span className="font-display font-bold text-white text-sm sm:text-base">
                #{problem.id}. {problem.title}
              </span>

              <span
                className={`px-2.5 py-0.5 rounded-md font-mono text-xs font-semibold ${
                  problem.difficulty === 'Easy'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : problem.difficulty === 'Medium'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {problem.difficulty}
              </span>

              <span className="px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300">
                {problem.category}
              </span>

              {isCurrentProblemSolved && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 font-mono text-xs text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Solved</span>
                </span>
              )}
            </div>

            {/* Prev / Next Problem Switcher */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <button
                type="button"
                disabled={problem.id <= 1}
                onClick={() => {
                  const prevProb = DSA_300_PROBLEMS.find(
                    (p) => p.id === problem.id - 1
                  );
                  if (prevProb) handleOpenProblem(prevProb);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#060911] hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
              >
                Prev Problem
              </button>
              <button
                type="button"
                disabled={problem.id >= DSA_300_PROBLEMS.length}
                onClick={() => {
                  const nextProb = DSA_300_PROBLEMS.find(
                    (p) => p.id === problem.id + 1
                  );
                  if (nextProb) handleOpenProblem(nextProb);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#060911] hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
              >
                Next Problem
              </button>
            </div>
          </div>

          {/* Accepted Submission Toast Banner */}
          {submissionBanner && (
            <div
              role="status"
              className="rounded-xl bg-emerald-950/40 border border-emerald-500/50 px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm font-mono text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.2)]"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{submissionBanner}</span>
              </div>
              <span className="text-amber-300 font-bold shrink-0">
                +{problem.xpReward} XP
              </span>
            </div>
          )}

          {/* Split Screen Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* LEFT PANE (5 Cols): Problem Description, Constraints, Sample Test Case & Get Gemini Hint */}
            <div className="lg:col-span-5 rounded-2xl bg-[#0b101d] border border-slate-800/90 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div className="space-y-2 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>PROBLEM SPECIFICATION</span>
                    <span className="text-amber-400 font-semibold">
                      Reward: +{problem.xpReward} XP
                    </span>
                  </div>
                  <h3 className="text-xl font-display font-bold text-white">
                    #{problem.id}. {problem.title}
                  </h3>
                </div>

                {/* Problem Description */}
                <div className="space-y-2">
                  <div className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
                    Problem Description
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {problem.description}
                  </p>
                </div>

                {/* Sample Test Case */}
                <div className="space-y-2">
                  <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                    Sample Test Case
                  </div>
                  <div className="rounded-xl bg-[#060911] border border-slate-800 p-4 font-mono text-xs space-y-2">
                    <div>
                      <span className="text-slate-400">Input: </span>
                      <span className="text-cyan-300">
                        {problem.sampleTestCase.input}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Expected Output: </span>
                      <span className="text-emerald-400">
                        {problem.sampleTestCase.expectedOutput}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Constraints */}
                <div className="space-y-2">
                  <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                    Constraints
                  </div>
                  <pre className="rounded-xl bg-[#060911] border border-slate-800 p-3.5 font-mono text-xs text-amber-300 whitespace-pre-wrap">
                    {problem.constraints}
                  </pre>
                </div>

                {/* Get Gemini Hint Section */}
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>AI Algorithmic Assistant</span>
                    </span>
                    <button
                      type="button"
                      disabled={isLoadingHint}
                      onClick={handleGetGeminiHint}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-display font-bold text-xs inline-flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer transition-all"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>
                        {isLoadingHint
                          ? 'Generating Hint...'
                          : 'Get Gemini Hint'}
                      </span>
                    </button>
                  </div>

                  {geminiHint && (
                    <div
                      aria-label="Gemini Hint Output"
                      className="rounded-xl bg-[#060911] border border-amber-500/40 p-4 space-y-2 text-xs text-slate-200 leading-relaxed"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-amber-400">
                        <span className="font-semibold">
                          GEMINI ALGORITHMIC HINT · {problem.category.toUpperCase()}
                        </span>
                        <span>gemini-3.8-flash</span>
                      </div>
                      <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200 leading-relaxed">
                        {geminiHint}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Supported Languages Footer */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                <span>Supported Runtimes:</span>
                <span>{problem.languages.join(' · ')}</span>
              </div>
            </div>

            {/* RIGHT PANE (7 Cols): Monaco Editor (vs-dark) + Piston API Test Runner + Submit */}
            <div className="lg:col-span-7 rounded-2xl bg-[#0b101d] border border-slate-800/90 overflow-hidden flex flex-col justify-between">
              {/* Top Editor Toolbar */}
              <div className="px-4 py-3 bg-[#070b14] border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <label htmlFor="dsa-lang-select" className="sr-only">
                    Select Solution Language
                  </label>
                  <select
                    id="dsa-lang-select"
                    aria-label="Select Solution Language"
                    value={dsaLang}
                    onChange={(e) =>
                      handleChangeDsaLanguage(e.target.value as DsaLanguageKey)
                    }
                    className="rounded-lg bg-[#0b101d] border border-slate-800 px-3 py-1.5 text-xs font-mono font-semibold text-white outline-none cursor-pointer"
                  >
                    {DSA_LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>

                  <div className="hidden sm:flex items-center gap-1 bg-[#060911] p-1 rounded-lg border border-slate-800">
                    {DSA_LANGUAGES.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => handleChangeDsaLanguage(l.id)}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-semibold cursor-pointer ${
                          dsaLang === l.id
                            ? 'bg-cyan-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCodeBuffer(getRunnableProblemTemplate(problem, dsaLang))
                    }
                    className="px-3 py-1.5 rounded-lg bg-[#0b101d] hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>

                  <button
                    type="button"
                    disabled={isRunningCode}
                    onClick={handleRunCodeOnly}
                    className="px-3.5 py-1.5 rounded-lg bg-[#161e2e] hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 font-mono font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isRunningCode ? 'Running...' : 'Run Code'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isRunningCode}
                    onClick={handleSubmitSolution}
                    className="px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-display font-bold text-xs inline-flex items-center gap-1.5 shadow-[0_0_18px_rgba(16,185,129,0.35)] cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit</span>
                  </button>
                </div>
              </div>

              {/* Monaco Editor (vs-dark) */}
              <div className="bg-[#1e1e1e] min-h-[320px]">
                <Editor
                  height="320px"
                  theme="vs-dark"
                  language={currentLangMeta.monacoLang}
                  value={codeBuffer}
                  onChange={(val) => setCodeBuffer(val ?? '')}
                  loading={
                    <textarea
                      aria-label="DSA Solution Code Editor"
                      value={codeBuffer}
                      onChange={(e) => setCodeBuffer(e.target.value)}
                      className="w-full h-[320px] bg-[#1e1e1e] text-slate-100 font-mono text-xs sm:text-sm p-4 outline-none border-none resize-none"
                    />
                  }
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: 'JetBrains Mono, monospace',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 12, bottom: 12 },
                  }}
                />
              </div>

              {/* Piston API Test Runner & Output Console */}
              <div className="p-4 bg-[#070b14] border-t border-slate-800/90 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold">
                      Piston API Test Runner (emkc.org/api/v2/piston/execute)
                    </span>
                  </div>
                  {testResult && (
                    <span
                      className={`text-xs font-mono font-semibold tabular-nums ${
                        testResult.allPassed
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {testResult.passedCount} / {testResult.totalCount} Test Cases Passed · {testResult.runtimeMs}ms
                    </span>
                  )}
                </div>

                {/* Custom Test Input Row */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="dsa-custom-stdin"
                    className="text-xs font-mono text-slate-400 shrink-0"
                  >
                    Test Input:
                  </label>
                  <input
                    id="dsa-custom-stdin"
                    type="text"
                    value={customTestInput}
                    onChange={(e) => setCustomTestInput(e.target.value)}
                    className="flex-1 rounded-lg bg-[#0b101d] border border-slate-800 px-3 py-1.5 font-mono text-xs text-cyan-200 outline-none"
                  />
                </div>

                {/* Test Results Output */}
                {!testResult ? (
                  <div className="rounded-xl bg-[#0b101d] border border-slate-800/80 p-3.5 text-xs font-mono text-slate-400">
                    Click &quot;Run Code&quot; to test your solution with the Piston API or &quot;Submit&quot; to verify all test cases and mark Problem #{problem.id} as Solved.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {testResult.stderr && (
                      <pre className="rounded-xl bg-rose-950/30 border border-rose-500/40 p-3 font-mono text-xs text-rose-300 whitespace-pre-wrap">
                        {testResult.stderr}
                      </pre>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {testResult.cases.map((c) => (
                        <div
                          key={c.caseNumber}
                          className={`rounded-xl border p-3 font-mono text-xs space-y-1 ${
                            c.passed
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                              : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span>Case #{c.caseNumber}</span>
                            <span>{c.passed ? 'PASSED ✓' : 'FAILED ✗'}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            In: {c.input}
                          </div>
                          <div className="text-[11px] text-emerald-300 truncate">
                            Out: {c.actualOutput}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 7. LEADERBOARD VIEW (Live Authenticated User & Registered Accounts)
// ============================================================================
export const LeaderboardView: React.FC<{
  currentUser: UserProfile;
  currentUserXp: number;
  currentUserLevel: number;
}> = ({ currentUser, currentUserXp, currentUserLevel }) => {
  const registeredMap = loadRegisteredUsersMap();
  const registeredProfiles = Object.values(registeredMap).map((r) => r.profile);

  // Merge current live session with any other registered users in the database
  const mergedByEmail = new Map<string, UserProfile>();
  for (const prof of registeredProfiles) {
    if (prof && prof.email) {
      mergedByEmail.set(prof.email.toLowerCase(), prof);
    }
  }
  mergedByEmail.set(currentUser.email.toLowerCase(), {
    ...currentUser,
    xp: currentUserXp,
    level: currentUserLevel,
  });

  const entries = Array.from(mergedByEmail.values())
    .map((prof) => {
      const isCurrentUser =
        prof.email.toLowerCase() === currentUser.email.toLowerCase();
      const lvl = calculateLevelFromXp(prof.xp ?? 0).level;
      return {
        uid: prof.uid,
        name: prof.name,
        email: prof.email,
        specialization: prof.isEduVerified
          ? 'Edu Verified Student'
          : 'Developer Account',
        solved: Array.isArray(prof.solvedDsaIds) ? prof.solvedDsaIds.length : 0,
        completedTopicsCount: Array.isArray(prof.completedTopics)
          ? prof.completedTopics.length
          : 0,
        level: lvl,
        xp: prof.xp ?? 0,
        isCurrentUser,
      };
    })
    .sort((a, b) => b.xp - a.xp || b.solved - a.solved);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <p className="text-xs font-mono text-cyan-400 tracking-wide">
            LIVE WORKSPACE STANDINGS
          </p>
          <h2 className="text-2xl font-display font-bold text-white mt-1">
            Student Developer Leaderboard
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Live progress for authenticated student accounts based on solved DSA problems, completed topics, and earned XP.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 tabular-nums">
          <Trophy className="w-4 h-4" />
          <span>Your XP: {currentUserXp.toLocaleString()} XP</span>
        </div>
      </div>

      <div className="rounded-xl bg-[#0b101d] border border-slate-800/90 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-[#070a12] font-mono text-xs text-slate-400">
                <th className="py-3.5 px-5">Rank</th>
                <th className="py-3.5 px-5">Developer</th>
                <th className="py-3.5 px-5">Account Status</th>
                <th className="py-3.5 px-5 text-right">Topics Completed</th>
                <th className="py-3.5 px-5 text-right">Problems Solved</th>
                <th className="py-3.5 px-5 text-right">Level</th>
                <th className="py-3.5 px-5 text-right">Total XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 tabular-nums">
              {entries.map((entry, idx) => (
                <tr
                  key={entry.uid || entry.email}
                  className={
                    entry.isCurrentUser
                      ? 'bg-cyan-950/25 font-semibold'
                      : 'hover:bg-slate-800/30 transition-colors'
                  }
                >
                  <td className="py-3.5 px-5 font-mono text-xs text-slate-400">
                    #{idx + 1}
                  </td>
                  <td className="py-3.5 px-5 text-white">
                    {entry.name}{' '}
                    {entry.isCurrentUser && (
                      <span className="ml-1.5 text-xs font-mono text-cyan-400">
                        (You)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-slate-400 text-xs">
                    {entry.specialization}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-slate-200">
                    {entry.completedTopicsCount}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-slate-200">
                    {entry.solved}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-cyan-400">
                    Level {entry.level}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-emerald-400">
                    {entry.xp.toLocaleString()} XP
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
