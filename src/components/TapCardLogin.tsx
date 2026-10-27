'use client';

import { useState } from 'react';
import { CreditCard, Sparkles, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function TapCardLogin() {
  const [inputCardId, setInputCardId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loginError } = useAuth();

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
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#3bc0cd] to-[#344ea2] flex items-center justify-center text-white text-2xl font-bold shadow-md">
        SM
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f16622]/10 text-[#f16622] text-xs font-semibold uppercase tracking-wider mb-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Live Neon One Access</span>
      </div>

      <h1 className="font-fredoka text-2xl sm:text-3xl font-bold text-stone-900 mb-2">
        Tap Card Login
      </h1>
      <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-6 font-roboto">
        Scan your physical NFC card on a reader, or enter your <strong>Tap Card</strong> to query Neon One directly.
      </p>

      {loginError && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold mb-0.5">Neon One Query:</strong>
            <span>{loginError}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            required
            autoFocus
            disabled={isSubmitting}
            value={inputCardId}
            onChange={(e) => setInputCardId(e.target.value)}
            placeholder="Scan NFC or enter Tap Card..."
            className="w-full text-center px-4 py-3.5 rounded-2xl border-2 border-stone-200 focus:border-[#3bc0cd] focus:ring-4 focus:ring-[#3bc0cd]/20 font-mono text-lg font-bold tracking-wider text-stone-800 transition-all outline-hidden placeholder:text-stone-400 placeholder:font-normal placeholder:text-sm disabled:opacity-60"
          />
          <CreditCard className="w-5 h-5 text-stone-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 rounded-2xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer group disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Querying Neon One...</span>
            </>
          ) : (
            <>
              <span>Connect to Account</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
