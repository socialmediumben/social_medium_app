'use client';

import { useState } from 'react';
import {
  CreditCard,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Code2,
  BookOpen,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDevMode } from '@/context/DevModeContext';
import { APP_VERSION } from '@/lib/version';
import { getNeonOAuthLoginUrl } from '@/lib/neon';

export function TapCardLogin() {
  const [inputCardId, setInputCardId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirectingOAuth, setIsRedirectingOAuth] = useState(false);
  const { login, loginError } = useAuth();
  const { isDevMode, toggleDevMode, openChangelog } = useDevMode();

  const handleOAuthLogin = () => {
    setIsRedirectingOAuth(true);
    const authUrl = getNeonOAuthLoginUrl();
    window.location.href = authUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCardId.trim()) {
      setIsSubmitting(true);
      await login(inputCardId.trim());
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-lg text-center">
      {/* Brand Icon */}
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#3bc0cd] via-[#344ea2] to-[#f16622] flex items-center justify-center text-white text-2xl font-fredoka font-bold shadow-md">
        SM
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f16622]/10 text-[#f16622] text-xs font-semibold uppercase tracking-wider mb-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Secure Member Access</span>
      </div>

      <h1 className="font-fredoka text-2xl sm:text-3xl font-bold text-stone-900 mb-2">
        Member Login
      </h1>
      <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-6 font-roboto">
        Sign in to view your profile, authorized tool certifications, and RSVP for makerspace events.
      </p>

      {loginError && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold mb-0.5">Login Notice:</strong>
            <span>{loginError}</span>
          </div>
        </div>
      )}

      {/* PRIMARY LOGIN: Sign In with Neon One (Single Sign-On) */}
      <div className="space-y-3 mb-6">
        <button
          type="button"
          onClick={handleOAuthLogin}
          disabled={isRedirectingOAuth}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#00aced] via-[#344ea2] to-[#1e2e66] hover:from-[#009fd9] hover:to-[#172554] text-white font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg cursor-pointer group disabled:opacity-75"
        >
          {isRedirectingOAuth ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Redirecting to Neon One...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-[#3bc0cd]" />
              <span>Sign In with Neon One</span>
              <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform ml-auto" />
            </>
          )}
        </button>

        <p className="text-[11px] text-stone-500 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Uses your existing Social Medium Neon One username & password</span>
        </p>
      </div>

      {/* DIVIDER */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 font-bold text-stone-400 tracking-wider">
            Or Scan Physical Pass
          </span>
        </div>
      </div>

      {/* SECONDARY LOGIN: Tap Card ID Scan / Input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            disabled={isSubmitting}
            value={inputCardId}
            onChange={(e) => setInputCardId(e.target.value)}
            placeholder="Scan NFC or enter Tap Card..."
            className="w-full text-center px-4 py-3 rounded-xl border border-stone-200 focus:border-[#3bc0cd] focus:ring-2 focus:ring-[#3bc0cd]/20 font-mono text-sm font-bold tracking-wider text-stone-800 transition-all outline-hidden placeholder:text-stone-400 placeholder:font-normal placeholder:text-xs disabled:opacity-60 bg-stone-50/60"
          />
          <CreditCard className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Checking Card...</span>
            </>
          ) : (
            <>
              <span>Quick Tap Card Lookup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Developer Mode Card inside login */}
      <div className="mt-8 pt-5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
        <div className="flex items-center gap-1.5 font-medium">
          <Code2 className="w-3.5 h-3.5 text-stone-400" />
          <span>Developer Mode</span>
        </div>
        {isDevMode ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openChangelog}
              className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-800 font-mono font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>v{APP_VERSION}</span>
              <BookOpen className="w-3 h-3 text-amber-700" />
            </button>
            <button
              type="button"
              onClick={toggleDevMode}
              className="text-[#344ea2] hover:underline font-semibold cursor-pointer"
            >
              Turn OFF
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleDevMode}
            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer transition-colors"
          >
            Turn ON
          </button>
        )}
      </div>
    </div>
  );
}
