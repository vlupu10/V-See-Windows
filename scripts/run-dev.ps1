# Author: Viorel LUPU
# Date: 2026-02-17
# Purpose: Run Tauri dev with refreshed PATH so Cursor terminal finds cargo/rustc

# Refresh PATH from Machine + User (picks up Rust added by rustup)
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

Set-Location $PSScriptRoot\..

if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "cargo not found. Install Rust from https://rustup.rs/ then open a new terminal." -ForegroundColor Red
    exit 1
}

npm run tauri dev
