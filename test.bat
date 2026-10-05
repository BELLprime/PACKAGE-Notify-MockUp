@echo off
chcp 65001 >nul
title RMUTL Package System - Automated Integration Tests
color 0A

echo ==============================================================================
echo     🧪 Running Automated Integration Tests (Task 16.3) 🧪
echo ==============================================================================
echo.

cd /d "%~dp0"
call npm test

echo.
echo ==============================================================================
pause
