import { MemberProfile, VolunteerSession, GiveGetSummary, BuddyBubbleMember, CustomBubbleGroup } from './types';

export const SANDBOX_ACCOUNT_ID = 'sandbox-demo';
export const SANDBOX_TAP_CARD = 'DEMO-2026';

/**
 * Checks whether a given account ID or card number belongs to the Sandbox Demo.
 */
export function isSandboxAccount(accountIdOrCard?: string | null): boolean {
  if (!accountIdOrCard) return false;
  const val = String(accountIdOrCard).trim().toUpperCase();
  return (
    val === 'SANDBOX-DEMO' ||
    val === 'SANDBOX' ||
    val === 'DEMO' ||
    val === 'DEMO-2026' ||
    val === 'TEST' ||
    val === 'SANDBOX_DEMO' ||
    val.startsWith('SANDBOX-')
  );
}

/**
 * Determines whether the active browser session is currently running in Sandbox Demo mode.
 */
export function isSandboxSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const isSandboxFlag = localStorage.getItem('sm_is_sandbox');
    const activeAcc = localStorage.getItem('sm_active_account_id');
    const activeCard = localStorage.getItem('sm_active_tap_card');
    return isSandboxFlag === 'true' || isSandboxAccount(activeAcc) || isSandboxAccount(activeCard);
  } catch (_) {
    return false;
  }
}

/**
 * Initial sample volunteer sessions for the Sandbox demonstration.
 */
export const INITIAL_SANDBOX_GIVE_GET_SESSIONS: VolunteerSession[] = [
  {
    id: 'demo-vol-1',
    accountId: SANDBOX_ACCOUNT_ID,
    date: '2026-11-05',
    hours: 4.0,
    category: 'Makerspace Maintenance',
    notes: 'Cleaned laser cutter optics and organized 3D print filament shelves',
    createdAt: '2026-11-05T18:00:00Z',
  },
  {
    id: 'demo-vol-2',
    accountId: SANDBOX_ACCOUNT_ID,
    date: '2026-11-12',
    hours: 3.5,
    category: 'Community Workshop Assistance',
    notes: 'Assisted instructor with intro to Arduino electronics workshop',
    createdAt: '2026-11-12T20:30:00Z',
  },
];

/**
 * Baseline Give/Get philanthropic and service summary for the Sandbox demonstration.
 */
export const INITIAL_SANDBOX_GIVE_GET_SUMMARY: GiveGetSummary = {
  accountId: SANDBOX_ACCOUNT_ID,
  hardCredit: 1250,
  softCredit: 500,
  volunteerHours: 25,
  hourlyRate: 10,
  volunteerValue: 250,
  totalGiveGet: 2000,
  currentYearHardCredit: 1250,
  currentYearSoftCredit: 500,
  sessions: INITIAL_SANDBOX_GIVE_GET_SESSIONS,
};

export const INITIAL_SANDBOX_REGISTERED_EVENT_IDS = ['demo-intro-workshop'];

/**
 * Pre-populated friendly makers in the Sandbox Buddy Bubble for demonstrations.
 */
export const INITIAL_SANDBOX_BUDDIES: BuddyBubbleMember[] = [
  {
    accountId: 'demo-buddy-sam',
    name: 'Sam Spark',
    preferredName: 'Sam',
    pronouns: 'He/Him',
    tapCard: '20260001',
    level: 4,
    levelBadge: '⚙️',
    levelTitle: 'Tinkerer',
    interests: ['Robotics', 'Electronics', '3D Printing'],
    buddyAvatar: JSON.stringify({
      bodyColor: '#f783ac',
      eyeStyle: 'wink',
      mouthStyle: 'open',
      hat: 'cap',
      accessory: 'soldering_iron',
    }),
    addedAt: '2026-11-10T14:20:00Z',
    lastCheeredAt: '2026-11-16T10:15:00Z',
  },
  {
    accountId: 'demo-buddy-alex',
    name: 'Alex River',
    preferredName: 'Alex',
    pronouns: 'She/Her',
    tapCard: '20260002',
    level: 6,
    levelBadge: '🚀',
    levelTitle: 'Pro Maker',
    interests: ['Woodworking', 'Laser Cutting', 'Tabletop Gaming'],
    buddyAvatar: JSON.stringify({
      bodyColor: '#ffd43b',
      eyeStyle: 'glasses',
      mouthStyle: 'smile',
      hat: 'beanie',
      clothes: 'flannel',
    }),
    addedAt: '2026-11-12T16:45:00Z',
    lastCheeredAt: '2026-11-17T18:30:00Z',
    isFavorite: true,
    bubbleIds: ['demo-bubble-dnd'],
  },
  {
    accountId: 'demo-buddy-maya',
    name: 'Maya Chen',
    preferredName: 'Maya',
    pronouns: 'They/Them',
    tapCard: '20260003',
    level: 2,
    levelBadge: '🌱',
    levelTitle: 'Novice Maker',
    interests: ['Vinyl Cutting', '3D Printing', 'Cosplay'],
    buddyAvatar: JSON.stringify({
      bodyColor: '#69db7c',
      eyeStyle: 'star',
      mouthStyle: 'grin',
      hat: 'wizard_hat',
    }),
    addedAt: '2026-11-15T09:10:00Z',
    bubbleIds: ['demo-bubble-denim'],
  },
];

