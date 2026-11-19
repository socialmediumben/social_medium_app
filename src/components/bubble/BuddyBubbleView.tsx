'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  QrCode,
  UserPlus,
  Sparkles,
  Heart,
  Search,
  MoreVertical,
  Trash2,
  Eye,
  Check,
  Radio,
  Clock,
  ShieldAlert,
  Smile,
  X,
} from 'lucide-react';
import { BuddyBubbleMember, MemberProfile, getGreetingName } from '@/lib/types';
import {
  loadBuddyBubble,
  removeBuddyFromBubble,
  cheerBuddyInBubble,
  refreshBuddyProfiles,
} from '@/lib/bubble';
import { BuddyAvatarBadge } from '@/components/buddy/BuddyAvatarBadge';
import { BuddyCanvas } from '@/components/buddy/BuddyCanvas';
import { loadMemberBuddyConfig } from '@/lib/buddy';
import { BuddyPassModal } from './BuddyPassModal';
import { AddBuddyScannerModal } from './AddBuddyScannerModal';
import { AddBuddyConfirmationModal } from './AddBuddyConfirmationModal';

interface BuddyBubbleViewProps {
  member: MemberProfile | null | undefined;
  initialAddBuddy?: BuddyBubbleMember | null;
}

export const BuddyBubbleView: React.FC<BuddyBubbleViewProps> = ({
  member,
  initialAddBuddy = null,
}) => {
  const accountId = member?.accountId || member?.tapCard || '';
  const [buddies, setBuddies] = useState<BuddyBubbleMember[]>(() => loadBuddyBubble(accountId));
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [confirmBuddy, setConfirmBuddy] = useState<BuddyBubbleMember | null>(initialAddBuddy);
  const [inspectBuddy, setInspectBuddy] = useState<BuddyBubbleMember | null>(null);

  // Animated cheer tracking: buddyAccountId -> timestamp
  const [activeCheerId, setActiveCheerId] = useState<string | null>(null);

  // Sync state with local updates & Neon refresh
  useEffect(() => {
    if (!accountId) return;
    const initialList = loadBuddyBubble(accountId);
    setBuddies(initialList);

    // Background refresh
    refreshBuddyProfiles(accountId, initialList).then((refreshed) => {
      setBuddies(refreshed);
    });

    const handleBubbleUpdate = (e: any) => {
      if (e?.detail?.buddies) {
        setBuddies(e.detail.buddies);
      } else {
        setBuddies(loadBuddyBubble(accountId));
      }
    };

    window.addEventListener('sm_buddy_bubble_updated', handleBubbleUpdate);
    return () => window.removeEventListener('sm_buddy_bubble_updated', handleBubbleUpdate);
  }, [accountId]);

  // If initialAddBuddy is passed via deep link, open confirmation modal
  useEffect(() => {
    if (initialAddBuddy) {
      setConfirmBuddy(initialAddBuddy);
    }
  }, [initialAddBuddy]);

  const myInterests = useMemo(() => {
    return (member?.interests || []).map((i) => i.toLowerCase());
  }, [member?.interests]);

  const filteredBuddies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return buddies;
    return buddies.filter((b) => {
      const name = (b.preferredName || b.name).toLowerCase();
      const title = (b.levelTitle || '').toLowerCase();
      const interests = (b.interests || []).join(' ').toLowerCase();
      return name.includes(q) || title.includes(q) || interests.includes(q);
    });
  }, [buddies, searchQuery]);

  const handleCheer = (buddyId: string) => {
    if (!accountId) return;
    cheerBuddyInBubble(accountId, buddyId);
    setActiveCheerId(buddyId);
    setTimeout(() => setActiveCheerId(null), 1800);
  };

  const handleRemove = (buddy: BuddyBubbleMember) => {
    const buddyName = buddy.preferredName || buddy.name;
    if (confirm(`Remove ${buddyName} from your Buddy Bubble?`)) {
      if (accountId) {
        const updated = removeBuddyFromBubble(accountId, buddy.accountId);
        setBuddies(updated);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-12 w-64 h-24 bg-amber-300/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-mono font-bold text-amber-200 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Social Medium Maker Network</span>
            </div>
            <h2 className="font-fredoka text-3xl sm:text-4xl font-bold tracking-tight">
              Buddy Bubble
            </h2>
            <p className="text-white/90 text-sm leading-relaxed">
              Add friends you meet at the makerspace by tapping their <strong>Buddy Band</strong> or scanning their <strong>Buddy Pass QR code</strong>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setIsPassModalOpen(true)}
              className="py-3 px-5 rounded-2xl font-bold text-sm bg-white text-stone-900 hover:bg-stone-100 shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <QrCode className="w-4 h-4 text-[#344ea2]" />
              <span>My Buddy Pass</span>
            </button>
            <button
              onClick={() => setIsScannerModalOpen(true)}
              className="py-3 px-5 rounded-2xl font-bold text-sm bg-stone-900/90 hover:bg-stone-900 text-white border border-white/20 shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Add a Buddy</span>
            </button>
          </div>
        </div>

        {/* Stats Pill Footer */}
        <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/80 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse" />
            <span>
              <strong>{buddies.length}</strong> {buddies.length === 1 ? 'Buddy' : 'Buddies'} in your Bubble
            </span>
          </div>
          <div className="hidden sm:block">
            <span>Proximity Handshake • No Public Directory</span>
          </div>
        </div>
      </div>

      {/* Search / Filter Bar (if 2 or more buddies) */}
      {buddies.length >= 2 && (
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-stone-200 shadow-xs">
          <Search className="w-4 h-4 text-stone-400 ml-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search buddies by name, level, or interests..."
            className="w-full text-xs sm:text-sm bg-transparent border-none focus:outline-none text-stone-800 placeholder-stone-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full text-stone-400 hover:text-stone-600 mr-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Grid of Buddy Cards */}
      {filteredBuddies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuddies.map((buddy) => {
            const isCheering = activeCheerId === buddy.accountId;
            const buddyInterests = buddy.interests || [];
            const shared = buddyInterests.filter((i) => myInterests.includes(i.toLowerCase()));

            return (
              <div
                key={buddy.accountId}
                className="relative bg-white rounded-3xl p-5 border border-stone-200/90 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Floating bubble background decoration */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-teal-50 rounded-full opacity-60 pointer-events-none group-hover:scale-125 transition-transform" />

                <div>
                  {/* Card Header: Avatar & Name */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <BuddyAvatarBadge
                          accountId={buddy.accountId}
                          avatarJson={buddy.buddyAvatar}
                          size={58}
                          borderClassName="border-2 border-amber-300 bg-amber-50 shadow-xs"
                        />
                        {isCheering && (
                          <div className="absolute -top-2 -right-2 text-xl animate-bounce">
                            🫧
                          </div>
                        )}
                      </div>

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
                          <span>•</span>
                          <span className="truncate">{buddy.levelTitle || 'Maker'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick options menu */}
                    <button
                      onClick={() => handleRemove(buddy)}
                      className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                      title="Remove from Buddy Bubble"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

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

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setInspectBuddy(buddy)}
                    className="py-2 px-3 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-stone-500" />
                    <span>View Outfit</span>
                  </button>

                  <button
                    onClick={() => handleCheer(buddy.accountId)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isCheering
                        ? 'bg-amber-400 text-amber-950 scale-105 shadow-sm'
                        : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>{isCheering ? 'Popped! 🫧' : 'Blow Bubble 🫧'}</span>
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
            🫧
          </div>

          <div className="max-w-md space-y-1">
            <h3 className="font-fredoka text-2xl font-bold text-stone-900">
              Your Bubble is Ready for Friends!
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm">
              Connect with fellow makers in person! Tap your phone against their Buddy Band or scan their personal Buddy Pass QR code.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => setIsPassModalOpen(true)}
              className="w-full sm:w-auto py-2.5 px-5 rounded-2xl font-bold text-xs sm:text-sm bg-stone-900 hover:bg-stone-800 text-white shadow-xs flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4 text-amber-300" />
              <span>Show My Buddy Pass</span>
            </button>
            <button
              onClick={() => setIsScannerModalOpen(true)}
              className="w-full sm:w-auto py-2.5 px-5 rounded-2xl font-bold text-xs sm:text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add a Friend</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal 1: Share My Buddy Pass */}
      <BuddyPassModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        member={member}
      />

      {/* Modal 2: Add Buddy Scanner */}
      <AddBuddyScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onBuddyFound={(buddy) => {
          setIsScannerModalOpen(false);
          setConfirmBuddy(buddy);
        }}
      />

      {/* Modal 3: Add Buddy Confirmation Dialog */}
      <AddBuddyConfirmationModal
        buddy={confirmBuddy}
        currentMember={member}
        isOpen={!!confirmBuddy}
        onClose={() => setConfirmBuddy(null)}
        onAddedSuccess={(newBuddy) => {
          setBuddies((prev) => [newBuddy, ...prev.filter((b) => b.accountId !== newBuddy.accountId)]);
        }}
        onOpenMyPass={() => setIsPassModalOpen(true)}
      />

      {/* Modal 4: Inspect Costume / Outfit Details */}
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
                onClick={() => setInspectBuddy(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
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
                  {inspectBuddy.levelBadge || '🌱'} Level {inspectBuddy.level || 1} • {inspectBuddy.levelTitle || 'Maker'}
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
                onClick={() => setInspectBuddy(null)}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-stone-900 text-white hover:bg-stone-800 transition-colors"
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
