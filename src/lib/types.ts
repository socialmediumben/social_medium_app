export interface MemberProfile {
  accountId?: string;
  tapCard: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  gender?: string;          // Neon One Primary Contact Gender description (e.g. "He/Him")
  genderCode?: string;      // Neon One Primary Contact Gender code (e.g. "HH")
  pronouns?: string;        // Display label for Pronouns (mapped from Gender)
  name: string;             // Full name: e.g. "Benyomin Braunstein"
  email: string;
  phone: string;
  membershipTier: string;
  membershipStatus?: string;// e.g. "Active", "Inactive", "None"
  certifications: string[]; // List field in Neon One: "Certifications" (ID 116)
  portalMedia?: string;     // Single-line text field in Neon One: "Portal Media" (ID 117)
  interests?: string[];     // Multi-select field in Neon One: "Interests" (ID 81)
  customInterests?: string; // Single-line text field in Neon One: "Custom Interests" (ID 83)
  isSystemUser?: boolean;   // Active Neon One CRM System User (Staff access)
  isAppDeveloper?: boolean; // Neon One "App Developer" Custom Field 118 (Dev access)
  storeBalance?: number;    // Neon One Store / Wallet Balance (Positive = prepaid credits, Negative = tab)
  xp?: number;              // Experience points (synced with Neon Custom Field "XP" or local storage)
  level?: number;           // Current Level (1-10+)
  levelTitle?: string;      // Current Title (configured via Level Tiers module, e.g. "Level 1", "Level 2")
  levelBadge?: string;      // Current Badge emoji (e.g. "🌱", "⚙️")
  levelReward?: string;     // Reward / Perk unlocked at this level
  buddyAvatar?: string;     // Neon One Buddy Avatar JSON config string
  buddyBucks?: number;      // Neon One Buddy Bucks in-app currency balance
  isBoardMember?: boolean;  // Neon One "Board Member" Custom Field 123 (Give/Get access)
  hardCreditDonations?: number; // Total direct donations
  softCreditDonations?: number; // Total influenced/soft-credit donations
  volunteerHours?: number;      // Self-reported volunteer/service hours
  giveGetTotal?: number;        // hardCredit + softCredit + (volunteerHours * $10)
}

export interface VolunteerSession {
  id: string;
  accountId: string;
  date: string;              // YYYY-MM-DD
  hours: number;             // e.g. 2.5
  category: string;          // e.g. "Board Meeting", "Committee Work", "Fundraising", "Space Maintenance"
  notes?: string;
  createdAt: string;
}

export interface GiveGetSummary {
  accountId: string;
  hardCredit: number;
  softCredit: number;
  volunteerHours: number;
  hourlyRate: number;        // default $10.00 / hr
  volunteerValue: number;    // volunteerHours * hourlyRate
  totalGiveGet: number;      // hardCredit + softCredit + volunteerValue
  currentYearHardCredit?: number;
  currentYearSoftCredit?: number;
  sessions: VolunteerSession[];
}

export interface CommunityAnnouncement {
  id: string;
  title: string;
  message: string;
  author?: string;
  updatedAt: string;
  active?: boolean;
}

/**
 * Returns the name to use when addressing the user, prioritizing Preferred Name
 */
export function getGreetingName(member: MemberProfile | null | undefined): string {
  if (!member) return 'Member';
  if (member.preferredName && member.preferredName.trim()) {
    return member.preferredName.trim();
  }
  if (member.firstName && member.firstName.trim()) {
    return member.firstName.trim();
  }
  return member.name || 'Member';
}

export interface TapCardMedia {
  cardId: string;
  title: string;
  type: 'video' | 'image';
  filePath: string;
  updatedAt: string;
}

export interface GameRoomPreset {
  id: string;
  name: string;
  description: string;
  lightingName: string;
  lightingHex: string;
  windowMedia: string;
  frameMedia: string;
  tableMedia: string;
  tag: string;
}

export interface GameRoomDisplayStatus {
  windowTv: { online: boolean; currentScene: string };
  pictureFrame: { online: boolean; currentScene: string };
  tableProjector: { online: boolean; currentScene: string };
}

export interface GameRoomMediaItem {
  id: string;
  fileId?: string;
  cardId: string;
  uploaderName?: string;
  title: string;
  type: 'map' | 'image' | 'video' | 'portrait';
  targetScreen: 'table' | 'window' | 'frame';
  visibility?: 'private' | 'public';
  url: string;
  downloadUrl?: string;
  timestamp: string;
}

