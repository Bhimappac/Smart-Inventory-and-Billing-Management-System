@echo off
title Smart Inventory & Billing Management Launcher
echo ==========================================================
echo   Smart Inventory & Billing Management System Launcher
echo ==========================================================
echo.
echo [1/2] Launching Backend Dev Server (Port 5000)...
start "SmartBill Backend Console" cmd /k "cd backend && npm run dev"
 
echo [2/2] Launching Frontend Dev Server (Port 5173)...
start "SmartBill Frontend Console" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================================
echo   Done! Both servers are starting in separate consoles.
echo   - Backend API:  http://localhost:5000/api/status
echo   - Frontend App: http://localhost:5173
echo.
echo   Press any key to close this launcher shell...
echo ==========================================================
pause > null
del null
