'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  QrCode,
  Heart,
  Tag,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { BuddyBubbleMember, MemberProfile } from '@/lib/types';
import { addBuddyToBubble } from '@/lib/bubble';
import { BuddyAvatarBadge } from '@/components/buddy/BuddyAvatarBadge';

interface AddBuddyConfirmationModalProps {
  buddy: BuddyBubbleMember | null;
  currentMember: MemberProfile | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  onAddedSuccess: (buddy: BuddyBubbleMember) => void;
  onOpenMyPass: () => void;
}

export const AddBuddyConfirmationModal: React.FC<AddBuddyConfirmationModalProps> = ({
  buddy,
  currentMember,
  isOpen,
  onClose,
  onAddedSuccess,
  onOpenMyPass,
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !buddy) return null;

  const currentAccountId = currentMember?.accountId || currentMember?.tapCard || '';
  const myInterests = (currentMember?.interests || []).map((i) => i.toLowerCase());
  const buddyInterests = buddy.interests || [];

  // Find shared maker interests
  const sharedInterests = buddyInterests.filter((interest) =>
    myInterests.includes(interest.toLowerCase())
  );

  const handleConfirmAdd = () => {
    if (!currentAccountId) {
      setErrorMsg('Please log in to add friends to your Buddy Bubble.');
      return;
    }

    const res = addBuddyToBubble(currentAccountId, buddy);
    if (res.success) {
      setIsAdded(true);
      onAddedSuccess(buddy);
    } else {
      setErrorMsg(res.error || 'Could not add friend to your Bubble.');
    }
  };

  const handleDone = () => {
    setIsAdded(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Playful Header */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30">
              <Sparkles className="w-5 h-5 text-amber-200 animate-spin" />
            </div>
            <div>
              <h3 className="font-fredoka text-xl font-bold leading-tight">
                {isAdded ? 'Added to Bubble!' : 'Maker Encounter!'}
              </h3>
              <p className="text-white/80 text-xs font-mono">
                {isAdded ? 'New connection saved' : 'Add to your Buddy Bubble'}
              </p>
            </div>
          </div>
          <button
            onClick={handleDone}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          {/* Avatar Showcase */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 blur-md opacity-40 animate-pulse" />
            <BuddyAvatarBadge
              accountId={buddy.accountId}
              avatarJson={buddy.buddyAvatar}
              size={100}
              borderClassName="border-4 border-amber-300 bg-amber-50 shadow-md relative"
            />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h4 className="font-fredoka text-2xl font-bold text-stone-900">
                {buddy.preferredName || buddy.name}
              </h4>
              {buddy.pronouns && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                  {buddy.pronouns}
                </span>
              )}
            </div>
            <div className="text-xs text-stone-500 font-mono mt-1">
              <span>{buddy.levelBadge || '🌱'} Level {buddy.level || 1}</span>
              <span className="mx-1.5">•</span>
              <span>{buddy.levelTitle || 'Maker'}</span>
            </div>
          </div>

          {/* Shared Interests Highlights */}
          {sharedInterests.length > 0 && (
            <div className="w-full p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-left">
              <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold mb-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>Both nerdy for:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sharedInterests.map((interest) => (
                  <span
                    key={interest}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-200/70 text-amber-900 border border-amber-300"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="w-full text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {errorMsg}
            </div>
          )}

          {!isAdded ? (
            <div className="w-full space-y-2 pt-2">
              <button
                onClick={handleConfirmAdd}
                className="w-full py-3 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md flex items-center justify-center gap-2 transform active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Add to My Bubble 🫧</span>
              </button>
              <button
                onClick={handleDone}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          ) : (
            <div className="w-full space-y-3 pt-2 animate-in fade-in">
              <div className="flex items-center justify-center gap-2 text-emerald-700 bg-emerald-50 py-2.5 px-3 rounded-2xl border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{buddy.preferredName || buddy.name} is now in your Bubble!</span>
              </div>

              {/* One-tap add back shortcut */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 text-xs space-y-2">
                <p>
                  Want <strong>{buddy.preferredName || buddy.name}</strong> to add you back to their Bubble?
                </p>
                <button
                  onClick={() => {
                    handleDone();
                    onOpenMyPass();
                  }}
                  className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-300" />
                  <span>Show My Buddy Pass</span>
                </button>
              </div>

              <button
                onClick={handleDone}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
