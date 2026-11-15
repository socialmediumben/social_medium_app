import {
  BuddyConfig,
  BuddyItem,
  BuddyLayerCategory,
  BuddyEquippedLayers,
} from './types';
import { updateMemberBuddyConfigInNeon, updateMemberBuddyBucksInNeon } from './neon';

// ==========================================
// 1. BUDDY CATEGORIES METADATA
// ==========================================

export interface BuddyCategoryMeta {
  id: BuddyLayerCategory;
  label: string;
  shortLabel: string;
  defaultZIndex: number;
  iconName: string;
  description: string;
}

export const BUDDY_CATEGORIES: BuddyCategoryMeta[] = [
  {
    id: 'base_body',
    label: 'Body Color',
    shortLabel: 'Body',
    defaultZIndex: 30,
    iconName: 'User',
    description: 'Select your Buddy mascot skin color',
  },
  {
    id: 'expression',
    label: 'Expressions',
    shortLabel: 'Face',
    defaultZIndex: 40,
    iconName: 'Smile',
    description: 'Eyes, smile, and facial mood',
  },
  {
    id: 'headwear',
    label: 'Hats & Headwear',
    shortLabel: 'Hats',
    defaultZIndex: 90,
    iconName: 'Crown',
    description: 'Witch hats, tiaras, goggles, and helmets',
  },
  {
    id: 'tops',
    label: 'Outfits & Tops',
    shortLabel: 'Tops',
    defaultZIndex: 60,
    iconName: 'Shirt',
    description: 'Robes, uniforms, shirts, and aprons',
  },
  {
    id: 'capes',
    label: 'Capes & Back',
    shortLabel: 'Back',
    defaultZIndex: 20,
    iconName: 'Sparkles',
    description: 'Capes, cloaks, and back accessories',
  },
  {
    id: 'props',
    label: 'Tools & Props',
    shortLabel: 'Props',
    defaultZIndex: 110,
    iconName: 'Wrench',
    description: 'Magic staves, potions, soldering irons, 3D prints',
  },
  {
    id: 'shoes',
    label: 'Footwear & Boots',
    shortLabel: 'Shoes',
    defaultZIndex: 70,
    iconName: 'Footprints',
    description: 'Boots, sneakers, and workshop footwear',
  },
];

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
    assetUrl: '/buddies/base_cyan.png',
  },
  {
    id: 'orange',
    name: 'Maker Orange',
    hex: '#f16622',
    assetUrl: '/buddies/base_orange.png',
  },
  {
    id: 'dark-blue',
    name: 'Cobalt Navy',
    hex: '#344ea2',
    assetUrl: '/buddies/base_cyan.png', // Filtered or tinted dynamically
  },
  {
    id: 'green',
    name: 'Sage Green',
    hex: '#8a9280',
    assetUrl: '/buddies/base_cyan.png',
  },
  {
    id: 'purple',
    name: 'Arcane Purple',
    hex: '#8b5cf6',
    assetUrl: '/buddies/base_cyan.png',
  },
  {
    id: 'yellow',
    name: 'Sunshine Gold',
    hex: '#fbbf24',
    assetUrl: '/buddies/base_orange.png',
  },
  {
    id: 'pink',
    name: 'Neon Coral',
    hex: '#f43f5e',
    assetUrl: '/buddies/base_orange.png',
  },
  {
    id: 'slate',
    name: 'Cybernetic Slate',
    hex: '#64748b',
    assetUrl: '/buddies/base_cyan.png',
  },
];

// ==========================================
// 3. BUILT-IN STARTER ITEMS CATALOG
// ==========================================

