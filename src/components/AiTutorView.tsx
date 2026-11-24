import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Zap,
  GraduationCap,
  Send,
  Copy,
  Check,
  Trash2,
  Terminal as TerminalIcon,
  BookOpen,
  Lightbulb,
  Bug,
  PlayCircle,
  HelpCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';
import {
  TutorMode,
  TutorChatMessage,
  TUTOR_SUBJECT_OPTIONS,
  QUICK_ACTION_CHIPS,
  TutorQuickAction,
  getTutorSubjectById,
  buildQuickActionPrompt,
  buildTutorSystemInstruction,
  getTutorStorageKey,
  parseStoredTutorMessages,
  tokenizeCodeLine,
  CodeToken,
} from '../utils/aiTutorLogic';
import {
  hasUserGeminiKey,
  generateByokContent,
  ByokGeminiError,
  classifyByokError,
  GEMINI_KEY_CHANGED_EVENT,
  type ByokErrorInfo,
} from '../lib/geminiByok';
import {
  MissingKeyPrompt,
  ByokErrorBanner,
} from './ApiKeySettingsModal';
import type { TerminalCodePayload } from './WorkspaceViews';

interface AiTutorViewProps {
  userName: string;
  userEmail: string;
  onOpenInTerminal?: (payload: TerminalCodePayload) => void;
  onOpenApiKeyModal?: () => void;
}

const TOKEN_COLOR_MAP: Record<CodeToken['type'], string> = {
  plain: 'text-slate-100',
  keyword: 'text-cyan-400 font-semibold',
  string: 'text-emerald-300',
  comment: 'text-slate-500 italic',
  number: 'text-amber-300',
  function: 'text-sky-300',
};

