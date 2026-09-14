@echo off
setlocal
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat" -arch=x64
if errorlevel 1 exit /b %errorlevel%
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"
cd /d "%~dp0..\.."

if not defined TAURI_SIGNING_PRIVATE_KEY (
  if exist "%USERPROFILE%\.tauri\howlong.key" set "TAURI_SIGNING_PRIVATE_KEY=%USERPROFILE%\.tauri\howlong.key"
)
if not defined TAURI_SIGNING_PRIVATE_KEY (
  echo Error: Tauri signing key not found at "%USERPROFILE%\.tauri\howlong.key".
  echo Set TAURI_SIGNING_PRIVATE_KEY to a key path or key contents, then rerun this script.
  exit /b 1
)
if not defined TAURI_SIGNING_PRIVATE_KEY_PASSWORD (
  echo Error: TAURI_SIGNING_PRIVATE_KEY_PASSWORD must contain the non-empty key passphrase.
  exit /b 1
)

call npm.cmd run tauri build -- --config src-tauri/tauri.release.conf.json
exit /b %errorlevel%
