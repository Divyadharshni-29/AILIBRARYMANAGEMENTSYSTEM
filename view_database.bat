@echo off
title AI College Library - Database Store Viewer
cd /d "%~dp0"
set PYTHONPATH=.
.\venv\Scripts\python.exe view_database.py
pause
