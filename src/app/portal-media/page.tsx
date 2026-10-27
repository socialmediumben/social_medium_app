'use client';

import { useState } from 'react';
import { DoorOpen, CreditCard, Save, CheckCircle2, Play, Video, Image, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import { DEFAULT_PORTAL_MEDIA, DEFAULT_MEMBER } from '@/lib/member-data';
import { TapCardMedia } from '@/lib/types';

// Preset sample media available at the makerspace for quick selection
const QUICK_MEDIA_PRESETS = [
  {
    title: "Tron Portal Loop",
    type: "video" as const,
    filePath: "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-4148-large.mp4",
  },
  {
    title: "Big Hero Six Hero Bay",
    type: "image" as const,
    filePath: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000&auto=format&fit=crop&q=80",
  },
  {
    title: "Cyberpunk Gateway",
    type: "video" as const,
    filePath: "https://assets.mixkit.co/videos/preview/mixkit-futuristic-tunnel-with-neon-lights-42998-large.mp4",
  },
  {
    title: "Makerspace Hologram",
    type: "image" as const,
    filePath: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80",
  }
];

export default function PortalMediaPage() {
  const [media, setMedia] = useState<TapCardMedia>(DEFAULT_PORTAL_MEDIA);
  const [titleInput, setTitleInput] = useState(media.title);
  const [typeInput, setTypeInput] = useState<'video' | 'image'>(media.type);
  const [filePathInput, setFilePathInput] = useState(media.filePath);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/portal-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleInput,
          type: typeInput,
          filePath: filePathInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setMedia(data.media);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } catch (err) {
      // Fallback local update
      setMedia({
        ...media,
        title: titleInput,
        type: typeInput,
        filePath: filePathInput,
        updatedAt: new Date().toISOString().split('T')[0]
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectPreset = (preset: typeof QUICK_MEDIA_PRESETS[number]) => {
    setTitleInput(preset.title);
    setTypeInput(preset.type);
    setFilePathInput(preset.filePath);
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
          Manage the personal media connected to your physical tap card. When you tap your card at the Portal Door kiosk, this custom media automatically plays!
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong>Tap Card Media Updated!</strong> Your changes are now linked to Card <code>{DEFAULT_MEMBER.tapCardId}</code>.
            </div>
          </div>
        </div>
      )}

      {/* Tap Card Ownership Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#f16622]/15 text-[#f16622] flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-stone-500 font-medium">Your Physical Tap Card UID</div>
            <div className="font-mono text-lg sm:text-xl font-bold text-stone-900">
              {DEFAULT_MEMBER.tapCardId}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Assigned to: <strong className="text-stone-800">{DEFAULT_MEMBER.name}</strong></span>
          <span className="text-stone-300">•</span>
          <span className="text-stone-500 font-mono">Last updated: {media.updatedAt}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Live Preview of Member's Portal Screen */}
        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-2xl bg-stone-900 border border-stone-800 p-4 text-white shadow-md">
            <div className="flex items-center justify-between text-xs text-stone-400 mb-3">
              <span className="flex items-center gap-1.5 font-medium">
                <Play className="w-3.5 h-3.5 text-[#3bc0cd]" />
                Portal Door Live Simulation
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-stone-800 text-[10px] font-mono uppercase tracking-wider text-stone-300 border border-stone-700">
                {media.type}
              </span>
            </div>

            {/* Simulated Door Frame */}
            <div className="aspect-[9/14] w-full rounded-xl bg-black overflow-hidden relative border-4 border-stone-700 flex items-center justify-center">
              {media.type === 'video' ? (
                <video
                  src={media.filePath}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={media.filePath}
                  alt={media.title}
                  className="w-full h-full object-cover"
                />
              )}

              {/* In-Frame Overlay reflecting Portal Door UI */}
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <div className="text-[10px] uppercase font-bold text-[#3bc0cd] tracking-wider mb-0.5">
                  Welcome to the Portal
                </div>
                <div className="font-fredoka text-sm font-bold text-white truncate">
                  {media.title}
                </div>
                <div className="text-[10px] text-stone-400 font-mono">
                  Card: {DEFAULT_MEMBER.tapCardId}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-stone-400 text-center mt-2">
              This is what displays on the physical portal screen when you tap your card!
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Edit Form & Quick Presets */}
        <div className="lg:col-span-7 space-y-5">
          {/* Edit Form */}
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs">
            <h2 className="font-fredoka text-lg font-bold text-stone-900 mb-1">
              Edit My Tap Card Media
            </h2>
            <p className="text-stone-500 text-xs mb-4">
              Enter a custom video URL (.mp4, loop link) or high-res image URL to link to your physical card.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Media Title / Character Name
                </label>
                <input
                  type="text"
                  required
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g., Tron Portal Loop, Sabine Wren, Judy Hopps"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#f16622] focus:ring-2 focus:ring-[#f16622]/20 text-sm font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Media Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTypeInput('video')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      typeInput === 'video'
                        ? 'bg-[#344ea2] text-white border-[#344ea2]'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    Video Loop (.mp4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeInput('image')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      typeInput === 'image'
                        ? 'bg-[#344ea2] text-white border-[#344ea2]'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Image className="w-4 h-4" />
                    Static Image (.jpg, .png)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Media File URL
                </label>
                <input
                  type="url"
                  required
                  value={filePathInput}
                  onChange={(e) => setFilePathInput(e.target.value)}
                  placeholder="https://... direct video or image URL"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#f16622] focus:ring-2 focus:ring-[#f16622]/20 text-xs font-mono transition-all"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Direct MP4 or image web links are supported.
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
                      Saving to Tap Card...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save & Link to My Card
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Selection Presets */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 mb-3">
              <Sparkles className="w-4 h-4 text-[#3bc0cd]" />
              <span>Or Choose from Makerspace Showcase Loops:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {QUICK_MEDIA_PRESETS.map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="p-3 rounded-xl border border-stone-200 hover:border-[#3bc0cd] hover:bg-[#3bc0cd]/5 text-left transition-all"
                >
                  <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                    <span className="font-semibold text-stone-800 truncate">{preset.title}</span>
                    <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600">
                      {preset.type}
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono truncate">
                    {preset.filePath}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
