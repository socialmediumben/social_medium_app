'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Tv,
  Image as ImageIcon,
  Map,
  Sparkles,
  Moon,
  Sun,
  Check,
  Sliders,
  AlertCircle,
  Calendar,
  Clock,
  Users,
  Wifi,
  WifiOff,
  ExternalLink,
  ShieldCheck,
  Settings2,
  RefreshCw,
  Info,
  Dice5,
  Volume2,
  X,
  Radio,
  Cast,
  Wrench,
  Grid,
  Layers,
} from 'lucide-react';
import { GAME_ROOM_PRESETS, INITIAL_GAME_ROOM_STATUS } from '@/lib/member-data';
import { GameRoomPreset, GameRoomDisplayStatus } from '@/lib/types';
import { useDevMode } from '@/context/DevModeContext';
import { ScreenMirrorModal } from '@/components/game-room/ScreenMirrorModal';
import { MediaLibraryManager } from '@/components/game-room/MediaLibraryManager';
import { GridCalibrationCard } from '@/components/game-room/GridCalibrationCard';
import { HubspaceSettingsCard } from '@/components/game-room/HubspaceSettingsCard';
import { PresetCreatorCard } from '@/components/game-room/PresetCreatorCard';

// Server Preset Mapping (translates app preset IDs to the Mini PC server preset IDs)
const PRESET_TO_SERVER_ID: Record<string, string> = {
  archmage: 'study',
  study: 'study',
  thunderstorm: 'storm',
  storm: 'storm',
  hearthside: 'tavern',
  tavern: 'tavern',
  crypt: 'dungeon',
  dungeon: 'dungeon',
  dragon: 'dragon',
  feywild: 'feywild',
  blackout: 'blackout',
};

// URL Sanitizer: extracts base origin (e.g. "https://192.168.12.108:8088") even if user pastes "/spellbook"
export function sanitizeGameRoomUrl(raw: string): string {
  if (!raw) return '';
  let clean = raw.trim();
  if (!/^https?:\/\//i.test(clean)) {
    clean = 'https://' + clean;
  }
  try {
    const u = new URL(clean);
    return `${u.protocol}//${u.host}`;
  } catch (_) {
    return clean.replace(/\/spellbook.*$/i, '').replace(/\/api\/.*$/i, '').replace(/\/+$/, '');
  }
}

// Helper to convert HTTP/HTTPS server origin to WS/WSS URL
export function getWebSocketUrl(rawHttpUrl: string): string {
  const clean = sanitizeGameRoomUrl(rawHttpUrl);
  if (!clean) return '';
  return clean.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:') + '/ws';
}

// Daily Rental Slots on Neon One
const RENTAL_SLOTS = [
  {
    id: 'afternoon',
    timeLabel: '3:00 PM – 6:00 PM',
    title: 'Immersive Game Room Rental (3 PM - 6 PM)',
    tag: 'Afternoon Session',
    duration: '3 Hours',
    description:
      'Perfect for mid-day one-shots, board game clubs, worldbuilding prep, or after-school tabletop campaigns.',
    eventUrl:
      'https://socialmedium.app.neoncrm.com/nx/portal/neonevents/events?path=%2Fportal%2Fevents%2F61747',
    badgeColor: 'bg-amber-500/10 text-amber-800 border-amber-300',
    iconColor: 'text-amber-600',
  },
  {
    id: 'evening',
    timeLabel: '7:00 PM – 10:00 PM',
    title: 'Immersive Game Room Rental (7 PM - 10 PM)',
    tag: 'Prime Evening',
    duration: '3 Hours',
    description:
      'Prime time slot for weekly tabletop campaigns, climactic boss fights, and late-night immersive role-playing.',
    eventUrl:
      'https://socialmedium.app.neoncrm.com/nx/portal/neonevents/events?path=%2Fportal%2Fevents%2F61749',
    badgeColor: 'bg-[#344ea2]/10 text-[#344ea2] border-[#344ea2]/30',
    iconColor: 'text-[#344ea2]',
  },
];

