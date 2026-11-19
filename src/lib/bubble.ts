'use client';

import {
  BuddyBubbleMember,
  BuddyBubbleState,
  MemberProfile,
  getGreetingName,
} from './types';
import {
  isSandboxAccount,
  INITIAL_SANDBOX_BUDDIES,
  SANDBOX_ACCOUNT_ID,
} from './sandbox';
import {
  searchMemberByTapCard,
  fetchMemberProfileByAccountId,
  normalizeNfcTapCard,
} from './neon';

const BUBBLE_STORAGE_PREFIX = 'sm_buddy_bubble_';
const NEON_BUBBLE_FIELD_KEY = 'sm_neon_buddy_bubble_field_id';

/**
 * Returns the localStorage key for a specific member's Buddy Bubble.
 */
export function getBuddyBubbleStorageKey(accountId: string): string {
  const cleanId = String(accountId || 'guest').trim();
  return `${BUBBLE_STORAGE_PREFIX}${cleanId}`;
}

/**
 * Loads the active Buddy Bubble members for the specified account ID.
 */
export function loadBuddyBubble(accountId?: string | null): BuddyBubbleMember[] {
  if (!accountId) return [];
  const cleanId = String(accountId).trim();

  // 1. Sandbox Account Support
  if (isSandboxAccount(cleanId)) {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(getBuddyBubbleStorageKey(SANDBOX_ACCOUNT_ID));
        if (stored) {
          const parsed: BuddyBubbleState = JSON.parse(stored);
          if (Array.isArray(parsed.buddies)) {
            return parsed.buddies;
          }
        }
      } catch (_) {}
    }
    return [...INITIAL_SANDBOX_BUDDIES];
  }

  // 2. Real Account Local Storage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(getBuddyBubbleStorageKey(cleanId));
      if (stored) {
        const parsed: BuddyBubbleState = JSON.parse(stored);
        if (Array.isArray(parsed.buddies)) {
          return parsed.buddies;
        }
      }
    } catch (_) {}
  }

  return [];
}

/**
 * Persists the Buddy Bubble state to localStorage and dispatches a live reactive update.
 */
export function saveBuddyBubble(
  accountId: string,
  buddies: BuddyBubbleMember[]
): BuddyBubbleState {
  const cleanId = String(accountId).trim();
  const state: BuddyBubbleState = {
    accountId: cleanId,
    buddies,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const targetId = isSandboxAccount(cleanId) ? SANDBOX_ACCOUNT_ID : cleanId;
      localStorage.setItem(getBuddyBubbleStorageKey(targetId), JSON.stringify(state));
      window.dispatchEvent(
        new CustomEvent('sm_buddy_bubble_updated', {
          detail: { accountId: targetId, buddies, count: buddies.length },
        })
      );

      // Async cloud sync for authenticated non-sandbox members
      if (!isSandboxAccount(cleanId)) {
        syncBuddyBubbleToNeon(cleanId, buddies).catch(() => {});
      }
    } catch (e) {
      console.warn('Failed to save buddy bubble to localStorage:', e);
    }
  }

  return state;
}

/**
 * Adds a new buddy to the member's Buddy Bubble, or updates their profile if already present.
 */
export function addBuddyToBubble(
  accountId: string,
  newBuddy: BuddyBubbleMember
): { success: boolean; buddies: BuddyBubbleMember[]; error?: string; alreadyAdded?: boolean } {
  const cleanId = String(accountId).trim();
  const buddyId = String(newBuddy.accountId || '').trim();

  if (!cleanId) {
    return { success: false, buddies: [], error: 'Your account ID is missing.' };
  }
  if (!buddyId) {
    return { success: false, buddies: loadBuddyBubble(cleanId), error: 'Invalid buddy account.' };
  }
  if (cleanId.toLowerCase() === buddyId.toLowerCase()) {
    return { success: false, buddies: loadBuddyBubble(cleanId), error: "You can't add yourself to your own Buddy Bubble!" };
  }

  const currentBuddies = loadBuddyBubble(cleanId);
  const existingIdx = currentBuddies.findIndex(
    (b) => b.accountId.toLowerCase() === buddyId.toLowerCase()
  );

  let updatedList: BuddyBubbleMember[];
  let alreadyAdded = false;

  if (existingIdx >= 0) {
    // Update existing buddy with fresh info
    alreadyAdded = true;
    updatedList = [...currentBuddies];
    updatedList[existingIdx] = {
      ...updatedList[existingIdx],
      ...newBuddy,
      // Retain original addedAt
      addedAt: updatedList[existingIdx].addedAt || newBuddy.addedAt || new Date().toISOString(),
    };
  } else {
    // Prepend new buddy
    const fullBuddy: BuddyBubbleMember = {
      ...newBuddy,
      addedAt: newBuddy.addedAt || new Date().toISOString(),
    };
    updatedList = [fullBuddy, ...currentBuddies];
  }

  saveBuddyBubble(cleanId, updatedList);
  return { success: true, buddies: updatedList, alreadyAdded };
}

