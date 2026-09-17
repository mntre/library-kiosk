@echo off
title Library Kiosk System
echo ========================================
echo   Library Clock In/Out Kiosk System
echo ========================================
echo.
echo Starting kiosk system...
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Building application...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo Starting server on http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run server
