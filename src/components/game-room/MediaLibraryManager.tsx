'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Film,
  Map,
  Tv,
  Trash2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Check,
} from 'lucide-react';

interface MediaFile {
  name: string;
  url: string;
  size: number;
  modified?: number;
}

interface MediaLibraryManagerProps {
  serverUrl: string;
  wsRef: React.MutableRefObject<WebSocket | null>;
  onNotification?: (msg: string) => void;
}

export function MediaLibraryManager({
  serverUrl,
  wsRef,
  onNotification,
}: MediaLibraryManagerProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeCastNotice, setActiveCastNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchMediaList = async () => {
    setIsLoading(true);
    setUploadError(null);
    try {
      const res = await fetch(`${serverUrl}/api/media/list`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      } else {
        setUploadError(`Failed to fetch media library (HTTP ${res.status})`);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Cannot reach media server endpoint');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (serverUrl) {
      fetchMediaList();
    }
  }, [serverUrl]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${serverUrl}/api/media/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok') {
          onNotification?.(`Enchanted and uploaded '${file.name}'!`);
          fetchMediaList();
        } else {
          setUploadError('Upload failed: ' + (data.message || 'Unknown server response'));
        }
      } else {
        setUploadError(`Upload failed with HTTP ${res.status}`);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete '${filename}' from the game room library?`)) return;

    try {
      const res = await fetch(`${serverUrl}/api/media/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onNotification?.(`Deleted '${filename}' from server.`);
        fetchMediaList();
      } else {
        alert(`Failed to delete (HTTP ${res.status})`);
      }
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const castToDisplay = async (
    screen: 'table' | 'window' | 'frame',
    file: MediaFile
  ) => {
    const isVideo = file.name.match(/\.(mp4|webm)$/i);
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    let payload: any = {};
    if (screen === 'table') {
      payload = {
        type: 'map',
        title: cleanTitle,
        src: file.url,
        grid_enabled: true,
      };
    } else if (screen === 'window') {
      payload = {
        type: isVideo ? 'video' : 'image',
        title: cleanTitle,
        src: file.url,
      };
    } else if (screen === 'frame') {
      payload = {
        type: 'portrait',
        title: cleanTitle,
        src: file.url,
      };
    }

    // Try WebSocket first
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'SET_DISPLAY', screen, display: payload }));
    }

    // Also send POST endpoint
    try {
      await fetch(`${serverUrl}/api/display/${screen}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const displayLabel =
        screen === 'table' ? 'Tabletop Projector' : screen === 'window' ? '53" Window TV' : 'Picture Frame';
      setActiveCastNotice(`Casting '${cleanTitle}' onto ${displayLabel}!`);
      setTimeout(() => setActiveCastNotice(null), 3500);
      onNotification?.(`Casting '${cleanTitle}' to ${displayLabel}`);
    } catch (err: any) {
      console.warn('Cast error:', err);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold text-xs uppercase tracking-wider">
              Grimoire Storage
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              Developer Mode
            </span>
          </div>
          <h3 className="font-fredoka text-xl font-bold text-stone-900">
            Custom Art & Battlemap Library
          </h3>
          <p className="text-stone-500 text-xs">
            Upload custom battlemap images, encounter backdrops, or NPC portraits to cast to any room screen.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,video/mp4,video/webm"
            className="hidden"
          />

          <button
            type="button"
            onClick={fetchMediaList}
            disabled={isLoading}
            className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            title="Refresh library"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="py-2 px-4 rounded-xl bg-[#344ea2] hover:bg-[#2b4085] text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
          >
            <Upload className={`w-3.5 h-3.5 ${isUploading ? 'animate-bounce' : ''}`} />
            <span>{isUploading ? 'Uploading...' : 'Upload Media File'}</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {activeCastNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{activeCastNotice}</span>
        </div>
      )}

      {/* Media Grid */}
      {files.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-stone-300 rounded-2xl bg-stone-50/50">
          <Map className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <h4 className="font-bold text-sm text-stone-700 mb-1">
            No Custom Media Uploaded Yet
          </h4>
          <p className="text-stone-500 text-xs max-w-sm mx-auto mb-4">
            Upload JPG, PNG, WEBP battlemaps or MP4 atmospheric loops to project directly into the room.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-2 px-4 rounded-xl bg-[#344ea2] text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload First Map</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {files.map((file) => {
            const isVideo = file.name.match(/\.(mp4|webm)$/i);
            const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            const fullUrl = file.url.startsWith('http') ? file.url : `${serverUrl}${file.url}`;

            return (
              <div
                key={file.name}
                className="rounded-2xl border border-stone-200 bg-stone-900 text-white overflow-hidden shadow-xs hover:border-[#3bc0cd] transition-all flex flex-col justify-between"
              >
                {/* Media Preview Thumbnail */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  {isVideo ? (
                    <div className="flex flex-col items-center justify-center text-stone-400 gap-1">
                      <Film className="w-8 h-8 text-[#38bdf8]" />
                      <span className="text-[10px] uppercase font-mono tracking-wider">Video Loop</span>
                    </div>
                  ) : (
                    <img
                      src={fullUrl}
                      alt={cleanTitle}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}

                  <button
                    onClick={(e) => handleDeleteFile(file.name, e)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white transition-colors cursor-pointer"
                    title="Delete file from server"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* File Details */}
                <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h5
                      className="font-bold text-xs text-stone-100 truncate"
                      title={file.name}
                    >
                      {cleanTitle}
                    </h5>
                    <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                      {(file.size / 1024).toFixed(0)} KB
                    </div>
                  </div>

                  {/* Cast Actions */}
                  <div className="space-y-1.5 pt-2 border-t border-stone-800">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                      Quick Cast To:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => castToDisplay('table', file)}
                        className="py-1.5 px-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 font-semibold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="Cast to Overhead Table Projector"
                      >
                        <Map className="w-3 h-3" />
                        <span>Table</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => castToDisplay('window', file)}
                        className="py-1.5 px-2 rounded-lg bg-[#38bdf8]/30 hover:bg-[#38bdf8]/50 text-[#38bdf8] font-semibold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="Cast to 53-inch Window TV"
                      >
                        <Tv className="w-3 h-3" />
                        <span>Window</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => castToDisplay('frame', file)}
                        className="py-1.5 px-2 rounded-lg bg-amber-500/30 hover:bg-amber-500/50 text-amber-300 font-semibold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="Cast to Picture Frame Screen"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Frame</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
