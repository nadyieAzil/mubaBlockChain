@echo off
echo ========================================================
echo Starting SuiPact (Frontend + Gas Relayer Backend)
echo ========================================================

echo [1/2] Starting Gas Relayer Backend on port 3001...
start "SuiPact Backend" cmd /k "cd backend && npm start"

echo [2/2] Starting Next.js Frontend on port 3000...
start "SuiPact Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo [3/3] Opening browser at http://localhost:3000 ...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo ========================================================
echo SuiPact is launching!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo ========================================================
pause
