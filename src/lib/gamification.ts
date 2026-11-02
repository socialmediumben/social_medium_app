'use client';

import { XpActivityRule, XpAuditRecord, XpAwardEventDetail, XpLevelTier } from './types';

export const DEFAULT_XP_LEVEL_TIERS: XpLevelTier[] = [
  {
    level: 1,
    title: 'Novice Maker',
    minXp: 0,
    badgeEmoji: '🌱',
    reward: 'Welcome to Social Medium & Community Access',
    description: 'Beginner steps into the makerspace community',
  },
  {
    level: 2,
    title: 'Apprentice Tinkerer',
    minXp: 50,
    badgeEmoji: '🔨',
    reward: 'Custom Member Profile Badge & Avatar Frame',
    description: 'Learning the tools and building familiarity',
  },
  {
    level: 3,
    title: 'Craftsperson',
    minXp: 125,
    badgeEmoji: '⚙️',
    reward: 'Social Medium Holographic Laptop Sticker',
    description: 'Regular participant creating great projects',
  },
  {
    level: 4,
    title: 'Journeyman Builder',
    minXp: 250,
    badgeEmoji: '🧰',
    reward: '10% Off First Snack Shack Purchase',
    description: 'Skilled collaborator familiar with makerspace workshops',
  },
  {
    level: 5,
    title: 'Artisan Specialist',
    minXp: 450,
    badgeEmoji: '🎨',
    reward: 'Free Laser Cutter / 3D Print Test Token',
    description: 'Experienced creator with specialized fabrication skills',
  },
  {
    level: 6,
    title: 'Senior Fabricator',
    minXp: 700,
    badgeEmoji: '🚀',
    reward: 'Feature Highlight on Space Projector & Wall',
    description: 'Pillar of the shop helping others succeed',
  },
  {
    level: 7,
    title: 'Master Engineer',
    minXp: 1000,
    badgeEmoji: '⚡',
    reward: 'Exclusive Social Medium Enamel Pin',
    description: 'Accomplished technical mastery across space domains',
  },
  {
    level: 8,
    title: 'Visionary Inventor',
    minXp: 1400,
    badgeEmoji: '💡',
    reward: 'VIP Access to Guest Workshops & Masterclasses',
    description: 'Innovator creating advanced, inspiring community works',
  },
  {
    level: 9,
    title: 'Mythic Artificer',
    minXp: 1850,
    badgeEmoji: '🔮',
    reward: 'Custom Makerspace Merch / T-Shirt Voucher',
    description: 'Legendary maker whose crafts inspire everyone',
  },
  {
    level: 10,
    title: 'Grand Architect',
    minXp: 2500,
    badgeEmoji: '👑',
    reward: 'Name on Makerspace Wall of Fame & Golden Badge',
    description: 'Highest echelon of makerspace mastery and leadership',
  },
];

export const DEFAULT_XP_RULES: XpActivityRule[] = [
  {
    id: 'first_app_login',
    name: 'First App Sign-In',
    description: 'One-time bonus for setting up and logging into the companion app',
    xpReward: 50,
    icon: '✨',
    category: 'app',
    enabled: true,
    cooldown: 'once',
  },
  {
    id: 'daily_app_login',
    name: 'Daily App Visit',
    description: 'Daily sign-in reward for staying active in the community app',
    xpReward: 10,
    icon: '📱',
    category: 'app',
    enabled: true,
    cooldown: 'daily',
  },
  {
    id: 'kiosk_checkin',
    name: 'Check-In Kiosk Arrival',
    description: 'Checking in at the physical front entrance kiosk',
    xpReward: 20,
    icon: '📍',
    category: 'space',
    enabled: true,
    cooldown: 'daily',
  },
  {
    id: 'club_checkin',
    name: 'Club Meeting Check-In',
    description: 'Attending Cosplay Club, Teen Club, or meetup groups',
    xpReward: 25,
    icon: '👥',
    category: 'community',
    enabled: true,
    cooldown: 'daily',
  },
  {
    id: 'photobooth_snap',
    name: 'Photobooth Snapshot',
    description: 'Taking a picture at the Social Medium Portal door',
    xpReward: 15,
    icon: '📸',
    category: 'space',
    enabled: true,
    cooldown: 'daily',
  },
  {
    id: 'event_attend',
    name: 'Event / Workshop Attendance',
    description: 'RSVPing and participating in classes, demos, or workshops',
    xpReward: 30,
    icon: '🎟️',
    category: 'events',
    enabled: true,
    cooldown: 'unlimited',
  },
  {
    id: 'store_purchase',
    name: 'Store Self-Checkout',
    description: 'Offsetting material or snack costs (Base 10 XP + 1 XP per $1 spent)',
    xpReward: 10,
    icon: '🛒',
    category: 'space',
    enabled: true,
    cooldown: 'unlimited',
  },
  {
    id: 'donation',
    name: 'Space Donation / Tab Offset',
    description: 'Offsetting member tab or donating (Base 25 XP + 1 XP per $1 donated)',
    xpReward: 25,
    icon: '💖',
    category: 'community',
    enabled: true,
    cooldown: 'unlimited',
  },
];