/**
 * Removes a buddy from the member's Buddy Bubble.
 */
export function removeBuddyFromBubble(
  accountId: string,
  buddyAccountId: string
): BuddyBubbleMember[] {
  const cleanId = String(accountId).trim();
  const cleanBuddyId = String(buddyAccountId).trim();
  const current = loadBuddyBubble(cleanId);
  const filtered = current.filter(
    (b) => b.accountId.toLowerCase() !== cleanBuddyId.toLowerCase()
  );

  saveBuddyBubble(cleanId, filtered);
  return filtered;
}

/**
 * Records a high-five or bubble cheer sent to a buddy.
 */
export function cheerBuddyInBubble(
  accountId: string,
  buddyAccountId: string
): BuddyBubbleMember | null {
  const cleanId = String(accountId).trim();
  const cleanBuddyId = String(buddyAccountId).trim();
  const current = loadBuddyBubble(cleanId);
  const idx = current.findIndex(
    (b) => b.accountId.toLowerCase() === cleanBuddyId.toLowerCase()
  );

  if (idx === 0 || idx > 0) {
    const updated = [...current];
    updated[idx] = {
      ...updated[idx],
      lastCheeredAt: new Date().toISOString(),
    };
    saveBuddyBubble(cleanId, updated);
    return updated[idx];
  }

  return null;
}

/**
 * Builds the direct deep-link pairing URL for a member's Buddy Pass.
 */
export function generateBuddyPassUrl(member: MemberProfile | null | undefined): string {
  if (!member) return '';
  const baseUrl =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://app.socialmedium.space';

  const accountId = encodeURIComponent(member.accountId || member.tapCard || '');
  const preferredName = encodeURIComponent(getGreetingName(member));
  const tapCard = encodeURIComponent(member.tapCard || '');

  return `${baseUrl}/profile?tab=bubble&action=add&buddy=${accountId}&name=${preferredName}&band=${tapCard}`;
}

/**
 * Generates an SVG/PNG QR Code image URL for the Buddy Pass link.
 */
