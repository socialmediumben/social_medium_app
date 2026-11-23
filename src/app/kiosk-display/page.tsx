'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  fetchKioskDisplaySettings,
  DEFAULT_KIOSK_DISPLAY_SETTINGS,
  NEON_PROXY_URL,
} from '@/lib/neon';
import { KioskDisplaySettings } from '@/lib/types';
import {
  Image as ImageIcon,
  Sparkles,
  QrCode,
  Clock,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

// Default vibrant showcase photos curated for Social Medium Makerspace
const DEFAULT_SHOWCASE_PHOTOS = [
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1920&q=80', // 3D printing & rapid prototyping
  'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1920&q=80', // Laser cutting & woodworking
  'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1920&q=80', // Electronics soldering & circuits
  'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1920&q=80', // Creative collaborative design
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1920&q=80', // Robotics & mechanical engineering
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1920&q=80', // Community workshop gathering
  'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1920&q=80', // Ceramic & artisan crafting
  'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=1920&q=80', // Digital fabrication CNC
];

export default function KioskDisplayPage() {
  const [settings, setSettings] = useState<KioskDisplaySettings>(DEFAULT_KIOSK_DISPLAY_SETTINGS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const cursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load and subscribe to live settings changes
  useEffect(() => {
    fetchKioskDisplaySettings().then(setSettings);

    const handleUpdate = (e: any) => {
      if (e.detail) setSettings(e.detail);
      else fetchKioskDisplaySettings().then(setSettings);
    };

    window.addEventListener('sm_kiosk_display_updated', handleUpdate);

    // Poll cloud settings every 15 seconds so changes made on admin phones sync automatically
    const pollInterval = setInterval(() => {
      fetchKioskDisplaySettings().then((fresh) => {
        setSettings((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(fresh)) {
            return fresh;
          }
          return prev;
        });
      });
    }, 15000);

    return () => {
      window.removeEventListener('sm_kiosk_display_updated', handleUpdate);
      clearInterval(pollInterval);
    };
  }, []);

  // Live Digital Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString([], {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine active photo list
  const activePhotos = useMemo(() => {
    if (settings.photoUrls && settings.photoUrls.length > 0) {
      return settings.photoUrls;
    }
    return DEFAULT_SHOWCASE_PHOTOS;
  }, [settings.photoUrls]);

  // If settings loaded but photoUrls is empty and an album URL is provided, fetch parsed photos dynamically
  useEffect(() => {
    if (
      settings.googlePhotosAlbumUrl &&
      (!settings.photoUrls || settings.photoUrls.length === 0)
    ) {
      const fetchParsed = async () => {
        try {
          const res = await fetch(
            `${NEON_PROXY_URL}/api/parse-google-photos?url=${encodeURIComponent(
              settings.googlePhotosAlbumUrl
            )}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.photos) && data.photos.length > 0) {
              setSettings((prev) => ({ ...prev, photoUrls: data.photos }));
            }
          }
        } catch (e) {
          console.warn('[Kiosk Display] Auto-parse fallback failed:', e);
        }
      };
      fetchParsed();
    }
  }, [settings.googlePhotosAlbumUrl, settings.photoUrls]);

  // Preload next image in sequence for instant smooth transition
  useEffect(() => {
    if (activePhotos.length > 1) {
      const nextIdx = (currentIndex + 1) % activePhotos.length;
      const nextImg = new Image();
      nextImg.src = activePhotos[nextIdx];
    }
  }, [currentIndex, activePhotos]);

  // Slideshow Timer Interval
  useEffect(() => {
    if (isPaused || activePhotos.length <= 1) return;

    const intervalMs = Math.max(3, settings.slideshowIntervalSeconds || 8) * 1000;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activePhotos.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPaused, activePhotos.length, settings.slideshowIntervalSeconds]);

  // Auto-hide mouse cursor after 3 seconds of inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setCursorVisible(true);
      if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current);
      cursorTimeoutRef.current = setTimeout(() => {
        setCursorVisible(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current);
    };
  }, []);

  // Direct Link mode redirect if specified
  useEffect(() => {
    if (
      settings.displayMode === 'direct-link' &&
      settings.googlePhotosAlbumUrl &&
      settings.googlePhotosAlbumUrl.startsWith('http')
    ) {
      window.location.replace(settings.googlePhotosAlbumUrl);
    }
  }, [settings.displayMode, settings.googlePhotosAlbumUrl]);

  return (
    <div
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-black select-none z-50 ${
        !cursorVisible ? 'cursor-none' : 'cursor-default'
      }`}
    >
      {/* Photo Layers with Transitions */}
      {activePhotos.map((photoUrl, idx) => {
        const isCurrent = idx === currentIndex;
        const isPrev =
          idx === (currentIndex - 1 + activePhotos.length) % activePhotos.length;

        // Skip rendering non-active photos to save memory
        if (!isCurrent && !isPrev) return null;

        const isKenBurns = settings.transitionEffect === 'ken-burns';
        const isSlide = settings.transitionEffect === 'slide';

        return (
          <div
            key={photoUrl + idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background blurred glow for vertical / non-standard aspect ratio photos */}
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-40 scale-110"
              style={{ backgroundImage: `url(${photoUrl})` }}
            />

            {/* Main Crisp Photo */}
            <div
              className={`w-full h-full bg-contain bg-center bg-no-repeat transition-transform ${
                isKenBurns && isCurrent ? 'animate-ken-burns' : ''
              } ${isSlide ? 'transition-all duration-700' : ''}`}
              style={{ backgroundImage: `url(${photoUrl})` }}
            />
          </div>
        );
      })}

      {/* Top Left Watermark: Makerspace Logo & Album Title */}
      {settings.showMakerspaceLogo && (
        <div className="absolute top-6 left-8 z-20 flex items-center gap-3.5 bg-black/45 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#344ea2] to-[#f16622] flex items-center justify-center text-white font-black text-lg shadow-md">
            SM
          </div>
          <div>
            <h1 className="text-white font-fredoka font-bold text-base leading-tight tracking-wide flex items-center gap-1.5">
              <span>{settings.albumTitle || 'Social Medium Makerspace'}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h1>
            <p className="text-stone-300 text-[11px] font-medium tracking-wider uppercase opacity-85">
              Community Showcase & Live Moments
            </p>
          </div>
        </div>
      )}

      {/* Top Right: Ambient Digital Clock & Date */}
      {settings.showTimeAndDate && (
        <div className="absolute top-6 right-8 z-20 flex flex-col items-end bg-black/45 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
          <div className="text-white font-mono font-bold text-lg sm:text-xl tracking-wider leading-none flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400 opacity-90" />
            <span>{currentTime}</span>
          </div>
          <div className="text-stone-300 text-[11px] font-medium mt-1 tracking-wide opacity-85">
            {currentDate}
          </div>
        </div>
      )}

      {/* Bottom Right: Visitor Welcome & Companion App QR Code */}
      {settings.showCompanionAppQr && (
        <div className="absolute bottom-6 right-8 z-20 flex items-center gap-3.5 bg-black/55 backdrop-blur-lg p-3.5 rounded-2xl border border-white/15 shadow-2xl max-w-xs">
          <div className="bg-white p-1.5 rounded-xl shrink-0 shadow-md">
            {/* Quick QR code pointing visitors to Companion App */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=0&data=${encodeURIComponent(
                'https://app.socialmedium.space'
              )}`}
              alt="Scan to join Social Medium"
              className="w-16 h-16 rounded-md"
            />
          </div>
          <div className="text-left">
            <div className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5" />
              <span>Explore The App</span>
            </div>
            <p className="text-white text-xs font-semibold leading-tight mt-0.5">
              Scan with your phone to check in & build your maker buddy!
            </p>
            <p className="text-stone-400 text-[10px] font-mono mt-1">
              app.socialmedium.space
            </p>
          </div>
        </div>
      )}

      {/* Subtle Progress Bar along bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
        <div
          className="h-full bg-gradient-to-r from-[#344ea2] to-[#f16622] transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / Math.max(1, activePhotos.length)) * 100}%`,
          }}
        />
      </div>

      {/* Embedded CSS for Ken Burns Cinematic Pan & Zoom Animation */}
      <style jsx global>{`
        @keyframes kenBurnsAnimation {
          0% {
            transform: scale(1) translate(0, 0);
          }
          50% {
            transform: scale(1.08) translate(-1%, -1%);
          }
          100% {
            transform: scale(1.15) translate(1%, 0.5%);
          }
        }
        .animate-ken-burns {
          animation: kenBurnsAnimation 20s infinite alternate ease-in-out;
        }
      `}</style>
    </div>
  );
}