const STORAGE_KEY_TIERS = 'sm_xp_level_tiers';
const STORAGE_KEY_RULES = 'sm_xp_activity_rules';
const STORAGE_KEY_AUDIT_PREFIX = 'sm_xp_history_';

/**
 * Retrieve current level tiers (from localStorage or defaults)
 */
export function fetchXpLevelTiers(): XpLevelTier[] {
  if (typeof window === 'undefined') return DEFAULT_XP_LEVEL_TIERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TIERS);
    if (!raw) return DEFAULT_XP_LEVEL_TIERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Sort ascending by minXp
      return parsed.sort((a, b) => (a.minXp || 0) - (b.minXp || 0));
    }
  } catch (err) {
    console.error('Failed to parse stored XP level tiers:', err);
  }
  return DEFAULT_XP_LEVEL_TIERS;
}

/**
 * Persist modified level tiers to localStorage
 */
export function saveXpLevelTiers(tiers: XpLevelTier[]): void {
  if (typeof window === 'undefined') return;
  const sorted = [...tiers].sort((a, b) => (a.minXp || 0) - (b.minXp || 0));
  localStorage.setItem(STORAGE_KEY_TIERS, JSON.stringify(sorted));
}

/**
 * Reset level tiers to canonical defaults
 */
export function resetXpLevelTiers(): XpLevelTier[] {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_TIERS);
  }
  return DEFAULT_XP_LEVEL_TIERS;
}

/**
 * Calculate member level, title, progress percent, and XP needed for next tier
 */
export function calculateLevelFromXp(xpInput: number | undefined | null, customTiers?: XpLevelTier[]) {
  const xp = Math.max(0, xpInput || 0);
  const tiers = customTiers || fetchXpLevelTiers();

  // Find the highest tier where minXp <= xp
  let currentTier = tiers[0] || DEFAULT_XP_LEVEL_TIERS[0];
  let currentTierIndex = 0;

  for (let i = 0; i < tiers.length; i++) {
    if (xp >= tiers[i].minXp) {
      currentTier = tiers[i];
      currentTierIndex = i;
    } else {
      break;
    }
  }

  const nextTier: XpLevelTier | null = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;

  let progressPercent = 100;
  let xpInCurrentTier = xp - currentTier.minXp;
  let xpNeededForNextTier = 0;

  if (nextTier) {
    const tierSpan = nextTier.minXp - currentTier.minXp;
    xpNeededForNextTier = Math.max(0, nextTier.minXp - xp);
    if (tierSpan > 0) {
      progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentTier / tierSpan) * 100)));
    }
  }

  return {
    level: currentTier.level,
    title: currentTier.title,
    badgeEmoji: currentTier.badgeEmoji,
    reward: currentTier.reward,
    currentTier,
    nextTier,
    xp,
    xpInCurrentTier,
    xpNeededForNextTier,
    progressPercent,
    isMaxLevel: nextTier === null,
  };
}

/**
 * Retrieve configured activity rules
 */
export function fetchXpActivityRules(): XpActivityRule[] {
  if (typeof window === 'undefined') return DEFAULT_XP_RULES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RULES);
    if (!raw) return DEFAULT_XP_RULES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse stored XP rules:', err);
  }
  return DEFAULT_XP_RULES;
}

/**
 * Persist modified activity rules to localStorage
 */
export function saveXpActivityRules(rules: XpActivityRule[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(rules));
}

/**
 * Reset activity rules to defaults
 */