export const DEFAULT_BUDDY_ITEMS: BuddyItem[] = [
  // --- BASE BODIES & EXPRESSIONS ---
  {
    id: 'body_blue_smile',
    name: 'Blue Buddy (Smiling)',
    category: 'base_body',
    assetUrl: '/buddies/blue_buddy_smile.png',
    zIndex: 30,
    price: 0,
    description: 'Signature smiling Blue Social Medium mascot base.',
  },
  {
    id: 'body_blue_talking',
    name: 'Blue Buddy (Talking)',
    category: 'base_body',
    assetUrl: '/buddies/blue_buddy_talking.png',
    zIndex: 30,
    price: 0,
    description: 'Energetic talking Blue Social Medium mascot base.',
  },
  {
    id: 'body_orange_smile',
    name: 'Orange Buddy (Smiling)',
    category: 'base_body',
    assetUrl: '/buddies/orange_buddy_smile.png',
    zIndex: 30,
    price: 0,
    description: 'Signature smiling Orange Social Medium mascot base.',
  },
  {
    id: 'body_orange_talking',
    name: 'Orange Buddy (Talking)',
    category: 'base_body',
    assetUrl: '/buddies/orange_buddy_talking.png',
    zIndex: 30,
    price: 0,
    description: 'Energetic talking Orange Social Medium mascot base.',
  },

  // --- HATS & HEADWEAR ---
  {
    id: 'headwear_witch_hat',
    name: 'Witch Hat',
    category: 'headwear',
    assetUrl: '/buddies/witch_hat.png',
    zIndex: 90,
    price: 30,
    description: 'Pointed black sorcerer hat with buckled leather band.',
  },
  {
    id: 'headwear_cat_ears',
    name: 'Cat Ears Headband',
    category: 'headwear',
    assetUrl: '/buddies/cat_ears.png',
    zIndex: 90,
    price: 20,
    description: 'Cosplay cat ears headband.',
  },
  {
    id: 'headwear_flower',
    name: 'Blossom Flower',
    category: 'headwear',
    assetUrl: '/buddies/flower.png',
    zIndex: 90,
    price: 15,
    description: 'Vibrant spring blossom tucked above the ear.',
  },
  {
    id: 'headwear_headphones',
    name: 'Studio Headphones',
    category: 'headwear',
    assetUrl: '/buddies/headphones.png',
    zIndex: 90,
    price: 25,
    description: 'Over-ear audio mixing headphones for podcasting & music.',
  },
  {
    id: 'hair_magical_girl',
    name: 'Magical Girl Pigtails',
    category: 'hair',
    assetUrl: '/buddies/magical_girl_hair.png',
    zIndex: 95,
    price: 40,
    description: 'Twin celestial blonde pigtails with red jewel ornaments.',
  },

  // --- TOPS, OUTFITS & ACCESSORIES ---
  {
    id: 'tops_apron',
    name: 'Workshop Apron',
    category: 'tops',
    assetUrl: '/buddies/apron.png',
    zIndex: 60,
    price: 25,
    description: 'Heavy duty workshop protection apron with pocket.',
  },
  {
    id: 'tops_bow_tie',
    name: 'Dapper Bow Tie',
    category: 'tops',
    assetUrl: '/buddies/bow_tie.png',
    zIndex: 65,
    price: 10,
    description: 'Classic red bow tie for refined makerspace occasions.',
  },
  {
    id: 'face_cyborg_visor',
    name: 'Cyborg Ocular Visor',
    category: 'face_accessory',
    assetUrl: '/buddies/cyborg_face.png',
    zIndex: 80,
    price: 35,
    description: 'Bionic targeting ocular cyber-implant.',
  },

  // --- PROPS, COMPANIONS & TOOLS ---
  {
    id: 'prop_robot_arm',
    name: 'Robotic Grabber Arm',
    category: 'props',
    assetUrl: '/buddies/robot_arm.png',
    zIndex: 110,
    price: 40,
    description: 'Heavy industrial bionic prosthetic arm with pneumatic claw.',
  },
  {
    id: 'prop_dragon',
    name: 'Companion Dragon',
    category: 'props',
    assetUrl: '/buddies/dragon.png',
    zIndex: 110,
    price: 50,
    description: 'Loyal miniature emerald dragon companion.',
  },
  {
    id: 'prop_mini_robot',
    name: 'Mini Robot Companion',
    category: 'props',
    assetUrl: '/buddies/robot.png',
    zIndex: 110,
    price: 45,
    description: 'Autonomous tracked workshop assistant droid.',
  },
  {
    id: 'prop_wizard_staff',
    name: 'Arcane Wizard Staff',
    category: 'props',
    assetUrl: '/buddies/wizard_staff.png',
    zIndex: 110,
    price: 40,
    description: 'Carved elderwood staff crowned with a glowing crystal orb.',
  },
  {
    id: 'prop_sword',
    name: 'Cosplay Foam Sword',
    category: 'props',
    assetUrl: '/buddies/sword.png',
    zIndex: 110,
    price: 35,
    description: 'Durable battle-ready cosplay sword.',
  },
  {
    id: 'prop_test_tube',
    name: 'Bubbling Chemical Vial',
    category: 'props',
    assetUrl: '/buddies/test_tube.png',
    zIndex: 110,
    price: 25,
    description: 'Glass test tube emitting mysterious neon vapors.',
  },
  {
    id: 'prop_screwdriver',
    name: 'Precision Screwdriver',
    category: 'props',
    assetUrl: '/buddies/screwdriver.png',
    zIndex: 110,
    price: 15,
    description: 'Magnetic tip workbench tool for electronics fabrication.',
  },
  {
    id: 'prop_laser_pointer',
    name: 'Laser Alignment Pointer',
    category: 'props',
    assetUrl: '/buddies/laser_pointer.png',
    zIndex: 110,
    price: 20,
    description: 'Precision red diode pointer for CNC & laser work.',
  },
  {
    id: 'prop_game_controller',
    name: 'Retro Game Controller',
    category: 'props',
    assetUrl: '/buddies/game_controller.png',
    zIndex: 110,
    price: 25,
    description: 'Dual-thumbstick handheld game controller.',
  },
  {
    id: 'prop_mic_stand',
    name: 'Studio Condenser Mic',
    category: 'props',
    assetUrl: '/buddies/mic_stand.png',
    zIndex: 110,
    price: 25,
    description: 'Broadcast studio condenser microphone on desk stand.',
  },
  {
    id: 'prop_soda_can',
    name: 'Sparkling Soda Can',
    category: 'props',
    assetUrl: '/buddies/soda_can.png',
    zIndex: 110,
    price: 10,
    description: 'Cold fizzy beverage from the snack shack.',
  },

  // --- COMPLETE COSTUME SETS ---
  {
    id: 'costume_wizard',
    name: 'Wizard Master Set',
    category: 'tops',
    assetUrl: '/buddies/costume_wizard.png',
    zIndex: 60,
    price: 50,
    description: 'Complete Arcane Wizard outfit with buckled witch hat, flowing black cape, and glowing purple staff.',
  },
  {
    id: 'costume_sailor',
    name: 'Sailor Scout Hero Set',
    category: 'tops',
    assetUrl: '/buddies/costume_sailor.png',
    zIndex: 60,
    price: 50,
    description: 'Iconic magical girl uniform featuring blonde twintails, sailor bow, pleated skirt, and crimson boots.',
  },
  {
    id: 'costume_cyborg',
    name: 'Cyborg Chemist Set',
    category: 'tops',
    assetUrl: '/buddies/costume_cyborg.png',
    zIndex: 60,
    price: 50,
    description: 'Cybernetic enhancement suite featuring a metallic ocular implant and robotic arm holding an active bubbling potion.',
  },
];

