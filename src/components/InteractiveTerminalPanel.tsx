import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Terminal as TerminalIcon,
  Trash2,
  Copy,
  Check,
  Minus,
  Plus,
  Maximize2,
  Minimize2,
  Square,
  CornerDownLeft,
  Bug,
  Sparkles,
  Loader2,
  GripHorizontal,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Crosshair,
} from 'lucide-react';
import type { TerminalLanguageKey } from '../utils/dsaAndTerminalLogic';
import {
  TerminalEntry,
  TERMINAL_DEFAULT_FONT_SIZE,
  TERMINAL_MIN_FONT_SIZE,
  TERMINAL_MAX_FONT_SIZE,
  TERMINAL_DEFAULT_HEIGHT,
  TERMINAL_EXPANDED_HEIGHT,
  clampTerminalFontSize,
  clampTerminalHeight,
  parseErrorLineSegments,
  navigateCommandHistory,
  formatTerminalEntriesForCopy,
  getTerminalRuntimeLabel,
} from '../utils/interactiveTerminalLogic';
import { GEMINI_BYOK_MODEL, type ByokErrorInfo } from '../lib/geminiByok';
import { MissingKeyPrompt, ByokErrorBanner } from './ApiKeySettingsModal';

export interface InteractiveTerminalPanelProps {
  language: TerminalLanguageKey;
  filename: string;
  userName: string;
  entries: TerminalEntry[];
  isRunning: boolean;
  awaitingInput: boolean;
  activePromptLabel: string | null;
  promptSequenceKey: number;
  exitCode: number | null;
  executionTimeMs: number | null;
  engineLabel: string;
  runningStatusMessage?: string | null;
  onSubmitInlineStdin: (value: string) => void;
  onSubmitShellCommand: (value: string) => void;
  onStopExecution: () => void;
  onClearOutput: () => void;
  onJumpToLine?: (lineNumber: number) => void;
  // BYOK AI Debugger props (preserved unchanged)
  hasErrorOutput: boolean;
  isLoadingAiDebug: boolean;
  aiDebugOutput: string | null;
  aiDebugMissingKey: boolean;
  aiDebugError: ByokErrorInfo | null;
  onExplainError: () => void;
  onClearAiDebug: () => void;
  onDismissMissingKey: () => void;
  onDismissAiError: () => void;
  onOpenApiKeyModal?: () => void;
}

export const InteractiveTerminalPanel: React.FC<
  InteractiveTerminalPanelProps
