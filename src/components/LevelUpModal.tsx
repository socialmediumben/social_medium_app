'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Star, Sparkles, X, Gift, ArrowRight } from 'lucide-react';
import { XpAwardEventDetail } from '@/lib/types';

export default function LevelUpModal() {
  const [levelUpData, setLevelUpData] = useState<XpAwardEventDetail | null>(null);
  const [xpToast, setXpToast] = useState<{ activity: string; xp: number; id: number } | null>(null);

  useEffect(() => {
    const handleXpEvent = (e: Event) => {
      const customEvent = e as CustomEvent<XpAwardEventDetail>;
      const detail = customEvent.detail;
      if (!detail) return;

      if (detail.leveledUp) {
        setLevelUpData(detail);
      } else if (detail.xpEarned > 0) {
        // Show lightweight toast for points gained
        setXpToast({
          activity: detail.activityName || 'Activity Completed',
          xp: detail.xpEarned,
          id: Date.now(),
        });
      }
    };

    window.addEventListener('sm_xp_awarded', handleXpEvent);
    return () => {
      window.removeEventListener('sm_xp_awarded', handleXpEvent);
    };
  }, []);

  // Auto-dismiss XP toast after 4 seconds
  useEffect(() => {
    if (!xpToast) return;
    const timer = setTimeout(() => {
      setXpToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [xpToast]);

  return (
    <>
      {/* Lightweight XP Earned Floating Toast */}
      {xpToast && !levelUpData && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-300">
          <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500/95 to-yellow-600/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-xl shadow-amber-500/25 border border-amber-300/40">
            <div className="p-1.5 bg-black/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-yellow-200" />
            </div>
            <div>
              <div className="text-xs font-semibold text-yellow-100 uppercase tracking-wider">
                XP Earned
              </div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                <span className="text-amber-200">+{xpToast.xp} XP</span>
                <span className="text-white/80 font-normal text-xs">• {xpToast.activity}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Celebration Level-Up Modal */}
      {levelUpData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-amber-500/30 overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setLevelUpData(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800/80 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Badge Icon & Level Ring */}
            <div className="relative mx-auto w-24 h-24 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 animate-pulse opacity-75 blur-md" />
              <div className="relative w-20 h-20 rounded-full bg-zinc-950 border-2 border-yellow-400 flex items-center justify-center text-4xl shadow-inner">
                {levelUpData.levelBadge || '⭐'}
              </div>
              <div className="absolute -bottom-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 text-xs font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider shadow">
                LVL {levelUpData.newLevel}
              </div>
            </div>

            {/* Title & Announcement */}
            <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Level Up Milestone!</span>
              <Sparkles className="w-4 h-4" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              {levelUpData.levelTitle}
            </h2>

            <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
              Congratulations! Your active participation has elevated you to{' '}
              <strong className="text-amber-300">Level {levelUpData.newLevel}</strong> with{' '}
              <span className="text-white font-semibold">{levelUpData.newTotalXp} Total XP</span>.
            </p>

            {/* Unlocked Reward Box */}
            {levelUpData.rewardUnlocked && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-500/15 to-transparent border border-amber-500/40 text-left">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                  <Gift className="w-4 h-4" />
                  <span>Reward Unlocked</span>
                </div>
                <div className="text-base font-bold text-white mb-1">
                  {levelUpData.rewardUnlocked}
                </div>
                <p className="text-xs text-zinc-400">
                  Claim your reward perk with makerspace staff at the front desk or snack shack!
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setLevelUpData(null)}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-bold text-base shadow-lg shadow-amber-500/25 transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Awesome! Claim Perk</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
