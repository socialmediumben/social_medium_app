'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  User,
  DoorOpen,
  Gamepad2,
  Home,
  CreditCard,
  LogOut,
  Code2,
  BookOpen,
  Sliders,
  Calendar,
  Shield,
  BarChart3,
  ClipboardList,
  ChevronDown,
  Check,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDevMode, AppMode } from '@/context/DevModeContext';
import { APP_VERSION } from '@/lib/version';

const BASE_NAV_ITEMS = [
  { href: '/profile', label: 'Profile', icon: User, description: 'Member info & certifications' },
  { href: '/events', label: 'Events', icon: Calendar, description: 'Upcoming events & RSVP' },
  { href: '/portal-media', label: 'Portal Media', icon: DoorOpen, description: 'Personal tap card media' },
  { href: '/game-room', label: 'Game Room', icon: Gamepad2, description: 'Room remote & presets' },
];

export function Navbar() {
  const pathname = usePathname();
  const { activeCardId, logout } = useAuth();
  const {
    mode,
    setMode,
    isDevMode,
    isStaffMode,
    canAccessStaff,
    canAccessDev,
    openChangelog,
    openIconManager,
  } = useDevMode();
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);

  const navItems = [
    ...BASE_NAV_ITEMS,
    ...(isStaffMode
      ? [
          {
            href: '/neon-dashboard',
            label: 'Dashboard',
            icon: BarChart3,
            description: 'Neon CRM Activities & Analytics',
          },
          {
            href: '/new-activity',
            label: 'New Activity',
            icon: ClipboardList,
            description: 'Log Staff Activity in CRM',
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Name (Clicking logo cycles modes easily as a shortcut) */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3bc0cd] to-[#344ea2] flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
            SM
          </div>
          <div>
            <span className="font-fredoka text-xl font-bold tracking-tight text-[#344ea2] block">
              SOCIAL MEDIUM
            </span>
          </div>
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
          {/* Developer Quick Buttons */}
          {isDevMode && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={openIconManager}
                title="Manage SSOT Certification Icons"
                className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-900 hover:bg-amber-500/25 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-800" />
                <span className="hidden sm:inline">Icons</span>
              </button>
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
                className="px-2.5 py-1 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs border border-indigo-300"
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
                className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs border border-stone-300"
                title="Active Mode: User"
              >
                <User className="w-3.5 h-3.5 text-stone-500" />
                <span>User</span>
                <ChevronDown className="w-3 h-3 text-stone-500" />
              </button>
            )}

            {/* Mode Picker Menu Popup */}
            {isModeDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsModeDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-stone-200 shadow-xl z-50 p-1.5 space-y-1 text-xs">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Select Mode
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectMode('user')}
                    className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                      mode === 'user'
                        ? 'bg-stone-100 font-bold text-stone-900'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-stone-600" />
                      <span>User (Member)</span>
                    </div>
                    {mode === 'user' && <Check className="w-3.5 h-3.5 text-stone-700" />}
                  </button>

                  {/* Staff Mode Option */}
                  {canAccessStaff ? (
                    <button
                      type="button"
                      onClick={() => handleSelectMode('staff')}
                      className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
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
                      title="Requires Neon One System User access"
                      className="w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between text-stone-400 opacity-60 cursor-not-allowed bg-stone-50/50"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-stone-400" />
                        <span>Staff Mode</span>
                      </div>
                      <Lock className="w-3 h-3 text-stone-400" />
                    </div>
                  )}

                  {/* Developer Mode Option */}
                  {canAccessDev ? (
                    <button
                      type="button"
                      onClick={() => handleSelectMode('developer')}
                      className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                        mode === 'developer'
                          ? 'bg-amber-50 font-bold text-amber-900'
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
                      title="Requires 'App Developer' checked in Neon One"
                      className="w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between text-stone-400 opacity-60 cursor-not-allowed bg-stone-50/50"
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
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 hover:border-[#3bc0cd] text-xs transition-colors"
                title="Active Tap Card"
              >
                <CreditCard className="w-3.5 h-3.5 text-[#f16622]" />
                <span className="font-mono font-semibold text-stone-800">{activeCardId}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </Link>
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
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { isStaffMode } = useDevMode();

  const navItems = [
    ...BASE_NAV_ITEMS,
    ...(isStaffMode
      ? [
          {
            href: '/neon-dashboard',
            label: 'Dashboard',
            icon: BarChart3,
            description: 'Neon CRM Analytics',
          },
        ]
      : []),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-1 shadow-lg safe-area-pb">
      <div className={`grid ${isStaffMode ? 'grid-cols-6' : 'grid-cols-5'} items-center justify-around`}>
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[10px] font-medium transition-colors ${
            pathname === '/'
              ? 'text-[#344ea2] font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Home className={`w-5 h-5 mb-0.5 ${pathname === '/' ? 'text-[#344ea2]' : 'text-stone-400'}`} />
          <span>Home</span>
        </Link>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-[#3bc0cd] font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-[#3bc0cd]/15 text-[#3bc0cd]' : 'text-stone-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="truncate max-w-[70px] text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