export function resetXpActivityRules(): XpActivityRule[] {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_RULES);
  }
  return DEFAULT_XP_RULES;
}

/**
 * Fetch member XP audit records from local cache
 */
export function getXpAuditHistory(accountId: string): XpAuditRecord[] {
  if (typeof window === 'undefined' || !accountId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_AUDIT_PREFIX}${accountId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to load XP audit records:', err);
  }
  return [];
}

/**
 * Record a new XP audit transaction
 */
function appendXpAuditRecord(accountId: string, record: XpAuditRecord): void {
  if (typeof window === 'undefined' || !accountId) return;
  try {
    const history = getXpAuditHistory(accountId);
    // Keep up to 100 most recent records
    const updated = [record, ...history].slice(0, 100);
    localStorage.setItem(`${STORAGE_KEY_AUDIT_PREFIX}${accountId}`, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to append XP audit record:', err);
  }
}

/**
 * Check if a rule can be claimed right now based on its cooldown policy
 */
export function canClaimXp(accountId: string, rule: XpActivityRule): boolean {
  if (!rule.enabled) return false;
  if (!rule.cooldown || rule.cooldown === 'unlimited') return true;

  const history = getXpAuditHistory(accountId);
  const matching = history.filter((h) => h.ruleId === rule.id);

  if (rule.cooldown === 'once') {
    return matching.length === 0;
  }

  if (rule.cooldown === 'daily') {
    if (matching.length === 0) return true;
    const todayStr = new Date().toISOString().split('T')[0];
    const hasClaimedToday = matching.some((h) => {
      try {
        const itemDateStr = new Date(h.timestamp).toISOString().split('T')[0];
        return itemDateStr === todayStr;
      } catch {
        return false;
      }
    });
    return !hasClaimedToday;
  }

  return true;
}

/**
 * Read current member XP from local cache
 */
export function getLocalMemberXp(accountId: string): number {
  if (typeof window === 'undefined' || !accountId) return 0;
  try {
    const val = localStorage.getItem(`sm_xp_${accountId}`);
    if (val !== null) {
      const num = parseInt(val, 10);
      if (!isNaN(num)) return num;
    }
  } catch {}
  return 0;
}

/**
 * Save member XP to local cache
 */
export function setLocalMemberXp(accountId: string, newXp: number): void {
  if (typeof window === 'undefined' || !accountId) return;
  try {
    localStorage.setItem(`sm_xp_${accountId}`, String(Math.max(0, newXp)));
  } catch {}
}

/**
 * Core function to award XP to a member, verify cooldowns, calculate levels,
 * update local/CRM storage, and dispatch celebration events.
 */
export async function awardMemberXp(params: {
  accountId: string;
  ruleId: string;
  customMultiplier?: number;
  note?: string;
  force?: boolean;
}): Promise<{
  success: boolean;
  xpEarned: number;
  newTotalXp: number;
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  tier: XpLevelTier;
  error?: string;
}> {
  const { accountId, ruleId, customMultiplier = 0, note, force = false } = params;
  if (!accountId) {
    return {
      success: false,
      xpEarned: 0,
      newTotalXp: 0,
      leveledUp: false,
      oldLevel: 1,
      newLevel: 1,
      tier: DEFAULT_XP_LEVEL_TIERS[0],
      error: 'No account ID provided',
    };
  }

  const rules = fetchXpActivityRules();
  const rule = rules.find((r) => r.id === ruleId);
  if (!rule) {
    return {
      success: false,
      xpEarned: 0,
      newTotalXp: getLocalMemberXp(accountId),
      leveledUp: false,
      oldLevel: 1,
      newLevel: 1,
      tier: DEFAULT_XP_LEVEL_TIERS[0],
      error: `Rule ${ruleId} not found`,
    };
  }

  if (!rule.enabled && !force) {
    return {
      success: false,
      xpEarned: 0,
      newTotalXp: getLocalMemberXp(accountId),
      leveledUp: false,
      oldLevel: 1,
      newLevel: 1,
      tier: DEFAULT_XP_LEVEL_TIERS[0],
      error: 'Rule is disabled',
    };
  }

  if (!force && !canClaimXp(accountId, rule)) {
    return {
      success: false,
      xpEarned: 0,
      newTotalXp: getLocalMemberXp(accountId),
      leveledUp: false,
      oldLevel: 1,
      newLevel: 1,
      tier: DEFAULT_XP_LEVEL_TIERS[0],
      error: 'Cooldown active for this activity',
    };
  }

  // Calculate XP earned: base reward + customMultiplier (e.g. $1 per dollar spent/donated)
  const baseReward = rule.xpReward || 0;
  const extraPoints = Math.max(0, Math.round(customMultiplier || 0));
  const xpEarned = baseReward + extraPoints;

  const oldTotalXp = getLocalMemberXp(accountId);
  const newTotalXp = oldTotalXp + xpEarned;

  const tiers = fetchXpLevelTiers();
  const oldLevelState = calculateLevelFromXp(oldTotalXp, tiers);
  const newLevelState = calculateLevelFromXp(newTotalXp, tiers);
  const leveledUp = newLevelState.level > oldLevelState.level;

  // Persist locally
  setLocalMemberXp(accountId, newTotalXp);

  // Append audit trail
  const auditRecord: XpAuditRecord = {
    id: `xp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ruleId: rule.id,
    activityName: rule.name,
    xpEarned,
    timestamp: new Date().toISOString(),
    note: note || rule.description,
  };
  appendXpAuditRecord(accountId, auditRecord);

  // Background sync with Neon CRM custom field if available
  try {
    const { updateMemberXpInNeon } = await import('./neon');
    updateMemberXpInNeon(accountId, newTotalXp).catch((err) => {
      console.warn('Neon XP background sync notice:', err);
    });
  } catch (err) {
    console.warn('Could not trigger Neon XP sync:', err);
  }

  // Dispatch global event for live navbar badge updates & celebratory modal
  if (typeof window !== 'undefined') {
    const eventDetail: XpAwardEventDetail = {
      accountId,
      ruleId: rule.id,
      activityName: rule.name,
      xpEarned,
      newTotalXp,
      oldLevel: oldLevelState.level,
      newLevel: newLevelState.level,
      leveledUp,
      levelTitle: newLevelState.title,
      levelBadge: newLevelState.badgeEmoji,
      rewardUnlocked: leveledUp ? newLevelState.reward : undefined,
      note: auditRecord.note,
    };

    window.dispatchEvent(
      new CustomEvent('sm_xp_awarded', {
        detail: eventDetail,
      })
    );
  }

  return {
    success: true,
    xpEarned,
    newTotalXp,
    leveledUp,
    oldLevel: oldLevelState.level,
    newLevel: newLevelState.level,
    tier: newLevelState.currentTier,
  };
}

/**
 * Direct override of member XP (used by Developer Studio diagnostic tester)
 */
export async function setMemberXpDirectly(
  accountId: string,
  newXp: number,
  reason: string = 'Developer override'
): Promise<{
  newTotalXp: number;
  level: number;
  title: string;
  badgeEmoji: string;
  reward: string;
}> {
  const safeXp = Math.max(0, Math.round(newXp));
  const oldXp = getLocalMemberXp(accountId);
  setLocalMemberXp(accountId, safeXp);

  const tiers = fetchXpLevelTiers();
  const oldState = calculateLevelFromXp(oldXp, tiers);
  const newState = calculateLevelFromXp(safeXp, tiers);
  const leveledUp = newState.level > oldState.level;

  appendXpAuditRecord(accountId, {
    id: `xp_override_${Date.now()}`,
    ruleId: 'developer_override',
    activityName: 'Developer Override',
    xpEarned: safeXp - oldXp,
    timestamp: new Date().toISOString(),
    note: reason,
  });

  try {
    const { updateMemberXpInNeon } = await import('./neon');
    updateMemberXpInNeon(accountId, safeXp).catch(() => {});
  } catch {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sm_xp_awarded', {
        detail: {
          accountId,
          ruleId: 'developer_override',
          activityName: 'Developer Override',
          xpEarned: safeXp - oldXp,
          newTotalXp: safeXp,
          oldLevel: oldState.level,
          newLevel: newState.level,
          leveledUp,
          levelTitle: newState.title,
          levelBadge: newState.badgeEmoji,
          rewardUnlocked: leveledUp ? newState.reward : undefined,
          note: reason,
        } as XpAwardEventDetail,
      })
    );
  }

  return {
    newTotalXp: safeXp,
    level: newState.level,
    title: newState.title,
    badgeEmoji: newState.badgeEmoji,
    reward: newState.reward,
  };
}
