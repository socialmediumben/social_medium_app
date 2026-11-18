'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import {
  User,
  DoorOpen,
  Gamepad2,
  Home,
  CreditCard,
  LogOut,
  Code2,
  BookOpen,
  Calendar,
  Shield,
  ChevronDown,
  Check,
  Lock,
  Trophy,
  ShoppingBag,
  HeartHandshake,
  MoreHorizontal,
  X,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDevMode, AppMode } from '@/context/DevModeContext';
import { APP_VERSION } from '@/lib/version';
import LevelUpModal from '@/components/LevelUpModal';
import { awardMemberXp } from '@/lib/gamification';
import { syncRecentNeonActivitiesForXp } from '@/lib/neon';

const BASE_NAV_ITEMS = [
  { href: '/profile', label: 'Profile', icon: User, description: 'Member info & certifications' },
  { href: '/impact', label: 'Impact', icon: HeartHandshake, description: 'Fundraising progress & space impact' },
  { href: '/store', label: 'Store', icon: ShoppingBag, description: 'Snack Shack, Supplies & Tab' },
  { href: '/events', label: 'Events', icon: Calendar, description: 'Upcoming events & RSVP' },
  { href: '/costume-contest', label: 'Costume Contest', icon: Trophy, description: 'Halloween photos & live voting' },
  { href: '/portal-media', label: 'Portal Door', icon: DoorOpen, description: 'Personal tap card media' },
  { href: '/game-room', label: 'Game Room', icon: Gamepad2, description: 'Room remote & presets' },
];

