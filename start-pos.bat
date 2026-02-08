@echo off
title Lanka POS Server
title 0705083388
color 0B

echo Starting backend server...
start "Lanka POS Backend" /B cmd /c "npm start"

echo Starting frontend server...
start "Lanka POS Frontend" /B cmd /c "cd /d client && npm run preview"

timeout /t 5 /nobreak > nul
start "" "http://localhost:4173/login"
