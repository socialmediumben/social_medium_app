'use client';

import React, { useState } from 'react';
import { X, Sparkles, Plus, Check, Users } from 'lucide-react';
import { BuddyBubbleMember, CustomBubbleGroup } from '@/lib/types';
import { createCustomBubble } from '@/lib/bubble';
import { BuddyAvatarBadge } from '@/components/buddy/BuddyAvatarBadge';

interface CreateBubbleModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorAccountId: string;
  allBuddies: BuddyBubbleMember[];
  onCreated: (bubble: CustomBubbleGroup) => void;
}

const POPULAR_EMOJIS = [
  '🐉', '🧥', '🤖', '🧶', '🎨', '🚀', 
  '🔨', '☕', '🎮', '⚡', '🪵', '📷', 
  '🧵', '🪄', '🌿', '🧪', '👾', '✨'
];

export const CreateBubbleModal: React.FC<CreateBubbleModalProps> = ({
  isOpen,
  onClose,
  creatorAccountId,
  allBuddies,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🐉');
  const [selectedBuddyIds, setSelectedBuddyIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleBuddy = (id: string) => {
    setSelectedBuddyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please enter a name for your bubble.');
      return;
    }

    try {
      const newBubble = createCustomBubble(
        creatorAccountId,
        cleanName,
        selectedEmoji,
        description.trim(),
        selectedBuddyIds
      );
      onCreated(newBubble);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create bubble.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{selectedEmoji}</span>
            <div>
              <h3 className="font-fredoka text-xl font-bold">Create New Bubble</h3>
              <p className="text-[11px] text-stone-300">
                You will be the primary Admin of this bubble.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Bubble Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Bubble Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. D&D Club, Denim Jacket Squad, Robotics"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3bc0cd] text-stone-900"
              maxLength={40}
              autoFocus
            />
          </div>

          {/* Emoji Icon Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Bubble Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {POPULAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-xl p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                    selectedEmoji === emoji
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300 scale-105 shadow-xs'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Description / Motto <span className="text-stone-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Roll for initiative every Thursday night in the lounge!"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#3bc0cd] text-stone-900 resize-none"
              rows={2}
              maxLength={120}
            />
          </div>

          {/* Add Members from Big Bubble */}
          {allBuddies.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Invite from your Big Bubble
                </label>
                <span className="text-[11px] font-mono text-stone-500">
                  {selectedBuddyIds.length} selected
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 border border-stone-200 rounded-2xl p-2 bg-stone-50">
                {allBuddies.map((buddy) => {
                  const isSelected = selectedBuddyIds.includes(buddy.accountId);
                  return (
                    <button
                      key={buddy.accountId}
                      type="button"
                      onClick={() => handleToggleBuddy(buddy.accountId)}
                      className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border border-emerald-300 text-emerald-950'
                          : 'bg-white border border-stone-200 hover:bg-stone-100 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <BuddyAvatarBadge
                          accountId={buddy.accountId}
                          avatarJson={buddy.buddyAvatar}
                          size={28}
                          borderClassName="border border-stone-200"
                        />
                        <span className="text-xs font-bold truncate">
                          {buddy.preferredName || buddy.name}
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-stone-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#344ea2] hover:bg-[#2a3f85] text-white shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Bubble</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
