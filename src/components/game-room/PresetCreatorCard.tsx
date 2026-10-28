'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  Plus,
  Trash2,
  Tv,
  ImageIcon,
  Map,
  Sliders,
  AlertCircle,
} from 'lucide-react';

interface PresetCreatorCardProps {
  serverUrl: string;
  wsRef: React.MutableRefObject<WebSocket | null>;
  onPresetSaved?: () => void;
  onNotification?: (msg: string) => void;
}

export function PresetCreatorCard({
  serverUrl,
  wsRef,
  onPresetSaved,
  onNotification,
}: PresetCreatorCardProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [presetId, setPresetId] = useState<string>('');
  const [presetName, setPresetName] = useState<string>('');
  const [presetTag, setPresetTag] = useState<string>('Custom Scene');
  const [lightColor, setLightColor] = useState<string>('#f59e0b');
  const [brightness, setBrightness] = useState<number>(80);
  const [windowTitle, setWindowTitle] = useState<string>('Gothic Rain & Mist');
  const [frameTitle, setFrameTitle] = useState<string>('Gilded Portrait');
  const [frameSrc, setFrameSrc] = useState<string>('/static/media/frames/archmage.svg');
  const [tableTitle, setTableTitle] = useState<string>('Dungeon Catacombs');
  const [tableSrc, setTableSrc] = useState<string>('/static/media/tables/crypt.svg');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const QUICK_COLORS = [
    { name: 'Warm Amber', hex: '#f59e0b' },
    { name: 'Arcane Blue', hex: '#38bdf8' },
    { name: 'Eerie Emerald', hex: '#10b981' },
    { name: 'Crimson Dragon', hex: '#ef4444' },
    { name: 'Mystic Purple', hex: '#a855f7' },
    { name: 'Shadow Torch', hex: '#d97706' },
  ];

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName) return;

    setIsSaving(true);
    setFeedback(null);

    const generatedId =
      presetId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') ||
      presetName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const newPreset = {
      id: generatedId,
      name: presetName,
      icon: '✨',
      category: presetTag,
      lighting: {
        power: true,
        brightness: brightness,
        color: lightColor,
      },
      displays: {
        window: {
          type: 'weather',
          effect_type: 'rain',
          title: windowTitle,
        },
        frame: {
          type: 'portrait',
          title: frameTitle,
          src: frameSrc,
        },
        table: {
          type: 'map',
          title: tableTitle,
          src: tableSrc,
          grid_enabled: true,
        },
      },
    };

    try {
      const res = await fetch(`${serverUrl}/api/preset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreset),
      });

      if (res.ok) {
        setFeedback(`Saved preset '${presetName}'!`);
        onNotification?.(`Preset '${presetName}' registered in Grimoire!`);
        onPresetSaved?.();
        setIsOpen(false);
        setPresetName('');
        setPresetId('');
      } else {
        setFeedback(`Server returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      setFeedback(err.message || 'Error saving preset.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold text-xs uppercase tracking-wider">
              Encounter Studio
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              Developer Mode
            </span>
          </div>
          <h3 className="font-fredoka text-xl font-bold text-stone-900">
            Arcane Preset Creator
          </h3>
          <p className="text-stone-500 text-xs">
            Combine smart lighting color, window weather, frame art, and table maps into a 1-touch room preset.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="py-2 px-4 rounded-xl bg-[#344ea2] hover:bg-[#2b4085] text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{isOpen ? 'Close Creator' : 'Create New Preset'}</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 font-semibold">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Preset Creator Form */}
      {isOpen && (
        <form onSubmit={handleSavePreset} className="space-y-5 p-5 rounded-2xl bg-stone-50 border border-stone-200 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Preset Display Name:
              </label>
              <input
                type="text"
                required
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g. Dragon's Volcanic Lair"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:outline-hidden focus:border-[#3bc0cd]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Category / Encounter Tag:
              </label>
              <input
                type="text"
                value={presetTag}
                onChange={(e) => setPresetTag(e.target.value)}
                placeholder="e.g. Boss Fight, Taverns, Catacombs"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:outline-hidden focus:border-[#3bc0cd]"
              />
            </div>
          </div>

          {/* Lighting Settings */}
          <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#f16622]" />
                <span>Atmospheric Lighting</span>
              </span>
              <span
                className="w-5 h-5 rounded-full border border-black/20 shadow-xs"
                style={{ backgroundColor: lightColor }}
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {QUICK_COLORS.map((c) => (
                <button
                  type="button"
                  key={c.hex}
                  onClick={() => setLightColor(c.hex)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 cursor-pointer ${
                    lightColor === c.hex
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>

            <div className="pt-1">
              <div className="flex items-center justify-between text-[11px] text-stone-600 mb-1 font-semibold">
                <span>Brightness</span>
                <span className="font-mono">{brightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-[#f16622] cursor-pointer"
              />
            </div>
          </div>

          {/* Display Targets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1.5">
              <span className="font-bold text-xs text-stone-800 flex items-center gap-1">
                <Tv className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>53" Window TV</span>
              </span>
              <input
                type="text"
                value={windowTitle}
                onChange={(e) => setWindowTitle(e.target.value)}
                placeholder="Window Scene Title"
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1.5">
              <span className="font-bold text-xs text-stone-800 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>Picture Frame</span>
              </span>
              <input
                type="text"
                value={frameTitle}
                onChange={(e) => setFrameTitle(e.target.value)}
                placeholder="Portrait Title"
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1.5">
              <span className="font-bold text-xs text-stone-800 flex items-center gap-1">
                <Map className="w-3.5 h-3.5 text-emerald-500" />
                <span>Table Projector</span>
              </span>
              <input
                type="text"
                value={tableTitle}
                onChange={(e) => setTableTitle(e.target.value)}
                placeholder="Battlemap Title"
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="py-2 px-3 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="py-2 px-5 rounded-xl bg-[#f16622] hover:bg-[#d55214] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving Preset...' : 'Register Preset'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
