export const APP_VERSION = '2.3';

export interface ChangelogRelease {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const CHANGELOG: ChangelogRelease[] = [
  {
    version: '2.3',
    date: '2026-10-28',
    title: 'Neon One Constituent OAuth 2.0 Single Sign-On',
    changes: [
      'Added secure "Sign In with Neon One" Single Sign-On using constituents\' existing username and password.',
      'Implemented OAuth authorization callback page at /auth/callback with automatic token exchange and account provisioning.',
      'Created backend token exchange proxy endpoint in neon_kiosk on Render to securely keep Client Secret server-side.',
      'Updated login interface with seamless dual login: Neon One Single Sign-On and quick physical Tap Card scan.',
    ],
  },
  {
    version: '2.2',
    date: '2026-10-27',
    title: 'Custom Domain Setup for App & Portal Door',
    changes: [
      'Configured custom domain app.socialmedium.space for Social Medium App with CNAME generation and root path routing.',
      'Configured custom domain portal.socialmedium.space for the Portal Door system.',
      'Updated cross-system references, SSOT script links, and Portal Door QR code deep links.',
    ],
  },
  {
    version: '2.1',
    date: '2026-10-27',
    title: 'Editable Member Interests, Card Reordering & Profile Streamlining',
    changes: [
      'Made Interests & Passions fully editable on Member Profile: members can toggle Field 81 interests and update Field 83 custom interests with instant Neon One CRM synchronization.',
      'Removed Developer Mode card from the Member Profile module, keeping the developer toggle clean in the header navigation.',
      'Reordered Events module cards so "Upcoming Events (Available to Register)" is on top and "Events I\'ve RSVP\'d To" is below.',
    ],
  },
  {
    version: '2.0',
    date: '2026-10-27',
    title: 'Portal Door Simulation, Dual-Card Events & Profile Interests',
    changes: [
      'Interactive Portal Door simulation with YouTube embed playback, Google Drive support, and animated sliding doors.',
      'Split Events module into two dedicated cards: "Events I\'ve RSVP\'d To" and "Upcoming Events (Available to Register)".',
      'Added Neon One "Interests" (Field 81) and "Custom Interests" (Field 83) to the Member Profile.',
      'Streamlined header branding by removing the location subtitle under the logo.',
    ],
  },
  {
    version: '1.9',
    date: '2026-10-27',
    title: 'Direct API Member RSVP Fix & Header Cleanup',
    changes: [
      'Resolved Neon One registration API payload by formatting registrationDateTime to match Neon One specifications without milliseconds.',
      'Active members now RSVP directly via the API with 1 click without opening external signup tabs.',
      'Removed the "App" pill from the top navigation header for a clean, minimal brand logo layout.',
    ],
  },
  {
    version: '1.8',
    date: '2026-10-27',
    title: 'Events Module, Free Member RSVPs & Brand Renaming',
    changes: [
      'Renamed platform to "Social Medium App" across all views and navigation.',
      'Added comprehensive "Events" Module powered by the same Neon One system as the Check-In Kiosk.',
      'Active Members can RSVP for free with 1 click directly in the app for eligible community events.',
      'Non-members and paid Workshop category events open directly in the Neon One event registration storefront in a new tab.',
      'Added desktop and mobile navigation shortcuts for quick access to upcoming makerspace events.',
    ],
  },
  {
    version: '1.7',
    date: '2026-10-27',
    title: 'Video Game Badges, Textless Thermal Icons & Streamlined UI',
    changes: [
      'Redesigned Portal Door & Companion App certifications as large video game achievement badges with glowing icons and captions underneath.',
      'Streamlined Check-In Kiosk thermal nametag to display pure icons with "+" badges and zero text labels to preserve nametag space.',
      'Removed redundant "Authorized" status label across all platforms.',
    ],
  },
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
