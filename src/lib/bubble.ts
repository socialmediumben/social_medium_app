'use client';

import {
  BuddyBubbleMember,
  BuddyBubbleState,
  MemberProfile,
  getGreetingName,
  CustomBubbleGroup,
  BubbleJoinInvite,
  BuiltInBubbleId,
} from './types';
import {
  isSandboxAccount,
  INITIAL_SANDBOX_BUDDIES,
  INITIAL_SANDBOX_CUSTOM_BUBBLES,
  SANDBOX_ACCOUNT_ID,
} from './sandbox';
import {
  searchMemberByTapCard,
  fetchMemberProfileByAccountId,
  normalizeNfcTapCard,
} from './neon';

const BUBBLE_STORAGE_PREFIX = 'sm_buddy_bubble_';
const CUSTOM_BUBBLE_STORAGE_PREFIX = 'sm_custom_bubbles_';

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

/**
 * Toggles a buddy's favorite status (Best Buddies).
 */
export function toggleBuddyFavorite(
  accountId: string,
  buddyAccountId: string
): BuddyBubbleMember[] {
  const cleanId = String(accountId || '').trim();
  const cleanBuddyId = String(buddyAccountId || '').trim();
  const current = loadBuddyBubble(cleanId);
  const idx = current.findIndex(
    (b) => b.accountId.toLowerCase() === cleanBuddyId.toLowerCase()
  );

  if (idx >= 0) {
    const updated = [...current];
    updated[idx] = {
      ...updated[idx],
      isFavorite: !updated[idx].isFavorite,
    };
    saveBuddyBubble(cleanId, updated);
    return updated;
  }
  return current;
}

/**
 * Returns the localStorage key for custom bubble groups for an account.
 */
export function getCustomBubbleStorageKey(accountId: string): string {
  const cleanId = String(accountId || 'guest').trim();
  return `${CUSTOM_BUBBLE_STORAGE_PREFIX}${cleanId}`;
}

/**
 * Loads the user's custom bubble groups (e.g. "D&D Club", "Denim Jacket Squad").
 */
export function loadUserCustomBubbles(accountId?: string | null): CustomBubbleGroup[] {
  if (!accountId) return [];
  const cleanId = String(accountId).trim();

  // 1. Sandbox support
  if (isSandboxAccount(cleanId)) {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(getCustomBubbleStorageKey(SANDBOX_ACCOUNT_ID));
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (_) {}
    }
    return [...INITIAL_SANDBOX_CUSTOM_BUBBLES];
  }

  // 2. Real account
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(getCustomBubbleStorageKey(cleanId));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
  }

  return [];
}

/**
 * Saves custom bubbles to localStorage, dispatches an update event, and syncs to cloud proxy.
 */
export function saveUserCustomBubbles(
  accountId: string,
  groups: CustomBubbleGroup[]
): void {
  const cleanId = String(accountId).trim();
  if (!cleanId) return;

  if (typeof window !== 'undefined') {
    try {
      const targetId = isSandboxAccount(cleanId) ? SANDBOX_ACCOUNT_ID : cleanId;
      localStorage.setItem(getCustomBubbleStorageKey(targetId), JSON.stringify(groups));
      window.dispatchEvent(
        new CustomEvent('sm_custom_bubbles_updated', {
          detail: { accountId: targetId, bubbles: groups, count: groups.length },
        })
      );

      // Async cloud sync for authenticated non-sandbox members
      if (!isSandboxAccount(cleanId)) {
        syncCustomBubblesToCloud(cleanId, groups).catch(() => {});
      }
    } catch (e) {
      console.warn('Failed to save custom bubbles to localStorage:', e);
    }
  }
}

/**
 * Creates a new custom bubble circle.
 * The creator is automatically added as a member and the initial administrator.
 */