export default function GameRoomPage() {
  const { isDevMode } = useDevMode();

  // Navigation: Main Tabs ('remote' vs 'reservations')
  const [mainTab, setMainTab] = useState<'remote' | 'reservations'>('remote');

  // Sub-tabs under Live Remote ('presets' | 'displays' | 'lights' | 'devtools')
  const [remoteSubTab, setRemoteSubTab] = useState<'presets' | 'displays' | 'lights' | 'devtools'>('presets');

  // Controller State
  const [activePreset, setActivePreset] = useState<GameRoomPreset>(GAME_ROOM_PRESETS[0]);
  const [displayStatus, setDisplayStatus] = useState<GameRoomDisplayStatus>(INITIAL_GAME_ROOM_STATUS);
  const [brightness, setBrightness] = useState<number>(85);
  const [isBlackout, setIsBlackout] = useState<boolean>(false);
  const [triggerNotice, setTriggerNotice] = useState<string | null>(null);

  // Network / Server Connection State (Default to the Makerspace Mini PC IP)
  const DEFAULT_CONTROLLER_URL = 'https://192.168.12.108:8088';
  const [serverUrl, setServerUrl] = useState<string>(DEFAULT_CONTROLLER_URL);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [tempUrl, setTempUrl] = useState<string>(DEFAULT_CONTROLLER_URL);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'offline'>('unknown');
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);
  const [lastCheckError, setLastCheckError] = useState<string | null>(null);

  // Screen Mirroring State
  const [isMirrorModalOpen, setIsMirrorModalOpen] = useState<boolean>(false);
  const [activeMirrorScreen, setActiveMirrorScreen] = useState<'table' | 'window' | 'frame' | null>(null);

  // Hardware / Server State
  const [hubspaceConfig, setHubspaceConfig] = useState<{ enabled: boolean; username: string }>({
    enabled: false,
    username: '',
  });
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [tableGridSize, setTableGridSize] = useState<number>(22);
  const [tableGridShape, setTableGridShape] = useState<'square' | 'hex'>('square');

  // Modal for Embedding Neon One Event Registration Portal
  const [activeEmbedUrl, setActiveEmbedUrl] = useState<string | null>(null);
  const [activeEmbedTitle, setActiveEmbedTitle] = useState<string>('');

  // WebSocket Reference & Reconnect Backoff
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const wsRetryCountRef = useRef<number>(0);

  // Load configured server URL from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem('sm_game_room_server_url');
      if (savedUrl) {
        const sanitized = sanitizeGameRoomUrl(savedUrl);
        setServerUrl(sanitized);
        setTempUrl(sanitized);
      }
    }
  }, []);

  // Safe WebSocket Connection - ONLY initiates when HTTP probe confirms connection
  useEffect(() => {
    let isMounted = true;

    // Do NOT connect WebSocket if offline, unverified, or cert not yet trusted
    if (connectionStatus !== 'connected') {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (_) {}
        wsRef.current = null;
      }
      return;
    }

    const connectWs = () => {
      const wsUrl = getWebSocketUrl(serverUrl);
      if (!wsUrl || !isMounted) return;

      // Bound reconnect attempts to prevent Chromium ERR_TOO_MANY_RETRIES (-375)
      if (wsRetryCountRef.current >= 3) {
        console.warn('[Game Room] Max WS reconnect attempts (3) reached. Halting automatic retries.');
        setConnectionStatus('offline');
        return;
      }

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          wsRetryCountRef.current = 0; // Reset retry counter on clean open
          setConnectionStatus('connected');

          // Send Grimoire Handshake
          ws.send(
            JSON.stringify({
              action: 'HANDSHAKE',
              client_type: 'spellbook',
              version: '1.3.8',
            })
          );
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const msg = JSON.parse(event.data);

            if (msg.event === 'HANDSHAKE_ACK' || msg.event === 'STATE_UPDATE') {
              const state = msg.state || msg.current_state;
              if (state) {
                if (state.lighting?.brightness !== undefined) {
                  setBrightness(state.lighting.brightness);
                }
                if (state.scene_id) {
                  const matched = GAME_ROOM_PRESETS.find(
                    (p) => PRESET_TO_SERVER_ID[p.id] === state.scene_id || p.id === state.scene_id
                  );
                  if (matched) {
                    setActivePreset(matched);
                    setIsBlackout(matched.id === 'blackout');
                  }
                }
                if (state.displays) {
                  setDisplayStatus({
                    windowTv: {
                      online: true,
                      currentScene: state.displays.window?.title || state.displays.window?.type || 'Scenic Window',
                    },
                    pictureFrame: {
                      online: true,
                      currentScene: state.displays.frame?.title || 'Art Portrait',
                    },
                    tableProjector: {
                      online: true,
                      currentScene: state.displays.table?.title || 'Tactical Battlemap',
                    },
                  });
                }
              }

              if (msg.hubspace) {
                setHubspaceConfig({
                  enabled: !!msg.hubspace.enabled,
                  username: msg.hubspace.username || '',
                });
              }
              if (msg.available_devices) {
                setAvailableDevices(msg.available_devices);
              }
              if (msg.table_grid_size) {
                setTableGridSize(msg.table_grid_size);
              }
              if (msg.table_grid_shape) {
                setTableGridShape(msg.table_grid_shape);
              }
            } else if (msg.event === 'MIRROR_STATUS') {
              if (msg.active) {
                setActiveMirrorScreen(msg.screen);
              } else {
                setActiveMirrorScreen(null);
              }
            } else if (msg.event === 'STOP_MIRROR') {
              if (msg.screen === 'all' || msg.screen === activeMirrorScreen) {
                setActiveMirrorScreen(null);
              }
            }
          } catch (_) {}
        };

        ws.onclose = () => {
          if (!isMounted) return;
          wsRef.current = null;
          wsRetryCountRef.current++;

          if (wsRetryCountRef.current < 3) {
            const backoffMs = 2500 * wsRetryCountRef.current;
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMounted) connectWs();
            }, backoffMs);
          } else {
            console.warn('[Game Room] WS disconnected. Pausing retries until user manually retests.');
          }
        };

        ws.onerror = () => {
          // Handled gracefully in onclose
        };
      } catch (_) {}
    };

    connectWs();

    // Heartbeat PING interval (every 15s)
    const pingInterval = setInterval(() => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'PING' }));
      }
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (_) {}
        wsRef.current = null;
      }
    };
  }, [serverUrl, connectionStatus]);

  // Ping Game Room Server to check Wi-Fi connection
  const checkServerConnection = async (targetUrl = serverUrl) => {
    setIsCheckingConnection(true);
    setLastCheckError(null);
    wsRetryCountRef.current = 0; // Reset WS retry budget on manual probe
    setLastCheckError(null);

    const cleanUrl = sanitizeGameRoomUrl(targetUrl);
    if (!cleanUrl) {
      setIsCheckingConnection(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(`${cleanUrl}/api/state`, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const stateData = await response.json();
        setConnectionStatus('connected');
        setTriggerNotice('Connected to Makerspace Game Room Server!');

        if (stateData.hubspace) {
          setHubspaceConfig({
            enabled: !!stateData.hubspace.enabled,
            username: stateData.hubspace.username || '',
          });
        }
        if (stateData.available_devices) {
          setAvailableDevices(stateData.available_devices);
        }
        if (stateData.table_grid_size) {
          setTableGridSize(stateData.table_grid_size);
        }
        if (stateData.table_grid_shape) {
          setTableGridShape(stateData.table_grid_shape);
        }

        // Sync local display and preset state from server if available
        if (stateData.current_state) {
          const current = stateData.current_state;
          if (current.lighting?.brightness) {
            setBrightness(current.lighting.brightness);
          }
          if (current.scene_id) {
            const matched = GAME_ROOM_PRESETS.find(
              (p) => PRESET_TO_SERVER_ID[p.id] === current.scene_id || p.id === current.scene_id
            );
            if (matched) {
              setActivePreset(matched);
              setIsBlackout(matched.id === 'blackout');
            }
          }
          if (current.displays) {
            setDisplayStatus({
              windowTv: {
                online: true,
                currentScene: current.displays.window?.title || current.displays.window?.type || 'Scenic Window',
              },
              pictureFrame: {
                online: true,
                currentScene: current.displays.frame?.title || 'Art Portrait',
              },
              tableProjector: {
                online: true,
                currentScene: current.displays.table?.title || 'Tactical Battlemap',
              },
            });
          }
        }
      } else {
        setConnectionStatus('offline');
        setLastCheckError(`Server returned HTTP ${response.status}`);
      }
    } catch (err: any) {
      setConnectionStatus('offline');
      setLastCheckError(err.message || 'Cannot reach server on local network');
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // Perform initial ping check on mount
  useEffect(() => {
    checkServerConnection(serverUrl);
  }, [serverUrl]);

  // Save server URL
  const handleSaveServerUrl = () => {
    const sanitized = sanitizeGameRoomUrl(tempUrl);
    setServerUrl(sanitized);
    setTempUrl(sanitized);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sm_game_room_server_url', sanitized);
    }
    setIsConfigOpen(false);
    checkServerConnection(sanitized);
  };

  // Dispatch Scene Preset to Live Server
  const handleSelectPreset = async (preset: GameRoomPreset) => {
    setActivePreset(preset);
    const blackoutMode = preset.id === 'blackout';
    setIsBlackout(blackoutMode);
    setDisplayStatus({
      windowTv: { online: true, currentScene: preset.windowMedia },
      pictureFrame: { online: true, currentScene: preset.frameMedia },
      tableProjector: { online: true, currentScene: preset.tableMedia },
    });

    setTriggerNotice(`Loaded: ${preset.name}`);
    setTimeout(() => setTriggerNotice(null), 3000);

    // Call local server if configured
    if (serverUrl) {
      const cleanUrl = sanitizeGameRoomUrl(serverUrl);
      const serverPresetId = PRESET_TO_SERVER_ID[preset.id] || preset.id;
      try {
        const res = await fetch(`${cleanUrl}/api/scene`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: serverPresetId }),
        });
        if (res.ok) {
          setConnectionStatus('connected');
          setTriggerNotice(`Room Displays Updated: ${preset.name}`);
        } else {
          setTriggerNotice(`Controller status: HTTP ${res.status}`);
        }
      } catch (e: any) {
        console.warn('[Game Room] Failed to reach local controller:', e);
        setConnectionStatus('offline');
      }
    }
  };

  // Toggle Blackout Mode
  const handleToggleBlackout = async () => {
    if (!isBlackout) {
      const blackoutPreset = GAME_ROOM_PRESETS.find((p) => p.id === 'blackout') || GAME_ROOM_PRESETS[6];
      setActivePreset(blackoutPreset);
      setIsBlackout(true);
      setTriggerNotice('Chamber lights extinguished (Blackout).');

      if (serverUrl) {
        try {
          const cleanUrl = sanitizeGameRoomUrl(serverUrl);
          await fetch(`${cleanUrl}/api/scene`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 'blackout' }),
          });
        } catch (_) {}
      }
    } else {
      const normalPreset = GAME_ROOM_PRESETS[0];
      setActivePreset(normalPreset);
      setIsBlackout(false);
      setTriggerNotice('Chamber lights restored.');

      if (serverUrl) {
        try {
          const cleanUrl = sanitizeGameRoomUrl(serverUrl);
          await fetch(`${cleanUrl}/api/scene`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 'study' }),
          });
        } catch (_) {}
      }
    }
    setTimeout(() => setTriggerNotice(null), 3000);
  };

  // Dispatch Master Brightness to Live Server
  const handleBrightnessChange = async (newVal: number) => {
    setBrightness(newVal);
    if (serverUrl && connectionStatus === 'connected') {
      try {
        const cleanUrl = sanitizeGameRoomUrl(serverUrl);
        await fetch(`${cleanUrl}/api/lighting`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            power: !isBlackout,
            brightness: isBlackout ? 0 : newVal,
          }),
        });
      } catch (_) {}
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 p-6 sm:p-7 rounded-3xl text-white shadow-lg border border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#f16622] uppercase tracking-wider mb-1">
            <span>📜</span>
            <span>The Wizard's Grimoire • v1.3.8</span>
            {isDevMode && (
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 font-mono">
                🛠️ Dev Mode Active
              </span>
            )}
          </div>
          <h1 className="font-fredoka text-2xl sm:text-3xl font-bold text-white mb-1">
            D&D Game Room Remote & Rentals
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Local smart controller for displays, overhead battlemaps, and lighting when on the makerspace Wi-Fi, or reserve your 3-hour tabletop session.
          </p>
        </div>

        {/* Action Buttons in Banner */}
        {mainTab === 'remote' && (
          <div className="flex items-center gap-2 shrink-0">
            {/* Screen Casting Trigger */}
            <button
              onClick={() => setIsMirrorModalOpen(true)}
              className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                activeMirrorScreen
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
              }`}
              title="Cast your laptop screen or window to tabletop projector or TVs"
            >
              <Radio className={`w-4 h-4 ${activeMirrorScreen ? 'text-white' : 'text-[#f16622]'}`} />
              <span>{activeMirrorScreen ? '🔴 Live Mirroring' : '🖥️ Cast Screen'}</span>
            </button>

            {/* Quick Blackout Action */}
            <button
              onClick={handleToggleBlackout}
              className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                isBlackout
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-black/60 hover:bg-black text-white border border-white/20'
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
                  <span>🌑 Blackout</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Top Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setMainTab('remote')}
          className={`py-2.5 px-5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
            mainTab === 'remote'
              ? 'bg-[#344ea2] text-white shadow-md'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Wifi className="w-4 h-4" />
          <span>🎮 Live Room Remote</span>
          {connectionStatus === 'connected' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
          )}
        </button>

        <button
          onClick={() => setMainTab('reservations')}
          className={`py-2.5 px-5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
            mainTab === 'reservations'
              ? 'bg-[#f16622] text-white shadow-md'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>📅 Reserve Game Room</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 text-white font-semibold">
            2 Slots Daily
          </span>
        </button>
      </div>

      {/* Notice Toast */}
      {triggerNotice && (
        <div className="p-3 rounded-xl bg-stone-900 text-amber-300 border border-amber-500/30 text-xs flex items-center gap-2 font-mono shadow-md animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{triggerNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: LIVE ROOM REMOTE (Wi-Fi Connected)                                 */}
      {/* ========================================================================= */}
      {mainTab === 'remote' && (
        <div className="space-y-6">
          {/* Wi-Fi & Local Server Connection Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    connectionStatus === 'connected'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {connectionStatus === 'connected' ? (
                    <Wifi className="w-5 h-5" />
                  ) : (
                    <WifiOff className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900">
                      {connectionStatus === 'connected'
                        ? 'Connected to Makerspace Wi-Fi'
                        : 'Makerspace Wi-Fi Controller (Standby)'}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        connectionStatus === 'connected'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {connectionStatus === 'connected' ? '● Online' : '○ Standby / Simulator'}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 font-mono mt-0.5">
                    Server: {serverUrl}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => checkServerConnection()}
                  disabled={isCheckingConnection}
                  className="py-1.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  title="Ping local game room server"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingConnection ? 'animate-spin' : ''}`} />
                  <span>{isCheckingConnection ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsConfigOpen(!isConfigOpen)}
                  className="py-1.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Configure IP</span>
                </button>

                <a
                  href={`${sanitizeGameRoomUrl(serverUrl)}/spellbook`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-3 rounded-xl bg-[#344ea2]/10 hover:bg-[#344ea2]/20 text-[#344ea2] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Open direct DM Spellbook UI"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Spellbook</span>
                </a>
              </div>
            </div>

            {/* Offline Helper Notice */}
            {connectionStatus !== 'connected' && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-3">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="block font-semibold text-sm text-amber-950">
                      Running in Offline Simulator Mode
                    </strong>
                    <p className="text-amber-800 leading-relaxed">
                      To control the physical room displays and Hubspace ceiling lights, your device must be connected to the <strong>Social Medium Makerspace Wi-Fi</strong>.
                    </p>
                  </div>
                </div>

                {/* Step-by-Step Certificate Trust for Phones */}
                <div className="p-3.5 rounded-xl bg-white/80 border border-amber-300/60 space-y-2">
                  <div className="font-bold text-xs text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                    <span>📱</span>
                    <span>First Time Connecting a New Phone or Laptop?</span>
                  </div>
                  <ol className="list-decimal pl-5 space-y-1.5 text-amber-900 leading-relaxed">
                    <li>
                      Confirm this device is connected to the <strong>Makerspace Wi-Fi</strong> (not mobile 5G/cellular data).
                    </li>
                    <li>
                      Tap{' '}
                      <a
                        href={`${sanitizeGameRoomUrl(serverUrl)}/spellbook`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold underline text-[#344ea2] hover:text-[#2b4085]"
                      >
                        <span>Trust Local Security Certificate ↗</span>
                      </a>
                      . When the warning appears, tap <strong>Advanced</strong> &rarr; <strong>Proceed to 192.168.12.108 (unsafe)</strong>.
                    </li>
                    <li>
                      Return to this tab and tap <strong>Test Connection</strong> above.
                    </li>
                  </ol>
                  <p className="text-[11px] text-amber-700 italic pt-1">
                    Note: If a device skips step 2, mobile Chrome blocks untrusted local SSL connections and reports <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">ERR_TOO_MANY_RETRIES</code>.
                  </p>
                </div>
              </div>
            )}

            {/* IP Configuration Collapsible Form */}
            {isConfigOpen && (
              <div className="mt-4 pt-4 border-t border-stone-200 space-y-3">
                <div className="text-xs font-semibold text-stone-800">
                  Game Room Controller Mini PC URL / IP:
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    placeholder="e.g. https://192.168.12.108:8088"
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:outline-hidden focus:border-[#3bc0cd] focus:ring-2 focus:ring-[#3bc0cd]/20"
                  />
                  <button
                    type="button"
                    onClick={handleSaveServerUrl}
                    className="py-2 px-4 rounded-xl bg-[#344ea2] hover:bg-[#2b4085] text-white font-bold text-xs cursor-pointer"
                  >
                    Save & Reconnect
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempUrl('https://192.168.12.108:8088');
                      setServerUrl('https://192.168.12.108:8088');
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('sm_game_room_server_url', 'https://192.168.12.108:8088');
                      }
                      setIsConfigOpen(false);
                      checkServerConnection('https://192.168.12.108:8088');
                    }}
                    className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs cursor-pointer"
                  >
                    Reset Default
                  </button>
                </div>
                {lastCheckError && (
                  <p className="text-[11px] text-red-600 font-mono">
                    Last probe status: {lastCheckError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Connected Displays Status Bar */}
          <div className="p-4 rounded-2xl bg-stone-900 text-stone-300 border border-stone-800 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Physical Room Displays Status
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMirrorModalOpen(true)}
                  className="py-1 px-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-[#f16622] border border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Cast className="w-3.5 h-3.5" />
                  <span>{activeMirrorScreen ? 'Mirroring Active' : 'Cast Screen'}</span>
                </button>
                <div className="text-[11px] font-mono text-stone-400">
                  Theme: <span className="text-amber-400 font-semibold">{activePreset.name}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Window TV */}
              <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5 truncate">
                  <Tv className="w-4 h-4 text-[#38bdf8] shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-stone-200 flex items-center gap-1.5">
                      <span>53" Window TV</span>
                      {activeMirrorScreen === 'window' && (
                        <span className="text-[9px] bg-red-600 text-white font-mono px-1.5 py-0.2 rounded-full uppercase">
                          Mirrored
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-400 truncate">
                      {activeMirrorScreen === 'window' ? 'Active Screen Stream' : displayStatus.windowTv.currentScene}
                    </div>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-2" title="Active" />
              </div>

              {/* Picture Frame */}
              <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5 truncate">
                  <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-stone-200 flex items-center gap-1.5">
                      <span>Picture Frame</span>
                      {activeMirrorScreen === 'frame' && (
                        <span className="text-[9px] bg-red-600 text-white font-mono px-1.5 py-0.2 rounded-full uppercase">
                          Mirrored
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-400 truncate">
                      {activeMirrorScreen === 'frame' ? 'Active Screen Stream' : displayStatus.pictureFrame.currentScene}
                    </div>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-2" title="Active" />
              </div>

              {/* Tabletop Projector */}
              <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5 truncate">
                  <Map className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-stone-200 flex items-center gap-1.5">
                      <span>Table Projector</span>
                      {activeMirrorScreen === 'table' && (
                        <span className="text-[9px] bg-red-600 text-white font-mono px-1.5 py-0.2 rounded-full uppercase">
                          Mirrored
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-400 truncate">
                      {activeMirrorScreen === 'table' ? 'Active Screen Stream' : displayStatus.tableProjector.currentScene}
                    </div>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-2" title="Active" />
              </div>
            </div>
          </div>

          {/* Remote Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
            <button
              onClick={() => setRemoteSubTab('presets')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                remoteSubTab === 'presets'
                  ? 'bg-[#344ea2] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ Arcane Presets ({GAME_ROOM_PRESETS.length})</span>
            </button>

            <button
              onClick={() => setRemoteSubTab('displays')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                remoteSubTab === 'displays'
                  ? 'bg-[#344ea2] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>🔮 Screen Overrides</span>
            </button>

            <button
              onClick={() => setRemoteSubTab('lights')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                remoteSubTab === 'lights'
                  ? 'bg-[#344ea2] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>🕯️ Chamber Lights</span>
            </button>

            {/* Developer Mode Sub-Tab */}
            {isDevMode && (
              <button
                onClick={() => setRemoteSubTab('devtools')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  remoteSubTab === 'devtools'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-800 bg-amber-500/10 hover:bg-amber-500/20'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>🛠️ Developer Studio</span>
              </button>
            )}
          </div>

          {/* Sub-Tab 1: Arcane Presets Grid */}
          {remoteSubTab === 'presets' && (
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
                      <p
                        className={`text-xs leading-relaxed mb-4 ${
                          isCurrent ? 'text-stone-300' : 'text-stone-500'
                        }`}
                      >
                        {preset.description}
                      </p>
                    </div>

                    <div
                      className={`pt-3 border-t text-[11px] space-y-1 ${
                        isCurrent
                          ? 'border-stone-800 text-stone-400'
                          : 'border-stone-100 text-stone-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>🪟 Window:</span>
                        <span className="font-medium truncate max-w-[150px]">
                          {preset.windowMedia}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>🖼️ Frame:</span>
                        <span className="font-medium truncate max-w-[150px]">
                          {preset.frameMedia}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>🗺️ Map:</span>
                        <span className="font-medium truncate max-w-[150px]">
                          {preset.tableMedia}
                        </span>
                      </div>
                    </div>

                    {isCurrent && (
                      <div className="mt-3 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-amber-400/15 text-amber-300 text-xs font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Active Scene</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Sub-Tab 2: Screen Overrides */}
          {remoteSubTab === 'displays' && (
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
                <div className="text-xs text-stone-500 mb-2">Current Window Atmosphere:</div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 font-medium text-xs text-stone-800 mb-4">
                  {displayStatus.windowTv.currentScene}
                </div>
                <div className="space-y-1.5 text-xs">
                  <button
                    onClick={() => {
                      setDisplayStatus({
                        ...displayStatus,
                        windowTv: { online: true, currentScene: 'Rain on Castle Glass' },
                      });
                      if (serverUrl) {
                        fetch(`${serverUrl}/api/display/window`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'weather', effect_type: 'rain', title: 'Rain on Castle Glass' }),
                        });
                      }
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                  >
                    🌧️ Rain on Castle Glass
                  </button>
                  <button
                    onClick={() => {
                      setDisplayStatus({
                        ...displayStatus,
                        windowTv: { online: true, currentScene: 'Midnight Tempest & Gale' },
                      });
                      if (serverUrl) {
                        fetch(`${serverUrl}/api/display/window`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'weather', effect_type: 'tempest', title: 'Midnight Tempest & Gale' }),
                        });
                      }
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                  >
                    ⚡ Midnight Tempest & Gale
                  </button>
                  <button
                    onClick={() => {
                      setDisplayStatus({
                        ...displayStatus,
                        windowTv: { online: true, currentScene: 'Tavern Village Sunset' },
                      });
                      if (serverUrl) {
                        fetch(`${serverUrl}/api/display/window`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'weather', effect_type: 'sunset', title: 'Tavern Village Sunset' }),
                        });
                      }
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                  >
                    🌇 Tavern Village Sunset
                  </button>
                  <button
                    onClick={() => {
                      setDisplayStatus({
                        ...displayStatus,
                        windowTv: { online: true, currentScene: 'Inferno Skies & Embers' },
                      });
                      if (serverUrl) {
                        fetch(`${serverUrl}/api/display/window`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'weather', effect_type: 'inferno', title: 'Inferno Skies & Embers' }),
                        });
                      }
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                  >
                    🔥 Inferno Skies & Embers
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
                <div className="text-xs text-stone-500 mb-2">Current Portrait:</div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 font-medium text-xs text-stone-800 mb-4">
                  {displayStatus.pictureFrame.currentScene}
                </div>
                <div className="space-y-1.5 text-xs">
                  <button
                    onClick={() => {
                      setDisplayStatus({
                        ...displayStatus,
                        pictureFrame: { online: true, currentScene: 'Archmage Ignis (Wise Wizard)' },
                      });
                      if (serverUrl) {
                        fetch(`${serverUrl}/api/display/frame`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'portrait', src: '/static/media/frames/archmage.svg', title: 'Archmage Ignis' }),
                        });
                      }
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                  >
                    🧙 Archmage Ignis
                  </button>
                  <button
                    onClick={() => {
                      setDisplayStatus({
                        ...displayStatus,
                        pictureFrame: { online: true, currentScene: 'Barnaby the Barkeep' },
                      });
                      if (serverUrl) {
                        fetch(`${serverUrl}/api/display/frame`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'portrait', src: '/static/media/frames/barkeep.svg', title: 'Barnaby the Barkeep' }),
                        });
                      }
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                  >
                    🍺 Barnaby the Barkeep
                  </button>
                  <button
                    onClick={() => {
                      setDisplayStatus({
                        ...displayStatus,
                        pictureFrame: { online: true, currentScene: 'Vermithrax the Red Dragon' },
                      });
                      if (serverUrl) {
                        fetch(`${serverUrl}/api/display/frame`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'portrait', src: '/static/media/frames/dragon.svg', title: 'Vermithrax the Red Dragon' }),
                        });
                      }
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                  >
                    🐉 Vermithrax the Red Dragon
                  </button>
                  <button
                    onClick={() => {
                      setDisplayStatus({
                        ...displayStatus,
                        pictureFrame: { online: true, currentScene: 'Queen Titania (Summer Court)' },
                      });
                      if (serverUrl) {
                        fetch(`${serverUrl}/api/display/frame`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'portrait', src: '/static/media/frames/fey.svg', title: 'Queen Titania' }),
                        });
                      }
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                  >
                    🧚 Queen Titania
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
                <div className="text-xs text-stone-500 mb-2">Current Tabletop Map:</div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 font-medium text-xs text-stone-800 mb-4">
                  {displayStatus.tableProjector.currentScene}
                </div>
                <div className="space-y-1.5 text-xs">
                  <button
                    onClick={() => {
                      setDisplayStatus({
                        ...displayStatus,
                        tableProjector: { online: true, currentScene: 'The Arcane Library Map' },
                      });
                      if (serverUrl) {
                        fetch(`${serverUrl}/api/display/table`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'map', src: '/static/media/tables/library.svg', title: 'The Arcane Library Map' }),
                        });
                      }
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                  >
                    🗺️ The Arcane Library Map
                  </button>
                  <button
                    onClick={() => {
                      setDisplayStatus({
                        ...displayStatus,
                        tableProjector: { online: true, currentScene: 'Tavern Main Hall Map' },
                      });
                      if (serverUrl) {
                        fetch(`${serverUrl}/api/display/table`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'map', src: '/static/media/tables/tavern.svg', title: 'Tavern Main Hall Map' }),
                        });
                      }
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                  >
                    🍻 Tavern Main Hall Map
                  </button>
                  <button
                    onClick={() => {
                      setDisplayStatus({
                        ...displayStatus,
                        tableProjector: { online: true, currentScene: 'Volcanic Caldera Arena' },
                      });
                      if (serverUrl) {
                        fetch(`${serverUrl}/api/display/table`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'map', src: '/static/media/tables/volcano.svg', title: 'Volcanic Caldera Arena' }),
                        });
                      }
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                  >
                    🌋 Volcanic Caldera Arena
                  </button>
                  <button
                    onClick={() => {
                      setDisplayStatus({
                        ...displayStatus,
                        tableProjector: { online: true, currentScene: 'Flooded Crypt Map' },
                      });
                      if (serverUrl) {
                        fetch(`${serverUrl}/api/display/table`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'map', src: '/static/media/tables/crypt.svg', title: 'Flooded Crypt Map' }),
                        });
                      }
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                  >
                    🌊 Flooded Crypt Map
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 3: Chamber Smart Lights */}
          {remoteSubTab === 'lights' && (
            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs max-w-xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-fredoka text-lg font-bold text-stone-900">
                    Chamber Smart Lights
                  </h2>
                  <p className="text-stone-500 text-xs">
                    Controls ceiling lights and ambient Hubspace smart light strips.
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-2xl border border-stone-300 shadow-xs transition-colors"
                  style={{ backgroundColor: isBlackout ? '#000000' : activePreset.lightingHex }}
                  title="Active light color"
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
                  onChange={(e) => handleBrightnessChange(Number(e.target.value))}
                  className="w-full accent-[#f16622] cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Ambiance Mode:</span>
                  <span className="font-semibold text-stone-800">{activePreset.lightingName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Preset Theme:</span>
                  <span className="font-mono font-medium text-stone-700">{activePreset.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Hubspace Integration:</span>
                  <span className="font-semibold text-emerald-700">
                    {hubspaceConfig.enabled ? 'Auto-Synced (Live)' : 'Simulator Mode'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 4: Developer Mode Studio */}
          {remoteSubTab === 'devtools' && isDevMode && (
            <div className="space-y-6 animate-fade-in">
              {/* Media Library Manager */}
              <MediaLibraryManager
                serverUrl={serverUrl}
                wsRef={wsRef}
                onNotification={(msg) => {
                  setTriggerNotice(msg);
                  setTimeout(() => setTriggerNotice(null), 3500);
                }}
              />

              {/* Grid Calibration */}
              <GridCalibrationCard
                serverUrl={serverUrl}
                wsRef={wsRef}
                initialGridSize={tableGridSize}
                initialGridShape={tableGridShape}
                onNotification={(msg) => {
                  setTriggerNotice(msg);
                  setTimeout(() => setTriggerNotice(null), 3500);
                }}
              />

              {/* Hubspace Smart Fixtures & Settings */}
              <HubspaceSettingsCard
                serverUrl={serverUrl}
                hubspaceConfig={hubspaceConfig}
                availableDevices={availableDevices}
                onRefreshState={() => checkServerConnection()}
                onNotification={(msg) => {
                  setTriggerNotice(msg);
                  setTimeout(() => setTriggerNotice(null), 3500);
                }}
              />

              {/* Preset Creator */}
              <PresetCreatorCard
                serverUrl={serverUrl}
                wsRef={wsRef}
                onPresetSaved={() => checkServerConnection()}
                onNotification={(msg) => {
                  setTriggerNotice(msg);
                  setTimeout(() => setTriggerNotice(null), 3500);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RESERVE GAME ROOM (Neon One Rental Booking)                         */}
      {/* ========================================================================= */}
      {mainTab === 'reservations' && (
        <div className="space-y-6">
          {/* Reservation Intro Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 shadow-xs">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
                <Dice5 className="w-3.5 h-3.5 text-amber-700" />
                <span>Private Room Rentals</span>
              </span>
              <h2 className="font-fredoka text-xl sm:text-2xl font-bold text-stone-900 mb-2">
                Book the Immersive Game Room
              </h2>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                Rent our dedicated tabletop gaming studio for your next D&D campaign, tabletop miniature battle, or board game night. Each 3-hour session includes full access to the overhead projector, custom digital screens, and smart atmospheric lighting.
              </p>
            </div>
          </div>

          {/* Daily Rental Time Slots */}
          <div className="space-y-3">
            <h3 className="font-fredoka text-lg font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#f16622]" />
              <span>Available Daily Rental Slots</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {RENTAL_SLOTS.map((slot) => (
                <div
                  key={slot.id}
                  className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-left relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${slot.badgeColor}`}
                      >
                        {slot.tag}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-stone-500 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{slot.duration}</span>
                      </div>
                    </div>

                    <h4 className="font-fredoka text-xl font-bold text-stone-900 mb-1.5">
                      {slot.title}
                    </h4>

                    <div className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-[#f16622] mb-3">
                      <span>⏰ {slot.timeLabel}</span>
                    </div>

                    <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-6 font-roboto">
                      {slot.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-stone-100">
                    <a
                      href={slot.eventUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#f16622] to-[#e05511] hover:from-[#e05511] hover:to-[#c44405] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md cursor-pointer"
                    >
                      <span>Book on Neon One</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveEmbedUrl(slot.eventUrl);
                        setActiveEmbedTitle(slot.title);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Preview In-App Sign-Up</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Included Amenities & Hardware */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-fredoka text-lg font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>What's Included With Every Rental</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                <div className="font-bold text-stone-900 text-sm mb-1 flex items-center gap-2">
                  <Map className="w-4 h-4 text-emerald-600" />
                  <span>Overhead Battlemap Projector</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  High-definition ceiling-mounted projector projecting directly onto the tabletop with calibrated 1-inch tactical grid support. Connects to Roll20, Foundry VTT, Owlbear Rodeo, or static maps.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                <div className="font-bold text-stone-900 text-sm mb-1 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-[#38bdf8]" />
                  <span>53" Castle Window Display</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Wall-mounted scenic display designed as a gothic castle window arch with dynamic procedural weather: rain storms, blizzard, tavern sunsets, and lightning effects.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                <div className="font-bold text-stone-900 text-sm mb-1 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span>Gilded Picture Frame Screen</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Antique-framed digital display for NPC portraits, monster art, animated creatures, and player handouts to immerse your group in the adventure.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                <div className="font-bold text-stone-900 text-sm mb-1 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#f16622]" />
                  <span>Atmospheric Smart Lighting</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Ceiling spots and ambient smart light strips integrated with Hubspace. One-touch candle flicker, thunder lightning strobes, combat alerts, and stealth blackout.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                <div className="font-bold text-stone-900 text-sm mb-1 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-purple-600" />
                  <span>Chamber Audio & Ambiance</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Surround sound setup ready for background music playlists, ambient tavern chatter, crackling fires, and battle audio cues.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                <div className="font-bold text-stone-900 text-sm mb-1 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#344ea2]" />
                  <span>Seating for Up to 8 Players</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Spacious gaming table accommodating up to 8 players comfortably with plenty of room for character sheets, dice trays, books, and laptops.
                </p>
              </div>
            </div>
          </div>

          {/* Policies & Guidelines */}
          <div className="p-5 rounded-2xl bg-stone-100/70 border border-stone-200 text-stone-600 text-xs space-y-2">
            <div className="font-bold text-stone-800 text-sm flex items-center gap-2">
              <Info className="w-4 h-4 text-stone-500" />
              <span>Rental Guidelines & Makerspace Etiquette</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 leading-relaxed">
              <li>Reservations are confirmed immediately through your Neon One member account.</li>
              <li>Please arrive 5–10 minutes early to configure your digital maps and sound.</li>
              <li>Food and lidded drinks are welcome (coasters and side tables are provided).</li>
              <li>Please leave the room clean, restore standard lighting, and pack up all miniatures before the conclusion of your 3-hour session.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Screen Mirroring Modal */}
      <ScreenMirrorModal
        isOpen={isMirrorModalOpen}
        onClose={() => setIsMirrorModalOpen(false)}
        serverUrl={serverUrl}
        wsRef={wsRef}
        activeMirrorScreen={activeMirrorScreen}
        setActiveMirrorScreen={setActiveMirrorScreen}
        onNotification={(msg) => {
          setTriggerNotice(msg);
          setTimeout(() => setTriggerNotice(null), 3500);
        }}
      />

      {/* Embedded Neon One Portal Modal */}
      {activeEmbedUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="truncate mr-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#f16622] block">
                  Neon One Event Registration
                </span>
                <h3 className="font-fredoka text-base sm:text-lg font-bold text-stone-900 truncate">
                  {activeEmbedTitle}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activeEmbedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-3 rounded-xl bg-[#344ea2] hover:bg-[#2b4085] text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Open in Neon One</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setActiveEmbedUrl(null)}
                  className="p-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded Iframe Container with Fallback */}
            <div className="flex-1 bg-stone-100 relative min-h-[450px]">
              <div className="p-3 bg-amber-50 text-amber-900 border-b border-amber-200 text-xs flex items-center justify-between gap-2">
                <span>
                  💡 If Neon One restricts in-frame booking in your browser, click <strong>"Open in Neon One"</strong> above.
                </span>
                <a
                  href={activeEmbedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-bold text-amber-900 shrink-0"
                >
                  Direct Link ↗
                </a>
              </div>

              <iframe
                src={activeEmbedUrl}
                title={activeEmbedTitle}
                className="w-full h-full min-h-[500px] border-none"
                allow="payment; camera; microphone"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