/**
 * Initial custom maker bubbles for the Sandbox demonstration.
 */
export const INITIAL_SANDBOX_CUSTOM_BUBBLES: CustomBubbleGroup[] = [
  {
    id: 'demo-bubble-dnd',
    name: 'D&D Club',
    description: 'Tabletop RPG makers, miniature painters & dungeon masters!',
    icon: '🐉',
    color: '#ef4444',
    creatorAccountId: SANDBOX_ACCOUNT_ID,
    adminAccountIds: [SANDBOX_ACCOUNT_ID, 'demo-buddy-alex'],
    memberAccountIds: [SANDBOX_ACCOUNT_ID, 'demo-buddy-alex', 'demo-buddy-sam'],
    buddyBucks: 25,
    checkIns: [
      {
        date: '2026-11-18',
        checkedInAccountIds: [SANDBOX_ACCOUNT_ID, 'demo-buddy-alex', 'demo-buddy-sam'],
        fullPartyBonusAwarded: true,
        checkInTimestamps: {
          [SANDBOX_ACCOUNT_ID]: '2026-11-18T14:15:00Z',
          'demo-buddy-alex': '2026-11-18T14:20:00Z',
          'demo-buddy-sam': '2026-11-18T14:25:00Z',
        },
      },
    ],
    createdAt: '2026-11-10T12:00:00Z',
    updatedAt: '2026-11-16T14:00:00Z',
  },
  {
    id: 'demo-bubble-denim',
    name: 'Denim Jacket Squad',
    description: 'Custom embroidered patches, fabric dyeing & wearable tech',
    icon: '🧥',
    color: '#344ea2',
    creatorAccountId: 'demo-buddy-maya',
    adminAccountIds: ['demo-buddy-maya'],
    memberAccountIds: ['demo-buddy-maya', SANDBOX_ACCOUNT_ID],
    buddyBucks: 10,
    checkIns: [],
    createdAt: '2026-11-14T10:00:00Z',
    updatedAt: '2026-11-15T16:00:00Z',
  },
];

/**
 * Rich pristine member profile for interactive business demonstrations.
 */
export const INITIAL_SANDBOX_MEMBER: MemberProfile = {
  accountId: SANDBOX_ACCOUNT_ID,
  tapCard: SANDBOX_TAP_CARD,
  firstName: 'Jordan',
  lastName: 'Taylor',
  preferredName: 'Jordan',
  gender: 'They/Them',
  genderCode: 'NB',
  pronouns: 'They/Them',
  name: 'Jordan Taylor',
  email: 'jordan.taylor@demo-partner.com',
  phone: '(555) 234-5678',
  membershipTier: 'Community Pro Maker',
  membershipStatus: 'Active',
  certifications: [
    'Laser Cutter (CO2 80W)',
    '3D Printing (FDM / Bambu Lab)',
    'Woodshop Safety & Table Saw',
    'Electronics & Soldering Bench',
    'Vinyl Cutter & Heat Press',
  ],
  interests: [
    '3D Printing',
    'Laser Cutting',
    'Woodworking',
    'Electronics',
    'Tabletop Gaming',
    'Robotics',
  ],
  customInterests: 'Rapid prototyping, smart home gadgets & cosplay prop design',
  storeBalance: 25.0, // $25.00 preloaded credit for trying store checkouts
  buddyBucks: 175, // 175 BB for customizing the Buddy in Buddy Builder
  buddyCount: 3, // 3 friends in the Buddy Bubble
  xp: 420, // 420 XP (Level 3 Apprentice Tinkerer ⚙️)
  level: 3,
  levelTitle: 'Apprentice Tinkerer',
  levelBadge: '⚙️',
  levelReward: '50 Buddy Bucks + Laser Cutter badge',
  portalMedia: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
  isBoardMember: true, // Gives access to explore the Give/Get philanthropic tab under Impact
  isSystemUser: false,
  isAppDeveloper: false,
  hardCreditDonations: 1250,
  softCreditDonations: 500,
  volunteerHours: 25,
  giveGetTotal: 2000,
  buddyAvatar: JSON.stringify({
    bodyColor: '#3bc0cd',
    eyeStyle: 'happy',
    mouthStyle: 'smile',
    clothes: 'apron',
    hat: 'goggles',
    shoes: 'sneakers',
    accessory: 'wrench',
    updatedAt: new Date().toISOString(),
  }),
};

