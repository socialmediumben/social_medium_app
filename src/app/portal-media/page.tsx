'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  DoorOpen,
  CreditCard,
  Save,
  CheckCircle2,
  Play,
  Video,
  Image as ImageIcon,
  RefreshCw,
  AlertCircle,
  Volume2,
  VolumeX,
  Sparkles,
  ExternalLink,
  Film,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TapCardLogin } from '@/components/TapCardLogin';
import { TapCardMedia, getGreetingName } from '@/lib/types';
import { updatePortalMediaInNeon } from '@/lib/neon';

/**
 * Extracts 11-character YouTube video ID from various YouTube URL formats.
 */
function getYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const clean = String(url).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
  const match = clean.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Normalizes Google Drive, relative Portal Door assets, or raw web URLs.
 */
function normalizeMediaUrl(url: string | null | undefined, type: 'video' | 'image'): string {
  if (!url) return '';
  const clean = url.trim();

  // Google Drive
  const driveMatch =
    clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    clean.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/) ||
    clean.match(/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    if (type === 'image') {
      return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    }
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }

  // Relative Portal Door assets (e.g. videos/Tron.mp4 or static/...)
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    const asset = clean.startsWith('static/') ? clean : `static/${clean}`;
    return `https://portal.socialmedium.space/${asset}`;
  }

  return clean;
}

