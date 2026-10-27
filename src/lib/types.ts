export interface Certification {
  id: string;
  name: string;
  date?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface MemberProfile {
  tapCardId: string;
  name: string;
  email: string;
  phone: string;
  membershipTier: string;
  emergencyContact?: EmergencyContact;
  certifications: Certification[];
  achievements: Achievement[];
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
  description?: string;
  dateUnlocked?: string;
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
