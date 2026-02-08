@echo off
title Lanka POS System 
color 0B
echo ========================================
echo    Lanka POS - Point of Sale System
echo    Call: 0705083388
echo ========================================
echo.

echo Building backend...
call npm run build
if errorlevel 1 goto build_error

echo Seeding database (super admin)...
call npm run seed
if errorlevel 1 goto build_error

echo Building frontend...
pushd client
call npm run build
if errorlevel 1 goto build_error
popd

echo Starting backend server (production)...
start "Lanka POS Backend" /B cmd /c "npm start > backend.log 2>&1"
timeout /t 5 /nobreak > nul

echo Starting frontend (preview)...
start "Lanka POS Frontend" /B cmd /c "cd /d client && npm run preview > ..\frontend.log 2>&1"
timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo   Lanka POS is now running!
echo ========================================
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:4173
echo ========================================
echo.
echo   * Note: The frontend preview port is 4173 in final mode.
echo   * Logs are being written to backend.log and frontend.log
echo.
echo Press any key to STOP the system...
pause > nul

echo.
echo Shutting down...
taskkill /F /IM node.exe > nul 2>&1
echo System stopped.
timeout /t 2 /nobreak > nul

exit /b 0

:build_error
echo.
echo Build failed. Check the output above for errors.
pause > nul
exit /b 1
