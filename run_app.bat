@echo off
title AI Library Management System
echo ===================================================
echo   Starting AI Library Management System...
echo ===================================================

set PATH=C:\Program Files\nodejs;%PATH%

echo [1/2] Starting FastAPI Backend on port 8000...
start "Backend Server (FastAPI)" cmd /k ".\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React Vite Frontend on port 5173...
start "Frontend Server (Vite)" cmd /k "cd frontend && npm.cmd run dev"

timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ===================================================
echo   Application is running!
echo   Frontend Website: http://127.0.0.1:5173
echo   Backend API Docs: http://127.0.0.1:8000/docs
echo ===================================================
echo.
pause
