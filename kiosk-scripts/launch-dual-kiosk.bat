@echo off
title Social Medium Dual-Monitor Kiosk Launcher (Google Chrome)
echo ========================================================
echo   SOCIAL MEDIUM DUAL-MONITOR KIOSK LAUNCHER
echo   Browser: Google Chrome
echo   Screen 1: Touchscreen Check-In (0, 0)
echo   Screen 2: Ambient Google Photos Slideshow (1920, 0)
echo ========================================================

:: Give Windows network and display drivers 2 seconds to settle
timeout /t 2 /nobreak >nul

:: Detect Google Chrome Executable Path
set "CHROME_BIN="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_BIN=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_BIN=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_BIN=%LocalAppData%\Google\Chrome\Application\chrome.exe"
) else (
    set "CHROME_BIN=chrome.exe"
)

:: Terminate any lingering background browser kiosk instances
taskkill /F /IM chrome.exe /T >nul 2>&1
taskkill /F /IM msedge.exe /T >nul 2>&1
timeout /t 1 /nobreak >nul

:: Create dedicated profile directories to prevent Chrome profile collision
if not exist "C:\SocialMediumKiosk\Profiles\Touchscreen" mkdir "C:\SocialMediumKiosk\Profiles\Touchscreen"
if not exist "C:\SocialMediumKiosk\Profiles\Display" mkdir "C:\SocialMediumKiosk\Profiles\Display"

:: 1. Launch Monitor 1: Touchscreen Check-In Kiosk (Position 0, 0) in Chrome
echo Launching Screen 1 (Touchscreen Check-In Kiosk in Google Chrome)...
start "" "%CHROME_BIN%" --kiosk "https://neon-kiosk.onrender.com" --window-position=0,0 --window-size=1920,1080 --user-data-dir="C:\SocialMediumKiosk\Profiles\Touchscreen" --no-first-run --no-default-browser-check --disable-pinch --overscroll-history-navigation=0 --disable-features=Translate,PrivacySandboxSettings4

:: Wait 2 seconds before launching second monitor
timeout /t 2 /nobreak >nul

:: 2. Launch Monitor 2: HDMI Ambient Google Photos Display (Position 1920, 0) in Chrome
echo Launching Screen 2 (Ambient Google Photos Slideshow in Google Chrome)...
start "" "%CHROME_BIN%" --kiosk "https://app.socialmedium.space/kiosk-display" --window-position=1920,0 --window-size=1920,1080 --user-data-dir="C:\SocialMediumKiosk\Profiles\Display" --no-first-run --no-default-browser-check --disable-features=Translate,PrivacySandboxSettings4

echo Dual-Monitor Kiosk started successfully in Google Chrome!
exit
