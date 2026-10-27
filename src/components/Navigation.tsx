'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, DoorOpen, Gamepad2, Home, CreditCard, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { href: '/profile', label: 'Profile', icon: User, description: 'Member info & certifications' },
  { href: '/portal-media', label: 'Portal Media', icon: DoorOpen, description: 'Personal tap card media' },
  { href: '/game-room', label: 'Game Room', icon: Gamepad2, description: 'Room remote & presets' },
];

export function Navbar() {
  const pathname = usePathname();
  const { activeCardId, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3bc0cd] to-[#344ea2] flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
            SM
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-fredoka text-xl font-bold tracking-tight text-[#344ea2]">
                SOCIAL MEDIUM
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-[#f16622]/10 text-[#f16622] border border-[#f16622]/20">
                Companion
              </span>
            </div>
            <p className="text-[11px] text-stone-500 -mt-1 hidden sm:block font-roboto">
              A Social Makerspace • West Hills, CA
            </p>
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
          {NAV_ITEMS.map((item) => {
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

        {/* Tap Card Status / Switch Button */}
        <div className="flex items-center gap-2">
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
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-stone-500 font-medium">
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

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-3 py-1 shadow-lg safe-area-pb">
      <div className="grid grid-cols-4 items-center justify-around">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-medium transition-colors ${
            pathname === '/'
              ? 'text-[#344ea2] font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Home className={`w-5 h-5 mb-0.5 ${pathname === '/' ? 'text-[#344ea2]' : 'text-stone-400'}`} />
          <span>Home</span>
        </Link>
        {NAV_ITEMS.map((item) => {
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
