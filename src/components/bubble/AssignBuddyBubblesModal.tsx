'use client';

import React, { useState } from 'react';
import { X, Check, Star, Users, Plus } from 'lucide-react';
import { BuddyBubbleMember, CustomBubbleGroup } from '@/lib/types';
import { assignBuddyToBubbles } from '@/lib/bubble';
import { BuddyAvatarBadge } from '@/components/buddy/BuddyAvatarBadge';

interface AssignBuddyBubblesModalProps {
  isOpen: boolean;
  onClose: () => void;
  buddy: BuddyBubbleMember | null;
  currentAccountId: string;
  allCustomBubbles: CustomBubbleGroup[];
  onAssigned: (buddies: BuddyBubbleMember[], bubbles: CustomBubbleGroup[]) => void;
  onOpenCreateBubble?: () => void;
}

export const AssignBuddyBubblesModal: React.FC<AssignBuddyBubblesModalProps> = ({
  isOpen,
  onClose,
  buddy,
  currentAccountId,
  allCustomBubbles,
  onAssigned,
  onOpenCreateBubble,
}) => {
  const [selectedBubbleIds, setSelectedBubbleIds] = useState<string[]>(() => {
    if (!buddy) return [];
    // Combine existing buddy.bubbleIds and bubbles that have buddy in memberAccountIds
    const fromBuddy = buddy.bubbleIds || [];
    const fromGroups = allCustomBubbles
      .filter((g) => g.memberAccountIds.some((id) => id.toLowerCase() === buddy.accountId.toLowerCase()))
      .map((g) => g.id);
    return Array.from(new Set([...fromBuddy, ...fromGroups]));
  });

  const [isFavorite, setIsFavorite] = useState<boolean>(() => !!buddy?.isFavorite);

  if (!isOpen || !buddy) return null;

  const handleToggleBubble = (bubbleId: string) => {
    setSelectedBubbleIds((prev) =>
      prev.includes(bubbleId) ? prev.filter((id) => id !== bubbleId) : [...prev, bubbleId]
    );
  };

  const handleSave = () => {
    const res = assignBuddyToBubbles(
      currentAccountId,
      buddy.accountId,
      selectedBubbleIds,
      isFavorite
    );
    onAssigned(res.buddies, res.bubbles);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BuddyAvatarBadge
              accountId={buddy.accountId}
              avatarJson={buddy.buddyAvatar}
              size={36}
              borderClassName="border-2 border-amber-300 bg-amber-50 shadow-xs"
            />
            <div>
              <h3 className="font-fredoka text-base font-bold text-white">
                Assign {buddy.preferredName || buddy.name}
              </h3>
              <p className="text-[10px] text-stone-300">Choose which circles this buddy belongs to</p>
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
        <div className="p-5 space-y-4">
          {/* Best Buddies Favorite Toggle */}
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
              isFavorite
                ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-xs'
                : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                  isFavorite ? 'bg-amber-400 text-white' : 'bg-stone-200 text-stone-500'
                }`}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
              </div>
              <div>
                <div className="text-xs font-bold">Best Buddies</div>
                <div className="text-[10px] text-stone-500">Add to your top favorites list</div>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                isFavorite
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'border-stone-300 bg-white'
              }`}
            >
              {isFavorite && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </button>

          {/* Custom Bubbles List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Custom Bubbles
              </label>
              {onOpenCreateBubble && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCreateBubble();
                  }}
                  className="text-[11px] font-bold text-[#344ea2] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {allCustomBubbles.length > 0 ? (
                allCustomBubbles.map((group) => {
                  const isChecked = selectedBubbleIds.includes(group.id);
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => handleToggleBubble(group.id)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-white border-stone-200/80 hover:bg-stone-50 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{group.icon}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{group.name}</div>
                          {group.description && (
                            <div className="text-[10px] text-stone-500 truncate">
                              {group.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-stone-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-stone-200">
                  You haven&apos;t created any custom bubbles yet.
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-xs font-bold border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#344ea2] hover:bg-[#2a3f85] text-white shadow-xs transition-colors cursor-pointer"
            >
              Save Circles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
