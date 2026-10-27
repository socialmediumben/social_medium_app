'use client';

import { useState, useEffect } from 'react';
import { DoorOpen, CreditCard, Save, CheckCircle2, Play, Video, Image, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TapCardLogin } from '@/components/TapCardLogin';
import { TapCardMedia, getGreetingName } from '@/lib/types';
import { updatePortalMediaInNeon } from '@/lib/neon';

export default function PortalMediaPage() {
  const { activeCardId, member, updateMember, isLoading } = useAuth();
  const [media, setMedia] = useState<TapCardMedia | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [typeInput, setTypeInput] = useState<'video' | 'image'>('video');
  const [filePathInput, setFilePathInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!activeCardId) return;

    // Check localStorage for saved updates on this specific Tap Card
    try {
      const saved = localStorage.getItem(`sm_portal_media_${activeCardId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setMedia(parsed);
        setTitleInput(parsed.title || '');
        setTypeInput(parsed.type || 'video');
        setFilePathInput(parsed.filePath || '');
        return;
      }
    } catch (_) {}

    const greetingName = getGreetingName(member);

    // Initial clean record for the Tap Card from Neon One
    const initial: TapCardMedia = {
      cardId: activeCardId,
      title: member?.portalMedia ? `${greetingName}'s Portal` : '',
      type: 'video',
      filePath: member?.portalMedia || '',
      updatedAt: member?.portalMedia ? 'Neon One' : ''
    };
    setMedia(initial);
    setTitleInput(initial.title);
    setTypeInput('video');
    setFilePathInput(initial.filePath);
  }, [activeCardId, member]);

  if (isLoading) {
    return <div className="py-20 text-center text-stone-500 font-mono text-sm">Loading...</div>;
  }

  if (!activeCardId || !member) {
    return <TapCardLogin />;
  }

  const greetingName = getGreetingName(member);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    const updated: TapCardMedia = {
      cardId: activeCardId,
      title: titleInput.trim(),
      type: typeInput,
      filePath: filePathInput.trim(),
      updatedAt: new Date().toISOString().split('T')[0]
    };

    // Save to Neon One if accountId is available
    if (member?.accountId) {
      const res = await updatePortalMediaInNeon(member.accountId, filePathInput.trim());
      if (!res.success) {
        setSaveError(res.error || 'Failed to save directly to Neon One, saved locally.');
      }
    }

    try {
      localStorage.setItem(`sm_portal_media_${activeCardId}`, JSON.stringify(updated));
    } catch (_) {}

    // Update member's Portal Media field in local AuthContext
    updateMember({ portalMedia: filePathInput.trim() });

    setMedia(updated);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#f16622] uppercase tracking-wider mb-1">
          <DoorOpen className="w-4 h-4" />
          <span>Interactive Installation</span>
        </div>
        <h1 className="font-fredoka text-2xl sm:text-3xl font-bold text-stone-900">
          My Portal Media
        </h1>
        <p className="text-stone-600 text-sm">
          Media bound to Tap Card <strong>{activeCardId}</strong> (Neon One "Portal Media" field). When you tap this card at the Portal Door kiosk, this assigned media automatically plays.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <strong>Portal Media Updated & Synced to Neon One!</strong> Saved for Tap Card <code>{activeCardId}</code>.
          </div>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>{saveError}</div>
        </div>
      )}

      {/* Tap Card Ownership Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#f16622]/15 text-[#f16622] flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-stone-500 font-medium">Active Tap Card</div>
            <div className="font-mono text-lg sm:text-xl font-bold text-stone-900">
              {activeCardId}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Account: <strong className="text-stone-800">{greetingName}</strong></span>
          {media?.updatedAt && (
            <>
              <span className="text-stone-300">•</span>
              <span className="text-stone-500">{media.updatedAt}</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Live Preview of Member's Portal Screen */}
        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-2xl bg-stone-900 border border-stone-800 p-4 text-white shadow-md">
            <div className="flex items-center justify-between text-xs text-stone-400 mb-3">
              <span className="flex items-center gap-1.5 font-medium">
                <Play className="w-3.5 h-3.5 text-[#3bc0cd]" />
                Portal Door Screen Simulation
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-stone-800 text-[10px] font-mono uppercase tracking-wider text-stone-300 border border-stone-700">
                {media?.type || 'video'}
              </span>
            </div>

            {/* Simulated Door Frame */}
            <div className="aspect-[9/14] w-full rounded-xl bg-black overflow-hidden relative border-4 border-stone-700 flex items-center justify-center">
              {media?.filePath ? (
                media.type === 'video' ? (
                  <video
                    src={media.filePath.startsWith('http') ? media.filePath : `https://socialmediumben.github.io/Portal-Door/${media.filePath}`}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={media.filePath.startsWith('http') ? media.filePath : `https://socialmediumben.github.io/Portal-Door/${media.filePath}`}
                    alt={media.title || 'Portal Media'}
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="p-6 text-center text-stone-500 text-xs">
                  <DoorOpen className="w-10 h-10 mx-auto mb-2 text-stone-600" />
                  No media link assigned yet in Neon One. Enter a video or image link to connect to this card!
                </div>
              )}

              {/* In-Frame Overlay reflecting Portal Door UI */}
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <div className="text-[10px] uppercase font-bold text-[#3bc0cd] tracking-wider mb-0.5">
                  Welcome to the Portal
                </div>
                <div className="font-fredoka text-sm font-bold text-white truncate">
                  {media?.title || 'Unassigned'}
                </div>
                <div className="text-[10px] text-stone-400 font-mono">
                  Tap Card: {activeCardId}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-stone-400 text-center mt-2">
              This triggers on the physical Portal Door when Tap Card <strong>{activeCardId}</strong> is scanned.
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Edit Form */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs">
            <h2 className="font-fredoka text-lg font-bold text-stone-900 mb-1">
              Edit Portal Media
            </h2>
            <p className="text-stone-500 text-xs mb-4">
              Enter the file path or URL (video loop or image) to store in your Neon One "Portal Media" field.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Title / Character Name
                </label>
                <input
                  type="text"
                  required
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. My Portal Loop"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#f16622] focus:ring-2 focus:ring-[#f16622]/20 text-sm font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Media Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTypeInput('video')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      typeInput === 'video'
                        ? 'bg-[#344ea2] text-white border-[#344ea2]'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    Video Loop
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeInput('image')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      typeInput === 'image'
                        ? 'bg-[#344ea2] text-white border-[#344ea2]'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Image className="w-4 h-4" />
                    Static Image
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Portal Media URL / Path (Neon One: "Portal Media")
                </label>
                <input
                  type="text"
                  required
                  value={filePathInput}
                  onChange={(e) => setFilePathInput(e.target.value)}
                  placeholder="e.g. https://... or videos/MyVideo.mp4"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#f16622] focus:ring-2 focus:ring-[#f16622]/20 text-xs font-mono transition-all"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Direct web URL (<code>https://...</code>) or Portal Door video file (e.g. <code>videos/Tron.mp4</code>).
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 px-4 rounded-xl bg-[#f16622] hover:bg-[#d95313] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving to Neon One...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Portal Media
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
