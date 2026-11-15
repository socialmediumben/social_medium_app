'use client';

import {
  BuddyConfig,
  BuddyEquippedLayers,
  BuddyItem,
  BuddyLayerCategory,
} from './types';

// ==========================================
// 1. LAYER STACK ORDER & DYNAMIC CATEGORIES
// ==========================================

export const DEFAULT_CATEGORY_LAYER_ORDER: Record<string, number> = {
  capes: 20,
  base_body: 30,
  mouth: 40,
  expression: 45,
  tops: 60,
  bottoms: 65,
  shoes: 70,
  face_accessory: 80,
  headwear: 90,
  hair: 95,
  props: 110,
};

const LAYER_ORDER_STORAGE_KEY = 'sm_buddy_layer_order';
const SHEET_BUDDY_ITEMS_KEY = 'sm_sheet_buddy_items';
const CUSTOM_BUDDY_ITEMS_KEY = 'sm_custom_buddy_items';

export const GOOGLE_SHEET_BUDDY_ITEMS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1vwXuw-TBYxUXKXUSipa2drArRNXZuKNwbXFhxcVbIc0/gviz/tq?tqx=out:csv&sheet=Buddy_Items';

/**
 * Returns the active category layer stack order (category -> zIndex).
 */
export function getCategoryLayerOrder(): Record<string, number> {
  let customOrder: Record<string, number> = {};
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LAYER_ORDER_STORAGE_KEY);
      if (stored) customOrder = JSON.parse(stored);
    } catch (_) {}
  }
  return { ...DEFAULT_CATEGORY_LAYER_ORDER, ...customOrder };
}

/**
 * Saves category layer order globally and dispatches catalog update.
 */
export function saveCategoryLayerOrder(order: Record<string, number>): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LAYER_ORDER_STORAGE_KEY, JSON.stringify(order));
      window.dispatchEvent(new CustomEvent('sm_buddy_catalog_updated'));
      import('./neon').then(({ updateGlobalAppSettings }) => {
        updateGlobalAppSettings({ buddyLayerOrder: order }).catch(() => {});
      }).catch(() => {});
    } catch (_) {}
  }
}

/**
 * Resets category layer order to standard defaults.
 */
export function resetCategoryLayerOrder(): Record<string, number> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LAYER_ORDER_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('sm_buddy_catalog_updated'));
      import('./neon').then(({ updateGlobalAppSettings }) => {
        updateGlobalAppSettings({ buddyLayerOrder: DEFAULT_CATEGORY_LAYER_ORDER }).catch(() => {});
      }).catch(() => {});
    } catch (_) {}
  }
  return { ...DEFAULT_CATEGORY_LAYER_ORDER };
}

/**
 * Formats a raw category slug into a clean user-facing title.
 * e.g. "face_accessory" -> "Face Accessory", "mouth" -> "Mouth"
 */
