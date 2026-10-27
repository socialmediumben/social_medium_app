import { GameRoomPreset, GameRoomDisplayStatus } from './types';

// Presets faithfully modeled after external_repos/home_controller/README.md for Game Room only
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
