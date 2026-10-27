'use client';

import { useState } from 'react';
import { CreditCard, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function TapCardLogin() {
  const [inputCardId, setInputCardId] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCardId.trim()) {
      login(inputCardId.trim());
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
        <span>Member Access</span>
      </div>

      <h1 className="font-fredoka text-2xl sm:text-3xl font-bold text-stone-900 mb-2">
        Tap Card Login
      </h1>
      <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-6 font-roboto">
        Scan your physical NFC card on a reader, or enter your 10-digit <strong>Tap Card</strong> from Neon One.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            required
            autoFocus
            value={inputCardId}
            onChange={(e) => setInputCardId(e.target.value)}
            placeholder="Scan NFC or enter Tap Card..."
            className="w-full text-center px-4 py-3.5 rounded-2xl border-2 border-stone-200 focus:border-[#3bc0cd] focus:ring-4 focus:ring-[#3bc0cd]/20 font-mono text-lg font-bold tracking-wider text-stone-800 transition-all outline-hidden placeholder:text-stone-400 placeholder:font-normal placeholder:text-sm"
          />
          <CreditCard className="w-5 h-5 text-stone-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 px-6 rounded-2xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer group"
        >
          <span>Connect to Account</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>
    </div>
  );
}
