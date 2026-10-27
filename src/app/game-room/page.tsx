'use client';

import { useState } from 'react';
import { Gamepad2, Tv, Image as ImageIcon, Map, Sparkles, Moon, Sun, Check, Sliders, AlertCircle } from 'lucide-react';
import { GAME_ROOM_PRESETS, INITIAL_GAME_ROOM_STATUS } from '@/lib/member-data';
import { GameRoomPreset, GameRoomDisplayStatus } from '@/lib/types';

export default function GameRoomPage() {
  const [activePreset, setActivePreset] = useState<GameRoomPreset>(GAME_ROOM_PRESETS[0]);
  const [displayStatus, setDisplayStatus] = useState<GameRoomDisplayStatus>(INITIAL_GAME_ROOM_STATUS);
  const [brightness, setBrightness] = useState<number>(85);
  const [isBlackout, setIsBlackout] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'displays' | 'lights'>('presets');
  const [triggerNotice, setTriggerNotice] = useState<string | null>(null);

  const handleSelectPreset = (preset: GameRoomPreset) => {
    setActivePreset(preset);
    setIsBlackout(preset.id === 'blackout');
    setDisplayStatus({
      windowTv: { online: true, currentScene: preset.windowMedia },
      pictureFrame: { online: true, currentScene: preset.frameMedia },
      tableProjector: { online: true, currentScene: preset.tableMedia },
    });
    setTriggerNotice(`Loaded: ${preset.name}`);
    setTimeout(() => setTriggerNotice(null), 3000);
  };

  const handleToggleBlackout = () => {
    if (!isBlackout) {
      const blackoutPreset = GAME_ROOM_PRESETS.find(p => p.id === 'blackout') || GAME_ROOM_PRESETS[6];
      setActivePreset(blackoutPreset);
      setIsBlackout(true);
      setTriggerNotice("Chamber lights extinguished (Blackout).");
    } else {
      const normalPreset = GAME_ROOM_PRESETS[0];
      setActivePreset(normalPreset);
      setIsBlackout(false);
      setTriggerNotice("Chamber lights restored.");
    }
    setTimeout(() => setTriggerNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Grimoire Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#f16622] uppercase tracking-wider mb-1">
            <span>📜</span>
            <span>The Wizard's Grimoire • v1.3.8</span>
          </div>
          <h1 className="font-fredoka text-2xl sm:text-3xl font-bold text-stone-900">
            D&D Game Room Remote
          </h1>
          <p className="text-stone-600 text-sm">
            Local room controller for displays, smart lighting, and immersive fantasy table atmospheres.
          </p>
        </div>

        {/* Blackout Quick Action */}
        <button
          onClick={handleToggleBlackout}
          className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
            isBlackout
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-stone-900 hover:bg-black text-white border border-stone-800'
          }`}
        >
          {isBlackout ? (
            <>
              <Sun className="w-4 h-4 text-amber-200" />
              <span>Restore Lights</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-stone-300" />
              <span>🌑 Blackout Mode</span>
            </>
          )}
        </button>
      </div>

      {triggerNotice && (
        <div className="p-3 rounded-xl bg-stone-900 text-amber-300 border border-amber-500/30 text-xs flex items-center gap-2 font-mono">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{triggerNotice}</span>
        </div>
      )}

      {/* Connected Game Room Displays Status Bar */}
      <div className="p-4 rounded-xl bg-stone-900 text-stone-300 border border-stone-800 shadow-md">
        <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
          Game Room Displays Status
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Window TV */}
          <div className="p-2.5 rounded-lg bg-stone-800/80 border border-stone-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <Tv className="w-4 h-4 text-[#38bdf8]" />
              <div className="truncate">
                <div className="font-semibold text-stone-200">53" Window TV</div>
                <div className="text-[10px] text-stone-400 truncate">{displayStatus.windowTv.currentScene}</div>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-2" title="Online" />
          </div>

          {/* Picture Frame */}
          <div className="p-2.5 rounded-lg bg-stone-800/80 border border-stone-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <div className="truncate">
                <div className="font-semibold text-stone-200">Picture Frame</div>
                <div className="text-[10px] text-stone-400 truncate">{displayStatus.pictureFrame.currentScene}</div>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-2" title="Online" />
          </div>

          {/* Tabletop Projector */}
          <div className="p-2.5 rounded-lg bg-stone-800/80 border border-stone-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <Map className="w-4 h-4 text-emerald-400" />
              <div className="truncate">
                <div className="font-semibold text-stone-200">Table Projector</div>
                <div className="text-[10px] text-stone-400 truncate">{displayStatus.tableProjector.currentScene}</div>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-2" title="Online" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('presets')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'presets'
              ? 'bg-[#344ea2] text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          ✨ Arcane Presets ({GAME_ROOM_PRESETS.length})
        </button>
        <button
          onClick={() => setActiveTab('displays')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'displays'
              ? 'bg-[#344ea2] text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          🔮 Screen Overrides
        </button>
        <button
          onClick={() => setActiveTab('lights')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'lights'
              ? 'bg-[#344ea2] text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          🕯️ Chamber Lights
        </button>
      </div>

      {/* Tab 1: Arcane Presets Grid */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAME_ROOM_PRESETS.map((preset) => {
            const isCurrent = activePreset.id === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-left relative overflow-hidden ${
                  isCurrent
                    ? 'bg-stone-900 text-white border-amber-400 shadow-md ring-2 ring-amber-400/20'
                    : 'bg-white text-stone-800 border-stone-200 hover:border-[#3bc0cd] hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isCurrent
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {preset.tag}
                    </span>

                    {/* Lighting Color Indicator Orb */}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs"
                        style={{ backgroundColor: preset.lightingHex }}
                      />
                    </div>
                  </div>

                  <h3 className="font-fredoka text-lg font-bold mb-1">
                    {preset.name}
                  </h3>
                  <p className={`text-xs leading-relaxed mb-4 ${isCurrent ? 'text-stone-300' : 'text-stone-500'}`}>
                    {preset.description}
                  </p>
                </div>

                <div className={`pt-3 border-t text-[11px] space-y-1 ${isCurrent ? 'border-stone-800 text-stone-400' : 'border-stone-100 text-stone-500'}`}>
                  <div className="flex items-center justify-between">
                    <span>🪟 Window:</span>
                    <span className="font-medium truncate max-w-[150px]">{preset.windowMedia}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>🖼️ Frame:</span>
                    <span className="font-medium truncate max-w-[150px]">{preset.frameMedia}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>🗺️ Map:</span>
                    <span className="font-medium truncate max-w-[150px]">{preset.tableMedia}</span>
                  </div>
                </div>

                {isCurrent && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 py-1 rounded-lg bg-amber-400/15 text-amber-300 text-xs font-semibold">
                    <Check className="w-3.5 h-3.5" /> Active Scene
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Screen Overrides */}
      {activeTab === 'displays' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Window TV */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm text-stone-900 flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-[#38bdf8]" />
                53" Window TV
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <div className="text-xs text-stone-500 mb-3">Current Window Atmosphere:</div>
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 font-medium text-xs text-stone-800 mb-4">
              {displayStatus.windowTv.currentScene}
            </div>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => setDisplayStatus({ ...displayStatus, windowTv: { online: true, currentScene: "Rain on Castle Glass" } })}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors"
              >
                🌧️ Rainy Castle Glass
              </button>
              <button
                onClick={() => setDisplayStatus({ ...displayStatus, windowTv: { online: true, currentScene: "Midnight Tempest & Gale" } })}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors"
              >
                ⚡ Lightning Tempest
              </button>
              <button
                onClick={() => setDisplayStatus({ ...displayStatus, windowTv: { online: true, currentScene: "Tavern Village Sunset" } })}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors"
              >
                🌇 Tavern Sunset
              </button>
            </div>
          </div>

          {/* Picture Frame */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm text-stone-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-500" />
                Picture Frame
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <div className="text-xs text-stone-500 mb-3">Current Portrait:</div>
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 font-medium text-xs text-stone-800 mb-4">
              {displayStatus.pictureFrame.currentScene}
            </div>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => setDisplayStatus({ ...displayStatus, pictureFrame: { online: true, currentScene: "Archmage Ignis" } })}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors"
              >
                🧙 Archmage Ignis
              </button>
              <button
                onClick={() => setDisplayStatus({ ...displayStatus, pictureFrame: { online: true, currentScene: "Barnaby the Barkeep" } })}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors"
              >
                🍺 Barnaby the Barkeep
              </button>
              <button
                onClick={() => setDisplayStatus({ ...displayStatus, pictureFrame: { online: true, currentScene: "Lord Malakor (Lich)" } })}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors"
              >
                💀 Lord Malakor (Lich)
              </button>
            </div>
          </div>

          {/* Tabletop Projector */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm text-stone-900 flex items-center gap-1.5">
                <Map className="w-4 h-4 text-emerald-500" />
                Table Projector
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <div className="text-xs text-stone-500 mb-3">Current Tabletop Map:</div>
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 font-medium text-xs text-stone-800 mb-4">
              {displayStatus.tableProjector.currentScene}
            </div>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => setDisplayStatus({ ...displayStatus, tableProjector: { online: true, currentScene: "The Arcane Library Map" } })}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors"
              >
                🗺️ Arcane Library
              </button>
              <button
                onClick={() => setDisplayStatus({ ...displayStatus, tableProjector: { online: true, currentScene: "Tavern Main Hall Map" } })}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors"
              >
                🍻 Tavern Main Hall
              </button>
              <button
                onClick={() => setDisplayStatus({ ...displayStatus, tableProjector: { online: true, currentScene: "Volcanic Caldera Arena" } })}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors"
              >
                🌋 Volcanic Arena
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Chamber Lights Controls */}
      {activeTab === 'lights' && (
        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs max-w-xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-fredoka text-lg font-bold text-stone-900">Chamber Smart Lights</h2>
              <p className="text-stone-500 text-xs">Controls the ceiling spots and ambient smart light strips.</p>
            </div>
            <div
              className="w-8 h-8 rounded-full border border-stone-300 shadow-xs transition-colors"
              style={{ backgroundColor: isBlackout ? '#000000' : activePreset.lightingHex }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-2">
              <span>Master Brightness</span>
              <span className="font-mono">{isBlackout ? '0%' : `${brightness}%`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              disabled={isBlackout}
              value={isBlackout ? 0 : brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full accent-[#f16622] cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Current Ambiance Mode:</span>
              <span className="font-semibold text-stone-800">{activePreset.lightingName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Preset Theme:</span>
              <span className="font-mono font-medium text-stone-700">{activePreset.name}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