> = ({
  language,
  filename,
  userName,
  entries,
  isRunning,
  awaitingInput,
  activePromptLabel,
  promptSequenceKey,
  exitCode,
  executionTimeMs,
  engineLabel,
  runningStatusMessage,
  onSubmitInlineStdin,
  onSubmitShellCommand,
  onStopExecution,
  onClearOutput,
  onJumpToLine,
  hasErrorOutput,
  isLoadingAiDebug,
  aiDebugOutput,
  aiDebugMissingKey,
  aiDebugError,
  onExplainError,
  onClearAiDebug,
  onDismissMissingKey,
  onDismissAiError,
  onOpenApiKeyModal,
}) => {
  const [fontSize, setFontSize] = useState<number>(TERMINAL_DEFAULT_FONT_SIZE);
  const [terminalHeight, setTerminalHeight] = useState<number>(
    TERMINAL_DEFAULT_HEIGHT
  );
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copiedOutput, setCopiedOutput] = useState<boolean>(false);

  // Seamless inline program stdin input (rendered directly at end of active prompt line)
  const [inlineStdinValue, setInlineStdinValue] = useState<string>('');
  const [isInlineFocused, setIsInlineFocused] = useState<boolean>(false);

  // Idle shell command bar & Up/Down history state
  const [shellInput, setShellInput] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [draftBeforeHistory, setDraftBeforeHistory] = useState<string>('');
  const [isShellFocused, setIsShellFocused] = useState<boolean>(false);

  // Drag resize state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const dragStartHeightRef = useRef<number>(TERMINAL_DEFAULT_HEIGHT);

  const outputContainerRef = useRef<HTMLDivElement | null>(null);
  const inlineStdinRef = useRef<HTMLInputElement | null>(null);
  const shellTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const runtimeLabel = getTerminalRuntimeLabel(language);
  const safeUserHandle =
    userName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '') || 'student';

  // Auto-scroll to newest output line on every update
  useEffect(() => {
    if (isCollapsed) return;
    const container = outputContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [entries, isRunning, awaitingInput, activePromptLabel, promptSequenceKey, isCollapsed]);

  // Auto-focus inline stdin input immediately when program waits for input (and on every loop prompt)
  useEffect(() => {
    if (!awaitingInput) {
      setInlineStdinValue('');
      return;
    }
    setIsCollapsed(false);
    setInlineStdinValue('');
    requestAnimationFrame(() => {
      inlineStdinRef.current?.focus();
    });
  }, [awaitingInput, promptSequenceKey]);

  // Auto-grow idle shell textarea up to 4 lines
  useEffect(() => {
    const el = shellTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxPx = Math.round(fontSize * 1.55 * 4);
    el.style.height = `${Math.min(el.scrollHeight, maxPx)}px`;
  }, [shellInput, fontSize]);

  // Pointer drag resizing handler
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaY = e.clientY - dragStartYRef.current;
      const nextHeight = clampTerminalHeight(
        dragStartHeightRef.current + deltaY
      );
      setTerminalHeight(nextHeight);
      setIsExpanded(nextHeight >= TERMINAL_EXPANDED_HEIGHT - 20);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isCollapsed) setIsCollapsed(false);
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = terminalHeight;
    setIsDragging(true);
  };

  const handleToggleExpand = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setTerminalHeight(TERMINAL_EXPANDED_HEIGHT);
      setIsExpanded(true);
      return;
    }
    if (isExpanded) {
      setTerminalHeight(TERMINAL_DEFAULT_HEIGHT);
      setIsExpanded(false);
    } else {
      setTerminalHeight(TERMINAL_EXPANDED_HEIGHT);
      setIsExpanded(true);
    }
  };

  const handleCopyOutput = async () => {
    const plain = formatTerminalEntriesForCopy(entries);
    if (!plain) return;
    try {
      await navigator.clipboard.writeText(plain);
    } catch {
      const temp = document.createElement('textarea');
      temp.value = plain;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
    }
    setCopiedOutput(true);
    window.setTimeout(() => setCopiedOutput(false), 1800);
  };

  const pushToHistory = useCallback((value: string) => {
    if (!value.trim()) return;
    setCommandHistory((prev) => {
      if (prev.length > 0 && prev[prev.length - 1] === value) return prev;
      return [...prev.slice(-99), value];
    });
  }, []);

  const handleInlineStdinSubmit = useCallback(() => {
    const submitted = inlineStdinValue;
    pushToHistory(submitted);
    setInlineStdinValue('');
    onSubmitInlineStdin(submitted);
  }, [inlineStdinValue, pushToHistory, onSubmitInlineStdin]);

  const handleInlineStdinKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      setInlineStdinValue('');
      onStopExecution();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setInlineStdinValue('');
      onStopExecution();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInlineStdinSubmit();
    }
  };

  const submitShellCommand = useCallback(() => {
    const trimmed = shellInput.trim();
    if (!trimmed) return;
    pushToHistory(shellInput);
    setHistoryIndex(-1);
    setDraftBeforeHistory('');
    setShellInput('');
    onSubmitShellCommand(shellInput);
  }, [shellInput, pushToHistory, onSubmitShellCommand]);

  const handleShellKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      onClearOutput();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitShellCommand();
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const target = e.currentTarget;
      const selStart = target.selectionStart ?? 0;
      const selEnd = target.selectionEnd ?? 0;
      const beforeCursor = shellInput.slice(0, selStart);
      const afterCursor = shellInput.slice(selEnd);
      const isOnFirstLine = !beforeCursor.includes('\n');
      const isOnLastLine = !afterCursor.includes('\n');

      if (e.key === 'ArrowUp' && isOnFirstLine && commandHistory.length > 0) {
        e.preventDefault();
        const nav = navigateCommandHistory(
          commandHistory,
          historyIndex,
          'up',
          shellInput,
          draftBeforeHistory
        );
        setHistoryIndex(nav.nextIndex);
        setShellInput(nav.nextValue);
        setDraftBeforeHistory(nav.nextDraft);
        return;
      }

      if (e.key === 'ArrowDown' && isOnLastLine && historyIndex !== -1) {
        e.preventDefault();
        const nav = navigateCommandHistory(
          commandHistory,
          historyIndex,
          'down',
          shellInput,
          draftBeforeHistory
        );
        setHistoryIndex(nav.nextIndex);
        setShellInput(nav.nextValue);
        setDraftBeforeHistory(nav.nextDraft);
      }
    }
  };

  const handleConsoleAreaClick = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    if (awaitingInput) {
      inlineStdinRef.current?.focus();
    } else {
      shellTextareaRef.current?.focus();
    }
  };

  const statusText = isRunning
    ? 'Running'
    : awaitingInput
    ? 'Waiting for input...'
    : exitCode === null
    ? 'Ready'
    : exitCode === 0
    ? 'Exit 0'
    : `Exit ${exitCode}`;

  const statusColorClass = isRunning
    ? 'text-cyan-300'
    : awaitingInput
    ? 'text-amber-300'
    : exitCode === null
    ? 'text-slate-300'
    : exitCode === 0
    ? 'text-emerald-400'
    : 'text-rose-400';

  const renderStderrLine = (line: string, lineIdx: number) => {
    const segments = parseErrorLineSegments(line);
    return (
      <div
        key={lineIdx}
        className="text-rose-300/95 bg-rose-950/20 px-2 py-0.5 rounded-sm leading-relaxed break-words"
      >
        {segments.map((seg, segIdx) => {
          if (seg.isLineRef) {
            if (seg.lineNumber && onJumpToLine) {
              return (
                <button
                  key={segIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onJumpToLine(seg.lineNumber!);
                  }}
                  title={`Jump to line ${seg.lineNumber} in editor`}
                  className="inline px-1.5 py-0.2 mx-0.5 rounded bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400/45 text-rose-100 font-semibold underline decoration-rose-300/70 underline-offset-2 cursor-pointer transition-colors"
                >
                  {seg.text}
                </button>
              );
            }
            return (
              <span
                key={segIdx}
                className="inline px-1.5 py-0.2 mx-0.5 rounded bg-rose-500/25 border border-rose-400/40 text-rose-100 font-semibold"
              >
                {seg.text}
              </span>
            );
          }
          return <React.Fragment key={segIdx}>{seg.text}</React.Fragment>;
        })}
      </div>
    );
  };

  return (
    <section
      aria-label="Interactive Terminal"
      className={`rounded-2xl bg-[#0b101d] border border-slate-800/90 overflow-hidden flex flex-col ${
        isDragging ? 'select-none' : ''
      }`}
    >
      {/* VS Code-Style Top Toolbar */}
      <div className="px-4 py-2.5 bg-[#070b14] border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
        {/* Left Zone: Terminal Title + Runtime Status + Waiting for input badge + Execution Time */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono min-w-0">
          <div className="flex items-center gap-2 text-slate-100 font-semibold whitespace-nowrap shrink-0">
            <TerminalIcon className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Terminal</span>
          </div>

          <span className="text-slate-600" aria-hidden="true">
            ·
          </span>

          <span className="text-slate-300 whitespace-nowrap shrink-0">
            {runtimeLabel}
          </span>

          <span className="text-slate-600" aria-hidden="true">
            ·
          </span>

          {awaitingInput ? (
            <span
              role="status"
              aria-live="polite"
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/40 text-amber-300 font-semibold whitespace-nowrap shrink-0"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 edoc-terminal-cursor" />
              <span>Waiting for input...</span>
            </span>
          ) : (
            <span
              aria-live="polite"
              className={`inline-flex items-center gap-1.5 font-semibold whitespace-nowrap shrink-0 ${statusColorClass}`}
            >
              {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{statusText}</span>
            </span>
          )}

          {executionTimeMs !== null && !isRunning && !awaitingInput && (
            <>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                {executionTimeMs} ms
              </span>
            </>
          )}
        </div>

        {/* Right Zone: Stop (when active) + Font Size + Copy + Clear + Expand/Collapse */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {(isRunning || awaitingInput) && (
            <button
              type="button"
              onClick={onStopExecution}
              title="Stop execution / cancel waiting input"
              aria-label="Stop execution"
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/45 text-rose-300 text-xs font-mono font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          )}

          {/* Font Size Controls (- / px / +) */}
          <div
            role="group"
            aria-label="Terminal font size controls"
            className="inline-flex items-center rounded-lg bg-[#0b101d] border border-slate-800 overflow-hidden shrink-0"
          >
            <button
              type="button"
              onClick={() => setFontSize((s) => clampTerminalFontSize(s - 1))}
              disabled={fontSize <= TERMINAL_MIN_FONT_SIZE}
              aria-label="Decrease terminal font size"
              title="Decrease font size"
              className="px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/80 disabled:opacity-35 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono text-slate-400 tabular-nums select-none border-x border-slate-800/80">
              {fontSize}px
            </span>
            <button
              type="button"
              onClick={() => setFontSize((s) => clampTerminalFontSize(s + 1))}
              disabled={fontSize >= TERMINAL_MAX_FONT_SIZE}
              aria-label="Increase terminal font size"
              title="Increase font size"
              className="px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/80 disabled:opacity-35 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Copy Output */}
          <button
            type="button"
            onClick={() => void handleCopyOutput()}
            title="Copy terminal output"
            aria-label="Copy terminal output"
            className="px-2.5 py-1.5 rounded-lg bg-[#0b101d] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
          >
            {copiedOutput ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Clear Output */}
          <button
            type="button"
            onClick={onClearOutput}
            title="Clear terminal (Ctrl+L)"
            aria-label="Clear terminal output"
            className="px-2.5 py-1.5 rounded-lg bg-[#0b101d] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          {/* Expand / Standard Height Toggle */}
          <button
            type="button"
            onClick={handleToggleExpand}
            title={isExpanded ? 'Restore terminal height' : 'Expand terminal'}
            aria-label={isExpanded ? 'Restore terminal height' : 'Expand terminal'}
            className="p-1.5 rounded-lg bg-[#0b101d] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Collapse / Show Panel Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            title={isCollapsed ? 'Show terminal panel' : 'Collapse terminal panel'}
            aria-label={
              isCollapsed ? 'Show terminal panel' : 'Collapse terminal panel'
            }
            className="p-1.5 rounded-lg bg-[#0b101d] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
          >
            {isCollapsed ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Full-Width Terminal Output Console (No Separate Custom Input / Stdin Panel) */}
      {!isCollapsed && (
        <div
          className="flex flex-col bg-[#050811] overflow-hidden"
          style={{ height: `${terminalHeight}px` }}
        >
          {/* Scrollback Output Buffer with Seamless Inline Active Prompt Line */}
          <div
            ref={outputContainerRef}
            onClick={handleConsoleAreaClick}
            aria-label="Interactive Terminal Output Console"
            role="log"
            aria-live="polite"
            style={{ fontSize: `${fontSize}px` }}
            className="flex-1 overflow-y-auto px-4 py-3 font-mono leading-relaxed space-y-1 cursor-text"
          >
            {entries.length === 0 && !isRunning && !awaitingInput ? (
              <div className="text-slate-500 text-xs py-2">
                Terminal cleared. Click <span className="text-slate-300">Run Code</span>{' '}
                above or type <span className="text-cyan-400">run</span> /{' '}
                <span className="text-cyan-400">help</span> below to interact with{' '}
                <span className="text-slate-300">{filename}</span>.
              </div>
            ) : (
              entries.map((entry) => {
                // Detailed formatted Error Report Card
                if (entry.type === 'error-report' && entry.parsedError) {
                  const err = entry.parsedError;
                  return (
                    <div
                      key={entry.id}
                      role="alert"
                      className="my-1.5 rounded-lg bg-rose-950/35 border border-rose-500/45 px-3.5 py-2.5 space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Error Type: {err.errorType}</span>
                        </span>
                        <span className="text-rose-500/60" aria-hidden="true">
                          |
                        </span>
                        {err.lineNumber !== null ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onJumpToLine?.(err.lineNumber!);
                            }}
                            title={`Click to scroll to and focus Line ${err.lineNumber} in the code editor`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400/50 text-rose-100 font-semibold cursor-pointer transition-colors"
                          >
                            <Crosshair className="w-3 h-3 shrink-0" />
                            <span>Line {err.lineNumber}</span>
                          </button>
                        ) : (
                          <span className="text-rose-200/90 font-semibold">
                            Line N/A
                          </span>
                        )}
                        <span className="text-rose-500/60" aria-hidden="true">
                          |
                        </span>
                        <span className="text-rose-100 break-words">
                          <span className="text-rose-300/90 font-semibold">
                            Details:{' '}
                          </span>
                          {err.message}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Echoed inline interactive prompt + user-entered value on the exact same line
                if (entry.type === 'prompt-echo') {
                  return (
                    <div
                      key={entry.id}
                      className="whitespace-pre-wrap break-words leading-relaxed"
                    >
                      <span className="text-slate-100">{entry.promptLabel}</span>
                      <span className="text-cyan-300 font-semibold">
                        {entry.text}
                      </span>
                    </div>
                  );
                }

                if (entry.type === 'stderr') {
                  const errLines = entry.text.replace(/\r\n/g, '\n').split('\n');
                  return (
                    <div key={entry.id} className="space-y-0.5 py-0.5">
                      {errLines.map((ln, idx) =>
                        ln.length > 0 ? renderStderrLine(ln, idx) : null
                      )}
                    </div>
                  );
                }

                if (entry.type === 'stdout') {
                  return (
                    <pre
                      key={entry.id}
                      className="whitespace-pre-wrap break-words text-slate-100 font-mono m-0"
                    >
                      {entry.text}
                    </pre>
                  );
                }

                if (entry.type === 'input') {
                  return (
                    <div
                      key={entry.id}
                      className="flex items-start gap-2 text-cyan-300 whitespace-pre-wrap break-words"
                    >
                      <span className="text-cyan-500 font-semibold select-none shrink-0">
                        {entry.prefix || '❯'}
                      </span>
                      <span className="font-medium">{entry.text}</span>
                    </div>
                  );
                }

                // system
                return (
                  <div
                    key={entry.id}
                    className="text-cyan-400/90 whitespace-pre-wrap break-words"
                  >
                    {entry.prefix && (
                      <span className="text-slate-500 mr-1.5 select-none">
                        {entry.prefix}
                      </span>
                    )}
                    <span>{entry.text}</span>
                  </div>
                );
              })
            )}

            {/* SEAMLESS INLINE INPUT DIRECTLY AT THE END OF THE CURRENT TERMINAL OUTPUT LINE */}
            {awaitingInput && (
              <div className="flex items-center flex-wrap gap-0 leading-relaxed pt-0.5">
                <span className="text-slate-100 whitespace-pre">
                  {activePromptLabel ?? ''}
                </span>
                <span className="relative inline-flex items-center flex-1 min-w-[160px]">
                  <input
                    ref={inlineStdinRef}
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Inline interactive terminal input"
                    value={inlineStdinValue}
                    onChange={(e) => setInlineStdinValue(e.target.value)}
                    onFocus={() => setIsInlineFocused(true)}
                    onBlur={() => setIsInlineFocused(false)}
                    onKeyDown={handleInlineStdinKeyDown}
                    style={{ fontSize: `${fontSize}px` }}
                    className="w-full bg-transparent text-cyan-300 font-mono font-medium outline-none caret-cyan-400"
                  />
                  {!inlineStdinValue && (
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute left-0 w-[7px] h-[16px] bg-cyan-400/90 edoc-terminal-cursor ${
                        isInlineFocused ? 'opacity-100' : 'opacity-65'
                      }`}
                    />
                  )}
                </span>
              </div>
            )}

            {isRunning && (
              <div className="flex items-center gap-2 text-cyan-300 pt-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>{runningStatusMessage || `Executing ${filename}...`}</span>
              </div>
            )}
          </div>

          {/* Bottom Interactive Shell Prompt Bar (visible when not paused mid-program for inline stdin) */}
          {!awaitingInput && (
            <div className="border-t border-slate-800/90 bg-[#080d18] px-4 py-2">
              <div className="flex items-start gap-2 font-mono">
                <span
                  className="pt-0.5 text-cyan-400 font-semibold select-none shrink-0 whitespace-nowrap"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {safeUserHandle}@edoc ❯
                </span>

                <div className="relative flex-1 min-w-0 flex items-start">
                  <textarea
                    ref={shellTextareaRef}
                    rows={1}
                    aria-label="Interactive terminal command input"
                    value={shellInput}
                    onChange={(e) => {
                      setShellInput(e.target.value);
                      if (historyIndex !== -1) setHistoryIndex(-1);
                    }}
                    onFocus={() => setIsShellFocused(true)}
                    onBlur={() => setIsShellFocused(false)}
                    onKeyDown={handleShellKeyDown}
                    placeholder="Type command (run, help, ls, clear)… ↑/↓ history"
                    style={{ fontSize: `${fontSize}px` }}
                    className="w-full bg-transparent text-cyan-200 placeholder:text-slate-500 font-mono leading-relaxed outline-none resize-none caret-cyan-400 py-0.5 pr-4"
                  />
                  {!shellInput && (
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute left-0 top-1 w-[7px] h-[15px] bg-cyan-400/90 edoc-terminal-cursor ${
                        isShellFocused ? 'opacity-100' : 'opacity-55'
                      }`}
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={submitShellCommand}
                  disabled={isRunning}
                  title="Submit command (Enter)"
                  aria-label="Submit terminal command"
                  className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-cyan-500/20 border border-slate-700/80 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-200 text-[11px] font-mono inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap disabled:opacity-45"
                >
                  <CornerDownLeft className="w-3 h-3" />
                  <span className="hidden sm:inline">Enter</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BYOK AI Debugger Strip (preserved unchanged) */}
      <div className="px-4 py-2.5 bg-[#070b14] border-t border-slate-800/90 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="truncate">{engineLabel}</span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-500 hidden sm:inline whitespace-nowrap">
              {awaitingInput
                ? 'Type input directly in terminal and press Enter · Esc or Stop to cancel'
                : 'Enter to run command · ↑/↓ history · Click error line to jump'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate-500 hidden sm:inline-flex items-center gap-1">
              <Bug className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Assist</span>
            </span>
            <button
              type="button"
              disabled={isLoadingAiDebug}
              onClick={onExplainError}
              className="px-3 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 font-mono text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-55 whitespace-nowrap"
            >
              {isLoadingAiDebug ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {hasErrorOutput ? 'AI Explain Error' : 'AI Debug / Review'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {aiDebugMissingKey && (
          <MissingKeyPrompt
            featureName="AI Debugger"
            onOpenApiKeyModal={() => onOpenApiKeyModal?.()}
            onDismiss={onDismissMissingKey}
          />
        )}

        {aiDebugError && (
          <ByokErrorBanner
            error={aiDebugError}
            onOpenApiKeyModal={() => onOpenApiKeyModal?.()}
            onRetry={onExplainError}
            onDismiss={onDismissAiError}
          />
        )}

        {aiDebugOutput && (
          <div className="rounded-xl bg-[#050811] border border-cyan-500/35 p-3.5 text-xs text-slate-200 leading-relaxed max-h-[200px] overflow-y-auto space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 pb-1 border-b border-slate-800/80">
              <span>AI Debugger · {GEMINI_BYOK_MODEL}</span>
              <button
                type="button"
                onClick={onClearAiDebug}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                Clear
              </button>
            </div>
            <div className="whitespace-pre-wrap">{aiDebugOutput}</div>
          </div>
        )}
      </div>

      {/* Bottom Vertical Drag Resize Handle */}
      {!isCollapsed && (
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Drag to resize terminal height"
          onPointerDown={handleDragStart}
          title="Drag vertically to resize terminal"
          className="h-3.5 bg-[#060911] hover:bg-cyan-500/15 border-t border-slate-800/80 flex items-center justify-center cursor-ns-resize transition-colors group"
        >
          <GripHorizontal className="w-4 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
        </div>
      )}
    </section>
  );
};
