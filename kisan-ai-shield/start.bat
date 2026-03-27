@echo off
title Kisan AI Shield - Unified Server Launcher
echo ==================================================
echo         🌾 KISAN AI SHIELD LAUNCHER 🌾
echo ==================================================
echo.
echo [1/3] Checking .env configuration...
if not exist ".env" (
    echo [WARNING] No .env file found! AI features may not work.
    echo Please ensure your OPENROUTER_API_KEY is placed in a .env file.
    pause
) else (
    echo [OK] .env file found.
)

echo.
echo [2/3] Activating AI Backend Server (Flask)...
:: Start the Flask backend in a new command window
start "Kisan AI Backend" cmd /k "call ai_env\Scripts\activate.bat && cd ai-backend && python app.py"

echo.
echo [3/3] Activating Frontend (Expo)...
:: Start the Expo frontend in the current window
call npx expo start

echo.
echo Servers are up and running!
echo Close this window to stop the frontend. Close the secondary window to stop the AI backend.
