'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  User,
  Plus,
  X,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { GameRoomMediaItem } from '@/lib/types';
import {
  fetchGameRoomMedia,
  uploadGameRoomMedia,
  deleteGameRoomMedia,
  normalizeNfcTapCard,
} from '@/lib/neon';

interface MediaLibraryManagerProps {
  serverUrl: string;
  wsRef: React.MutableRefObject<WebSocket | null>;
  onNotification?: (msg: string) => void;
  cardId?: string | null;
  userName?: string | null;
  isDevMode?: boolean;
}

export function MediaLibraryManager({
  serverUrl,
  wsRef,
  onNotification,
  cardId,
  userName,
  isDevMode = false,
}: MediaLibraryManagerProps) {
  const [items, setItems] = useState<GameRoomMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'map' | 'video' | 'portrait'>('all');

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadType, setUploadType] = useState<'map' | 'video' | 'portrait'>('map');
  const [uploadTargetScreen, setUploadTargetScreen] = useState<'table' | 'window' | 'frame'>('table');
  const [customUploaderName, setCustomUploaderName] = useState<string>('');
  const [customCardId, setCustomCardId] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Cast notifications
  const [activeCastNotice, setActiveCastNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cleanUserCard = useMemo(() => {
    return cardId ? normalizeNfcTapCard(cardId) || cardId : '';
  }, [cardId]);

  const loadMedia = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    try {
      const data = await fetchGameRoomMedia(undefined, forceRefresh);
      setItems(data);
    } catch (err: any) {
      console.warn('Error loading Game Room media:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia(false);
  }, []);

  // Filter items based on active tabs
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // User filter
      if (activeTab === 'mine') {
        const targetCard = cleanUserCard || customCardId.trim();
        if (!targetCard) return false;
        const normTarget = normalizeNfcTapCard(targetCard) || targetCard;
        const tokens = (item.cardId || '')
          .split(/[,;\s]+/)
          .map((t) => normalizeNfcTapCard(t.trim()) || t.trim());
        const matchesUser =
          tokens.includes(targetCard) ||
          tokens.includes(normTarget) ||
          item.cardId === targetCard ||
          item.cardId === normTarget;
        if (!matchesUser) return false;
      }

      // Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'video' && item.type !== 'video') return false;
        if (typeFilter === 'map' && item.type !== 'map') return false;
        if (typeFilter === 'portrait' && item.type !== 'portrait' && item.type !== 'image') return false;
      }

      return true;
    });
  }, [items, activeTab, typeFilter, cleanUserCard, customCardId]);

  // Handle file selection in modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setUploadError(null);

    // Auto-detect type
    const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm)$/i);
    if (isVideo) {
      setUploadType('video');
      setUploadTargetScreen('window');
    } else {
      setUploadType('map');
      setUploadTargetScreen('table');
    }

    // Default title from filename
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setUploadTitle(cleanName);

    // Generate local preview if image
    if (!isVideo) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadPreview(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select an image or video file.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const effectiveCardId = cleanUserCard || customCardId.trim() || 'guest';
          const effectiveName = userName || customUploaderName.trim() || (cleanUserCard ? 'Member' : 'Guest');

          const res = await uploadGameRoomMedia({
            cardId: effectiveCardId,
            uploaderName: effectiveName,
            title: uploadTitle.trim() || uploadFile.name,
            type: uploadType,
            targetScreen: uploadTargetScreen,
            fileData: base64Data,
            fileName: uploadFile.name,
            mimeType: uploadFile.type || 'image/jpeg',
          });

          if (res.success && res.item) {
            setItems((prev) => [res.item!, ...prev]);
            onNotification?.(`Enchanted and saved '${res.item.title}' to the cloud!`);
            setIsUploadModalOpen(false);
            setUploadFile(null);
            setUploadPreview(null);
            setUploadTitle('');
          } else {
            setUploadError(res.error || 'Upload failed. Please try again.');
          }
        } catch (err: any) {
          setUploadError(err.message || 'Error processing file.');
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        setUploadError('Failed to read file from your device.');
        setIsUploading(false);
      };

      reader.readAsDataURL(uploadFile);
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading file.');
      setIsUploading(false);
    }
  };

  const handleDeleteItem = async (item: GameRoomMediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete '${item.title}' from the cloud library?`)) return;

    try {
      const idToDelete = item.id || item.fileId;
      if (!idToDelete) return;

      const ok = await deleteGameRoomMedia(idToDelete);
      if (ok) {
        setItems((prev) => prev.filter((i) => (i.id || i.fileId) !== idToDelete));
        onNotification?.(`Deleted '${item.title}' from cloud database.`);
      } else {
        alert('Failed to delete media piece.');
      }
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const castToDisplay = async (
    screen: 'table' | 'window' | 'frame',
    item: GameRoomMediaItem
  ) => {
    const isVideo = item.type === 'video' || item.url.match(/\.(mp4|webm)$/i);
    const cleanTitle = item.title;

    let payload: any = {};
    if (screen === 'table') {
      payload = {
        type: 'map',
        title: cleanTitle,
        src: item.url,
        grid_enabled: true,
      };
    } else if (screen === 'window') {
      payload = {
        type: isVideo ? 'video' : 'image',
        title: cleanTitle,
        src: item.url,
      };
    } else if (screen === 'frame') {
      payload = {
        type: 'portrait',
        title: cleanTitle,
        src: item.url,
      };
    }

    // 1. Send via WebSocket if connected
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'SET_DISPLAY', screen, display: payload }));
    }

    // 2. Send via HTTP POST endpoint to Mini PC controller
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[#344ea2] font-bold text-xs uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Grimoire Cloud Media
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Cloud Synced
            </span>
            {isDevMode && (
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                Developer Mode
              </span>
            )}
          </div>
          <h3 className="font-fredoka text-xl font-bold text-stone-900 mt-1">
            Custom Battlemaps & Encounter Art
          </h3>
          <p className="text-stone-500 text-xs mt-0.5">
            Upload your own high-resolution battlemaps, atmospheric window videos, and NPC portraits to cast in the chamber.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadMedia(true)}
            disabled={isLoading}
            className="py-2.5 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            title="Refresh from cloud database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-[#344ea2] hover:bg-[#2b4085] text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Art</span>
          </button>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Main Tab: All vs Mine */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 border border-stone-200/60">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Chamber Art ({items.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mine')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'mine'
                ? 'bg-[#344ea2] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Uploads</span>
          </button>
        </div>

        {/* Sub-Filters: Type Filter */}
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-stone-200 text-stone-900'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('map')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
              typeFilter === 'map'
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Map className="w-3 h-3" />
            <span>Maps</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('video')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
              typeFilter === 'video'
                ? 'bg-[#38bdf8]/20 text-[#0284c7]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Tv className="w-3 h-3" />
            <span>Scenes</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('portrait')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
              typeFilter === 'portrait'
                ? 'bg-amber-100 text-amber-800'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>Portraits</span>
          </button>
        </div>
      </div>

      {/* Active notification */}
      {activeCastNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{activeCastNotice}</span>
        </div>
      )}

      {/* Media Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-stone-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#344ea2]" />
          <p className="text-xs font-semibold">Summoning chamber media from cloud...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-stone-300 rounded-2xl bg-stone-50/50">
          <Map className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <h4 className="font-bold text-sm text-stone-700 mb-1">
            {activeTab === 'mine' ? 'No Uploads by You Yet' : 'No Custom Media Found'}
          </h4>
          <p className="text-stone-500 text-xs max-w-sm mx-auto mb-4">
            {activeTab === 'mine'
              ? 'Upload battlemaps or atmosphere art linked to your member profile to project during your session.'
              : 'Be the first to upload an encounter battlemap or tavern portrait to the cloud!'}
          </p>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-[#344ea2] text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Your First Map</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isVideo = item.type === 'video' || item.url.match(/\.(mp4|webm)$/i);
            const canDelete =
              isDevMode ||
              (cleanUserCard && item.cardId && item.cardId.includes(cleanUserCard)) ||
              (customCardId && item.cardId && item.cardId.includes(customCardId.trim()));

            return (
              <div
                key={item.id || item.fileId || item.url}
                className="rounded-2xl border border-stone-200 bg-stone-900 text-white overflow-hidden shadow-xs hover:border-[#3bc0cd] transition-all flex flex-col justify-between group"
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
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  )}

                  {/* Badge indicating type */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-black/60 text-white border border-white/10">
                      {item.type}
                    </span>
                  </div>

                  {/* Delete button (owner or dev) */}
                  {canDelete && (
                    <button
                      onClick={(e) => handleDeleteItem(item, e)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white transition-colors cursor-pointer"
                      title="Delete from cloud database"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Details */}
                <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-stone-100 truncate" title={item.title}>
                      {item.title}
                    </h5>

                    <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1">
                      <span>{item.uploaderName ? `By ${item.uploaderName}` : 'Chamber Art'}</span>
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Quick Cast Buttons */}
                  <div className="space-y-1.5 pt-2 border-t border-stone-800">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                      Cast to Chamber Screen:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => castToDisplay('table', item)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                          item.targetScreen === 'table'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300'
                        }`}
                        title="Cast to Tabletop Projector (Battlemap)"
                      >
                        <Map className="w-3 h-3" />
                        <span>Table</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => castToDisplay('window', item)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                          item.targetScreen === 'window'
                            ? 'bg-[#0284c7] hover:bg-[#0369a1] text-white'
                            : 'bg-[#38bdf8]/30 hover:bg-[#38bdf8]/50 text-[#38bdf8]'
                        }`}
                        title="Cast to 53-inch Window TV"
                      >
                        <Tv className="w-3 h-3" />
                        <span>Window</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => castToDisplay('frame', item)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                          item.targetScreen === 'frame'
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-amber-500/30 hover:bg-amber-500/50 text-amber-300'
                        }`}
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

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h4 className="font-fredoka text-lg font-bold text-stone-900">
                  Upload Custom Art & Battlemap
                </h4>
                <p className="text-xs text-stone-500">
                  Media will be stored in Google Drive and linked to your profile in the database.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* File Input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Choose File (Image or Video)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  className="block w-full text-xs text-stone-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#344ea2]/10 file:text-[#344ea2] hover:file:bg-[#344ea2]/20 cursor-pointer border border-stone-200 rounded-xl p-2"
                  required
                />
              </div>

              {/* Preview */}
              {uploadPreview && (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-stone-200 bg-stone-900">
                  <img
                    src={uploadPreview}
                    alt="Upload Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Title / Name
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Forgotten Crypt Battlemap, Stormy Sea Loop"
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 text-xs text-stone-800 focus:outline-hidden focus:border-[#344ea2]"
                  required
                />
              </div>

              {/* Screen / Type Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUploadType('map');
                    setUploadTargetScreen('table');
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    uploadTargetScreen === 'table'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600 text-xs'
                  }`}
                >
                  <Map className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  <div className="text-xs">Table Map</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUploadType('video');
                    setUploadTargetScreen('window');
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    uploadTargetScreen === 'window'
                      ? 'border-[#0284c7] bg-sky-50 text-sky-900 font-bold'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600 text-xs'
                  }`}
                >
                  <Tv className="w-4 h-4 mx-auto mb-1 text-[#0284c7]" />
                  <div className="text-xs">Window TV</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUploadType('portrait');
                    setUploadTargetScreen('frame');
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    uploadTargetScreen === 'frame'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600 text-xs'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                  <div className="text-xs">Frame Art</div>
                </button>
              </div>

              {/* User Identity Info (if not logged in) */}
              {!cleanUserCard && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <span className="text-[11px] font-bold text-amber-900 block">
                    Link Upload to Your Member Account:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Your Name (e.g. Ben)"
                      value={customUploaderName}
                      onChange={(e) => setCustomUploaderName(e.target.value)}
                      className="py-1.5 px-2.5 rounded-lg border border-amber-300 text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Tap Card ID (e.g. 1423631962)"
                      value={customCardId}
                      onChange={(e) => setCustomCardId(e.target.value)}
                      className="py-1.5 px-2.5 rounded-lg border border-amber-300 text-xs bg-white"
                    />
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isUploading}
                  className="py-2.5 px-4 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="py-2.5 px-5 rounded-xl bg-[#344ea2] hover:bg-[#2b4085] text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Uploading to Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload & Link Art</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
