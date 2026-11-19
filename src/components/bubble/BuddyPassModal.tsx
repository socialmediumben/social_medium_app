'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Radio,
  Copy,
  Check,
  Sparkles,
  Share2,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { MemberProfile, getGreetingName } from '@/lib/types';
import { generateBuddyPassUrl, generateBuddyPassQrCodeUrl } from '@/lib/bubble';
import { BuddyAvatarBadge } from '@/components/buddy/BuddyAvatarBadge';

interface BuddyPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberProfile | null | undefined;
}

export const BuddyPassModal: React.FC<BuddyPassModalProps> = ({
  isOpen,
  onClose,
  member,
}) => {
  const [copied, setCopied] = useState(false);
  const [isNfcBroadcasting, setIsNfcBroadcasting] = useState(false);
  const [nfcBroadcastStatus, setNfcBroadcastStatus] = useState<string | null>(null);
  const [hasNfc, setHasNfc] = useState(false);

  const passUrl = generateBuddyPassUrl(member);
  const qrCodeUrl = generateBuddyPassQrCodeUrl(passUrl, 360);
  const greetingName = getGreetingName(member);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setHasNfc(true);
    }
  }, []);

  if (!isOpen || !member) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && passUrl) {
        await navigator.clipboard.writeText(passUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (_) {}
  };

  const handleStartNfcBroadcast = async () => {
    if (!('NDEFReader' in window)) {
      setNfcBroadcastStatus('Web NFC write is only available on Android Chrome.');
      return;
    }

    try {
      setIsNfcBroadcasting(true);
      setNfcBroadcastStatus('Ready! Touch the back of your phone to another phone...');
      const NDEFReaderClass = (window as any).NDEFReader;
      const ndef = new NDEFReaderClass();
      await ndef.write({
        records: [
          {
            recordType: 'url',
            data: passUrl,
          },
        ],
      });
      setNfcBroadcastStatus('Successfully beamed your Buddy Pass!');
      setTimeout(() => {
        setIsNfcBroadcasting(false);
        setNfcBroadcastStatus(null);
      }, 3000);
    } catch (err: any) {
      setIsNfcBroadcasting(false);
      setNfcBroadcastStatus(
        err.name === 'NotAllowedError'
          ? 'NFC permission denied.'
          : 'Hold phone steady or try scanning the QR code.'
      );
      setTimeout(() => setNfcBroadcastStatus(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Playful Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-[#344ea2] via-[#2a3f85] to-[#1c2c61] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-inner">
              <QrCode className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-fredoka text-xl font-bold leading-tight">My Buddy Pass</h3>
              <p className="text-white/70 text-xs font-mono">Scan or tap to join my Bubble</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          {/* Member Card Header */}
          <div className="flex items-center gap-3 w-full bg-stone-50 border border-stone-200/80 rounded-2xl p-3 text-left">
            <BuddyAvatarBadge
              accountId={member.accountId}
              avatarJson={member.buddyAvatar}
              size={52}
              borderClassName="border-2 border-amber-300 bg-amber-50 shadow-xs"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-fredoka font-bold text-stone-900 truncate text-base">
                  {greetingName}
                </span>
                {member.pronouns && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-200/70 text-stone-700 shrink-0">
                    {member.pronouns}
                  </span>
                )}
              </div>
              <div className="text-xs text-stone-500 font-mono flex items-center gap-1.5 mt-0.5">
                <span>{member.levelBadge || '🌱'} {member.levelTitle || 'Maker'}</span>
                <span>•</span>
                <span>Band: {member.tapCard || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* QR Code Graphic - completely unobstructed for instant optical scanning */}
          <div className="relative p-4 bg-white rounded-2xl border-2 border-stone-200 shadow-sm flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeUrl}
              alt={`${greetingName}'s Buddy Pass QR Code`}
              className="w-60 h-60 object-contain rounded-lg"
            />
          </div>

          <p className="text-stone-600 text-xs">
            Point any phone camera or tap a phone against your device to connect!
          </p>

          {/* Action Buttons */}
          <div className="w-full space-y-2 pt-1">
            {hasNfc && (
              <button
                onClick={handleStartNfcBroadcast}
                disabled={isNfcBroadcasting}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                  isNfcBroadcasting
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                    : 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs'
                }`}
              >
                <Radio className={`w-4 h-4 ${isNfcBroadcasting ? 'text-amber-600 animate-spin' : 'text-amber-300'}`} />
                <span>{isNfcBroadcasting ? 'Beaming NFC...' : 'Tap Phones (NFC Beam)'}</span>
              </button>
            )}

            {nfcBroadcastStatus && (
              <div className="text-[11px] font-mono px-3 py-1.5 rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
                {nfcBroadcastStatus}
              </div>
            )}

            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-500" />
                  <span>Copy Buddy Pass Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
