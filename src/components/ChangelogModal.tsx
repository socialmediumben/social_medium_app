'use client';

import React, { useEffect } from 'react';
import { X, GitCommit, Sparkles, Calendar, Tag } from 'lucide-react';
import { useDevMode } from '@/context/DevModeContext';
import { APP_VERSION, CHANGELOG } from '@/lib/version';

export function ChangelogModal() {
  const { isChangelogOpen, closeChangelog, isDevMode } = useDevMode();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isChangelogOpen) {
        closeChangelog();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChangelogOpen, closeChangelog]);

  if (!isChangelogOpen || !isDevMode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#344ea2]/10 text-[#344ea2] flex items-center justify-center">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-fredoka text-xl font-bold text-stone-900">
                  Release Changelog
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#3bc0cd]/20 text-[#344ea2] font-mono font-bold text-xs border border-[#3bc0cd]/30">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-roboto">
                Developer Mode Version & Deployment History
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeChangelog}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-6 divide-y divide-stone-100 font-roboto">
          {CHANGELOG.map((rel, idx) => (
            <div key={rel.version} className={idx > 0 ? 'pt-6' : ''}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 font-mono font-bold text-sm text-[#f16622] bg-[#f16622]/10 px-2.5 py-0.5 rounded-lg border border-[#f16622]/20">
                    <Tag className="w-3.5 h-3.5" />
                    v{rel.version}
                  </span>
                  {idx === 0 && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Current
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{rel.date}</span>
                </div>
              </div>

              <h3 className="font-fredoka text-base font-semibold text-stone-800 mb-2">
                {rel.title}
              </h3>

              <ul className="space-y-1.5 text-xs text-stone-600">
                {rel.changes.map((change, cIdx) => (
                  <li key={cIdx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3bc0cd] mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span>Social Medium Companion • Developer Mode</span>
          <button
            type="button"
            onClick={closeChangelog}
            className="px-4 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
