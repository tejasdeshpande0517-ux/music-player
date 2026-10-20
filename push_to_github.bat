@echo off
title Push Aura Melody to GitHub
cd /d "%~dp0"
echo ==============================================================
echo   Push Aura Melody Music Player to GitHub
echo ==============================================================
echo.
set /p REPO_URL="Enter your GitHub repository URL (e.g. https://github.com/tejasdeshpande0517-ux/music-player.git): "

if "%REPO_URL%"=="" (
    echo No URL entered. Exiting.
    pause
    exit /b
)

echo.
echo Setting remote origin to: %REPO_URL%
"C:\Users\HP\AppData\Local\Programs\Git\cmd\git.exe" remote remove origin 2>nul
"C:\Users\HP\AppData\Local\Programs\Git\cmd\git.exe" remote add origin %REPO_URL%
"C:\Users\HP\AppData\Local\Programs\Git\cmd\git.exe" branch -M main

echo Pushing to GitHub main branch...
"C:\Users\HP\AppData\Local\Programs\Git\cmd\git.exe" push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo ==============================================================
    echo  SUCCESS: Code pushed to GitHub successfully!
    echo ==============================================================
) else (
    echo ==============================================================
    echo  Push encountered an issue. Please verify permissions or token.
    echo ==============================================================
)
pause
