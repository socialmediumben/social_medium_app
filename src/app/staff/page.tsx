'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDevMode } from '@/context/DevModeContext';
import {
  Shield,
  BarChart3,
  ClipboardList,
  Home,
} from 'lucide-react';
import Link from 'next/link';
import { StaffDashboardTab } from '@/components/staff/StaffDashboardTab';
import { StaffActivityTab } from '@/components/staff/StaffActivityTab';

function StaffPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isStaffMode, canAccessStaff, setMode } = useDevMode();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'activity'>(() => {
    return tabParam === 'activity' ? 'activity' : 'dashboard';
  });

  useEffect(() => {
    if (tabParam === 'activity' || tabParam === 'dashboard') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab: 'dashboard' | 'activity') => {
    setActiveTab(newTab);
    router.replace(`/staff?tab=${newTab}`, { scroll: false });
  };

  // If user is in "User" mode or not authorized, prompt appropriately
  if (!isStaffMode) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="font-fredoka text-2xl sm:text-3xl font-bold text-stone-900 mb-2">
          Staff Mode Required
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-6 font-roboto max-w-lg mx-auto">
          {canAccessStaff ? (
            <>
              You have authorized staff permissions. Switch to <strong>Staff Mode</strong> to view live event attendance, check-in trends, and the constituent activity ledger.
            </>
          ) : (
            <>
              The <strong>Staff Operations Hub</strong> is reserved for staff members and system administrators. Your account must have staff privileges or developer access.
            </>
          )}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {canAccessStaff && (
            <button
              type="button"
              onClick={() => setMode('staff')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>Enable Staff Mode</span>
            </button>
          )}
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Sub-Module Pill Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-700 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </span>
            <h1 className="font-fredoka text-2xl sm:text-3xl font-bold text-stone-900">
              Staff Operations
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold uppercase tracking-wider">
              Staff Portal
            </span>
          </div>
          <p className="text-stone-600 text-xs sm:text-sm mt-1">
            {activeTab === 'dashboard'
              ? 'View live event attendance, check-in trends, and member activity ledger.'
              : 'Log safety walkthroughs, tool certifications, incident reports, and member notes.'}
          </p>
        </div>

        {/* Sub-Module Switcher (Dashboard vs Log Activity) */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-2xl border border-stone-200 self-start sm:self-auto shrink-0 shadow-xs">
          <button
            type="button"
            onClick={() => handleTabChange('dashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('activity')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'dashboard' ? (
        <StaffDashboardTab />
      ) : (
        <StaffActivityTab />
      )}
    </div>
  );
}

export default function StaffPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-stone-500 font-mono text-sm">Loading Staff Module...</div>}>
      <StaffPageContent />
    </Suspense>
  );
}
