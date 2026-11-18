'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  RotateCcw,
  Download,
  Upload,
  Save,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Lock,
  Coins,
  ChevronRight,
  Info,
  X,
  AlertCircle,
  HelpCircle,
  Shirt,
  Crown,
  Smile,
  User,
  Wrench,
  Footprints,
  RefreshCw,
  Palette,
  Ban,
} from 'lucide-react';
import { BuddyConfig, BuddyItem, BuddyLayerCategory, MemberProfile } from '@/lib/types';
import {
  formatCategoryLabel,
  BUDDY_BASE_COLORS,
  BuddyColorChoice,
  isBuddyColorUnlocked,
  getAllBuddyItems,
  fetchBuddyItemsFromSheet,
  loadMemberBuddyConfig,
  loadMemberBuddyBucks,
  equipBuddyItem,
  unequipBuddyCategory,
  randomizeBuddy,
  purchaseBuddyItem,
  uploadBuddyArtItem,
  getMyPendingBuddyArtSubmissions,
  BuddyArtSubmissionRecord,
  GOOGLE_DRIVE_BUDDY_ART_FOLDER_URL,
  DEFAULT_CATEGORY_LAYER_ORDER,
  normalizeGoogleDriveUrl,
} from '@/lib/buddy';
import { updateMemberBuddyConfigInNeon } from '@/lib/neon';
import { BuddyCanvas } from './BuddyCanvas';

interface BuddyBuilderProps {
  member: MemberProfile | null;
  onBuddySaved?: (newConfig: BuddyConfig) => void;
}

