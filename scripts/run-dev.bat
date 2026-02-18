@echo off
REM Author: Viorel LUPU
REM Date: 2026-02-17
REM Purpose: Run Tauri dev with refreshed PATH so Cursor terminal finds cargo

cd /d "%~dp0\.."
call :RefreshPath
npm run tauri dev
goto :eof

:RefreshPath
for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SysPath=%%b"
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "UserPath=%%b"
set "Path=%UserPath%;%SysPath%"
goto :eof