const SyntaxCodeBlock: React.FC<{
  language: string;
  code: string;
  onOpenInTerminal?: (payload: TerminalCodePayload) => void;
}> = ({ language, code, onOpenInTerminal }) => {
  const [copied, setCopied] = useState(false);
  const cleanCode = code.replace(/\n$/, '');
  const lines = cleanCode.split('\n');
  const displayLang = language || 'code';

  const handleCopy = () => {
    navigator.clipboard?.writeText(cleanCode).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const normalizedLang = displayLang.toLowerCase();
  const canOpenTerminal =
    Boolean(onOpenInTerminal) &&
    ['python', 'py', 'python3', 'c', 'cpp', 'c++', 'java', 'javascript', 'js', 'sql'].includes(
      normalizedLang
    );

  const handleTerminalLaunch = () => {
    if (!onOpenInTerminal) return;
    let mappedLang = 'Python';
    let ext = 'py';
    if (normalizedLang === 'c') {
      mappedLang = 'C';
      ext = 'c';
    } else if (normalizedLang === 'cpp' || normalizedLang === 'c++') {
      mappedLang = 'C++';
      ext = 'cpp';
    } else if (normalizedLang === 'java') {
      mappedLang = 'Java';
      ext = 'java';
    } else if (normalizedLang === 'javascript' || normalizedLang === 'js') {
      mappedLang = 'JavaScript';
      ext = 'js';
    } else if (normalizedLang === 'sql') {
      mappedLang = 'SQL';
      ext = 'sql';
    }

    onOpenInTerminal({
      filename: `ai_tutor_snippet.${ext}`,
      language: mappedLang,
      chapterTitle: `AI Tutor (${mappedLang}) Snippet`,
      code: cleanCode,
      command: `run ai_tutor_snippet.${ext}`,
      output: [
        `Loaded ${mappedLang} code snippet from AI Tutor & Doubts into Terminal.`,
      ],
    });
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-[#050810]">
      <div className="px-3.5 py-2 bg-[#0a101f] border-b border-slate-800/90 flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-semibold">
          {displayLang}
        </span>
        <div className="flex items-center gap-1.5">
          {canOpenTerminal && (
            <button
              type="button"
              onClick={handleTerminalLaunch}
              className="px-2.5 py-1 rounded-md bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/35 text-amber-300 font-mono text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <TerminalIcon className="w-3 h-3" />
              <span>Run in Terminal</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-md bg-[#060911] hover:bg-slate-800 border border-slate-700/90 text-slate-300 hover:text-white font-mono text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-cyan-400" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto p-3.5 font-mono text-xs leading-6">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, lineIdx) => {
              const tokens = tokenizeCodeLine(line, displayLang);
              return (
                <tr key={lineIdx} className="hover:bg-slate-800/25">
                  <td className="select-none text-right pr-3.5 text-slate-600 w-7 align-top tabular-nums">
                    {lineIdx + 1}
                  </td>
                  <td className="whitespace-pre">
                    {tokens.length === 0 ? (
                      '\u00A0'
                    ) : (
                      tokens.map((tok, tIdx) => (
                        <span key={tIdx} className={TOKEN_COLOR_MAP[tok.type]}>
                          {tok.text}
                        </span>
                      ))
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const QUICK_CHIP_ICONS: Record<TutorQuickAction['id'], React.ReactNode> = {
  analogy: <Lightbulb className="w-3.5 h-3.5 text-amber-400" />,
  'dry-run': <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />,
  'find-bug': <Bug className="w-3.5 h-3.5 text-rose-400" />,
  'practice-question': <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />,
};

export const AiTutorView: React.FC<AiTutorViewProps> = ({
  userName,
  userEmail,
  onOpenInTerminal,
  onOpenApiKeyModal,
}) => {
  const storageKey = getTutorStorageKey(userEmail);

  const [mode, setMode] = useState<TutorMode>('quick');
  const [subjectId, setSubjectId] = useState<string>(
    TUTOR_SUBJECT_OPTIONS[0].id
  );
  const [messages, setMessages] = useState<TutorChatMessage[]>(() => {
    if (typeof window === 'undefined') return [];
    return parseStoredTutorMessages(window.localStorage.getItem(storageKey));
  });
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<ByokErrorInfo | null>(null);
  const [showMissingKeyPrompt, setShowMissingKeyPrompt] = useState<boolean>(false);
  const [keyConnected, setKeyConnected] = useState<boolean>(() =>
    hasUserGeminiKey()
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeSubject = getTutorSubjectById(subjectId);

  useEffect(() => {
    const syncKeyState = () => {
      const connected = hasUserGeminiKey();
      setKeyConnected(connected);
      if (connected) {
        setShowMissingKeyPrompt(false);
        setErrorBanner((prev) =>
          prev?.code === 'NO_API_KEY' ? null : prev
        );
      }
    };
    window.addEventListener(GEMINI_KEY_CHANGED_EVENT, syncKeyState);
    window.addEventListener('storage', syncKeyState);
    return () => {
      window.removeEventListener(GEMINI_KEY_CHANGED_EVENT, syncKeyState);
      window.removeEventListener('storage', syncKeyState);
    };
  }, []);

  // Sync messages to localStorage scoped per user
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(messages.slice(-60)));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }, [messages, storageKey]);

  // Reload history if userEmail changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMessages(
      parseStoredTutorMessages(window.localStorage.getItem(storageKey))
    );
  }, [storageKey]);

  // Smooth scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const sendMessageHistory = async (
    historyToSend: TutorChatMessage[],
    activeMode: TutorMode,
    activeSubjId: string
  ) => {
    if (!hasUserGeminiKey()) {
      setShowMissingKeyPrompt(true);
      setErrorBanner(null);
      return;
    }

    setIsLoading(true);
    setErrorBanner(null);
    setShowMissingKeyPrompt(false);

    try {
      const systemInstruction = buildTutorSystemInstruction(
        activeMode,
        activeSubjId
      );

      const formattedContents = historyToSend
        .slice(-16)
        .filter((m) => m.content.trim().length > 0)
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content.trim() }],
        }));

      const { text: replyContent, model } = await generateByokContent({
        contents: formattedContents,
        systemInstruction,
      });

      const subjectObj = getTutorSubjectById(activeSubjId);
      const assistantMsg: TutorChatMessage = {
        id: `ast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        mode: activeMode,
        subjectLabel: subjectObj.shortLabel,
        model,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const info =
        err instanceof ByokGeminiError ? err.info : classifyByokError(err);
      if (info.code === 'NO_API_KEY') {
        setShowMissingKeyPrompt(true);
      } else {
        setErrorBanner(info);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (overrideText?: string) => {
    const content = (overrideText ?? inputValue).trim();
    if (!content || isLoading) return;

    if (!hasUserGeminiKey()) {
      setShowMissingKeyPrompt(true);
      setErrorBanner(null);
      if (overrideText) {
        setInputValue(overrideText);
      }
      return;
    }

    const userMsg: TutorChatMessage = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      mode,
      subjectLabel: activeSubject.shortLabel,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputValue('');
    await sendMessageHistory(nextHistory, mode, subjectId);
  };

  const handleRetryLast = async () => {
    if (isLoading || messages.length === 0) return;
    await sendMessageHistory(messages, mode, subjectId);
  };

  const handleQuickChipClick = (chipId: TutorQuickAction['id']) => {
    const nextPrompt = buildQuickActionPrompt(
      chipId,
      activeSubject.label,
      inputValue
    );
    setInputValue(nextPrompt);
    window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleClearHistory = () => {
    setMessages([]);
    setErrorBanner(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey);
    }
  };

  const starterPrompts = [
    `What is the difference between BFS and DFS in ${activeSubject.shortLabel}?`,
    `Show me a clean example with time & space complexity in ${activeSubject.shortLabel}.`,
    `What are the top 3 common mistakes students make in ${activeSubject.shortLabel}?`,
  ];

  return (
    <div className="space-y-4">
      {/* ====================================================================
          TOP HEADER + MODE TOGGLE (Quick Doubt Solver | Guided AI Tutor)
         ==================================================================== */}
      <div className="rounded-2xl bg-[#0b101d] border border-cyan-500/25 shadow-[0_0_35px_rgba(34,211,238,0.08)] p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-semibold uppercase tracking-wider">
                AI MENTORSHIP
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">
                Syllabus-Aware Coding Assistant
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
              AI Tutor &amp; Doubts
            </h2>
          </div>

          {/* Right Actions: API Key Status + Clear Chat */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
            {onOpenApiKeyModal && (
              <button
                type="button"
                onClick={onOpenApiKeyModal}
                className={`px-3 py-2 rounded-xl border text-xs font-mono inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  keyConnected
                    ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/55'
                    : 'bg-amber-950/35 border-amber-500/45 text-amber-300 hover:bg-amber-950/55'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{keyConnected ? 'BYOK Key Ready' : 'Set API Key'}</span>
              </button>
            )}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="px-3.5 py-2 rounded-xl bg-[#060911] hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-mono inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Chat</span>
              </button>
            )}
          </div>
        </div>

        {/* Mode Toggle Cards */}
        <div
          role="tablist"
          aria-label="AI Tutor Mode"
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'quick'}
            onClick={() => setMode('quick')}
            className={`text-left rounded-xl p-3 border transition-all cursor-pointer flex items-start gap-3 ${
              mode === 'quick'
                ? 'bg-cyan-500/12 border-cyan-400/70 shadow-[0_0_24px_rgba(34,211,238,0.14)]'
                : 'bg-[#060911] border-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                mode === 'quick'
                  ? 'bg-cyan-400 text-slate-950'
                  : 'bg-slate-900 border border-slate-800 text-cyan-400'
              }`}
            >
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-display font-bold text-white">
                  Quick Doubt Solver
                </span>
                {mode === 'quick' && (
                  <span className="px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 font-mono text-[10px] font-bold">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                Gives clear, direct explanations with worked examples and annotated code.
              </p>
            </div>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'guided'}
            onClick={() => setMode('guided')}
            className={`text-left rounded-xl p-3 border transition-all cursor-pointer flex items-start gap-3 ${
              mode === 'guided'
                ? 'bg-amber-500/12 border-amber-400/70 shadow-[0_0_24px_rgba(245,158,11,0.14)]'
                : 'bg-[#060911] border-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                mode === 'guided'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-900 border border-slate-800 text-amber-400'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-display font-bold text-white">
                  Guided AI Tutor
                </span>
                {mode === 'guided' && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-mono text-[10px] font-bold">
                    SOCRATIC
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                Socratic mentor — step-by-step hints first, plus a short check-in question.
              </p>
            </div>
          </button>
        </div>

        {/* Context Selector Row */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <label
              htmlFor="tutor-context-select"
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-slate-400 shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Syllabus Context:</span>
            </label>
            <select
              id="tutor-context-select"
              aria-label="Select Subject or Topic Context"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="rounded-xl bg-[#060911] border border-slate-800 focus:border-cyan-400 px-3.5 py-2 text-xs sm:text-sm text-white font-medium outline-none cursor-pointer"
            >
              {TUTOR_SUBJECT_OPTIONS.map((opt) => (
                <option
                  key={opt.id}
                  value={opt.id}
                  className="bg-[#0b101d] text-white"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Syllabus Tag Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {TUTOR_SUBJECT_OPTIONS.slice(0, 6).map((opt) => {
              const isSelected = opt.id === subjectId;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSubjectId(opt.id)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300 font-semibold'
                      : 'bg-[#060911] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {opt.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====================================================================
          MAIN RICH CHAT WORKSPACE PANEL
         ==================================================================== */}
      <div className="rounded-2xl bg-[#0b101d] border border-slate-800/90 overflow-hidden flex flex-col">
        {/* Chat Stream Container */}
        <div
          aria-label="AI Tutor Conversation History"
          className="p-4 sm:p-5 min-h-[210px] max-h-[380px] overflow-y-auto space-y-4 bg-[#070b14]/65"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-3 space-y-3.5 max-w-xl mx-auto">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/35 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.16)]">
                <Sparkles className="w-5 h-5" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-display font-bold text-white">
                  Hi {userName.split(' ')[0]}, what are we working on in{' '}
                  <span className="text-cyan-400">{activeSubject.shortLabel}</span>?
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {mode === 'quick'
                    ? 'Quick Doubt Solver is active — ask any concept or debugging question for a direct, example-backed answer.'
                    : 'Guided AI Tutor is active — I will walk you through step-by-step with hints and quick check-in questions.'}
                </p>
              </div>

              {/* Clickable Starter Prompts */}
              <div className="w-full grid grid-cols-1 gap-2 text-left">
                {starterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSubmit(prompt)}
                    className="px-4 py-2.5 rounded-xl bg-[#0b101d] hover:bg-slate-800/70 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-200 transition-colors cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span>{prompt}</span>
                    <Send className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3.5 border ${
                      isUser
                        ? 'bg-cyan-500/12 border-cyan-500/35 text-slate-100'
                        : 'bg-[#0b101d] border-slate-800/95 text-slate-200'
                    }`}
                  >
                    {/* Message Header Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/70 text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            isUser
                              ? 'text-cyan-300'
                              : msg.mode === 'guided'
                              ? 'text-amber-300'
                              : 'text-cyan-400'
                          }`}
                        >
                          {isUser
                            ? userName
                            : msg.mode === 'guided'
                            ? 'Guided AI Tutor'
                            : 'Quick Doubt Solver'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[10px]">
                          {msg.subjectLabel}
                        </span>
                      </div>
                      <span className="text-slate-500 tabular-nums">
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Message Body */}
                    {isUser ? (
                      <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed text-slate-100">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="text-xs sm:text-sm leading-relaxed space-y-2.5">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => (
                              <h3 className="text-base font-display font-bold text-white pt-1">
                                {children}
                              </h3>
                            ),
                            h2: ({ children }) => (
                              <h4 className="text-sm font-display font-bold text-cyan-300 pt-1">
                                {children}
                              </h4>
                            ),
                            h3: ({ children }) => (
                              <h5 className="text-sm font-display font-semibold text-amber-300 pt-1">
                                {children}
                              </h5>
                            ),
                            p: ({ children }) => (
                              <p className="text-slate-200 leading-relaxed">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-5 space-y-1 text-slate-300">
                                {children}
                              </ol>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-white">
                                {children}
                              </strong>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 border-amber-400/70 pl-3 py-1 bg-amber-500/5 rounded-r-lg text-amber-100">
                                {children}
                              </blockquote>
                            ),
                            pre: ({ children }) => <>{children}</>,
                            code: ({ className, children }) => {
                              const match = /language-([\w+#-]+)/.exec(
                                className || ''
                              );
                              const rawCode = String(children ?? '');
                              const isBlock =
                                Boolean(match) || rawCode.includes('\n');

                              if (isBlock) {
                                return (
                                  <SyntaxCodeBlock
                                    language={match?.[1] || 'code'}
                                    code={rawCode}
                                    onOpenInTerminal={onOpenInTerminal}
                                  />
                                );
                              }

                              return (
                                <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[12px] text-cyan-300">
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Clear Loading Indicator While Generating */}
          {isLoading && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-start"
            >
              <div className="rounded-2xl bg-[#0b101d] border border-cyan-500/35 px-4 py-3.5 inline-flex items-center gap-3 text-xs font-mono text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.12)]">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                <span>
                  {mode === 'guided'
                    ? `Guided AI Tutor is preparing your ${activeSubject.shortLabel} hint & check-in...`
                    : `Quick Doubt Solver is generating your ${activeSubject.shortLabel} explanation...`}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Inline Missing API Key Prompt */}
        {showMissingKeyPrompt && (
          <div className="mx-5 mt-4">
            <MissingKeyPrompt
              featureName="AI Tutor & Doubts"
              onOpenApiKeyModal={() => onOpenApiKeyModal?.()}
              onDismiss={() => setShowMissingKeyPrompt(false)}
            />
          </div>
        )}

        {/* Friendly BYOK Error Banner (401/403 Invalid Key / 429 Rate Limited / API Error) */}
        {errorBanner && (
          <div className="mx-5 mt-4">
            <ByokErrorBanner
              error={errorBanner}
              onOpenApiKeyModal={() => onOpenApiKeyModal?.()}
              onRetry={messages.length > 0 ? handleRetryLast : undefined}
              onDismiss={() => setErrorBanner(null)}
            />
          </div>
        )}

        {/* Quick Action Chips + Input Composer */}
        <div className="p-4 sm:p-5 bg-[#080c17] border-t border-slate-800/90 space-y-3">
          {/* Quick Action Chips */}
          <div
            aria-label="Quick Action Prompts"
            className="flex flex-wrap items-center gap-2"
          >
            {QUICK_ACTION_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickChipClick(chip.id)}
                className="px-3 py-1.5 rounded-xl bg-[#0b101d] hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/45 text-xs font-medium text-slate-200 hover:text-cyan-200 inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {QUICK_CHIP_ICONS[chip.id]}
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Input Box & Send Button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
          >
            <div className="flex-1 relative">
              <label htmlFor="ai-tutor-input" className="sr-only">
                Ask your coding doubt or paste code
              </label>
              <textarea
                ref={textareaRef}
                id="ai-tutor-input"
                rows={2}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={`Ask a ${activeSubject.shortLabel} doubt, paste code to dry-run or debug... (Enter to send, Shift+Enter for newline)`}
                className="w-full rounded-xl bg-[#060911] border border-slate-800 focus:border-cyan-400 px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none resize-y min-h-[58px] max-h-[180px] font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className={`px-5 py-3 rounded-xl font-display font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                mode === 'guided'
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Ask Tutor</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
