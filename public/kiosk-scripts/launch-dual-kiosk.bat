@echo off
title Social Medium Dual-Monitor Kiosk Launcher
echo ========================================================
echo   SOCIAL MEDIUM DUAL-MONITOR KIOSK LAUNCHER
echo   Screen 1: Touchscreen Check-In (0, 0)
echo   Screen 2: Ambient Google Photos Slideshow (1920, 0)
echo ========================================================

:: Give Windows network and display drivers 3 seconds to settle
timeout /t 3 /nobreak >nul

:: Terminate any lingering background browser kiosk instances
taskkill /F /IM msedge.exe /T >nul 2>&1
timeout /t 1 /nobreak >nul

:: Create dedicated profile directories to prevent Edge instance collision
if not exist "C:\SocialMediumKiosk\Profiles\Touchscreen" mkdir "C:\SocialMediumKiosk\Profiles\Touchscreen"
if not exist "C:\SocialMediumKiosk\Profiles\Display" mkdir "C:\SocialMediumKiosk\Profiles\Display"

:: 1. Launch Monitor 1: All-In-One Touchscreen Check-In Kiosk (Position 0, 0)
echo Launching Screen 1 (Touchscreen Check-In Kiosk)...
start "" "msedge.exe" --kiosk "https://neon-kiosk.onrender.com" --window-position=0,0 --window-size=1920,1080 --user-data-dir="C:\SocialMediumKiosk\Profiles\Touchscreen" --no-first-run --no-default-browser-check --disable-pinch --overscroll-history-navigation=0 --disable-features=Translate,PrivacySandboxSettings4

:: Wait 2 seconds before launching second monitor
timeout /t 2 /nobreak >nul

:: 2. Launch Monitor 2: HDMI Ambient Google Photos Display (Position 1920, 0)
echo Launching Screen 2 (Ambient Google Photos Slideshow)...
start "" "msedge.exe" --kiosk "https://app.socialmedium.space/kiosk-display" --window-position=1920,0 --window-size=1920,1080 --user-data-dir="C:\SocialMediumKiosk\Profiles\Display" --no-first-run --no-default-browser-check --disable-features=Translate,PrivacySandboxSettings4

echo Dual-Monitor Kiosk started successfully!
exit
