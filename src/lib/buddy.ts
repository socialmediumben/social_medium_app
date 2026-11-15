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

export const GOOGLE_DRIVE_BUDDY_ART_FOLDER_ID = '1TCPHSaRO-_R-dT_cKazSeE4nxGyVxiQU';
export const GOOGLE_DRIVE_BUDDY_ART_FOLDER_URL =
  'https://drive.google.com/drive/folders/1TCPHSaRO-_R-dT_cKazSeE4nxGyVxiQU?usp=drive_link';
export const BUDDY_ART_UPLOAD_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbw8sI54Tsza9NwwLd-Id3DgGBg69L4N0VxwSp9d3_dryLdSB5CvmPGtPpzt2uymKRjwcQ/exec';

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
  assetUrl?: string;
  price?: number;        // 0 = Free starter brand color, 10 = Unlockable premium color
  isStarter?: boolean;   // True for official Social Medium brand colors
  description?: string;
}

export const BUDDY_BASE_COLORS: BuddyColorChoice[] = [
  // 1. Official Free Social Medium Brand Colors (Free for all members)
  {
    id: 'cyan',
    name: 'Social Medium Cyan',
    hex: '#3bc0cd',
    price: 0,
    isStarter: true,
    description: 'The official vibrant cyan of the Social Medium makerspace.',
  },
  {
    id: 'orange',
    name: 'Maker Orange',
    hex: '#f16622',
    price: 0,
    isStarter: true,
    description: 'The high-energy orange of creative fabrication & making.',
  },
  {
    id: 'navy',
    name: 'Social Medium Navy',
    hex: '#344ea2',
    price: 0,
    isStarter: true,
    description: 'The foundational deep navy of the Social Medium brand portal.',
  },

  // 2. Unlockable Community & Artist Colors (10 Buddy Bucks each)
  {
    id: 'white',
    name: 'Neutral Sketch',
    hex: '#ffffff',
    price: 10,
    isStarter: false,
    description: 'Clean sketchbook white paper tone with crisp black ink outlines.',
  },
  {
    id: 'green',
    name: 'Sage Green',
    hex: '#8a9280',
    price: 10,
    isStarter: false,
    description: 'Calm earth-toned studio green inspired by nature.',
  },
  {
    id: 'purple',
    name: 'Arcane Purple',
    hex: '#8b5cf6',
    price: 10,
    isStarter: false,
    description: 'Mystical violet inspired by fantasy crafting and digital wizardry.',
  },
  {
    id: 'yellow',
    name: 'Sunshine Gold',
    hex: '#fbbf24',
    price: 10,
    isStarter: false,
    description: 'Warm, radiating golden sunshine yellow.',
  },
  {
    id: 'pink',
    name: 'Neon Coral',
    hex: '#f43f5e',
    price: 10,
    isStarter: false,
    description: 'Punchy cyberpunk coral pink that stands out everywhere.',
  },
  {
    id: 'slate',
    name: 'Cybernetic Slate',
    hex: '#64748b',
    price: 10,
    isStarter: false,
    description: 'Cool industrial gray with subtle blue undertones.',
  },
  {
    id: 'emerald',
    name: 'Forest Emerald',
    hex: '#10b981',
    price: 10,
    isStarter: false,
    description: 'Rich, lush botanical emerald green for makers of things that grow.',
  },
  {
    id: 'lavender',
    name: 'Lavender Mist',
    hex: '#c084fc',
    price: 10,
    isStarter: false,
    description: 'Soft pastel purple for dreamy, calming aesthetics.',
  },
  {
    id: 'ruby',
    name: 'Crimson Ruby',
    hex: '#dc2626',
    price: 10,
    isStarter: false,
    description: 'Bold, striking primary red with pure passion.',
  },
  {
    id: 'amber',
    name: 'Honey Amber',
    hex: '#f59e0b',
    price: 10,
    isStarter: false,
    description: 'Warm glowing amber resin tone for laser and resin enthusiasts.',
  },
  {
    id: 'teal',
    name: 'Deep Aqua Teal',
    hex: '#0d9488',
    price: 10,
    isStarter: false,
    description: 'Luminous underwater oceanic teal.',
  },
  {
    id: 'charcoal',
    name: 'Midnight Charcoal',
    hex: '#334155',
    price: 10,
    isStarter: false,
    description: 'Deep midnight stone gray for subtle, stealthy styles.',
  },
  {
    id: 'bubblegum',
    name: 'Bubblegum Pink',
    hex: '#f472b6',
    price: 10,
    isStarter: false,
    description: 'Playful confectionary pastel pink.',
  },
  {
    id: 'lime',
    name: 'Electric Lime',
    hex: '#84cc16',
    price: 10,
    isStarter: false,
    description: 'High-visibility fluorescent workshop lime.',
  },
  {
    id: 'indigo',
    name: 'Cosmic Indigo',
    hex: '#6366f1',
    price: 10,
    isStarter: false,
    description: 'Deep space twilight violet-blue.',
  },
];

