export interface MemberProfile {
  accountId?: string;
  tapCard: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  name: string;             // Full name: e.g. "Benyomin Braunstein"
  email: string;
  phone: string;
  membershipTier: string;
  certifications: string[]; // List field in Neon One: "Certifications" (ID 116)
  portalMedia?: string;     // Single-line text field in Neon One: "Portal Media" (ID 117)
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
