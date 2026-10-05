@echo off
chcp 65001 >nul
title RMUTL Smart Dormitory Package System - Dev Launcher
color 0B

echo ==============================================================================
echo     📦 RMUTL Smart Dormitory Package Notification & Tracking System 📦
echo ==============================================================================
echo.
echo [1/3] Starting Backend API Server (Port 5000)...
start "RMUTL - 1. Backend Server (Port 5000)" cmd /k "title RMUTL Backend API [5000] && cd /d "%~dp0backend" && npm start"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Staff Portal (Port 5174)...
start "RMUTL - 2. Staff Portal (Port 5174)" cmd /k "title RMUTL Staff Portal [5174] && cd /d "%~dp0frontend\staff" && npm run dev"

timeout /t 1 /nobreak >nul

echo [3/3] Starting Student Portal (Port 5173)...
start "RMUTL - 3. Student Portal (Port 5173)" cmd /k "title RMUTL Student Portal [5173] && cd /d "%~dp0frontend\student" && npm run dev"

echo.
echo ==============================================================================
echo   All services have been launched in separate terminal windows!
echo.
echo   🔗 Backend API:      http://localhost:5000
echo   🔗 Staff Portal:     http://localhost:5174
echo   🔗 Student Portal:   http://localhost:5173
echo   📄 API Contract:     ./Documents/API_CONTRACT.md
echo ==============================================================================
echo.

set /p OPEN_BROWSER="Do you want to open both web portals in your browser? (Y/N, default Y): "
if /i "%OPEN_BROWSER%"=="N" goto finish

echo Opening web browsers...
start http://localhost:5174
start http://localhost:5173

:finish
echo.
echo Setup complete. You can close this launcher window anytime.
pause
