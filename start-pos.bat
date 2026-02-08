@echo off
title Lanka POS System (Development Mode)
color 0B
echo ========================================
echo    Lanka POS - Point of Sale System
echo    [ DEVELOPMENT MODE ]
echo ========================================
echo.

echo Starting backend server (dev)...
start "Lanka POS Backend" /B cmd /c "npm run dev > backend.log 2>&1"
timeout /t 5 /nobreak > nul

echo Starting frontend (dev)...
cd client
start "Lanka POS Frontend" /B cmd /c "npm run dev > ../frontend.log 2>&1"
cd ..
timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo   Lanka POS is now running!
echo ========================================
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo   * Note: The frontend port has changed to 5173 in dev mode.
echo   * Logs are being written to backend.log and frontend.log
echo.
echo Press any key to STOP the system...
pause > nul

echo.
echo Shutting down...
taskkill /F /IM node.exe > nul 2>&1
echo System stopped.
timeout /t 2 /nobreak > nul
