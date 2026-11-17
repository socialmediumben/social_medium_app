'use client';

import React, { useMemo } from 'react';
import { Sparkles, Trophy, Target, TrendingUp, Users } from 'lucide-react';

interface DigitalThermometerProps {
  goal: number;
  raised: number;
  donorCount?: number;
  primaryColor?: string;
  currencySymbol?: string;
  className?: string;
  showBulb?: boolean;
}

export const DigitalThermometer: React.FC<DigitalThermometerProps> = ({
  goal,
  raised,
  donorCount = 0,
  primaryColor = '#f16622',
  currencySymbol = '$',
  className = '',
  showBulb = true,
}) => {
  const safeGoal = Math.max(1, goal || 1);
  const safeRaised = Math.max(0, raised || 0);
  const rawPercent = (safeRaised / safeGoal) * 100;
  const percent = Math.min(Math.round(rawPercent), 100);
  const isGoalReached = safeRaised >= safeGoal;

  const milestones = useMemo(() => [
    { pct: 25, label: `${currencySymbol}${Math.round(safeGoal * 0.25).toLocaleString()}` },
    { pct: 50, label: `${currencySymbol}${Math.round(safeGoal * 0.5).toLocaleString()}` },
    { pct: 75, label: `${currencySymbol}${Math.round(safeGoal * 0.75).toLocaleString()}` },
    { pct: 100, label: `${currencySymbol}${safeGoal.toLocaleString()}` },
  ], [safeGoal, currencySymbol]);

  return (
    <div className={`flex flex-col md:flex-row items-center justify-center gap-8 p-6 sm:p-8 bg-gradient-to-b from-stone-50/80 to-white rounded-3xl border border-stone-200 shadow-sm ${className}`}>
      {/* 1. THERMOMETER TUBE & BULB (VERTICAL DISPLAY) */}
      <div className="relative flex flex-col items-center select-none py-2">
        {/* Goal Milestone Crown Tag */}
        <div className="mb-3 px-3 py-1 rounded-full bg-orange-100 border border-orange-300 text-orange-800 text-xs font-black tracking-wider flex items-center gap-1.5 shadow-2xs">
          {isGoalReached ? <Trophy className="w-3.5 h-3.5 text-amber-600 animate-bounce" /> : <Target className="w-3.5 h-3.5 text-orange-600" />}
          <span>GOAL: {currencySymbol}{safeGoal.toLocaleString()}</span>
        </div>

        <div className="relative flex items-end justify-center">
          {/* Milestone markers on left */}
          <div className="absolute right-full mr-3.5 h-[280px] flex flex-col justify-between items-end text-[11px] font-bold text-stone-600 py-1">
            {milestones.slice().reverse().map((m) => (
              <div key={m.pct} className="flex items-center gap-1.5">
                <span className="tabular-nums">{m.label}</span>
                <span className="w-2.5 h-[2px] bg-stone-300 rounded-full" />
              </div>
            ))}
          </div>

          {/* Outer Glass Tube */}
          <div className="relative w-12 h-[280px] bg-stone-100 rounded-t-full border-4 border-stone-300/80 shadow-inner overflow-hidden flex flex-col justify-end p-1">
            {/* Glass Glare Highlights */}
            <div className="absolute inset-y-0 left-1 w-2 bg-gradient-to-r from-white/70 to-transparent pointer-events-none rounded-t-full z-10" />
            <div className="absolute inset-y-0 right-1 w-1 bg-white/40 pointer-events-none rounded-t-full z-10" />

            {/* Rising Mercury Column */}
            <div
              className="w-full rounded-t-full transition-all duration-1000 ease-out relative overflow-hidden shadow-xs"
              style={{
                height: `${Math.max(4, percent)}%`,
                backgroundColor: primaryColor,
              }}
            >
              {/* Internal Fluid Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-white/20 to-white/30" />
              <div className="absolute top-0 inset-x-0 h-2 bg-white/50 rounded-t-full" />
            </div>
          </div>

          {/* Percentage Indicator Floating Badge */}
          <div
            className="absolute left-full ml-3.5 px-2.5 py-1 rounded-xl bg-stone-900 text-white text-xs font-black shadow-md tabular-nums transition-all duration-1000 flex items-center gap-1"
            style={{
              bottom: `calc(${Math.min(92, Math.max(8, percent))}% - 14px)`,
            }}
          >
            <TrendingUp className="w-3 h-3 text-orange-400" />
            <span>{rawPercent > 0 && rawPercent < 1 ? '<1%' : `${Math.round(rawPercent)}%`}</span>
          </div>
        </div>

        {/* Thermometer Reservoir Bulb */}
        {showBulb && (
          <div className="relative -mt-3 z-20 flex items-center justify-center">
            <div
              className="w-20 h-20 rounded-full border-4 border-stone-300/80 shadow-md flex items-center justify-center relative overflow-hidden"
              style={{ backgroundColor: primaryColor }}
            >
              {/* Bulb Glass Highlight */}
              <div className="absolute top-2 left-3 w-5 h-5 rounded-full bg-white/40 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/30 pointer-events-none" />
              <span className="text-white font-black text-sm drop-shadow-xs">
                {rawPercent > 0 && rawPercent < 1 ? '<1%' : `${percent}%`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. STATS & PROGRESS BREAKDOWN */}
      <div className="flex-1 max-w-md w-full space-y-5">
        <div className="space-y-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fundraising Thermometer</span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-4xl sm:text-5xl font-black text-stone-900 font-fredoka tracking-tight">
              {currencySymbol}{safeRaised % 1 !== 0 ? safeRaised.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : safeRaised.toLocaleString()}
            </span>
            <span className="text-lg font-bold text-stone-600">
              raised of {currencySymbol}{safeGoal.toLocaleString()} goal
            </span>
          </div>
        </div>

        {/* Horizontal Progress Bar for Mobile & Compact Glance */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-stone-600">
            <span>Progress towards goal</span>
            <span className="text-stone-900 font-black">{rawPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full h-3.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200 relative p-0.5">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out relative"
              style={{
                width: `${Math.min(100, Math.max(2, rawPercent))}%`,
                backgroundColor: primaryColor,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-white/40" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/70">
            <div className="text-[11px] font-semibold text-stone-600 flex items-center gap-1">
              <Users className="w-3 h-3 text-stone-600" />
              <span>Community Donors</span>
            </div>
            <div className="text-xl font-black text-stone-900 mt-0.5">
              {donorCount > 0 ? donorCount.toLocaleString() : 'Supporters'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/70">
            <div className="text-[11px] font-semibold text-stone-600 flex items-center gap-1">
              <Target className="w-3 h-3 text-stone-600" />
              <span>Remaining to Goal</span>
            </div>
            <div className="text-xl font-black text-stone-900 mt-0.5">
              {isGoalReached ? '🎉 Goal Met!' : `${currencySymbol}${Math.max(0, safeGoal - safeRaised).toLocaleString()}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