export function generateBuddyPassQrCodeUrl(passUrl: string, size = 300): string {
  if (!passUrl) return '';
  const encoded = encodeURIComponent(passUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=8&qzone=2`;
}

/**
 * Resolves a MemberProfile into a standardized BuddyBubbleMember record.
 */
export function convertProfileToBuddyMember(profile: MemberProfile): BuddyBubbleMember {
  return {
    accountId: profile.accountId || profile.tapCard,
    name: profile.name || 'Maker',
    preferredName: getGreetingName(profile),
    pronouns: profile.pronouns || profile.gender || '',
    tapCard: profile.tapCard,
    buddyAvatar: profile.buddyAvatar,
    level: profile.level || 1,
    levelBadge: profile.levelBadge || '🌱',
    levelTitle: profile.levelTitle || 'Novice Maker',
    interests: profile.interests || [],
    addedAt: new Date().toISOString(),
  };
}

/**
 * Resolves buddy information from either an Account ID, Tap Card UID, or scan data.
 */
export async function resolveBuddyFromScanOrUid(
  rawInput: string
): Promise<{ success: boolean; member?: BuddyBubbleMember; error?: string }> {
  const clean = String(rawInput || '').trim();
  if (!clean) {
    return { success: false, error: 'No tag or card data detected.' };
  }

  // 1. Check if input is a full URL with query parameters
  if (clean.includes('buddy=') || clean.includes('band=') || clean.includes('action=add')) {
    try {
      const url = new URL(clean, typeof window !== 'undefined' ? window.location.origin : 'https://app.socialmedium.space');
      const buddyParam = url.searchParams.get('buddy');
      const bandParam = url.searchParams.get('band');
      const nameParam = url.searchParams.get('name');

      if (buddyParam) {
        // Query profile by buddy accountId
        const res = await fetchMemberProfileByAccountId(buddyParam);
        if (res.success && res.member) {
          return { success: true, member: convertProfileToBuddyMember(res.member) };
        }
      }
      if (bandParam) {
        const res = await searchMemberByTapCard(bandParam);
        if (res.success && res.member) {
          return { success: true, member: convertProfileToBuddyMember(res.member) };
        }
      }

      // If online lookup fails, use the URL payload itself
      if (buddyParam || nameParam) {
        return {
          success: true,
          member: {
            accountId: buddyParam || bandParam || 'buddy_' + Date.now(),
            name: decodeURIComponent(nameParam || 'Fellow Maker'),
            preferredName: decodeURIComponent(nameParam || 'Fellow Maker'),
            tapCard: bandParam || undefined,
            level: 1,
            levelBadge: '🌱',
            levelTitle: 'Maker',
            addedAt: new Date().toISOString(),
          },
        };
      }
    } catch (_) {}
  }

  // 2. Check Sandbox Account IDs or Demo references
  if (isSandboxAccount(clean)) {
    const sandboxMember = { ...INITIAL_SANDBOX_BUDDIES[0] };
    return { success: true, member: sandboxMember };
  }

  // 3. Try normalizing as NFC card UID / band ID
  const normalizedCard = normalizeNfcTapCard(clean);

  // Check if it's one of the demo buddies
  const demoMatch = INITIAL_SANDBOX_BUDDIES.find(
    (b) =>
      b.accountId.toLowerCase() === clean.toLowerCase() ||
      (b.tapCard && b.tapCard === clean) ||
      (b.tapCard && b.tapCard === normalizedCard)
  );
  if (demoMatch) {
    return { success: true, member: demoMatch };
  }

  // 4. Query Neon CRM by tapCard
  try {
    const tapLookup = await searchMemberByTapCard(normalizedCard);
    if (tapLookup.success && tapLookup.member) {
      return { success: true, member: convertProfileToBuddyMember(tapLookup.member) };
    }
  } catch (_) {}

  // 5. Query Neon CRM by accountId
  try {
    const accLookup = await fetchMemberProfileByAccountId(clean);
    if (accLookup.success && accLookup.member) {
      return { success: true, member: convertProfileToBuddyMember(accLookup.member) };
    }
  } catch (_) {}

  return {
    success: false,
    error: `Could not find a member registered with Band / ID "${clean}".`,
  };
}

/**
 * Lightweight cloud sync to Neon One CRM custom field or metadata.
 */
async function syncBuddyBubbleToNeon(
  accountId: string,
  buddies: BuddyBubbleMember[]
): Promise<void> {
  if (isSandboxAccount(accountId) || !accountId) return;

  try {
    const { updateGlobalAppSettings } = await import('./neon');
    // Save compact representation of buddies list
    const compactBuddies = buddies.map((b) => ({
      id: b.accountId,
      name: b.preferredName || b.name,
      addedAt: b.addedAt,
    }));
    await updateGlobalAppSettings({
      [`buddy_bubble_${accountId}`]: JSON.stringify(compactBuddies),
    });
  } catch (_) {
    // Non-blocking: local storage is primary
  }
}

/**
 * Background refresh of buddies' latest avatars, level badges, and titles.
 */
export async function refreshBuddyProfiles(
  accountId: string,
  buddies: BuddyBubbleMember[]
): Promise<BuddyBubbleMember[]> {
  if (!accountId || isSandboxAccount(accountId) || buddies.length === 0) {
    return buddies;
  }

  let hasChanges = false;
  const updated = [...buddies];

  // Refresh in parallel with a concurrency cap of 5
  await Promise.all(
    updated.slice(0, 10).map(async (buddy, index) => {
      try {
        const res = await fetchMemberProfileByAccountId(buddy.accountId);
        if (res.success && res.member) {
          const m = res.member;
          const freshAvatar = m.buddyAvatar;
          const freshLevel = m.level;
          const freshBadge = m.levelBadge;
          const freshTitle = m.levelTitle;

          if (
            (freshAvatar && freshAvatar !== buddy.buddyAvatar) ||
            (freshLevel && freshLevel !== buddy.level) ||
            (freshBadge && freshBadge !== buddy.levelBadge) ||
            (freshTitle && freshTitle !== buddy.levelTitle)
          ) {
            updated[index] = {
              ...buddy,
              buddyAvatar: freshAvatar || buddy.buddyAvatar,
              level: freshLevel || buddy.level,
              levelBadge: freshBadge || buddy.levelBadge,
              levelTitle: freshTitle || buddy.levelTitle,
            };
            hasChanges = true;
          }
        }
      } catch (_) {}
    })
  );

  if (hasChanges) {
    saveBuddyBubble(accountId, updated);
  }

  return updated;
}