export function Navbar() {
  const pathname = usePathname();
  const { activeCardId, logout, member, isSandboxMode, resetSandbox } = useAuth();
  const {
    mode,
    setMode,
    isDevMode,
    isStaffMode,
    canAccessStaff,
    canAccessDev,
    openChangelog,
    isContestVisible,
    isImpactVisible,
    brandLogo,
  } = useDevMode();
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);

  // Automated gamification evaluation for active member (first login, daily streak, recent check-ins)
  useEffect(() => {
    if (!member?.accountId) return;
    const accountId = member.accountId;

    awardMemberXp({
      accountId,
      ruleId: 'first_app_login',
      note: 'First-time setup and login to Companion App',
    }).then(() => {
      awardMemberXp({
        accountId,
        ruleId: 'daily_app_login',
        note: 'Daily app sign-in reward',
      });
    });

    const timer = setTimeout(() => {
      syncRecentNeonActivitiesForXp(accountId);
    }, 2500);

    return () => clearTimeout(timer);
  }, [member?.accountId]);

  const baseItems = useMemo(() => {
    return BASE_NAV_ITEMS.filter((item) => {
      if (item.href === '/costume-contest') return isContestVisible;
      if (item.href === '/impact') return isImpactVisible;
      return true;
    });
  }, [isContestVisible, isImpactVisible]);

  const navItems = [
    ...baseItems,
    ...(isStaffMode
      ? [
          {
            href: '/staff',
            label: 'Staff',
            icon: Shield,
            description: 'Staff Operations & Intelligence',
          },
        ]
      : []),
    ...(isDevMode
      ? [
          {
            href: '/developer',
            label: 'Developer',
            icon: Code2,
            description: 'Developer Command Center & Tools',
          },
        ]
      : []),
  ];

  const handleSelectMode = (newMode: AppMode) => {
    setMode(newMode);
    setIsModeDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Sandbox Demo Mode Top Announcement Bar */}
      {isSandboxMode && (
        <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-indigo-900 text-white text-xs px-4 py-2 border-b border-indigo-700/50 shadow-inner flex flex-wrap items-center justify-between gap-2 z-50">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 text-[10px] font-bold uppercase tracking-wider">
              🧪 Sandbox Demo
            </span>
            <span className="font-medium text-stone-200 text-xs">
              Interactive Business Showcase • Changes are simulated & clear upon logout
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetSandbox}
              className="px-2.5 py-1 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              title="Reset demo balances and activities back to baseline"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Demo</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              title="Exit Sandbox and clear all session data"
            >
              <LogOut className="w-3 h-3" />
              <span>Exit & Clear</span>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {brandLogo ? (
            <div className="h-10 sm:h-11 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              {brandLogo.startsWith('<svg') ? (
                <div
                  className="h-full w-auto max-w-[200px] sm:max-w-[260px] flex items-center justify-center [&>svg]:h-full [&>svg]:w-auto"
                  dangerouslySetInnerHTML={{ __html: brandLogo }}
                />
              ) : (
                <img
                  src={brandLogo}
                  alt="Social Medium Logo"
                  className="h-10 sm:h-11 w-auto max-w-[200px] sm:max-w-[260px] object-contain"
                />
              )}
            </div>
          ) : (
            <>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3bc0cd] to-[#344ea2] flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform shrink-0">
                SM
              </div>
              <div>
                <span className="font-fredoka text-xl font-bold tracking-tight text-[#344ea2] block">
                  SOCIAL MEDIUM
                </span>
              </div>
            </>
          )}
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              pathname === '/'
                ? 'bg-[#3bc0cd]/15 text-[#344ea2] font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#3bc0cd] text-white shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-[#344ea2] hover:bg-stone-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: Mode Switcher & Tap Card Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Release Changelog Button */}
          {isDevMode && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={openChangelog}
                title="View Release Changelog"
                className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-900 hover:bg-amber-500/25 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>v{APP_VERSION}</span>
                <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              </button>
            </div>
          )}

          {/* Interactive Mode Selector Dropdown */}
          <div className="relative">
            {mode === 'developer' ? (
              <button
                type="button"
                onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                className="px-2.5 py-1 rounded-full bg-amber-200 hover:bg-amber-300 text-amber-950 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs border border-amber-300"
                title="Active Mode: Developer"
              >
                <Code2 className="w-3.5 h-3.5 text-amber-800" />
                <span>Developer</span>
                <ChevronDown className="w-3 h-3 text-amber-800" />
              </button>
            ) : mode === 'staff' ? (
              <button
                type="button"
                onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                className="px-2.5 py-1 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs border border-indigo-200"
                title="Active Mode: Staff"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-700" />
                <span>Staff</span>
                <ChevronDown className="w-3 h-3 text-indigo-700" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs transition-colors flex items-center gap-1 cursor-pointer"
                title="Active Mode: User"
              >
                <User className="w-3.5 h-3.5 text-stone-500" />
                <span>Member</span>
                <ChevronDown className="w-3 h-3 text-stone-500" />
              </button>
            )}

            {/* Mode Dropdown Menu */}
            {isModeDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsModeDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white border border-stone-200 shadow-xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                    Switch App Mode
                  </div>

                  {/* User Mode */}
                  <button
                    type="button"
                    onClick={() => handleSelectMode('user')}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                      mode === 'user'
                        ? 'bg-stone-100 font-bold text-stone-900'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-stone-500" />
                      <span>Member View</span>
                    </div>
                    {mode === 'user' && <Check className="w-3.5 h-3.5 text-stone-900" />}
                  </button>

                  {/* Staff Mode */}
                  {canAccessStaff ? (
                    <button
                      type="button"
                      onClick={() => handleSelectMode('staff')}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                        mode === 'staff'
                          ? 'bg-indigo-50 font-bold text-indigo-900'
                          : 'text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Staff Mode</span>
                      </div>
                      {mode === 'staff' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ) : (
                    <div
                      title="Requires Staff or Board permissions"
                      className="w-full text-left px-3 py-2 flex items-center justify-between text-stone-400 opacity-60 cursor-not-allowed bg-stone-50/50"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-stone-400" />
                        <span>Staff Mode</span>
                      </div>
                      <Lock className="w-3 h-3 text-stone-400" />
                    </div>
                  )}

                  {/* Developer Mode */}
                  {canAccessDev ? (
                    <button
                      type="button"
                      onClick={() => handleSelectMode('developer')}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                        mode === 'developer'
                          ? 'bg-amber-50 font-bold text-amber-950'
                          : 'text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Code2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Developer Mode</span>
                      </div>
                      {mode === 'developer' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                    </button>
                  ) : (
                    <div
                      title="Requires Developer permissions"
                      className="w-full text-left px-3 py-2 flex items-center justify-between text-stone-400 opacity-60 cursor-not-allowed bg-stone-50/50"
                    >
                      <div className="flex items-center gap-2">
                        <Code2 className="w-3.5 h-3.5 text-stone-400" />
                        <span>Developer Mode</span>
                      </div>
                      <Lock className="w-3 h-3 text-stone-400" />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {activeCardId ? (
            <div className="flex items-center gap-1.5">
              {member && (
                <>
                  {/* Level & XP Pill */}
                  <Link
                    href="/profile#xp"
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-semibold transition-colors shadow-xs"
                    title={`${member.levelTitle || `Level ${member.level || 1}`} (${member.xp || 0} XP)`}
                  >
                    <span>{member.levelBadge || '⭐'}</span>
                    <span>Lv.{member.level || 1}</span>
                    <span className="text-amber-800/80 font-normal text-[11px]">• {member.xp || 0} XP</span>
                  </Link>

                  <Link
                    href="/store"
                    className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                      (member.storeBalance ?? 0) < 0
                        ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                        : (member.storeBalance ?? 0) > 0
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                        : 'bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200'
                    }`}
                    title="Makerspace Wallet & Tab Balance"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#344ea2]" />
                    <span className="font-mono">
                      {(member.storeBalance ?? 0) < 0
                        ? `-$${Math.abs(member.storeBalance ?? 0).toFixed(2)}`
                        : (member.storeBalance ?? 0) > 0
                        ? `+$${(member.storeBalance ?? 0).toFixed(2)}`
                        : '$0.00'}
                    </span>
                  </Link>
                </>
              )}
              {isSandboxMode ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 hover:border-indigo-400 text-xs transition-colors shadow-2xs"
                  title="Sandbox Demo Active"
                >
                  <span className="text-xs">🧪</span>
                  <span className="font-mono font-bold text-indigo-950">DEMO-2026</span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                </Link>
              ) : (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 hover:border-[#3bc0cd] text-xs transition-colors"
                  title="Active Tap Card"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#f16622]" />
                  <span className="font-mono font-semibold text-stone-800">{activeCardId}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </Link>
              )}
              <button
                type="button"
                onClick={logout}
                title="Switch Tap Card"
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-stone-500 font-medium hidden sm:block">
              Not Connected
            </div>
          )}
        </div>
      </div>
      <LevelUpModal />
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { isStaffMode, isDevMode, isContestVisible, isImpactVisible } = useDevMode();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Close more sheet on route change
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  // Primary 4 tabs + 1 "More" slot
  const primaryTabs = [
    { href: '/', label: 'Home', icon: Home, exact: true },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/store', label: 'Store', icon: ShoppingBag },
    ...(isImpactVisible ? [{ href: '/impact', label: 'Impact', icon: HeartHandshake }] : []),
  ];

  // Secondary items shown inside the More drawer
  const secondaryItems = [
    { href: '/events', label: 'Events', icon: Calendar, desc: 'Workshops & community gatherings' },
    ...(isContestVisible
      ? [{ href: '/costume-contest', label: 'Costume Contest', icon: Trophy, desc: 'Photos & community voting' }]
      : []),
    { href: '/portal-media', label: 'Portal Door', icon: DoorOpen, desc: 'Personal tap card media' },
    { href: '/game-room', label: 'Game Room', icon: Gamepad2, desc: 'Screen controller & lighting' },
    ...(isStaffMode
      ? [{ href: '/staff', label: 'Staff Operations', icon: Shield, desc: 'Dashboard & activity logging' }]
      : []),
    ...(isDevMode
      ? [{ href: '/developer', label: 'Developer Center', icon: Code2, desc: 'System settings & tools' }]
      : []),
  ];

  const isSecondaryActive = secondaryItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {/* Slide-Up Drawer for Secondary Modules */}
      {isMoreOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMoreOpen(false)}
          />
          <div className="md:hidden fixed bottom-16 left-0 right-0 z-50 bg-white rounded-t-3xl border-t border-stone-200 p-5 shadow-2xl max-w-lg mx-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <span className="font-fredoka text-lg font-bold text-stone-900">
                More Modules
              </span>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-[#3bc0cd]/10 border-[#3bc0cd] text-[#344ea2]'
                        : 'bg-stone-50 border-stone-200/80 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={`p-1.5 rounded-xl ${
                          isActive ? 'bg-[#3bc0cd] text-white' : 'bg-stone-200/70 text-stone-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs truncate">{item.label}</span>
                    </div>
                    <p className="text-[10px] text-stone-500 line-clamp-1">{item.desc}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* 5-Slot Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-3 py-1 shadow-lg safe-area-pb">
        <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
          {primaryTabs.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-medium transition-colors ${
                  isActive ? 'text-[#344ea2] font-semibold' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition-colors ${
                    isActive ? 'bg-[#3bc0cd]/15 text-[#344ea2]' : 'text-stone-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="truncate max-w-[64px] text-center">{item.label}</span>
              </Link>
            );
          })}

          {/* Slot 5: More Drawer Button */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-medium transition-colors cursor-pointer ${
              isSecondaryActive || isMoreOpen
                ? 'text-[#344ea2] font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                isSecondaryActive || isMoreOpen
                  ? 'bg-[#3bc0cd]/15 text-[#344ea2]'
                  : 'text-stone-400'
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="truncate max-w-[64px] text-center">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
