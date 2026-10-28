'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Tv,
  Map,
  ImageIcon,
  X,
  Play,
  Square,
  AlertCircle,
  Laptop,
  Smartphone,
  Radio,
  Sliders,
  Maximize2,
  Volume2,
} from 'lucide-react';

interface ScreenMirrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverUrl: string;
  wsRef: React.MutableRefObject<WebSocket | null>;
  activeMirrorScreen: 'table' | 'window' | 'frame' | null;
  setActiveMirrorScreen: (s: 'table' | 'window' | 'frame' | null) => void;
  onNotification?: (msg: string) => void;
}

export function ScreenMirrorModal({
  isOpen,
  onClose,
  serverUrl,
  wsRef,
  activeMirrorScreen,
  setActiveMirrorScreen,
  onNotification,
}: ScreenMirrorModalProps) {
  const [selectedScreen, setSelectedScreen] = useState<'table' | 'window' | 'frame'>('table');
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [includeAudio, setIncludeAudio] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [framesSent, setFramesSent] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);

  // References for live stream & worker
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const fpsIntervalRef = useRef<any>(null);
  const frameCounterRef = useRef<number>(0);
  const isStreamingRef = useRef<boolean>(false);

  // Detect capability & device type on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobileDevice(isMobile);
      setIsSupported(hasMedia && !isMobile);
    }
  }, []);

  // Update selected screen if active screen changes externally
  useEffect(() => {
    if (activeMirrorScreen) {
      setSelectedScreen(activeMirrorScreen);
    }
  }, [activeMirrorScreen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupStreaming();
    };
  }, []);

  const cleanupStreaming = () => {
    isStreamingRef.current = false;

    if (workerRef.current) {
      try {
        workerRef.current.postMessage('stop');
        workerRef.current.terminate();
      } catch (_) {}
      workerRef.current = null;
    }

    if (fpsIntervalRef.current) {
      clearInterval(fpsIntervalRef.current);
      fpsIntervalRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (_) {}
      streamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        if (videoRef.current.parentNode) {
          videoRef.current.parentNode.removeChild(videoRef.current);
        }
      } catch (_) {}
      videoRef.current = null;
    }

    setFps(0);
  };

  const handleStartMirror = async () => {
    setStreamError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setStreamError('Screen sharing is not supported by this browser. Please use Chrome, Edge, or Firefox on a laptop/desktop.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30, max: 30 }, cursor: 'always' } as any,
        audio: includeAudio,
      });

      streamRef.current = stream;
      isStreamingRef.current = true;
      frameCounterRef.current = 0;
      setFramesSent(0);

      const targetScreen = selectedScreen;
      const screenCode = targetScreen === 'window' ? 0 : targetScreen === 'frame' ? 1 : 2;

      // Ensure hidden video element exists
      let video = videoRef.current;
      if (!video) {
        video = document.createElement('video');
        video.id = 'grimoireHiddenMirrorVideo';
        video.style.position = 'fixed';
        video.style.top = '-9999px';
        video.style.left = '-9999px';
        video.style.width = '32px';
        video.style.height = '32px';
        video.style.opacity = '0.01';
        video.style.pointerEvents = 'none';
        video.style.zIndex = '-999';
        document.body.appendChild(video);
        videoRef.current = video;
      }

      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.srcObject = stream;

      await new Promise((resolve) => {
        if (video && video.videoWidth > 0) return resolve(null);
        if (video) video.onloadedmetadata = () => resolve(null);
        setTimeout(() => resolve(null), 800);
      });

      await video.play().catch((e) => console.warn('[Game Room] Video play warning:', e));

      // 1. Tell Server to initiate mirror stream mode on target display
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            action: 'START_MIRROR_STREAM',
            screen: targetScreen,
            options: {
              fit: fitMode,
              hide_overlays: !showOverlays,
            },
          })
        );
      }

      setActiveMirrorScreen(targetScreen);
      onNotification?.(`Screen mirroring live on ${getScreenName(targetScreen)}!`);

      // 2. Prepare offscreen canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let isSending = false;

      // 3. Worker ticker for steady 30 FPS even when tab is backgrounded
      const workerScript = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (!timer) timer = setInterval(function() { self.postMessage('tick'); }, 33);
          } else if (e.data === 'stop') {
            if (timer) { clearInterval(timer); timer = null; }
          }
        };
      `;
      const workerBlob = new Blob([workerScript], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(workerBlob);
      const tickerWorker = new Worker(workerUrl);
      workerRef.current = tickerWorker;

      // FPS tracking interval
      let lastFrameCheck = 0;
      fpsIntervalRef.current = setInterval(() => {
        const diff = frameCounterRef.current - lastFrameCheck;
        setFps(diff);
        lastFrameCheck = frameCounterRef.current;
      }, 1000);

      tickerWorker.onmessage = () => {
        if (!isStreamingRef.current || !video || !ctx) return;
        if (isSending) return; // Drop frame if previous is still transmitting

        const currentWs = wsRef.current;
        if (!currentWs || currentWs.readyState !== WebSocket.OPEN) return;
        if (currentWs.bufferedAmount > 128 * 1024) return; // Drop if network backpressure

        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (!vw || !vh) return;

        isSending = true;

        // Downscale to max 1920x1080 to maintain crisp text & high throughput
        const maxW = 1920;
        const maxH = 1080;
        const scale = Math.min(1, maxW / vw, maxH / vh);
        const drawW = Math.round(vw * scale);
        const drawH = Math.round(vh * scale);

        if (canvas.width !== drawW || canvas.height !== drawH) {
          canvas.width = drawW;
          canvas.height = drawH;
        }

        ctx.drawImage(video, 0, 0, drawW, drawH);

        canvas.toBlob(
          (blob) => {
            if (!blob || !isStreamingRef.current) {
              isSending = false;
              return;
            }

            blob.arrayBuffer().then((buf) => {
              const activeWs = wsRef.current;
              if (!activeWs || activeWs.readyState !== WebSocket.OPEN || !isStreamingRef.current) {
                isSending = false;
                return;
              }

              const uint8 = new Uint8Array(buf);
              const packet = new Uint8Array(4 + uint8.length);
              packet[0] = 0x4d; // 'M'
              packet[1] = 0x49; // 'I'
              packet[2] = 0x52; // 'R'
              packet[3] = screenCode;
              packet.set(uint8, 4);

              try {
                activeWs.send(packet.buffer);
                frameCounterRef.current++;
                setFramesSent(frameCounterRef.current);
              } catch (_) {}
              isSending = false;
            }).catch(() => {
              isSending = false;
            });
          },
          'image/jpeg',
          0.82
        );
      };

      tickerWorker.postMessage('start');

      // 4. Handle native "Stop Sharing" floating browser button
      const tracks = stream.getVideoTracks();
      if (tracks.length > 0) {
        tracks[0].onended = () => {
          handleStopMirror(targetScreen);
        };
      }
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        setStreamError(err.message || 'Failed to capture screen.');
      }
      cleanupStreaming();
      setActiveMirrorScreen(null);
    }
  };

  const handleStopMirror = async (screenToStop = activeMirrorScreen || selectedScreen) => {
    cleanupStreaming();

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'STOP_MIRROR', screen: screenToStop }));
    }

    try {
      await fetch(`${serverUrl}/api/mirror/stop-all`, { method: 'POST' });
    } catch (_) {}

    setActiveMirrorScreen(null);
    onNotification?.(`Mirroring stopped on ${getScreenName(screenToStop)}.`);
  };

  const handleStopAllMirrors = async () => {
    cleanupStreaming();

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'STOP_MIRROR', screen: 'all' }));
    }

    try {
      await fetch(`${serverUrl}/api/mirror/stop-all`, { method: 'POST' });
    } catch (_) {}

    setActiveMirrorScreen(null);
    onNotification?.('All room screen mirroring stopped. Displays restored.');
  };

  const getScreenName = (key: string) => {
    switch (key) {
      case 'table':
        return 'Tabletop Projector';
      case 'window':
        return '53" Window TV';
      case 'frame':
        return 'Picture Frame Monitor';
      default:
        return key;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full flex flex-col overflow-hidden shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#f16622]/20 border border-[#f16622]/40 flex items-center justify-center text-[#f16622]">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-fredoka text-lg font-bold text-white">
                Cast Screen or Window
              </h3>
              <p className="text-stone-300 text-xs">
                Stream your laptop screen directly to room displays over Wi-Fi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Mobile Warning Notice */}
          {(!isSupported || isMobileDevice) && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-amber-800">
                <Smartphone className="w-4 h-4 text-amber-700" />
                <span>Laptop / Desktop Feature</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-800">
                Screen and window casting requires a desktop or laptop browser (such as Chrome, Edge, Firefox, or Safari) connected to the makerspace Wi-Fi. Mobile OS browsers (iOS / Android) do not support screen broadcasting APIs.
              </p>
              <div className="text-[11px] text-amber-700 font-semibold flex items-center gap-1.5 pt-1">
                <Laptop className="w-3.5 h-3.5 text-amber-800" />
                <span>Log in to app.socialmedium.space on your laptop at the gaming table to cast your VTT or battlemaps!</span>
              </div>
            </div>
          )}

          {/* Active Casting Status Banner */}
          {activeMirrorScreen && (
            <div className="p-4 rounded-2xl bg-stone-900 text-white border border-emerald-500/50 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
                  <span className="font-bold text-xs uppercase tracking-wider text-emerald-400">
                    LIVE STREAMING ACTIVE
                  </span>
                </div>
                <span className="text-xs font-mono text-stone-300">
                  {fps} FPS • {framesSent} frames
                </span>
              </div>

              <div className="text-xs text-stone-200">
                Broadcasting your screen to{' '}
                <strong className="text-amber-400 font-semibold">
                  {getScreenName(activeMirrorScreen)}
                </strong>
                .
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleStopMirror(activeMirrorScreen)}
                  className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop Mirroring</span>
                </button>
                <button
                  type="button"
                  onClick={handleStopAllMirrors}
                  className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs cursor-pointer border border-stone-700 transition-colors"
                >
                  Stop All Displays
                </button>
              </div>
            </div>
          )}

          {/* Configuration Form (Only if supported on desktop) */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">
                Select Target Display:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Tabletop Projector */}
                <button
                  type="button"
                  onClick={() => setSelectedScreen('table')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    selectedScreen === 'table'
                      ? 'bg-[#344ea2] text-white border-[#344ea2] shadow-sm'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                  }`}
                >
                  <Map className="w-5 h-5 mb-2" />
                  <div>
                    <div className="font-bold text-xs">Table Projector</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        selectedScreen === 'table' ? 'text-white/80' : 'text-stone-500'
                      }`}
                    >
                      Tactical maps & VTT
                    </div>
                  </div>
                </button>

                {/* 53" Window TV */}
                <button
                  type="button"
                  onClick={() => setSelectedScreen('window')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    selectedScreen === 'window'
                      ? 'bg-[#344ea2] text-white border-[#344ea2] shadow-sm'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                  }`}
                >
                  <Tv className="w-5 h-5 mb-2" />
                  <div>
                    <div className="font-bold text-xs">53" Window TV</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        selectedScreen === 'window' ? 'text-white/80' : 'text-stone-500'
                      }`}
                    >
                      Landscape & weather
                    </div>
                  </div>
                </button>

                {/* Picture Frame */}
                <button
                  type="button"
                  onClick={() => setSelectedScreen('frame')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    selectedScreen === 'frame'
                      ? 'bg-[#344ea2] text-white border-[#344ea2] shadow-sm'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                  }`}
                >
                  <ImageIcon className="w-5 h-5 mb-2" />
                  <div>
                    <div className="font-bold text-xs">Picture Frame</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        selectedScreen === 'frame' ? 'text-white/80' : 'text-stone-500'
                      }`}
                    >
                      NPC art & handouts
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Mirror Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Fit Mode:
                </label>
                <select
                  value={fitMode}
                  onChange={(e) => setFitMode(e.target.value as 'contain' | 'cover')}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:outline-hidden focus:border-[#3bc0cd]"
                >
                  <option value="contain">Contain (Letterbox - No Cropping)</option>
                  <option value="cover">Cover (Fill Screen - Crop to edges)</option>
                </select>
              </div>

              <div className="flex flex-col justify-end space-y-2">
                <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOverlays}
                    onChange={(e) => setShowOverlays(e.target.checked)}
                    className="rounded border-stone-300 text-[#344ea2] focus:ring-[#344ea2]"
                  />
                  <span>Show Overlays (Grid / Window Frame)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAudio}
                    onChange={(e) => setIncludeAudio(e.target.checked)}
                    className="rounded border-stone-300 text-[#344ea2] focus:ring-[#344ea2]"
                  />
                  <span>Share Tab Audio (if available)</span>
                </label>
              </div>
            </div>

            {streamError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{streamError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold text-xs cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {activeMirrorScreen ? (
              <button
                type="button"
                onClick={() => handleStopMirror(activeMirrorScreen)}
                className="py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
              >
                <Square className="w-4 h-4" />
                <span>Stop Mirroring</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={!isSupported || isMobileDevice}
                onClick={handleStartMirror}
                className="py-2.5 px-5 rounded-xl bg-[#f16622] hover:bg-[#d55214] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                <span>Start Mirroring</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