export default function PortalMediaPage() {
  const { activeCardId, member, updateMember, isLoading } = useAuth();
  const [media, setMedia] = useState<TapCardMedia | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [typeInput, setTypeInput] = useState<'video' | 'image'>('video');
  const [filePathInput, setFilePathInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Simulation controls
  const [doorsOpen, setDoorsOpen] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

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

    // Initial record from Neon One
    const initial: TapCardMedia = {
      cardId: activeCardId,
      title: member?.portalMedia ? `${greetingName}'s Portal` : '',
      type: 'video',
      filePath: member?.portalMedia || '',
      updatedAt: member?.portalMedia ? 'Neon One' : '',
    };
    setMedia(initial);
    setTitleInput(initial.title);
    setTypeInput('video');
    setFilePathInput(initial.filePath);
  }, [activeCardId, member]);

  const greetingName = getGreetingName(member);

  // Active media resolution
  const activeFilePath = filePathInput.trim() || media?.filePath || '';
  const ytVideoId = useMemo(() => getYouTubeVideoId(activeFilePath), [activeFilePath]);
  const isYouTube = Boolean(ytVideoId);
  const resolvedUrl = useMemo(
    () => normalizeMediaUrl(activeFilePath, typeInput),
    [activeFilePath, typeInput]
  );

  if (isLoading) {
    return (
      <div className="py-20 text-center text-stone-500 font-mono text-sm">
        Loading Portal Door configuration...
      </div>
    );
  }

  if (!activeCardId || !member) {
    return <TapCardLogin />;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    const updated: TapCardMedia = {
      cardId: activeCardId,
      title: titleInput.trim(),
      type: typeInput,
      filePath: filePathInput.trim(),
      updatedAt: new Date().toISOString().split('T')[0],
    };

    // Save to Neon One field 117 if accountId is available
    if (member?.accountId) {
      const res = await updatePortalMediaInNeon(member.accountId, filePathInput.trim());
      if (!res.success) {
        setSaveError(res.error || 'Failed to save directly to Neon One, saved locally.');
      }
    }

    try {
      localStorage.setItem(`sm_portal_media_${activeCardId}`, JSON.stringify(updated));
    } catch (_) {}

    updateMember({ portalMedia: filePathInput.trim() });
    setMedia(updated);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
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
          Media bound to Tap Card <strong>{activeCardId}</strong> (Neon One &quot;Portal Media&quot; field).
          When you tap this card at the Portal Door kiosk, this media automatically plays.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <strong>Portal Media Updated & Synced to Neon One!</strong> Saved for Tap Card{' '}
            <code>{activeCardId}</code>.
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
          <span>
            Account: <strong className="text-stone-800">{greetingName}</strong>
          </span>
          {media?.updatedAt && (
            <>
              <span className="text-stone-300">•</span>
              <span className="text-stone-500">{media.updatedAt}</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Live Interactive Simulation of Portal Door */}
        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-2xl bg-stone-950 border border-stone-800 p-4 text-white shadow-lg">
            {/* Simulation Header & Controls */}
            <div className="flex items-center justify-between text-xs text-stone-400 mb-3">
              <span className="flex items-center gap-1.5 font-bold text-[#3bc0cd]">
                <Play className="w-3.5 h-3.5" />
                Portal Door Simulation
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsMuted((prev) => !prev)}
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                  className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => setDoorsOpen((prev) => !prev)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                    doorsOpen
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {doorsOpen ? 'Doors Open' : 'Doors Closed'}
                </button>
              </div>
            </div>

            {/* Simulated Vertical Portal Frame (9/14 ratio matching physical kiosk display) */}
            <div className="aspect-[9/14] w-full rounded-xl bg-black overflow-hidden relative border-4 border-[#3bc0cd]/40 shadow-[0_0_25px_rgba(59,192,205,0.25)] flex items-center justify-center">
              {/* Media Layer Behind Doors */}
              <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden">
                {activeFilePath ? (
                  isYouTube && ytVideoId ? (
                    <iframe
                      key={`${ytVideoId}-${isMuted}`}
                      src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1&mute=${
                        isMuted ? 1 : 0
                      }&loop=1&playlist=${ytVideoId}&controls=1&enablejsapi=1`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0 absolute inset-0 object-cover pointer-events-auto"
                      title={titleInput || 'Portal Scene'}
                    />
                  ) : typeInput === 'image' || /\.(jpe?g|png|webp|gif)($|\?)/i.test(resolvedUrl) ? (
                    <img
                      key={resolvedUrl}
                      src={resolvedUrl}
                      alt={titleInput || 'Portal Media'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      key={`${resolvedUrl}-${isMuted}`}
                      src={resolvedUrl}
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="p-6 text-center text-stone-500 text-xs">
                    <DoorOpen className="w-10 h-10 mx-auto mb-2 text-stone-600" />
                    No media link assigned yet in Neon One. Enter a video or image link to connect to
                    this card!
                  </div>
                )}
              </div>

              {/* Interactive Sliding Doors Overlay (Left & Right Door Panels) */}
              <div
                className={`absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out flex ${
                  doorsOpen ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {/* Left Door */}
                <div
                  className={`w-1/2 h-full bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 border-r-2 border-[#3bc0cd] transition-transform duration-700 ease-in-out shadow-2xl flex flex-col items-center justify-center p-4 ${
                    doorsOpen ? '-translate-x-full' : 'translate-x-0'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full border border-stone-600 flex items-center justify-center text-stone-400 font-bold text-xs mb-2">
                    SM
                  </div>
                  <div className="text-[10px] uppercase font-bold text-stone-400 tracking-widest text-center">
                    PORTAL
                  </div>
                </div>

                {/* Right Door */}
                <div
                  className={`w-1/2 h-full bg-gradient-to-l from-stone-900 via-stone-800 to-stone-900 border-l-2 border-[#3bc0cd] transition-transform duration-700 ease-in-out shadow-2xl flex flex-col items-center justify-center p-4 ${
                    doorsOpen ? 'translate-x-full' : 'translate-x-0'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full border border-stone-600 flex items-center justify-center text-[#3bc0cd] font-bold text-xs mb-2">
                    NFC
                  </div>
                  <div className="text-[10px] uppercase font-bold text-[#3bc0cd] tracking-widest text-center">
                    READY
                  </div>
                </div>
              </div>

              {/* In-Frame Passport HUD Overlay reflecting Portal Door UI */}
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-10">
                <div className="text-[10px] uppercase font-bold text-[#3bc0cd] tracking-wider mb-0.5">
                  Welcome to the Portal
                </div>
                <div className="font-fredoka text-sm font-bold text-white truncate">
                  {titleInput || media?.title || `${greetingName}'s Portal`}
                </div>
                <div className="text-[10px] text-stone-400 font-mono flex items-center justify-between">
                  <span>Tap Card: {activeCardId}</span>
                  <span className="text-emerald-400 font-bold">ONLINE</span>
                </div>
              </div>
            </div>

            {/* Quick Simulation Toggles */}
            <div className="flex items-center justify-between mt-3 text-xs text-stone-400 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setDoorsOpen((prev) => !prev)}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-semibold"
              >
                <span>{doorsOpen ? '🚪 Close Door Simulation' : '✨ Open Portal Simulation'}</span>
              </button>
              {isYouTube && (
                <span className="text-[11px] text-red-400 font-mono flex items-center gap-1">
                  <Film className="w-3 h-3" /> YouTube Stream
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Edit Form & Presets */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs">
            <h2 className="font-fredoka text-lg font-bold text-stone-900 mb-1">
              Edit Portal Media
            </h2>
            <p className="text-stone-500 text-xs mb-4">
              Enter any YouTube video link, direct video/image file URL, or Google Drive link to sync
              to your Neon One &quot;Portal Media&quot; field.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Title / Scene Name
                </label>
                <input
                  type="text"
                  required
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. Ben's Cyberpunk Portal"
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
                    Video / YouTube Loop
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
                    <ImageIcon className="w-4 h-4" />
                    Static Image
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Portal Media URL (Neon One Field 117)
                </label>
                <input
                  type="text"
                  required
                  value={filePathInput}
                  onChange={(e) => setFilePathInput(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=... or direct mp4 / png link"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#f16622] focus:ring-2 focus:ring-[#f16622]/20 text-xs font-mono transition-all"
                />
                <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                  Supports YouTube links (<code>https://youtube.com/watch?v=...</code>), Google Drive
                  shares, or direct media URLs. Changes update the simulation live!
                </p>
              </div>

              {/* Sample Presets */}
              <div className="pt-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Quick Presets to Try:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTitleInput("Tron Legacy Lightcycle");
                      setTypeInput('video');
                      setFilePathInput("https://www.youtube.com/watch?v=wWLjwlg78vo");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium cursor-pointer transition-colors"
                  >
                    Tron Lightcycle (YouTube)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTitleInput("Matrix Code Rain");
                      setTypeInput('video');
                      setFilePathInput("https://www.youtube.com/watch?v=s0bXfK0Bw_4");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium cursor-pointer transition-colors"
                  >
                    Matrix Code Rain
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTitleInput("Hobbit Door");
                      setTypeInput('image');
                      setFilePathInput("https://portal.socialmedium.space/static/hobbit.jpg");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium cursor-pointer transition-colors"
                  >
                    Hobbit Door (Image)
                  </button>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 px-4 rounded-xl bg-[#f16622] hover:bg-[#d95313] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving to Neon One CRM...
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