export function formatCategoryLabel(cat: string): string {
  if (!cat) return 'Other';
  return cat
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ==========================================
// 2. BASE COLOR PALETTES
// ==========================================

export interface BuddyColorChoice {
  id: string;
  name: string;
  hex: string;
  assetUrl: string;
}

export const BUDDY_BASE_COLORS: BuddyColorChoice[] = [
  {
    id: 'cyan',
    name: 'Social Medium Cyan',
    hex: '#3bc0cd',
    assetUrl: '/buddies/blue_buddy.png',
  },
  {
    id: 'orange',
    name: 'Maker Orange',
    hex: '#f16622',
    assetUrl: '/buddies/orange_buddy.png',
  },
  {
    id: 'dark-blue',
    name: 'Cobalt Navy',
    hex: '#344ea2',
    assetUrl: '/buddies/blue_buddy.png',
  },
  {
    id: 'green',
    name: 'Sage Green',
    hex: '#8a9280',
    assetUrl: '/buddies/blue_buddy.png',
  },
  {
    id: 'purple',
    name: 'Arcane Purple',
    hex: '#8b5cf6',
    assetUrl: '/buddies/blue_buddy.png',
  },
  {
    id: 'yellow',
    name: 'Sunshine Gold',
    hex: '#fbbf24',
    assetUrl: '/buddies/orange_buddy.png',
  },
  {
    id: 'pink',
    name: 'Neon Coral',
    hex: '#f43f5e',
    assetUrl: '/buddies/orange_buddy.png',
  },
  {
    id: 'slate',
    name: 'Cybernetic Slate',
    hex: '#64748b',
    assetUrl: '/buddies/blue_buddy.png',
  },
];

// Fallback items catalog (only used before initial Google Sheet fetch)
export const DEFAULT_BUDDY_ITEMS: BuddyItem[] = [];

// ==========================================
// 3. GOOGLE SHEETS PARSING & CATALOG RETRIEVAL
// ==========================================

function parseBuddyCsv(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField);
      if (currentRow.some((f) => f.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((f) => f.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Fetches accessory layers directly from the permanent Social Medium Database Google Sheet ("Buddy_Items" tab).
 * Supports columns: Name, Category, Price / Buddy_Bucks, Asset_URL / URL, Z_Index, Description, Active
 */
export async function fetchBuddyItemsFromSheet(): Promise<BuddyItem[]> {
  try {
    const res = await fetch(`${GOOGLE_SHEET_BUDDY_ITEMS_CSV_URL}&_t=${Date.now()}`);
    if (!res.ok) return [];
    const text = await res.text();
    const rows = parseBuddyCsv(text);
    if (!rows || rows.length < 2) return [];

    const header = rows[0].map((h) => String(h || '').trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    let nameIdx = -1;
    let catIdx = -1;
    let priceIdx = -1;
    let urlIdx = -1;
    let zIdx = -1;
    let descIdx = -1;
    let activeIdx = -1;

    for (let i = 0; i < header.length; i++) {
      const col = header[i];
      if (col.includes('name') || col.includes('item') || col.includes('title')) nameIdx = i;
      else if (col.includes('cat') || col.includes('layer') || col.includes('type')) catIdx = i;
      else if (col.includes('price') || col.includes('buck') || col.includes('cost') || col.includes('bb')) priceIdx = i;
      else if (col.includes('url') || col.includes('asset') || col.includes('image') || col.includes('link') || col.includes('file')) urlIdx = i;
      else if (col.includes('z') || col.includes('order') || col.includes('depth') || col.includes('stack')) zIdx = i;
      else if (col.includes('desc') || col.includes('detail') || col.includes('note')) descIdx = i;
      else if (col.includes('active') || col.includes('status') || col.includes('enable')) activeIdx = i;
    }

    if (nameIdx === -1 || (catIdx === -1 && priceIdx === -1 && urlIdx === -1)) {
      return [];
    }

    const layerOrder = getCategoryLayerOrder();
    const items: BuddyItem[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;
      const name = String(row[nameIdx] || '').trim();
      if (!name) continue;

      if (activeIdx !== -1) {
        const activeVal = String(row[activeIdx] || '').trim().toLowerCase();
        if (activeVal === 'false' || activeVal === 'no' || activeVal === '0' || activeVal === 'inactive' || activeVal === 'archived') {
          continue;
        }
      }

      // Dynamic category straight from Google Sheet
      const rawCat = catIdx !== -1 ? String(row[catIdx] || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '') : 'other';
      const category: string = rawCat || 'other';

      const rawPrice = priceIdx !== -1 ? String(row[priceIdx] || '').replace(/[^0-9]/g, '') : '0';
      const price = parseInt(rawPrice, 10) || 0;

      let assetUrl = urlIdx !== -1 ? String(row[urlIdx] || '').trim() : '';
      if (!assetUrl) continue;

      // Clean asset URL: if relative path missing leading slash, add it
      if (assetUrl.startsWith('buddies/')) assetUrl = '/' + assetUrl;

      // Z-Index resolution: 
      // 1. If explicit positive Z_Index in spreadsheet (>0), use it
      // 2. Otherwise use the layer order configured in Developer Mode
      const parsedZ = zIdx !== -1 ? parseInt(String(row[zIdx] || '').replace(/[^0-9]/g, ''), 10) : NaN;
      const categoryZ = layerOrder[category];
      const zIndex = !isNaN(parsedZ) && parsedZ > 0 ? parsedZ : (categoryZ !== undefined ? categoryZ : 50);

      const description = descIdx !== -1 ? String(row[descIdx] || '').trim() : undefined;

      items.push({
        id: `sheet_${r}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name,
        category,
        price,
        assetUrl,
        zIndex,
        description,
        isCustom: true,
      });
    }

    if (items.length > 0 && typeof window !== 'undefined') {
      try {
        localStorage.setItem(SHEET_BUDDY_ITEMS_KEY, JSON.stringify(items));
        window.dispatchEvent(new CustomEvent('sm_buddy_catalog_updated'));
      } catch (_) {}
    }
    return items;
  } catch (err) {
    console.warn('Google Sheet Buddy items fetch notice:', err);
    return [];
  }
}

/**
 * Returns all available Buddy items.
 * If Google Sheet items exist, they are the 100% SOLE SOURCE OF TRUTH.
 */
export function getAllBuddyItems(): BuddyItem[] {
  let sheetItems: BuddyItem[] = [];
  if (typeof window !== 'undefined') {
    try {
      const sheetStored = localStorage.getItem(SHEET_BUDDY_ITEMS_KEY);
      if (sheetStored) sheetItems = JSON.parse(sheetStored);
    } catch (_) {}
  }

  const layerOrder = getCategoryLayerOrder();

  if (sheetItems.length > 0) {
    return sheetItems.map((item) => ({
      ...item,
      zIndex: layerOrder[item.category] !== undefined ? layerOrder[item.category] : item.zIndex,
    }));
  }

  return [];
}

/**
 * Synchronize custom buddy assets from global backend settings
 */
export function syncBuddyAssetsFromGlobalSettings(assets?: BuddyItem[] | null): void {
  if (typeof window === 'undefined' || !Array.isArray(assets) || assets.length === 0) return;
  try {
    const existing = getCustomBuddyItems();
    const map = new Map<string, BuddyItem>();
    existing.forEach((item) => map.set(item.id, item));
    assets.forEach((item) => map.set(item.id, { ...item, isCustom: true }));
    const merged = Array.from(map.values());
    localStorage.setItem(CUSTOM_BUDDY_ITEMS_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('sm_buddy_catalog_updated'));
  } catch (err) {
    console.warn('Failed to sync global buddy assets:', err);
  }
}

/**
 * Saves a developer-uploaded Buddy item to the custom library.
 */
export function saveCustomBuddyItem(item: BuddyItem): BuddyItem[] {
  const allCustom = getCustomBuddyItems();
  const existingIdx = allCustom.findIndex((i) => i.id === item.id);
  if (existingIdx !== -1) {
    allCustom[existingIdx] = { ...item, isCustom: true };
  } else {
    allCustom.push({ ...item, isCustom: true });
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CUSTOM_BUDDY_ITEMS_KEY, JSON.stringify(allCustom));
      window.dispatchEvent(new CustomEvent('sm_buddy_catalog_updated'));
      import('./neon').then(({ updateGlobalAppSettings }) => {
        updateGlobalAppSettings({ buddyAssets: allCustom }).catch(() => {});
      }).catch(() => {});
    } catch (_) {}
  }
  return getAllBuddyItems();
}

/**
 * Deletes a custom Buddy item.
 */
export function deleteCustomBuddyItem(itemId: string): BuddyItem[] {
  const allCustom = getCustomBuddyItems().filter((i) => i.id !== itemId);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CUSTOM_BUDDY_ITEMS_KEY, JSON.stringify(allCustom));
      window.dispatchEvent(new CustomEvent('sm_buddy_catalog_updated'));
      import('./neon').then(({ updateGlobalAppSettings }) => {
        updateGlobalAppSettings({ buddyAssets: allCustom }).catch(() => {});
      }).catch(() => {});
    } catch (_) {}
  }
  return getAllBuddyItems();
}

export function getCustomBuddyItems(): BuddyItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_BUDDY_ITEMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

// ==========================================
// 4. MEMBER CONFIGURATION & WALLET LOGIC
// ==========================================

export function getDefaultBuddyConfig(): BuddyConfig {
  const allItems = getAllBuddyItems();
  const firstBase = allItems.find((i) => i.category === 'base_body');
  const firstMouth = allItems.find((i) => i.category === 'mouth');

  const equipped: BuddyEquippedLayers = {};
  const unlocked = ['body_blue', 'body_orange', 'closed_smile'];

  if (firstBase) {
    equipped.base_body = firstBase.id;
    unlocked.push(firstBase.id);
  }
  if (firstMouth) {
    equipped.mouth = firstMouth.id;
    unlocked.push(firstMouth.id);
  }

  return {
    baseColor: 'cyan',
    equipped,
    unlockedItemIds: unlocked,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Loads a member's active Buddy configuration, prioritizing their Neon One profile field.
 */
export function loadMemberBuddyConfig(
  accountId?: string,
  profileAvatar?: string
): BuddyConfig {
  const defaultConfig = getDefaultBuddyConfig();

  // 1. Check Neon One profile avatar JSON string
  if (profileAvatar && typeof profileAvatar === 'string' && profileAvatar.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(profileAvatar.trim());
      if (parsed && typeof parsed.equipped === 'object') {
        return {
          baseColor: parsed.baseColor || 'cyan',
          equipped: { ...parsed.equipped },
          unlockedItemIds: Array.isArray(parsed.unlockedItemIds)
            ? Array.from(new Set([...defaultConfig.unlockedItemIds, ...parsed.unlockedItemIds]))
            : defaultConfig.unlockedItemIds,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      }
    } catch (_) {}
  }

  // 2. Check local storage cache
  if (typeof window !== 'undefined' && accountId) {
    try {
      const local = localStorage.getItem(`sm_buddy_avatar_${accountId}`);
      if (local && local.trim().startsWith('{')) {
        const parsed = JSON.parse(local.trim());
        if (parsed && typeof parsed.equipped === 'object') {
          return {
            baseColor: parsed.baseColor || 'cyan',
            equipped: { ...parsed.equipped },
            unlockedItemIds: Array.isArray(parsed.unlockedItemIds)
              ? Array.from(new Set([...defaultConfig.unlockedItemIds, ...parsed.unlockedItemIds]))
              : defaultConfig.unlockedItemIds,
            updatedAt: parsed.updatedAt || new Date().toISOString(),
          };
        }
      }
    } catch (_) {}
  }

  return defaultConfig;
}

/**
 * Loads a member's current Buddy Bucks balance.
 */
export function loadMemberBuddyBucks(
  accountId?: string,
  profileBucks?: number
): number {
  if (typeof profileBucks === 'number' && !isNaN(profileBucks)) {
    return Math.max(0, profileBucks);
  }

  if (typeof window !== 'undefined' && accountId) {
    try {
      const local = localStorage.getItem(`sm_buddy_bucks_${accountId}`);
      if (local !== null) {
        const num = parseInt(local, 10);
        if (!isNaN(num)) return Math.max(0, num);
      }
    } catch (_) {}
  }

  return 50; // Welcoming starter grant of 50 Buddy Bucks!
}

/**
 * Awards Buddy Bucks to a member account and syncs to Neon CRM / localStorage.
 */
export async function awardBuddyBucks(
  accountId: string,
  amount: number,
  reason?: string
): Promise<number> {
  if (!accountId || amount <= 0) return 0;
  const current = loadMemberBuddyBucks(accountId);
  const newBalance = current + amount;

  if (typeof window !== 'undefined') {
    localStorage.setItem(`sm_buddy_bucks_${accountId}`, String(newBalance));
    window.dispatchEvent(
      new CustomEvent('sm_buddy_bucks_updated', {
        detail: { accountId, newBalance, amountAdded: amount, reason },
      })
    );
  }

  try {
    const { updateMemberBuddyBucksInNeon } = await import('./neon');
    await updateMemberBuddyBucksInNeon(accountId, newBalance);
  } catch (err) {
    console.warn('Neon Buddy Bucks background sync notice:', err);
  }

  return newBalance;
}

/**
 * Unlocks/purchases an item using Buddy Bucks and adds it to the user's wardrobe inventory.
 */
export async function purchaseBuddyItem(
  accountId: string,
  itemId: string,
  price: number,
  currentConfig: BuddyConfig,
  currentBalance: number
): Promise<{ success: boolean; newBalance: number; newConfig: BuddyConfig; error?: string }> {
  if (price > 0 && currentBalance < price) {
    return {
      success: false,
      newBalance: currentBalance,
      newConfig: currentConfig,
      error: `Not enough Buddy Bucks! You need ${price} 🪙 BB but have ${currentBalance} 🪙 BB. Earn more by leveling up in the makerspace!`,
    };
  }

  const updatedUnlocked = Array.from(new Set([...currentConfig.unlockedItemIds, itemId]));
  const updatedConfig: BuddyConfig = {
    ...currentConfig,
    unlockedItemIds: updatedUnlocked,
    updatedAt: new Date().toISOString(),
  };
  const updatedBalance = Math.max(0, currentBalance - price);

  if (typeof window !== 'undefined' && accountId) {
    localStorage.setItem(`sm_buddy_avatar_${accountId}`, JSON.stringify(updatedConfig));
    localStorage.setItem(`sm_buddy_bucks_${accountId}`, String(updatedBalance));
    window.dispatchEvent(new CustomEvent('sm_buddy_updated', { detail: JSON.stringify(updatedConfig) }));
    window.dispatchEvent(new CustomEvent('sm_buddy_bucks_updated', { detail: updatedBalance }));
  }

  // Background sync with Neon CRM
  try {
    const { updateMemberBuddyConfigInNeon, updateMemberBuddyBucksInNeon } = await import('./neon');
    updateMemberBuddyConfigInNeon(accountId, JSON.stringify(updatedConfig)).catch((err) => {
      console.warn('Neon avatar background sync notice:', err);
    });
    if (price > 0) {
      updateMemberBuddyBucksInNeon(accountId, updatedBalance).catch((err) => {
        console.warn('Neon bucks background sync notice:', err);
      });
    }
  } catch (err) {
    console.warn('Neon One CRM connection notice:', err);
  }

  return {
    success: true,
    newBalance: updatedBalance,
    newConfig: updatedConfig,
  };
}

/**
 * Equips an item and replaces whatever was in that layer category.
 */
export function equipBuddyItem(config: BuddyConfig, item: BuddyItem): BuddyConfig {
  const newEquipped: BuddyEquippedLayers = { ...config.equipped };
  newEquipped[item.category] = item.id;

  return {
    ...config,
    equipped: newEquipped,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Unequips a category of item.
 */
export function unequipBuddyCategory(
  config: BuddyConfig,
  category: string
): BuddyConfig {
  const newEquipped: BuddyEquippedLayers = { ...config.equipped };
  delete newEquipped[category];
  return {
    ...config,
    equipped: newEquipped,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generates a fun randomized Buddy configuration from unlocked items.
 */
export function randomizeBuddy(
  currentConfig: BuddyConfig,
  unlockedOnly: boolean = true
): BuddyConfig {
  const allItems = getAllBuddyItems();
  const availableItems = unlockedOnly
    ? allItems.filter((i) => currentConfig.unlockedItemIds.includes(i.id) || i.price === 0)
    : allItems;

  const colors = BUDDY_BASE_COLORS;
  const chosenColor = colors[Math.floor(Math.random() * colors.length)];

  const newEquipped: BuddyEquippedLayers = {};

  // Find unique categories
  const categories = Array.from(new Set(availableItems.map((i) => i.category)));

  categories.forEach((cat) => {
    const itemsInCat = availableItems.filter((i) => i.category === cat);
    if (itemsInCat.length > 0) {
      // Base body always gets picked; others have random chance
      if (cat === 'base_body' || Math.random() > 0.35) {
        const pick = itemsInCat[Math.floor(Math.random() * itemsInCat.length)];
        newEquipped[cat] = pick.id;
      }
    }
  });

  return {
    ...currentConfig,
    baseColor: chosenColor.id,
    equipped: newEquipped,
    updatedAt: new Date().toISOString(),
  };
}

// Auto-fetch Google Sheet on app boot
if (typeof window !== 'undefined') {
  fetchBuddyItemsFromSheet().catch(() => {});
}