/**
 * Checks if a base color is unlocked for the current member config.
 * Official SM brand colors (price = 0, isStarter = true) are always unlocked.
 */
export function isBuddyColorUnlocked(colorId: string, config: BuddyConfig): boolean {
  if (colorId === 'dark-blue') colorId = 'navy';
  const color = BUDDY_BASE_COLORS.find((c) => c.id === colorId);
  if (!color) return true;
  if (!color.price || color.price === 0 || color.isStarter) return true;
  if (config.baseColor === colorId || (colorId === 'navy' && config.baseColor === 'dark-blue')) return true;
  const unlocked = config.unlockedItemIds || [];
  return unlocked.includes(colorId) || unlocked.includes(`color_${colorId}`);
}

// Fallback items catalog (immediate synchronous availability while Google Sheet loads)
export const DEFAULT_BUDDY_ITEMS: BuddyItem[] = [
  {
    id: 'sheet_1_basic_buddy',
    name: 'Basic Buddy',
    category: 'base_body',
    price: 0,
    assetUrl: '/buddies/basic_buddy.png',
    zIndex: 30,
    description: 'Basic Buddy Body',
  },
  {
    id: 'sheet_21_closed_smile',
    name: 'Closed Smile',
    category: 'mouth',
    price: 0,
    assetUrl: '/buddies/closed_smile.png',
    zIndex: 40,
    description: 'Closed Smile',
  },
];

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
    let artistIdx = -1;

    for (let i = 0; i < header.length; i++) {
      const col = header[i];
      if (col.includes('name') || col.includes('item') || col.includes('title')) nameIdx = i;
      else if (col.includes('cat') || col.includes('layer') || col.includes('type')) catIdx = i;
      else if (col.includes('price') || col.includes('buck') || col.includes('cost') || col.includes('bb')) priceIdx = i;
      else if (col.includes('url') || col.includes('asset') || col.includes('image') || col.includes('link') || col.includes('file')) urlIdx = i;
      else if (col.includes('z') || col.includes('order') || col.includes('depth') || col.includes('stack')) zIdx = i;
      else if (col.includes('desc') || col.includes('detail') || col.includes('note')) descIdx = i;
      else if (col.includes('active') || col.includes('status') || col.includes('enable')) activeIdx = i;
      else if (col.includes('artist') || col.includes('creator') || col.includes('author') || col.includes('by')) artistIdx = i;
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
        // If pending approval, inactive, false, no, 0, or archived, do NOT show live in wardrobe!
        if (
          activeVal === 'pending' ||
          activeVal === 'false' ||
          activeVal === 'no' ||
          activeVal === '0' ||
          activeVal === 'inactive' ||
          activeVal === 'archived'
        ) {
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
      const artist = artistIdx !== -1 ? String(row[artistIdx] || '').trim() : undefined;

      items.push({
        id: `sheet_${r}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name,
        category,
        price,
        assetUrl,
        zIndex,
        description,
        artist: artist || undefined,
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

  return DEFAULT_BUDDY_ITEMS;
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
  const firstBase = allItems.find((i) => i.category === 'base_body') || DEFAULT_BUDDY_ITEMS[0];
  const firstMouth = allItems.find((i) => i.category === 'mouth');

  const equipped: BuddyEquippedLayers = {};
  if (firstBase) {
    equipped.base_body = firstBase.id;
  }
  if (firstMouth) {
    equipped.mouth = firstMouth.id;
  }

  const starterColors = BUDDY_BASE_COLORS.filter((c) => c.isStarter).map((c) => c.id);
  const unlocked = [
    'body_blue',
    'body_orange',
    'closed_smile',
    firstBase ? firstBase.id : 'sheet_1_basic_buddy',
    ...(firstMouth ? [firstMouth.id] : []),
    ...starterColors,
  ];

  return {
    baseColor: 'cyan',
    equipped,
    unlockedItemIds: Array.from(new Set(unlocked)),
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
  const validBaseId = defaultConfig.equipped.base_body || 'sheet_1_basic_buddy';

  const sanitizeEquipped = (equipped: BuddyEquippedLayers): BuddyEquippedLayers => {
    const clean = { ...equipped };
    // If base body is legacy or missing, normalize to active Basic Buddy
    if (!clean.base_body || clean.base_body === 'body_cyan' || clean.base_body === 'body_orange' || clean.base_body === 'body_blue' || clean.base_body === 'default_body') {
      clean.base_body = validBaseId;
    }
    return clean;
  };

  // 1. Check Neon One profile avatar JSON string
  if (profileAvatar && typeof profileAvatar === 'string' && profileAvatar.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(profileAvatar.trim());
      if (parsed && typeof parsed.equipped === 'object') {
        return {
          baseColor: parsed.baseColor || 'cyan',
          equipped: sanitizeEquipped(parsed.equipped),
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
            equipped: sanitizeEquipped(parsed.equipped),
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

  const availableColors = unlockedOnly
    ? BUDDY_BASE_COLORS.filter((c) => isBuddyColorUnlocked(c.id, currentConfig))
    : BUDDY_BASE_COLORS;
  const chosenColor = availableColors.length > 0
    ? availableColors[Math.floor(Math.random() * availableColors.length)]
    : BUDDY_BASE_COLORS[0];

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

// ==========================================
// 6. CUSTOM ART SUBMISSION & REWARDS
// ==========================================

export interface BuddyArtSubmissionPayload {
  name: string;
  category: string;
  description?: string;
  artist: string;
  price?: number;
  zIndex?: number;
  imageBase64: string; // Base64 data URL
  accountId?: string;
}

export interface BuddyArtSubmissionRecord {
  id: string;
  name: string;
  category: string;
  description?: string;
  artist: string;
  price: number;
  zIndex: number;
  assetUrl: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: string;
  fileId?: string;
  accountId?: string;
}

const PENDING_BUDDY_ART_STORAGE_KEY = 'sm_my_pending_buddy_art';

export function getMyPendingBuddyArtSubmissions(): BuddyArtSubmissionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PENDING_BUDDY_ART_STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (_) {}
  return [];
}

/**
 * Submits custom art to the Google Drive folder, appends row to "Buddy_Items"
 * with Status "Pending", and automatically awards +20 XP and 10 Buddy Bucks.
 */
export async function uploadBuddyArtItem(
  payload: BuddyArtSubmissionPayload
): Promise<{
  success: boolean;
  message: string;
  fileId?: string;
  url?: string;
  xpAwarded: number;
  bucksAwarded: number;
  error?: string;
}> {
  const {
    name,
    category,
    description = '',
    artist,
    price = 0,
    zIndex = 50,
    imageBase64,
    accountId,
  } = payload;

  const timestamp = new Date().toISOString();
  const submissionId = `art_sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  let directUrl = imageBase64;
  let fileId = '';
  let cloudSuccess = false;

  // 1. Attempt POST to Google Apps Script / Drive & Sheet
  try {
    const reqBody = {
      action: 'upload_buddy_art',
      folderId: GOOGLE_DRIVE_BUDDY_ART_FOLDER_ID,
      name,
      category,
      description,
      artist,
      price,
      zIndex,
      image: imageBase64,
      timestamp,
    };

    const res = await fetch(BUDDY_ART_UPLOAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(reqBody),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'success') {
        cloudSuccess = true;
        if (data.url) directUrl = data.url;
        if (data.fileId) fileId = data.fileId;
      }
    }
  } catch (netErr) {
    console.warn('Google Cloud upload notice (saved to pending local queue):', netErr);
  }

  // 2. Persist locally to member's pending submissions record
  const pendingRecord: BuddyArtSubmissionRecord = {
    id: submissionId,
    name,
    category,
    description,
    artist,
    price,
    zIndex,
    assetUrl: directUrl,
    status: 'Pending',
    timestamp,
    fileId: fileId || undefined,
    accountId: accountId || undefined,
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = getMyPendingBuddyArtSubmissions();
      localStorage.setItem(
        PENDING_BUDDY_ART_STORAGE_KEY,
        JSON.stringify([pendingRecord, ...existing.slice(0, 49)])
      );
      window.dispatchEvent(new CustomEvent('sm_buddy_art_submitted', { detail: pendingRecord }));
    } catch (_) {}
  }

  // 3. Award +20 XP & 10 Buddy Bucks to submitting member
  let xpAwarded = 0;
  let bucksAwarded = 0;

  if (accountId) {
    try {
      const { awardMemberXp } = await import('./gamification');
      const xpRes = await awardMemberXp({
        accountId,
        ruleId: 'buddy_art_upload',
        note: `Submitted Buddy Art: "${name}"`,
        force: true,
      });
      if (xpRes.success) {
        xpAwarded = xpRes.xpEarned || 20;
      }
    } catch (e) {
      console.warn('Failed awarding XP for art submission:', e);
      xpAwarded = 20; // Default expected reward
    }

    try {
      awardBuddyBucks(
        accountId,
        10,
        `Art Submission Bounty: "${name}"`
      );
      bucksAwarded = 10;
    } catch (e) {
      console.warn('Failed awarding Buddy Bucks for art submission:', e);
      bucksAwarded = 10;
    }
  }

  return {
    success: true,
    message: cloudSuccess
      ? 'Art uploaded to Google Drive and logged in spreadsheet as Pending!'
      : 'Art submitted and queued locally as Pending!',
    fileId,
    url: directUrl,
    xpAwarded: xpAwarded || 20,
    bucksAwarded: bucksAwarded || 10,
  };
}

// Auto-fetch Google Sheet on app boot
if (typeof window !== 'undefined') {
  fetchBuddyItemsFromSheet().catch(() => {});
}
