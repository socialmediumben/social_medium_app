'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Lightbulb,
  Power,
  ShieldAlert,
  Check,
  RefreshCw,
  Lock,
  Unlock,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ControllableDevice {
  id: string;
  name: string;
  room?: string;
  type?: string;
  power?: boolean;
  brightness?: number;
}

interface HubspaceSettingsCardProps {
  serverUrl: string;
  hubspaceConfig?: {
    enabled: boolean;
    username: string;
  };
  availableDevices?: ControllableDevice[];
  onRefreshState?: () => void;
  onNotification?: (msg: string) => void;
}

export function HubspaceSettingsCard({
  serverUrl,
  hubspaceConfig,
  availableDevices = [],
  onRefreshState,
  onNotification,
}: HubspaceSettingsCardProps) {
  const [username, setUsername] = useState<string>(hubspaceConfig?.username || '');
  const [password, setPassword] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [deviceStates, setDeviceStates] = useState<Record<string, { power: boolean; brightness: number }>>(
    {}
  );

  const isEnabled = !!hubspaceConfig?.enabled;

  const handleSaveCredentials = async (enable = true) => {
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`${serverUrl}/api/settings/hubspace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: enable,
          username: enable ? username : '',
          password: enable ? password : '',
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setFeedback({
          type: 'success',
          message: data.message || (enable ? 'Hubspace connected successfully!' : 'Hubspace disabled.'),
        });
        onNotification?.(enable ? 'Hubspace smart lights connected!' : 'Switched to simulator mode.');
        onRefreshState?.();
      } else {
        setFeedback({
          type: 'error',
          message: data.message || 'Failed to authenticate with Hubspace.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error communicating with server.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeviceToggle = async (deviceId: string, currentPower: boolean) => {
    const nextPower = !currentPower;
    setDeviceStates((prev) => ({
      ...prev,
      [deviceId]: {
        power: nextPower,
        brightness: prev[deviceId]?.brightness ?? 100,
      },
    }));

    try {
      await fetch(`${serverUrl}/api/hubspace/device/${encodeURIComponent(deviceId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ power: nextPower }),
      });
      onNotification?.(`Smart light ${nextPower ? 'powered ON' : 'powered OFF'}.`);
    } catch (err) {
      console.warn('Device toggle error:', err);
    }
  };

  const handleDeviceBrightness = async (deviceId: string, newBrightness: number) => {
    setDeviceStates((prev) => ({
      ...prev,
      [deviceId]: {
        power: true,
        brightness: newBrightness,
      },
    }));

    try {
      await fetch(`${serverUrl}/api/hubspace/device/${encodeURIComponent(deviceId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ power: true, brightness: newBrightness }),
      });
    } catch (err) {
      console.warn('Brightness error:', err);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold text-xs uppercase tracking-wider">
              Smart Ambiance
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              Developer Mode
            </span>
          </div>
          <h3 className="font-fredoka text-xl font-bold text-stone-900">
            Hubspace Smart Lighting & Hardware
          </h3>
          <p className="text-stone-500 text-xs">
            Authenticate the Makerspace Mini PC with Hubspace to command ceiling spot lights and ambient LED fixtures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full border ${
              isEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-stone-100 text-stone-600 border-stone-200'
            }`}
          >
            {isEnabled ? '● Hubspace Active' : '○ Simulator Active'}
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Credentials Configuration Form */}
      <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
        <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#344ea2]" />
          <span>Hubspace Cloud Account Credentials</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Hubspace Username / Email:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. makerspace@socialmedium.space"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono bg-white text-stone-800 focus:outline-hidden focus:border-[#3bc0cd]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Hubspace Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono bg-white text-stone-800 focus:outline-hidden focus:border-[#3bc0cd]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleSaveCredentials(true)}
            disabled={isSaving}
            className="py-2.5 px-5 rounded-xl bg-[#344ea2] hover:bg-[#2b4085] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Authenticating...' : 'Connect & Sync Hubspace'}</span>
          </button>

          {isEnabled && (
            <button
              type="button"
              onClick={() => handleSaveCredentials(false)}
              disabled={isSaving}
              className="py-2.5 px-3 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold text-xs cursor-pointer"
            >
              Switch to Simulator Mode
            </button>
          )}
        </div>
      </div>

      {/* Discovered Controllable Devices */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Discovered Smart Fixtures ({availableDevices.length})</span>
          </h4>
          <button
            type="button"
            onClick={() => onRefreshState?.()}
            className="text-xs text-[#344ea2] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Scan Devices</span>
          </button>
        </div>

        {availableDevices.length === 0 ? (
          <div className="p-4 rounded-2xl bg-stone-50 border border-dashed border-stone-200 text-center text-xs text-stone-500">
            No physical Hubspace devices listed. Ensure Hubspace is connected above, or use the Simulator to simulate room lighting events.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableDevices.map((dev) => {
              const state = deviceStates[dev.id] || {
                power: dev.power ?? true,
                brightness: dev.brightness ?? 80,
              };

              return (
                <div
                  key={dev.id}
                  className="p-4 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-stone-800">{dev.name}</div>
                      <div className="text-[10px] text-stone-500">{dev.room || 'Game Room'}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeviceToggle(dev.id, state.power)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        state.power
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                      }`}
                      title={state.power ? 'Turn Off' : 'Turn On'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                      <span>Brightness</span>
                      <span className="font-mono">{state.power ? `${state.brightness}%` : 'Off'}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      disabled={!state.power}
                      value={state.brightness}
                      onChange={(e) => handleDeviceBrightness(dev.id, Number(e.target.value))}
                      className="w-full accent-[#f16622] cursor-pointer disabled:opacity-40"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
