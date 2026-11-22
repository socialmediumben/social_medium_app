# =====================================================================
# Social Medium Dual-Monitor Kiosk Setup Script
# Installs automatic dual-monitor kiosk launcher to Windows Startup
# =====================================================================

Write-Host "Setting up Social Medium Dual-Monitor Kiosk..." -ForegroundColor Cyan

# 1. Create target directories
$targetDir = "C:\SocialMediumKiosk"
$targetBat = "$targetDir\launch-dual-kiosk.bat"
New-Item -ItemType Directory -Force -Path "$targetDir\Profiles\Touchscreen" | Out-Null
New-Item -ItemType Directory -Force -Path "$targetDir\Profiles\Display" | Out-Null

# 2. Get launcher script (either from local folder or download from cloud)
$scriptDir = if ($MyInvocation.MyCommand.Path) { Split-Path -Parent $MyInvocation.MyCommand.Path } else { "" }
$sourceBat = if ($scriptDir) { Join-Path $scriptDir "launch-dual-kiosk.bat" } else { "" }

if ($sourceBat -and (Test-Path $sourceBat)) {
    Copy-Item -Path $sourceBat -Destination $targetBat -Force
    Write-Host "Installed local launcher script to $targetBat" -ForegroundColor Green
} else {
    Write-Host "Downloading latest launcher from Social Medium Cloud..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri "https://app.socialmedium.space/kiosk-scripts/launch-dual-kiosk.bat" -OutFile $targetBat -UseBasicParsing
    Write-Host "Downloaded latest launcher to $targetBat" -ForegroundColor Green
}

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
