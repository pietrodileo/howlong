@echo off
REM Convenience launcher (cmd): avoids PowerShell npm.ps1; ensures cargo on PATH
cd /d "%~dp0.."
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"
call npm.cmd run tauri:dev
