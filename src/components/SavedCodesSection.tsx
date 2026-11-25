import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Terminal as TerminalIcon,
  FileCode2,
  AlertCircle,
  Loader2,
  Clock,
  FolderCode,
} from 'lucide-react';
import {
  SavedCodeRecord,
  buildCodePreview,
  filterSavedCodes,
  formatSavedCodeTimestamp,
  getSavedLanguageLabel,
  getSavedLanguageFilename,
  normalizeSavedLanguage,
} from '../utils/savedCodesHelpers';
import { fetchUserSavedCodes, deleteSavedCode } from '../lib/savedCodes';
import type { TerminalCodePayload } from './WorkspaceViews';

export interface SavedCodesSectionProps {
  userId: string;
  onOpenInTerminal: (payload: TerminalCodePayload) => void;
  onNavigateTerminal: () => void;
}

const LANGUAGE_FILTERS = [
  { id: 'all', label: 'All Languages' },
  { id: 'python', label: 'Python' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'java', label: 'Java' },
  { id: 'sql', label: 'SQL' },
  { id: 'web', label: 'Web' },
];

export const SavedCodesSection: React.FC<SavedCodesSectionProps> = ({
  userId,
  onOpenInTerminal,
  onNavigateTerminal,
}) => {
  const [savedCodes, setSavedCodes] = useState<SavedCodeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const loadSavedCodes = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const res = await fetchUserSavedCodes(userId);
    if (res.error) {
      setErrorMsg(res.error);
      setSavedCodes([]);
    } else {
      setSavedCodes(res.data || []);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    void loadSavedCodes();
  }, [loadSavedCodes]);

  const filtered = filterSavedCodes(savedCodes, searchQuery, languageFilter);

  const handleCopy = async (item: SavedCodeRecord) => {
    try {
      await navigator.clipboard.writeText(item.code);
    } catch {
      const temp = document.createElement('textarea');
      temp.value = item.code;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
    }
    setCopiedId(item.id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === item.id ? null : prev));
    }, 1800);
  };

  const handleConfirmDelete = async (item: SavedCodeRecord) => {
    setDeletingId(item.id);
    const res = await deleteSavedCode({ id: item.id, userId });
    setDeletingId(null);
    setConfirmDeleteId(null);

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    setSavedCodes((prev) => prev.filter((row) => row.id !== item.id));
    setStatusToast(`Deleted "${item.title}"`);
    window.setTimeout(() => setStatusToast(null), 2600);
  };

  const handleOpen = (item: SavedCodeRecord) => {
    const langKey = normalizeSavedLanguage(item.language);
    onOpenInTerminal({
      filename: getSavedLanguageFilename(langKey),
      language: langKey,
      code: item.code,
      command: `Loaded saved snippet: ${item.title}`,
      output: [],
      chapterTitle: `Saved Code · ${item.title}`,
      savedCode: item,
    });
  };

  return (
    <div className="space-y-5">
      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved codes by title or code..."
              aria-label="Search saved codes"
              className="w-full rounded-xl bg-[#0b101d] border border-slate-800 focus:border-cyan-500/60 pl-10 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition-colors"
            />
          </div>

          <select
            aria-label="Filter saved codes by language"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="rounded-xl bg-[#0b101d] border border-slate-800 focus:border-cyan-500/60 px-3 py-2 text-xs font-mono text-slate-200 outline-none cursor-pointer"
          >
            {LANGUAGE_FILTERS.map((f) => (
              <option key={f.id} value={f.id} className="bg-[#0b101d] text-white">
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void loadSavedCodes()}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-[#0b101d] hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={onNavigateTerminal}
            className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Open Terminal</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {statusToast && (
        <div
          role="status"
          className="rounded-xl bg-emerald-950/35 border border-emerald-500/35 px-4 py-2.5 text-xs font-mono text-emerald-300 flex items-center justify-between"
        >
          <span>{statusToast}</span>
          <button
            type="button"
            onClick={() => setStatusToast(null)}
            className="text-emerald-400 hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error State */}
      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl bg-rose-950/30 border border-rose-500/40 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-200"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadSavedCodes()}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-100 font-mono cursor-pointer whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="rounded-xl bg-[#0b101d] border border-slate-800/80 p-5 space-y-3 animate-pulse"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="h-4 w-44 rounded bg-slate-800" />
                <div className="h-4 w-16 rounded bg-slate-800" />
              </div>
              <div className="h-20 w-full rounded-lg bg-[#060911]" />
              <div className="h-7 w-52 rounded bg-slate-800" />
            </div>
          ))}
        </div>
      ) : savedCodes.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl bg-[#0b101d] border border-slate-800/90 px-6 py-12 text-center space-y-4">
          <div className="w-11 h-11 rounded-xl bg-[#060911] border border-slate-800 mx-auto flex items-center justify-center text-cyan-400">
            <FolderCode className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-display font-bold text-white">
              No Saved Code Snippets Yet
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Write code in the EDOC Terminal and click{' '}
              <span className="text-cyan-300 font-mono">Save Code</span> to keep
              reusable algorithms, templates, and practice solutions synced to
              your account.
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateTerminal}
            className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <TerminalIcon className="w-4 h-4" />
            <span>Write Your First Snippet</span>
          </button>
        </div>
      ) : filtered.length === 0 ? (
        /* No Search Matches */
        <div className="rounded-2xl bg-[#0b101d] border border-slate-800/90 px-6 py-10 text-center space-y-2">
          <p className="text-sm font-semibold text-white">
            No snippets match your current filter
          </p>
          <p className="text-xs text-slate-400">
            Try clearing your search query or selecting &quot;All Languages&quot;.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setLanguageFilter('all');
            }}
            className="mt-2 px-3 py-1.5 rounded-lg bg-[#070b14] hover:bg-slate-800 border border-slate-800 text-xs font-mono text-cyan-300 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Saved Code Cards Grid */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 tabular-nums">
            <span>
              Showing {filtered.length} of {savedCodes.length} saved{' '}
              {savedCodes.length === 1 ? 'snippet' : 'snippets'}
            </span>
            <span>Ordered by most recently updated</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((item) => {
              const langLabel = getSavedLanguageLabel(item.language);
              const preview = buildCodePreview(item.code, 4);
              const isConfirming = confirmDeleteId === item.id;
              const isDeleting = deletingId === item.id;
              const isCopied = copiedId === item.id;

              return (
                <article
                  key={item.id}
                  className="rounded-xl bg-[#0b101d] border border-slate-800/90 hover:border-slate-700/90 p-5 flex flex-col justify-between gap-4 transition-colors"
                >
                  <div className="space-y-3">
                    {/* Card Header: Title + Unboxed Language / Timestamp Metadata */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <h3 className="text-base font-display font-bold text-white truncate">
                          {item.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                          <span className="inline-flex items-center gap-1 text-cyan-300 font-semibold">
                            <FileCode2 className="w-3.5 h-3.5 shrink-0" />
                            <span>{langLabel}</span>
                          </span>
                          <span aria-hidden="true" className="text-slate-600">
                            ·
                          </span>
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Clock className="w-3 h-3 shrink-0 text-slate-500" />
                            <span>
                              Updated {formatSavedCodeTimestamp(item.updated_at)}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Short Monospace Code Preview */}
                    <pre className="rounded-lg bg-[#050811] border border-slate-800/80 p-3 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto max-h-[116px] m-0">
                      {preview}
                    </pre>
                  </div>

                  {/* Card Actions */}
                  {isConfirming ? (
                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono text-rose-300">
                        Delete this snippet permanently?
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#070b14] hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => void handleConfirmDelete(item)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/50 text-rose-200 text-xs font-mono font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>Confirm Delete</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpen(item)}
                        className="px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                      >
                        <TerminalIcon className="w-3.5 h-3.5" />
                        <span>Open in Terminal</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleCopy(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#070b14] hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                        >
                          {isCopied ? (
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

                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.id)}
                          aria-label={`Delete ${item.title}`}
                          className="px-2.5 py-1.5 rounded-lg bg-[#070b14] hover:bg-rose-950/50 border border-slate-800 hover:border-rose-500/40 text-xs font-mono text-slate-400 hover:text-rose-300 inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
