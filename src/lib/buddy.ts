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
  // --- BASE BODIES ---
  {
    id: 'body_cyan',
    name: 'Classic Cyan Buddy',
    category: 'base_body',
    assetUrl: '/buddies/base_cyan.png',
    zIndex: 30,
    price: 0,
    description: 'The signature Social Medium waving cyan mascot.',
  },
  {
    id: 'body_orange',
    name: 'Vibrant Orange Buddy',
    category: 'base_body',
    assetUrl: '/buddies/base_orange.png',
    zIndex: 30,
    price: 0,
    description: 'Energetic Social Medium orange mascot.',
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

  // --- EXPRESSIONS ---
  {
    id: 'expr_smile',
    name: 'Cheerful Smile',
    category: 'expression',
    assetUrl: '',
    zIndex: 40,
    price: 0,
    description: 'Default friendly Buddy smile.',
  },
  {
    id: 'expr_joy',
    name: 'Wide Laughing Smile',
    category: 'expression',
    assetUrl: '',
    zIndex: 40,
    price: 10,
    description: 'Big happy mouth celebrating a successful print!',
  },
  {
    id: 'expr_neutral',
    name: 'Deep Focus',
    category: 'expression',
    assetUrl: '',
    zIndex: 40,
    price: 10,
    description: 'Concentrated look while soldering delicate circuits.',
  },
  {
    id: 'expr_wink',
    name: 'Cheeky Wink',
    category: 'expression',
    assetUrl: '',
    zIndex: 40,
    price: 15,
    description: 'Playful wink after making an amazing craft.',
  },

  // --- HATS & HEADWEAR ---
  {
    id: 'hat_wizard_standalone',
    name: 'Witch & Wizard Hat',
    category: 'headwear',
    assetUrl: '/buddies/costume_wizard.png',
    zIndex: 90,
    price: 25,
    description: 'Pointed dark sorcerer hat with silver buckle.',
  },
  {
    id: 'hat_sailor_hair',
    name: 'Golden Twintails',
    category: 'headwear',
    assetUrl: '/buddies/costume_sailor.png',
    zIndex: 90,
    price: 35,
    description: 'Lustrous blonde pigtails with red gem hair pieces.',
  },
  {
    id: 'hat_goggles',
    name: 'Laser Safety Goggles',
    category: 'headwear',
    assetUrl: '',
    zIndex: 90,
    price: 20,
    description: 'Essential OD6+ rated eye protection for the laser cutter.',
  },
  {
    id: 'hat_maker_beanie',
    name: 'Makerspace Beanie',
    category: 'headwear',
    assetUrl: '',
    zIndex: 90,
    price: 15,
    description: 'Cozy knitted cap for late night coding and prototyping.',
  },
  {
    id: 'hat_welding_mask',
    name: 'Auto-Darkening Mask',
    category: 'headwear',
    assetUrl: '',
    zIndex: 90,
    price: 40,
    description: 'Heavy duty protective welding helmet with optical sensor.',
  },

  // --- TOPS & OUTFITS ---
  {
    id: 'top_sm_shirt',
    name: 'Social Medium Maker Tee',
    category: 'tops',
    assetUrl: '',
    zIndex: 60,
    price: 0,
    description: 'Official community t-shirt with makerspace emblem.',
  },
  {
    id: 'top_leather_apron',
    name: 'Workshop Leather Apron',
    category: 'tops',
    assetUrl: '',
    zIndex: 60,
    price: 25,
    description: 'Tough suede apron with pockets for calipers and pens.',
  },
  {
    id: 'top_lab_coat',
    name: 'Scientist Lab Coat',
    category: 'tops',
    assetUrl: '',
    zIndex: 60,
    price: 30,
    description: 'Crisp white coat with pocket protector.',
  },

  // --- CAPES & BACK ACCESSORIES ---
  {
    id: 'cape_wizard_standalone',
    name: 'Midnight Cloak',
    category: 'capes',
    assetUrl: '/buddies/costume_wizard.png',
    zIndex: 20,
    price: 25,
    description: 'Flowing dark cape tied with an elegant bow.',
  },
  {
    id: 'cape_maker_backpack',
    name: 'Tinkerer Backpack',
    category: 'capes',
    assetUrl: '',
    zIndex: 20,
    price: 30,
    description: 'Heavy canvas pack loaded with screwdrivers and Arduino boards.',
  },
  {
    id: 'cape_wings',
    name: 'Cybernetic Glider Wings',
    category: 'capes',
    assetUrl: '',
    zIndex: 20,
    price: 60,
    description: 'Lightweight carbon-fiber wings for aerial navigation.',
  },

  // --- TOOLS & PROPS ---
  {
    id: 'prop_staff_standalone',
    name: 'Glowing Orb Staff',
    category: 'props',
    assetUrl: '/buddies/costume_wizard.png',
    zIndex: 110,
    price: 50,
    description: 'Sturdy wooden staff topped with a pulsating amethyst crystal orb.',
  },
  {
    id: 'prop_potion_standalone',
    name: 'Bubbling Green Chemical',
    category: 'props',
    assetUrl: '/buddies/costume_cyborg.png',
    zIndex: 110,
    price: 40,
    description: 'Glass test tube emitting mysterious luminous vapors.',
  },
  {
    id: 'prop_soldering_iron',
    name: 'Digital Soldering Station',
    category: 'props',
    assetUrl: '',
    zIndex: 110,
    price: 25,
    description: 'Chisel tip temperature controlled electronics tool.',
  },
  {
    id: 'prop_3d_benchy',
    name: '3D Printed Tugboat (Benchy)',
    category: 'props',
    assetUrl: '',
    zIndex: 110,
    price: 20,
    description: 'The universal benchmark 3D printer calibration test model.',
  },
  {
    id: 'prop_paint_palette',
    name: 'Artist Palette & Brush',
    category: 'props',
    assetUrl: '',
    zIndex: 110,
    price: 20,
    description: 'Wooden palette with acrylics and natural bristle brush.',
  },

  // --- FOOTWEAR ---
  {
    id: 'shoes_sailor_boots',
    name: 'Crimson Hero Boots',
    category: 'shoes',
    assetUrl: '/buddies/costume_sailor.png',
    zIndex: 70,
    price: 20,
    description: 'Knee-high glossy red boots with white trim.',
  },
  {
    id: 'shoes_steel_toe',
    name: 'Steel-Toe Work Boots',
    category: 'shoes',
    assetUrl: '',
    zIndex: 70,
    price: 15,
    description: 'Safety compliant leather footwear for the woodshop.',
  },
];

// ==========================================
// 4. STORAGE & CATALOG RETRIEVAL
// ==========================================

const CUSTOM_BUDDY_ITEMS_KEY = 'sm_custom_buddy_items';

/**
 * Returns all available Buddy items combining built-in presets and developer-uploaded items.
 */
export function getAllBuddyItems(): BuddyItem[] {
  let customItems: BuddyItem[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CUSTOM_BUDDY_ITEMS_KEY);
      if (stored) {
        customItems = JSON.parse(stored);
      }
    } catch (_) {}
  }

  // Deduplicate by ID
  const map = new Map<string, BuddyItem>();
  DEFAULT_BUDDY_ITEMS.forEach((it) => map.set(it.id, it));
  customItems.forEach((it) => map.set(it.id, { ...it, isCustom: true }));
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
