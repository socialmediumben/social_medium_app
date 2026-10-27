export const APP_VERSION = '1.6';

export interface ChangelogRelease {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const CHANGELOG: ChangelogRelease[] = [
  {
    version: '1.6',
    date: '2026-10-27',
    title: 'SSOT Certification Icons & Developer Mode Icon Manager',
    changes: [
      'Created central Single Source of Truth (SSOT) certification registry (sm-certifications.js & certifications.json).',
      'Implemented Base Icon + "+" badge rule: beginner icon is base, advanced certification adds "+" badge.',
      'Added interactive Certification & Icon Manager UI in Developer Mode for live mapping and inspection.',
      'Unified high-contrast thermal printable icons across Check-In Kiosk nametags, Portal Door, and Companion App.',
    ],
  },
  {
    version: '1.5',
    date: '2026-10-27',
    title: 'Portal Door Deep-Link Integration & QR Auto-Authentication',
    changes: [
      'Added URL query parameter deep linking (?card=...) for seamless Tap Card authentication.',
      'Designed QR code workflow for Portal Door kiosk when a card has no assigned Portal Media.',
      'Enabled immediate redirect to personal Portal Media editor upon scanning the QR code.',
    ],
  },
  {
    version: '1.4',
    date: '2026-10-27',
    title: 'High-Visibility Developer Mode Switch & Discoverability',
    changes: [
      'Added high-visibility Developer Mode toggle button in the top navigation bar with clear ON/OFF state.',
      'Added dedicated Developer Mode switch card in the Member Profile and page footer.',
      'Added tap-to-toggle developer mode on the Social Medium logo.',
      'Bumped release version to 1.4 in accordance with continuous commit versioning.',
    ],
  },
  {
    version: '1.3',
    date: '2026-10-27',
    title: 'Developer Mode, Neon Name Segmentation & Versioning',
    changes: [
      'Added Developer Mode toggle with version display and changelog viewer.',
      'Separated constituent names into First Name, Last Name, and Preferred Name to directly match Neon One CRM.',
      'Updated user greetings and portal titles to prioritize Preferred Name when addressing the member.',
      'Integrated centralized version tracking and changelog history.',
    ],
  },
  {
    version: '1.2',
    date: '2026-10-27',
    title: 'Live Neon One CRM Integration',
    changes: [
      'Connected live Neon One proxy via neon-kiosk.onrender.com.',
      'Real-time Tap Card lookup and authentication for physical NFC passes.',
      'Synchronized member tool Certifications from Neon One custom field ID 116.',
      'Bi-directional Portal Media sync to Neon One custom field ID 117.',
    ],
  },
  {
    version: '1.1',
    date: '2026-10-27',
    title: 'GitHub Pages Optimization & Zero Mock Data',
    changes: [
      'Configured static export with .nojekyll for proper CSS and asset rendering on GitHub Pages.',
      'Removed all hardcoded mock accounts; established Neon One CRM as the single source of truth.',
      'Added Wizard\'s Grimoire Game Room display remotes and lighting presets.',
      'Streamlined profile by removing emergency contacts and unlinked achievements.',
    ],
  },
  {
    version: '1.0',
    date: '2026-10-27',
    title: 'Initial Social Medium Companion Release',
    changes: [
      'Scaffolded mobile-first Next.js 16 companion app with Fredoka and Roboto typography.',
      'Implemented Social Medium color palette (Light Blue, Orange, Dark Blue, Off-White, Green).',
      'Created Home Launcher, Member Profile, Portal Media, and Game Room controllers.',
    ],
  },
];
