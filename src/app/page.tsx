'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  DoorOpen,
  Gamepad2,
  ChevronRight,
  CreditCard,
  Sparkles,
  MapPin,
  Wrench,
  Code2,
  BookOpen,
  Calendar,
  Shield,
  BarChart3,
  ClipboardList,
  Megaphone,
  Edit2,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDevMode } from '@/context/DevModeContext';
import { TapCardLogin } from '@/components/TapCardLogin';
import { getGreetingName, CommunityAnnouncement } from '@/lib/types';
import { fetchCommunityAnnouncement, updateCommunityAnnouncement } from '@/lib/neon';
import { APP_VERSION } from '@/lib/version';

export default function HomePage() {
  const { activeCardId, member, isLoading } = useAuth();
  const { mode, isDevMode, isStaffMode, openChangelog } = useDevMode();

  // Community Announcement State
  const [announcement, setAnnouncement] = useState<CommunityAnnouncement | null>(null);
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [announcementSaveSuccess, setAnnouncementSaveSuccess] = useState(false);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadAnnouncement = async () => {
      try {
        const cached = localStorage.getItem('sm_community_announcement');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (isMounted) setAnnouncement(parsed);
        }
      } catch (_) {}

      const live = await fetchCommunityAnnouncement();
      if (live && isMounted) {
        setAnnouncement(live);
        try {
          localStorage.setItem('sm_community_announcement', JSON.stringify(live));
        } catch (_) {}
      }
    };
    loadAnnouncement();
    return () => {
      isMounted = false;
    };
  }, []);

  const canEditAnnouncement = isDevMode || Boolean(member?.isAppDeveloper);

  const handleStartEditAnnouncement = () => {
    setEditTitle(announcement?.title || 'Welcome to Social Medium!');
    setEditMessage(
      announcement?.message ||
        'Welcome to the official Social Medium Makerspace app! Check out upcoming events, view your tool certifications, and keep your profile up to date.'
    );
    setEditAuthor(announcement?.author || getGreetingName(member));
    setIsEditingAnnouncement(true);
    setAnnouncementError(null);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editMessage.trim()) {
      setAnnouncementError('Title and message are required.');
      return;
    }
    setIsSavingAnnouncement(true);
    setAnnouncementError(null);

    const res = await updateCommunityAnnouncement({
      title: editTitle.trim(),
      message: editMessage.trim(),
      author: editAuthor.trim() || getGreetingName(member),
      active: true,
    });

    if (res.success && res.announcement) {
      setAnnouncement(res.announcement);
      try {
        localStorage.setItem('sm_community_announcement', JSON.stringify(res.announcement));
      } catch (_) {}
      setIsEditingAnnouncement(false);
      setAnnouncementSaveSuccess(true);
      setTimeout(() => setAnnouncementSaveSuccess(false), 3000);
    } else {
      setAnnouncementError(res.error || 'Failed to update announcement.');
    }
    setIsSavingAnnouncement(false);
  };

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

      {/* Staff Mode Banner (Visible in Staff Mode) */}
      {mode === 'staff' && (
        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-between gap-3 text-xs text-indigo-950 font-roboto shadow-xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-800 font-bold">
              <Shield className="w-3.5 h-3.5" />
            </span>
            <span>
              <strong>Staff Mode Active</strong> • CRM Activity Logger & Intelligence Center Available
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/new-activity"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors cursor-pointer"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Log Activity</span>
            </Link>
            <Link
              href="/neon-dashboard"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </div>
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

      {/* Announcements Card (Noticeboard with Developer Editing) */}
      <div className="rounded-2xl bg-white border border-stone-200 shadow-xs p-5 sm:p-6 transition-all hover:border-amber-300">
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-fredoka text-lg font-bold text-stone-900 leading-tight">
                  Announcements
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 uppercase tracking-wide">
                  Community Noticeboard
                </span>
              </div>
              <p className="text-stone-500 text-xs mt-0.5">
                Official notices and community highlights from Social Medium leadership.
              </p>
            </div>
          </div>

          {canEditAnnouncement && !isEditingAnnouncement && (
            <button
              type="button"
              onClick={handleStartEditAnnouncement}
              className="text-xs font-semibold text-[#344ea2] hover:text-[#f16622] flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer shrink-0"
              title="Edit community announcement text"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Announcement</span>
            </button>
          )}
        </div>

        {announcementSaveSuccess && (
          <div className="mb-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Announcement successfully saved and synchronized across the makerspace!</span>
          </div>
        )}

        {announcementError && (
          <div className="mb-3.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{announcementError}</span>
          </div>
        )}

        {!isEditingAnnouncement ? (
          <div className="space-y-2">
            <h3 className="font-bold text-stone-900 text-base sm:text-lg">
              {announcement?.title || 'Welcome to Social Medium!'}
            </h3>
            <p className="text-stone-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-roboto">
              {announcement?.message ||
                'Welcome to the official Social Medium Makerspace app! Check out upcoming events, view your tool certifications, and keep your profile up to date.'}
            </p>
            <div className="pt-2 text-[11px] text-stone-400 flex items-center gap-2">
              <span>
                Posted by <strong className="text-stone-600">{announcement?.author || 'Ben Braunstein'}</strong>
              </span>
              <span>•</span>
              <span>
                {announcement?.updatedAt
                  ? new Date(announcement.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Recent'}
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveAnnouncement} className="space-y-3.5 pt-1">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g. New Equipment safety walkthroughs this Saturday!"
                className="w-full text-stone-800 font-semibold bg-stone-50 p-2.5 rounded-xl border border-stone-200 focus:bg-white focus:border-[#3bc0cd] text-xs outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Announcement Message
              </label>
              <textarea
                required
                rows={4}
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                placeholder="Write your announcement text here..."
                className="w-full text-stone-800 font-medium bg-stone-50 p-2.5 rounded-xl border border-stone-200 focus:bg-white focus:border-[#3bc0cd] text-xs outline-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Posted By (Author)
                </label>
                <input
                  type="text"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  placeholder="e.g. Ben Braunstein"
                  className="w-full text-stone-800 font-medium bg-stone-50 p-2.5 rounded-xl border border-stone-200 focus:bg-white focus:border-[#3bc0cd] text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setIsEditingAnnouncement(false);
                  setAnnouncementError(null);
                }}
                disabled={isSavingAnnouncement}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingAnnouncement}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isSavingAnnouncement ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Announcement...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Publish Announcement</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Top-Level Module Cards (4 for Members, 6 for Staff/Dev) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isStaffMode ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
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

        {/* Module 5: Neon Dashboard (Staff & Dev Mode Only) */}
        {isStaffMode && (
          <Link
            href="/neon-dashboard"
            className="group p-5 rounded-2xl bg-gradient-to-b from-stone-900 via-stone-900 to-[#070b14] text-white border border-indigo-500/30 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/10 transition-all flex flex-col justify-between relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/30 border border-indigo-500/50 text-indigo-200">
                  Staff Only
                </span>
              </div>
              <h2 className="font-fredoka text-xl font-bold text-white group-hover:text-cyan-300 transition-colors mb-1">
                Neon Dashboard
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                Live event attendance, check-in trends, staff activity tracking, and searchable activity ledger.
              </p>
            </div>
            <div className="relative z-10 mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs font-semibold text-cyan-400">
              <span>Open Intelligence Center</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-cyan-500/15 blur-xl pointer-events-none" />
          </Link>
        )}

        {/* Module 6: Log Activity (Staff & Dev Mode Only) */}
        {isStaffMode && (
          <Link
            href="/new-activity"
            className="group p-5 rounded-2xl bg-gradient-to-b from-stone-900 via-stone-900 to-[#160a24] text-white border border-purple-500/30 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10 transition-all flex flex-col justify-between relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/30 border border-purple-500/50 text-purple-200">
                  Staff Only
                </span>
              </div>
              <h2 className="font-fredoka text-xl font-bold text-white group-hover:text-purple-300 transition-colors mb-1">
                Log Activity
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                Create new activity records in Neon CRM for tool certifications, safety walkthroughs, or staff notes.
              </p>
            </div>
            <div className="relative z-10 mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs font-semibold text-purple-400">
              <span>Create CRM Activity</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-purple-500/15 blur-xl pointer-events-none" />
          </Link>
        )}
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
