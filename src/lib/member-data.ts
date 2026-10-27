import { MemberProfile, TapCardMedia, Achievement, GameRoomPreset, GameRoomDisplayStatus } from './types';

// Default member profile aligned with Social Medium Makerspace facts from docs/CORE_KNOWLEDGE.md
export const DEFAULT_MEMBER: MemberProfile = {
  id: "SM-1042",
  name: "Ben Braunstein",
  email: "Ben@socialmedium.space",
  phone: "818-648-1314",
  membershipTier: "Board President & Maker",
  tapCardId: "3680669188",
  joinedDate: "January 2026",
  emergencyContact: {
    name: "Ilana Jaffe-Lewis",
    phone: "747-322-0689",
    relation: "Makerspace Manager / Colleague"
  },
  certifications: [
    { id: "c1", name: "OMTech 80W CO2 Laser Cutter", category: "Laser & Optics", certifiedDate: "Jan 18, 2026", active: true },
    { id: "c2", name: "Prusa MK4 3D Printers (FDM)", category: "Rapid Prototyping", certifiedDate: "Jan 18, 2026", active: true },
    { id: "c3", name: "Electronics Lab & Soldering Stations", category: "Electronics", certifiedDate: "Jan 20, 2026", active: true },
    { id: "c4", name: "Woodworking Table Saw & Miter Station", category: "Wood Shop", certifiedDate: "Feb 02, 2026", active: true },
    { id: "c5", name: "Shapeoko Pro CNC Router", category: "Machining", certifiedDate: "Pending Review", active: false },
  ]
};

// Default personal portal media linked to Ben's physical tap card (3680669188)
// Exactly matching external_repos/Portal-Door/media_data.json
export const DEFAULT_PORTAL_MEDIA: TapCardMedia = {
  cardId: "3680669188",
  title: "Tron Portal Loop",
  type: "video",
  filePath: "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-4148-large.mp4",
  updatedAt: "2026-10-26"
};

// Default achievements synced with Neon One structure
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "a1",
    title: "Founding Maker",
    category: "Milestone",
    description: "Joined Social Medium during the inaugural launch season (Winter 2026).",
    unlocked: true,
    dateUnlocked: "Jan 2026",
    icon: "Sparkles"
  },
  {
    id: "a2",
    title: "Laser Safety Certified",
    category: "Safety",
    description: "Completed comprehensive training on laser optics, exhaust safety, and mirror alignment.",
    unlocked: true,
    dateUnlocked: "Jan 18, 2026",
    icon: "ShieldCheck"
  },
  {
    id: "a3",
    title: "3D Print Master",
    category: "Skill",
    description: "Completed 5 successful prints on the Prusa MK4 fleet without print failures.",
    unlocked: true,
    dateUnlocked: "Feb 10, 2026",
    icon: "Layers"
  },
  {
    id: "a4",
    title: "Portal Pioneer",
    category: "Milestone",
    description: "Linked your physical tap card to the Portal Door interactive installation.",
    unlocked: true,
    dateUnlocked: "Feb 14, 2026",
    icon: "DoorOpen"
  },
  {
    id: "a5",
    title: "Electronics Bench Master",
    category: "Skill",
    description: "Successfully soldered a custom PCB or completed the Intro to Soldering workshop.",
    unlocked: true,
    dateUnlocked: "Feb 22, 2026",
    icon: "Cpu"
  },
  {
    id: "a6",
    title: "Game Room Dungeon Master",
    category: "Community",
    description: "Hosted or attended a session in the Game Room using The Wizard's Grimoire presets.",
    unlocked: false,
    icon: "Gamepad2"
  },
  {
    id: "a7",
    title: "CNC Router Certified",
    category: "Safety",
    description: "Complete hands-on safety walkthrough for the CNC Router and feed rate setup.",
    unlocked: false,
    icon: "Wrench"
  },
  {
    id: "a8",
    title: "Workshop Hero",
    category: "Community",
    description: "Helped volunteer or mentor another member during a Social Medium community build night.",
    unlocked: false,
    icon: "HeartHandshake"
  }
];

// Presets faithfully modeled after external_repos/home_controller/README.md
export const GAME_ROOM_PRESETS: GameRoomPreset[] = [
  {
    id: "archmage",
    name: "The Archmage's Study",
    description: "Warm amber chamber lighting with gentle candle flicker and arcane library projections.",
    lightingName: "Warm Amber (Candle Flicker)",
    lightingHex: "#f59e0b",
    windowMedia: "Rain on Castle Glass",
    frameMedia: "Archmage Ignis (Wise Wizard)",
    tableMedia: "The Arcane Library Map",
    tag: "Atmospheric"
  },
  {
    id: "thunderstorm",
    name: "Thunderstorm at Midnight",
    description: "Cold blue strobe lighting with tempest gale on the window TV and flooded crypt.",
    lightingName: "Cold Electric Blue",
    lightingHex: "#38bdf8",
    windowMedia: "Midnight Tempest & Gale",
    frameMedia: "Lord Malakor (Lich)",
    tableMedia: "Flooded Crypt Map",
    tag: "Storm"
  },
  {
    id: "hearthside",
    name: "The Hearthside Tavern",
    description: "Cozy fire orange hearth glow with village sunset and main hall battlemap.",
    lightingName: "Fire Hearth Orange",
    lightingHex: "#f16622",
    windowMedia: "Tavern Village Sunset",
    frameMedia: "Barnaby the Barkeep",
    tableMedia: "Tavern Main Hall Map",
    tag: "Social"
  },
  {
    id: "crypt",
    name: "Sunken Dungeon Crypt",
    description: "Sickly green dim torchlight with iron dungeon bars on the window display.",
    lightingName: "Dim Crypt Green",
    lightingHex: "#8a9280",
    windowMedia: "Dungeon Iron Bars",
    frameMedia: "Crypt Guardian (Skeleton)",
    tableMedia: "Tomb of the Kings Map",
    tag: "Dungeon"
  },
  {
    id: "dragon",
    name: "Dragon's Wrath / Combat",
    description: "Crimson pulse alert with inferno skies and volcanic caldera arena.",
    lightingName: "Crimson Red Pulse",
    lightingHex: "#dc2626",
    windowMedia: "Inferno Skies & Embers",
    frameMedia: "Vermithrax the Red Dragon",
    tableMedia: "Volcanic Caldera Arena",
    tag: "Combat"
  },
  {
    id: "feywild",
    name: "Feywild Twilight",
    description: "Mystical violet and cyan glow with enchanted wisp forest and Queen Titania.",
    lightingName: "Mystic Violet & Cyan",
    lightingHex: "#3bc0cd",
    windowMedia: "Enchanted Wisp Forest",
    frameMedia: "Queen Titania (Summer Court)",
    tableMedia: "Fey Crossroads Map",
    tag: "Mystery"
  },
  {
    id: "blackout",
    name: "Blackout / Stealth",
    description: "Pitch black chamber lights and dimmed stealth screens for dramatic stealth encounters.",
    lightingName: "Extinguish All Lights",
    lightingHex: "#000000",
    windowMedia: "Void of Night",
    frameMedia: "Shadows / Unseen Stalker",
    tableMedia: "Shroud of Mystery Fog",
    tag: "Stealth"
  }
];

export const INITIAL_GAME_ROOM_STATUS: GameRoomDisplayStatus = {
  windowTv: { online: true, currentScene: "The Archmage's Study" },
  pictureFrame: { online: true, currentScene: "Archmage Ignis" },
  tableProjector: { online: true, currentScene: "The Arcane Library Map" }
};