// ==========================================
// 4. STORAGE & CATALOG RETRIEVAL
// ==========================================

const CUSTOM_BUDDY_ITEMS_KEY = 'sm_custom_buddy_items';

export const GOOGLE_SHEET_BUDDY_ITEMS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1vwXuw-TBYxUXKXUSipa2drArRNXZuKNwbXFhxcVbIc0/gviz/tq?tqx=out:csv&sheet=Buddy_Items';

const SHEET_BUDDY_ITEMS_KEY = 'sm_sheet_buddy_items';

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

    // If no name or (category / price / url) found, the tab doesn't exist yet (Google Sheet returned default tab)
    if (nameIdx === -1 || (catIdx === -1 && priceIdx === -1 && urlIdx === -1)) {
      return [];
    }

    const defaultZ: Record<string, number> = {
      capes: 20,
      base_body: 30,
      expression: 40,
      tops: 60,
      bottoms: 65,
      shoes: 70,
      face_accessory: 80,
      headwear: 90,
      hair: 95,
      props: 110,
    };

    const validCategories: BuddyLayerCategory[] = [
      'base_body', 'expression', 'headwear', 'hair', 'tops', 'bottoms', 'capes', 'props', 'face_accessory', 'shoes'
    ];

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

      const rawCat = catIdx !== -1 ? String(row[catIdx] || '').trim().toLowerCase().replace(/[^a-z_]/g, '') : 'tops';
      const category: BuddyLayerCategory = validCategories.includes(rawCat as any) ? (rawCat as BuddyLayerCategory) : 'tops';

      const rawPrice = priceIdx !== -1 ? String(row[priceIdx] || '').replace(/[^0-9]/g, '') : '0';
      const price = parseInt(rawPrice, 10) || 0;

      let assetUrl = urlIdx !== -1 ? String(row[urlIdx] || '').trim() : '';
      if (!assetUrl) continue;

      const rawZ = zIdx !== -1 ? parseInt(String(row[zIdx] || '').replace(/[^0-9]/g, ''), 10) : NaN;
      const zIndex = !isNaN(rawZ) ? rawZ : (defaultZ[category] || 60);

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
 * Returns all available Buddy items combining built-in presets and developer-uploaded items.
 */
