'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  QrCode,
  UserPlus,
  Sparkles,
  Heart,
  Search,
  Trash2,
  Eye,
  Check,
  Radio,
  Star,
  Plus,
  Settings,
  Shield,
  Layers,
  Smile,
  X,
} from 'lucide-react';
import {
  BuddyBubbleMember,
  MemberProfile,
  CustomBubbleGroup,
  getGreetingName,
} from '@/lib/types';
import {
  loadBuddyBubble,
  removeBuddyFromBubble,
  refreshBuddyProfiles,
  toggleBuddyFavorite,
  loadUserCustomBubbles,
  saveUserCustomBubbles,
  refreshCustomBubbles,
  removeMemberFromCustomBubble,
} from '@/lib/bubble';
import { BuddyAvatarBadge } from '@/components/buddy/BuddyAvatarBadge';
import { BuddyCanvas } from '@/components/buddy/BuddyCanvas';
import { loadMemberBuddyConfig } from '@/lib/buddy';
import { BuddyPassModal } from './BuddyPassModal';
import { AddBuddyScannerModal } from './AddBuddyScannerModal';
import { AddBuddyConfirmationModal } from './AddBuddyConfirmationModal';
import { CreateBubbleModal } from './CreateBubbleModal';
import { AddMembersFromBigBubbleModal } from './AddMembersFromBigBubbleModal';
import { BubbleJoinPassModal } from './BubbleJoinPassModal';
import { BubbleSettingsModal } from './BubbleSettingsModal';
import { AssignBuddyBubblesModal } from './AssignBuddyBubblesModal';

interface BuddyBubbleViewProps {
  member: MemberProfile | null | undefined;
  initialAddBuddy?: BuddyBubbleMember | null;
  initialActiveBubbleId?: string;
}