const ACCESSORY_COLOR_PRESETS = [
  { name: 'Social Medium Cyan', hex: '#3bc0cd' },
  { name: 'Maker Orange', hex: '#f16622' },
  { name: 'Social Medium Navy', hex: '#344ea2' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Ink Black', hex: '#1c1917' },
  { name: 'Crimson Red', hex: '#ef4444' },
  { name: 'Sunshine Gold', hex: '#fbbf24' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Arcane Purple', hex: '#8b5cf6' },
  { name: 'Neon Coral', hex: '#f43f5e' },
  { name: 'Electric Sky', hex: '#0284c7' },
  { name: 'Sage Green', hex: '#8a9280' },
  { name: 'Maker Brown', hex: '#78350f' },
];

export const BuddyBuilder: React.FC<BuddyBuilderProps> = ({ member, onBuddySaved }) => {
  const accountId = member?.accountId || '';

  // Active Buddy Configuration State
  const [config, setConfig] = useState<BuddyConfig>(() =>
    loadMemberBuddyConfig(accountId, member?.buddyAvatar)
  );

  // Buddy Bucks Balance State
  const [buddyBucks, setBuddyBucks] = useState<number>(() =>
    loadMemberBuddyBucks(accountId, member?.buddyBucks)
  );

  // Active Category Tab: Defaults to the expanded "Body Color" palette
  const [activeCategory, setActiveCategory] = useState<BuddyLayerCategory>('body_color');

  // Item / Color Purchase Modal State
  const [pendingItem, setPendingItem] = useState<BuddyItem | null>(null);
  const [pendingColor, setPendingColor] = useState<BuddyColorChoice | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Save State & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Upload Custom Art Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [artName, setArtName] = useState('');
  const [artCategory, setArtCategory] = useState<string>('headwear');
  const [artDescription, setArtDescription] = useState('');
  const [artColorPicker, setArtColorPicker] = useState(false);
  const [artArtist, setArtArtist] = useState(() =>
    member?.preferredName || (member?.firstName ? `${member.firstName} ${member.lastName || ''}`.trim() : '')
  );
  const [artFile, setArtFile] = useState<File | null>(null);
  const [artPreviewUrl, setArtPreviewUrl] = useState<string | null>(null);
  const [isSubmittingArt, setIsSubmittingArt] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<{
    name: string;
    artist: string;
    xp: number;
    bucks: number;
  } | null>(null);
  const [pendingSubmissions, setPendingSubmissions] = useState<BuddyArtSubmissionRecord[]>([]);
  const [showPendingDrawer, setShowPendingDrawer] = useState(false);

  // Master Items Catalog
  const [items, setItems] = useState<BuddyItem[]>([]);

  useEffect(() => {
    setPendingSubmissions(getMyPendingBuddyArtSubmissions());
    const handleSubmissionsUpdated = () => {
      setPendingSubmissions(getMyPendingBuddyArtSubmissions());
    };
    window.addEventListener('sm_buddy_art_submitted', handleSubmissionsUpdated);
    return () => window.removeEventListener('sm_buddy_art_submitted', handleSubmissionsUpdated);
  }, []);

  const openUploadModal = () => {
    setUploadError(null);
    setUploadSuccess(null);
    setArtName('');
    setArtCategory('headwear');
    setArtDescription('');
    setArtColorPicker(false);
    setArtFile(null);
    setArtPreviewUrl(null);
    setArtArtist(
      member?.preferredName || (member?.firstName ? `${member.firstName} ${member.lastName || ''}`.trim() : '') || 'Maker Community'
    );
    setIsUploadModalOpen(true);
  };

  const handleArtFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.png') && file.type !== 'image/png') {
      setUploadError('Please select a PNG file (.png) with a transparent background.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Artwork file must be under 5MB.');
      return;
    }

    setUploadError(null);
    setArtFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setArtPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleArtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artName.trim()) {
      setUploadError('Please give your artwork a name.');
      return;
    }
    if (!artPreviewUrl) {
      setUploadError('Please select a transparent PNG image file of your artwork.');
      return;
    }

    setIsSubmittingArt(true);
    setUploadError(null);

    try {
      // Submit artwork with creator-selected category and default standard price for spreadsheet
      const res = await uploadBuddyArtItem({
        name: artName.trim(),
        category: artCategory.trim() || 'headwear',
        description: artDescription.trim() || undefined,
        artist: artArtist.trim() || 'Maker Community',
        price: 25,    // Default 25 BB price for spreadsheet review
        zIndex: 50,   // Handled by category layer manager
        imageBase64: artPreviewUrl,
        accountId: member?.accountId,
        colorPicker: artColorPicker,
      });

      if (res.success) {
        setBuddyBucks((prev) => prev + (res.bucksAwarded || 10));
        setPendingSubmissions(getMyPendingBuddyArtSubmissions());
        setUploadSuccess({
          name: artName.trim(),
          artist: artArtist.trim() || 'Maker Community',
          xp: res.xpAwarded || 20,
          bucks: res.bucksAwarded || 10,
        });
      } else {
        setUploadError(res.error || 'Failed to submit art. Please try again.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'An unexpected error occurred during submission.');
    } finally {
      setIsSubmittingArt(false);
    }
  };

  useEffect(() => {
    setItems(getAllBuddyItems());
    fetchBuddyItemsFromSheet().then((sheetItems) => {
      if (sheetItems && sheetItems.length > 0) {
        setItems(sheetItems);
      }
    }).catch(() => {});

    const handleCatalogUpdate = () => {
      setItems(getAllBuddyItems());
    };
    window.addEventListener('sm_buddy_catalog_updated', handleCatalogUpdate);
    return () => window.removeEventListener('sm_buddy_catalog_updated', handleCatalogUpdate);
  }, []);

  // Dynamically extract categories from Google Sheet; hide Base Body tab & prepend "Body Color"
  const categories = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number; zIndex: number }>();
    items.forEach((item) => {
      const cat = item.category || 'other';
      if (cat === 'base_body') return; // Do not show Base Body tab, character always wears default body
      if (!map.has(cat)) {
        map.set(cat, {
          id: cat,
          label: formatCategoryLabel(cat),
          count: 0,
          zIndex: item.zIndex || 50,
        });
      }
      map.get(cat)!.count++;
    });
    const sheetCategories = Array.from(map.values()).sort((a, b) => a.zIndex - b.zIndex);
    return [
      {
        id: 'body_color',
        label: 'Body Color',
        count: BUDDY_BASE_COLORS.length,
        zIndex: 5,
      },
      ...sheetCategories,
    ];
  }, [items]);

  // Ensure active category is valid when categories change
  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.id === activeCategory)) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const handleLiveSheetSync = async () => {
    setIsSyncingSheet(true);
    try {
      const sheetItems = await fetchBuddyItemsFromSheet();
      if (sheetItems && sheetItems.length > 0) {
        setItems(sheetItems);
      } else {
        setItems(getAllBuddyItems());
      }
    } catch (_) {}
    finally {
      setIsSyncingSheet(false);
    }
  };

  // Track last accountId so we only reset config if the active user account actually changes
  const lastLoadedAccountIdRef = useRef<string | undefined>(member?.accountId);

  // Sync state ONLY if active account changes (e.g. login/switch profile)
  useEffect(() => {
    if (member?.accountId && member.accountId !== lastLoadedAccountIdRef.current) {
      lastLoadedAccountIdRef.current = member.accountId;
      setConfig(loadMemberBuddyConfig(member.accountId, member.buddyAvatar));
      setBuddyBucks(loadMemberBuddyBucks(member.accountId, member.buddyBucks));
    } else if (member?.buddyBucks !== undefined) {
      // Keep buddy bucks updated without touching in-progress avatar config
      setBuddyBucks(loadMemberBuddyBucks(member?.accountId, member?.buddyBucks));
    }
  }, [member?.accountId, member?.buddyBucks]);

  // Auto-sync configuration to localStorage & Neon One whenever config changes
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveSeqRef = useRef<number>(0);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (!accountId) return;

    // Immediately persist to localStorage so local changes are never lost
    const configStr = JSON.stringify(config);
    try {
      localStorage.setItem(`sm_buddy_avatar_${accountId}`, configStr);
    } catch (_) {}

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const currentSeq = ++saveSeqRef.current;

    // Debounce remote CRM API call by 1500ms so rapid clicks or "Surprise Me" don't queue conflicting network requests
    saveTimeoutRef.current = setTimeout(() => {
      updateMemberBuddyConfigInNeon(accountId, configStr)
        .then((res) => {
          // Discard response if a newer change was triggered while this request was in flight
          if (currentSeq !== saveSeqRef.current) return;
          if (res.success && onBuddySaved) {
            onBuddySaved(config);
          }
        })
        .catch(() => {});
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [config, accountId, onBuddySaved]);

  // Filter items by current active category (body_color renders custom palette)
  const categoryItems = useMemo(() => {
    if (activeCategory === 'body_color') return [];
    return items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  // Total equipped items count
  const equippedCount = useMemo(() => {
    return Object.values(config.equipped || {}).filter(Boolean).length;
  }, [config.equipped]);

  // Handle Equipping / Unequipping
  const handleItemClick = (item: BuddyItem) => {
    const isUnlocked = config.unlockedItemIds.includes(item.id) || item.price === 0;

    if (!isUnlocked) {
      setPendingItem(item);
      setPendingColor(null);
      setPurchaseError(null);
      return;
    }

    // Toggle unequip if already equipped (except base_body)
    if (config.equipped?.[item.category] === item.id) {
      if (item.category !== 'base_body') {
        const nextEquipped = { ...config.equipped };
        delete nextEquipped[item.category];
        setConfig((prev) => ({
          ...prev,
          equipped: nextEquipped,
          updatedAt: new Date().toISOString(),
        }));
      }
      return;
    }

    // Equip item
    let updated = equipBuddyItem(config, item);
    if (item.colorPicker) {
      const existingColor = updated.equippedColors?.[item.category] || updated.equippedColors?.[item.id];
      if (!existingColor) {
        const defaultColor = BUDDY_BASE_COLORS.find((c) => c.id === updated.baseColor)?.hex || '#3bc0cd';
        updated = {
          ...updated,
          equippedColors: {
            ...(updated.equippedColors || {}),
            [item.category]: defaultColor,
            [item.id]: defaultColor,
          },
        };
      }
    }
    setConfig(updated);
  };

  // Unequip item from a specific category ("None" option)
  const handleUnequipCategory = (category: string) => {
    const nextEquipped = { ...config.equipped };
    delete nextEquipped[category];
    const nextColors = { ...(config.equippedColors || {}) };
    delete nextColors[category];
    setConfig((prev) => ({
      ...prev,
      equipped: nextEquipped,
      equippedColors: nextColors,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Handle Custom Accessory Color Change for items with colorPicker enabled
  const handleAccessoryColorChange = (itemOrCat: BuddyItem | string, hexColor: string) => {
    const category = typeof itemOrCat === 'string' ? itemOrCat : itemOrCat.category;
    const itemId = typeof itemOrCat === 'string' ? itemOrCat : itemOrCat.id;
    setConfig((prev) => ({
      ...prev,
      equippedColors: {
        ...(prev.equippedColors || {}),
        [category]: hexColor,
        [itemId]: hexColor,
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  // Handle Base Color Change
  const handleColorChange = (colorId: string) => {
    const currentBase = config.equipped?.base_body;
    const baseItem =
      currentBase &&
      !['body_orange', 'body_cyan', 'body_blue', 'default_body'].includes(currentBase)
        ? currentBase
        : items.find((i) => i.category === 'base_body')?.id || 'sheet_1_basic_buddy';

    const updated: BuddyConfig = {
      ...config,
      baseColor: colorId,
      equipped: {
        ...config.equipped,
        base_body: baseItem,
      },
      updatedAt: new Date().toISOString(),
    };
    setConfig(updated);
  };

  // Handle Color Selection or Purchase Prompt
  const handleColorClick = (color: BuddyColorChoice) => {
    const isUnlocked = isBuddyColorUnlocked(color.id, config);
    if (!isUnlocked) {
      setPendingColor(color);
      setPendingItem(null);
      setPurchaseError(null);
      return;
    }
    handleColorChange(color.id);
  };

  // Confirm Purchase with Buddy Bucks (for Item or Color)
  const handleConfirmPurchase = async () => {
    if (pendingColor) {
      setIsPurchasing(true);
      setPurchaseError(null);
      const res = await purchaseBuddyItem(
        accountId,
        pendingColor.id,
        pendingColor.price || 10,
        config,
        buddyBucks
      );
      setIsPurchasing(false);
      if (res.success) {
        setBuddyBucks(res.newBalance);
        const updatedConfig: BuddyConfig = {
          ...res.newConfig,
          baseColor: pendingColor.id,
        };
        setConfig(updatedConfig);
        setPendingColor(null);
      } else {
        setPurchaseError(res.error || 'Failed to unlock color.');
      }
      return;
    }

    if (!pendingItem) return;
    setIsPurchasing(true);
    setPurchaseError(null);

    const res = await purchaseBuddyItem(
      accountId,
      pendingItem.id,
      pendingItem.price,
      config,
      buddyBucks
    );

    setIsPurchasing(false);

    if (res.success) {
      setBuddyBucks(res.newBalance);
      // Auto-equip the newly purchased item!
      let equipped = equipBuddyItem(res.newConfig, pendingItem);
      if (pendingItem.colorPicker) {
        const defaultColor = BUDDY_BASE_COLORS.find((c) => c.id === equipped.baseColor)?.hex || '#3bc0cd';
        equipped = {
          ...equipped,
          equippedColors: {
            ...(equipped.equippedColors || {}),
            [pendingItem.category]: defaultColor,
            [pendingItem.id]: defaultColor,
          },
        };
      }
      setConfig(equipped);
      setPendingItem(null);
    } else {
      setPurchaseError(res.error || 'Failed to purchase item.');
    }
  };

  // Randomize Buddy (Free & unlocked items only, using active catalog)
  const handleRandomize = () => {
    const randomized = randomizeBuddy(config, true, items);
    setConfig(randomized);
  };

  // Clear Clothes (Bare Mascot)
  const handleClearClothes = () => {
    const baseItem =
      items.find((i) => i.category === 'base_body')?.id || 'sheet_1_basic_buddy';
    const firstMouth =
      items.find((i) => i.category === 'mouth')?.id || config.equipped?.mouth;
    const cleared: BuddyConfig = {
      ...config,
      equipped: {
        base_body: baseItem,
        ...(firstMouth ? { mouth: firstMouth } : {}),
      },
      updatedAt: new Date().toISOString(),
    };
    setConfig(cleared);
  };

  // Save to Profile & Neon One
  const handleSaveToProfile = async () => {
    setIsSaving(true);
    setSaveError(null);

    const res = await updateMemberBuddyConfigInNeon(accountId, JSON.stringify(config));
    setIsSaving(false);

    if (res.success) {
      setSaveSuccess(true);
      if (onBuddySaved) onBuddySaved(config);
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      setSaveError(res.error || 'Saved locally, but failed to sync to Neon One.');
    }
  };

  // Category Icon Resolver
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'User':
        return <User className="w-4 h-4" />;
      case 'Smile':
        return <Smile className="w-4 h-4" />;
      case 'Crown':
        return <Crown className="w-4 h-4" />;
      case 'Shirt':
        return <Shirt className="w-4 h-4" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4" />;
      case 'Wrench':
        return <Wrench className="w-4 h-4" />;
      case 'Footprints':
        return <Footprints className="w-4 h-4" />;
      default:
        return <Shirt className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Currency Balance */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-stone-900 via-indigo-950 to-stone-900 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold uppercase tracking-wider">
              Profile Avatar Studio
            </span>
            <span className="text-stone-400 text-xs">v1.0</span>
          </div>
          <h2 className="font-fredoka text-2xl font-bold tracking-tight text-white mt-1">
            Buddy Builder
          </h2>
          <p className="text-stone-300 text-xs mt-0.5 max-w-md">
            Customize your Social Medium mascot avatar. Layer hats, outfits, capes, and tools to
            express your maker identity across the space!
          </p>
        </div>

        {/* In-App Currency Wallet Pill */}
        <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
            🪙
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Your Wallet
            </div>
            <div className="text-lg font-black text-white leading-none mt-0.5">
              {buddyBucks} <span className="text-xs font-bold text-amber-200">Buddy Bucks</span>
            </div>
            <div className="text-[10px] text-stone-300 mt-0.5">
              Earn more by leveling up XP!
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Buddy avatar successfully saved to your profile and synced!</span>
          </div>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 2. Studio Workspace Grid: Preview Stage (Left) & Wardrobe Rack (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / CENTER: Character Canvas & Actions (5 Columns on Desktop) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col items-center text-center space-y-4">
          <div className="w-full flex items-center justify-between text-xs font-semibold text-stone-500 pb-2 border-b border-stone-100">
            <span>Live Avatar Preview</span>
            <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px]">
              {equippedCount} {equippedCount === 1 ? 'Layer' : 'Layers'} Active
            </span>
          </div>

          {/* Interactive Character Pedestal */}
          <div className="w-full max-w-[340px] aspect-square rounded-2xl bg-gradient-to-b from-stone-50 via-cyan-50/20 to-stone-100/60 border border-stone-200 flex items-center justify-center p-4 relative overflow-hidden group">
            {/* Ambient Background Grid Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />

            {/* Character Renderer */}
            <BuddyCanvas config={config} items={items} size={280} className="relative z-10" />
          </div>

          {/* Primary Action Controls */}
          <div className="w-full space-y-2.5 pt-2">
            <button
              type="button"
              onClick={handleSaveToProfile}
              disabled={isSaving}
              className="w-full py-3 px-4 rounded-2xl bg-[#344ea2] hover:bg-[#2a3f85] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving to Profile...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Buddy to Profile</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleRandomize}
                className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                title="Equip random unlocked clothes"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Surprise Me!</span>
              </button>

              <button
                type="button"
                onClick={handleClearClothes}
                className="py-2.5 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                title="Reset to unclothed mascot"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Bare Buddy</span>
              </button>
            </div>

            {/* Quick Active Body Color Indicator */}
            <div className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl bg-stone-50 border border-stone-200 text-xs">
              <span className="text-stone-500 font-medium">Body Color:</span>
              <button
                type="button"
                onClick={() => setActiveCategory('body_color')}
                className="flex items-center gap-1.5 font-bold text-stone-800 hover:text-[#344ea2] transition-colors cursor-pointer"
                title="Customize Body Color"
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full ${
                    (BUDDY_BASE_COLORS.find((c) => c.id === config.baseColor || (c.id === 'navy' && config.baseColor === 'dark-blue'))?.hex || '#3bc0cd').toLowerCase() === '#ffffff'
                      ? 'border border-stone-300'
                      : 'border border-white shadow-2xs'
                  }`}
                  style={{
                    backgroundColor:
                      BUDDY_BASE_COLORS.find((c) => c.id === config.baseColor || (c.id === 'navy' && config.baseColor === 'dark-blue'))?.hex || '#3bc0cd',
                  }}
                />
                <span>
                  {BUDDY_BASE_COLORS.find((c) => c.id === config.baseColor || (c.id === 'navy' && config.baseColor === 'dark-blue'))?.name || 'Cyan'}
                </span>
                <span className="text-[10px] text-stone-400">&rarr;</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Wardrobe Rack (7 Columns on Desktop) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
          {/* Category Tabs / Pills */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-2">Wardrobe Rack</label>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="text-xs font-bold text-stone-700">Wardrobe Categories</label>
              
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* 1. Download Basic Body PNG Template */}
                <a
                  href="/buddies/basic_buddy.png"
                  download="basic_buddy_template.png"
                  className="text-[11px] font-bold text-stone-700 hover:text-stone-900 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 hover:bg-stone-200 transition-colors shadow-2xs"
                  title="Download the official Basic Buddy PNG template to draw matching accessories & costumes"
                >
                  <Download className="w-3 h-3 text-stone-600" />
                  <span>Download Template</span>
                </a>

                {/* 2. Upload Custom Art Button (+20 XP, 10 BB) */}
                <button
                  type="button"
                  onClick={openUploadModal}
                  className="text-[11px] font-bold text-white flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:to-amber-600 shadow-xs transition-all cursor-pointer"
                  title="Submit custom drawn PNG art for Buddy Builder (+20 XP & 10 Buddy Bucks!)"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload Art</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[9px] font-mono tracking-tight font-black">
                    +20 XP
                  </span>
                </button>

                {/* 3. Sync Sheet Button */}
                <button
                  type="button"
                  onClick={handleLiveSheetSync}
                  disabled={isSyncingSheet}
                  className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                  title="Sync newest items from Google Sheet"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingSheet ? 'animate-spin' : ''}`} />
                  <span>{isSyncingSheet ? 'Syncing...' : 'Sync Sheet'}</span>
                </button>

                {/* 4. Pending Submissions Pill (if user has pending submissions) */}
                {pendingSubmissions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPendingDrawer((prev) => !prev)}
                    className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                    title="View your pending art submissions"
                  >
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>{pendingSubmissions.length} Pending</span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                const hasEquipped = config.equipped?.[cat.id] !== undefined;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-[#344ea2] text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'
                    }`}>
                      {cat.count}
                    </span>
                    {hasEquipped && cat.id !== 'base_body' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Equipped" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION A: EXPANDED BODY COLOR PALETTE */}
          {activeCategory === 'body_color' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-[#344ea2]" />
                    <span className="text-xs font-bold text-stone-800">Body Color Palette</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Official Social Medium brand colors are free for all members. Unlock artist & maker shades for 10 🪙 Buddy Bucks!
                  </p>
                </div>
                <div className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full self-start sm:self-auto shrink-0">
                  {BUDDY_BASE_COLORS.filter((c) => isBuddyColorUnlocked(c.id, config)).length} / {BUDDY_BASE_COLORS.length} Unlocked
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {BUDDY_BASE_COLORS.map((col) => {
                  const isSelected =
                    config.baseColor === col.id ||
                    (col.id === 'navy' && config.baseColor === 'dark-blue');
                  const isUnlocked = isBuddyColorUnlocked(col.id, config);
                  const isWhite = col.hex.toLowerCase() === '#ffffff';

                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => handleColorClick(col)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer relative group ${
                        isSelected
                          ? 'border-[#344ea2] bg-[#344ea2]/5 ring-2 ring-[#344ea2]/25 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/80 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2 w-full">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105 ${
                            isWhite ? 'border border-stone-300' : 'border-2 border-white'
                          }`}
                          style={{ backgroundColor: col.hex }}
                        >
                          {isSelected && (
                            <Check
                              className={`w-5 h-5 drop-shadow-sm ${
                                isWhite ? 'text-stone-900' : 'text-white'
                              }`}
                            />
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {col.isStarter ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Free Brand
                            </span>
                          ) : isUnlocked ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600">
                              Unlocked
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 border border-amber-200">
                              <Lock className="w-2.5 h-2.5 text-amber-600" />
                              <span>{col.price || 10} BB</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-stone-800 leading-tight">
                            {col.name}
                          </span>
                        </div>
                        {col.description && (
                          <p className="text-[10px] text-stone-400 line-clamp-1">
                            {col.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION B: ITEMS GRID (FOR ALL OTHER CATEGORIES) */}
          {activeCategory !== 'body_color' && (() => {
            const activeEquippedItemId = config.equipped[activeCategory];
            const activeEquippedItem = activeEquippedItemId
              ? items.find((i) => i.id === activeEquippedItemId)
              : null;
            // Active tintable item: either the currently equipped tintable item, OR any item in this category with colorPicker
            const tintableItem = (activeEquippedItem?.colorPicker ? activeEquippedItem : null) || categoryItems.find((i) => i.colorPicker) || null;
            const isTintableEquipped = !!(tintableItem && config.equipped[tintableItem.category] === tintableItem.id);
            const currentAccessoryColor =
              (tintableItem && config.equippedColors && (config.equippedColors[tintableItem.category] || config.equippedColors[tintableItem.id])) ||
              '#ffffff';

            return (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">
                    {categories.find((c) => c.id === activeCategory)?.label || formatCategoryLabel(activeCategory)}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'} available
                  </span>
                </div>

                {/* Active Color Tint Picker for Tintable Item in this category */}
                {tintableItem && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-stone-50 border border-amber-200/80 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-5 h-5 rounded-full border border-stone-300 shadow-xs shrink-0"
                          style={{ backgroundColor: currentAccessoryColor }}
                        />
                        <div className="text-xs font-bold text-stone-900 truncate">
                          Pick Color for <span className="text-orange-600 font-extrabold">{tintableItem.name}</span>
                          {!isTintableEquipped && (
                            <span className="ml-1 text-[10px] text-stone-500 font-normal">(Click a color to equip)</span>
                          )}
                        </div>
                      </div>
                      <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-stone-200 text-[11px] font-bold text-stone-700 hover:bg-stone-50 cursor-pointer shadow-xs transition-colors shrink-0">
                        <Palette className="w-3.5 h-3.5 text-orange-500" />
                        <span>Custom Hex</span>
                        <input
                          type="color"
                          value={currentAccessoryColor.startsWith('#') ? currentAccessoryColor : '#ffffff'}
                          onChange={(e) => {
                            handleAccessoryColorChange(tintableItem, e.target.value);
                            if (!isTintableEquipped && (config.unlockedItemIds.includes(tintableItem.id) || tintableItem.price === 0)) {
                              handleItemClick(tintableItem);
                            }
                          }}
                          className="w-0 h-0 opacity-0 absolute pointer-events-none"
                        />
                      </label>
                    </div>

                    {/* Color Palette Swatches */}
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      {ACCESSORY_COLOR_PRESETS.map((swatch) => {
                        const isCurrent = currentAccessoryColor.toLowerCase() === swatch.hex.toLowerCase();
                        const isLight = ['#ffffff', '#fff', '#fefefe', '#fbbf24'].includes(swatch.hex.toLowerCase());
                        return (
                          <button
                            key={swatch.hex}
                            type="button"
                            onClick={() => {
                              handleAccessoryColorChange(tintableItem, swatch.hex);
                              if (!isTintableEquipped && (config.unlockedItemIds.includes(tintableItem.id) || tintableItem.price === 0)) {
                                handleItemClick(tintableItem);
                              }
                            }}
                            title={swatch.name}
                            className={`w-7 h-7 rounded-xl border-2 transition-all hover:scale-110 flex items-center justify-center cursor-pointer ${
                              isCurrent ? 'border-stone-900 scale-105 shadow-xs ring-2 ring-orange-500/40' : 'border-white shadow-xs'
                            }`}
                            style={{ backgroundColor: swatch.hex }}
                          >
                            {isCurrent && (
                              <Check className={`w-3.5 h-3.5 ${isLight ? 'text-stone-900' : 'text-white'}`} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Option 1: "None" / Unequip option for this category */}
                  {(() => {
                    const isNoneActive = !config.equipped[activeCategory];
                    return (
                      <div
                        onClick={() => handleUnequipCategory(activeCategory)}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer relative group ${
                          isNoneActive
                            ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'border-dashed border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {/* Equipped Indicator Badge */}
                        {isNoneActive && (
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[9px] uppercase tracking-wider flex items-center gap-0.5 shadow-xs">
                            <Check className="w-2.5 h-2.5" /> Equipped
                          </span>
                        )}

                        {/* Thumbnail Icon Preview */}
                        <div className="w-full aspect-square rounded-xl bg-stone-100/60 flex items-center justify-center p-2 mb-2 overflow-hidden relative">
                          <Ban className={`w-10 h-10 transition-transform group-hover:scale-110 ${isNoneActive ? 'text-emerald-500' : 'text-stone-300'}`} />
                        </div>

                        {/* Item Details */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-stone-900 leading-tight">
                              None
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-400 line-clamp-1 leading-snug">
                            Unequip {categories.find((c) => c.id === activeCategory)?.label || 'item'}
                          </p>

                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-600">
                              Default
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {categoryItems.map((item) => {
                      const isEquipped = config.equipped[item.category] === item.id;
                      const isUnlocked = config.unlockedItemIds.includes(item.id) || item.price === 0;

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer relative group ${
                            isEquipped
                              ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                              : isUnlocked
                              ? 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                              : 'border-stone-200 bg-stone-50/60 opacity-85 hover:opacity-100 hover:border-amber-300'
                          }`}
                        >
                          {/* Equipped Indicator Badge */}
                          {isEquipped && (
                            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[9px] uppercase tracking-wider flex items-center gap-0.5 shadow-xs">
                              <Check className="w-2.5 h-2.5" /> Equipped
                            </span>
                          )}

                          {/* Thumbnail / Image Preview */}
                          <div className="w-full aspect-square rounded-xl bg-stone-100/60 flex items-center justify-center p-2 mb-2 overflow-hidden relative">
                            {item.assetUrl ? (() => {
                              const cleanUrl = normalizeGoogleDriveUrl(item.assetUrl);
                              return item.colorPicker ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                  <div
                                    className="absolute inset-0 w-full h-full transition-colors duration-200"
                                    style={{
                                      backgroundColor: isEquipped
                                        ? (config.equippedColors?.[item.category] || config.equippedColors?.[item.id] || '#ffffff')
                                        : '#3bc0cd',
                                      WebkitMaskImage: `url(${cleanUrl})`,
                                      maskImage: `url(${cleanUrl})`,
                                      WebkitMaskSize: 'contain',
                                      maskSize: 'contain',
                                      WebkitMaskRepeat: 'no-repeat',
                                      maskRepeat: 'no-repeat',
                                      WebkitMaskPosition: 'center',
                                      maskPosition: 'center',
                                    }}
                                  />
                                  <img
                                    src={cleanUrl}
                                    alt={item.name}
                                    className="absolute inset-0 w-full h-full object-contain pointer-events-none group-hover:scale-105 transition-transform"
                                    style={{ mixBlendMode: 'multiply' }}
                                  />
                                </div>
                              ) : (
                                <img
                                  src={cleanUrl}
                                  alt={item.name}
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                />
                              );
                            })() : (
                              <div className="text-xs text-stone-400 font-medium">Preview</div>
                            )}
                          </div>

                          {/* Item Details */}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-stone-900 leading-tight">
                                {item.name}
                              </span>
                              {item.colorPicker && (
                                <span className="px-1.5 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-orange-700 font-bold text-[9px] flex items-center gap-0.5">
                                  <Palette className="w-2.5 h-2.5 text-orange-500" /> Colorable
                                </span>
                              )}
                            </div>
                            {item.artist && (
                              <div className="text-[10px] text-orange-600 font-semibold mt-0.5 truncate flex items-center gap-1">
                                <span className="text-[11px]">🎨</span>
                                <span className="truncate">by {item.artist}</span>
                              </div>
                            )}
                            {item.description && (
                              <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Price Tag / Lock Status & Color Picker */}
                          <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between text-[11px] gap-1">
                            {item.price === 0 ? (
                              <span className="text-emerald-700 font-bold">Free</span>
                            ) : isUnlocked ? (
                              <span className="text-stone-500 font-medium">Unlocked</span>
                            ) : (
                              <span className="text-amber-800 font-bold flex items-center gap-1">
                                <Lock className="w-3 h-3 text-amber-600" />
                                <span>{item.price} 🪙 BB</span>
                              </span>
                            )}

                            {/* Color Picker trigger button right on card */}
                            {item.colorPicker && (
                              <label
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 font-bold text-[10px] hover:bg-orange-100 cursor-pointer transition-colors shadow-2xs shrink-0"
                                title="Click to choose custom hex color"
                              >
                                <div
                                  className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0"
                                  style={{
                                    backgroundColor:
                                      config.equippedColors?.[item.category] ||
                                      config.equippedColors?.[item.id] ||
                                      '#ffffff',
                                  }}
                                />
                                <span>Color</span>
                                <input
                                  type="color"
                                  value={config.equippedColors?.[item.category] || config.equippedColors?.[item.id] || '#ffffff'}
                                  onChange={(e) => {
                                    handleAccessoryColorChange(item, e.target.value);
                                    if (!isEquipped && isUnlocked) {
                                      handleItemClick(item);
                                    }
                                  }}
                                  className="w-0 h-0 opacity-0 absolute pointer-events-none"
                                />
                              </label>
                            )}
                          </div>

                          {/* Quick Color Swatches directly on item card */}
                          {item.colorPicker && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 pt-2 flex-wrap"
                            >
                              {ACCESSORY_COLOR_PRESETS.slice(0, 7).map((swatch) => {
                                const activeItemColor = config.equippedColors?.[item.category] || config.equippedColors?.[item.id] || '#ffffff';
                                const isSelected = activeItemColor.toLowerCase() === swatch.hex.toLowerCase();
                                return (
                                  <button
                                    key={swatch.hex}
                                    type="button"
                                    onClick={() => {
                                      handleAccessoryColorChange(item, swatch.hex);
                                      if (!isEquipped && isUnlocked) {
                                        handleItemClick(item);
                                      }
                                    }}
                                    className={`w-4 h-4 rounded-full border transition-transform hover:scale-125 cursor-pointer ${
                                      isSelected ? 'border-stone-900 ring-2 ring-orange-500/50 scale-110 shadow-xs' : 'border-stone-200'
                                    }`}
                                    style={{ backgroundColor: swatch.hex }}
                                    title={swatch.name}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
                {categoryItems.length === 0 && (
                  <div className="p-4 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-center text-xs text-stone-400">
                    No other items available in this category yet.
                  </div>
                )}
            </div>
            );
          })()}
        </div>
      </div>

      {/* 3. ITEM OR COLOR PURCHASE MODAL (When clicking a locked item or skin color) */}
      {(pendingItem || pendingColor) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-center space-y-4">
            {pendingColor ? (
              <div
                className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-sm ${
                  pendingColor.hex.toLowerCase() === '#ffffff'
                    ? 'border border-stone-300'
                    : 'border-2 border-white'
                }`}
                style={{ backgroundColor: pendingColor.hex }}
              >
                🎨
              </div>
            ) : pendingItem?.colorPicker && pendingItem?.assetUrl ? (() => {
              const cleanUrl = normalizeGoogleDriveUrl(pendingItem.assetUrl);
              return (
                <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 mx-auto flex items-center justify-center p-1 overflow-hidden shadow-xs relative">
                  <div
                    className="absolute inset-0 w-full h-full transition-colors duration-200"
                    style={{
                      backgroundColor: config.equippedColors?.[pendingItem.category] || config.equippedColors?.[pendingItem.id] || '#ffffff',
                      WebkitMaskImage: `url(${cleanUrl})`,
                      maskImage: `url(${cleanUrl})`,
                      WebkitMaskSize: 'contain',
                      maskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      maskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskPosition: 'center',
                    }}
                  />
                  <img
                    src={cleanUrl}
                    alt={pendingItem.name}
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                </div>
              );
            })() : pendingItem?.assetUrl ? (
              <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 mx-auto flex items-center justify-center p-1 overflow-hidden shadow-xs">
                <img
                  src={normalizeGoogleDriveUrl(pendingItem.assetUrl)}
                  alt={pendingItem.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center text-2xl shadow-xs">
                🪙
              </div>
            )}

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {pendingColor ? 'Body Color Unlock' : 'Wardrobe Unlock'}
              </span>
              <h3 className="font-fredoka text-xl font-bold text-stone-900 mt-1">
                Unlock {pendingColor ? pendingColor.name : pendingItem?.name}?
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                {pendingColor
                  ? pendingColor.description || 'Unlock this permanent custom skin tone for your Buddy avatar.'
                  : pendingItem?.description || 'Add this custom accessory to your permanent wardrobe inventory.'}
              </p>
            </div>

            {/* If item has Color Picker, allow choosing starting color right in purchase modal */}
            {pendingItem?.colorPicker && (
              <div className="p-3 rounded-2xl bg-orange-50/70 border border-orange-200 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-orange-600" />
                    Select Starting Color:
                  </span>
                  <label className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-stone-200 text-[10px] font-bold text-stone-700 hover:bg-stone-50 cursor-pointer shadow-xs">
                    <div
                      className="w-3 h-3 rounded-full border border-stone-300 shrink-0"
                      style={{ backgroundColor: config.equippedColors?.[pendingItem.category] || config.equippedColors?.[pendingItem.id] || '#ffffff' }}
                    />
                    <span>Hex</span>
                    <input
                      type="color"
                      value={config.equippedColors?.[pendingItem.category] || config.equippedColors?.[pendingItem.id] || '#ffffff'}
                      onChange={(e) => handleAccessoryColorChange(pendingItem, e.target.value)}
                      className="w-0 h-0 opacity-0 absolute pointer-events-none"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ACCESSORY_COLOR_PRESETS.slice(0, 10).map((swatch) => {
                    const activeColor = config.equippedColors?.[pendingItem.category] || config.equippedColors?.[pendingItem.id] || '#ffffff';
                    const isSelected = activeColor.toLowerCase() === swatch.hex.toLowerCase();
                    return (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => handleAccessoryColorChange(pendingItem, swatch.hex)}
                        className={`w-6 h-6 rounded-lg border-2 transition-transform hover:scale-110 cursor-pointer ${
                          isSelected ? 'border-stone-900 scale-105 shadow-xs' : 'border-white shadow-xs'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                        title={swatch.name}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price & Balance Calculation */}
            {(() => {
              const price = pendingColor ? (pendingColor.price || 10) : (pendingItem?.price || 0);
              const hasEnough = buddyBucks >= price;
              return (
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2 text-left">
                  <div className="flex justify-between items-center text-stone-600">
                    <span>Unlock Price:</span>
                    <span className="font-bold text-stone-900">{price} Buddy Bucks</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span>Your Current Balance:</span>
                    <span className="font-bold text-stone-900">{buddyBucks} Buddy Bucks</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-stone-200 font-bold text-stone-900">
                    <span>Balance After Purchase:</span>
                    <span className={hasEnough ? 'text-emerald-700' : 'text-red-600'}>
                      {buddyBucks - price} Buddy Bucks
                    </span>
                  </div>
                </div>
              );
            })()}

            {purchaseError && (
              <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                {purchaseError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setPendingItem(null);
                  setPendingColor(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={
                  isPurchasing ||
                  (pendingColor
                    ? buddyBucks < (pendingColor.price || 10)
                    : pendingItem
                    ? buddyBucks < pendingItem.price
                    : true)
                }
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isPurchasing ? (
                  <span>Unlocking...</span>
                ) : (
                  <span>
                    Unlock (
                    {pendingColor ? pendingColor.price || 10 : pendingItem?.price}{' '}
                    BB)
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: UPLOAD CUSTOM ART FORM (+20 XP, 10 BUDDY BUCKS) */}
      {/* ======================================================== */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 text-stone-900 space-y-4 my-8 relative">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* If upload succeeded, show celebratory success view */}
            {uploadSuccess ? (
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-stone-900">Artwork Submitted!</h3>
                  <p className="text-xs text-stone-600">
                    Your design <strong className="text-stone-900">"{uploadSuccess.name}"</strong> has been uploaded to Google Drive.
                  </p>
                </div>

                {/* Rewards callout */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 text-left space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                      Artist Rewards Granted
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-stone-800">
                    <span className="px-3 py-1 rounded-xl bg-white border border-amber-200 text-emerald-700 shadow-2xs">
                      +{uploadSuccess.xp} Experience Points
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-white border border-amber-200 text-amber-800 shadow-2xs flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      +{uploadSuccess.bucks} Buddy Bucks
                    </span>
                  </div>
                </div>

                {/* Status Explanation */}
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-left text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-stone-800 font-bold">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Status: Pending Staff Review</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    The item was added to the database spreadsheet marked as <strong className="text-stone-700">"Pending"</strong>. Once our makerspace team checks and approves it, it will automatically appear live in the Wardrobe Rack for all members!
                  </p>
                  <a
                    href={GOOGLE_DRIVE_BUDDY_ART_FOLDER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline pt-1"
                  >
                    <span>View Submission Folder in Google Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={openUploadModal}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Submit Another Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Upload Form */
              <form onSubmit={handleArtSubmit} className="space-y-4 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-stone-900 leading-tight">
                      Submit Custom Buddy Art
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Earn <strong className="text-orange-600">+20 XP</strong> & <strong className="text-amber-600">10 🪙 Buddy Bucks</strong> for contributing!
                    </p>
                  </div>
                </div>

                {uploadError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* 1. Item Name, Wardrobe Slot & Artist Attribution Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={artName}
                      onChange={(e) => setArtName(e.target.value)}
                      placeholder="e.g. Celestial Cape, Wizard Hat..."
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Wardrobe Slot / Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={artCategory}
                      onChange={(e) => setArtCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                    >
                      <option value="headwear">Headwear (Hats, Helmets, Horns)</option>
                      <option value="capes">Capes & Wings (Behind Body)</option>
                      <option value="tops">Tops & Outfits (Jackets, Shirts)</option>
                      <option value="props">Props & Tools (Handhelds)</option>
                      <option value="face_accessory">Face & Glasses</option>
                      <option value="shoes">Shoes & Footwear</option>
                      <option value="tails">Tails (Behind Body)</option>
                      <option value="expression">Facial Expression</option>
                      <option value="mouth">Mouth Style</option>
                      <option value="hair">Hair Style</option>
                      <option value="bottoms">Pants & Bottoms</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Artist Attribution <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={artArtist}
                      onChange={(e) => setArtArtist(e.target.value)}
                      placeholder="Your name or handle"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* 2. Description */}
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Description <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={artDescription}
                    onChange={(e) => setArtDescription(e.target.value)}
                    placeholder="Short description or notes about this piece..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                  />
                </div>

                {/* 5. PNG Art File Picker & Live Transparency Preview */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-700">
                      PNG Artwork File <span className="text-red-500">*</span>
                    </label>
                    <a
                      href="/buddies/basic_buddy.png"
                      download="basic_buddy_template.png"
                      className="text-[11px] font-semibold text-blue-700 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download Template Body</span>
                    </a>
                  </div>

                  <div className="border-2 border-dashed border-stone-300 hover:border-orange-400 rounded-2xl p-4 text-center transition-colors bg-stone-50/50">
                    <input
                      type="file"
                      id="buddy-art-file-input"
                      accept=".png,image/png"
                      onChange={handleArtFileChange}
                      className="hidden"
                    />

                    {artPreviewUrl ? (
                      <div className="space-y-3">
                        <div
                          className="w-32 h-32 mx-auto rounded-xl p-2 border border-stone-200 shadow-inner flex items-center justify-center overflow-hidden"
                          style={{
                            backgroundImage:
                              'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
                            backgroundSize: '16px 16px',
                            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                            backgroundColor: '#ffffff',
                          }}
                        >
                          <img
                            src={artPreviewUrl}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>

                        <div className="flex items-center justify-center gap-2">
                          <label
                            htmlFor="buddy-art-file-input"
                            className="text-[11px] font-bold text-orange-600 hover:text-orange-700 px-3 py-1 rounded-lg bg-orange-50 border border-orange-200 cursor-pointer"
                          >
                            Change Image
                          </label>
                          <span className="text-[11px] text-stone-500 font-medium">
                            {artFile?.name}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="buddy-art-file-input"
                        className="cursor-pointer block py-3 space-y-1.5"
                      >
                        <ImageIcon className="w-8 h-8 text-stone-400 mx-auto" />
                        <div className="text-xs font-bold text-stone-700">
                          Click to select PNG artwork
                        </div>
                        <p className="text-[11px] text-stone-400">
                          Must be a PNG with transparent background (under 5MB)
                        </p>
                      </label>
                    )}
                  </div>
                </div>

                {/* Color Picker Mode Checkbox */}
                <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-stone-200 bg-stone-50/60 hover:bg-stone-100/60 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={artColorPicker}
                    onChange={(e) => setArtColorPicker(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  <div className="space-y-0.5 select-none">
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-orange-500" />
                      <span>Enable Color Picker Mode</span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-snug">
                      Check this if you uploaded a white silhouette or inked line art. Members will be able to customize this item with a color picker in the wardrobe!
                    </p>
                  </div>
                </label>

                {/* Submission Notice & Google Drive link */}
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Upload Destination & Review Process:</span>
                  </div>
                  <p className="text-blue-800 leading-relaxed">
                    Submitted PNG art is uploaded directly to the makerspace Google Drive folder and added to the <strong className="font-semibold">Buddy_Items</strong> sheet with status <strong className="font-semibold">"Pending"</strong>. You will receive <strong>+20 XP</strong> and <strong>10 Buddy Bucks</strong> immediately!
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingArt || !artPreviewUrl || !artName.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingArt ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading Art...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Submit Art (+20 XP & 10 🪙)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: PENDING SUBMISSIONS LIST DRAWER / DIALOG        */}
      {/* ======================================================== */}
      {showPendingDrawer && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 text-stone-900 space-y-4 relative">
            <button
              type="button"
              onClick={() => setShowPendingDrawer(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-black text-stone-900">
                Your Pending Art Submissions
              </h3>
            </div>

            <p className="text-xs text-stone-500">
              Items currently awaiting makerspace staff review. Once approved in the Google Sheet, they will show in the live Wardrobe Rack!
            </p>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {pendingSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3 rounded-2xl border border-stone-200 bg-stone-50 flex items-center gap-3 text-left"
                >
                  <div
                    className="w-12 h-12 rounded-xl border border-stone-200 shrink-0 p-1 flex items-center justify-center overflow-hidden"
                    style={{
                      backgroundImage:
                        'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
                      backgroundSize: '12px 12px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <img
                      src={normalizeGoogleDriveUrl(sub.assetUrl)}
                      alt={sub.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-stone-900 truncate">{sub.name}</div>
                    <div className="text-[10px] text-stone-500 capitalize">
                      {sub.category ? formatCategoryLabel(sub.category) : 'Custom Art'} • 🎨 by {sub.artist}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      {new Date(sub.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                    Pending
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between items-center text-xs">
              <a
                href={GOOGLE_DRIVE_BUDDY_ART_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-700 hover:underline flex items-center gap-1"
              >
                <span>Google Drive Folder</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => setShowPendingDrawer(false)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
