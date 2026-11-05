import React, { useState } from 'react';
import {
  User,
  AtSign,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { EdocLogo } from './EdocLogo';
import {
  UserProfile,
  createCleanUserProfile,
  isEduEmail,
  validateAuthInput,
} from '../utils/edocLogic';

export type AuthenticatedUser = UserProfile;

interface StoredAccountRecord {
  profile: UserProfile;
  passwordHash: string;
}

const USERS_DB_STORAGE_KEY = 'edoc_users_db_v1';

export function loadRegisteredUsersMap(): Record<string, StoredAccountRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(USERS_DB_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveRegisteredUserProfile(
  profile: UserProfile,
  passwordHash?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const db = loadRegisteredUsersMap();
    const key = profile.email.toLowerCase();
    const existing = db[key];
    db[key] = {
      profile,
      passwordHash: passwordHash ?? existing?.passwordHash ?? '',
    };
    window.localStorage.setItem(USERS_DB_STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Ignore storage quota errors
  }
}

interface AuthScreenProps {
  onSuccess: (user: AuthenticatedUser) => void;
}

const STAR_POSITIONS = [
  { top: '8%', left: '12%', size: 2.5, opacity: 0.7 },
  { top: '14%', left: '78%', size: 2, opacity: 0.5 },
  { top: '19%', left: '26%', size: 1.5, opacity: 0.45 },
  { top: '24%', left: '88%', size: 3, opacity: 0.8 },
  { top: '33%', left: '9%', size: 2, opacity: 0.6 },
  { top: '42%', left: '84%', size: 1.5, opacity: 0.4 },
  { top: '54%', left: '15%', size: 3, opacity: 0.85 },
  { top: '58%', left: '77%', size: 2.5, opacity: 0.65 },
  { top: '66%', left: '22%', size: 2, opacity: 0.7 },
  { top: '71%', left: '89%', size: 2, opacity: 0.5 },
  { top: '79%', left: '14%', size: 1.5, opacity: 0.5 },
  { top: '84%', left: '73%', size: 2.5, opacity: 0.75 },
  { top: '89%', left: '34%', size: 2, opacity: 0.55 },
  { top: '91%', left: '61%', size: 1.5, opacity: 0.4 },
];

const INPUT_STAR_DOTS = [
  { top: '24%', left: '18%', size: 1.5, delay: '0s' },
  { top: '68%', left: '34%', size: 2, delay: '0.8s' },
  { top: '32%', left: '56%', size: 1.5, delay: '1.6s' },
  { top: '74%', left: '76%', size: 2, delay: '0.4s' },
  { top: '28%', left: '88%', size: 1.5, delay: '1.2s' },
];

const InputShootingStarBackdrop: React.FC = () => (
  <div
    className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
    aria-hidden="true"
  >
    {/* Subtle deep-space blue tint */}
    <div
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(90deg, rgba(15, 23, 42, 0.28) 0%, rgba(30, 64, 175, 0.16) 50%, rgba(15, 23, 42, 0.28) 100%)',
      }}
    />
    {/* Steady twinkling micro-stars inside input box */}
    {INPUT_STAR_DOTS.map((dot, idx) => (
      <span
        key={idx}
        className="absolute rounded-full bg-blue-300 edoc-star-twinkle"
        style={{
          top: dot.top,
          left: dot.left,
          width: `${dot.size}px`,
          height: `${dot.size}px`,
          animationDelay: dot.delay,
          boxShadow: '0 0 6px #3b82f6',
        }}
      />
    ))}
    {/* Smooth steady meteor streak #1 (top-right to bottom-left) */}
    <span
      className="edoc-input-shooting-star-1 absolute top-[14%] right-[-10%] w-24 h-[1.5px] rounded-full"
      style={{
        background:
          'linear-gradient(90deg, #ffffff 0%, rgba(59, 130, 246, 0.95) 35%, rgba(37, 99, 235, 0) 100%)',
        boxShadow: '0 0 10px #2563eb, 0 0 18px #3b82f6',
      }}
    />
    {/* Smooth steady meteor streak #2 (top-right to bottom-left) */}
    <span
      className="edoc-input-shooting-star-2 absolute top-[38%] right-[-15%] w-20 h-[1.5px] rounded-full"
      style={{
        background:
          'linear-gradient(90deg, #ffffff 0%, rgba(96, 165, 250, 0.9) 30%, rgba(37, 99, 235, 0) 100%)',
        boxShadow: '0 0 8px #2563eb, 0 0 14px #3b82f6',
      }}
    />
  </div>
);

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const eduVerified = isEduEmail(email);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateAuthInput(mode, fullName, email, password);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Please check your credentials.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const usersDb = loadRegisteredUsersMap();
    const existingRecord = usersDb[normalizedEmail];

    if (mode === 'signup') {
      // Initialize brand-new user document with a clean slate:
      // Level 1, 0 XP, empty solvedDsaIds array, empty completedTopics array
      const cleanProfile = createCleanUserProfile(fullName, normalizedEmail);
      saveRegisteredUserProfile(cleanProfile, password);
      setErrorMsg(null);
      onSuccess(cleanProfile);
      return;
    }

    // Sign-In mode
    if (existingRecord) {
      if (
        existingRecord.passwordHash &&
        existingRecord.passwordHash !== password
      ) {
        setErrorMsg('Incorrect password for this account. Please try again.');
        return;
      }
      setErrorMsg(null);
      onSuccess(existingRecord.profile);
      return;
    }

    // First-time sign-in creates a clean-slate profile (Level 1, 0 XP, empty arrays)
    const derivedName =
      fullName.trim() ||
      normalizedEmail
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

    const newCleanProfile = createCleanUserProfile(derivedName, normalizedEmail);
    saveRegisteredUserProfile(newCleanProfile, password);
    setErrorMsg(null);
    onSuccess(newCleanProfile);
  };

  const inputWrapperClass =
    'relative flex items-center rounded-xl bg-transparent border-2 border-[#2563eb] focus-within:border-[#3b82f6] shadow-[0_0_20px_rgba(37,99,235,0.65),0_0_6px_rgba(37,99,235,0.5),inset_0_0_14px_rgba(37,99,235,0.28)] focus-within:shadow-[0_0_28px_rgba(59,130,246,0.95),0_0_10px_rgba(37,99,235,0.8),inset_0_0_18px_rgba(59,130,246,0.4)] transition-all duration-300 overflow-hidden';

  return (
    <main className="min-h-screen w-full bg-[#060911] text-slate-100 relative overflow-hidden flex flex-col items-center justify-center px-4 py-10">
      {/* Subtle Cosmic Radial Atmosphere */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 18%, rgba(37, 99, 235, 0.16) 0%, rgba(30, 58, 138, 0.09) 38%, rgba(6, 9, 17, 0) 70%)',
        }}
        aria-hidden="true"
      />

      {/* Crisp Cosmic Starfield & Diagonal Meteors (Top-Right to Bottom-Left) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {STAR_POSITIONS.map((star, idx) => (
          <span
            key={idx}
            className="absolute rounded-full bg-white edoc-star-twinkle"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: `${(idx % 5) * 0.6}s`,
              boxShadow: '0 0 6px rgba(255,255,255,0.8)',
            }}
          />
        ))}
        {/* Meteors gracing diagonally downward from top-right corner to bottom-left corner */}
        <div
          className="edoc-shooting-star-bg absolute top-[6%] right-[4%] w-36 h-[2px] rounded-full bg-gradient-to-r from-white via-blue-400 to-transparent shadow-[0_0_14px_#2563eb]"
        />
        <div
          className="edoc-shooting-star-bg absolute top-[18%] right-[-4%] w-32 h-[2px] rounded-full bg-gradient-to-r from-white via-cyan-300 to-transparent shadow-[0_0_12px_#3b82f6]"
          style={{ animationDelay: '1.9s' }}
        />
        <div
          className="edoc-shooting-star-bg absolute top-[-2%] right-[28%] w-28 h-[1.5px] rounded-full bg-gradient-to-r from-white via-blue-500 to-transparent shadow-[0_0_12px_#2563eb]"
          style={{ animationDelay: '3.8s' }}
        />
      </div>

      {/* Top Centered EDOC Logo Badge */}
      <div className="relative z-10 mb-7">
        <EdocLogo variant="stacked" size="lg" />
      </div>

      {/* Main Authentication Card */}
      <section
        aria-label="EDOC Student Authentication"
        className="relative z-10 w-full max-w-[430px] rounded-2xl bg-[#0b0f1a]/90 backdrop-blur-md border-2 border-[#2563eb] shadow-[0_0_45px_rgba(37,99,235,0.38)] p-7 sm:p-8"
      >
        {/* Top Segmented Mode Switcher: Sign In / Sign Up */}
        <div
          role="tablist"
          aria-label="Authentication Mode"
          className="grid grid-cols-2 p-1 rounded-xl bg-[#070a12] border border-slate-800/90 mb-7"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`py-2.5 px-4 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'signin'
                ? 'bg-amber-500 text-slate-950 shadow-[0_2px_12px_rgba(245,158,11,0.35)]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`py-2.5 px-4 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'signup'
                ? 'bg-amber-500 text-slate-950 shadow-[0_2px_12px_rgba(245,158,11,0.35)]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 px-3.5 py-2.5 text-xs text-rose-200"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {mode === 'signup' && (
            <div>
              <label
                htmlFor="auth-fullname"
                className="block text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase mb-2"
              >
                FULL NAME
              </label>
              <div className={inputWrapperClass}>
                <InputShootingStarBackdrop />
                <User
                  className="w-4 h-4 text-blue-400 absolute left-3.5 z-10 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="auth-fullname"
                  name="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="relative z-10 w-full rounded-xl bg-transparent pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-400/80 outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="auth-email"
                className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase"
              >
                STUDENT EMAIL
              </label>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                  eduVerified ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                {eduVerified ? 'Edu Verified' : 'Standard Account'}
              </span>
            </div>
            <div className={inputWrapperClass}>
              <InputShootingStarBackdrop />
              <AtSign
                className="w-4 h-4 text-blue-400 absolute left-3.5 z-10 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="auth-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="relative z-10 w-full rounded-xl bg-transparent pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-400/80 outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase mb-2"
            >
              PASSWORD
            </label>
            <div className={inputWrapperClass}>
              <InputShootingStarBackdrop />
              <KeyRound
                className="w-4 h-4 text-blue-400 absolute left-3.5 z-10 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="auth-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="relative z-10 w-full rounded-xl bg-transparent pl-10 pr-11 py-3 text-sm text-slate-100 placeholder:text-slate-400/80 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 z-10 p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-500 text-slate-950 font-display font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_4px_22px_rgba(245,158,11,0.35)] transition-all cursor-pointer whitespace-nowrap"
          >
            <span>
              {mode === 'signup'
                ? 'CREATE STUDENT ACCOUNT'
                : 'SIGN IN TO WORKSPACE'}
            </span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        {/* Divider and Footer Switch */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col items-center gap-3 text-xs text-slate-400">
          <div>
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                  }}
                  className="text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                New to EDOC?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};
