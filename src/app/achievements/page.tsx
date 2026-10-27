'use client';

import { useState } from 'react';
import { Award, Sparkles, ShieldCheck, Layers, DoorOpen, Cpu, Gamepad2, Wrench, HeartHandshake, CheckCircle2, Lock } from 'lucide-react';
import { DEFAULT_ACHIEVEMENTS } from '@/lib/member-data';
import { Achievement } from '@/lib/types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  ShieldCheck,
  Layers,
  DoorOpen,
  Cpu,
  Gamepad2,
  Wrench,
  HeartHandshake
};

const CATEGORIES = ['All', 'Skill', 'Safety', 'Community', 'Milestone'] as const;

export default function AchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const achievements = DEFAULT_ACHIEVEMENTS;

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const progressPct = Math.round((unlockedCount / achievements.length) * 100);

  const filteredAchievements = selectedCategory === 'All'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#8a9280] uppercase tracking-wider mb-1">
          <Award className="w-4 h-4 text-[#8a9280]" />
          <span>Gamification & Milestones</span>
        </div>
        <h1 className="font-fredoka text-2xl sm:text-3xl font-bold text-stone-900">
          Makerspace Achievements
        </h1>
        <p className="text-stone-600 text-sm">
          Earn badges by attending workshops, mastering equipment, and participating in the Social Medium community. Synced with Neon One.
        </p>
      </div>

      {/* Progress Banner */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-md w-full">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-stone-700">Badge Completion Progress</span>
            <span className="text-[#344ea2] font-mono">{unlockedCount} of {achievements.length} Unlocked ({progressPct}%)</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-3 rounded-full bg-stone-100 overflow-hidden border border-stone-200">
            <div
              className="h-full bg-gradient-to-r from-[#3bc0cd] to-[#f16622] rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center px-4 py-2 rounded-xl bg-stone-50 border border-stone-200">
            <div className="font-fredoka text-xl font-bold text-[#344ea2]">{unlockedCount}</div>
            <div className="text-[10px] text-stone-500 font-semibold uppercase">Unlocked</div>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-stone-50 border border-stone-200">
            <div className="font-fredoka text-xl font-bold text-stone-400">{achievements.length - unlockedCount}</div>
            <div className="text-[10px] text-stone-500 font-semibold uppercase">Remaining</div>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#3bc0cd] text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:border-[#3bc0cd]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredAchievements.map((badge) => {
          const Icon = ICON_MAP[badge.icon] || Award;

          return (
            <div
              key={badge.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between text-left ${
                badge.unlocked
                  ? 'bg-white border-stone-200 shadow-xs hover:border-[#3bc0cd]'
                  : 'bg-stone-50/70 border-stone-200/80 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      badge.unlocked
                        ? 'bg-[#3bc0cd]/15 text-[#344ea2]'
                        : 'bg-stone-200 text-stone-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      badge.unlocked
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {badge.unlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </div>

                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  {badge.category}
                </div>
                <h3 className="font-fredoka text-base font-bold text-stone-900 mb-1">
                  {badge.title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                {badge.unlocked ? (
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Unlocked: {badge.dateUnlocked}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-stone-400">
                    <Lock className="w-3.5 h-3.5" /> In progress
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
