@echo off
setlocal
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat" -arch=x64
if errorlevel 1 exit /b %errorlevel%
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"
cd /d "%~dp0..\.."

call npm.cmd run tauri build -- --config src-tauri/tauri.prerelease.conf.json
exit /b %errorlevel%
