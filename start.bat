@echo off
REM Quick Start Script for Visa Evaluation Tool (Windows)
REM This script sets up and runs both backend and frontend

echo.
echo ======================================
echo   Visa Evaluation Tool - Quick Start
echo ======================================
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js 18 or higher from https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js found
node --version
echo.

REM Backend setup
echo ======================================
echo   Setting up Backend...
echo ======================================
cd backend

if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
)

if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo.
    echo [INFO] Please edit backend\.env with your configuration
    echo       - MONGODB_URI: Your MongoDB connection string
    echo       - GEMINI_API_KEY: Your Gemini API key
    echo.
)

REM Frontend setup
echo.
echo ======================================
echo   Setting up Frontend...
echo ======================================
cd ..\frontend

if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
)

REM Start servers
echo.
echo ======================================
echo   Starting Servers...
echo ======================================
echo.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:5173
echo.
echo Press Ctrl+C to stop the servers
echo.

REM Start backend in new window
cd ..\backend
start "Backend Server" cmd /c "npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
cd ..\frontend
start "Frontend Server" cmd /c "npm run dev"

echo.
echo ======================================
echo   Servers Started!
echo ======================================
echo.
echo [OK] Backend running on http://localhost:4000
echo [OK] Frontend running on http://localhost:5173
echo.
echo Open your browser and go to:
echo http://localhost:5173
echo.
echo To stop servers, close the terminal windows
echo.
pause