export interface NeonPropertyItem {
  id: string;
  name: string;
  status?: string;
}

export interface NeonSystemUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
}

export interface CreateActivityInput {
  subject: string;
  statusId?: string;
  priority?: 'High' | 'Normal' | 'Low';
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  typeId?: string;
  systemUserId?: string;
  systemUserIds?: string[];
  accountId?: string;
  accountIds?: string[];
  note?: string;
}

export interface PortalPhotoRecord {
  id: string;
  cardId: string;
  rawCardId?: string;
  cardIds?: string[];
  url: string;
  fileId?: string;
  downloadUrl?: string;
  timestamp: string;
}

export interface StoreItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  icon?: string;
}

export interface StoreCartItem {
  item: StoreItem;
  quantity: number;
}

export interface StoreTransaction {
  id: string;
  timestamp: string;
  accountId: string;
  memberName: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  totalAmount: number;
  previousBalance: number;
  newBalance: number;
}

export interface XpLevelTier {
  level: number;
  title: string;
  minXp: number;
  badgeEmoji: string;
  reward: string;
  description?: string;
}

export interface XpActivityRule {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  icon: string;
  category: 'app' | 'space' | 'events' | 'community';
  enabled: boolean;
  cooldown?: 'once' | 'daily' | 'unlimited';
}

export interface XpAuditRecord {
  id: string;
  ruleId: string;
  activityName: string;
  xpEarned: number;
  timestamp: string;
  note?: string;
}

export interface XpAwardEventDetail {
  accountId: string;
  ruleId: string;
  activityName: string;
  xpEarned: number;
  newTotalXp: number;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  levelTitle: string;
  levelBadge: string;
  rewardUnlocked?: string;
  note?: string;
}

export interface PortalDoorSettings {
  contestMode: boolean;
  digitalBackground: boolean;
  sound: boolean;
  photoboothMode: boolean;
  impactMode?: boolean;
  activeProfileCardId?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// ==========================================
// BUDDY BUILDER & BUDDY BUCKS TYPES
// ==========================================

export type BuddyLayerCategory = string;

export interface BuddyItem {
  id: string;
  name: string;
  category: BuddyLayerCategory;
  assetUrl: string;          // Transparent PNG / SVG (relative or data URL)
  thumbnailUrl?: string;     // Small thumbnail icon
  zIndex: number;            // Layer stack order
  price: number;             // In Buddy Bucks (0 = Free Starter item)
  requiredLevel?: number;    // Optional XP rank unlock milestone
  description?: string;
  artist?: string;           // Artist attribution / creator name
  isCustom?: boolean;        // Uploaded via Developer Module or community
  colorPicker?: boolean;     // True if item is a white silhouette/line art that supports dynamic color picking
}

export interface BuddyEquippedLayers {
  [category: string]: string | undefined;
}

export interface BuddyConfig {
  baseColor: string;         // 'cyan' | 'orange' | 'dark-blue' | 'green' | 'purple' | hex
  equipped: BuddyEquippedLayers;
  unlockedItemIds: string[]; // List of unlocked / purchased item IDs
  equippedColors?: Record<string, string>; // Category or Item ID -> custom hex color
  updatedAt?: string;
}

// ==========================================
// IMPACT & FUNDRAISING CAMPAIGN TYPES
// ==========================================

export interface ImpactCampaignSettings {
  enabled: boolean;
  campaignId: string;
  campaignName: string;
  goalAmount: number;
  raisedAmount: number;
  donorCount?: number;
  donationFormUrl: string;
  headline?: string;
  description?: string;
  thermometerColor?: string;
  primaryColor?: string;
  endDate?: string;
  useLiveNeonStats: boolean;
  autoSyncNeon?: boolean;
  updatedAt?: string;
}

export interface NeonCampaignSummary {
  id: string;
  name: string;
  status: string;
  code?: string;
  isDefault?: boolean | null;
}

export interface NeonCampaignDetail {
  id: string;
  name: string;
  code?: string;
  goal?: number | null;
  donationFormUrl?: string;
  campaignPageUrl?: string;
  statistics?: {
    donationCount?: number;
    donationAmount?: number;
    pledgeCount?: number;
    pledgeAmount?: number;
    grandTotal?: number;
  };
  startDate?: string;
  endDate?: string;
  status?: string;
}
