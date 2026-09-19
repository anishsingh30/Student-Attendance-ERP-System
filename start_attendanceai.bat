@echo off
setlocal enabledelayedexpansion

title AttendanceAI Launcher

set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"
set "PYTHON_EXE=%BACKEND_DIR%\venv\Scripts\python.exe"

echo ================================================================
echo           ATTENDANCEAI - AUTOMATED DEVELOPMENT LAUNCHER
echo ================================================================
echo.
echo [1/3] Verifying environment paths...
echo  - Project Root: %PROJECT_ROOT%
echo  - Backend Dir:  %BACKEND_DIR%
echo  - Frontend Dir: %FRONTEND_DIR%

if not exist "%PYTHON_EXE%" (
    echo [ERROR] Virtual environment Python not found at:
    echo         "%PYTHON_EXE%"
    echo Please ensure the backend virtual environment is created.
    pause
    exit /b 1
)

if not exist "%BACKEND_DIR%\app\main.py" (
    echo [ERROR] Backend application file app\main.py not found in %BACKEND_DIR%
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
    echo [ERROR] Frontend package.json not found in %FRONTEND_DIR%
    pause
    exit /b 1
)

echo [OK] All environment paths verified.
echo.
echo [2/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "AttendanceAI - Backend (Port 8000)" /D "%BACKEND_DIR%" cmd /c ""%PYTHON_EXE%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [3/3] Starting React/Vite Frontend on http://127.0.0.1:5173 ...
start "AttendanceAI - Frontend (Port 5173)" /D "%FRONTEND_DIR%" cmd /c "npm.cmd run dev -- --host 127.0.0.1 --port 5173"

echo.
echo ================================================================
echo           ATTENDANCEAI SERVICES INITIALIZED SUCCESSFULLY
echo ================================================================
echo  - Frontend Portal:  http://127.0.0.1:5173
echo  - Backend API:      http://127.0.0.1:8000
echo  - API Docs:         http://127.0.0.1:8000/docs
echo.
echo  * Backend and Frontend are running in separate dedicated windows.
echo  * To stop all services cleanly, run: stop_attendanceai.bat
echo ================================================================
echo.