export function getAllBuddyItems(): BuddyItem[] {
  let customItems: BuddyItem[] = [];
  let sheetItems: BuddyItem[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CUSTOM_BUDDY_ITEMS_KEY);
      if (stored) customItems = JSON.parse(stored);
      const sheetStored = localStorage.getItem(SHEET_BUDDY_ITEMS_KEY);
      if (sheetStored) sheetItems = JSON.parse(sheetStored);
    } catch (_) {}
  }

  // Deduplicate by ID
  const map = new Map<string, BuddyItem>();
  DEFAULT_BUDDY_ITEMS.forEach((it) => map.set(it.id, it));
  customItems.forEach((it) => map.set(it.id, { ...it, isCustom: true }));
  sheetItems.forEach((it) => map.set(it.id, { ...it, isCustom: true }));
  return Array.from(map.values());
}

/**
 * Saves a developer-uploaded Buddy item to the global library.
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
    } catch (_) {}
  }
  return getAllBuddyItems();
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
// 5. MEMBER CONFIGURATION & WALLET LOGIC
// ==========================================

export function getDefaultBuddyConfig(): BuddyConfig {
  return {
    baseColor: 'cyan',
    equipped: {
      base_body: 'body_cyan',
      expression: 'expr_smile',
      tops: 'top_sm_shirt',
    },
    unlockedItemIds: [
      'body_cyan',
      'body_orange',
      'expr_smile',
      'top_sm_shirt',
    ],
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

  const newBalance = Math.max(0, currentBalance - Math.max(0, price));

  // Save config & balance
  await updateMemberBuddyConfigInNeon(accountId, JSON.stringify(updatedConfig));
  await updateMemberBuddyBucksInNeon(accountId, newBalance);

  return {
    success: true,
    newBalance,
    newConfig: updatedConfig,
  };
}

/**
 * Equips an item into the Buddy configuration.
 */
export function equipBuddyItem(config: BuddyConfig, item: BuddyItem): BuddyConfig {
  const newEquipped: BuddyEquippedLayers = { ...config.equipped };

  if (item.category === 'base_body') {
    newEquipped.base_body = item.id;
    // Derive base color from item
    if (item.id === 'body_orange') config.baseColor = 'orange';
    else if (item.id === 'body_cyan') config.baseColor = 'cyan';
  } else {
    // If clicking an already equipped item, unequip it (toggle)
    if (newEquipped[item.category] === item.id) {
      delete newEquipped[item.category];
    } else {
      newEquipped[item.category] = item.id;
    }
  }

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
  category: BuddyLayerCategory
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

  const newEquipped: BuddyEquippedLayers = {
    base_body: chosenColor.id === 'orange' ? 'body_orange' : 'body_cyan',
  };

  const optionalCategories: BuddyLayerCategory[] = [
    'expression',
    'headwear',
    'tops',
    'capes',
    'props',
    'shoes',
  ];

  optionalCategories.forEach((cat) => {
    const itemsInCat = availableItems.filter((i) => i.category === cat);
    if (itemsInCat.length > 0 && Math.random() > 0.3) {
      const pick = itemsInCat[Math.floor(Math.random() * itemsInCat.length)];
      newEquipped[cat] = pick.id;
    }
  });

  return {
    ...currentConfig,
    baseColor: chosenColor.id,
    equipped: newEquipped,
    updatedAt: new Date().toISOString(),
  };
}
