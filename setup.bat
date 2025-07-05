@echo off
echo ========================================
echo OpenWeb Download Manager Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Installing dependencies...
cd /d "%~dp0"
call npm install

if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Building Windows executable...
call npm run build-win

if %errorlevel% neq 0 (
    echo Error: Failed to build executable!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completed successfully!
echo.
echo The installer can be found in the 'dist' folder.
echo.
echo To run the app in development mode: npm start
echo To build the installer again: npm run build-win
echo ========================================
pause
