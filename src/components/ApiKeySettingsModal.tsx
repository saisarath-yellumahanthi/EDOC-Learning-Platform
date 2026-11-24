import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Trash2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  getUserGeminiKey,
  saveUserGeminiKey,
  clearUserGeminiKey,
  maskApiKeyPreview,
  AI_STUDIO_API_KEYS_URL,
  GEMINI_BYOK_MODEL,
  type ByokErrorInfo,
} from '../lib/geminiByok';

interface ApiKeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeySettingsModal: React.FC<ApiKeySettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [savedKey, setSavedKey] = useState<string>('');
  const [keyInput, setKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const current = getUserGeminiKey();
    setSavedKey(current);
    setKeyInput(current);
    setShowKey(false);
    setStatusMessage(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const isConnected = savedKey.length > 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const res = saveUserGeminiKey(keyInput);
    if (!res.ok) {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Please enter a non-empty API key.',
      });
      return;
    }
    const updated = getUserGeminiKey();
    setSavedKey(updated);
    setKeyInput(updated);
    setStatusMessage({
      type: 'success',
      text: 'Personal Gemini API key saved locally in this browser. All EDOC AI tools are now unlocked!',
    });
  };

  const handleClear = () => {
    clearUserGeminiKey();
    setSavedKey('');
    setKeyInput('');
    setStatusMessage({
      type: 'success',
      text: 'Personal Gemini API key removed from this browser.',
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gemini API Key Settings"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center px-4 py-6"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#0b101d] border border-cyan-500/40 shadow-[0_0_50px_rgba(34,211,238,0.16)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#070b14] border-b border-slate-800/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/35 flex items-center justify-center text-cyan-400 shrink-0">
              <KeyRound className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-display font-bold text-white truncate">
                Bring Your Own Gemini API Key
              </h2>
              <p className="text-[11px] font-mono text-slate-400 truncate">
                Model: {GEMINI_BYOK_MODEL} · Stored strictly in localStorage
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close API Key Settings"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status Row */}
          <div className="rounded-xl bg-[#060911] border border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-slate-400">Connection Status:</span>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected ({maskApiKeyPreview(savedKey)})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-400 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Not Set</span>
              </span>
            )}
          </div>

          {/* 3-Step Setup Guide */}
          <div className="rounded-xl bg-cyan-950/20 border border-cyan-500/25 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-semibold text-cyan-300 uppercase tracking-wider">
                Quick 3-Step Setup Guide
              </span>
              <a
                href={AI_STUDIO_API_KEYS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-300 leading-relaxed">
              <li>
                Open{' '}
                <a
                  href={AI_STUDIO_API_KEYS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2 font-mono"
                >
                  aistudio.google.com/api-keys
                </a>{' '}
                and sign in with your Google account.
              </li>
              <li>
                Click <strong className="text-white">Create API Key</strong> and
                copy your personal Gemini key.
              </li>
              <li>
                Paste your key below and click{' '}
                <strong className="text-white">Save Key</strong> to unlock AI
                Tutor, Quiz AI Helpers, DSA Hints, and AI Debugging across EDOC.
              </li>
            </ol>
          </div>

          {/* Feedback Banner */}
          {statusMessage && (
            <div
              role={statusMessage.type === 'error' ? 'alert' : 'status'}
              className={`rounded-xl px-3.5 py-2.5 text-xs flex items-start gap-2 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Key Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="byok-gemini-key-input"
                className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400"
              >
                Personal Gemini API Key
              </label>
              <div className="relative flex items-center">
                <input
                  id="byok-gemini-key-input"
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Paste your Gemini API key..."
                  className="w-full rounded-xl bg-[#060911] border border-slate-700 focus:border-cyan-400 pl-3.5 pr-11 py-2.5 text-xs sm:text-sm font-mono text-white placeholder:text-slate-500 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((prev) => !prev)}
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                  className="absolute right-3 p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>
                  Saved strictly in your browser&apos;s localStorage (
                  <code className="font-mono text-slate-400">
                    edoc_user_gemini_key
                  </code>
                  ). Never sent to Supabase or logged.
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
              {isConnected ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3.5 py-2 rounded-xl bg-[#060911] hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-xs font-mono text-slate-300 hover:text-rose-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Key</span>
                </button>
              ) : (
                <span className="text-[11px] font-mono text-slate-500">
                  Static quizzes &amp; editor work without a key
                </span>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[#060911] hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 cursor-pointer transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs inline-flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.28)] cursor-pointer transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Save Key</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

interface MissingKeyPromptProps {
  featureName: string;
  onOpenApiKeyModal: () => void;
  onDismiss?: () => void;
}

export const MissingKeyPrompt: React.FC<MissingKeyPromptProps> = ({
  featureName,
  onOpenApiKeyModal,
  onDismiss,
}) => (
  <div
    role="alert"
    className="rounded-xl bg-amber-950/35 border border-amber-500/45 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
  >
    <div className="flex items-start gap-2.5 min-w-0 flex-1">
      <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <div className="font-mono font-semibold text-amber-300">
          Connect Your Gemini API Key for {featureName}
        </div>
        <p className="text-amber-100/85 leading-relaxed">
          EDOC uses Bring Your Own Key (BYOK) so AI features run on your own
          free Google AI Studio key. Add your key once to unlock AI Tutor, AI
          Quiz Helpers, DSA Hints, and AI Debugging.
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={onOpenApiKeyModal}
        className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
      >
        <KeyRound className="w-3.5 h-3.5" />
        <span>Open API Key Settings</span>
      </button>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss API key prompt"
          className="p-1.5 rounded-lg text-amber-300 hover:text-white hover:bg-amber-900/40 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);

interface ByokErrorBannerProps {
  error: ByokErrorInfo;
  onOpenApiKeyModal: () => void;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ByokErrorBanner: React.FC<ByokErrorBannerProps> = ({
  error,
  onOpenApiKeyModal,
  onRetry,
  onDismiss,
}) => (
  <div
    role="alert"
    className="rounded-xl bg-rose-950/35 border border-rose-500/45 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
  >
    <div className="flex items-start gap-2.5 text-rose-200 min-w-0 flex-1">
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-0.5 min-w-0">
        <div className="font-mono font-semibold text-amber-300">
          {error.title}
        </div>
        <p className="text-rose-100/90 leading-relaxed break-words">
          {error.message}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2 shrink-0">
      {(error.code === 'NO_API_KEY' || error.code === 'INVALID_KEY') && (
        <button
          type="button"
          onClick={onOpenApiKeyModal}
          className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Update Key</span>
        </button>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error banner"
          className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900/40 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);