export function createCustomBubble(
  creatorAccountId: string,
  name: string,
  icon = '🫧',
  description = '',
  initialMemberIds: string[] = []
): CustomBubbleGroup {
  const cleanCreator = String(creatorAccountId).trim();
  const currentGroups = loadUserCustomBubbles(cleanCreator);

  // Generate unique ID
  const newId = `bubble_grp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const allMembers = Array.from(new Set([cleanCreator, ...initialMemberIds]));

  const newGroup: CustomBubbleGroup = {
    id: newId,
    name: name.trim(),
    description: description.trim(),
    icon: icon.trim() || '🫧',
    creatorAccountId: cleanCreator,
    adminAccountIds: [cleanCreator],
    memberAccountIds: allMembers,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newGroup, ...currentGroups];
  saveUserCustomBubbles(cleanCreator, updated);

  // Update bubbleIds for buddies in creator's bubble
  if (initialMemberIds.length > 0) {
    const buddies = loadBuddyBubble(cleanCreator);
    const updatedBuddies = buddies.map((b) => {
      if (initialMemberIds.includes(b.accountId)) {
        const existing = b.bubbleIds || [];
        return { ...b, bubbleIds: Array.from(new Set([...existing, newId])) };
      }
      return b;
    });
    saveBuddyBubble(cleanCreator, updatedBuddies);
  }

  return newGroup;
}

/**
 * Updates a custom bubble's name, description, or icon (Admin only).
 */
export function updateCustomBubble(
  bubble: CustomBubbleGroup,
  requesterAccountId: string
): { success: boolean; error?: string; bubble?: CustomBubbleGroup } {
  const cleanRequester = String(requesterAccountId).trim();
  const groups = loadUserCustomBubbles(cleanRequester);
  const idx = groups.findIndex((g) => g.id === bubble.id);

  if (idx < 0) {
    return { success: false, error: 'Bubble not found.' };
  }

  const existing = groups[idx];
  const isAdmin =
    existing.adminAccountIds.some(
      (id) => id.toLowerCase() === cleanRequester.toLowerCase()
    ) || existing.creatorAccountId.toLowerCase() === cleanRequester.toLowerCase();

  if (!isAdmin) {
    return { success: false, error: 'Only a Bubble Admin can edit this bubble.' };
  }

  const updatedGroup: CustomBubbleGroup = {
    ...existing,
    name: bubble.name.trim() || existing.name,
    description: bubble.description !== undefined ? bubble.description.trim() : existing.description,
    icon: bubble.icon.trim() || existing.icon,
    color: bubble.color || existing.color,
    updatedAt: new Date().toISOString(),
  };

  const updatedGroups = [...groups];
  updatedGroups[idx] = updatedGroup;
  saveUserCustomBubbles(cleanRequester, updatedGroups);

  return { success: true, bubble: updatedGroup };
}

/**
 * Adds members to a custom bubble (Admin only).
 */
export function addMembersToCustomBubble(
  bubbleId: string,
  memberAccountIds: string[],
  adminAccountId: string
): { success: boolean; error?: string; bubble?: CustomBubbleGroup } {
  const cleanAdmin = String(adminAccountId).trim();
  const groups = loadUserCustomBubbles(cleanAdmin);
  const idx = groups.findIndex((g) => g.id === bubbleId);

  if (idx < 0) return { success: false, error: 'Bubble not found.' };

  const existing = groups[idx];
  const isAdmin =
    existing.adminAccountIds.some(
      (id) => id.toLowerCase() === cleanAdmin.toLowerCase()
    ) || existing.creatorAccountId.toLowerCase() === cleanAdmin.toLowerCase();

  if (!isAdmin) {
    return { success: false, error: 'Only a Bubble Admin can add members.' };
  }

  const mergedMembers = Array.from(new Set([...existing.memberAccountIds, ...memberAccountIds]));
  const updatedGroup: CustomBubbleGroup = {
    ...existing,
    memberAccountIds: mergedMembers,
    updatedAt: new Date().toISOString(),
  };

  const updatedGroups = [...groups];
  updatedGroups[idx] = updatedGroup;
  saveUserCustomBubbles(cleanAdmin, updatedGroups);

  // Also update buddy records in Big Bubble
  const buddies = loadBuddyBubble(cleanAdmin);
  const updatedBuddies = buddies.map((b) => {
    if (memberAccountIds.includes(b.accountId)) {
      const existingBubbles = b.bubbleIds || [];
      return { ...b, bubbleIds: Array.from(new Set([...existingBubbles, bubbleId])) };
    }
    return b;
  });
  saveBuddyBubble(cleanAdmin, updatedBuddies);

  return { success: true, bubble: updatedGroup };
}

/**
 * Removes a member from a custom bubble (Admin or self).
 */
export function removeMemberFromCustomBubble(
  bubbleId: string,
  memberAccountId: string,
  requesterAccountId: string
): { success: boolean; error?: string; bubble?: CustomBubbleGroup } {
  const cleanRequester = String(requesterAccountId).trim();
  const cleanMember = String(memberAccountId).trim();
  const groups = loadUserCustomBubbles(cleanRequester);
  const idx = groups.findIndex((g) => g.id === bubbleId);

  if (idx < 0) return { success: false, error: 'Bubble not found.' };

  const existing = groups[idx];
  const isAdmin = existing.adminAccountIds.some(
    (id) => id.toLowerCase() === cleanRequester.toLowerCase()
  );
  const isSelf = cleanRequester.toLowerCase() === cleanMember.toLowerCase();

  if (!isAdmin && !isSelf) {
    return { success: false, error: 'Permission denied.' };
  }

  const updatedMembers = existing.memberAccountIds.filter(
    (id) => id.toLowerCase() !== cleanMember.toLowerCase()
  );
  const updatedAdmins = existing.adminAccountIds.filter(
    (id) => id.toLowerCase() !== cleanMember.toLowerCase()
  );

  const updatedGroup: CustomBubbleGroup = {
    ...existing,
    memberAccountIds: updatedMembers,
    adminAccountIds: updatedAdmins.length > 0 ? updatedAdmins : [existing.creatorAccountId],
    updatedAt: new Date().toISOString(),
  };

  const updatedGroups = [...groups];
  updatedGroups[idx] = updatedGroup;
  saveUserCustomBubbles(cleanRequester, updatedGroups);

  // Update buddy record in Big Bubble
  const buddies = loadBuddyBubble(cleanRequester);
  const updatedBuddies = buddies.map((b) => {
    if (b.accountId.toLowerCase() === cleanMember.toLowerCase()) {
      return { ...b, bubbleIds: (b.bubbleIds || []).filter((id) => id !== bubbleId) };
    }
    return b;
  });
  saveBuddyBubble(cleanRequester, updatedBuddies);

  return { success: true, bubble: updatedGroup };
}

/**
 * Promotes an existing member to an Administrator of the bubble (Admin only).
 */
export function promoteBubbleAdmin(
  bubbleId: string,
  targetAccountId: string,
  currentAdminAccountId: string
): { success: boolean; error?: string; bubble?: CustomBubbleGroup } {
  const cleanCurrent = String(currentAdminAccountId).trim();
  const cleanTarget = String(targetAccountId).trim();
  const groups = loadUserCustomBubbles(cleanCurrent);
  const idx = groups.findIndex((g) => g.id === bubbleId);

  if (idx < 0) return { success: false, error: 'Bubble not found.' };

  const existing = groups[idx];
  const isAdmin = existing.adminAccountIds.some(
    (id) => id.toLowerCase() === cleanCurrent.toLowerCase()
  );

  if (!isAdmin) {
    return { success: false, error: 'Only an existing Admin can add additional Admins.' };
  }

  if (!existing.memberAccountIds.some((id) => id.toLowerCase() === cleanTarget.toLowerCase())) {
    return { success: false, error: 'Target user must be a member of this bubble first.' };
  }

  const updatedAdmins = Array.from(new Set([...existing.adminAccountIds, cleanTarget]));
  const updatedGroup: CustomBubbleGroup = {
    ...existing,
    adminAccountIds: updatedAdmins,
    updatedAt: new Date().toISOString(),
  };

  const updatedGroups = [...groups];
  updatedGroups[idx] = updatedGroup;
  saveUserCustomBubbles(cleanCurrent, updatedGroups);

  return { success: true, bubble: updatedGroup };
}

/**
 * Deletes a custom bubble (Admin or creator only).
 */
export function deleteCustomBubble(
  bubbleId: string,
  requesterAccountId: string
): { success: boolean; error?: string } {
  const cleanRequester = String(requesterAccountId).trim();
  const groups = loadUserCustomBubbles(cleanRequester);
  const existing = groups.find((g) => g.id === bubbleId);

  if (!existing) return { success: false, error: 'Bubble not found.' };

  const isAdmin =
    existing.adminAccountIds.some(
      (id) => id.toLowerCase() === cleanRequester.toLowerCase()
    ) || existing.creatorAccountId.toLowerCase() === cleanRequester.toLowerCase();

  if (!isAdmin) {
    return { success: false, error: 'Only a Bubble Admin can delete this bubble.' };
  }

  const updatedGroups = groups.filter((g) => g.id !== bubbleId);
  saveUserCustomBubbles(cleanRequester, updatedGroups);

  // Clean up bubbleIds across all buddies
  const buddies = loadBuddyBubble(cleanRequester);
  const updatedBuddies = buddies.map((b) => ({
    ...b,
    bubbleIds: (b.bubbleIds || []).filter((id) => id !== bubbleId),
  }));
  saveBuddyBubble(cleanRequester, updatedBuddies);

  return { success: true };
}

/**
 * Assigns or unassigns a single buddy to multiple custom bubbles at once.
 */
export function assignBuddyToBubbles(
  accountId: string,
  buddyAccountId: string,
  targetBubbleIds: string[],
  isFavorite?: boolean
): { buddies: BuddyBubbleMember[]; bubbles: CustomBubbleGroup[] } {
  const cleanId = String(accountId).trim();
  const cleanBuddyId = String(buddyAccountId).trim();

  // 1. Update buddy in Big Bubble
  const buddies = loadBuddyBubble(cleanId);
  const bIdx = buddies.findIndex((b) => b.accountId.toLowerCase() === cleanBuddyId.toLowerCase());
  let updatedBuddies = [...buddies];
  if (bIdx >= 0) {
    updatedBuddies[bIdx] = {
      ...updatedBuddies[bIdx],
      bubbleIds: targetBubbleIds,
      isFavorite: isFavorite !== undefined ? isFavorite : updatedBuddies[bIdx].isFavorite,
    };
    saveBuddyBubble(cleanId, updatedBuddies);
  }

  // 2. Update member lists across custom bubbles
  const groups = loadUserCustomBubbles(cleanId);
  const updatedGroups = groups.map((g) => {
    const shouldBeIn = targetBubbleIds.includes(g.id);
    const isCurrentlyIn = g.memberAccountIds.some(
      (id) => id.toLowerCase() === cleanBuddyId.toLowerCase()
    );

    if (shouldBeIn && !isCurrentlyIn) {
      return {
        ...g,
        memberAccountIds: [...g.memberAccountIds, cleanBuddyId],
        updatedAt: new Date().toISOString(),
      };
    } else if (!shouldBeIn && isCurrentlyIn) {
      return {
        ...g,
        memberAccountIds: g.memberAccountIds.filter(
          (id) => id.toLowerCase() !== cleanBuddyId.toLowerCase()
        ),
        adminAccountIds: g.adminAccountIds.filter(
          (id) => id.toLowerCase() !== cleanBuddyId.toLowerCase()
        ),
        updatedAt: new Date().toISOString(),
      };
    }
    return g;
  });

  saveUserCustomBubbles(cleanId, updatedGroups);
  return { buddies: updatedBuddies, bubbles: updatedGroups };
}

/**
 * Builds a clean pairing deep link for inviting members to a specific custom bubble.
 */
export function generateBubbleJoinUrl(
  bubble: CustomBubbleGroup,
  adminProfile: MemberProfile | null | undefined
): string {
  const baseUrl =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://app.socialmedium.space';

  const bubbleId = encodeURIComponent(bubble.id);
  const name = encodeURIComponent(bubble.name);
  const icon = encodeURIComponent(bubble.icon);
  const adminName = encodeURIComponent(getGreetingName(adminProfile));
  const adminId = encodeURIComponent(adminProfile?.accountId || adminProfile?.tapCard || '');

  return `${baseUrl}/profile?tab=bubble&joinBubble=${bubbleId}&name=${name}&icon=${icon}&admin=${adminName}&adminId=${adminId}`;
}

/**
 * Generates an unobstructed, high-contrast QR code URL for a custom bubble join pass.
 */
export function generateBubbleJoinQrCodeUrl(joinUrl: string, size = 320): string {
  if (!joinUrl) return '';
  const encoded = encodeURIComponent(joinUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&ecc=H&qzone=4&margin=4`;
}

