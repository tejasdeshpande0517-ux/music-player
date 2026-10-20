@echo off
title Aura Melody Web Server
cd /d "%~dp0"
echo Starting Aura Melody Local Server on http://localhost:8080 ...
start http://localhost:8080
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1" -Port 8080
pause