/**
 * Wipes every sandbox-specific key and temporary changes from browser storage.
 */
export function clearSandboxData(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.includes('sandbox-demo') ||
          key.includes('DEMO-2026') ||
          key.includes('sm_sandbox_') ||
          key.includes('sm_is_sandbox'))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    try {
      sessionStorage.clear();
    } catch (_) {}
  } catch (_) {}
}

/**
 * Initializes a fresh pristine sandbox session.
 */
export function initSandboxSession(): MemberProfile {
  if (typeof window !== 'undefined') {
    clearSandboxData();
    try {
      localStorage.setItem('sm_is_sandbox', 'true');
      localStorage.setItem('sm_active_account_id', SANDBOX_ACCOUNT_ID);
      localStorage.setItem('sm_active_tap_card', SANDBOX_TAP_CARD);
      localStorage.setItem(`sm_profile_${SANDBOX_ACCOUNT_ID}`, JSON.stringify(INITIAL_SANDBOX_MEMBER));
      localStorage.setItem(`sm_profile_${SANDBOX_TAP_CARD}`, JSON.stringify(INITIAL_SANDBOX_MEMBER));
      localStorage.setItem(`sm_balance_${SANDBOX_ACCOUNT_ID}`, INITIAL_SANDBOX_MEMBER.storeBalance!.toFixed(2));
      localStorage.setItem(`sm_buddy_bucks_${SANDBOX_ACCOUNT_ID}`, String(INITIAL_SANDBOX_MEMBER.buddyBucks));
      localStorage.setItem(`sm_xp_total_${SANDBOX_ACCOUNT_ID}`, String(INITIAL_SANDBOX_MEMBER.xp));
      if (INITIAL_SANDBOX_MEMBER.buddyAvatar) {
        localStorage.setItem(`sm_buddy_avatar_${SANDBOX_ACCOUNT_ID}`, INITIAL_SANDBOX_MEMBER.buddyAvatar);
      }
      localStorage.setItem(
        `sm_give_get_sessions_${SANDBOX_ACCOUNT_ID}`,
        JSON.stringify(INITIAL_SANDBOX_GIVE_GET_SESSIONS)
      );
      localStorage.setItem(
        `sm_event_registrations_${SANDBOX_ACCOUNT_ID}`,
        JSON.stringify(INITIAL_SANDBOX_REGISTERED_EVENT_IDS)
      );
      localStorage.setItem(
        `sm_custom_bubbles_${SANDBOX_ACCOUNT_ID}`,
        JSON.stringify(INITIAL_SANDBOX_CUSTOM_BUBBLES)
      );
    } catch (_) {}
  }
  return { ...INITIAL_SANDBOX_MEMBER };
}

/**
 * Resets sandbox demo back to pristine state without leaving the page.
 */
export function resetSandboxData(): MemberProfile {
  const fresh = initSandboxSession();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sm_balance_updated', { detail: { newBalance: fresh.storeBalance } }));
    window.dispatchEvent(new CustomEvent('sm_buddy_bucks_updated', { detail: fresh.buddyBucks }));
    if (fresh.buddyAvatar) {
      window.dispatchEvent(new CustomEvent('sm_buddy_updated', { detail: fresh.buddyAvatar }));
    }
    window.dispatchEvent(
      new CustomEvent('sm_xp_awarded', {
        detail: {
          accountId: SANDBOX_ACCOUNT_ID,
          ruleId: 'reset',
          activityName: 'Sandbox Reset',
          xpEarned: 0,
          newTotalXp: fresh.xp,
          oldLevel: fresh.level,
          newLevel: fresh.level,
          leveledUp: false,
          levelTitle: fresh.levelTitle,
          levelBadge: fresh.levelBadge,
        },
      })
    );
  }
  return fresh;
}
