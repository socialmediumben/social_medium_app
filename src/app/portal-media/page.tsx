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
  Camera,
  Download,
  Maximize2,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TapCardLogin } from '@/components/TapCardLogin';
import { TapCardMedia, getGreetingName, PortalPhotoRecord } from '@/lib/types';
import { updatePortalMediaInNeon, fetchPortalPhotos, savePortalPhotoRecord } from '@/lib/neon';

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

  // Photobooth photos state
  const [portalPhotos, setPortalPhotos] = useState<PortalPhotoRecord[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [newPhotoAlert, setNewPhotoAlert] = useState<string | null>(null);
  const [previewModalPhoto, setPreviewModalPhoto] = useState<PortalPhotoRecord | null>(null);

  // Simulation controls
  const [doorsOpen, setDoorsOpen] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const loadPhotos = async (cardIdToUse?: string) => {
    const targetCard = cardIdToUse || activeCardId;
    if (!targetCard) return;

    setIsLoadingPhotos(true);
    try {
      // 1. Load cached photos
      const cached = localStorage.getItem(`sm_portal_photos_${targetCard}`);
      if (cached) {
        setPortalPhotos(JSON.parse(cached));
      }

      // 2. Fetch live from proxy
      const live = await fetchPortalPhotos(targetCard);
      if (live && live.length > 0) {
        setPortalPhotos(live);
        localStorage.setItem(`sm_portal_photos_${targetCard}`, JSON.stringify(live));
      }
    } catch (_) {}
    setIsLoadingPhotos(false);
  };

  useEffect(() => {
    if (!activeCardId) return;

    // Check URL parameters for newly snapped photo (?newPhoto=... or ?card=...)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const newPhoto = urlParams.get('newPhoto');
      if (newPhoto) {
        setNewPhotoAlert(newPhoto);

        // Auto-save this photo to the proxy if cardId is known
        savePortalPhotoRecord({
          cardId: activeCardId,
          url: newPhoto,
          timestamp: new Date().toISOString(),
        }).then(() => {
          loadPhotos(activeCardId);
        });
      }
    }

    loadPhotos(activeCardId);
  }, [activeCardId]);

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

  const handleUsePhotoAsMedia = (photoUrl: string) => {
    setTypeInput('image');
    setFilePathInput(photoUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDownloadPhoto = (photo: PortalPhotoRecord) => {
    const downloadUrl = photo.downloadUrl || photo.url;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = `Portal_Photo_${photo.id || Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

      {/* Photobooth Captures Section */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-fredoka text-xl font-bold text-stone-900 leading-tight">
                  My Portal Door Photos
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wide">
                  Photobooth Captures
                </span>
              </div>
              <p className="text-stone-500 text-xs mt-0.5">
                Pictures snapped by you at the physical Portal Door kiosk. View, download, or use them as your active portal media.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadPhotos()}
            disabled={isLoadingPhotos}
            className="self-start sm:self-auto text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPhotos ? 'animate-spin' : ''}`} />
            <span>Refresh Photos</span>
          </button>
        </div>

        {/* New Photo Banner (when redirected from QR code) */}
        {newPhotoAlert && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs text-purple-950 font-bold block">
                  ✨ Fresh Photo Detected from the Portal Door!
                </strong>
                <span className="text-[11px] text-purple-700">
                  Your photobooth snapshot has been linked to Tap Card <code>#{activeCardId}</code>.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleUsePhotoAsMedia(newPhotoAlert)}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                Use as Portal Media
              </button>
              <button
                type="button"
                onClick={() => setNewPhotoAlert(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Photos Grid */}
        {portalPhotos.length === 0 ? (
          <div className="p-8 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-200/60 text-stone-400 flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-semibold text-stone-800 text-sm">
                No Photobooth Photos Recorded Yet
              </h3>
              <p className="text-stone-500 text-xs leading-relaxed">
                Step up to the <strong>Portal Door</strong> kiosk, toggle to Photobooth mode (or press <kbd className="px-1 py-0.5 rounded bg-stone-200 text-stone-700 font-mono text-[10px]">+</kbd> on the keypad to snap a photo).
                Your captures will automatically appear here so you can download and share them!
              </p>
            </div>
            <div className="pt-2">
              <a
                href="https://portal.socialmedium.space"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors shadow-xs"
              >
                <span>Launch Portal Door Kiosk</span>
                <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {portalPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Photo Thumbnail */}
                <div
                  onClick={() => setPreviewModalPhoto(photo)}
                  className="aspect-[3/4] w-full overflow-hidden relative cursor-pointer bg-stone-950 flex items-center justify-center"
                >
                  <img
                    src={photo.url}
                    alt="Portal Door Photobooth capture"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs flex items-center gap-1.5 font-medium">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </span>
                  </div>
                  {/* Timestamp Tag */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-[10px] text-white font-mono">
                    {photo.timestamp
                      ? new Date(photo.timestamp).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Recent'}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="p-2.5 bg-white border-t border-stone-100 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUsePhotoAsMedia(photo.url)}
                    title="Set this photo as your active Portal Door media"
                    className="flex-1 py-1.5 px-2 rounded-lg bg-stone-50 hover:bg-purple-50 hover:text-purple-700 text-stone-700 text-[11px] font-semibold border border-stone-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#f16622]" />
                    <span>Set Media</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPhoto(photo)}
                    title="Download high-resolution photo"
                    className="p-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Photo Preview Modal */}
      {previewModalPhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-xl w-full bg-stone-900 rounded-3xl overflow-hidden border border-stone-800 shadow-2xl space-y-4 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-stone-300">
                <Camera className="w-4 h-4 text-purple-400" />
                <span>
                  Captured on{' '}
                  {previewModalPhoto.timestamp
                    ? new Date(previewModalPhoto.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'Recent'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalPhoto(null)}
                className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black">
              <img
                src={previewModalPhoto.url}
                alt="Full resolution preview"
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleUsePhotoAsMedia(previewModalPhoto.url);
                  setPreviewModalPhoto(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#f16622] hover:bg-[#d95313] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Use as My Portal Media</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPhoto(previewModalPhoto)}
                className="px-4 py-2 rounded-xl bg-white text-stone-900 hover:bg-stone-100 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
