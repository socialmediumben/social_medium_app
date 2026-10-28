'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDevMode } from '@/context/DevModeContext';
import {
  Shield,
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Home,
  BarChart3,
} from 'lucide-react';

export default function NeonDashboardPage() {
  const { setMode, isStaffMode, canAccessStaff } = useDevMode();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

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
              The <strong>Neon CRM Activities Dashboard</strong> is reserved for staff members and system administrators. Your account must be an active Neon One System User or have the <strong>App Developer</strong> role checked in Neon One.
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
    <div className={`space-y-3 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#070b14] p-0' : ''}`}>
      {/* Top Controls Toolbar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-stone-900 text-white shadow-md border border-stone-800 ${isFullscreen ? 'rounded-none border-x-0 border-t-0' : ''}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-fredoka font-bold text-sm tracking-tight text-white">
                Neon Dashboard
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                Staff Module
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh iframe button */}
          <button
            type="button"
            onClick={() => setIframeKey((k) => k + 1)}
            title="Reload Dashboard"
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Standalone link */}
          <a
            href="/neon-dashboard-app/index.html"
            target="_blank"
            rel="noreferrer"
            title="Open in Standalone Tab"
            className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors text-xs flex items-center gap-1 font-medium"
          >
            <span className="hidden sm:inline">Standalone</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer text-xs flex items-center gap-1 font-medium"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </button>

          {isFullscreen && (
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Embedded Neon CRM Activities Dashboard Iframe */}
      <div className="rounded-2xl overflow-hidden border border-stone-800 bg-[#070b14] shadow-xl">
        <iframe
          key={iframeKey}
          src="/neon-dashboard-app/index.html"
          className="w-full border-0 block"
          style={{
            height: isFullscreen ? 'calc(100vh - 48px)' : 'calc(100vh - 130px)',
            minHeight: '800px',
          }}
          title="Neon CRM Activities Dashboard"
          allow="clipboard-read; clipboard-write; fullscreen"
        />
      </div>
    </div>
  );
}