export const BuddyBubbleView: React.FC<BuddyBubbleViewProps> = ({
  member,
  initialAddBuddy = null,
  initialActiveBubbleId = 'big-bubble',
}) => {
  const accountId = member?.accountId || member?.tapCard || '';
  const [buddies, setBuddies] = useState<BuddyBubbleMember[]>(() => loadBuddyBubble(accountId));
  const [customBubbles, setCustomBubbles] = useState<CustomBubbleGroup[]>(() =>
    loadUserCustomBubbles(accountId)
  );
  const [activeBubbleId, setActiveBubbleId] = useState<string>(initialActiveBubbleId);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [confirmBuddy, setConfirmBuddy] = useState<BuddyBubbleMember | null>(initialAddBuddy);
  const [inspectBuddy, setInspectBuddy] = useState<BuddyBubbleMember | null>(null);

  // Multi-Bubble Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [joinPassBubble, setJoinPassBubble] = useState<CustomBubbleGroup | null>(null);
  const [settingsBubble, setSettingsBubble] = useState<CustomBubbleGroup | null>(null);
  const [assignBuddy, setAssignBuddy] = useState<BuddyBubbleMember | null>(null);

  // Sync state with local updates & Neon refresh
  useEffect(() => {
    if (!accountId) return;

    // Load initial data
    const initialList = loadBuddyBubble(accountId);
    setBuddies(initialList);
    const initialGroups = loadUserCustomBubbles(accountId);
    setCustomBubbles(initialGroups);

    // Background refresh for buddies & custom bubbles
    refreshBuddyProfiles(accountId, initialList).then((refreshed) => {
      setBuddies(refreshed);
    });
    refreshCustomBubbles(accountId, initialGroups).then((refreshedGroups) => {
      setCustomBubbles(refreshedGroups);
    });

    const handleBubbleUpdate = (e: any) => {
      if (e?.detail?.buddies) {
        setBuddies(e.detail.buddies);
      } else {
        setBuddies(loadBuddyBubble(accountId));
      }
    };

    const handleCustomBubblesUpdate = (e: any) => {
      if (e?.detail?.bubbles) {
        setCustomBubbles(e.detail.bubbles);
      } else {
        setCustomBubbles(loadUserCustomBubbles(accountId));
      }
    };

    window.addEventListener('sm_buddy_bubble_updated', handleBubbleUpdate);
    window.addEventListener('sm_custom_bubbles_updated', handleCustomBubblesUpdate);
    return () => {
      window.removeEventListener('sm_buddy_bubble_updated', handleBubbleUpdate);
      window.removeEventListener('sm_custom_bubbles_updated', handleCustomBubblesUpdate);
    };
  }, [accountId]);

  // Handle incoming initialAddBuddy
  useEffect(() => {
    if (initialAddBuddy) {
      setConfirmBuddy(initialAddBuddy);
    }
  }, [initialAddBuddy]);

  const myInterests = useMemo(() => {
    return (member?.interests || []).map((i) => i.toLowerCase());
  }, [member?.interests]);

  // Current active custom group (if activeBubbleId is a custom bubble)
  const activeCustomGroup = useMemo(() => {
    return customBubbles.find((g) => g.id === activeBubbleId) || null;
  }, [customBubbles, activeBubbleId]);

  // Is current user an admin of the active custom group?
  const isCurrentAdminOfActive = useMemo(() => {
    if (!activeCustomGroup) return false;
    return (
      activeCustomGroup.adminAccountIds.some(
        (id) => id.toLowerCase() === accountId.toLowerCase()
      ) || activeCustomGroup.creatorAccountId.toLowerCase() === accountId.toLowerCase()
    );
  }, [activeCustomGroup, accountId]);

  // Buddies belonging to active circle
  const activeCircleBuddies = useMemo(() => {
    if (activeBubbleId === 'big-bubble') {
      return buddies;
    }
    if (activeBubbleId === 'best-buddies') {
      return buddies.filter((b) => b.isFavorite);
    }
    if (activeCustomGroup) {
      return buddies.filter((b) =>
        activeCustomGroup.memberAccountIds.some(
          (id) => id.toLowerCase() === b.accountId.toLowerCase()
        )
      );
    }
    return buddies;
  }, [buddies, activeBubbleId, activeCustomGroup]);

  // Filtered buddies matching search
  const filteredBuddies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeCircleBuddies;
    return activeCircleBuddies.filter((b) => {
      const name = (b.preferredName || b.name).toLowerCase();
      const title = (b.levelTitle || '').toLowerCase();
      const interests = (b.interests || []).join(' ').toLowerCase();
      return name.includes(q) || title.includes(q) || interests.includes(q);
    });
  }, [activeCircleBuddies, searchQuery]);

  // Favorite toggling (Best Buddies)
  const handleToggleFavorite = (buddy: BuddyBubbleMember, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!accountId) return;
    const updated = toggleBuddyFavorite(accountId, buddy.accountId);
    setBuddies(updated);
  };

  // Buddy Removal Handler
  const handleRemove = (buddy: BuddyBubbleMember) => {
    const buddyName = buddy.preferredName || buddy.name;

    if (activeCustomGroup) {
      // Remove from custom circle only
      if (confirm(`Remove ${buddyName} from "${activeCustomGroup.name}"?`)) {
        const res = removeMemberFromCustomBubble(activeCustomGroup.id, buddy.accountId, accountId);
        if (res.success && res.bubble) {
          setCustomBubbles((prev) =>
            prev.map((g) => (g.id === activeCustomGroup.id ? res.bubble! : g))
          );
        }
      }
    } else {
      // Remove connection from Big Bubble
      if (confirm(`Remove ${buddyName} from your Big Bubble?`)) {
        if (accountId) {
          const updated = removeBuddyFromBubble(accountId, buddy.accountId);
          setBuddies(updated);
        }
      }
    }
  };

  const favoriteCount = useMemo(() => buddies.filter((b) => b.isFavorite).length, [buddies]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ======================================================== */}
      {/* MULTI-BUBBLE NAVIGATION CHIP CAROUSEL                    */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
        {/* 1. Big Bubble (System Master) */}
        <button
          type="button"
          onClick={() => setActiveBubbleId('big-bubble')}
          className={`py-2 px-3.5 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeBubbleId === 'big-bubble'
              ? 'bg-[#344ea2] text-white shadow-sm ring-2 ring-[#344ea2]/30 scale-105'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span className="text-sm">🫧</span>
          <span>Big Bubble</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeBubbleId === 'big-bubble'
                ? 'bg-white/20 text-white'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            {buddies.length}
          </span>
        </button>

        {/* 2. Best Buddies (Favorites) */}
        <button
          type="button"
          onClick={() => setActiveBubbleId('best-buddies')}
          className={`py-2 px-3.5 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeBubbleId === 'best-buddies'
              ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/40 scale-105'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <Star
            className={`w-3.5 h-3.5 ${
              activeBubbleId === 'best-buddies' ? 'fill-white text-white' : 'text-amber-500 fill-amber-500'
            }`}
          />
          <span>Best Buddies</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeBubbleId === 'best-buddies'
                ? 'bg-white/20 text-white'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {favoriteCount}
          </span>
        </button>

        {/* 3. Custom Maker Bubbles (e.g. D&D Club, Denim Jacket Squad) */}
        {customBubbles.map((group) => {
          const isActive = activeBubbleId === group.id;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => setActiveBubbleId(group.id)}
              className={`py-2 px-3.5 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40 scale-105'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span className="text-sm">{group.icon}</span>
              <span className="truncate max-w-[120px]">{group.name}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {group.memberAccountIds.length}
              </span>
            </button>
          );
        })}

        {/* 4. Create New Bubble Button */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="py-2 px-3 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-1 bg-[#3bc0cd]/15 hover:bg-[#3bc0cd]/25 border border-[#3bc0cd]/40 text-[#344ea2] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Bubble</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* ACTIVE BUBBLE HERO / BANNER                              */}
      {/* ======================================================== */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden transition-all ${
          activeBubbleId === 'best-buddies'
            ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'
            : activeCustomGroup
            ? 'bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700'
            : 'bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-600'
        }`}
      >
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-12 w-64 h-24 bg-amber-300/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-mono font-bold text-amber-200 border border-white/20">
              {activeBubbleId === 'best-buddies' ? (
                <>
                  <Star className="w-3.5 h-3.5 fill-amber-200 text-amber-200" />
                  <span>Favorites Circle</span>
                </>
              ) : activeCustomGroup ? (
                <>
                  <Users className="w-3.5 h-3.5" />
                  <span>Custom Maker Circle</span>
                  {isCurrentAdminOfActive && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-900 text-[10px] font-bold">
                      👑 Admin
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Master Maker Directory</span>
                </>
              )}
            </div>

            <h2 className="font-fredoka text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-2.5">
              <span>
                {activeBubbleId === 'best-buddies'
                  ? 'Best Buddies'
                  : activeCustomGroup
                  ? `${activeCustomGroup.icon} ${activeCustomGroup.name}`
                  : 'Big Bubble'}
              </span>
            </h2>

            <p className="text-white/90 text-sm leading-relaxed">
              {activeBubbleId === 'best-buddies'
                ? 'Your top favorites! Star any friend in your Big Bubble to keep them pinned here.'
                : activeCustomGroup
                ? activeCustomGroup.description || 'Custom circle for collaborating on shared passions and projects.'
                : <>Add friends you meet at the makerspace by tapping their <strong>Buddy Band</strong> or scanning their <strong>Buddy Pass QR code</strong>.</>}
            </p>
          </div>

          {/* Action Buttons based on active circle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {activeCustomGroup ? (
              <>
                {isCurrentAdminOfActive ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsAddMembersModalOpen(true)}
                      className="py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-white text-stone-900 hover:bg-stone-100 shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 text-[#344ea2]" />
                      <span>Add from Big Bubble</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setJoinPassBubble(activeCustomGroup)}
                      className="py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-stone-900/90 hover:bg-stone-900 text-white border border-white/20 shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-emerald-400" />
                      <span>Bubble Pass</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsBubble(activeCustomGroup)}
                      className="p-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white border border-white/20 shadow-xs flex items-center justify-center transition-colors cursor-pointer"
                      title="Bubble Settings & Admins"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSettingsBubble(activeCustomGroup)}
                    className="py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-white text-stone-900 hover:bg-stone-100 shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-stone-700" />
                    <span>Circle Info & Leave</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsPassModalOpen(true)}
                  className="py-3 px-5 rounded-2xl font-bold text-sm bg-white text-stone-900 hover:bg-stone-100 shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-[#344ea2]" />
                  <span>My Buddy Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsScannerModalOpen(true)}
                  className="py-3 px-5 rounded-2xl font-bold text-sm bg-stone-900/90 hover:bg-stone-900 text-white border border-white/20 shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span>Add a Buddy</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Pill Footer */}
        <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/80 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse" />
            <span>
              <strong>{activeCircleBuddies.length}</strong>{' '}
              {activeCircleBuddies.length === 1 ? 'Buddy' : 'Buddies'} in{' '}
              {activeCustomGroup ? activeCustomGroup.name : 'this circle'}
            </span>
          </div>
          <div className="hidden sm:block">
            <span>
              {activeCustomGroup
                ? `Admin: ${activeCustomGroup.adminAccountIds.length} co-admin(s)`
                : 'Proximity Handshake • No Public Directory'}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SEARCH / FILTER BAR                                      */}
      {/* ======================================================== */}
      {activeCircleBuddies.length >= 2 && (
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-stone-200 shadow-xs">
          <Search className="w-4 h-4 text-stone-400 ml-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${
              activeCustomGroup ? activeCustomGroup.name : 'buddies'
            } by name, level, or interests...`}
            className="w-full text-xs sm:text-sm bg-transparent border-none focus:outline-none text-stone-800 placeholder-stone-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full text-stone-400 hover:text-stone-600 mr-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* GRID OF BUDDY CARDS                                      */}
      {/* ======================================================== */}
      {filteredBuddies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuddies.map((buddy) => {
            const buddyInterests = buddy.interests || [];
            const shared = buddyInterests.filter((i) => myInterests.includes(i.toLowerCase()));

            // Find custom bubbles this buddy belongs to
            const memberCustomGroups = customBubbles.filter((g) =>
              g.memberAccountIds.some(
                (id) => id.toLowerCase() === buddy.accountId.toLowerCase()
              )
            );

            return (
              <div
                key={buddy.accountId}
                className="relative bg-white rounded-3xl p-5 border border-stone-200/90 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Floating bubble background decoration */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-teal-50 rounded-full opacity-60 pointer-events-none group-hover:scale-125 transition-transform" />

                <div>
                  {/* Card Header: Avatar, Name, Star Favorite & Menu */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <BuddyAvatarBadge
                        accountId={buddy.accountId}
                        avatarJson={buddy.buddyAvatar}
                        size={56}
                        borderClassName="border-2 border-amber-300 bg-amber-50 shadow-xs"
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-fredoka text-lg font-bold text-stone-900 truncate">
                            {buddy.preferredName || buddy.name}
                          </h4>
                          {buddy.pronouns && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200/80">
                              {buddy.pronouns}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-500 font-mono mt-0.5 flex items-center gap-1">
                          <span>{buddy.levelBadge || '🌱'}</span>
                          <span>Level {buddy.level || 1}</span>
                          {buddy.levelTitle &&
                            buddy.levelTitle.trim().toLowerCase() !== `level ${buddy.level}` && (
                              <>
                                <span>•</span>
                                <span className="truncate">{buddy.levelTitle}</span>
                              </>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Card Controls: Favorite Star & Remove */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(buddy, e)}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                          buddy.isFavorite
                            ? 'text-amber-500 bg-amber-50'
                            : 'text-stone-300 hover:text-amber-500 hover:bg-stone-50'
                        }`}
                        title={buddy.isFavorite ? 'Remove from Best Buddies' : 'Add to Best Buddies'}
                      >
                        <Star
                          className={`w-4 h-4 ${buddy.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemove(buddy)}
                        className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                        title={
                          activeCustomGroup
                            ? `Remove from ${activeCustomGroup.name}`
                            : 'Remove connection'
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Circles Membership Badges */}
                  {memberCustomGroups.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {memberCustomGroups.map((g) => (
                        <span
                          key={g.id}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80"
                        >
                          <span>{g.icon}</span>
                          <span className="truncate max-w-[90px]">{g.name}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Interests */}
                  {buddyInterests.length > 0 && (
                    <div className="mb-4">
                      {shared.length > 0 ? (
                        <div className="space-y-1">
                          <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                            <span>Common maker ground:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {shared.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {buddyInterests.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200"
                            >
                              {tag}
                            </span>
                          ))}
                          {buddyInterests.length > 3 && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md text-stone-400">
                              +{buddyInterests.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions: Multi-Bubble Assignment & Mascot Inspection */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignBuddy(buddy)}
                    className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 border border-stone-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Assign to custom bubbles or favorites"
                  >
                    <Layers className="w-3.5 h-3.5 text-stone-500" />
                    <span>Circles...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInspectBuddy(buddy)}
                    className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold text-stone-700 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200/80 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-stone-500" />
                    <span>Mascot</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-10 border border-stone-200 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center shadow-inner text-3xl">
            {activeBubbleId === 'best-buddies' ? '⭐' : activeCustomGroup ? activeCustomGroup.icon : '🫧'}
          </div>

          <div className="max-w-md space-y-1">
            <h3 className="font-fredoka text-2xl font-bold text-stone-900">
              {activeBubbleId === 'best-buddies'
                ? 'No Best Buddies Yet'
                : activeCustomGroup
                ? `Ready to add makers to ${activeCustomGroup.name}!`
                : 'Your Bubble is Ready for Friends!'}
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm">
              {activeBubbleId === 'best-buddies'
                ? 'Star any buddy in your Big Bubble to add them to your Best Buddies favorites list.'
                : activeCustomGroup
                ? isCurrentAdminOfActive
                  ? 'Add buddies from your Big Bubble or show your Bubble Pass QR code for in-person joining.'
                  : 'No other buddies have joined this bubble yet.'
                : 'Connect with fellow makers in person! Tap your phone against their Buddy Band or scan their personal Buddy Pass QR code.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {activeCustomGroup && isCurrentAdminOfActive ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsAddMembersModalOpen(true)}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-2xl font-bold text-xs sm:text-sm bg-[#344ea2] hover:bg-[#2a3f85] text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add from Big Bubble</span>
                </button>
                <button
                  type="button"
                  onClick={() => setJoinPassBubble(activeCustomGroup)}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-2xl font-bold text-xs sm:text-sm bg-stone-900 hover:bg-stone-800 text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Bubble Join Pass</span>
                </button>
              </>
            ) : activeBubbleId === 'best-buddies' ? (
              <button
                type="button"
                onClick={() => setActiveBubbleId('big-bubble')}
                className="py-2.5 px-5 rounded-2xl font-bold text-xs sm:text-sm bg-[#344ea2] text-white shadow-xs cursor-pointer"
              >
                Go to Big Bubble
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsPassModalOpen(true)}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-2xl font-bold text-xs sm:text-sm bg-stone-900 hover:bg-stone-800 text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-amber-300" />
                  <span>Show My Buddy Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsScannerModalOpen(true)}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-2xl font-bold text-xs sm:text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add a Friend</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL SUITE                                              */}
      {/* ======================================================== */}

      {/* 1. Share My Buddy Pass (Personal) */}
      <BuddyPassModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        member={member}
      />

      {/* 2. Add Buddy Scanner (Camera + NFC) */}
      <AddBuddyScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onBuddyFound={(found) => {
          setIsScannerModalOpen(false);
          setConfirmBuddy(found);
        }}
      />

      {/* 3. Add Buddy Confirmation Dialog */}
      <AddBuddyConfirmationModal
        buddy={confirmBuddy}
        currentMember={member}
        isOpen={!!confirmBuddy}
        onClose={() => setConfirmBuddy(null)}
        onAddedSuccess={(newBuddy) => {
          setBuddies((prev) => [
            newBuddy,
            ...prev.filter((b) => b.accountId !== newBuddy.accountId),
          ]);
        }}
        onOpenMyPass={() => setIsPassModalOpen(true)}
      />

      {/* 4. Create Custom Bubble Modal */}
      <CreateBubbleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        creatorAccountId={accountId}
        allBuddies={buddies}
        onCreated={(newBubble) => {
          setCustomBubbles((prev) => [newBubble, ...prev]);
          setActiveBubbleId(newBubble.id);
        }}
      />

      {/* 5. Add Members to Custom Bubble from Big Bubble */}
      <AddMembersFromBigBubbleModal
        isOpen={isAddMembersModalOpen}
        onClose={() => setIsAddMembersModalOpen(false)}
        bubble={activeCustomGroup}
        adminAccountId={accountId}
        allBuddies={buddies}
        onMembersAdded={(updatedBubble) => {
          setCustomBubbles((prev) =>
            prev.map((g) => (g.id === updatedBubble.id ? updatedBubble : g))
          );
        }}
      />

      {/* 6. Custom Bubble Join Pass (QR Code) */}
      <BubbleJoinPassModal
        isOpen={!!joinPassBubble}
        onClose={() => setJoinPassBubble(null)}
        bubble={joinPassBubble}
        adminMember={member}
      />

      {/* 7. Custom Bubble Settings & Admins Modal */}
      <BubbleSettingsModal
        isOpen={!!settingsBubble}
        onClose={() => setSettingsBubble(null)}
        bubble={settingsBubble}
        currentAccountId={accountId}
        allBuddies={buddies}
        onUpdated={(updated) => {
          setCustomBubbles((prev) =>
            prev.map((g) => (g.id === updated.id ? updated : g))
          );
        }}
        onDeleted={(deletedId) => {
          setCustomBubbles((prev) => prev.filter((g) => g.id !== deletedId));
          if (activeBubbleId === deletedId) {
            setActiveBubbleId('big-bubble');
          }
        }}
        onLeft={(leftId) => {
          setCustomBubbles((prev) => prev.filter((g) => g.id !== leftId));
          if (activeBubbleId === leftId) {
            setActiveBubbleId('big-bubble');
          }
        }}
      />

      {/* 8. Assign Buddy to Bubbles Modal */}
      <AssignBuddyBubblesModal
        isOpen={!!assignBuddy}
        onClose={() => setAssignBuddy(null)}
        buddy={assignBuddy}
        currentAccountId={accountId}
        allCustomBubbles={customBubbles}
        onAssigned={(updatedBuddies, updatedGroups) => {
          setBuddies(updatedBuddies);
          setCustomBubbles(updatedGroups);
        }}
        onOpenCreateBubble={() => setIsCreateModalOpen(true)}
      />

      {/* 9. Inspect Costume / Outfit Details Modal */}
      {inspectBuddy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-amber-300" />
                <h3 className="font-fredoka text-lg font-bold">
                  {inspectBuddy.preferredName || inspectBuddy.name}&apos;s Mascot
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectBuddy(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 shadow-inner flex items-center justify-center">
                <BuddyCanvas
                  config={loadMemberBuddyConfig(inspectBuddy.accountId, inspectBuddy.buddyAvatar)}
                  size={180}
                  showShadow
                />
              </div>

              <div>
                <h4 className="font-fredoka text-xl font-bold text-stone-900">
                  {inspectBuddy.preferredName || inspectBuddy.name}
                </h4>
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  {inspectBuddy.levelBadge || '🌱'} Level {inspectBuddy.level || 1}
                  {inspectBuddy.levelTitle &&
                    inspectBuddy.levelTitle.trim().toLowerCase() !== `level ${inspectBuddy.level}` && (
                      <span> • {inspectBuddy.levelTitle}</span>
                    )}
                </p>
              </div>

              {inspectBuddy.interests && inspectBuddy.interests.length > 0 && (
                <div className="w-full text-left bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs">
                  <span className="font-bold text-stone-700 block mb-1">Interests:</span>
                  <div className="flex flex-wrap gap-1">
                    {inspectBuddy.interests.map((interest) => (
                      <span
                        key={interest}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white border border-stone-200 text-stone-700"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setInspectBuddy(null)}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
