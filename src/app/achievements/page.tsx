'use client';

import { useState } from 'react';
import { Award, Sparkles, CheckCircle2, Lock, PlusCircle, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TapCardLogin } from '@/components/TapCardLogin';

export default function AchievementsPage() {
  const { activeCardId, member, isLoading } = useAuth();

  if (isLoading) {
    return <div className="py-20 text-center text-stone-500 font-mono text-sm">Loading...</div>;
  }

  if (!activeCardId || !member) {
    return <TapCardLogin />;
  }

  const achievements = member.achievements || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#8a9280] uppercase tracking-wider mb-1">
          <Award className="w-4 h-4 text-[#8a9280]" />
          <span>Gamification & Milestones</span>
        </div>
        <h1 className="font-fredoka text-2xl sm:text-3xl font-bold text-stone-900">
          Member Achievements
        </h1>
        <p className="text-stone-600 text-sm">
          Achievements and milestone badges earned on Tap Card <strong>{activeCardId}</strong>.
        </p>
      </div>

      {/* Actual Achievements List */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-fredoka text-lg font-bold text-stone-900">
              Unlocked Badges
            </h2>
            <p className="text-stone-500 text-xs">
              Badges synchronized from your Neon One account.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
            {achievements.length} Badges
          </span>
        </div>

        {achievements.length === 0 ? (
          <div className="p-8 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-center space-y-3">
            <Award className="w-10 h-10 text-stone-400 mx-auto" />
            <h3 className="font-semibold text-stone-800 text-sm">
              No Achievements Recorded Yet for Card {activeCardId}
            </h3>
            <p className="text-stone-500 text-xs max-w-md mx-auto leading-relaxed">
              Achievements and badges are awarded for attending workshops, passing tool certifications, and participating in makerspace community events.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((badge) => (
              <div
                key={badge.id}
                className="p-4 rounded-xl border border-stone-200 bg-white flex items-start gap-3"
              >
                <div className="p-2.5 rounded-xl bg-[#8a9280]/15 text-[#4a5142]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-stone-900">{badge.title}</div>
                  {badge.description && (
                    <div className="text-xs text-stone-500 mt-0.5">{badge.description}</div>
                  )}
                  {badge.dateUnlocked && (
                    <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{badge.dateUnlocked}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Neon One Field Guide for Admin / Staff */}
      <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-stone-800 text-xs space-y-3">
        <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
          <Info className="w-4 h-4 text-amber-700" />
          <span>Setting Up Achievements in Neon One:</span>
        </div>
        <p className="leading-relaxed text-stone-700">
          To track achievements for members in Neon One, create a custom account field in your Neon One admin dashboard:
        </p>
        <div className="bg-white p-3.5 rounded-xl border border-amber-200/60 font-mono text-[11px] space-y-1.5 text-stone-800">
          <div>• <strong>Field Name:</strong> <code>Achievements</code></div>
          <div>• <strong>Field Type:</strong> Multi-Select or Checkbox List</div>
          <div>• <strong>Options / Values:</strong> <code>Founding Maker</code>, <code>Laser Certified</code>, <code>3D Print Master</code>, <code>Electronics Lab</code>, <code>Workshop Hero</code>, <code>Game Room DM</code></div>
          <div>• <strong>Component Link:</strong> Tied to the member account having the matching <strong>Tap Card ID</strong>.</div>
        </div>
      </div>
    </div>
  );
}
