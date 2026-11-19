'use client';

import React, { useState } from 'react';
import { X, UserPlus, Check, Search } from 'lucide-react';
import { BuddyBubbleMember, CustomBubbleGroup } from '@/lib/types';
import { addMembersToCustomBubble } from '@/lib/bubble';
import { BuddyAvatarBadge } from '@/components/buddy/BuddyAvatarBadge';

interface AddMembersFromBigBubbleModalProps {
  isOpen: boolean;
  onClose: () => void;
  bubble: CustomBubbleGroup | null;
  adminAccountId: string;
  allBuddies: BuddyBubbleMember[];
  onMembersAdded: (updatedBubble: CustomBubbleGroup) => void;
}

export const AddMembersFromBigBubbleModal: React.FC<AddMembersFromBigBubbleModalProps> = ({
  isOpen,
  onClose,
  bubble,
  adminAccountId,
  allBuddies,
  onMembersAdded,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !bubble) return null;

  // Filter out buddies already in this bubble
  const availableBuddies = allBuddies.filter(
    (b) => !bubble.memberAccountIds.includes(b.accountId)
  );

  const filtered = availableBuddies.filter((b) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (b.preferredName || b.name).toLowerCase().includes(q) ||
      (b.interests || []).join(' ').toLowerCase().includes(q)
    );
  });

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    if (selectedIds.length === 0) return;
    setError(null);

    const res = addMembersToCustomBubble(bubble.id, selectedIds, adminAccountId);
    if (res.success && res.bubble) {
      onMembersAdded(res.bubble);
      setSelectedIds([]);
      onClose();
    } else {
      setError(res.error || 'Failed to add members.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{bubble.icon}</span>
            <div>
              <h3 className="font-fredoka text-xl font-bold">Add to {bubble.name}</h3>
              <p className="text-[11px] text-stone-300">
                Select friends from your Big Bubble to add to this bubble.
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

        {/* Content */}
        <div className="p-5 space-y-4 flex-1 flex flex-col min-h-0">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {error}
            </div>
          )}

          {availableBuddies.length > 3 && (
            <div className="flex items-center gap-2 bg-stone-100 p-2 rounded-xl border border-stone-200">
              <Search className="w-4 h-4 text-stone-400 ml-1" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search buddies..."
                className="w-full text-xs bg-transparent border-none focus:outline-none text-stone-800"
              />
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[140px]">
            {filtered.length > 0 ? (
              filtered.map((buddy) => {
                const isSelected = selectedIds.includes(buddy.accountId);
                return (
                  <button
                    key={buddy.accountId}
                    type="button"
                    onClick={() => handleToggle(buddy.accountId)}
                    className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between transition-colors border cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-white border-stone-200/80 hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BuddyAvatarBadge
                        accountId={buddy.accountId}
                        avatarJson={buddy.buddyAvatar}
                        size={36}
                        borderClassName="border border-stone-200 bg-amber-50"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {buddy.preferredName || buddy.name}
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          {buddy.levelBadge || '🌱'} Level {buddy.level || 1}
                        </div>
                      </div>
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
              })
            ) : availableBuddies.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500 bg-stone-50 rounded-2xl border border-stone-200">
                All of your Big Bubble friends are already in this bubble!
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-stone-500">
                No buddies matched your search.
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex items-center gap-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={selectedIds.length === 0}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#344ea2] hover:bg-[#2a3f85] disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
