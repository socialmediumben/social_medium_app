'use client';

import Link from 'next/link';
import { User, DoorOpen, Gamepad2, ChevronRight, CreditCard, Sparkles, MapPin, Wrench, Code2, BookOpen, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDevMode } from '@/context/DevModeContext';
import { TapCardLogin } from '@/components/TapCardLogin';
import { getGreetingName } from '@/lib/types';
import { APP_VERSION } from '@/lib/version';

export default function HomePage() {
  const { activeCardId, member, isLoading } = useAuth();
  const { isDevMode, openChangelog } = useDevMode();

  if (isLoading) {
    return (
      <div className="py-20 text-center text-stone-500 font-mono text-sm">
        Loading Social Medium account...
      </div>
    );
  }

  if (!activeCardId || !member) {
    return <TapCardLogin />;
  }

  const certCount = member.certifications ? member.certifications.length : 0;
  const greetingName = getGreetingName(member);

  return (
    <div className="space-y-6">
      {/* Developer Mode Banner (Only visible in Developer Mode) */}
      {isDevMode && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-xs text-amber-900 font-roboto shadow-xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-500/20 text-amber-800 font-bold">
              <Code2 className="w-3.5 h-3.5" />
            </span>
            <span>
              <strong>Developer Mode Active</strong> • Version <strong>v{APP_VERSION}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={openChangelog}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 font-semibold transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>View Changelog</span>
          </button>
        </div>
      )}

      {/* Welcome Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#344ea2] via-[#2a3f85] to-[#1e2e66] text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-medium text-[#3bc0cd] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#f16622]" />
            Official Member App
          </div>
          <h1 className="font-fredoka text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
            Welcome, {greetingName}!
          </h1>
          <p className="text-stone-200 text-sm sm:text-base leading-relaxed mb-6 font-roboto">
            Your web app for <strong>Social Medium Makerspace</strong>. Manage your member profile, RSVP for upcoming events, update your physical tap card media, and control the Game Room.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-300">
            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
              <CreditCard className="w-3.5 h-3.5 text-[#3bc0cd]" />
              <span>Tap Card: <strong className="text-white font-mono">{member.tapCard}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
              <Wrench className="w-3.5 h-3.5 text-[#f16622]" />
              <span>Certifications: <strong className="text-white">{certCount} Recorded</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-[#8a9280]" />
              <span>West Hills, CA</span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-[#3bc0cd]/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-12 w-48 h-48 rounded-full bg-[#f16622]/20 blur-3xl pointer-events-none" />
      </div>

      {/* 4 Top-Level Module Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Module 1: Profile */}
        <Link
          href="/profile"
          className="group p-5 rounded-2xl bg-white border border-stone-200 hover:border-[#3bc0cd] hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#3bc0cd]/10 text-[#3bc0cd] flex items-center justify-center group-hover:scale-105 transition-transform">
                <User className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 font-mono">
                #{member.tapCard}
              </span>
            </div>
            <h2 className="font-fredoka text-xl font-bold text-stone-900 group-hover:text-[#344ea2] transition-colors mb-1">
              Member Profile
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              View your contact info, registered Tap Card, and tool Certifications.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-[#344ea2]">
            <span>Open Profile</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Module 2: Events */}
        <Link
          href="/events"
          className="group p-5 rounded-2xl bg-white border border-stone-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800">
                Member RSVP
              </span>
            </div>
            <h2 className="font-fredoka text-xl font-bold text-stone-900 group-hover:text-emerald-700 transition-colors mb-1">
              Events
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              Browse upcoming community events, skill shares, and specialized workshops with free RSVP.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
            <span>Browse Events</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Module 3: Portal Media */}
        <Link
          href="/portal-media"
          className="group p-5 rounded-2xl bg-white border border-stone-200 hover:border-[#f16622] hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#f16622]/10 text-[#f16622] flex items-center justify-center group-hover:scale-105 transition-transform">
                <DoorOpen className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f16622]/10 text-[#f16622]">
                Personal Tap Card
              </span>
            </div>
            <h2 className="font-fredoka text-xl font-bold text-stone-900 group-hover:text-[#f16622] transition-colors mb-1">
              My Portal Media
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              View and edit the custom video or photo bound to your physical Tap Card for the interactive Portal Door.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-[#f16622]">
            <span>Edit My Card Media</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Module 4: Game Room Remote */}
        <Link
          href="/game-room"
          className="group p-5 rounded-2xl bg-white border border-stone-200 hover:border-[#344ea2] hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#344ea2]/10 text-[#344ea2] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#344ea2]/10 text-[#344ea2]">
                The Wizard&apos;s Grimoire
              </span>
            </div>
            <h2 className="font-fredoka text-xl font-bold text-stone-900 group-hover:text-[#344ea2] transition-colors mb-1">
              Game Room Remote
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              Control the D&D Game Room screens (Window TV, Picture Frame, Projector) and atmospheric lighting scenes.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-[#344ea2]">
            <span>Open Room Controller</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Community Info Banner */}
      <div className="p-4 rounded-xl bg-stone-100 border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-stone-600">
        <div>
          <strong className="text-stone-800">Social Medium Nonprofit</strong> • 7521 Fallbrook Ave, West Hills, CA 91307
        </div>
        <div className="flex items-center gap-3">
          <a href="https://www.socialmedium.space" target="_blank" rel="noreferrer" className="text-[#344ea2] hover:underline font-medium">
            Official Website ↗
          </a>
          <span>•</span>
          <a href="https://discord.gg/9MNeZqYjNv" target="_blank" rel="noreferrer" className="text-[#344ea2] hover:underline font-medium">
            Discord ↗
          </a>
        </div>
      </div>
    </div>
  );
}
