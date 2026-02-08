@echo off
title Lanka POS System
color 0A
echo ========================================
echo    Lanka POS - Point of Sale System
echo ========================================
echo.
echo Starting backend server...
start /B cmd /c "npm start > backend.log 2>&1"
timeout /t 3 /nobreak > nul

echo Starting frontend...
cd client
start /B cmd /c "npm run preview > ../frontend.log 2>&1"
cd ..
timeout /t 3 /nobreak > nul

echo Opening application...
timeout /t 2 /nobreak > nul
start http://localhost:4173

echo.
echo ========================================
echo   Lanka POS is now running!
echo ========================================
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:4173
echo ========================================
echo.
echo Press any key to STOP the system...
pause > nul

echo.
echo Shutting down...
taskkill /F /IM node.exe > nul 2>&1
echo System stopped.
timeout /t 2 /nobreak > nul
