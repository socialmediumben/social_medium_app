# =====================================================================
# Social Medium Dual-Monitor Kiosk Setup Script
# Installs automatic dual-monitor kiosk launcher to Windows Startup
# =====================================================================

Write-Host "Setting up Social Medium Dual-Monitor Kiosk..." -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceBat = Join-Path $scriptDir "launch-dual-kiosk.bat"

if (-not (Test-Path $sourceBat)) {
    Write-Host "Error: Could not find launch-dual-kiosk.bat in $scriptDir" -ForegroundColor Red
    Exit 1
}

# 1. Create target directories
$targetDir = "C:\SocialMediumKiosk"
$targetBat = "$targetDir\launch-dual-kiosk.bat"
New-Item -ItemType Directory -Force -Path "$targetDir\Profiles\Touchscreen" | Out-Null
New-Item -ItemType Directory -Force -Path "$targetDir\Profiles\Display" | Out-Null

Copy-Item -Path $sourceBat -Destination $targetBat -Force
Write-Host "Copied launcher script to $targetBat" -ForegroundColor Green

# 2. Place shortcut into current user's Startup folder
$startupFolder = [Environment]::GetFolderPath('Startup')
$shortcutPath = "$startupFolder\SocialMediumDualKiosk.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $targetBat
$Shortcut.WorkingDirectory = $targetDir
$Shortcut.WindowStyle = 7 # Minimized
$Shortcut.Description = "Launches Social Medium Dual-Monitor Kiosk on boot"
$Shortcut.Save()

Write-Host "Startup shortcut created at: $shortcutPath" -ForegroundColor Green
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host " Setup Complete! Windows will now automatically launch:" -ForegroundColor Yellow
Write-Host "   Monitor 1: Check-In Kiosk (Touchscreen)" -ForegroundColor Yellow
Write-Host "   Monitor 2: Ambient Google Photos Display (HDMI)" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "To test now, double-click: $targetBat" -ForegroundColor Cyan
