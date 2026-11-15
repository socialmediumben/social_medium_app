'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  RotateCcw,
  Download,
  Save,
  Check,
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
} from 'lucide-react';
import { BuddyConfig, BuddyItem, BuddyLayerCategory, MemberProfile } from '@/lib/types';
import {
  BUDDY_CATEGORIES,
  BUDDY_BASE_COLORS,
  getAllBuddyItems,
  loadMemberBuddyConfig,
  loadMemberBuddyBucks,
  equipBuddyItem,
  unequipBuddyCategory,
  randomizeBuddy,
  purchaseBuddyItem,
} from '@/lib/buddy';
import { updateMemberBuddyConfigInNeon } from '@/lib/neon';
import { BuddyCanvas } from './BuddyCanvas';

interface BuddyBuilderProps {
  member: MemberProfile | null;
  onBuddySaved?: (newConfig: BuddyConfig) => void;
}

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

  // Active Category Tab
  const [activeCategory, setActiveCategory] = useState<BuddyLayerCategory>('base_body');

  // Item Purchase Modal State
  const [pendingItem, setPendingItem] = useState<BuddyItem | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Save State & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Master Items Catalog
  const [items, setItems] = useState<BuddyItem[]>([]);

  useEffect(() => {
    setItems(getAllBuddyItems());

    const handleCatalogUpdate = () => {
      setItems(getAllBuddyItems());
    };
    window.addEventListener('sm_buddy_catalog_updated', handleCatalogUpdate);
    return () => window.removeEventListener('sm_buddy_catalog_updated', handleCatalogUpdate);
  }, []);

  // Sync state if active member changes
  useEffect(() => {
    if (member) {
      setConfig(loadMemberBuddyConfig(member.accountId, member.buddyAvatar));
      setBuddyBucks(loadMemberBuddyBucks(member.accountId, member.buddyBucks));
    }
  }, [member]);

  // Filter items by current active category
  const categoryItems = useMemo(() => {
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
      // Open purchase confirmation
      setPendingItem(item);
      setPurchaseError(null);
      return;
    }

    // Equip or toggle unequip
    const updated = equipBuddyItem(config, item);
    setConfig(updated);
  };

  // Handle Base Color Change
  const handleColorChange = (colorId: string) => {
    const baseItem = colorId === 'orange' ? 'body_orange' : 'body_cyan';
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

  // Confirm Purchase with Buddy Bucks
  const handleConfirmPurchase = async () => {
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
      const equipped = equipBuddyItem(res.newConfig, pendingItem);
      setConfig(equipped);
      setPendingItem(null);
    } else {
      setPurchaseError(res.error || 'Failed to purchase item.');
    }
  };

  // Randomize Buddy
  const handleRandomize = () => {
    const randomized = randomizeBuddy(config, false);
    setConfig(randomized);
  };

  // Clear Clothes (Bare Mascot)
  const handleClearClothes = () => {
    const cleared: BuddyConfig = {
      ...config,
      equipped: {
        base_body: config.baseColor === 'orange' ? 'body_orange' : 'body_cyan',
        expression: 'expr_smile',
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
            <BuddyCanvas config={config} size={280} className="relative z-10" />
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
          </div>
        </div>

        {/* RIGHT: Wardrobe Rack (7 Columns on Desktop) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
          {/* Category Tabs / Pills */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-2">Wardrobe Rack</label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {BUDDY_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                const hasEquipped = config.equipped[cat.id] !== undefined;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-[#344ea2] text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    {getCategoryIcon(cat.iconName)}
                    <span>{cat.shortLabel}</span>
                    {hasEquipped && cat.id !== 'base_body' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION A: BASE BODY COLORS */}
          {activeCategory === 'base_body' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">Choose Buddy Skin Color</span>
                <span className="text-[11px] text-stone-400">8 Community Colors</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {BUDDY_BASE_COLORS.map((col) => {
                  const isSelected = config.baseColor === col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => handleColorChange(col.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-[#344ea2] bg-[#344ea2]/5 ring-2 ring-[#344ea2]/20 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center shrink-0"
                        style={{ backgroundColor: col.hex }}
                      >
                        {isSelected && <Check className="w-5 h-5 text-white drop-shadow-sm" />}
                      </div>
                      <span className="text-xs font-bold text-stone-800 text-center leading-tight">
                        {col.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION B: ITEMS GRID (FOR ALL OTHER CATEGORIES) */}
          {activeCategory !== 'base_body' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">
                  {BUDDY_CATEGORIES.find((c) => c.id === activeCategory)?.label}
                </span>
                <span className="text-[11px] text-stone-400">
                  {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'} available
                </span>
              </div>

              {categoryItems.length === 0 ? (
                <div className="p-8 rounded-2xl bg-stone-50 border border-dashed border-stone-200 text-center space-y-1">
                  <Shirt className="w-8 h-8 text-stone-300 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-stone-600">No items in this category yet</p>
                  <p className="text-[11px] text-stone-400">
                    Upload new clothes in Developer Mode &rarr; Buddy Assets!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                        <div className="w-full aspect-square rounded-xl bg-stone-100/60 flex items-center justify-center p-2 mb-2 overflow-hidden">
                          {item.assetUrl ? (
                            <img
                              src={item.assetUrl}
                              alt={item.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="text-xs text-stone-400 font-medium">Preview</div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div>
                          <div className="text-xs font-bold text-stone-900 leading-tight">
                            {item.name}
                          </div>
                          {item.description && (
                            <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Price Tag / Lock Status */}
                        <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. ITEM PURCHASE MODAL (When clicking a locked item) */}
      {pendingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center text-2xl shadow-xs">
              🪙
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Wardrobe Unlock
              </span>
              <h3 className="font-fredoka text-xl font-bold text-stone-900 mt-1">
                Unlock {pendingItem.name}?
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                {pendingItem.description || 'Add this custom accessory to your permanent wardrobe inventory.'}
              </p>
            </div>

            {/* Price & Balance Calculation */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2 text-left">
              <div className="flex justify-between items-center text-stone-600">
                <span>Item Price:</span>
                <span className="font-bold text-stone-900">{pendingItem.price} Buddy Bucks</span>
              </div>
              <div className="flex justify-between items-center text-stone-600">
                <span>Your Current Balance:</span>
                <span className="font-bold text-stone-900">{buddyBucks} Buddy Bucks</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-stone-200 font-bold text-stone-900">
                <span>Balance After Purchase:</span>
                <span className={buddyBucks >= pendingItem.price ? 'text-emerald-700' : 'text-red-600'}>
                  {buddyBucks - pendingItem.price} Buddy Bucks
                </span>
              </div>
            </div>

            {purchaseError && (
              <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                {purchaseError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={isPurchasing || buddyBucks < pendingItem.price}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isPurchasing ? (
                  <span>Unlocking...</span>
                ) : (
                  <>
                    <span>Unlock ({pendingItem.price} BB)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
