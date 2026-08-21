@echo off
title AI College Library - FastAPI Backend (LAN: 0.0.0.0:8000)
cd /d "%~dp0"
set PYTHONPATH=.
echo Starting FastAPI Backend on 0.0.0.0:8000...
.\venv\Scripts\python.exe run_server.py
pause
