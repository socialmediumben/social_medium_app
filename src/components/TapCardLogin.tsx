'use client';

import { useState, useEffect } from 'react';
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
  Smartphone,
  Radio,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDevMode } from '@/context/DevModeContext';
import { APP_VERSION } from '@/lib/version';
import { getNeonOAuthLoginUrl, normalizeNfcTapCard } from '@/lib/neon';

export function TapCardLogin() {
  const [inputCardId, setInputCardId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirectingOAuth, setIsRedirectingOAuth] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [nfcError, setNfcError] = useState<string | null>(null);
  const [hasNfcSupport, setHasNfcSupport] = useState(false);
  const { login, loginError } = useAuth();
  const { isDevMode, toggleDevMode, openChangelog } = useDevMode();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setHasNfcSupport(true);
    }
  }, []);

  const handleStartNfcScan = async () => {
    setNfcError(null);
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      setNfcError('In-browser NFC scanning is available on Android Chrome. iPhone users can use "Sign In with Neon One" above.');
      return;
    }

    try {
      setIsNfcScanning(true);
      const NDEFReaderClass = (window as any).NDEFReader;
      const ndef = new NDEFReaderClass();
      await ndef.scan();

      ndef.onreadingerror = () => {
        setNfcError('Could not read card. Please try holding it closer to the NFC antenna on the back of your phone.');
      };

      ndef.onreading = async (event: any) => {
        let detectedCard = '';
        if (event.serialNumber) {
          detectedCard = normalizeNfcTapCard(event.serialNumber);
        }

        // Also check if any NDEF record has a card query or text
        if (event.message && event.message.records) {
          for (const record of event.message.records) {
            if (record.recordType === 'url') {
              const decoder = new TextDecoder();
              const urlStr = decoder.decode(record.data);
              const match = urlStr.match(/[?&](?:card|tapCard)=([^&]+)/i);
              if (match && match[1]) {
                detectedCard = match[1];
                break;
              }
            } else if (record.recordType === 'text') {
              const textDecoder = new TextDecoder(record.encoding || 'utf-8');
              const text = textDecoder.decode(record.data);
              if (text && /^\d+$/.test(text.trim())) {
                detectedCard = text.trim();
                break;
              }
            }
          }
        }

        if (detectedCard) {
          setIsNfcScanning(false);
          setIsSubmitting(true);
          await login(detectedCard);
          setIsSubmitting(false);
        }
      };
    } catch (err: any) {
      setIsNfcScanning(false);
      if (err.name === 'NotAllowedError') {
        setNfcError('NFC permission was denied. Please allow NFC access in Chrome settings.');
      } else if (err.name === 'NotSupportedError') {
        setNfcError('NFC is not supported or is turned off on this device.');
      } else {
        setNfcError(`NFC Scan error: ${err.message || 'Please ensure NFC is turned on.'}`);
      }
    }
  };

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
      <div className="space-y-3">
        {/* Android Web NFC Tap Button */}
        <button
          type="button"
          onClick={handleStartNfcScan}
          disabled={isSubmitting || isNfcScanning}
          className="w-full py-3.5 px-5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer group shadow-xs disabled:opacity-60"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div className="text-left">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <span>Tap Card to Phone</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Android Only
                </span>
              </div>
              <div className="text-[11px] text-emerald-700 font-normal">
                Hold your physical card to phone back
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
        </button>

        {nfcError && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{nfcError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="relative">
            <input
              type="text"
              disabled={isSubmitting}
              value={inputCardId}
              onChange={(e) => setInputCardId(e.target.value)}
              placeholder="Or enter Tap Card number..."
              className="w-full text-center px-4 py-3 rounded-xl border border-stone-200 focus:border-[#3bc0cd] focus:ring-2 focus:ring-[#3bc0cd]/20 font-mono text-sm font-bold tracking-wider text-stone-800 transition-all outline-hidden placeholder:text-stone-400 placeholder:font-normal placeholder:text-xs disabled:opacity-60 bg-stone-50/60"
            />
            <CreditCard className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !inputCardId.trim()}
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
      </div>

      {/* Active NFC Scanning Modal Prompt */}
      {isNfcScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-stone-200">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center relative">
              <Radio className="w-10 h-10 text-emerald-600 animate-ping absolute opacity-30" />
              <Smartphone className="w-10 h-10 text-emerald-700 relative z-10" />
            </div>
            <div>
              <h3 className="font-fredoka text-xl font-bold text-stone-900">
                Ready to Scan Card
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Hold your Social Medium tap card against the top or back of your phone.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-500 font-medium">
              Android Chrome Web NFC Active
            </div>
            <button
              type="button"
              onClick={() => setIsNfcScanning(false)}
              className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel Scan
            </button>
          </div>
        </div>
      )}

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
