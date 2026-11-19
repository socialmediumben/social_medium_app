'use client';

import React, { useState } from 'react';
import {
  X,
  Settings,
  Shield,
  Trash2,
  LogOut,
  UserCheck,
  Save,
  AlertTriangle,
  UserX,
} from 'lucide-react';
import { CustomBubbleGroup, BuddyBubbleMember, MemberProfile } from '@/lib/types';
import {
  updateCustomBubble,
  deleteCustomBubble,
  removeMemberFromCustomBubble,
  promoteBubbleAdmin,
} from '@/lib/bubble';
import { BuddyAvatarBadge } from '@/components/buddy/BuddyAvatarBadge';

interface BubbleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bubble: CustomBubbleGroup | null;
  currentAccountId: string;
  allBuddies: BuddyBubbleMember[];
  onUpdated: (bubble: CustomBubbleGroup) => void;
  onDeleted: (bubbleId: string) => void;
  onLeft: (bubbleId: string) => void;
}

const POPULAR_EMOJIS = [
  '🐉', '🧥', '🤖', '🧶', '🎨', '🚀', 
  '🔨', '☕', '🎮', '⚡', '🪵', '📷', 
  '🧵', '🪄', '🌿', '🧪', '👾', '✨'
];

export const BubbleSettingsModal: React.FC<BubbleSettingsModalProps> = ({
  isOpen,
  onClose,
  bubble,
  currentAccountId,
  allBuddies,
  onUpdated,
  onDeleted,
  onLeft,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'danger'>('info');
  const [name, setName] = useState(bubble?.name || '');
  const [description, setDescription] = useState(bubble?.description || '');
  const [icon, setIcon] = useState(bubble?.icon || '🫧');
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen || !bubble) return null;

  const isAdmin =
    bubble.adminAccountIds.some(
      (id) => id.toLowerCase() === currentAccountId.toLowerCase()
    ) || bubble.creatorAccountId.toLowerCase() === currentAccountId.toLowerCase();

  // Find buddy details for bubble members
  const memberBuddies = bubble.memberAccountIds.map((id) => {
    const found = allBuddies.find((b) => b.accountId.toLowerCase() === id.toLowerCase());
    if (found) return found;
    return {
      accountId: id,
      name: id === currentAccountId ? 'You' : `Member (${id.slice(0, 6)})`,
      level: 1,
      levelBadge: '🌱',
      levelTitle: 'Maker',
      addedAt: '',
    } as BuddyBubbleMember;
  });

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSaving(true);
    setMsg(null);

    const res = updateCustomBubble(
      {
        ...bubble,
        name: name.trim() || bubble.name,
        description: description.trim(),
        icon,
      },
      currentAccountId
    );

    setIsSaving(false);
    if (res.success && res.bubble) {
      onUpdated(res.bubble);
      setMsg({ text: 'Bubble information updated!', isError: false });
    } else {
      setMsg({ text: res.error || 'Failed to update bubble.', isError: true });
    }
  };

  const handlePromoteAdmin = (targetId: string) => {
    if (!isAdmin) return;
    setMsg(null);
    const res = promoteBubbleAdmin(bubble.id, targetId, currentAccountId);
    if (res.success && res.bubble) {
      onUpdated(res.bubble);
      setMsg({ text: 'Promoted member to Admin!', isError: false });
    } else {
      setMsg({ text: res.error || 'Failed to promote member.', isError: true });
    }
  };

  const handleRemoveMember = (targetId: string) => {
    if (!isAdmin) return;
    const isSelf = targetId === currentAccountId;
    if (
      confirm(
        isSelf
          ? 'Are you sure you want to leave this bubble?'
          : 'Remove this member from the bubble?'
      )
    ) {
      const res = removeMemberFromCustomBubble(bubble.id, targetId, currentAccountId);
      if (res.success && res.bubble) {
        if (isSelf) {
          onLeft(bubble.id);
          onClose();
        } else {
          onUpdated(res.bubble);
          setMsg({ text: 'Member removed from bubble.', isError: false });
        }
      } else {
        setMsg({ text: res.error || 'Failed to remove member.', isError: true });
      }
    }
  };

  const handleDelete = () => {
    if (!isAdmin) return;
    if (confirm(`Permanently delete the "${bubble.name}" bubble for all members?`)) {
      const res = deleteCustomBubble(bubble.id, currentAccountId);
      if (res.success) {
        onDeleted(bubble.id);
        onClose();
      } else {
        setMsg({ text: res.error || 'Failed to delete bubble.', isError: true });
      }
    }
  };

  const handleLeave = () => {
    if (confirm(`Leave the "${bubble.name}" bubble?`)) {
      const res = removeMemberFromCustomBubble(bubble.id, currentAccountId, currentAccountId);
      if (res.success) {
        onLeft(bubble.id);
        onClose();
      } else {
        setMsg({ text: res.error || 'Failed to leave bubble.', isError: true });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{bubble.icon}</span>
            <div>
              <h3 className="font-fredoka text-lg font-bold">{bubble.name} Settings</h3>
              <p className="text-[10px] text-stone-300">
                {isAdmin ? '👑 You are an Administrator' : 'Member view'}
              </p>
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

        {/* Sub-tab switcher */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'info'
                ? 'border-[#344ea2] text-[#344ea2]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'members'
                ? 'border-[#344ea2] text-[#344ea2]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>Members</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700 text-[10px]">
              {bubble.memberAccountIds.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'danger'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-stone-500 hover:text-rose-600'
            }`}
          >
            {isAdmin ? 'Manage / Delete' : 'Leave'}
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {msg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                msg.isError
                  ? 'bg-rose-50 border border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}
            >
              {msg.text}
            </div>
          )}

          {activeTab === 'info' && (
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Bubble Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#3bc0cd] disabled:bg-stone-50"
                  maxLength={40}
                />
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Bubble Icon
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {POPULAR_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setIcon(emoji)}
                        className={`text-xl p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                          icon === emoji
                            ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300 scale-105 shadow-xs'
                            : 'border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Description / Motto
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#3bc0cd] disabled:bg-stone-50 resize-none"
                  rows={2}
                  maxLength={120}
                />
              </div>

              {isAdmin && (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#344ea2] hover:bg-[#2a3f85] text-white shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              )}
            </form>
          )}

          {activeTab === 'members' && (
            <div className="space-y-2">
              <div className="text-xs text-stone-500 mb-2">
                {isAdmin
                  ? 'As an Admin, you can promote other members to co-admins or remove members.'
                  : 'Fellow makers in this bubble:'}
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {memberBuddies.map((buddy) => {
                  const isBuddyAdmin = bubble.adminAccountIds.some(
                    (id) => id.toLowerCase() === buddy.accountId.toLowerCase()
                  );
                  const isCreator =
                    bubble.creatorAccountId.toLowerCase() === buddy.accountId.toLowerCase();
                  const isSelf =
                    buddy.accountId.toLowerCase() === currentAccountId.toLowerCase();

                  return (
                    <div
                      key={buddy.accountId}
                      className="p-2.5 rounded-2xl border border-stone-200 bg-white flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <BuddyAvatarBadge
                          accountId={buddy.accountId}
                          avatarJson={buddy.buddyAvatar}
                          size={34}
                          borderClassName="border border-stone-200"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-stone-900 truncate">
                              {buddy.preferredName || buddy.name}
                            </span>
                            {isCreator && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                Creator
                              </span>
                            )}
                            {isBuddyAdmin && !isCreator && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-0.5">
                                <Shield className="w-2.5 h-2.5" />
                                Admin
                              </span>
                            )}
                            {isSelf && (
                              <span className="text-[10px] font-semibold text-stone-400">
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Admin actions for this member */}
                      {isAdmin && !isSelf && (
                        <div className="flex items-center gap-1 shrink-0">
                          {!isBuddyAdmin && (
                            <button
                              type="button"
                              onClick={() => handlePromoteAdmin(buddy.accountId)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                              title="Promote to Co-Admin"
                            >
                              Make Admin
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(buddy.accountId)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove from bubble"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                  <LogOut className="w-4 h-4 text-stone-600" />
                  <span>Leave this Bubble</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  You will no longer see updates from {bubble.name}. You can be re-invited by an
                  Admin anytime.
                </p>
                <button
                  type="button"
                  onClick={handleLeave}
                  className="py-2 px-3.5 rounded-xl text-xs font-bold bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors cursor-pointer"
                >
                  Leave Bubble
                </button>
              </div>

              {isAdmin && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Delete Bubble (Admin Only)</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    Permanently dissolves {bubble.name} for all members. This cannot be undone.
                  </p>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="py-2 px-3.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Bubble</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
