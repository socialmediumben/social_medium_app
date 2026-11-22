'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDevMode } from '@/context/DevModeContext';
import { useAuth } from '@/context/AuthContext';
import {
  Shield,
  BarChart3,
  ClipboardList,
  Home,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import { StaffDashboardTab } from '@/components/staff/StaffDashboardTab';
import { StaffActivityTab } from '@/components/staff/StaffActivityTab';
import { StaffCertificationRequestsTab } from '@/components/staff/StaffCertificationRequestsTab';
import { getPendingCertificationRequestsCount } from '@/lib/certifications';

function StaffPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isStaffMode, canAccessStaff, setMode } = useDevMode();
  const { member } = useAuth();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'activity' | 'cert-requests'>(() => {
    return tabParam === 'activity'
      ? 'activity'
      : tabParam === 'cert-requests'
      ? 'cert-requests'
      : 'dashboard';
  });

  const [pendingCertCount, setPendingCertCount] = useState<number>(0);

  useEffect(() => {
    if (tabParam === 'activity' || tabParam === 'dashboard' || tabParam === 'cert-requests') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    setPendingCertCount(getPendingCertificationRequestsCount());
    const handleUpdate = () => {
      setPendingCertCount(getPendingCertificationRequestsCount());
    };
    window.addEventListener('sm_cert_requests_updated', handleUpdate);
    return () => {
      window.removeEventListener('sm_cert_requests_updated', handleUpdate);
    };
  }, []);

  const handleTabChange = (newTab: 'dashboard' | 'activity' | 'cert-requests') => {
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
              : activeTab === 'activity'
              ? 'Log safety walkthroughs, tool certifications, incident reports, and member notes.'
              : 'Review, accept, or decline makerspace tool and machine certification requests.'}
          </p>
        </div>

        {/* Sub-Module Switcher (Dashboard vs Log Activity vs Cert Requests) */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-2xl border border-stone-200 self-start sm:self-auto shrink-0 shadow-xs flex-wrap">
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

          <button
            type="button"
            onClick={() => handleTabChange('cert-requests')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'cert-requests'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Award className="w-4 h-4 text-amber-800" />
            <span>Cert Requests</span>
            {pendingCertCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black border border-amber-300 shadow-2xs">
                {pendingCertCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'dashboard' ? (
        <StaffDashboardTab />
      ) : activeTab === 'activity' ? (
        <StaffActivityTab />
      ) : (
        <StaffCertificationRequestsTab staffMember={member} />
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
