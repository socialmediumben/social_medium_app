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
        syncBuddyBubbleToCloud(cleanId, buddies).catch(() => {});
      }
    } catch (e) {
      console.warn('Failed to save buddy bubble to localStorage:', e);
    }
  }

  return state;
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
 * Adds a new buddy to the member's Buddy Bubble.
 * BIDIRECTIONAL: Also automatically adds currentMember to newBuddy's bubble
 * in local storage and in the cloud settings proxy so both users see each other!
 */
export function addBuddyToBubble(
  accountId: string,
  newBuddy: BuddyBubbleMember,
  currentMemberProfile?: MemberProfile | null
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

  // 1. Add newBuddy to User A's bubble
  const currentBuddies = loadBuddyBubble(cleanId);
  const existingIdx = currentBuddies.findIndex(
    (b) => b.accountId.toLowerCase() === buddyId.toLowerCase()
  );

  let updatedList: BuddyBubbleMember[];
  let alreadyAdded = false;

  if (existingIdx >= 0) {
    alreadyAdded = true;
    updatedList = [...currentBuddies];
    updatedList[existingIdx] = {
      ...updatedList[existingIdx],
      ...newBuddy,
      addedAt: updatedList[existingIdx].addedAt || newBuddy.addedAt || new Date().toISOString(),
    };
  } else {
    const fullBuddy: BuddyBubbleMember = {
      ...newBuddy,
      addedAt: newBuddy.addedAt || new Date().toISOString(),
    };
    updatedList = [fullBuddy, ...currentBuddies];
  }

  saveBuddyBubble(cleanId, updatedList);

  // 2. BIDIRECTIONAL: Also add User A to User B's bubble!
  if (currentMemberProfile) {
    try {
      const myRecord = convertProfileToBuddyMember(currentMemberProfile);
      const recipientBuddies = loadBuddyBubble(buddyId);
      const rIdx = recipientBuddies.findIndex(
        (b) => b.accountId.toLowerCase() === cleanId.toLowerCase()
      );

      let updatedRecipientList: BuddyBubbleMember[];
      if (rIdx >= 0) {
        updatedRecipientList = [...recipientBuddies];
        updatedRecipientList[rIdx] = {
          ...updatedRecipientList[rIdx],
          ...myRecord,
        };
      } else {
        updatedRecipientList = [myRecord, ...recipientBuddies];
      }

      // Save to recipient's local storage key
      const rTargetId = isSandboxAccount(buddyId) ? SANDBOX_ACCOUNT_ID : buddyId;
      localStorage.setItem(
        getBuddyBubbleStorageKey(rTargetId),
        JSON.stringify({
          accountId: rTargetId,
          buddies: updatedRecipientList,
          updatedAt: new Date().toISOString(),
        })
      );

      // Push reciprocal connection to cloud proxy so recipient's device gets it
      if (!isSandboxAccount(cleanId) && !isSandboxAccount(buddyId)) {
        import('./neon').then(({ updateGlobalAppSettings }) => {
          updateGlobalAppSettings({
            [`buddy_bubble_${cleanId}`]: JSON.stringify(updatedList),
            [`buddy_bubble_${buddyId}`]: JSON.stringify(updatedRecipientList),
          }).catch(() => {});
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Bidirectional buddy addition notice:', e);
    }
  }

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

  if (idx >= 0) {
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
 * Builds a clean, compact pairing URL for a member's Buddy Pass.
 * Uses concise query parameters so the QR code matrix is lower density and scans instantly.
 */
export function generateBuddyPassUrl(member: MemberProfile | null | undefined): string {
  if (!member) return '';
  const baseUrl =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://app.socialmedium.space';

  const accountId = encodeURIComponent(member.accountId || member.tapCard || '');
  const tapCard = encodeURIComponent(member.tapCard || '');
  const preferredName = encodeURIComponent(getGreetingName(member));

  // Compact URL: /profile?add={accountId}&band={tapCard}&name={preferredName}
  return `${baseUrl}/profile?add=${accountId}&band=${tapCard}&name=${preferredName}`;
}

/**
 * Generates an unobstructed, high-contrast QR Code URL with Level H (30%) error correction.
 */
export function generateBuddyPassQrCodeUrl(passUrl: string, size = 320): string {
  if (!passUrl) return '';
  const encoded = encodeURIComponent(passUrl);
  // ecc=H: highest error correction recovery rate
  // qzone=4: clean margin so camera auto-focus locks on immediately
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&ecc=H&qzone=4&margin=4`;
}

/**
 * Resolves buddy information from either an Account ID, Tap Card UID, URL, or scan data.
 */
export async function resolveBuddyFromScanOrUid(
  rawInput: string
): Promise<{ success: boolean; member?: BuddyBubbleMember; error?: string }> {
  const clean = String(rawInput || '').trim();
  if (!clean) {
    return { success: false, error: 'No tag or card data detected.' };
  }

  // 1. Check if input is a URL (e.g. from QR scan, NFC NDEF, or link share)
  if (
    clean.startsWith('http://') ||
    clean.startsWith('https://') ||
    clean.includes('add=') ||
    clean.includes('buddy=') ||
    clean.includes('card=') ||
    clean.includes('tapCard=') ||
    clean.includes('band=')
  ) {
    try {
      const url = new URL(
        clean,
        typeof window !== 'undefined' ? window.location.origin : 'https://app.socialmedium.space'
      );
      const targetParam =
        url.searchParams.get('add') ||
        url.searchParams.get('buddy') ||
        url.searchParams.get('card') ||
        url.searchParams.get('tapCard') ||
        url.searchParams.get('band');
      const nameParam = url.searchParams.get('name');
      const bandParam = url.searchParams.get('band') || url.searchParams.get('card') || url.searchParams.get('tapCard');

      if (targetParam) {
        // A. Check if it matches a sandbox / demo account
        if (isSandboxAccount(targetParam)) {
          return { success: true, member: { ...INITIAL_SANDBOX_BUDDIES[0] } };
        }
        const demoBuddy = INITIAL_SANDBOX_BUDDIES.find(
          (b) => b.accountId === targetParam || b.tapCard === targetParam
        );
        if (demoBuddy) {
          return { success: true, member: demoBuddy };
        }

        // B. Try lookup by tapCard in Neon
        const tapRes = await searchMemberByTapCard(targetParam);
        if (tapRes.success && tapRes.member) {
          return { success: true, member: convertProfileToBuddyMember(tapRes.member) };
        }

        // C. Try lookup by accountId in Neon
        const accRes = await fetchMemberProfileByAccountId(targetParam);
        if (accRes.success && accRes.member) {
          return { success: true, member: convertProfileToBuddyMember(accRes.member) };
        }

        // D. Fallback: use URL payload
        return {
          success: true,
          member: {
            accountId: targetParam,
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

  // 2. Check Sandbox / Demo identifiers
  if (isSandboxAccount(clean)) {
    return { success: true, member: { ...INITIAL_SANDBOX_BUDDIES[0] } };
  }

  // 3. Try normalizing as NFC card UID / band ID
  const normalizedCard = normalizeNfcTapCard(clean);

  // Check demo buddy presets
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
 * Cloud sync for outbound connections.
 */
async function syncBuddyBubbleToCloud(
  accountId: string,
  buddies: BuddyBubbleMember[]
): Promise<void> {
  if (isSandboxAccount(accountId) || !accountId) return;

  try {
    const { updateGlobalAppSettings } = await import('./neon');
    await updateGlobalAppSettings({
      [`buddy_bubble_${accountId}`]: JSON.stringify(buddies),
    });
  } catch (_) {}
}

/**
 * Background refresh of buddies' profiles AND synchronization of inbound friends
 * who added this account from other devices.
 */
export async function refreshBuddyProfiles(
  accountId: string,
  buddies: BuddyBubbleMember[]
): Promise<BuddyBubbleMember[]> {
  if (!accountId || isSandboxAccount(accountId)) {
    return buddies;
  }

  let updated = [...buddies];
  let hasChanges = false;

  // 1. Fetch inbound friends from cloud settings proxy
  try {
    const { fetchGlobalAppSettings } = await import('./neon');
    const settings = await fetchGlobalAppSettings();
    if (settings && settings[`buddy_bubble_${accountId}`]) {
      const cloudBuddies: BuddyBubbleMember[] = JSON.parse(settings[`buddy_bubble_${accountId}`]);
      if (Array.isArray(cloudBuddies)) {
        cloudBuddies.forEach((cb) => {
          const exists = updated.some(
            (b) => b.accountId.toLowerCase() === cb.accountId.toLowerCase()
          );
          if (!exists && cb.accountId.toLowerCase() !== accountId.toLowerCase()) {
            updated.unshift(cb);
            hasChanges = true;
          }
        });
      }
    }
  } catch (_) {}

  // 2. Refresh avatar/level/title for existing buddies
  await Promise.all(
    updated.slice(0, 8).map(async (buddy, index) => {
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
