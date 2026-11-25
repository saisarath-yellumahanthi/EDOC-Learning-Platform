import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  X,
  Loader2,
  FileCode2,
  AlertCircle,
  Lock,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import {
  SavedCodeRecord,
  getSavedLanguageLabel,
  SAVED_CODE_MAX_TITLE_LENGTH,
} from '../utils/savedCodesHelpers';
import { createSavedCode, updateExistingSavedCode } from '../lib/savedCodes';

export interface SaveCodeModalProps {
  isOpen: boolean;
  userId: string | null | undefined;
  language: string;
  code: string;
  activeSavedSnippet: SavedCodeRecord | null;
  onClose: () => void;
  onSaved: (record: SavedCodeRecord, mode: 'created' | 'updated') => void;
}

export const SaveCodeModal: React.FC<SaveCodeModalProps> = ({
  isOpen,
  userId,
  language,
  code,
  activeSavedSnippet,
  onClose,
  onSaved,
}) => {
  const [title, setTitle] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savingMode, setSavingMode] = useState<'update' | 'new' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requiresAuth, setRequiresAuth] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(activeSavedSnippet?.title || '');
    setErrorMsg(null);
    setRequiresAuth(!userId);
    setSavingMode(null);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [isOpen, activeSavedSnippet, userId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const lineCount = code.replace(/\r\n/g, '\n').split('\n').length;
  const langLabel = getSavedLanguageLabel(language);

  const handleSaveAsNew = async () => {
    setIsSaving(true);
    setSavingMode('new');
    setErrorMsg(null);
    try {
      const res = await createSavedCode({
        userId: userId || undefined,
        title,
        language,
        code,
      });
      if (res.requiresAuth) {
        setRequiresAuth(true);
        setErrorMsg(res.error || 'Please sign in to save code to your account.');
        return;
      }
      if (res.error || !res.data) {
        setErrorMsg(res.error || 'Unable to save snippet.');
        return;
      }
      onSaved(res.data, 'created');
      onClose();
    } finally {
      setIsSaving(false);
      setSavingMode(null);
    }
  };

  const handleUpdateExisting = async () => {
    if (!activeSavedSnippet) {
      await handleSaveAsNew();
      return;
    }
    setIsSaving(true);
    setSavingMode('update');
    setErrorMsg(null);
    try {
      const res = await updateExistingSavedCode({
        id: activeSavedSnippet.id,
        userId: userId || undefined,
        title,
        language,
        code,
      });
      if (res.requiresAuth) {
        setRequiresAuth(true);
        setErrorMsg(res.error || 'Please sign in to update saved code.');
        return;
      }
      if (res.error || !res.data) {
        setErrorMsg(res.error || 'Unable to update snippet.');
        return;
      }
      onSaved(res.data, 'updated');
      onClose();
    } finally {
      setIsSaving(false);
      setSavingMode(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || requiresAuth) return;
    if (activeSavedSnippet) {
      void handleUpdateExisting();
    } else {
      void handleSaveAsNew();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-code-modal-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-[#0b101d] border border-slate-800 shadow-[0_24px_80px_rgba(0,0,0,0.75)] overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#070b14] border-b border-slate-800/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Save className="w-4 h-4 text-cyan-400 shrink-0" />
            <h3
              id="save-code-modal-title"
              className="text-sm font-display font-bold text-white truncate"
            >
              {activeSavedSnippet
                ? 'Save Changes to Code Snippet'
                : 'Save Code to Your Account'}
            </h3>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            aria-label="Close save code dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer disabled:opacity-45"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {requiresAuth ? (
            <div className="rounded-xl bg-amber-950/30 border border-amber-500/35 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-mono font-semibold">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Sign In Required</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {errorMsg ||
                  'Please sign in to your EDOC account to save code snippets and access them later in your Profile Dashboard.'}
              </p>
            </div>
          ) : (
            <>
              {activeSavedSnippet && (
                <div className="rounded-xl bg-cyan-950/20 border border-cyan-500/30 px-3.5 py-2.5 text-xs font-mono text-cyan-200">
                  Loaded snippet:{' '}
                  <span className="font-semibold text-white">
                    {activeSavedSnippet.title}
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="saved-code-title-input"
                  className="block text-xs font-mono font-semibold text-slate-300"
                >
                  Snippet Title
                </label>
                <input
                  ref={inputRef}
                  id="saved-code-title-input"
                  type="text"
                  maxLength={SAVED_CODE_MAX_TITLE_LENGTH}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Binary Search Practice"
                  className="w-full rounded-xl bg-[#060911] border border-slate-700/90 focus:border-cyan-400 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-0.5">
                <span className="inline-flex items-center gap-1.5 text-slate-300">
                  <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{langLabel}</span>
                </span>
                <span className="tabular-nums">
                  {lineCount} {lineCount === 1 ? 'line' : 'lines'}
                </span>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-xl bg-rose-950/35 border border-rose-500/40 px-3.5 py-2.5 text-xs text-rose-200 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-[#070b14] hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 cursor-pointer transition-colors whitespace-nowrap"
            >
              Cancel
            </button>

            {!requiresAuth && activeSavedSnippet && (
              <>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void handleSaveAsNew()}
                  className="px-3.5 py-2 rounded-lg bg-[#11192c] hover:bg-slate-800 border border-slate-700 text-xs font-mono font-semibold text-cyan-300 inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {savingMode === 'new' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <PlusCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Save as New</span>
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {savingMode === 'update' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Update Existing</span>
                </button>
              </>
            )}

            {!requiresAuth && !activeSavedSnippet && (
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save Code'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
