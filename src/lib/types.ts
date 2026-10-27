export interface Certification {
  id: string;
  name: string;
  category: string;
  certifiedDate: string;
  active: boolean;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface MemberProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipTier: string;
  tapCardId: string;
  joinedDate: string;
  emergencyContact: EmergencyContact;
  certifications: Certification[];
}

export interface TapCardMedia {
  cardId: string;
  title: string;
  type: 'video' | 'image';
  filePath: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  category: 'Skill' | 'Safety' | 'Community' | 'Milestone';
  description: string;
  unlocked: boolean;
  dateUnlocked?: string;
  icon: string;
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
