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
