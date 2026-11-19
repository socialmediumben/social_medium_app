'use client';

import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, Users } from 'lucide-react';
import { BubbleJoinInvite, CustomBubbleGroup, MemberProfile } from '@/lib/types';
import { joinCustomBubbleFromInvite } from '@/lib/bubble';

interface JoinBubbleConfirmationModalProps {
  invite: BubbleJoinInvite | null;
  currentMember: MemberProfile | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  onJoinedSuccess: (joinedBubble: CustomBubbleGroup) => void;
}

export const JoinBubbleConfirmationModal: React.FC<JoinBubbleConfirmationModalProps> = ({
  invite,
  currentMember,
  isOpen,
  onClose,
  onJoinedSuccess,
}) => {
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !invite) return null;

  const handleJoin = async () => {
    const accountId = currentMember?.accountId || currentMember?.tapCard || '';
    if (!accountId) {
      setError('Please log in with your Tap Card to join this bubble.');
      return;
    }

    setIsJoining(true);
    setError(null);

    const res = await joinCustomBubbleFromInvite(accountId, invite, currentMember || null);
    setIsJoining(false);

    if (res.success && res.bubble) {
      onJoinedSuccess(res.bubble);
      onClose();
    } else {
      setError(res.error || 'Failed to join bubble.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{invite.icon}</span>
            <div>
              <h3 className="font-fredoka text-lg font-bold">Bubble Invitation</h3>
              <p className="text-[10px] text-stone-300">Join a maker circle</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center text-4xl shadow-sm">
            {invite.icon}
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Invited by {invite.inviterName}
            </span>
            <h4 className="font-fredoka text-2xl font-bold text-stone-900 mt-2">
              {invite.name}
            </h4>
            {invite.description && (
              <p className="text-xs text-stone-600 mt-1 max-w-xs">{invite.description}</p>
            )}
          </div>

          <div className="w-full p-3 bg-stone-50 rounded-2xl border border-stone-200 text-[11px] text-stone-600 space-y-1 text-left">
            <div className="flex items-center gap-1.5 font-bold text-stone-800">
              <Users className="w-3.5 h-3.5 text-[#344ea2]" />
              <span>What happens when you join:</span>
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-stone-500">
              <li>{invite.name} will be added to your custom bubbles.</li>
              <li>You will see fellow circle members in your bubble list.</li>
              <li>{invite.inviterName} will also be added to your Big Bubble.</li>
            </ul>
          </div>

          {error && (
            <div className="w-full p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isJoining}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={handleJoin}
              disabled={isJoining}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isJoining ? 'Joining...' : 'Join Bubble'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
