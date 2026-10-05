@echo off
chcp 65001 >nul
title RMUTL Package System - Stop Services
color 0C

echo ==============================================================================
echo     🛑 Stopping RMUTL Package System Services (Ports 5000, 5173, 5174) 🛑
echo ==============================================================================
echo.

for %%P in (5000 5173 5174) do (
    echo Checking port %%P...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%%P" ^| findstr "LISTENING"') do (
        echo Killing process PID %%a on port %%P...
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo.
echo All services on ports 5000, 5173, and 5174 have been stopped.
echo ==============================================================================
pause