/**
 * Handles a user accepting a join invite to a custom bubble.
 */
export async function joinCustomBubbleFromInvite(
  accountId: string,
  invite: BubbleJoinInvite,
  currentMember: MemberProfile | null
): Promise<{ success: boolean; error?: string; bubble?: CustomBubbleGroup }> {
  const cleanId = String(accountId).trim();
  if (!cleanId) return { success: false, error: 'Your account ID is missing.' };

  const groups = loadUserCustomBubbles(cleanId);
  const existing = groups.find((g) => g.id === invite.bubbleId);

  let targetGroup: CustomBubbleGroup;
  if (existing) {
    if (!existing.memberAccountIds.includes(cleanId)) {
      targetGroup = {
        ...existing,
        memberAccountIds: [...existing.memberAccountIds, cleanId],
        updatedAt: new Date().toISOString(),
      };
      const updated = groups.map((g) => (g.id === invite.bubbleId ? targetGroup : g));
      saveUserCustomBubbles(cleanId, updated);
    } else {
      targetGroup = existing;
    }
  } else {
    // New group joining for this user
    targetGroup = {
      id: invite.bubbleId,
      name: invite.name,
      description: invite.description || '',
      icon: invite.icon || '🫧',
      creatorAccountId: invite.inviterAccountId || 'maker',
      adminAccountIds: [invite.inviterAccountId || 'maker'],
      memberAccountIds: [cleanId, ...(invite.inviterAccountId ? [invite.inviterAccountId] : [])],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [targetGroup, ...groups];
    saveUserCustomBubbles(cleanId, updated);
  }

  // If inviter provided and not yet in Big Bubble, automatically connect bidirectionally!
  if (invite.inviterAccountId && invite.inviterAccountId.toLowerCase() !== cleanId.toLowerCase()) {
    try {
      const buddies = loadBuddyBubble(cleanId);
      const exists = buddies.some(
        (b) => b.accountId.toLowerCase() === invite.inviterAccountId.toLowerCase()
      );
      if (!exists) {
        const inviterBuddy: BuddyBubbleMember = {
          accountId: invite.inviterAccountId,
          name: invite.inviterName || 'Fellow Maker',
          preferredName: invite.inviterName || 'Fellow Maker',
          level: 1,
          levelBadge: '🌱',
          levelTitle: 'Maker',
          bubbleIds: [invite.bubbleId],
          addedAt: new Date().toISOString(),
        };
        addBuddyToBubble(cleanId, inviterBuddy, currentMember);
      }
    } catch (_) {}
  }

  return { success: true, bubble: targetGroup };
}

/**
 * Cloud sync for user's custom bubble groups to global settings proxy.
 */
async function syncCustomBubblesToCloud(
  accountId: string,
  groups: CustomBubbleGroup[]
): Promise<void> {
  if (isSandboxAccount(accountId) || !accountId) return;
  try {
    const { updateGlobalAppSettings } = await import('./neon');
    await updateGlobalAppSettings({
      [`custom_bubbles_${accountId}`]: JSON.stringify(groups),
    });
  } catch (_) {}
}

/**
 * Cloud sync fetch of custom bubbles from global settings proxy.
 */
export async function refreshCustomBubbles(
  accountId: string,
  currentGroups: CustomBubbleGroup[]
): Promise<CustomBubbleGroup[]> {
  if (!accountId || isSandboxAccount(accountId)) return currentGroups;

  try {
    const { fetchGlobalAppSettings } = await import('./neon');
    const settings = await fetchGlobalAppSettings();
    if (settings && settings[`custom_bubbles_${accountId}`]) {
      const cloudGroups: CustomBubbleGroup[] = JSON.parse(settings[`custom_bubbles_${accountId}`]);
      if (Array.isArray(cloudGroups)) {
        // Merge cloud groups
        let merged = [...currentGroups];
        let changed = false;
        cloudGroups.forEach((cg) => {
          const idx = merged.findIndex((g) => g.id === cg.id);
          if (idx < 0) {
            merged.push(cg);
            changed = true;
          } else if (new Date(cg.updatedAt) > new Date(merged[idx].updatedAt)) {
            merged[idx] = cg;
            changed = true;
          }
        });
        if (changed) {
          saveUserCustomBubbles(accountId, merged);
          return merged;
        }
      }
    }
  } catch (_) {}

  return currentGroups;
}
