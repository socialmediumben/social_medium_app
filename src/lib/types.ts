export interface MemberProfile {
  accountId?: string;
  tapCard: string;
  name: string;
  preferredName?: string;
  email: string;
  phone: string;
  membershipTier: string;
  certifications: string[]; // List field in Neon One: "Certifications" (ID 116)
  portalMedia?: string;     // Single-line text field in Neon One: "Portal Media" (ID 117)
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
