'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, LogOut, ArrowRightLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDevMode } from '@/context/DevModeContext';
import { getGreetingName } from '@/lib/types';

export function ImpersonationBanner() {
  const { isImpersonating, member, activeCardId, stopImpersonating, originalDeveloperUser } = useAuth();
  const { mode } = useDevMode();

  if (!isImpersonating) return null;

  const displayName = getGreetingName(member);
  const origName = getGreetingName(originalDeveloperUser);

  return (
    <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-amber-950 text-white px-3 py-2 text-xs border-b border-amber-500/30 shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left Side: Notice & Persona Info */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 font-bold uppercase tracking-wider text-[10px] animate-pulse">
            <Eye className="w-3.5 h-3.5" />
            Impersonating
          </span>
          <span className="font-medium text-stone-200">
            Viewing as <strong className="text-white font-bold">{displayName}</strong>
            {activeCardId && (
              <span className="ml-1.5 font-mono text-[11px] bg-black/30 px-1.5 py-0.5 rounded text-amber-300">
                Card: {activeCardId}
              </span>
            )}
          </span>
          <span className="hidden sm:inline-block text-stone-400 text-[11px]">
            (Perspective: <span className="text-amber-200 capitalize font-semibold">{mode} mode</span>)
          </span>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            href="/developer"
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            title="Choose another user or manage developer features"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden xs:inline">Switch Persona</span>
          </Link>
          <button
            type="button"
            onClick={stopImpersonating}
            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
            title={`Exit impersonation and return to ${origName || 'Developer'}`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Impersonation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
