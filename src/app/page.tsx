import Link from 'next/link';
import { User, DoorOpen, Gamepad2, Award, ChevronRight, CreditCard, Sparkles, MapPin, Wrench } from 'lucide-react';
import { DEFAULT_MEMBER } from '@/lib/member-data';

export default function HomePage() {
  const activeCerts = DEFAULT_MEMBER.certifications.filter(c => c.active).length;

  return (
    <div className="space-y-6">
      {/* Welcome Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#344ea2] via-[#2a3f85] to-[#1e2e66] text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-medium text-[#3bc0cd] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#f16622]" />
            Official Member Companion
          </div>
          <h1 className="font-fredoka text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
            Welcome back, {DEFAULT_MEMBER.name.split(' ')[0]}!
          </h1>
          <p className="text-stone-200 text-sm sm:text-base leading-relaxed mb-6 font-roboto">
            Your personal companion for <strong>Social Medium Makerspace</strong>. Manage your member profile, update your physical tap card media, control the Game Room, and view your maker achievements.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-300">
            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
              <CreditCard className="w-3.5 h-3.5 text-[#3bc0cd]" />
              <span>Tap Card: <strong className="text-white font-mono">{DEFAULT_MEMBER.tapCardId}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
              <Wrench className="w-3.5 h-3.5 text-[#f16622]" />
              <span>Certifications: <strong className="text-white">{activeCerts} Active</strong></span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">
                Neon One Synced
              </span>
            </div>
            <h2 className="font-fredoka text-xl font-bold text-stone-900 group-hover:text-[#344ea2] transition-colors mb-1">
              Member Profile
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              View your member ID, tier, equipment certifications (Laser, 3D Print, Wood Shop), and emergency contact.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-[#344ea2]">
            <span>Open Profile</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Module 2: Portal Media */}
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
              View and edit the custom video or photo bound to your physical tap card for the interactive Portal Door.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-[#f16622]">
            <span>Edit My Card Media</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Module 3: Game Room Remote */}
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
                The Wizard's Grimoire
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

        {/* Module 4: Achievements */}
        <Link
          href="/achievements"
          className="group p-5 rounded-2xl bg-white border border-stone-200 hover:border-[#8a9280] hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#8a9280]/15 text-[#656d5b] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#8a9280]/15 text-[#4a5142]">
                5 Unlocked
              </span>
            </div>
            <h2 className="font-fredoka text-xl font-bold text-stone-900 group-hover:text-[#8a9280] transition-colors mb-1">
              Achievements & Badges
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              Track your maker milestones, workshop badges, and safety certifications synced with Neon One.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-[#656d5b]">
            <span>View Badges</span>
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
