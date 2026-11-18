'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  HandCoins,
  CreditCard,
  HeartHandshake,
  Clock,
  Plus,
  Play,
  Square,
  RotateCcw,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  FileText,
  DollarSign,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Info,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDevMode } from '@/context/DevModeContext';
import {
  GiveGetSummary,
  VolunteerSession,
  getGreetingName,
} from '@/lib/types';
import {
  fetchMemberGiveGetSummary,
  saveBoardVolunteerSession,
  deleteBoardVolunteerSession,
  DEFAULT_GIVE_GET_HOURLY_RATE,
  getGiveGetServiceCategories,
  getDefaultGiveGetServiceCategory,
} from '@/lib/neon';
import { GiveGetServiceCategory } from '@/lib/types';

export function GiveGetModule() {
  const { member, isLoading: authLoading } = useAuth();
  const { isDevMode, isBoardMemberPreviewEnabled, setIsBoardMemberPreviewEnabled } = useDevMode();

  const accountId = member?.accountId || '';
  const isAuthorized = !!(member?.isBoardMember || isBoardMemberPreviewEnabled);

  // Dynamic Service Categories
  const [categories, setCategories] = useState<GiveGetServiceCategory[]>(() => getGiveGetServiceCategories());

  // Give/Get Data State
  const [summary, setSummary] = useState<GiveGetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Log Hours Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sessionHours, setSessionHours] = useState('');
  const [sessionCategory, setSessionCategory] = useState(() => getDefaultGiveGetServiceCategory());
  const [sessionNotes, setSessionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Stopwatch State
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync categories if updated in Developer Mode
  useEffect(() => {
    const handleCategoriesUpdate = () => {
      const updatedCats = getGiveGetServiceCategories();
      setCategories(updatedCats);
      setSessionCategory((prev) => {
        return updatedCats.some((c) => c.label === prev) ? prev : getDefaultGiveGetServiceCategory(updatedCats);
      });
    };
    window.addEventListener('sm_give_get_categories_updated', handleCategoriesUpdate);
    return () => window.removeEventListener('sm_give_get_categories_updated', handleCategoriesUpdate);
  }, []);

  // Load summary
  const loadSummary = async () => {
    if (!accountId) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetchMemberGiveGetSummary(accountId);
      setSummary(res);
    } catch (err) {
      console.warn('Failed to load Give/Get summary:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSummary();
    const handleUpdate = () => loadSummary();
    window.addEventListener('sm_give_get_updated', handleUpdate);
    return () => window.removeEventListener('sm_give_get_updated', handleUpdate);
  }, [accountId]);

  // Stopwatch effect
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  const handleStartTimer = () => setTimerRunning(true);
  const handlePauseTimer = () => setTimerRunning(false);
  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(0);
  };

  const handleFinishTimer = () => {
    setTimerRunning(false);
    const hours = Math.round((timerSeconds / 3600) * 100) / 100;
    setSessionHours(hours > 0 ? String(hours) : '0.25');
    setIsModalOpen(true);
  };

  const formatTimerDisplay = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Submit session
  const handleSubmitSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = parseFloat(sessionHours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      setActionError('Please enter a valid number of hours (greater than 0).');
      return;
    }
    if (!sessionDate) {
      setActionError('Please choose a valid date.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const newSession: VolunteerSession = {
        id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        accountId,
        date: sessionDate,
        hours: Math.round(hoursNum * 100) / 100,
        category: sessionCategory,
        notes: sessionNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      const updated = await saveBoardVolunteerSession(newSession);
      setSummary(updated);

      // Reset form & stopwatch
      setSessionHours('');
      setSessionNotes('');
      setTimerSeconds(0);
      setIsModalOpen(false);

      setActionSuccess(`Logged ${newSession.hours} hrs (${newSession.category}). +$${(newSession.hours * (updated.hourlyRate || DEFAULT_GIVE_GET_HOURLY_RATE)).toFixed(2)} added to Give/Get!`);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to record volunteer hours.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this service session entry?')) return;
    try {
      const updated = await deleteBoardVolunteerSession(accountId, sessionId);
      setSummary(updated);
      setActionSuccess('Service session removed.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError('Failed to delete service session.');
    }
  };

  // Refresh stats
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSummary();
  };

  // Guard: Not logged in
  if (!authLoading && !member) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <HandCoins className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-stone-900 font-fredoka">Board Member Give/Get</h1>
        <p className="text-sm text-stone-600">
          Please tap your member card or sign in to view your Board Member Give/Get tracking.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#344ea2] text-white font-bold text-sm hover:bg-[#2a3f85] transition-colors shadow-sm"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  // Guard: Not a board member and preview is disabled
  if (!authLoading && !isAuthorized) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
          <HandCoins className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-stone-900 font-fredoka">Board Member Access Required</h1>
        <p className="text-sm text-stone-600">
          The Give/Get tracking module is dedicated to active Social Medium Board of Directors members.
        </p>
        <p className="text-xs text-stone-400">
          If you are a board member, please check with an administrator to ensure the <span className="font-semibold text-stone-600">Board Member</span> status is enabled on your member account.
        </p>

        {isDevMode && (
          <div className="pt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Developer Preview Override</span>
            </div>
            <p className="text-[11px] text-amber-800">
              You are in Developer Mode. You can preview the Give/Get portal for testing:
            </p>
            <button
              type="button"
              onClick={() => setIsBoardMemberPreviewEnabled(true)}
              className="w-full py-2 px-3 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors cursor-pointer"
            >
              Enable Board Member Preview
            </button>
          </div>
        )}

        <div className="pt-2">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#344ea2] hover:underline"
          >
            &larr; Back to Member Profile
          </Link>
        </div>
      </div>
    );
  }

  const hardCredit = summary?.hardCredit || 0;
  const softCredit = summary?.softCredit || 0;
  const volunteerHours = summary?.volunteerHours || 0;
  const hourlyRate = summary?.hourlyRate || DEFAULT_GIVE_GET_HOURLY_RATE;
  const volunteerValue = summary?.volunteerValue || (volunteerHours * hourlyRate);
  const totalGiveGet = summary?.totalGiveGet || (hardCredit + softCredit + volunteerValue);
  const sessions = summary?.sessions || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#344ea2] via-[#2a3f85] to-[#1e2e66] text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-bold tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                Board of Directors
              </span>
              {isBoardMemberPreviewEnabled && !member?.isBoardMember && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/30 border border-rose-400/40 text-rose-200 text-[10px] font-bold">
                  Dev Preview Mode
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-fredoka tracking-tight text-white">
              Give / Get Dashboard
            </h1>
            <p className="text-sm text-stone-200 max-w-xl">
              Welcome, <span className="font-bold text-white">{getGreetingName(member)}</span>. Track your cumulative contributions across direct donations, influenced soft credits, and self-reported service hours.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="py-2.5 px-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer backdrop-blur-xs disabled:opacity-50"
              title="Refresh Member Stats"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync CRM'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="py-2.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-900 font-extrabold text-xs transition-transform hover:scale-102 flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Log Hours</span>
            </button>
          </div>
        </div>

        {/* Subtle Decorative Backdrop Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 2. Total Give/Get Grand Contribution Hero Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-stone-400">Total Contribution Metric</span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black text-stone-900 font-fredoka tracking-tight">
                ${totalGiveGet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> All-Time Combined
              </span>
            </div>
          </div>
          <div className="text-xs text-stone-500 sm:text-right">
            <span>Volunteer Hourly Credit Rate:</span>
            <span className="ml-1 font-bold text-stone-800">${hourlyRate.toFixed(2)}/hour</span>
          </div>
        </div>

        {/* Dynamic Formula Breakdown Bar */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">Contribution Composition</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-700 block">1. Hard Credit (Direct)</span>
                <span className="text-lg font-black text-blue-950 font-fredoka">
                  ${hardCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <CreditCard className="w-6 h-6 text-blue-500/60" />
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-purple-700 block">2. Soft Credit (Influenced)</span>
                <span className="text-lg font-black text-purple-950 font-fredoka">
                  ${softCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <HeartHandshake className="w-6 h-6 text-purple-500/60" />
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-800 block">3. Volunteer Time ({volunteerHours.toFixed(1)} hrs @ ${hourlyRate}/hr)</span>
                <span className="text-lg font-black text-amber-950 font-fredoka">
                  ${volunteerValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <Clock className="w-6 h-6 text-amber-500/60" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. The 3 Detailed Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Hard Credit */}
        <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Hard Credit Giving</h2>
              <p className="text-xs text-stone-500 leading-relaxed mt-0.5">
                Direct personal monetary contributions paid by you toward Social Medium campaigns and funds.
              </p>
            </div>
            <div className="pt-2 border-t border-stone-100 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">All-Time Hard Credit:</span>
                <span className="font-black text-stone-900">${hardCredit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Current Year ({new Date().getFullYear()}):</span>
                <span className="font-bold text-stone-700">${(summary?.currentYearHardCredit || 0).toFixed(2)}</span>
              </div>
              {(summary?.excludedStoreDonationsTotal ?? 0) > 0 && (
                <div className="text-[10px] text-stone-400 italic pt-0.5">
                  (Excludes ${(summary?.excludedStoreDonationsTotal || 0).toFixed(2)} in Store / tab purchases)
                </div>
              )}
            </div>
          </div>
          <Link
            href="/impact"
            className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>View Donation Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Pillar 2: Soft Credit */}
        <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Soft Credit Giving</h2>
              <p className="text-xs text-stone-500 leading-relaxed mt-0.5">
                Outside gifts, corporate matches, donor-advised funds (DAFs), and solicited sponsorships credited to you.
              </p>
            </div>
            <div className="pt-2 border-t border-stone-100 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">All-Time Soft Credit:</span>
                <span className="font-black text-stone-900">${softCredit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Current Year ({new Date().getFullYear()}):</span>
                <span className="font-bold text-stone-700">${(summary?.currentYearSoftCredit || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50/50 text-[11px] text-purple-800 border border-purple-100 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span>Soft credits are recorded by space staff in the member database.</span>
          </div>
        </div>

        {/* Pillar 3: Volunteer Service */}
        <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Volunteer & Board Time</h2>
              <p className="text-xs text-stone-500 leading-relaxed mt-0.5">
                Board meetings, strategic governance, equipment maintenance, and space volunteer service.
              </p>
            </div>
            <div className="pt-2 border-t border-stone-100 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Total Hours Logged:</span>
                <span className="font-black text-stone-900">{volunteerHours.toFixed(1)} hrs</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Give/Get Value (@ ${hourlyRate}/hr):</span>
                <span className="font-bold text-amber-600">${volunteerValue.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Live Synced to Member Portal</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Service Session</span>
          </button>
        </div>
      </div>

      {/* 4. Live Shift Stopwatch & Quick Logger */}
      <div className="p-5 sm:p-6 rounded-3xl bg-stone-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Live Meeting / Service Stopwatch</span>
          </div>
          <p className="text-sm text-stone-300">
            Attending a board meeting, committee call, or volunteer shift? Start the timer to track your time in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 font-mono text-2xl font-black text-amber-400 tracking-wider">
            {formatTimerDisplay(timerSeconds)}
          </div>

          {!timerRunning ? (
            <button
              type="button"
              onClick={handleStartTimer}
              className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{timerSeconds > 0 ? 'Resume' : 'Start Timer'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePauseTimer}
              className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <span>Pause</span>
            </button>
          )}

          {timerSeconds > 0 && (
            <>
              <button
                type="button"
                onClick={handleFinishTimer}
                className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Finish & Log</span>
              </button>
              <button
                type="button"
                onClick={handleResetTimer}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 transition-colors cursor-pointer"
                title="Reset stopwatch"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 5. Volunteer Service Timesheet History */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-lg font-black text-stone-900 font-fredoka tracking-tight">
              Service Hours Timesheet
            </h2>
            <p className="text-xs text-stone-500">
              Showing {sessions.length} logged service sessions ({volunteerHours.toFixed(1)} total hours).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="py-2 px-3.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs transition-colors flex items-center gap-1.5 self-start cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-500" />
            <span>Add Session</span>
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <Clock className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-xs font-semibold text-stone-600">No service sessions recorded yet</p>
            <p className="text-[11px] text-stone-400">
              Click &quot;Log Hours&quot; above to log your board service time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 font-black uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Give/Get Value</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                {sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-stone-900">
                      {sess.date}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="px-2 py-0.5 rounded-lg bg-stone-100 border border-stone-200 text-stone-800 font-semibold text-[11px]">
                          {sess.category}
                        </span>
                        {sess.activityId && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold"
                            title={`Recorded Activity #${sess.activityId}`}
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            Activity #{sess.activityId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-stone-900">
                      {sess.hours.toFixed(1)} hrs
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-black text-amber-600">
                      +${(sess.hours * hourlyRate).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate text-stone-500">
                      {sess.notes || '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteSession(sess.id)}
                        className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. LOG HOURS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 font-fredoka">Log Service Hours</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200 transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSession} className="space-y-4">
              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">Date of Service</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#344ea2]"
                />
              </div>

              {/* Hours */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">Hours Spent</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="24"
                    placeholder="e.g. 2.5"
                    value={sessionHours}
                    onChange={(e) => setSessionHours(e.target.value)}
                    required
                    className="w-full pl-3 pr-12 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#344ea2]"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-stone-400 pointer-events-none">
                    hours
                  </span>
                </div>
                {sessionHours && parseFloat(sessionHours) > 0 && (
                  <p className="text-[11px] font-bold text-amber-600">
                    Give/Get Credit: +${(parseFloat(sessionHours) * hourlyRate).toFixed(2)} (${hourlyRate}/hr)
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">Service Category</label>
                <select
                  value={sessionCategory}
                  onChange={(e) => setSessionCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#344ea2]"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.label}>
                      {cat.icon || '📋'} {cat.label} {cat.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">Notes & Details (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="What did you work on? (e.g. Laser cutter exhaust repair, Q4 budget planning call)"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#344ea2] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-5 rounded-xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Save Service Hours'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
