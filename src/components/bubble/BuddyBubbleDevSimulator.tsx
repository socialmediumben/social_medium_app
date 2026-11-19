'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Radio,
  QrCode,
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  Check,
  Copy,
  AlertCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  Eye,
  Shield,
  Layers,
} from 'lucide-react';
import { MemberProfile, BuddyBubbleMember } from '@/lib/types';
import {
  loadBuddyBubble,
  saveBuddyBubble,
  addBuddyToBubble,
  generateBuddyPassUrl,
  resolveBuddyFromScanOrUid,
} from '@/lib/bubble';
import { INITIAL_SANDBOX_BUDDIES } from '@/lib/sandbox';
import { BuddyAvatarBadge } from '@/components/buddy/BuddyAvatarBadge';

interface BuddyBubbleDevSimulatorProps {
  member: MemberProfile | null | undefined;
}

export const BuddyBubbleDevSimulator: React.FC<BuddyBubbleDevSimulatorProps> = ({ member }) => {
  const accountId = member?.accountId || member?.tapCard || 'sandbox-demo';
  const [buddies, setBuddies] = useState<BuddyBubbleMember[]>(() => loadBuddyBubble(accountId));
  const [copied, setCopied] = useState(false);
  const [simulatedCardInput, setSimulatedCardInput] = useState('20260001');
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Custom Buddy Form
  const [customName, setCustomName] = useState('');
  const [customPronouns, setCustomPronouns] = useState('They/Them');
  const [customLevel, setCustomLevel] = useState('3');
  const [customTitle, setCustomTitle] = useState('Apprentice Tinkerer');
  const [customInterests, setCustomInterests] = useState('3D Printing, Laser Cutting');

  useEffect(() => {
    setBuddies(loadBuddyBubble(accountId));
    const handleUpdate = () => {
      setBuddies(loadBuddyBubble(accountId));
    };
    window.addEventListener('sm_buddy_bubble_updated', handleUpdate);
    return () => window.removeEventListener('sm_buddy_bubble_updated', handleUpdate);
  }, [accountId]);

  const buddyPassUrl = generateBuddyPassUrl(member);

  const handleCopyLink = () => {
    if (buddyPassUrl) {
      navigator.clipboard.writeText(buddyPassUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSeedSampleBuddies = () => {
    let current = loadBuddyBubble(accountId);
    INITIAL_SANDBOX_BUDDIES.forEach((demoBuddy) => {
      const exists = current.some((b) => b.accountId === demoBuddy.accountId);
      if (!exists) {
        current = [demoBuddy, ...current];
      }
    });
    saveBuddyBubble(accountId, current);
    setBuddies(current);
    setSimulationStatus('Seeded 3 sample buddies into bubble!');
    setTimeout(() => setSimulationStatus(null), 3000);
  };

  const handleClearBubble = () => {
    if (confirm('Clear all buddies from this account bubble?')) {
      saveBuddyBubble(accountId, []);
      setBuddies([]);
      setSimulationStatus('Cleared all buddies from bubble.');
      setTimeout(() => setSimulationStatus(null), 3000);
    }
  };

  const handleSimulateTap = async (cardVal: string) => {
    setIsProcessing(true);
    setSimulationStatus(`Simulating NFC tap with Band "${cardVal}"...`);
    const res = await resolveBuddyFromScanOrUid(cardVal);
    setIsProcessing(false);

    if (res.success && res.member) {
      const addRes = addBuddyToBubble(accountId, res.member, member);
      if (addRes.success) {
        setBuddies(addRes.buddies);
        setSimulationStatus(
          `Successfully connected with ${res.member.preferredName || res.member.name} (${res.member.levelBadge || '🌱'} Level ${res.member.level})!`
        );
      } else {
        setSimulationStatus(addRes.error || 'Failed to add buddy.');
      }
    } else {
      setSimulationStatus(res.error || `Could not find buddy for card "${cardVal}".`);
    }
    setTimeout(() => setSimulationStatus(null), 5000);
  };

  const handleAddCustomBuddy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newBuddy: BuddyBubbleMember = {
      accountId: 'custom_' + Date.now(),
      name: customName.trim(),
      preferredName: customName.trim(),
      pronouns: customPronouns.trim(),
      level: parseInt(customLevel, 10) || 1,
      levelBadge: parseInt(customLevel, 10) >= 5 ? '🚀' : parseInt(customLevel, 10) >= 3 ? '⚙️' : '🌱',
      levelTitle: customTitle.trim() || 'Maker',
      interests: customInterests.split(',').map((s) => s.trim()).filter(Boolean),
      addedAt: new Date().toISOString(),
    };

    const res = addBuddyToBubble(accountId, newBuddy, member);
    if (res.success) {
      setBuddies(res.buddies);
      setCustomName('');
      setSimulationStatus(`Injected custom friend "${newBuddy.name}" into your bubble!`);
      setTimeout(() => setSimulationStatus(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-700 flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-fredoka text-xl font-bold text-stone-900">
                Buddy Bubble Developer Simulator
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                Peer-to-Peer Network
              </span>
            </div>
            <p className="text-stone-600 text-xs mt-0.5">
              Simulate NFC Band taps, test QR deep-link handshakes, and manage sample maker buddies without requiring two physical devices.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/profile?tab=bubble"
            className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Open Profile Bubble Tab</span>
          </Link>
          <button
            onClick={handleSeedSampleBuddies}
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Seed 3 Sample Buddies</span>
          </button>
          <button
            onClick={handleClearBubble}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Bubble</span>
          </button>
        </div>
      </div>

      {simulationStatus && (
        <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{simulationStatus}</span>
        </div>
      )}

      {/* Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: NFC & Proximity Simulator */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-600" />
            <h3 className="font-fredoka text-lg font-bold text-stone-900">
              NFC Band Tap Simulator
            </h3>
          </div>
          <p className="text-xs text-stone-500">
            Click any test buddy to simulate tapping their physical NFC wristband against your phone:
          </p>

          <div className="space-y-2">
            {INITIAL_SANDBOX_BUDDIES.map((demo) => (
              <button
                key={demo.accountId}
                onClick={() => handleSimulateTap(demo.tapCard || demo.accountId)}
                disabled={isProcessing}
                className="w-full p-3 rounded-2xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <BuddyAvatarBadge
                    accountId={demo.accountId}
                    avatarJson={demo.buddyAvatar}
                    size={42}
                  />
                  <div>
                    <div className="font-fredoka font-bold text-sm text-stone-900 group-hover:text-emerald-900">
                      {demo.name}
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono">
                      Band: {demo.tapCard} • {demo.levelBadge} Level {demo.level}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-white border border-stone-200 text-stone-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  Tap Band
                </span>
              </button>
            ))}
          </div>

          {/* Custom Band Tap Input */}
          <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
            <input
              type="text"
              value={simulatedCardInput}
              onChange={(e) => setSimulatedCardInput(e.target.value)}
              placeholder="Enter Band Card ID (e.g. 20260001)"
              className="flex-1 px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={() => handleSimulateTap(simulatedCardInput)}
              disabled={isProcessing || !simulatedCardInput.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Simulate Tap</span>
            </button>
          </div>
        </div>

        {/* Panel 2: Deep Link & QR URL Tester */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#344ea2]" />
            <h3 className="font-fredoka text-lg font-bold text-stone-900">
              Buddy Pass Deep Link & QR Code
            </h3>
          </div>
          <p className="text-xs text-stone-500">
            This URL is encoded inside the member&apos;s Buddy Pass QR code and NFC NDEF beam:
          </p>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
            <div className="text-[11px] font-mono text-stone-700 break-all bg-white p-2.5 rounded-xl border border-stone-200">
              {buddyPassUrl || 'Please log in to generate your Buddy Pass URL.'}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-400" />
                    <span>Copy Deep Link</span>
                  </>
                )}
              </button>
              <Link
                href={buddyPassUrl}
                target="_blank"
                className="py-2 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test Link</span>
              </Link>
            </div>
          </div>

          {/* Inject Custom Friend Form */}
          <div className="pt-2 border-t border-stone-100 space-y-2">
            <h4 className="font-fredoka text-sm font-bold text-stone-800">
              Inject Custom Friend
            </h4>
            <form onSubmit={handleAddCustomBuddy} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Friend Name (e.g. Robin)"
                  className="px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none"
                  required
                />
                <input
                  type="text"
                  value={customPronouns}
                  onChange={(e) => setCustomPronouns(e.target.value)}
                  placeholder="Pronouns (They/Them)"
                  className="px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={customLevel}
                  onChange={(e) => setCustomLevel(e.target.value)}
                  placeholder="Level (1-10)"
                  className="px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none"
                />
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Title (Tinkerer)"
                  className="px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Inject Friend into Active Bubble</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Active Bubble Roster */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-stone-700" />
            <h3 className="font-fredoka text-lg font-bold text-stone-900">
              Active Bubble Roster for {member?.preferredName || member?.name || accountId} ({buddies.length})
            </h3>
          </div>
          <span className="text-xs font-mono text-stone-500">
            Storage: sm_buddy_bubble_{accountId}
          </span>
        </div>

        {buddies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {buddies.map((b) => (
              <div
                key={b.accountId}
                className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BuddyAvatarBadge
                    accountId={b.accountId}
                    avatarJson={b.buddyAvatar}
                    size={40}
                  />
                  <div className="min-w-0">
                    <div className="font-fredoka font-bold text-xs text-stone-900 truncate">
                      {b.preferredName || b.name}
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono truncate">
                      {b.levelBadge || '🌱'} Level {b.level || 1} • {b.pronouns || 'Maker'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-stone-400 font-mono shrink-0">
                  {new Date(b.addedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-stone-500 font-mono border-2 border-dashed border-stone-200 rounded-2xl">
            No buddies currently in this bubble. Use the simulator above to seed or tap cards.
          </div>
        )}
      </div>
    </div>
  );
};
