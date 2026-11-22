# Windows Dual-Monitor Kiosk Setup Guide
Social Medium Makerspace Touchscreen & Google Photos Display

---

## 1. Physical & Display Configuration
1. Connect the back-to-back monitor to the All-in-One PC via **HDMI**.
2. Press `Win + P` on your keyboard and ensure **"Extend"** is selected (NOT Duplicate).
3. Right-click the desktop -> **Display settings**:
   - Identify which monitor is **Display 1** (Touchscreen) and which is **Display 2** (HDMI Monitor).
   - Ensure the Touchscreen is set as the **Main display** (located at the origin `0, 0`).
   - Arrange Display 2 to the right of Display 1 (so its horizontal position starts at `1920, 0`).
   - Set both displays to **100% scale** (recommended) and native resolution (e.g. 1920x1080).

---

## 2. Automatic Setup (1-Click)
1. Right-click `setup-dual-kiosk.ps1` -> **"Run with PowerShell"**.
2. This creates `C:\SocialMediumKiosk` and places a shortcut into your Windows **Startup folder** (`shell:startup`).
3. Whenever the computer turns on or reboots, Windows will automatically open:
   - **Touchscreen**: Front Check-In Kiosk (`neon-kiosk.onrender.com`).
   - **Back Monitor**: Ambient Google Photos Slideshow (`app.socialmedium.space/kiosk-display`).

---

## 3. Remote Album Control
- Any administrator can open the **Social Medium Companion App** on their phone or laptop.
- Go to **Developer Mode (`/developer`)** -> **"Dual-Monitor Kiosk & Ambient Display"**.
- Paste any public Google Photos album link or select preset albums.
- Hit **"Save Kiosk Display Settings"**.
- Monitor 2 will automatically update to the new album within 15 seconds without anyone needing to touch the kiosk PC!

---

## 4. Keyboard Shortcuts on Monitor 2
- `Space`: Pause / Resume Slideshow
- `Left Arrow` / `Right Arrow`: Previous / Next Photo
- `F`: Toggle Fullscreen
