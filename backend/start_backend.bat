@echo off
cd /d "%~dp0"
python -m uvicorn app.main:app --host 0.0.0.0 --port 9000 --reload
pause 