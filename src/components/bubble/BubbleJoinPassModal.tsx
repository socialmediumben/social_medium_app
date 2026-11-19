'use client';

import React, { useState } from 'react';
import { X, QrCode, Copy, Check, Radio, Sparkles } from 'lucide-react';
import { CustomBubbleGroup, MemberProfile } from '@/lib/types';
import { generateBubbleJoinUrl, generateBubbleJoinQrCodeUrl } from '@/lib/bubble';

interface BubbleJoinPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  bubble: CustomBubbleGroup | null;
  adminMember: MemberProfile | null | undefined;
}

export const BubbleJoinPassModal: React.FC<BubbleJoinPassModalProps> = ({
  isOpen,
  onClose,
  bubble,
  adminMember,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !bubble) return null;

  const joinUrl = generateBubbleJoinUrl(bubble, adminMember);
  const qrCodeUrl = generateBubbleJoinQrCodeUrl(joinUrl, 320);

  const handleCopy = () => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{bubble.icon}</span>
            <div>
              <h3 className="font-fredoka text-lg font-bold">{bubble.name} Pass</h3>
              <p className="text-[10px] text-stone-300">Invite fellow makers to join this bubble</p>
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
            <Radio className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            <span>Admin Join Pass • Ready to Scan</span>
          </div>

          {/* Clean Unobstructed QR Code Container */}
          <div className="p-3 bg-white rounded-3xl border-2 border-stone-800 shadow-md flex items-center justify-center">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt={`${bubble.name} Join QR Code`}
                className="w-56 h-56 object-contain rounded-xl"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center bg-stone-100 rounded-xl text-stone-400 text-xs">
                Generating pass...
              </div>
            )}
          </div>

          <p className="text-stone-600 text-xs max-w-xs leading-relaxed">
            Have a friend scan this QR pass with their phone camera to instantly join <strong>{bubble.name}</strong>.
          </p>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopy}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <span>Invite Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-stone-500" />
                <span>Copy Invite Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
